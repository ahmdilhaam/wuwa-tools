import { defineParams } from '@sveltejs/kit/params';

// Parameter matcher. Hanya "en" yang berawalan di URL; bahasa Indonesia (default) tanpa awalan.
export const params = defineParams({
	lang: (param) => (param === 'en' ? param : undefined)
});
