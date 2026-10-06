// Sinkronisasi data game dari api-v2.encore.moe -> src/lib/data/game/*.json
// Jalankan: bun scripts/sync-encore.ts [--no-cache]
import { applyWeaponI18nFromFile, applySkillI18nFromFiles } from './apply-weapon-i18n';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
	basisPointsToFraction,
	deriveUnit,
	fillParams,
	kebab,
	hasPlaceholder,
	renderedSonataText,
	parseNumber,
	parseWeaponEffects,
	renderRefinement,
	secondaryName,
	stripRichText,
	cleanGameTags
} from './encore-helpers';
import type {
	CharacterSkills,
	Element,
	GameCharacter,
	GameMonster,
	GameSkill,
	GameWeapon,
	Localized,
	MonsterClass,
	Resistances,
	Sequence,
	SkillHit,
	SonataSet,
	SyncMeta,
	WeaponType
} from '../src/lib/data/game/types';

const BASE = 'https://api-v2.encore.moe/api';
const root = resolve(import.meta.dirname, '..');
const cacheDir = resolve(root, '.cache/encore');
const outDir = resolve(root, 'src/lib/data/game');
const NO_CACHE = process.argv.includes('--no-cache');
const CONCURRENCY = 4;
const TIMEOUT_MS = 30_000;
const RETRIES = 3;
const MV_LEVELS = 10;

// ---------- fetch sopan: batas konkurensi, retry, timeout, cache ----------

let active = 0;
const waiters: Array<() => void> = [];
async function acquire() {
	if (active >= CONCURRENCY) await new Promise<void>((r) => waiters.push(r));
	active++;
}
function release() {
	active--;
	waiters.shift()?.();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let networkCalls = 0;
let cacheHits = 0;

/** Ambil JSON; `null` bila 404. Gagal keras setelah retry habis. */
async function api<T = any>(lang: string, path: string): Promise<T | null> {
	const cacheFile = resolve(cacheDir, lang, `${path.replace(/\//g, '_')}.json`);
	if (!NO_CACHE && existsSync(cacheFile)) {
		cacheHits++;
		return JSON.parse(await readFile(cacheFile, 'utf8')) as T | null;
	}
	const url = `${BASE}/${lang}/${path}`;
	await acquire();
	try {
		let lastErr: unknown;
		for (let attempt = 0; attempt <= RETRIES; attempt++) {
			try {
				networkCalls++;
				const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
				if (res.status === 404) return null;
				if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
				if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true });
				const text = await res.text();
				const data = JSON.parse(text) as T;
				await mkdir(dirname(cacheFile), { recursive: true });
				await writeFile(cacheFile, text);
				return data;
			} catch (e) {
				lastErr = e;
				if ((e as { fatal?: boolean }).fatal || attempt === RETRIES) break;
				await sleep(500 * 2 ** attempt);
			}
		}
		throw new Error(`Gagal mengambil ${url}: ${(lastErr as Error)?.message}`);
	} finally {
		release();
	}
}

async function mapPool<T, R>(items: T[], fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
	return Promise.all(items.map((item, i) => fn(item, i)));
}

// ---------- util ----------

function fail(msg: string): never {
	console.error(`GAGAL: ${msg}`);
	process.exit(1);
}
function need<T>(v: T | null | undefined, what: string): T {
	if (v === null || v === undefined || (typeof v === 'string' && v === '')) fail(`field wajib kosong: ${what}`);
	return v;
}
function nonEmpty<T>(arr: T[] | undefined, what: string): T[] {
	if (!Array.isArray(arr) || arr.length === 0) fail(`endpoint ${what} mengembalikan 0 item`);
	return arr;
}

const ELEMENTS: Element[] = ['glacio', 'fusion', 'electro', 'aero', 'spectro', 'havoc'];
const WEAPON_TYPES: WeaponType[] = ['Broadblade', 'Sword', 'Pistols', 'Gauntlets', 'Rectifier'];
const elementOf = (name: string): Element => {
	const e = name.toLowerCase() as Element;
	if (!ELEMENTS.includes(e)) fail(`elemen tak dikenal: ${name}`);
	return e;
};
const text = (s: unknown) => (typeof s === 'string' ? stripRichText(s) : '');
/** Gabungkan teks en + id; id kosong -> salinan en. */
/** Teks skill/sequence: buang rich-text lalu tag template game ({Cus:Sap..}, {Cus:Ipt..}). */
const skillText = (s: unknown) => cleanGameTags(text(s));
const loc = (en: string, id: string | undefined | null): Localized => ({ en, id: id ? id : en });

async function writeJson(rel: string, data: unknown) {
	const file = resolve(outDir, rel);
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, JSON.stringify(data) + '\n');
}

// ---------- karakter ----------

async function syncCharacters(): Promise<{ chars: GameCharacter[]; idOk: boolean; skillFiles: number }> {
	const list = await api('en', 'character');
	const roles = nonEmpty(list?.roleList, 'character');

	const byKey = new Map<string, GameCharacter>();
	for (const r of roles.sort((a: any, b: any) => a.Id - b.Id)) {
		const name = need<string>(r.Name, 'character.Name');
		const element = elementOf(need<string>(r.Element?.Name, `character ${r.Id} Element`));
		const weaponType = need<WeaponType>(r.WeaponType?.Name, `character ${r.Id} WeaponType`);
		if (!WEAPON_TYPES.includes(weaponType)) fail(`weaponType tak dikenal: ${weaponType}`);
		const rarity = need<number>(r.QualityId, `character ${r.Id} QualityId`);
		if (rarity !== 4 && rarity !== 5) fail(`rarity tak dikenal: ${rarity} (${name})`);
		const key = `${name}|${element}`;
		const existing = byKey.get(key);
		if (existing) {
			existing.ids.push(r.Id);
			continue;
		}
		byKey.set(key, {
			id: r.Id,
			ids: [r.Id],
			slug: kebab(name),
			name,
			element,
			rarity,
			weaponType,
			icon: need<string>(r.RoleHeadIcon, `character ${r.Id} RoleHeadIcon`)
		});
	}
	const chars = [...byKey.values()].sort((a, b) => a.slug.localeCompare(b.slug));
	const slugs = new Set<string>();
	for (const c of chars) {
		if (slugs.has(c.slug)) fail(`slug ganda: ${c.slug}`);
		slugs.add(c.slug);
	}

	// Probe: apakah /api/id/ benar-benar memuat teks skill terjemahan?
	const probe = await api('id', `character/${chars[0].id}`);
	const idOk = !!probe?.Skills?.some((s: any) => typeof s.SkillDescribe === 'string' && s.SkillDescribe.length > 0);
	if (!idOk) console.warn('PERINGATAN: /api/id/character tidak berisi teks terjemahan; id diisi salinan en.');

	await rm(resolve(outDir, 'skills'), { recursive: true, force: true });
	let warnPlaceholder = 0;
	await mapPool(chars, async (c) => {
		const en = need<any>(await api('en', `character/${c.id}`), `character/${c.id}`);
		// Stat dasar Lv90 (tanpa senjata/echo)
		const base90 = (name: string) => {
			const p = (en.Properties ?? []).find((x: any) => x.Name === name);
			const v = p?.GrowthValues?.find((g: any) => g.level === 90 || g.Level === 90)?.value;
			if (typeof v !== 'number') fail(`character/${c.id} (${c.name}) tanpa ${name} Lv90`);
			return Math.round(v * 100) / 100;
		};
		c.base = { atk: base90('ATK'), hp: base90('HP'), def: base90('DEF') };
		const id = idOk ? await api('id', `character/${c.id}`) : null;
		const skills = nonEmpty(en.Skills, `character/${c.id} Skills`);
		const out: GameSkill[] = skills.map((s: any, i: number) => {
			const idSkill = id?.Skills?.[i];
			const attributes = (s.SkillAttributes ?? []).map((a: any) => {
				const values: string[] = (a.values ?? []).slice(0, MV_LEVELS).map(String);
				return {
					name: String(a.attributeName ?? ''),
					values,
					unit: deriveUnit(values, String(a.Description ?? ''))
				};
			});
			const hits: SkillHit[] = [];
			for (const d of s.DamageList ?? []) {
				const mv = (d.RateLv ?? []).slice(0, MV_LEVELS).map((v: string) => parseNumber(v));
				// Lewati hit tanpa MV numerik (mis. entri murni energi/ketangguhan)
				if (mv.length === 0 || mv.some((v: number | null) => v === null)) continue;
				const hit: SkillHit = {
					id: d.Id,
					damageType: String(d.Type ?? ''),
					kind: String(d.DmgType ?? ''),
					scaling: String(d.PropertyName ?? ''),
					mv: mv as number[]
				};
				if (d.Condition) hit.condition = text(d.Condition);
				hits.push(hit);
			}
			const desc = skillText(s.SkillDescribe);
			if (/\{\d+\}/.test(desc)) warnPlaceholder++;
			return {
				name: String(s.SkillName || s.SkillType),
				type: need<string>(s.SkillType, `character/${c.id} SkillType`),
				description: loc(desc, idSkill ? skillText(idSkill.SkillDescribe) : ''),
				attributes,
				hits
			};
		});

		const chain: any[] = [...(en.ResonantChain ?? [])].sort((a, b) => a.GroupIndex - b.GroupIndex);
		const sequences: Sequence[] = chain.map((n, i) => {
			const idNode = id?.ResonantChain?.find((x: any) => x.Id === n.Id);
			const params: string[] = n.AttributesDescriptionParams ?? [];
			return {
				index: n.GroupIndex ?? i + 1,
				name: need<string>(n.NodeName, `character/${c.id} NodeName`),
				description: loc(
					skillText(fillParams(n.AttributesDescription ?? '', params)),
					idNode && !/_NodeName|_AttributesDescription/.test(idNode.AttributesDescription ?? '_AttributesDescription')
						? skillText(fillParams(idNode.AttributesDescription ?? '', params))
						: ''
				)
			};
		});
		if (sequences.length !== 6) console.warn(`PERINGATAN: ${c.slug} punya ${sequences.length} sequence (bukan 6)`);

		const file: CharacterSkills = { slug: c.slug, skills: out, sequences };
		await writeJson(`skills/${c.slug}.json`, file);
	});
	if (warnPlaceholder) console.warn(`PERINGATAN: ${warnPlaceholder} deskripsi skill masih memuat placeholder {n}`);
	return { chars, idOk, skillFiles: chars.length };
}

// ---------- senjata ----------

async function syncWeapons(): Promise<{ weapons: GameWeapon[]; idOk: boolean }> {
	const list = await api('en', 'weapon');
	const items = nonEmpty(list?.weapons, 'weapon');
	const probe = await api('id', `weapon/${items[0].Id}`);
	const idOk = typeof probe?.Desc === 'string' && probe.Desc.length > 0;
	if (!idOk) console.warn('PERINGATAN: /api/id/weapon tidak berisi teks terjemahan; id diisi salinan en.');

	const weapons = await mapPool(items as any[], async (w): Promise<GameWeapon> => {
		const d = need<any>(await api('en', `weapon/${w.Id}`), `weapon/${w.Id}`);
		const di = idOk ? await api('id', `weapon/${w.Id}`) : null;
		const type = need<WeaponType>(w.TypeName, `weapon ${w.Id} TypeName`);
		if (!WEAPON_TYPES.includes(type)) fail(`tipe senjata tak dikenal: ${type}`);
		const [p1, p2] = d.Properties ?? [];
		const at90 = (p: any) => p?.GrowthValues?.find((g: any) => g.Level === 90)?.Value;
		const atk90 = parseNumber(at90(p1));
		const sec90 = parseNumber(at90(p2));
		if (atk90 === null || sec90 === null) fail(`weapon/${w.Id} (${w.Name}) tanpa nilai level 90`);
		const params = d.DescParams ?? [];
		const idParams = di?.DescParams ?? params;
		const r = (n: number) =>
			loc(renderRefinement(String(d.Desc ?? ''), params, n), di ? renderRefinement(String(di.Desc ?? ''), idParams, n) : '');
		return {
			id: w.Id,
			name: need<string>(w.Name, `weapon ${w.Id} Name`),
			type,
			rarity: need<GameWeapon['rarity']>(w.QualityId, `weapon ${w.Id} QualityId`),
			icon: need<string>(w.Icon, `weapon ${w.Id} Icon`),
			atk90,
			secondary: { name: secondaryName(String(p2?.Name ?? ''), !!d.SecondPropId?.IsRatio), value90: sec90 },
			passive: {
					name: String(d.ResonName ?? ''),
					r1: r(1),
					r2: r(2),
					r3: r(3),
					r4: r(4),
					r5: r(5),
					effects: parseWeaponEffects(String(d.Desc ?? ''), params)
				}
		};
	});
	weapons.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
	for (const w of weapons) if (/\{\d+\}/.test(w.passive.r1.en)) console.warn(`PERINGATAN: placeholder tersisa di ${w.name}`);
	return { weapons, idOk };
}

// ---------- sonata ----------

async function syncSonata(): Promise<{ sets: SonataSet[]; echoCount: number; idOk: boolean }> {
	const list = await api('en', 'echo');
	const echoes = nonEmpty(list?.Echo, 'echo');
	// Probe id: endpoint id/echo tidak selalu berbentuk sama dengan en
	const idList = await api('id', 'echo');
	const idEcho: any[] = idList?.Echo ?? [];
	const idFetter = new Map<number, string>();
	for (const e of idEcho)
		for (const g of e.FetterGroups ?? []) for (const f of g.Fetters ?? []) if (f.EffectDescription) idFetter.set(f.Id, f.EffectDescription);
	const idOk = idFetter.size > 0;
	if (!idOk) console.warn('PERINGATAN: /api/id/echo tidak berisi teks terjemahan; id diisi salinan en.');

	const map = new Map<number, SonataSet>();
	for (const e of echoes) {
		for (const g of e.FetterGroups ?? []) {
			let set = map.get(g.Id);
			if (!set) {
				set = {
					id: g.Id,
					name: need<string>(g.Name, `sonata ${g.Id} Name`),
					icon: String(g.Icon ?? ''),
					bonuses: (g.Fetters ?? [])
						.map((f: any) => ({
							pieces: need<number>(f.Key, `sonata ${g.Id} Key`),
							text: loc(text(f.EffectDescription), idFetter.has(f.Id) ? text(idFetter.get(f.Id)) : '')
						}))
						.sort((a: any, b: any) => a.pieces - b.pieces),
					echoIds: []
				};
				if (set.bonuses.length === 0) fail(`sonata ${g.Id} tanpa bonus`);
				map.set(g.Id, set);
			}
			set.echoIds.push(e.Id);
		}
	}
	const sets = [...map.values()].sort((a, b) => a.id - b.id);
	for (const s of sets) s.echoIds = [...new Set(s.echoIds)].sort((a, b) => a - b);

	// Daftar echo hanya memuat template ({0}); detail satu echo anggota punya teks yang sudah dirender.
	await mapPool(sets, async (s) => {
		const d = need<any>(await api('en', `echo/${s.echoIds[0]}`), `echo/${s.echoIds[0]}`);
		for (const b of s.bonuses) {
			const t = renderedSonataText(d.FetterDetails, s.name, b.pieces);
			if (t) b.text = loc(text(t), null);
			if (hasPlaceholder(b.text.en)) fail(`sonata ${s.name} (${b.pieces}pc) masih memuat placeholder: ${b.text.en}`);
		}
	});
	return { sets, echoCount: echoes.length, idOk };
}

// ---------- monster ----------

const MONSTER_CLASS: Record<number, MonsterClass> = { 1: 'standard', 2: 'elite', 3: 'overlord', 4: 'calamity' };
const ELEMENT_BY_ID: Record<number, keyof Resistances> = {
	0: 'physical',
	1: 'glacio',
	2: 'fusion',
	3: 'electro',
	4: 'aero',
	5: 'spectro',
	6: 'havoc'
};

async function syncMonsters(): Promise<{ monsters: GameMonster[]; breakdown: Record<string, number> }> {
	const list = await api('en', 'monster');
	const items = nonEmpty(list?.monsterList, 'monster') as any[];
	const breakdown: Record<string, number> = {};
	for (const m of items) {
		const k = MONSTER_CLASS[m.RarityId] ?? `rarityId-${m.RarityId}`;
		breakdown[k] = (breakdown[k] ?? 0) + 1;
	}
	const bosses = items.filter((m) => m.RarityId >= 2);
	let skippedNoStats = 0;
	const parsed = await mapPool(bosses, async (m): Promise<GameMonster | null> => {
		const d = need<any>(await api('en', `monster/${m.Id}`), `monster/${m.Id}`);
		const p = d.Properties ?? {};
		// Sebagian monster (mis. varian Phantom) tidak punya data stat sama sekali -> dilewati
		if (Object.keys(p).length === 0) {
			skippedNoStats++;
			return null;
		}
		const bp = (key: string): number => {
			const v = p[key]?.Value;
			if (typeof v !== 'number') fail(`monster/${m.Id} (${m.Name}) tanpa ${key}`);
			return basisPointsToFraction(v);
		};
		const res: Resistances = {
			physical: bp('DamageResistancePhys'),
			glacio: bp('DamageResistanceElement1'),
			fusion: bp('DamageResistanceElement2'),
			electro: bp('DamageResistanceElement3'),
			aero: bp('DamageResistanceElement4'),
			spectro: bp('DamageResistanceElement5'),
			havoc: bp('DamageResistanceElement6')
		};
		return {
			id: m.Id,
			name: need<string>(m.Name, `monster ${m.Id} Name`),
			rarity: MONSTER_CLASS[m.RarityId],
			element: ELEMENT_BY_ID[m.Element?.Id] ?? 'physical',
			res
		};
	});
	const monsters = parsed.filter((m): m is GameMonster => m !== null);
	if (monsters.length === 0) fail('tidak ada monster dengan data resistansi');
	if (skippedNoStats) console.warn(`PERINGATAN: ${skippedNoStats} monster dilewati karena Properties kosong`);
	monsters.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
	return { monsters, breakdown };
}

// ---------- utama ----------

async function main() {
	console.log(`Sinkronisasi dari ${BASE} (cache: ${NO_CACHE ? 'dimatikan' : cacheDir})`);
	if (NO_CACHE) await rm(cacheDir, { recursive: true, force: true });
	await mkdir(outDir, { recursive: true });

	console.log('-> karakter');
	const { chars, idOk: charIdOk, skillFiles } = await syncCharacters();
	console.log('-> senjata');
	const { weapons, idOk: weaponIdOk } = await syncWeapons();
	console.log('-> sonata echo');
	const { sets, echoCount, idOk: echoIdOk } = await syncSonata();
	console.log('-> monster');
	const { monsters, breakdown } = await syncMonsters();

	await writeJson('characters.json', chars);
	await applyWeaponI18nFromFile(weapons);
	await writeJson('weapons.json', weapons);
	await writeJson('sonata-sets.json', sets);
	await writeJson('monsters.json', monsters);
	await applySkillI18nFromFiles();

	const counts = {
		characters: chars.length,
		characterIds: chars.reduce((n, c) => n + c.ids.length, 0),
		skillFiles,
		weapons: weapons.length,
		sonataSets: sets.length,
		echoes: echoCount,
		monstersTotal: Object.values(breakdown).reduce((a, b) => a + b, 0),
		monstersWithDetail: monsters.length,
		...Object.fromEntries(Object.entries(breakdown).map(([k, v]) => [`monsters_${k}`, v]))
	};
	const meta: SyncMeta = {
		fetchedAt: new Date().toISOString(),
		source: 'api-v2.encore.moe',
		idLocalized: { character: charIdOk, weapon: weaponIdOk, echo: echoIdOk },
		counts
	};
	await writeJson('meta.json', meta);

	// Cek slug terhadap data karakter yang sudah ada
	const existingFile = resolve(root, 'src/lib/data/characters.json');
	if (existsSync(existingFile)) {
		const existing: Array<{ slug: string }> = JSON.parse(await readFile(existingFile, 'utf8'));
		const have = new Set(chars.map((c) => c.slug));
		const missing = existing.filter((e) => !have.has(e.slug)).map((e) => e.slug);
		console.log(`Slug di characters.json lama yang tidak ada di data game: ${missing.length ? missing.join(', ') : '(tidak ada)'}`);
	}

	console.log('\nRingkasan:');
	for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
	console.log(`  request jaringan: ${networkCalls}, cache hit: ${cacheHits}`);
	console.log(`  teks id tersedia: karakter=${charIdOk} senjata=${weaponIdOk} echo=${echoIdOk}`);
}

main().catch((e) => fail(String(e?.stack ?? e)));
