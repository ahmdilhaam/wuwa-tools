// State input UI (satuan persen) dan konversi ke DamageInput (pecahan).
import type { DamageInput } from './damage';
import { CUSTOM_ENEMY_ID, DEFAULT_ENEMY_ID, presetResFor, type Element } from './enemies';
import type { ScalingStat } from './skills';

export const damageTypes = [
	{ id: 'basic', label: 'Basic Attack' },
	{ id: 'heavy', label: 'Heavy Attack' },
	{ id: 'skill', label: 'Resonance Skill' },
	{ id: 'liberation', label: 'Resonance Liberation' },
	{ id: 'intro', label: 'Intro Skill' },
	{ id: 'outro', label: 'Outro Skill' },
	{ id: 'echo', label: 'Echo Skill' },
	{ id: 'tuneRupture', label: 'Tune Rupture' }
] as const;

/** Nilai input bisa kosong (null) saat pengguna menghapus isi kolom. */
export type NumField = number | null | undefined | string;

export interface BuildState {
	attackerLevel: NumField;
	/** Nilai stat acuan skala (ATK/HP/DEF sesuai scalingType) */
	scalingStat: NumField;
	scalingType: ScalingStat;
	critRatePct: NumField;
	critDmgPct: NumField;
	mvPct: NumField;
	/** Pilihan skill picker (kosong = tidak dipakai) */
	pickCharacter: string;
	pickSkill: string;
	/** Id hit, atau 'all' untuk jumlah semua hit */
	pickHit: string;
	pickLevel: NumField;
	/** MV hasil isian picker; dipakai mendeteksi suntingan manual */
	pickedMv: number | null;
	pickWeapon: string;
	flatDmg: NumField;
	element: Element;
	elementBonusPct: NumField;
	damageType: string;
	typeBonusPct: NumField;
	generalBonusPct: NumField;
	combatBonusPct: NumField;
	amplifyPct: NumField;
	specialPct: NumField;
	enemyId: string;
	enemyLevel: NumField;
	customResPct: NumField;
	defReductionPct: NumField;
	defIgnorePct: NumField;
	resShredPct: NumField;
}

export function defaultBuild(): BuildState {
	return {
		attackerLevel: 90,
		scalingStat: 2400,
		scalingType: 'ATK',
		critRatePct: 72,
		critDmgPct: 280,
		mvPct: 1212.75,
		pickCharacter: '',
		pickSkill: '',
		pickHit: '',
		pickLevel: 10,
		pickedMv: null,
		pickWeapon: '',
		flatDmg: 0,
		element: 'spectro',
		elementBonusPct: 30,
		damageType: 'skill',
		typeBonusPct: 0,
		generalBonusPct: 0,
		combatBonusPct: 0,
		amplifyPct: 0,
		specialPct: 0,
		enemyId: DEFAULT_ENEMY_ID,
		enemyLevel: 90,
		customResPct: 10,
		defReductionPct: 0,
		defIgnorePct: 0,
		resShredPct: 0
	};
}

/** Kolom kosong / tidak valid dianggap 0. */
export function num(v: NumField): number {
	if (v === null || v === undefined || v === '') return 0;
	const n = typeof v === 'number' ? v : Number(v);
	return Number.isFinite(n) ? n : 0;
}

/** RES dasar musuh (pecahan) untuk build ini. */
export function baseResOf(b: BuildState): number {
	if (b.enemyId === CUSTOM_ENEMY_ID) return num(b.customResPct) / 100;
	return presetResFor(b.enemyId, b.element) ?? num(b.customResPct) / 100;
}

export function toDamageInput(b: BuildState): DamageInput {
	return {
		attackerLevel: num(b.attackerLevel),
		enemyLevel: num(b.enemyLevel),
		atk: num(b.scalingStat),
		critRate: num(b.critRatePct) / 100,
		critDmg: num(b.critDmgPct) / 100,
		mv: num(b.mvPct),
		flatDmg: num(b.flatDmg),
		elementBonus: num(b.elementBonusPct) / 100,
		typeBonus: num(b.typeBonusPct) / 100,
		generalBonus: num(b.generalBonusPct) / 100,
		combatBonus: num(b.combatBonusPct) / 100,
		amplify: num(b.amplifyPct) / 100,
		special: num(b.specialPct) / 100,
		defReduction: num(b.defReductionPct) / 100,
		defIgnore: num(b.defIgnorePct) / 100,
		baseRes: baseResOf(b),
		resShred: num(b.resShredPct) / 100
	};
}
