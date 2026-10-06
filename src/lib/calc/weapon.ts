// Kontribusi efek pasif senjata yang terpicu saat tempur (fungsi murni, tanpa Svelte).
// Efek permanen sudah ada di halaman atribut (Rule 2), jadi tidak pernah dihitung ulang di sini.
import type { GameCharacter, GameWeapon, WeaponEffect } from '#lib/data/game/types.ts';
import type { ScalingStat } from './skills.ts';

export interface WeaponToggle {
	on: boolean;
	stacks: number;
}

/** Bagian BuildState yang dibutuhkan; didefinisikan di sini agar tidak ada impor melingkar. */
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
	/** Jumlah stack yang dipakai (1 bila tidak bertumpuk) */
	stacks: number;
	/** Efek berlaku untuk hit ini (scope, stat skala, data karakter) */
	applies: boolean;
	/** Alasan tidak berlaku, dalam bahasa Indonesia */
	reason: string | null;
	/** Nilai persen setelah dikali stack (satuan persen) */
	valuePct: number;
	/** Tambahan stat skala (ATK/HP/DEF datar) untuk atkPct/hpPct/defPct, selain itu 0 */
	flat: number;
	/** Menyumbang ke perhitungan (on dan berlaku) */
	contributes: boolean;
}

export interface WeaponContribution {
	/** Tambahan datar pada stat skala */
	scalingStat: number;
	/** Delta dalam satuan persen, sama seperti isian BuildState */
	critRatePct: number;
	critDmgPct: number;
	dmgBonusPct: number;
	amplifyPct: number;
	defIgnorePct: number;
	resShredPct: number;
	effects: EffectResult[];
	/** Ada minimal satu efek yang aktif dan berlaku */
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

/** Cakupan efek cocok dengan hit ini? null/all selalu cocok, elemen cocok dengan elemen build, sisanya tipe DMG. */
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

		// Apakah efek relevan untuk hit ini?
		const s = effect.stat;
		if (s === 'energyRegen') {
			r.applies = false;
			r.reason = 'Energy Regen tidak memengaruhi damage';
		} else if (s === 'atkPct' || s === 'hpPct' || s === 'defPct') {
			const want = statOfScaling[build.scalingType];
			if (s !== want.stat) {
				r.applies = false;
				r.reason = `Hit ini berskala ${want.label}, efek ini menambah ${s === 'atkPct' ? 'ATK' : s === 'hpPct' ? 'HP' : 'DEF'}`;
			} else if (!character) {
				r.applies = false;
				r.reason = 'Pilih karakter untuk menghitung stat dasar';
			} else {
				const base = s === 'atkPct' ? character.base.atk + weapon.atk90 : s === 'hpPct' ? character.base.hp : character.base.def;
				r.flat = (base * valuePct) / 100;
			}
		} else if (!scopeMatches(effect.scope, build)) {
			r.applies = false;
			r.reason = 'Tidak berlaku untuk hit ini';
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
	all: 'semua',
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

export const scopeLabel = (scope: WeaponEffect['scope']): string => (scope ? (scopeLabels[scope] ?? scope) : '');

/** Nama stat efek untuk tampilan, mis. "Heavy Attack DMG Bonus" atau "Amplify Echo Skill". */
export function effectStatLabel(e: WeaponEffect): string {
	const sc = scopeLabel(e.scope);
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
			return e.scope === 'all' ? 'Bonus DMG (semua)' : `${sc} DMG Bonus`;
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

/** Ringkasan kontribusi satu efek, mis. "+48% Heavy Attack DMG Bonus" atau "+180 ATK". */
export function effectAmountLabel(r: EffectResult, fmt: (n: number) => string): string {
	const s = r.effect.stat;
	if (s === 'atkPct' || s === 'hpPct' || s === 'defPct') return `+${fmt(r.flat)} ${effectStatLabel(r.effect)} (+${fmt(r.valuePct)}%)`;
	return `+${fmt(r.valuePct)}% ${effectStatLabel(r.effect)}`;
}
