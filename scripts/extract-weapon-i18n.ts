// Tulis daftar templat sumber (angka -> {n}) untuk diterjemahkan: bun run i18n:extract
// Mencakup pasif senjata dan deskripsi skill/sequence per karakter.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { collectSkillTemplates, collectWeaponTemplates, type SkillI18nFile, type WeaponI18nWeapon } from './encore-helpers';

const root = resolve(import.meta.dirname, '..');
const weapons = JSON.parse(await readFile(resolve(root, 'src/lib/data/game/weapons.json'), 'utf8')) as WeaponI18nWeapon[];
const templates = collectWeaponTemplates(weapons);
await writeFile(resolve(root, 'src/lib/data/i18n/weapon-passives.source.json'), JSON.stringify(templates, null, '\t') + '\n');
console.log(`${templates.length} templat unik -> src/lib/data/i18n/weapon-passives.source.json`);

const skillDir = resolve(root, 'src/lib/data/game/skills');
const outDir = resolve(root, 'src/lib/data/i18n/skills');
await mkdir(outDir, { recursive: true });
let totalTemplates = 0;
let totalChars = 0;
const slugs = (await readdir(skillDir)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
for (const slug of slugs) {
	const file = JSON.parse(await readFile(resolve(skillDir, `${slug}.json`), 'utf8')) as SkillI18nFile;
	const list = collectSkillTemplates(file);
	const chars = list.reduce((n, t) => n + t.length, 0);
	totalTemplates += list.length;
	totalChars += chars;
	await writeFile(resolve(outDir, `${slug}.source.json`), JSON.stringify(list, null, '\t') + '\n');
	// Overlay tidak pernah ditimpa; dibuat kosong bila belum ada.
	const overlay = resolve(outDir, `${slug}.id.json`);
	if (!existsSync(overlay)) await writeFile(overlay, '{}\n');
	console.log(`  ${slug}: ${list.length} templat, ${chars} karakter`);
}
console.log(`skill+sequence: ${slugs.length} karakter, ${totalTemplates} templat, ${totalChars} karakter -> src/lib/data/i18n/skills/`);
