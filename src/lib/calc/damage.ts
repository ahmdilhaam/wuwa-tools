// Fungsi murni kalkulator damage Wuthering Waves (tanpa Svelte).
// Semua persentase dalam bentuk pecahan internal (0.72 = 72%).

export interface DamageInput {
	/** Level penyerang */
	attackerLevel: number;
	/** Level musuh */
	enemyLevel: number;
	atk: number;
	/** Crit Rate (pecahan, 0.72) */
	critRate: number;
	/** Crit DMG sebagai pengali total (2.8 = 280%) */
	critDmg: number;
	/** Motion Value dalam persen penuh (1212.75 = 1212.75%) */
	mv: number;
	flatDmg: number;
	elementBonus: number;
	typeBonus: number;
	generalBonus: number;
	combatBonus: number;
	amplify: number;
	special: number;
	defReduction: number;
	defIgnore: number;
	/** RES dasar musuh (pecahan) */
	baseRes: number;
	resShred: number;
}

export interface DamageBreakdown {
	baseDmg: number;
	bonusPool: number;
	amplifyMultiplier: number;
	specialMultiplier: number;
	enemyDef: number;
	modifiedDef: number;
	attackerDefTerm: number;
	defFactor: number;
	effectiveRes: number;
	resFactor: number;
	critMultiplier: number;
	nonCritMultiplier: number;
	avgCritMultiplier: number;
	critDamage: number;
	nonCritDamage: number;
	avgDamage: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const safe = (v: number) => (Number.isFinite(v) ? v : 0);

export function baseDamage(atk: number, mv: number, flat: number): number {
	return (atk * mv) / 100 + flat;
}

export function enemyBaseDef(enemyLevel: number): number {
	return 792 + 8 * enemyLevel;
}

export function defFactor(
	attackerLevel: number,
	enemyLevel: number,
	defReduction = 0,
	defIgnore = 0
): { enemyDef: number; modifiedDef: number; attackerDefTerm: number; factor: number } {
	const enemyDef = enemyBaseDef(enemyLevel);
	// DEF Reduction diterapkan dulu, lalu DEF Ignore (Rule 4)
	const modifiedDef = enemyDef * (1 - defReduction) * (1 - defIgnore);
	const attackerDefTerm = 800 + 8 * attackerLevel;
	return {
		enemyDef,
		modifiedDef,
		attackerDefTerm,
		factor: attackerDefTerm / (modifiedDef + attackerDefTerm)
	};
}

export function resFactor(effectiveRes: number): number {
	if (effectiveRes < 0) return 1 - effectiveRes / 2;
	if (effectiveRes < 0.8) return 1 - effectiveRes;
	return 1 / (1 + 5 * effectiveRes);
}

export function avgCritMultiplier(critRate: number, critDmg: number): number {
	return 1 + clamp(critRate, 0, 1) * (critDmg - 1);
}

export function calculateDamage(input: DamageInput): DamageBreakdown {
	const i = input;
	const baseDmg = baseDamage(i.atk, i.mv, i.flatDmg);
	const bonusPool = 1 + i.elementBonus + i.typeBonus + i.generalBonus + i.combatBonus;
	const amplifyMultiplier = 1 + i.amplify;
	const specialMultiplier = 1 + i.special;
	const def = defFactor(i.attackerLevel, i.enemyLevel, i.defReduction, i.defIgnore);
	const effectiveRes = i.baseRes - i.resShred;
	const res = resFactor(effectiveRes);
	const critMultiplier = i.critDmg;
	const nonCritMultiplier = 1;
	const avgMult = avgCritMultiplier(i.critRate, i.critDmg);

	const common = baseDmg * bonusPool * amplifyMultiplier * specialMultiplier * def.factor * res;

	return {
		baseDmg: safe(baseDmg),
		bonusPool,
		amplifyMultiplier,
		specialMultiplier,
		enemyDef: def.enemyDef,
		modifiedDef: def.modifiedDef,
		attackerDefTerm: def.attackerDefTerm,
		defFactor: def.factor,
		effectiveRes,
		resFactor: res,
		critMultiplier,
		nonCritMultiplier,
		avgCritMultiplier: avgMult,
		critDamage: safe(common * critMultiplier),
		nonCritDamage: safe(common * nonCritMultiplier),
		avgDamage: safe(common * avgMult)
	};
}
