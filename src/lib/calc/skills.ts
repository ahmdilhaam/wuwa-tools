// Pure helpers for the skill picker: DMG type mapping, scaling stat labels, and MV summation.
import type { GameSkill, SkillHit } from '#lib/data/game/types.ts';
import type { DictKey, Params } from '#lib/i18n/index.svelte.ts';

/** Translate function (t from i18n), injected so this module stays pure. */
export type Translate = (key: DictKey, params?: Params) => string;

export type ScalingStat = 'ATK' | 'HP' | 'DEF';

/** Maps source damageType -> calculator DMG type id. Empty values are not mapped (null). */
const damageTypeMap: Record<string, string> = {
	'Basic Attack': 'basic',
	'Heavy Attack': 'heavy',
	'Resonance Skill': 'skill',
	'Resonance Liberation': 'liberation',
	'Intro Skill': 'intro',
	'Outro Skill': 'outro',
	'Echo Skill': 'echo',
	'Tune Rupture - Shifting': 'tuneRupture'
};

export function mapDamageType(sourceType: string): string | null {
	return damageTypeMap[sourceType] ?? null;
}

/** A hit counts as damage when its kind is Damage and it scales with ATK/HP/DEF. */
export function isDamageHit(hit: SkillHit): boolean {
	return hit.kind === 'Damage' && (hit.scaling === 'ATK' || hit.scaling === 'HP' || hit.scaling === 'DEF');
}

export function scalingOf(hit: SkillHit): ScalingStat {
	return hit.scaling === 'HP' || hit.scaling === 'DEF' ? hit.scaling : 'ATK';
}

export const scalingLabels: Record<ScalingStat, string> = {
	ATK: 'ATK',
	HP: 'HP',
	DEF: 'DEF'
};

export function scalingFieldLabel(stat: ScalingStat, tr: Translate): string {
	return tr('calc.inputs.scalingField', { stat: scalingLabels[stat] });
}

/** Hit MV at skill level 1..10 (out-of-range values are clamped). */
export function mvAt(hit: SkillHit, level: number): number {
	const i = Math.min(Math.max(Math.round(level), 1), hit.mv.length) - 1;
	return hit.mv[i] ?? 0;
}

/**
 * Sum of MV across all damage hits that scale with the reference stat (default ATK).
 * The number of hits per cast within a rotation is not modeled.
 */
export function sumSkillMv(skill: GameSkill, level: number, stat: ScalingStat = 'ATK'): number {
	const total = skill.hits
		.filter((h) => isDamageHit(h) && scalingOf(h) === stat)
		.reduce((s, h) => s + mvAt(h, level), 0);
	return Math.round(total * 100) / 100;
}

/**
 * Sum of MV across all of a character's skills, using the scaling stat with the largest total.
 * A rough estimate: each skill has a different DMG type, while the calculator uses only one.
 */
export function sumAllSkillsMv(skills: GameSkill[], level: number): { mv: number; stat: ScalingStat } {
	const stats = Object.keys(scalingLabels) as ScalingStat[];
	const totals = stats.map((stat) => skills.reduce((s, sk) => s + sumSkillMv(sk, level, stat), 0));
	const best = totals.indexOf(Math.max(...totals));
	return { mv: Math.round(totals[best] * 100) / 100, stat: stats[best] };
}
