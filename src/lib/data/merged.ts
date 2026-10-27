// Game data (source of truth for name/element/rarity/weapon/icon) merged with hand-written build data.
import gameCharacters from '#lib/data/game/characters.json';
import { characters as buildCharacters } from '#lib/data/characters.ts';
import type { GameCharacter } from '#lib/data/game/types.ts';
import type { Character } from '#lib/data/types.ts';

export interface CharacterView {
	game: GameCharacter;
	/** null = no hand-written build data yet */
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

/** Normalizes a name for cross-source matching (lowercase, no punctuation/spaces). */
export function normalizeName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}
