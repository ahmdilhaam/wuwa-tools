import { error } from '@sveltejs/kit';
import { characterViews, getCharacterView } from '#lib/data/merged.ts';
import type { CharacterSkills } from '#lib/data/game/types.ts';

// Satu chunk per karakter: file skill dimuat lazy lewat glob, bukan digabung.
const skillFiles = import.meta.glob<CharacterSkills>('../../../lib/data/game/skills/*.json', {
	import: 'default'
});

// Prerender semua slug karakter.
export function entries() {
	return characterViews.map((v) => ({ slug: v.game.slug }));
}

export async function load({ params }: { params: { slug: string } }) {
	const view = getCharacterView(params.slug);
	if (!view) error(404, 'Karakter tidak ditemukan');
	const loader = skillFiles[`../../../lib/data/game/skills/${params.slug}.json`];
	const skills = loader ? await loader() : null;
	return { view, skills };
}
