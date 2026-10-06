// Data senjata dimuat malas (124 senjata) dan dibagi ke semua BuildInputs serta halaman hasil.
import characters from '#lib/data/game/characters.json';
import type { GameCharacter, GameWeapon } from '#lib/data/game/types.ts';

let list = $state<GameWeapon[] | null>(null);
let loading = false;

export const weaponStore = {
	get list() {
		return list;
	},
	/** Mulai memuat (sekali). Aman dipanggil berulang. */
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
