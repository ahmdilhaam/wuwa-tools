// Enemy presets from game data (monsters.json, synced from encore.moe).
// Game data includes Physical resistance (DamageResistancePhys), so the `physical` field
// is kept. However, no Resonator deals Physical DMG,
// so Physical cannot be selected as the attacker's element.
import monsters from '#lib/data/game/monsters.json';
import type { GameMonster, MonsterClass } from '#lib/data/game/types.ts';
import type { DictKey } from '#lib/i18n/index.svelte.ts';

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

/** Dictionary keys for rarity labels; translate at render time via t(). */
export const rarityKeys: Record<MonsterClass, DictKey> = {
	standard: 'calc.rarity.standard',
	elite: 'calc.rarity.elite',
	overlord: 'calc.rarity.overlord',
	calamity: 'calc.rarity.calamity'
};

export interface EnemyPreset {
	id: string;
	name: string;
	rarity: MonsterClass;
	element: EnemyElement;
	/** RES per element as a fraction (0.1 = 10%) */
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
			// Unique name -> name slug (legacy ids like 'mourning-aix' still hold); duplicate names get the id as a suffix.
			id: nameCount.get(m.name) === 1 ? slugify(m.name) : `${slugify(m.name)}-${m.id}`,
			name: m.name,
			rarity: m.rarity,
			element: m.element,
			res: m.res
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export const enemyPresets: EnemyPreset[] = buildPresets(monsters as GameMonster[]);

/** Default preset; falls back to the first preset if Mourning Aix is missing. */
export const DEFAULT_ENEMY_ID = enemyPresets.some((e) => e.id === 'mourning-aix')
	? 'mourning-aix'
	: (enemyPresets[0]?.id ?? 'custom');

/** Special ID for manually typed RES */
export const CUSTOM_ENEMY_ID = 'custom';

export function presetResFor(enemyId: string, element: Element): number | null {
	const p = enemyPresets.find((e) => e.id === enemyId);
	return p ? p.res[element] : null;
}

/** Filter presets by rarity ('all' = every rarity) and a name keyword. */
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
