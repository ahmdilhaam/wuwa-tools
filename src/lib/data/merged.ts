// Gabungan data game (sumber kebenaran nama/elemen/rarity/senjata/ikon) dengan data build tulisan tangan.
import gameCharacters from '#lib/data/game/characters.json';
import { characters as buildCharacters } from '#lib/data/characters.ts';
import type { GameCharacter } from '#lib/data/game/types.ts';
import type { Character } from '#lib/data/types.ts';

export interface CharacterView {
	game: GameCharacter;
	/** null = belum ada data build tulisan tangan */
	build: Character | null;
}

const buildBySlug = new Map(buildCharacters.map((c) => [c.slug, c]));

export const characterViews: CharacterView[] = (gameCharacters as GameCharacter[]).map((game) => ({
	game,
	build: buildBySlug.get(game.slug) ?? null
}));

export function getCharacterView(slug: string): CharacterView | undefined {
	return characterViews.find((v) => v.game.slug === slug);
}

/** Normalisasi nama untuk pencocokan lintas sumber (huruf kecil, tanpa tanda baca/spasi). */
export function normalizeName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}
