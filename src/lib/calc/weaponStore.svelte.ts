// Weapon data is lazy-loaded (124 weapons) and shared across all BuildInputs and the results page.
import characters from '#lib/data/game/characters.json';
import type { GameCharacter, GameWeapon } from '#lib/data/game/types.ts';

let list = $state<GameWeapon[] | null>(null);
let loading = false;

export const weaponStore = {
	get list() {
		return list;
	},
	/** Start loading (once). Safe to call repeatedly. */
	ensure() {
		if (list || loading) return;
		loading = true;
		import('#lib/data/game/weapons.json').then((m) => {
			list = m.default as unknown as GameWeapon[];
		});
	},
	find(id: string): GameWeapon | null {
		return list?.find((w) => String(w.id) === id) ?? null;
	}
};

export const findCharacter = (slug: string): GameCharacter | null =>
	(characters as GameCharacter[]).find((c) => c.slug === slug) ?? null;
