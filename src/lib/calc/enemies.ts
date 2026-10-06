// Preset musuh dari data game (monsters.json, hasil sinkronisasi encore.moe).
// Data game memuat resistensi Physical (DamageResistancePhys), jadi kolom `physical`
// tetap disimpan. Namun tidak ada Resonator yang menghasilkan DMG Physical,
// sehingga Physical tidak bisa dipilih sebagai elemen penyerang.
import monsters from '#lib/data/game/monsters.json';
import type { GameMonster, MonsterClass } from '#lib/data/game/types.ts';

export const elements = ['aero', 'glacio', 'fusion', 'electro', 'spectro', 'havoc'] as const;
export type Element = (typeof elements)[number];

export const elementLabels: Record<Element, string> = {
	aero: 'Aero',
	glacio: 'Glacio',
	fusion: 'Fusion',
	electro: 'Electro',
	spectro: 'Spectro',
	havoc: 'Havoc'
};

export type EnemyElement = Element | 'physical';

export const rarityLabels: Record<MonsterClass, string> = {
	standard: 'Standar',
	elite: 'Elite',
	overlord: 'Overlord',
	calamity: 'Calamity'
};

export interface EnemyPreset {
	id: string;
	name: string;
	rarity: MonsterClass;
	element: EnemyElement;
	/** RES per elemen dalam pecahan (0.1 = 10%) */
	res: Record<EnemyElement, number>;
}

function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function buildPresets(list: GameMonster[]): EnemyPreset[] {
	const nameCount = new Map<string, number>();
	for (const m of list) nameCount.set(m.name, (nameCount.get(m.name) ?? 0) + 1);
	return list
		.map((m) => ({
			// Nama unik -> slug nama (id lama seperti 'mourning-aix' tetap berlaku); nama kembar diberi akhiran id.
			id: nameCount.get(m.name) === 1 ? slugify(m.name) : `${slugify(m.name)}-${m.id}`,
			name: m.name,
			rarity: m.rarity,
			element: m.element,
			res: m.res
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export const enemyPresets: EnemyPreset[] = buildPresets(monsters as GameMonster[]);

/** Preset bawaan; jatuh ke preset pertama bila Mourning Aix tidak ada. */
export const DEFAULT_ENEMY_ID = enemyPresets.some((e) => e.id === 'mourning-aix')
	? 'mourning-aix'
	: (enemyPresets[0]?.id ?? 'custom');

/** ID khusus untuk RES yang diketik manual */
export const CUSTOM_ENEMY_ID = 'custom';

export function presetResFor(enemyId: string, element: Element): number | null {
	const p = enemyPresets.find((e) => e.id === enemyId);
	return p ? p.res[element] : null;
}

/** Filter preset berdasarkan rarity ('all' = semua) dan kata kunci nama. */
export function filterPresets(
	rarity: MonsterClass | 'all',
	query: string,
	list: EnemyPreset[] = enemyPresets
): EnemyPreset[] {
	const q = query.trim().toLowerCase();
	return list.filter(
		(p) => (rarity === 'all' || p.rarity === rarity) && (q === '' || p.name.toLowerCase().includes(q))
	);
}
