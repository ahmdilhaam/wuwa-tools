// Fungsi murni untuk sinkronisasi data encore.moe (tanpa I/O supaya mudah diuji).
import type { WeaponEffect, WeaponEffectStat } from '../src/lib/data/game/types';


const ENTITIES: Record<string, string> = {
	'&nbsp;': ' ',
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'"
};

/** Buang tag rich-text game (`<te href=..>`, `<color=..>`, `<span>`, `<size=..>`), pertahankan teks dalam. `<br>` jadi baris baru. */
export function stripRichText(input: string): string {
	return input
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/?[a-zA-Z][^>]*>/g, '')
		.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m)
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/[ \t]{2,}/g, ' ')
		.trim();
}

/** "181%" / "53.50%" / "587.50" -> angka; format rumus ("53.50%*4") atau kosong -> null. */
export function parseNumber(input: string | number | null | undefined): number | null {
	if (typeof input === 'number') return Number.isFinite(input) ? input : null;
	if (typeof input !== 'string') return null;
	const m = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
	return m ? Number(m[1]) : null;
}

/** Alias semantik untuk MV: "181%" -> 181. */
export const parseMultiplier = parseNumber;

/** Basis poin -> pecahan (1000 = 10% = 0.1). Dibulatkan agar bebas noise floating point. */
export function basisPointsToFraction(bp: number): number {
	return Math.round(bp) / 10000;
}

/** Satuan atribut skill: '%' bila nilai berakhiran persen, kalau tidak pakai Description sumber (mis. "s"). */
export function deriveUnit(values: string[], description: string): string {
	if (values.some((v) => v.includes('%'))) return '%';
	return description.trim();
}

/** Nama kebab-case dari nama Inggris: "Rover: Spectro" -> "rover-spectro". */
export function kebab(name: string): string {
	return name
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export interface ParamArray {
	ArrayString?: string[];
}

/** Ganti placeholder `{0}`, `{1}`... dengan params[i] (string). Placeholder tanpa param dibiarkan. */
export function fillParams(template: string, params: string[]): string {
	return template.replace(/\{(\d+)\}/g, (m, i) => params[Number(i)] ?? m);
}

/**
 * Render deskripsi pasif senjata untuk refinement `rank` (1..5).
 * Mendukung dua bentuk: placeholder `{i}` atau teks sumber yang sudah memuat "a/b/c/d/e" (diganti nilai ke-rank).
 */
export function renderRefinement(desc: string, params: ParamArray[], rank: number): string {
	const idx = rank - 1;
	const pick = (arr: string[]) => arr[Math.min(idx, arr.length - 1)] ?? '';
	let out = desc;
	params.forEach((p, i) => {
		const arr = p.ArrayString ?? [];
		if (arr.length === 0) return;
		out = out.split(`{${i}}`).join(pick(arr));
		if (arr.length > 1) out = out.split(arr.join('/')).join(pick(arr));
	});
	return cleanSapTags(stripRichText(out));
}

/** Nama stat sekunder senjata: ATK/HP/DEF berbentuk rasio diberi akhiran '%'. */
export function secondaryName(name: string, isRatio: boolean): string {
	return isRatio && ['ATK', 'HP', 'DEF'].includes(name) ? `${name}%` : name;
}

/** Ada placeholder `{n}` yang belum terganti? */
export function hasPlaceholder(s: string): boolean {
	return /\{\d+\}/.test(s);
}

/**
 * Ambil teks bonus sonata yang sudah dirender dari detail echo.
 *  berbentuk objek berkunci nama set; EffectKeys (jumlah pieces) sejajar dengan EffectDescriptions.
 */
export function renderedSonataText(
	fetterDetails: Record<string, { EffectKeys?: number[]; EffectDescriptions?: string[] }> | undefined,
	setName: string,
	pieces: number
): string | null {
	const d = fetterDetails?.[setName];
	const k = d?.EffectKeys?.indexOf(pieces) ?? -1;
	return k >= 0 ? (d?.EffectDescriptions?.[k] ?? null) : null;
}

// ---------- efek pasif senjata ----------

type EffectScope = WeaponEffect['scope'];

const DT_IDS: Record<string, string> = {
	'basic attack': 'basic',
	basic: 'basic',
	'heavy attack': 'heavy',
	heavy: 'heavy',
	'resonance skill': 'skill',
	'resonance liberation': 'liberation',
	'intro skill': 'intro',
	'outro skill': 'outro',
	'echo skill': 'echo'
};
const DT = 'Basic Attack|Heavy Attack|Resonance Skill|Resonance Liberation|Intro Skill|Outro Skill|Echo Skill|Basic|Heavy';
const EL = 'Glacio|Fusion|Electro|Aero|Spectro|Havoc';
const SCOPE = `(?:All-Attribute|Attribute|${DT}|${EL})`;
const SUF = '(?:\\s+DMG(?:\\s+(?:Bonus|Amplification))?|\\s+Bonus)';
const DMG_PHRASE = `${SCOPE}(?:${SUF}?(?:\\s*,\\s*|\\s+(?:and|or)\\s+)${SCOPE})*${SUF}`;
const STAT_WORD = '(?:ATK|DEF|Max HP|HP)';
const STAT_LIST = `${STAT_WORD}(?:(?:\\s*,\\s*|\\s+and\\s+)${STAT_WORD})*`;
const TAIL_DMG = /^(?:\s+(?:is|are))?(?:\s+(?:increased|amplified|increases?))?(?:\s+by)?(?:\s+an?\s+additional)?\s*$/i;
const TAIL_STAT = /^(?:\s+of\s+[^,]*?)?(?:\s+(?:is|are))?(?:\s+(?:increased|increases?))?(?:\s+by)?(?:\s+an?\s+additional)?\s*$/i;
// "Crit. " dimasking jadi "Crit\u0001 " supaya titiknya tidak dianggap akhir kalimat
const CRIT = 'Crit\\u0001? (Rate|DMG)';

const scopeOfWord = (w: string): EffectScope => {
	const k = w.toLowerCase();
	if (k === 'attribute' || k === 'all-attribute') return 'all';
	if (DT_IDS[k]) return DT_IDS[k] as EffectScope;
	return k as EffectScope; // elemen
};

/** Semua scope yang disebut dalam frasa DMG ("Basic Attack and Heavy Attack DMG Bonus"). */
function scopesOf(phrase: string): EffectScope[] {
	const out: EffectScope[] = [];
	for (const m of phrase.matchAll(new RegExp(SCOPE, 'g'))) {
		const s = scopeOfWord(m[0]);
		if (!out.includes(s)) out.push(s);
	}
	return out;
}

const statWordToEffect = (w: string): WeaponEffectStat => (w === 'ATK' ? 'atkPct' : w === 'DEF' ? 'defPct' : 'hpPct');
const statWords = (list: string) =>
	[...list.matchAll(new RegExp(STAT_WORD, 'g'))].map((x) => ({ stat: statWordToEffect(x[0]), scope: null as EffectScope }));

export interface StatHit {
	stat: WeaponEffectStat;
	scope: EffectScope;
}

/**
 * Tentukan stat + scope untuk satu nilai persen, dari teks sebelum dan sesudahnya
 * (dalam kalimat yang sama). `null` = tidak dikenal (jadi 'other').
 */
export function classifyEffectStat(before: string, after: string): StatHit[] | null {
	const A = after.trimStart();
	const dmgHits = (phrase: string, tail = ''): StatHit[] => {
		const stat: WeaponEffectStat = /amplif/i.test(phrase + tail) ? 'amplify' : 'dmgBonus';
		return scopesOf(phrase).map((scope) => ({ stat, scope }));
	};

	// 1. Kata kunci tepat setelah angka ("24% Basic Attack DMG Bonus", "10% Fusion RES", "of the target's DEF")
	let m: RegExpMatchArray | null;
	if (/ignor/i.test(before) && /^(?:of\s+)?(?:the\s+)?(?:target'?s\s+)?DEF\b/.test(A)) {
		const sm = before.match(new RegExp(`(${DMG_PHRASE})\\s+(?:dealt\\s+)?(?:to\\s+)?ignores?\\s*$`));
		return [{ stat: 'defIgnore', scope: sm ? (scopesOf(sm[1])[0] ?? null) : null }];
	}
	if ((m = A.match(new RegExp(`^(?:of\\s+)?(?:the\\s+)?(?:target'?s\\s+)?(${EL})\\s+RES\\b`)))) {
		return [{ stat: 'resShred', scope: m[1].toLowerCase() as EffectScope }];
	}
	if ((m = A.match(new RegExp(`^${CRIT}`)))) {
		return [{ stat: m[1] === 'Rate' ? 'critRate' : 'critDmg', scope: null }];
	}
	if (/^Energy Regen/.test(A)) return [{ stat: 'energyRegen', scope: null }];
	if ((m = A.match(new RegExp(`^(?:additional\\s+)?(${STAT_LIST})\\b`)))) return statWords(m[1]);
	if ((m = A.match(new RegExp(`^(?:additional\\s+)?(${DMG_PHRASE})`)))) return dmgHits(m[1]);

	// 2. Kata kunci tepat sebelum angka ("increases Heavy Attack DMG Bonus by", "ATK is increased by")
	if (
		(m = before.match(
			new RegExp(`${CRIT}((?:\\s+of\\s+[^,]*?)?)(?:\\s+(?:is|are))?(?:\\s+(?:increased|increases?))?(?:\\s+by)?\\s*$`, 'i')
		))
	) {
		const sc = m[2] ? scopesOf(m[2])[0] : undefined;
		return [{ stat: m[1].toLowerCase() === 'rate' ? 'critRate' : 'critDmg', scope: sc ?? null }];
	}
	// "Aero DMG dealt by nearby Resonators on the field is Amplified by"
	if ((m = before.match(new RegExp(`(${DMG_PHRASE})\\s+dealt\\s+by\\s+[^,.]*?\\s+(?:is\\s+)?(Amplified|increased)\\s+by\\s*$`)))) {
		return dmgHits(m[1], m[2]);
	}
	if (/\ball\s+DMG\b[^,.]*?\s+(?:is\s+)?(?:increased\s+)?by\s*$/i.test(before)) return [{ stat: 'dmgBonus', scope: 'all' }];
	if (/DMG taken by [^,.]*?Amplified\s+by\s*$/i.test(before)) return [{ stat: 'amplify', scope: 'all' }];
	if ((m = before.match(new RegExp(`(${EL})\\s+RES\\s+by\\s*$`)))) {
		return [{ stat: 'resShred', scope: m[1].toLowerCase() as EffectScope }];
	}
	if (/Energy Regen(?:\s+(?:is|are))?(?:\s+(?:increased|increases?))?(?:\s+by)?\s*$/i.test(before)) {
		return [{ stat: 'energyRegen', scope: null }];
	}
	let last: RegExpMatchArray | undefined;
	for (const x of before.matchAll(new RegExp(DMG_PHRASE, 'g'))) {
		if (TAIL_DMG.test(before.slice((x.index ?? 0) + x[0].length))) last = x;
	}
	if (last) return dmgHits(last[0], before.slice((last.index ?? 0) + last[0].length));
	for (const x of before.matchAll(new RegExp(STAT_LIST, 'g'))) {
		if (TAIL_STAT.test(before.slice((x.index ?? 0) + x[0].length))) last = x;
	}
	if (last) return statWords(last[0]);
	return null;
}

const TEAM_RE = /\b(?:in the team|nearby|party members|incoming resonator|all resonators|other resonators)\b/i;
const TRIGGER_RE =
	/\b(?:when|whenever|after|upon|while|within|during|if|every|each|stack\w*|casting|cast|dealing|deals?|hitting|hits?|inflict\w*|obtain\w*|perform\w*|provid\w*|appl\w*|consum\w*|switch\w*|lasting|lasts?|reach\w*|at max)\b|\bfor\s+(?:⟦\d+⟧|\d)/i;

interface ValueToken {
	nums: number[];
	pct: boolean;
	first: string;
}

/** `{Cus:Sap,S=time P=times SapTag=2}` -> bentuk jamak ("times"). */
export function cleanSapTags(s: string): string {
	return s.replace(/\{Cus:Sap,S=(\S+) P=(\S+)[^}]*\}/g, '$2');
}

/**
 * Turunkan efek terstruktur dari template Desc pasif senjata (nilai per refinement "a/b/c/d/e" atau `{i}`).
 * Kalimat tanpa nilai persen diabaikan; persen yang tak dikenal menjadi stat 'other' (hanya teks).
 */
export function parseWeaponEffects(desc: string, params: ParamArray[] = []): WeaponEffect[] {
	let text = stripRichText(desc);
	params.forEach((p, i) => {
		const arr = p.ArrayString ?? [];
		if (arr.length) text = text.split(`{${i}}`).join(arr.join('/'));
	});
	text = cleanSapTags(text).replace(/Crit\. /g, 'Crit\u0001 ');

	const tokens: ValueToken[] = [];
	text = text.replace(/\d+(?:\.\d+)?%?(?:\/\d+(?:\.\d+)?%?){3,4}/g, (run) => {
		const parts = run.split('/');
		while (parts.length < 5) parts.push(parts[parts.length - 1]);
		const pct = parts.some((x) => x.endsWith('%'));
		tokens.push({
			nums: parts.map((x) => parseFloat(x)),
			pct,
			first: pct && !parts[0].endsWith('%') ? `${parts[0]}%` : parts[0]
		});
		return `⟦${tokens.length - 1}⟧`;
	});

	const sentences = text
		.split('\n')
		.flatMap((l) => l.split(/(?<=[.!?])\s+(?=[A-Z⟦])/))
		.map((s) => s.trim())
		.filter(Boolean);

	const display = (s: string) => s.replace(/⟦(\d+)⟧/g, (_, k) => tokens[Number(k)].first).replace(/\u0001/g, '.');
	const stackOf = (s: string): number | null => {
		const m = s.match(/up to\s*(⟦\d+⟧|\d+)\s*(?:stack|time)/i);
		if (!m) return null;
		const n = m[1].startsWith('⟦') ? tokens[Number(m[1].slice(1, -1))].nums[0] : Number(m[1]);
		return n > 1 ? n : null;
	};

	const effects: WeaponEffect[] = [];
	let prev: WeaponEffect[] = [];
	for (const s of sentences) {
		const mine: WeaponEffect[] = [];
		const markers = [...s.matchAll(/⟦(\d+)⟧/g)];
		const triggered = TRIGGER_RE.test(s);
		const stacks = stackOf(s);
		let hasOther = false;
		markers.forEach((mk, idx) => {
			const tok = tokens[Number(mk[1])];
			if (!tok.pct) return;
			const start = mk.index ?? 0;
			const end = start + mk[0].length;
			const before = s.slice(idx > 0 ? (markers[idx - 1].index ?? 0) + markers[idx - 1][0].length : 0, start);
			const after = s.slice(end, idx + 1 < markers.length ? markers[idx + 1].index : undefined);
			if (/(?:above|below|under|at least|capped at)\s*$/i.test(before)) return;
			if (/up to\s*$/i.test(before)) {
				// "…, up to 24%" = batas total; jadikan jumlah stack efek sebelumnya
				const base = mine[mine.length - 1];
				if (base && base.values[0] > 0) base.maxStacks = Math.round(tok.nums[0] / base.values[0]) || null;
				return;
			}
			const hits = classifyEffectStat(before, after);
			const team = TEAM_RE.test(before) || TEAM_RE.test(after.split(/[,.]|\sfor\s/)[0]);
			if (!hits) {
				if (hasOther) return;
				hasOther = true;
			}
			for (const h of hits ?? [{ stat: 'other' as const, scope: null }]) {
				mine.push({
					stat: h.stat,
					scope: h.scope,
					values: tok.nums,
					maxStacks: stacks,
					triggered,
					team,
					sentence: display(s)
				});
			}
		});
		if (markers.every((mk) => !tokens[Number(mk[1])].pct) && /stacking up to|stackable/i.test(s)) {
			const n = stackOf(s);
			if (n) for (const e of prev) if (e.maxStacks === null) e.maxStacks = n;
		}
		// Kalimat berlabel ("Nature's Order: ... up to 24%") tanpa kata pemicu tetap terpicu bila bertumpuk
		for (const e of mine) if (e.maxStacks) e.triggered = true;
		effects.push(...mine);
		prev = mine;
	}
	return effects;
}
