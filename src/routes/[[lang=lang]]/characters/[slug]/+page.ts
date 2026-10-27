import { error } from '@sveltejs/kit';
import { en } from '#lib/i18n/en.ts';
import { id } from '#lib/i18n/id.ts';
import { characterViews, getCharacterView } from '#lib/data/merged.ts';
import type { CharacterSkills } from '#lib/data/game/types.ts';

// One chunk per character: skill files are lazy-loaded via glob, not bundled together.
const skillFiles = import.meta.glob<CharacterSkills>('../../../../lib/data/game/skills/*.json', {
	import: 'default'
});

// Prerender every character slug, each in Indonesian (no prefix) and English.
export function entries() {
	return characterViews.flatMap((v) => [
		{ slug: v.game.slug },
		{ lang: 'en', slug: v.game.slug }
	]);
}

export async function load({ params }: { params: { slug: string; lang?: string } }) {
	const view = getCharacterView(params.slug);
	if (!view) error(404, (params.lang === 'en' ? en : id).library.detail.notFound);
	const loader = skillFiles[`../../../../lib/data/game/skills/${params.slug}.json`];
	const skills = loader ? await loader() : null;
	return { view, skills };
}
