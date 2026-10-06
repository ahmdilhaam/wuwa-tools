// Fungsi murni untuk sinkronisasi data encore.moe (tanpa I/O supaya mudah diuji).

const ENTITIES: Record<string, string> = {
	'&nbsp;': ' ',
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'"
};

/** Buang tag rich-text game (`<te href=..>`, `<color=..>`, `<span>`, `<size=..>`), pertahankan teks dalam. `<br>` jadi baris baru. */
export function stripRichText(input: string): string {
	return input
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/?[a-zA-Z][^>]*>/g, '')
		.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m)
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/[ \t]{2,}/g, ' ')
		.trim();
}

/** "181%" / "53.50%" / "587.50" -> angka; format rumus ("53.50%*4") atau kosong -> null. */
export function parseNumber(input: string | number | null | undefined): number | null {
	if (typeof input === 'number') return Number.isFinite(input) ? input : null;
	if (typeof input !== 'string') return null;
	const m = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
	return m ? Number(m[1]) : null;
}

/** Alias semantik untuk MV: "181%" -> 181. */
export const parseMultiplier = parseNumber;

/** Basis poin -> pecahan (1000 = 10% = 0.1). Dibulatkan agar bebas noise floating point. */
export function basisPointsToFraction(bp: number): number {
	return Math.round(bp) / 10000;
}

/** Satuan atribut skill: '%' bila nilai berakhiran persen, kalau tidak pakai Description sumber (mis. "s"). */
export function deriveUnit(values: string[], description: string): string {
	if (values.some((v) => v.includes('%'))) return '%';
	return description.trim();
}

/** Nama kebab-case dari nama Inggris: "Rover: Spectro" -> "rover-spectro". */
export function kebab(name: string): string {
	return name
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export interface ParamArray {
	ArrayString?: string[];
}

/** Ganti placeholder `{0}`, `{1}`... dengan params[i] (string). Placeholder tanpa param dibiarkan. */
export function fillParams(template: string, params: string[]): string {
	return template.replace(/\{(\d+)\}/g, (m, i) => params[Number(i)] ?? m);
}

/**
 * Render deskripsi pasif senjata untuk refinement `rank` (1..5).
 * Mendukung dua bentuk: placeholder `{i}` atau teks sumber yang sudah memuat "a/b/c/d/e" (diganti nilai ke-rank).
 */
export function renderRefinement(desc: string, params: ParamArray[], rank: number): string {
	const idx = rank - 1;
	const pick = (arr: string[]) => arr[Math.min(idx, arr.length - 1)] ?? '';
	let out = desc;
	params.forEach((p, i) => {
		const arr = p.ArrayString ?? [];
		if (arr.length === 0) return;
		out = out.split(`{${i}}`).join(pick(arr));
		if (arr.length > 1) out = out.split(arr.join('/')).join(pick(arr));
	});
	return stripRichText(out);
}

/** Nama stat sekunder senjata: ATK/HP/DEF berbentuk rasio diberi akhiran '%'. */
export function secondaryName(name: string, isRatio: boolean): string {
	return isRatio && ['ATK', 'HP', 'DEF'].includes(name) ? `${name}%` : name;
}

/** Ada placeholder `{n}` yang belum terganti? */
export function hasPlaceholder(s: string): boolean {
	return /\{\d+\}/.test(s);
}

/**
 * Ambil teks bonus sonata yang sudah dirender dari detail echo.
 *  berbentuk objek berkunci nama set; EffectKeys (jumlah pieces) sejajar dengan EffectDescriptions.
 */
export function renderedSonataText(
	fetterDetails: Record<string, { EffectKeys?: number[]; EffectDescriptions?: string[] }> | undefined,
	setName: string,
	pieces: number
): string | null {
	const d = fetterDetails?.[setName];
	const k = d?.EffectKeys?.indexOf(pieces) ?? -1;
	return k >= 0 ? (d?.EffectDescriptions?.[k] ?? null) : null;
}
