// Tulis daftar templat sumber (angka -> {n}) untuk diterjemahkan: bun run i18n:extract
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collectWeaponTemplates, type WeaponI18nWeapon } from './encore-helpers';

const root = resolve(import.meta.dirname, '..');
const weapons = JSON.parse(await readFile(resolve(root, 'src/lib/data/game/weapons.json'), 'utf8')) as WeaponI18nWeapon[];
const templates = collectWeaponTemplates(weapons);
await writeFile(resolve(root, 'src/lib/data/i18n/weapon-passives.source.json'), JSON.stringify(templates, null, '\t') + '\n');
console.log(`${templates.length} templat unik -> src/lib/data/i18n/weapon-passives.source.json`);
