// Echo scorer: each substat roll is compared against its maximum roll, then weighted
// by the character's substat priority order (free text from build data).

export type SubstatKey =
	| 'critRate'
	| 'critDmg'
	| 'atkPct'
	| 'atkFlat'
	| 'hpPct'
	| 'hpFlat'
	| 'defPct'
	| 'defFlat'
	| 'energyRegen'
	| 'basicDmg'
	| 'heavyDmg'
	| 'skillDmg'
	| 'liberationDmg';

export type RollTier = 'low' | 'midLow' | 'midHigh' | 'high';

export interface SubstatDef {
	key: SubstatKey;
	label: string;
	percent: boolean;
	/** Possible roll values, ascending. Eight values (two per tier), except Flat ATK/DEF (one per tier). */
	rolls: number[];
}

const pctRolls = [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6];

// Same ranges as the substatRows table (Chasey dataset) in src/lib/data/substats.ts.
export const substatDefs: SubstatDef[] = [
	{ key: 'critRate', label: 'Crit Rate', percent: true, rolls: [6.3, 6.9, 7.5, 8.1, 8.7, 9.3, 9.9, 10.5] },
	{ key: 'critDmg', label: 'Crit DMG', percent: true, rolls: [12.6, 13.8, 15.0, 16.2, 17.4, 18.6, 19.8, 21.0] },
	{ key: 'atkPct', label: 'ATK%', percent: true, rolls: pctRolls },
	{ key: 'atkFlat', label: 'Flat ATK', percent: false, rolls: [30, 40, 50, 60] },
	{ key: 'hpPct', label: 'HP%', percent: true, rolls: pctRolls },
	{ key: 'hpFlat', label: 'Flat HP', percent: false, rolls: [320, 360, 390, 430, 470, 510, 540, 580] },
	{ key: 'defPct', label: 'DEF%', percent: true, rolls: [8.1, 9.0, 10.0, 10.9, 11.8, 12.8, 13.8, 14.7] },
	{ key: 'defFlat', label: 'Flat DEF', percent: false, rolls: [40, 50, 60, 70] },
	{ key: 'energyRegen', label: 'Energy Regen', percent: true, rolls: [6.8, 7.6, 8.4, 9.2, 10.0, 10.8, 11.6, 12.4] },
	{ key: 'basicDmg', label: 'Basic Attack DMG', percent: true, rolls: pctRolls },
	{ key: 'heavyDmg', label: 'Heavy Attack DMG', percent: true, rolls: pctRolls },
	{ key: 'skillDmg', label: 'Resonance Skill DMG', percent: true, rolls: pctRolls },
	{ key: 'liberationDmg', label: 'Resonance Liberation DMG', percent: true, rolls: pctRolls }
];

const defByKey = new Map(substatDefs.map((d) => [d.key, d]));

export function substatDef(key: SubstatKey): SubstatDef {
	return defByKey.get(key)!;
}

/** Weight per priority group (index 0 = most important); the 7th group onward uses the last value. */
export const groupWeights = [1, 0.8, 0.6, 0.45, 0.3, 0.2, 0.1];
/** Conditional ER ("until breakpoint", "to 120%") is only useful up to the target, so its weight is capped. */
export const conditionalWeightCap = 0.5;
export const maxSubstats = 5;

/** Generic priority when no character is picked or it has no build data yet. */
export const genericPriority = 'CRIT Rate = CRIT DMG > ATK% > Energy Regen (until satisfied) > Flat ATK';

const conditionalPattern = /until|\bto\b|breakpoint|satisf|requirement|threshold|~|\d+%/i;

// Order matters: DMG types are checked before flat ATK/HP/DEF ("Basic ATK DMG%", "Skill ATK DMG%").
const aliases: [RegExp, SubstatKey][] = [
	[/\bbasic\b/i, 'basicDmg'],
	[/\bheavy\b/i, 'heavyDmg'],
	[/\blib(eration)?\b/i, 'liberationDmg'],
	[/\bskill\b/i, 'skillDmg'],
	[/^(crit(ical)? rate|cr)$/i, 'critRate'],
	[/^(crit(ical)? dmg|cd)$/i, 'critDmg'],
	[/^(er%?|energy regen%?)$/i, 'energyRegen'],
	[/^atk%$/i, 'atkPct'],
	[/^(flat atk|atk flat|atk)$/i, 'atkFlat'],
	[/^hp%$/i, 'hpPct'],
	[/^(flat hp|hp flat|hp)$/i, 'hpFlat'],
	[/^def%$/i, 'defPct'],
	[/^(flat def|def flat|def)$/i, 'defFlat']
];

function matchStat(token: string): SubstatKey | null {
	const name = token.replace(/\s+/g, ' ').trim();
	for (const [re, key] of aliases) if (re.test(name)) return key;
	return null;
}

export interface PriorityEntry {
	key: SubstatKey;
	/** Priority group index (0 = top). */
	group: number;
	conditional: boolean;
	weight: number;
}

/**
 * Parses priority text such as "ER (until breakpoint) >= CRIT Rate = CRIT DMG > ATK% > Flat ATK".
 * `>`, `>=`, `≥`, `>>>` start a new group; `=` and `/` keep the same group. Stats that appear again
 * (e.g. "ER (above 125%)") are ignored; unrecognized tokens are skipped.
 */
export function parsePriority(text: string): PriorityEntry[] {
	const entries: PriorityEntry[] = [];
	const seen = new Set<SubstatKey>();
	let group = 0;
	let groupUsed = false;
	const parts = text.split(/\s*(>>>|>=|≥|>|=|\/)\s*/);
	for (let i = 0; i < parts.length; i += 2) {
		if (i > 0 && parts[i - 1] !== '=' && parts[i - 1] !== '/' && groupUsed) {
			group++;
			groupUsed = false;
		}
		const raw = parts[i];
		const key = matchStat(raw.replace(/\([^)]*\)?/g, '').replace(/\bbonus\b/gi, ''));
		if (!key || seen.has(key)) continue;
		// Only ER gets a cap: other stats may have parenthesized notes that are not stat targets.
		const note = raw.match(/\(([^)]*)\)/)?.[1] ?? '';
		const conditional = key === 'energyRegen' && conditionalPattern.test(note);
		seen.add(key);
		groupUsed = true;
		const base = groupWeights[Math.min(group, groupWeights.length - 1)];
		entries.push({ key, group, conditional, weight: conditional ? Math.min(base, conditionalWeightCap) : base });
	}
	return entries;
}

export interface EchoSubstat {
	key: SubstatKey;
	value: number;
}

export interface ScoredSubstat extends EchoSubstat {
	/** Value ÷ maximum roll, 0–1. */
	quality: number;
	tier: RollTier;
	weight: number;
	/** Contribution to the score, 0–1 (quality × weight). */
	points: number;
	/** Value is not in the roll table; rounded to the nearest roll for the tier. */
	offTable: boolean;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface EchoScore {
	substats: ScoredSubstat[];
	/** 0–100: total points ÷ ideal echo points (the five highest-weighted stats, all at max roll). */
	score: number;
	grade: Grade;
}

const tiers: RollTier[] = ['low', 'midLow', 'midHigh', 'high'];

/** Roll tier: the nearest roll index is mapped onto the four tiers of the substat table. */
export function rollTier(key: SubstatKey, value: number): { tier: RollTier; offTable: boolean } {
	const { rolls } = substatDef(key);
	let best = 0;
	for (let i = 1; i < rolls.length; i++) if (Math.abs(rolls[i] - value) < Math.abs(rolls[best] - value)) best = i;
	const tier = tiers[Math.floor((best * tiers.length) / rolls.length)];
	return { tier, offTable: Math.abs(rolls[best] - value) > 1e-6 };
}

export const gradeThresholds: [Grade, number][] = [
	['S', 80],
	['A', 65],
	['B', 50],
	['C', 35],
	['D', 0]
];

export function gradeOf(score: number): Grade {
	return gradeThresholds.find(([, min]) => score >= min)![0];
}

export function idealPoints(priority: PriorityEntry[]): number {
	return priority
		.map((p) => p.weight)
		.sort((a, b) => b - a)
		.slice(0, maxSubstats)
		.reduce((s, w) => s + w, 0);
}

export function scoreEcho(substats: EchoSubstat[], priority: PriorityEntry[]): EchoScore {
	const weightOf = new Map(priority.map((p) => [p.key, p.weight]));
	const scored = substats.map((s) => {
		const max = substatDef(s.key).rolls.at(-1)!;
		const quality = Math.min(Math.max(s.value / max, 0), 1);
		const weight = weightOf.get(s.key) ?? 0;
		return { ...s, ...rollTier(s.key, s.value), quality, weight, points: quality * weight };
	});
	const ideal = idealPoints(priority);
	const total = scored.reduce((sum, s) => sum + s.points, 0);
	// Rounded to 1 decimal so the grade matches the displayed number (64.96 shows as "65" → A).
	const score = ideal > 0 ? Math.round(Math.min((total / ideal) * 100, 100) * 10) / 10 : 0;
	return { substats: scored, score, grade: gradeOf(score) };
}
