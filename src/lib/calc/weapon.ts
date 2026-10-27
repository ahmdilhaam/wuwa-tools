// Contribution of weapon passive effects triggered in combat (pure functions, no Svelte).
// Permanent effects are already on the attributes page (Rule 2), so they are never recounted here.
import type { GameCharacter, GameWeapon, WeaponEffect } from '#lib/data/game/types.ts';
import type { ScalingStat, Translate } from './skills.ts';
import type { DictKey, Params } from '#lib/i18n/index.svelte.ts';

export interface WeaponToggle {
	on: boolean;
	stacks: number;
}

/** The part of BuildState that is needed; defined here to avoid a circular import. */
export interface WeaponBuildInput {
	scalingType: ScalingStat;
	element: string;
	damageType: string;
	pickRefine: number;
	weaponToggles: Record<number, WeaponToggle>;
}

export type EffectKind = 'permanent' | 'text' | 'toggle';

export interface EffectResult {
	index: number;
	effect: WeaponEffect;
	kind: EffectKind;
	on: boolean;
	/** Stack count in use (1 if it does not stack) */
	stacks: number;
	/** The effect applies to this hit (scope, scaling stat, character data) */
	applies: boolean;
	/** Reason it does not apply, as a dictionary key (translated at render time) */
	reason: { key: DictKey; params?: Params } | null;
	/** Percent value after multiplying by stacks (percent units) */
	valuePct: number;
	/** Added scaling stat (flat ATK/HP/DEF) for atkPct/hpPct/defPct, otherwise 0 */
	flat: number;
	/** Contributes to the calculation (on and applicable) */
	contributes: boolean;
}

export interface WeaponContribution {
	/** Flat addition to the scaling stat */
	scalingStat: number;
	/** Delta in percent units, same as the BuildState inputs */
	critRatePct: number;
	critDmgPct: number;
	dmgBonusPct: number;
	amplifyPct: number;
	defIgnorePct: number;
	resShredPct: number;
	effects: EffectResult[];
	/** At least one effect is active and applicable */
	active: boolean;
}

export const emptyContribution = (): WeaponContribution => ({
	scalingStat: 0,
	critRatePct: 0,
	critDmgPct: 0,
	dmgBonusPct: 0,
	amplifyPct: 0,
	defIgnorePct: 0,
	resShredPct: 0,
	effects: [],
	active: false
});

export const clampRefine = (r: number): number => Math.min(Math.max(Math.round(Number.isFinite(r) ? r : 1), 1), 5);

export function defaultToggle(effect: WeaponEffect): WeaponToggle {
	return { on: false, stacks: effect.maxStacks && effect.maxStacks > 1 ? effect.maxStacks : 1 };
}

/** Does the effect scope match this hit? null/all always match, elements match the build element, anything else is a DMG type. */
export function scopeMatches(scope: WeaponEffect['scope'], build: Pick<WeaponBuildInput, 'element' | 'damageType'>): boolean {
	if (scope === null || scope === 'all') return true;
	return scope === build.element || scope === build.damageType;
}

const statOfScaling: Record<ScalingStat, { stat: 'atkPct' | 'hpPct' | 'defPct'; label: string }> = {
	ATK: { stat: 'atkPct', label: 'ATK' },
	HP: { stat: 'hpPct', label: 'HP' },
	DEF: { stat: 'defPct', label: 'DEF' }
};

export function weaponContribution(
	build: WeaponBuildInput,
	weapon: GameWeapon | null | undefined,
	character: GameCharacter | null | undefined
): WeaponContribution {
	const out = emptyContribution();
	if (!weapon) return out;
	const refine = clampRefine(build.pickRefine);

	weapon.passive.effects.forEach((effect, index) => {
		const toggle = build.weaponToggles[index] ?? defaultToggle(effect);
		const kind: EffectKind = effect.stat === 'other' ? 'text' : effect.triggered ? 'toggle' : 'permanent';
		const multi = !!effect.maxStacks && effect.maxStacks > 1;
		const stacks = multi ? Math.min(Math.max(Math.round(toggle.stacks) || 1, 1), effect.maxStacks as number) : 1;
		const valuePct = (effect.values[refine - 1] ?? effect.values[effect.values.length - 1] ?? 0) * stacks;
		const r: EffectResult = {
			index,
			effect,
			kind,
			on: kind === 'toggle' && toggle.on,
			stacks,
			applies: kind === 'toggle',
			reason: null,
			valuePct,
			flat: 0,
			contributes: false
		};
		out.effects.push(r);
		if (kind !== 'toggle') return;

		// Is the effect relevant to this hit?
		const s = effect.stat;
		if (s === 'energyRegen') {
			r.applies = false;
			r.reason = { key: 'calc.weapon.reasonEnergyRegen' };
		} else if (s === 'atkPct' || s === 'hpPct' || s === 'defPct') {
			const want = statOfScaling[build.scalingType];
			if (s !== want.stat) {
				r.applies = false;
				r.reason = {
					key: 'calc.weapon.reasonScaling',
					params: { want: want.label, got: s === 'atkPct' ? 'ATK' : s === 'hpPct' ? 'HP' : 'DEF' }
				};
			} else if (!character) {
				r.applies = false;
				r.reason = { key: 'calc.weapon.reasonNeedCharacter' };
			} else {
				const base = s === 'atkPct' ? character.base.atk + weapon.atk90 : s === 'hpPct' ? character.base.hp : character.base.def;
				r.flat = (base * valuePct) / 100;
			}
		} else if (!scopeMatches(effect.scope, build)) {
			r.applies = false;
			r.reason = { key: 'calc.weapon.reasonNotApplicable' };
		}

		r.contributes = r.on && r.applies;
		if (!r.contributes) return;
		out.active = true;
		switch (s) {
			case 'atkPct':
			case 'hpPct':
			case 'defPct':
				out.scalingStat += r.flat;
				break;
			case 'critRate':
				out.critRatePct += valuePct;
				break;
			case 'critDmg':
				out.critDmgPct += valuePct;
				break;
			case 'dmgBonus':
				out.dmgBonusPct += valuePct;
				break;
			case 'amplify':
				out.amplifyPct += valuePct;
				break;
			case 'defIgnore':
				out.defIgnorePct += valuePct;
				break;
			case 'resShred':
				out.resShredPct += valuePct;
				break;
		}
	});
	return out;
}

const scopeLabels: Record<string, string> = {
	basic: 'Basic Attack',
	heavy: 'Heavy Attack',
	skill: 'Resonance Skill',
	liberation: 'Resonance Liberation',
	intro: 'Intro Skill',
	outro: 'Outro Skill',
	echo: 'Echo Skill',
	tuneRupture: 'Tune Rupture',
	glacio: 'Glacio',
	fusion: 'Fusion',
	electro: 'Electro',
	aero: 'Aero',
	spectro: 'Spectro',
	havoc: 'Havoc'
};

export const scopeLabel = (scope: WeaponEffect['scope'], tr: Translate): string =>
	scope === 'all' ? tr('calc.weapon.allScope') : scope ? (scopeLabels[scope] ?? scope) : '';

/** Effect stat name for display, e.g. "Heavy Attack DMG Bonus" or "Amplify Echo Skill". */
export function effectStatLabel(e: WeaponEffect, tr: Translate): string {
	const sc = scopeLabel(e.scope, tr);
	switch (e.stat) {
		case 'atkPct':
			return 'ATK';
		case 'hpPct':
			return 'HP';
		case 'defPct':
			return 'DEF';
		case 'critRate':
			return 'Crit Rate';
		case 'critDmg':
			return 'Crit DMG';
		case 'dmgBonus':
			return e.scope === 'all' ? tr('calc.weapon.dmgBonusAll') : `${sc} DMG Bonus`;
		case 'amplify':
			return e.scope === 'all' || !sc ? 'Amplify' : `Amplify ${sc}`;
		case 'defIgnore':
			return 'DEF Ignore';
		case 'resShred':
			return sc ? `RES Shred ${sc}` : 'RES Shred';
		case 'energyRegen':
			return 'Energy Regen';
		default:
			return '';
	}
}

/** Summary of one effect's contribution, e.g. "+48% Heavy Attack DMG Bonus" or "+180 ATK". */
export function effectAmountLabel(r: EffectResult, fmt: (n: number) => string, tr: Translate): string {
	const s = r.effect.stat;
	if (s === 'atkPct' || s === 'hpPct' || s === 'defPct') return `+${fmt(r.flat)} ${effectStatLabel(r.effect, tr)} (+${fmt(r.valuePct)}%)`;
	return `+${fmt(r.valuePct)}% ${effectStatLabel(r.effect, tr)}`;
}
