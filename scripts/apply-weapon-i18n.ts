// Terapkan overlay terjemahan ke weapons.json dan skills/*.json: bun run i18n:apply
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { applySkillI18n, applyWeaponI18n, type SkillI18nFile, type WeaponI18nWeapon } from './encore-helpers';

const root = resolve(import.meta.dirname, '..');
const overlayFile = resolve(root, 'src/lib/data/i18n/weapon-passives.id.json');
const skillDir = resolve(root, 'src/lib/data/game/skills');
const skillOverlayDir = resolve(root, 'src/lib/data/i18n/skills');

const listMissing = process.argv.includes('--list');

/** Terapkan overlay ke senjata (mutasi in-place), cetak ringkasan; gagal keras bila placeholder tak cocok. */
export async function applyWeaponI18nFromFile(weapons: WeaponI18nWeapon[]): Promise<void> {
	const overlay = JSON.parse(await readFile(overlayFile, 'utf8')) as Record<string, string>;
	const { missing, invalid, stale } = applyWeaponI18n(weapons, overlay);
	if (invalid.length) {
		const lines = invalid.map((o) => `  - ${o.template}\n    terjemahan: ${o.translation}\n    harusnya ${o.expected.join(' ')} dapat ${o.got.join(' ')}`);
		throw new Error(`${invalid.length} terjemahan dengan placeholder tidak cocok:\n${lines.join('\n')}`);
	}
	console.log(`  terjemahan pasif: ${missing.length} templat belum diterjemahkan`);
	if (missing.length && listMissing) for (const t of missing) console.log(`    - ${t}`);
	if (stale.length) {
		console.warn(`  PERINGATAN: ${stale.length} kunci overlay basi (tidak ada di sumber):`);
		for (const t of stale) console.warn(`    - ${t}`);
	}
}

/** Terapkan overlay skill/sequence ke semua skills/{slug}.json dan tulis ulang; gagal keras (daftar slug + templat) bila placeholder tak cocok. */
export async function applySkillI18nFromFiles(): Promise<void> {
	const slugs = (await readdir(skillDir)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
	const failures: string[] = [];
	const summary: string[] = [];
	let totalMissing = 0;
	for (const slug of slugs) {
		const file = resolve(skillDir, `${slug}.json`);
		const data = JSON.parse(await readFile(file, 'utf8')) as SkillI18nFile;
		const overlayPath = resolve(skillOverlayDir, `${slug}.id.json`);
		const overlay = existsSync(overlayPath) ? (JSON.parse(await readFile(overlayPath, 'utf8')) as Record<string, string>) : {};
		const { missing, invalid, stale } = applySkillI18n(data, overlay);
		for (const o of invalid) {
			failures.push(`  [${slug}] ${o.template}\n    terjemahan: ${o.translation}\n    harusnya ${o.expected.join(' ')} dapat ${o.got.join(' ')}`);
		}
		totalMissing += missing.length;
		if (missing.length || stale.length) summary.push(`    ${slug}: ${missing.length} belum diterjemahkan${stale.length ? `, ${stale.length} kunci basi` : ''}`);
		if (listMissing) for (const t of missing) summary.push(`      - ${t}`);
		for (const t of stale) console.warn(`  PERINGATAN [${slug}] kunci overlay basi: ${t}`);
		if (!invalid.length) await writeFile(file, JSON.stringify(data) + '\n');
	}
	if (failures.length) throw new Error(`${failures.length} terjemahan skill dengan placeholder tidak cocok:\n${failures.join('\n')}`);
	console.log(`  terjemahan skill+sequence: ${slugs.length} karakter, ${totalMissing} templat belum diterjemahkan`);
	if (summary.length > 0) console.log(summary.join('\n'));
}

if (import.meta.main) {
	const file = resolve(root, 'src/lib/data/game/weapons.json');
	const weapons = JSON.parse(await readFile(file, 'utf8')) as WeaponI18nWeapon[];
	await applyWeaponI18nFromFile(weapons);
	await writeFile(file, JSON.stringify(weapons) + '\n');
	await applySkillI18nFromFiles();
}
