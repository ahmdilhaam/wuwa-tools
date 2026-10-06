import type { Handle } from '@sveltejs/kit/hooks';

// Isi atribut <html lang> dari awalan URL: "/en" berarti Inggris, selain itu Indonesia.
export const handle: Handle = ({ event, resolve }) => {
	const lang = /^\/en(\/|$)/.test(event.url.pathname) ? 'en' : 'id';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
