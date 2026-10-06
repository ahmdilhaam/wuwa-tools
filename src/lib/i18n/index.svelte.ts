import { browser } from '$app/env';
import { page } from '$app/state';
import { en } from './en.ts';
import { id } from './id.ts';
import type { Dict } from './id.ts';
import { DEFAULT_LOCALE, type Locale } from './types.ts';

export type { Locale } from './types.ts';
export { LOCALES } from './types.ts';

const dicts: Record<Locale, Dict> = { id, en };

// Kunci bertitik, mis. 'home.calc.title', diturunkan dari bentuk kamus.
type Paths<T, P extends string = ''> = {
	[K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type DictKey = Paths<Dict>;

export type Params = Record<string, string | number>;

/** Bahasa aktif dari parameter URL `[[lang=lang]]`; tanpa awalan berarti Indonesia. */
export function getLocale(): Locale {
	return page.params.lang === 'en' ? 'en' : DEFAULT_LOCALE;
}

/** Terjemahan untuk kunci bertitik; `{nama}` diisi dari params. */
export function t(key: DictKey, params?: Params): string {
	let value: unknown = dicts[getLocale()];
	for (const part of key.split('.')) value = (value as Record<string, unknown>)[part];
	const text = typeof value === 'string' ? value : key;
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

const EN_PREFIX = /^\/en(?=\/|$)/;

/** Path tanpa awalan bahasa. */
export function stripLocale(path: string): string {
	return path.replace(EN_PREFIX, '') || '/';
}

/** Path untuk bahasa tertentu (path internal berawalan "/"). */
export function pathForLocale(path: string, locale: Locale): string {
	const bare = stripLocale(path);
	if (locale !== 'en') return bare;
	return bare === '/' ? '/en/' : `/en${bare}`;
}

/** Path internal sesuai bahasa aktif; semua tautan internal wajib lewat sini. */
export function localize(path: string): string {
	return pathForLocale(path, getLocale());
}

// Query dan hash tidak boleh dibaca saat prerender, dan harus identik dengan SSR saat
// hidrasi. Maka disertakan hanya setelah layout ter-mount di browser.
let withLocation = $state(false);

/** Dipanggil layout saat mount agar tautan pengganti bahasa memuat query dan hash. */
export function enableLocationSuffix() {
	if (browser) withLocation = true;
}

/** Halaman saat ini dalam bahasa lain (query dan hash dipertahankan di browser). */
export function switchLocaleHref(target: Locale): string {
	const base = pathForLocale(page.url.pathname, target);
	return withLocation ? base + page.url.search + page.url.hash : base;
}

/** Locale Intl untuk angka dan tanggal. */
export function numberLocale(): string {
	return getLocale() === 'en' ? 'en-GB' : 'id-ID';
}

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
	return new Intl.NumberFormat(numberLocale(), opts).format(n);
}

/** Teks dari data game dua bahasa; jatuh ke bahasa Inggris bila terjemahan kosong. */
export function gameText(obj: { en: string; id?: string }): string {
	return (getLocale() === 'id' ? obj.id : obj.en) || obj.en;
}
