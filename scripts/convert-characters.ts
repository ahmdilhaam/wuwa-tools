// Konversi markdown karakter (reference/wuwa-core/references/characters/*.md) menjadi JSON terstruktur.
// Jalankan: bun scripts/convert-characters.ts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { Character, CharacterSection, Element, WeaponType } from '../src/lib/data/types';

const root = resolve(import.meta.dir, '..');
const srcDir = resolve(root, 'reference/wuwa-core/references/characters');
const outFile = resolve(root, 'src/lib/data/characters.json');
const elements: Element[] = ['aero', 'electro', 'fusion', 'glacio', 'havoc', 'spectro'];

// Slug: buang kurung kecuali kurung elemen (mis. "Rover (Aero)" -> rover-aero).
const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/\([^)]*\)/g, (m) => (elements.some((e) => m.includes(e)) ? m : ''))
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

function normWeapon(w: string): WeaponType | null {
	const l = w.toLowerCase();
	if (l.startsWith('sword')) return 'Sword';
	if (l.startsWith('broadblade')) return 'Broadblade';
	if (l.startsWith('pistol')) return 'Pistols';
	if (l.startsWith('gauntlet')) return 'Gauntlets';
	if (l.startsWith('rectifier')) return 'Rectifier';
	return null;
}

// Catatan meta tentang sesi scraping — bukan data game.
const metaRe = /vidiq|transcript credits|_style_notes|style observations/i;

// Tabel ringkasan (fallback rarity / senjata) per nama karakter.
const summary = new Map<string, { rarity: 4 | 5 | null; weaponType: WeaponType | null }>();
function readSummaryTable(lines: string[]) {
	let idx: { rarity: number; weapon: number } | null = null;
	for (const line of lines) {
		if (!line.startsWith('|')) {
			idx = null;
			continue;
		}
		const cells = line
			.split('|')
			.slice(1, -1)
			.map((c) => c.trim());
		if (cells[0] === 'Character') {
			idx = {
				rarity: cells.findIndex((c) => /^rarity/i.test(c)),
				weapon: cells.findIndex((c) => /^weapon/i.test(c))
			};
			continue;
		}
		if (!idx || /^[-: ]+$/.test(cells[0])) continue;
		const r = idx.rarity >= 0 ? cells[idx.rarity]?.match(/(\d)★/) : null;
		summary.set(cells[0], {
			rarity: r ? (Number(r[1]) as 4 | 5) : null,
			weaponType: idx.weapon >= 0 ? normWeapon(cells[idx.weapon] ?? '') : null
		});
	}
}

const labelRe = /^(?:- )?\*\*([^*]+?):\*\*\s*(.*)$/;
const headRe = /^### (.+?) — (.+) \((\w+)\)\s*$/;

const characters: Character[] = [];
const usedSlugs = new Set<string>();

for (const el of elements) {
	const lines = readFileSync(resolve(srcDir, `${el}.md`), 'utf8').split(/\r?\n/);
	readSummaryTable(lines);
	let cur: { c: Character; sections: CharacterSection[] } | null = null;
	let last: { sec: CharacterSection; itemIdx: number } | null = null;

	const flush = () => {
		if (!cur) return;
		const { c, sections } = cur;
		const take = (test: (l: string) => boolean): CharacterSection | null => {
			const i = sections.findIndex((s) => test(s.label.toLowerCase()));
			return i < 0 ? null : sections.splice(i, 1)[0];
		};
		c.echo = sections.filter((s) => s.label.toLowerCase().startsWith('echo'));
		for (const s of c.echo) sections.splice(sections.indexOf(s), 1);
		c.weapons = take((l) => l.startsWith('weapons') || l.startsWith('sig'));
		c.stats = take((l) => l.startsWith('stat'));
		c.forte = take((l) => l.startsWith('forte'));
		c.substats = take((l) => l.startsWith('substats'));
		c.teams = take((l) => l.startsWith('teams'));
		c.rotation = take((l) => l.startsWith('rotation'));
		c.sequences = take((l) => l.startsWith('sequences'));
		c.notes = take((l) => l.startsWith('notes'));
		c.other = sections;
		const sm = summary.get(c.name);
		if (c.rarity === null && sm?.rarity) c.rarity = sm.rarity;
		if (c.weaponType === null && sm?.weaponType) c.weaponType = sm.weaponType;
		characters.push(c);
		cur = null;
		last = null;
	};

	for (const raw of lines) {
		const line = raw.replace(/\s+$/, '');
		const h = line.match(headRe);
		if (h) {
			flush();
			const name = h[1].trim();
			let slug = slugify(name);
			if (usedSlugs.has(slug)) slug = `${slug}-${el}`;
			usedSlugs.add(slug);
			cur = {
				c: {
					slug,
					name,
					element: el,
					roles: h[2]
						.split('/')
						.map((r) => r.trim())
						.filter(Boolean),
					rarity: null,
					weaponType: null,
					source: null,
					echo: [],
					weapons: null,
					stats: null,
					forte: null,
					substats: null,
					teams: null,
					rotation: null,
					sequences: null,
					notes: null,
					other: []
				},
				sections: []
			};
			last = null;
			continue;
		}
		if (/^## /.test(line) || line === '---') {
			flush();
			continue;
		}
		if (!cur || !line.trim()) continue;
		if (metaRe.test(line)) continue;
		const m = line.match(labelRe);
		if (m && !/^\s/.test(line)) {
			const label = m[1].trim();
			const value = m[2].trim();
			const l = label.toLowerCase();
			if (l === 'source') {
				cur.c.source = value;
				last = null;
				continue;
			}
			if (l.startsWith('rarity')) {
				const rm = value.match(/(\d)★\s*(\w+)/);
				if (rm) {
					cur.c.rarity = Number(rm[1]) as 4 | 5;
					cur.c.weaponType = normWeapon(rm[2]);
				}
				last = null;
				continue;
			}
			const sec: CharacterSection = { label, value, items: [] };
			cur.sections.push(sec);
			last = { sec, itemIdx: -1 };
			continue;
		}
		const b = line.match(/^(\s+)- (.*)$/);
		if (b && last) {
			last.sec.items.push(b[2].trim());
			last.itemIdx = last.sec.items.length - 1;
			continue;
		}
		if (/^\s+\S/.test(line) && last) {
			// Baris lanjutan: tempelkan ke item/nilai terakhir.
			if (last.itemIdx >= 0) last.sec.items[last.itemIdx] += ' ' + line.trim();
			else last.sec.value += ' ' + line.trim();
		}
	}
	flush();
}

if (characters.length !== 53) {
	console.error(`Jumlah karakter ${characters.length}, diharapkan 53`);
	process.exit(1);
}

const json = JSON.stringify(characters, null, '\t');
if (metaRe.test(json)) console.warn('PERINGATAN: sisa teks meta scraping terdeteksi');

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, json + '\n');

console.log(`Total: ${characters.length} karakter -> ${outFile}`);
for (const el of elements) console.log(`  ${el}: ${characters.filter((c) => c.element === el).length}`);
console.log('\nKarakter dengan field inti kosong:');
let gaps = 0;
for (const c of characters) {
	const miss: string[] = [];
	if (!c.weapons) miss.push('weapons');
	if (!c.stats) miss.push('stats');
	if (c.echo.length === 0) miss.push('echo');
	if (c.rarity === null) miss.push('rarity');
	if (c.weaponType === null) miss.push('weaponType');
	if (miss.length) {
		gaps++;
		console.log(`  ${c.slug} (${c.element}): ${miss.join(', ')}`);
	}
}
if (!gaps) console.log('  (tidak ada)');
