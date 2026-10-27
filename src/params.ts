import { defineParams } from '@sveltejs/kit/params';

// Parameter matcher. Only "en" is prefixed in the URL; Indonesian (the default) has no prefix.
export const params = defineParams({
	lang: (param) => (param === 'en' ? param : undefined)
});
