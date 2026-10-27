import type { Handle } from '@sveltejs/kit/hooks';

// Fill the <html lang> attribute from the URL prefix: "/en" means English, anything else Indonesian.
export const handle: Handle = ({ event, resolve }) => {
	const lang = /^\/en(\/|$)/.test(event.url.pathname) ? 'en' : 'id';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
