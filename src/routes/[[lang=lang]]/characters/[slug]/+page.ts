import { error } from '@sveltejs/kit';
import { en } from '#lib/i18n/en.ts';
import { id } from '#lib/i18n/id.ts';
import { characterViews, getCharacterView } from '#lib/data/merged.ts';
import type { CharacterSkills } from '#lib/data/game/types.ts';

// Satu chunk per karakter: file skill dimuat lazy lewat glob, bukan digabung.
const skillFiles = import.meta.glob<CharacterSkills>('../../../../lib/data/game/skills/*.json', {
	import: 'default'
});

// Prerender semua slug karakter, masing-masing dalam bahasa Indonesia (tanpa awalan) dan Inggris.
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
