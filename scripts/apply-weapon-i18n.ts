// Terapkan overlay terjemahan ke weapons.json: bun run i18n:apply
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { applyWeaponI18n, type WeaponI18nWeapon } from './encore-helpers';

const root = resolve(import.meta.dirname, '..');
const overlayFile = resolve(root, 'src/lib/data/i18n/weapon-passives.id.json');

/** Terapkan overlay ke senjata (mutasi in-place), cetak ringkasan; gagal keras bila placeholder tak cocok. */
export async function applyWeaponI18nFromFile(weapons: WeaponI18nWeapon[]): Promise<void> {
	const overlay = JSON.parse(await readFile(overlayFile, 'utf8')) as Record<string, string>;
	const { missing, invalid, stale } = applyWeaponI18n(weapons, overlay);
	if (invalid.length) {
		const lines = invalid.map((o) => `  - ${o.template}\n    terjemahan: ${o.translation}\n    harusnya ${o.expected.join(' ')} dapat ${o.got.join(' ')}`);
		throw new Error(`${invalid.length} terjemahan dengan placeholder tidak cocok:\n${lines.join('\n')}`);
	}
	console.log(`  terjemahan pasif: ${missing.length} templat belum diterjemahkan`);
	if (missing.length && process.argv.includes('--list')) for (const t of missing) console.log(`    - ${t}`);
	if (stale.length) {
		console.warn(`  PERINGATAN: ${stale.length} kunci overlay basi (tidak ada di sumber):`);
		for (const t of stale) console.warn(`    - ${t}`);
	}
}

if (import.meta.main) {
	const file = resolve(root, 'src/lib/data/game/weapons.json');
	const weapons = JSON.parse(await readFile(file, 'utf8')) as WeaponI18nWeapon[];
	await applyWeaponI18nFromFile(weapons);
	await writeFile(file, JSON.stringify(weapons) + '\n');
}
