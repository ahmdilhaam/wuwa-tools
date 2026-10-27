// Lazy-load skill data per character so the 60 JSON files stay out of the calculator chunk.
import type { CharacterSkills } from '#lib/data/game/types.ts';

const loaders = import.meta.glob<CharacterSkills>('../data/game/skills/*.json', {
	import: 'default'
});

const cache = new Map<string, CharacterSkills>();

export async function loadCharacterSkills(slug: string): Promise<CharacterSkills | null> {
	const hit = cache.get(slug);
	if (hit) return hit;
	const loader = loaders[`../data/game/skills/${slug}.json`];
	if (!loader) return null;
	const data = await loader();
	cache.set(slug, data);
	return data;
}
