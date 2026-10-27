import { browser } from '$app/env';
import { page } from '$app/state';
import { en } from './en.ts';
import { id } from './id.ts';
import type { Dict } from './id.ts';
import { DEFAULT_LOCALE, type Locale } from './types.ts';

export type { Locale } from './types.ts';
export { LOCALES } from './types.ts';

const dicts: Record<Locale, Dict> = { id, en };

// Dotted keys, e.g. 'home.calc.title', derived from the dictionary shape.
type Paths<T, P extends string = ''> = {
	[K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type DictKey = Paths<Dict>;

export type Params = Record<string, string | number>;

/** Active language from the `[[lang=lang]]` URL param; no prefix means Indonesian. */
export function getLocale(): Locale {
	return page.params.lang === 'en' ? 'en' : DEFAULT_LOCALE;
}

/** Translation for a dotted key; `{nama}` is filled from params. */
export function t(key: DictKey, params?: Params): string {
	let value: unknown = dicts[getLocale()];
	for (const part of key.split('.')) value = (value as Record<string, unknown>)[part];
	const text = typeof value === 'string' ? value : key;
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

const EN_PREFIX = /^\/en(?=\/|$)/;

/** Path without the language prefix. */
export function stripLocale(path: string): string {
	return path.replace(EN_PREFIX, '') || '/';
}

/** Path for a given language (internal paths start with "/"). */
export function pathForLocale(path: string, locale: Locale): string {
	const bare = stripLocale(path);
	if (locale !== 'en') return bare;
	return bare === '/' ? '/en/' : `/en${bare}`;
}

/** Internal path for the active language; all internal links must go through here. */
export function localize(path: string): string {
	return pathForLocale(path, getLocale());
}

// Query and hash must not be read during prerender, and must match SSR during
// hydration. So they are included only after the layout has mounted in the browser.
let withLocation = $state(false);

/** Called by the layout on mount so the language switcher links carry the query and hash. */
export function enableLocationSuffix() {
	if (browser) withLocation = true;
}

/** Current page in another language (query and hash preserved in the browser). */
export function switchLocaleHref(target: Locale): string {
	const base = pathForLocale(page.url.pathname, target);
	return withLocation ? base + page.url.search + page.url.hash : base;
}

/** Intl locale for numbers and dates. */
export function numberLocale(): string {
	return getLocale() === 'en' ? 'en-GB' : 'id-ID';
}

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
	return new Intl.NumberFormat(numberLocale(), opts).format(n);
}

/** Text from bilingual game data; falls back to English if the translation is empty. */
export function gameText(obj: { en: string; id?: string }): string {
	return (getLocale() === 'id' ? obj.id : obj.en) || obj.en;
}
