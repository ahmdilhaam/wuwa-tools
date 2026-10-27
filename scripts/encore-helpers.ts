// Pure functions for syncing encore.moe data (no I/O, so they are easy to test).
import type { WeaponEffect, WeaponEffectStat } from '../src/lib/data/game/types';


const ENTITIES: Record<string, string> = {
	'&nbsp;': ' ',
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'"
};

/** Strip game rich-text tags (`<te href=..>`, `<color=..>`, `<span>`, `<size=..>`), keeping the inner text. `<br>` becomes a newline. */
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

/** "181%" / "53.50%" / "587.50" -> number; formula format ("53.50%*4") or empty -> null. */
export function parseNumber(input: string | number | null | undefined): number | null {
	if (typeof input === 'number') return Number.isFinite(input) ? input : null;
	if (typeof input !== 'string') return null;
	const m = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
	return m ? Number(m[1]) : null;
}

/** Semantic alias for MV: "181%" -> 181. */
export const parseMultiplier = parseNumber;

/** Basis points -> fraction (1000 = 10% = 0.1). Rounded to avoid floating-point noise. */
export function basisPointsToFraction(bp: number): number {
	return Math.round(bp) / 10000;
}

/** Skill attribute unit: '%' if the values end in a percent sign, otherwise use the source Description (e.g. "s"). */
export function deriveUnit(values: string[], description: string): string {
	if (values.some((v) => v.includes('%'))) return '%';
	return description.trim();
}

/** kebab-case name from the English name: "Rover: Spectro" -> "rover-spectro". */
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

/** Replace placeholders `{0}`, `{1}`... with params[i] (string). Placeholders without a param are left as is. */
export function fillParams(template: string, params: string[]): string {
	return template.replace(/\{(\d+)\}/g, (m, i) => params[Number(i)] ?? m);
}

/**
 * Render the weapon passive description for refinement `rank` (1..5).
 * Supports two forms: `{i}` placeholders, or source text that already contains "a/b/c/d/e" (replaced with the value at that rank).
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
	return cleanSapTags(stripRichText(out));
}

/** Weapon secondary stat name: ratio-type ATK/HP/DEF get a '%' suffix. */
export function secondaryName(name: string, isRatio: boolean): string {
	return isRatio && ['ATK', 'HP', 'DEF'].includes(name) ? `${name}%` : name;
}

/** Is there a `{n}` placeholder left unreplaced? */
export function hasPlaceholder(s: string): boolean {
	return /\{\d+\}/.test(s);
}

/**
 * Get the already-rendered sonata bonus text from the echo detail.
 *  is an object keyed by set name; EffectKeys (piece counts) are parallel to EffectDescriptions.
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

// ---------- weapon passive effects ----------

type EffectScope = WeaponEffect['scope'];

const DT_IDS: Record<string, string> = {
	'basic attack': 'basic',
	basic: 'basic',
	'heavy attack': 'heavy',
	heavy: 'heavy',
	'resonance skill': 'skill',
	'resonance liberation': 'liberation',
	'intro skill': 'intro',
	'outro skill': 'outro',
	'echo skill': 'echo'
};
const DT = 'Basic Attack|Heavy Attack|Resonance Skill|Resonance Liberation|Intro Skill|Outro Skill|Echo Skill|Basic|Heavy';
const EL = 'Glacio|Fusion|Electro|Aero|Spectro|Havoc';
const SCOPE = `(?:All-Attribute|Attribute|${DT}|${EL})`;
const SUF = '(?:\\s+DMG(?:\\s+(?:Bonus|Amplification))?|\\s+Bonus)';
const DMG_PHRASE = `${SCOPE}(?:${SUF}?(?:\\s*,\\s*|\\s+(?:and|or)\\s+)${SCOPE})*${SUF}`;
const STAT_WORD = '(?:ATK|DEF|Max HP|HP)';
const STAT_LIST = `${STAT_WORD}(?:(?:\\s*,\\s*|\\s+and\\s+)${STAT_WORD})*`;
const TAIL_DMG = /^(?:\s+(?:is|are))?(?:\s+(?:increased|amplified|increases?))?(?:\s+by)?(?:\s+an?\s+additional)?\s*$/i;
const TAIL_STAT = /^(?:\s+of\s+[^,]*?)?(?:\s+(?:is|are))?(?:\s+(?:increased|increases?))?(?:\s+by)?(?:\s+an?\s+additional)?\s*$/i;
// "Crit. " is masked to "Crit\u0001 " so its period is not treated as a sentence end
const CRIT = 'Crit\\u0001? (Rate|DMG)';

const scopeOfWord = (w: string): EffectScope => {
	const k = w.toLowerCase();
	if (k === 'attribute' || k === 'all-attribute') return 'all';
	if (DT_IDS[k]) return DT_IDS[k] as EffectScope;
	return k as EffectScope; // element
};

/** All scopes mentioned in a DMG phrase ("Basic Attack and Heavy Attack DMG Bonus"). */
function scopesOf(phrase: string): EffectScope[] {
	const out: EffectScope[] = [];
	for (const m of phrase.matchAll(new RegExp(SCOPE, 'g'))) {
		const s = scopeOfWord(m[0]);
		if (!out.includes(s)) out.push(s);
	}
	return out;
}

const statWordToEffect = (w: string): WeaponEffectStat => (w === 'ATK' ? 'atkPct' : w === 'DEF' ? 'defPct' : 'hpPct');
const statWords = (list: string) =>
	[...list.matchAll(new RegExp(STAT_WORD, 'g'))].map((x) => ({ stat: statWordToEffect(x[0]), scope: null as EffectScope }));

export interface StatHit {
	stat: WeaponEffectStat;
	scope: EffectScope;
}

/**
 * Determine the stat + scope for a single percent value, from the text before and after it
 * (within the same sentence). `null` = unrecognized (becomes 'other').
 */
export function classifyEffectStat(before: string, after: string): StatHit[] | null {
	const A = after.trimStart();
	const dmgHits = (phrase: string, tail = ''): StatHit[] => {
		const stat: WeaponEffectStat = /amplif/i.test(phrase + tail) ? 'amplify' : 'dmgBonus';
		return scopesOf(phrase).map((scope) => ({ stat, scope }));
	};

	// 1. Keyword right after the number ("24% Basic Attack DMG Bonus", "10% Fusion RES", "of the target's DEF")
	let m: RegExpMatchArray | null;
	if (/ignor/i.test(before) && /^(?:of\s+)?(?:the\s+)?(?:target'?s\s+)?DEF\b/.test(A)) {
		const sm = before.match(new RegExp(`(${DMG_PHRASE})\\s+(?:dealt\\s+)?(?:to\\s+)?ignores?\\s*$`));
		return [{ stat: 'defIgnore', scope: sm ? (scopesOf(sm[1])[0] ?? null) : null }];
	}
	if ((m = A.match(new RegExp(`^(?:of\\s+)?(?:the\\s+)?(?:target'?s\\s+)?(${EL})\\s+RES\\b`)))) {
		return [{ stat: 'resShred', scope: m[1].toLowerCase() as EffectScope }];
	}
	if ((m = A.match(new RegExp(`^${CRIT}`)))) {
		return [{ stat: m[1] === 'Rate' ? 'critRate' : 'critDmg', scope: null }];
	}
	if (/^Energy Regen/.test(A)) return [{ stat: 'energyRegen', scope: null }];
	if ((m = A.match(new RegExp(`^(?:additional\\s+)?(${STAT_LIST})\\b`)))) return statWords(m[1]);
	if ((m = A.match(new RegExp(`^(?:additional\\s+)?(${DMG_PHRASE})`)))) return dmgHits(m[1]);

	// 2. Keyword right before the number ("increases Heavy Attack DMG Bonus by", "ATK is increased by")
	if (
		(m = before.match(
			new RegExp(`${CRIT}((?:\\s+of\\s+[^,]*?)?)(?:\\s+(?:is|are))?(?:\\s+(?:increased|increases?))?(?:\\s+by)?\\s*$`, 'i')
		))
	) {
		const sc = m[2] ? scopesOf(m[2])[0] : undefined;
		return [{ stat: m[1].toLowerCase() === 'rate' ? 'critRate' : 'critDmg', scope: sc ?? null }];
	}
	// "Aero DMG dealt by nearby Resonators on the field is Amplified by"
	if ((m = before.match(new RegExp(`(${DMG_PHRASE})\\s+dealt\\s+by\\s+[^,.]*?\\s+(?:is\\s+)?(Amplified|increased)\\s+by\\s*$`)))) {
		return dmgHits(m[1], m[2]);
	}
	if (/\ball\s+DMG\b[^,.]*?\s+(?:is\s+)?(?:increased\s+)?by\s*$/i.test(before)) return [{ stat: 'dmgBonus', scope: 'all' }];
	if (/DMG taken by [^,.]*?Amplified\s+by\s*$/i.test(before)) return [{ stat: 'amplify', scope: 'all' }];
	if ((m = before.match(new RegExp(`(${EL})\\s+RES\\s+by\\s*$`)))) {
		return [{ stat: 'resShred', scope: m[1].toLowerCase() as EffectScope }];
	}
	if (/Energy Regen(?:\s+(?:is|are))?(?:\s+(?:increased|increases?))?(?:\s+by)?\s*$/i.test(before)) {
		return [{ stat: 'energyRegen', scope: null }];
	}
	let last: RegExpMatchArray | undefined;
	for (const x of before.matchAll(new RegExp(DMG_PHRASE, 'g'))) {
		if (TAIL_DMG.test(before.slice((x.index ?? 0) + x[0].length))) last = x;
	}
	if (last) return dmgHits(last[0], before.slice((last.index ?? 0) + last[0].length));
	for (const x of before.matchAll(new RegExp(STAT_LIST, 'g'))) {
		if (TAIL_STAT.test(before.slice((x.index ?? 0) + x[0].length))) last = x;
	}
	if (last) return statWords(last[0]);
	return null;
}

const TEAM_RE = /\b(?:in the team|nearby|party members|incoming resonator|all resonators|other resonators)\b/i;
const TRIGGER_RE =
	/\b(?:when|whenever|after|upon|while|within|during|if|every|each|stack\w*|casting|cast|dealing|deals?|hitting|hits?|inflict\w*|obtain\w*|perform\w*|provid\w*|appl\w*|consum\w*|switch\w*|lasting|lasts?|reach\w*|at max)\b|\bfor\s+(?:⟦\d+⟧|\d)/i;

interface ValueToken {
	nums: number[];
	pct: boolean;
	first: string;
}

/** `{Cus:Sap,S=time P=times SapTag=2}` -> plural form ("times"). */
export function cleanSapTags(s: string): string {
	return s.replace(/\{Cus:Sap,S=(\S+) P=(\S+)[^}]*\}/g, '$2');
}

/**
 * Derive structured effects from a weapon passive Desc template (per-refinement values "a/b/c/d/e" or `{i}`).
 * Sentences without a percent value are ignored; unrecognized percents become the 'other' stat (text only).
 */
export function parseWeaponEffects(desc: string, params: ParamArray[] = []): WeaponEffect[] {
	let text = stripRichText(desc);
	params.forEach((p, i) => {
		const arr = p.ArrayString ?? [];
		if (arr.length) text = text.split(`{${i}}`).join(arr.join('/'));
	});
	text = cleanSapTags(text).replace(/Crit\. /g, 'Crit\u0001 ');

	const tokens: ValueToken[] = [];
	text = text.replace(/\d+(?:\.\d+)?%?(?:\/\d+(?:\.\d+)?%?){3,4}/g, (run) => {
		const parts = run.split('/');
		while (parts.length < 5) parts.push(parts[parts.length - 1]);
		const pct = parts.some((x) => x.endsWith('%'));
		tokens.push({
			nums: parts.map((x) => parseFloat(x)),
			pct,
			first: pct && !parts[0].endsWith('%') ? `${parts[0]}%` : parts[0]
		});
		return `⟦${tokens.length - 1}⟧`;
	});

	const sentences = text
		.split('\n')
		.flatMap((l) => l.split(/(?<=[.!?])\s+(?=[A-Z⟦])/))
		.map((s) => s.trim())
		.filter(Boolean);

	const display = (s: string) => s.replace(/⟦(\d+)⟧/g, (_, k) => tokens[Number(k)].first).replace(/\u0001/g, '.');
	const stackOf = (s: string): number | null => {
		const m = s.match(/up to\s*(⟦\d+⟧|\d+)\s*(?:stack|time)/i);
		if (!m) return null;
		const n = m[1].startsWith('⟦') ? tokens[Number(m[1].slice(1, -1))].nums[0] : Number(m[1]);
		return n > 1 ? n : null;
	};

	const effects: WeaponEffect[] = [];
	let prev: WeaponEffect[] = [];
	for (const s of sentences) {
		const mine: WeaponEffect[] = [];
		const markers = [...s.matchAll(/⟦(\d+)⟧/g)];
		const triggered = TRIGGER_RE.test(s);
		const stacks = stackOf(s);
		let hasOther = false;
		markers.forEach((mk, idx) => {
			const tok = tokens[Number(mk[1])];
			if (!tok.pct) return;
			const start = mk.index ?? 0;
			const end = start + mk[0].length;
			const before = s.slice(idx > 0 ? (markers[idx - 1].index ?? 0) + markers[idx - 1][0].length : 0, start);
			const after = s.slice(end, idx + 1 < markers.length ? markers[idx + 1].index : undefined);
			if (/(?:above|below|under|at least|capped at)\s*$/i.test(before)) return;
			if (/up to\s*$/i.test(before)) {
				// "…, up to 24%" = total cap; turn it into the stack count of the previous effect
				const base = mine[mine.length - 1];
				if (base && base.values[0] > 0) base.maxStacks = Math.round(tok.nums[0] / base.values[0]) || null;
				return;
			}
			const hits = classifyEffectStat(before, after);
			const team = TEAM_RE.test(before) || TEAM_RE.test(after.split(/[,.]|\sfor\s/)[0]);
			if (!hits) {
				if (hasOther) return;
				hasOther = true;
			}
			for (const h of hits ?? [{ stat: 'other' as const, scope: null }]) {
				mine.push({
					stat: h.stat,
					scope: h.scope,
					values: tok.nums,
					maxStacks: stacks,
					triggered,
					team,
					sentence: display(s)
				});
			}
		});
		if (markers.every((mk) => !tokens[Number(mk[1])].pct) && /stacking up to|stackable/i.test(s)) {
			const n = stackOf(s);
			if (n) for (const e of prev) if (e.maxStacks === null) e.maxStacks = n;
		}
		// Labeled sentences ("Nature's Order: ... up to 24%") without a trigger word still count as triggered when stackable
		for (const e of mine) if (e.maxStacks) e.triggered = true;
		effects.push(...mine);
		prev = mine;
	}
	return effects;
}

// ---------- number templates for translation overlays ----------

const NUMBER_RE = /\d+(?:\.\d+)?/g;

/** Replace each number (including decimals) with {0}, {1}, ... in order. The % sign / unit stays outside the placeholder. */
export function toNumberTemplate(text: string): { template: string; nums: string[] } {
	const nums: string[] = [];
	const template = text.replace(NUMBER_RE, (m) => `{${nums.push(m) - 1}}`);
	return { template, nums };
}

/** "12.8" → "12,8"; integers are unchanged. */
export function toIdDecimal(num: string): string {
	return num.replace(/^(\d+)\.(\d+)$/, '$1,$2');
}

/** Inverse of toNumberTemplate: fill {n} with nums[n]. */
export function fromNumberTemplate(template: string, nums: string[]): string {
	return template.replace(/\{(\d+)\}/g, (m, i) => nums[Number(i)] ?? m);
}

/** Placeholders {n} in a template, sorted (multiset) for translation validation. */
export function placeholderMultiset(template: string): string[] {
	return (template.match(/\{\d+\}/g) ?? []).sort();
}

/**
 * Clean up leftover game template tags in skill/sequence text:
 * `{Cus:Sap,S=stack P=stacks SapTag=A}` -> singular form when preceded by the number 1, plural otherwise;
 * `{Cus:Ipt,Touch=Tapping PC=Pressing Gamepad=Pressing}` -> PC variant ("Pressing").
 */
export function cleanGameTags(s: string): string {
	return s
		.replace(/(\d+(?:\.\d+)?) \{Cus:Sap,S=(.+?) P=(.+?) SapTag=\w*\}/g, (_, n, one, many) => `${n} ${n === '1' ? one : many}`)
		.replace(/\{Cus:Sap,S=(.+?) P=(.+?) SapTag=\w*\}/g, '$2')
		.replace(/\{Cus:Ipt,Touch=.+? PC=(.+?) Gamepad=.+?\}/g, '$1');
}

/** Template/number parts of each passive text and effect sentence, for extraction + application. */
export interface WeaponI18nWeapon {
	name: string;
	passive: {
		r1: { en: string; id: string };
		r2: { en: string; id: string };
		r3: { en: string; id: string };
		r4: { en: string; id: string };
		r5: { en: string; id: string };
		effects: { sentence: string; sentenceId?: string }[];
	};
}

const RANKS = ['r1', 'r2', 'r3', 'r4', 'r5'] as const;

/** Unique templates (in order of appearance) from a list of English texts. */
export function uniqueTemplates(texts: string[]): string[] {
	const set = new Set<string>();
	for (const t of texts) if (t !== '') set.add(toNumberTemplate(t).template);
	return [...set];
}

/** All source templates (unique, sorted) from a list of weapons. */
export function collectWeaponTemplates(weapons: WeaponI18nWeapon[]): string[] {
	return uniqueTemplates(weaponTexts(weapons)).sort();
}

/** All English weapon texts in a fixed order: r1..r5, then the effect sentences per weapon. */
function weaponTexts(weapons: WeaponI18nWeapon[]): string[] {
	return weapons.flatMap((w) => [...RANKS.map((k) => w.passive[k].en), ...w.passive.effects.map((e) => e.sentence)]);
}

export interface OverlayResult {
	/** Translations parallel to `texts` (id with numbers restored); without a translation -> original text. */
	translated: string[];
	missing: string[];
	invalid: { template: string; translation: string; expected: string[]; got: string[] }[];
	stale: string[];
}

/**
 * Apply an overlay { englishTemplate: indonesianTemplate } to a list of English texts.
 * Placeholders must be identical (multiset); numbers are restored with a decimal comma.
 */
export function applyOverlay(texts: string[], overlay: Record<string, string>): OverlayResult {
	const missing = new Set<string>();
	const invalid: OverlayResult['invalid'] = [];
	const bad = new Set<string>();
	const used = new Set<string>();

	const translated = texts.map((en) => {
		if (en === '') return en; // empty description from the source: nothing to translate
		const { template, nums } = toNumberTemplate(en);
		used.add(template);
		const tr = overlay[template];
		if (tr === undefined || tr.trim() === '') {
			missing.add(template);
			return en;
		}
		const expected = placeholderMultiset(template);
		const got = placeholderMultiset(tr);
		if (expected.join() !== got.join()) {
			if (!bad.has(template)) invalid.push({ template, translation: tr, expected, got });
			bad.add(template);
			return en;
		}
		// Indonesian text uses a decimal comma (12,8%), matching the number format in the calculator.
		return fromNumberTemplate(tr, nums.map(toIdDecimal));
	});
	const stale = Object.keys(overlay).filter((k) => !used.has(k)).sort();
	return { translated, missing: [...missing].sort(), invalid, stale };
}

export type ApplyWeaponI18nResult = Omit<OverlayResult, 'translated'>;

/** Apply the overlay: fill passive.rN.id and effects[i].sentenceId (mutates in place). Without a translation -> id = en. */
export function applyWeaponI18n(weapons: WeaponI18nWeapon[], overlay: Record<string, string>): ApplyWeaponI18nResult {
	const { translated, ...rest } = applyOverlay(weaponTexts(weapons), overlay);
	let i = 0;
	for (const w of weapons) {
		for (const k of RANKS) w.passive[k].id = translated[i++];
		for (const e of w.passive.effects) e.sentenceId = translated[i++];
	}
	return rest;
}

// ---------- character skills & sequences ----------

export interface SkillI18nFile {
	slug: string;
	skills: { description: { en: string; id: string } }[];
	sequences: { description: { en: string; id: string } }[];
}

/** All English skill texts, then sequence texts, in file order. */
export function skillTexts(file: SkillI18nFile): string[] {
	return [...file.skills.map((s) => s.description.en), ...file.sequences.map((s) => s.description.en)];
}

/** Unique source templates (in file order) for one character. */
export function collectSkillTemplates(file: SkillI18nFile): string[] {
	return uniqueTemplates(skillTexts(file));
}

/** Fill skill + sequence description.id from the overlay (mutates in place). */
export function applySkillI18n(file: SkillI18nFile, overlay: Record<string, string>): ApplyWeaponI18nResult {
	const { translated, ...rest } = applyOverlay(skillTexts(file), overlay);
	let i = 0;
	for (const s of file.skills) s.description.id = translated[i++];
	for (const s of file.sequences) s.description.id = translated[i++];
	return rest;
}
