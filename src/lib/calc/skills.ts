// Helper murni untuk skill picker: pemetaan tipe DMG, label stat skala, dan penjumlahan MV.
import type { GameSkill, SkillHit } from '#lib/data/game/types.ts';
import type { DictKey, Params } from '#lib/i18n/index.svelte.ts';

/** Fungsi terjemah (t dari i18n) yang disuntikkan agar modul ini tetap murni. */
export type Translate = (key: DictKey, params?: Params) => string;

export type ScalingStat = 'ATK' | 'HP' | 'DEF';

/** Pemetaan damageType sumber -> id tipe DMG kalkulator. Nilai kosong tidak dipetakan (null). */
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

/** Hit dihitung sebagai damage bila kind Damage dan skala ATK/HP/DEF. */
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

/** MV hit pada level skill 1..10 (di luar rentang dijepit). */
export function mvAt(hit: SkillHit, level: number): number {
	const i = Math.min(Math.max(Math.round(level), 1), hit.mv.length) - 1;
	return hit.mv[i] ?? 0;
}

/**
 * Jumlah MV semua hit damage yang berskala sama dengan stat acuan (default ATK).
 * Jumlah hit per cast dalam rotasi tidak dimodelkan.
 */
export function sumSkillMv(skill: GameSkill, level: number, stat: ScalingStat = 'ATK'): number {
	const total = skill.hits
		.filter((h) => isDamageHit(h) && scalingOf(h) === stat)
		.reduce((s, h) => s + mvAt(h, level), 0);
	return Math.round(total * 100) / 100;
}
