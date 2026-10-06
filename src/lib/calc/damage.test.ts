import { describe, expect, it } from 'vitest';
import {
	avgCritMultiplier,
	calculateDamage,
	defFactor,
	resFactor,
	type DamageInput
} from './damage';
import { DEFAULT_ENEMY_ID, elements, enemyPresets, filterPresets, presetResFor } from './enemies';
import { isDamageHit, mapDamageType, mvAt, scalingFieldLabel, scalingOf, sumSkillMv } from './skills';
import type { GameSkill, SkillHit } from '#lib/data/game/types.ts';

describe('DEF%', () => {
	// Penyerang Lv90, tanpa DEF reduction / ignore
	it.each([
		[85, 0.508],
		[90, 0.5013],
		[100, 0.4884],
		[120, 0.4645]
	])('musuh Lv%i -> %f', (lvl, expected) => {
		expect(defFactor(90, lvl).factor).toBeCloseTo(expected, 4);
	});

	it('DEF reduction lalu DEF ignore dikalikan ke DEF musuh', () => {
		const r = defFactor(90, 90, 0.2, 0.15);
		expect(r.modifiedDef).toBeCloseTo(1512 * 0.8 * 0.85, 6);
	});
});

describe('RES factor', () => {
	it('RES negatif: 1 - res/2', () => expect(resFactor(-0.2)).toBeCloseTo(1.1, 10));
	it('0 <= RES < 0.8: 1 - res', () => {
		expect(resFactor(0)).toBe(1);
		expect(resFactor(0.1)).toBeCloseTo(0.9, 10);
		expect(resFactor(0.79)).toBeCloseTo(0.21, 10);
	});
	it('RES >= 0.8: 1 / (1 + 5 res)', () => {
		expect(resFactor(0.8)).toBeCloseTo(0.2, 10);
		expect(resFactor(1)).toBeCloseTo(1 / 6, 10);
	});
});

describe('crit', () => {
	it('rata-rata = 1 + CR * (CD - 1)', () => {
		expect(avgCritMultiplier(0.72, 2.8)).toBeCloseTo(2.296, 10);
	});
	it('CR di-clamp 0..1', () => {
		expect(avgCritMultiplier(1.5, 2.8)).toBeCloseTo(2.8, 10);
		expect(avgCritMultiplier(-1, 2.8)).toBe(1);
	});
});

describe('enemy presets', () => {
	it('6 boss lama: RES 40% hanya untuk elemen sendiri', () => {
		expect(elements).toHaveLength(6);
		const legacy = ['feilian-beringal', 'inferno-rider', 'crownless', 'tempest-mephis', 'lampylumen-myriad', 'mourning-aix'];
		for (const id of legacy) {
			const p = enemyPresets.find((e) => e.id === id)!;
			for (const el of elements) expect(p.res[el]).toBe(el === p.element ? 0.4 : 0.1);
		}
	});
});

describe('end-to-end', () => {
	// ATK 2400, MV 1212.75%, Ele 30%, musuh Lv90 vs penyerang Lv90, RES 10%, CR 72%, CD 280%
	// base    = 2400 * 12.1275               = 29106
	// pool    = 1 + 0.30 = 1.3               -> 37837.8
	// DEF%    = 1520 / (1512 + 1520)         = 0.5013193 -> 18968.8
	// RES     = 1 - 0.10 = 0.9               -> 17071.936
	// crit    = 17071.936 * 2.8              = 47801.42
	// nonCrit = 17071.936
	// avg     = 17071.936 * (1 + 0.72 * 1.8) = 17071.936 * 2.296 = 39197.17
	const input: DamageInput = {
		attackerLevel: 90,
		enemyLevel: 90,
		atk: 2400,
		critRate: 0.72,
		critDmg: 2.8,
		mv: 1212.75,
		flatDmg: 0,
		elementBonus: 0.3,
		typeBonus: 0,
		generalBonus: 0,
		combatBonus: 0,
		amplify: 0,
		special: 0,
		defReduction: 0,
		defIgnore: 0,
		baseRes: 0.1,
		resShred: 0
	};

	it('menghasilkan angka yang dihitung manual', () => {
		const r = calculateDamage(input);
		expect(r.baseDmg).toBeCloseTo(29106, 6);
		expect(r.bonusPool).toBeCloseTo(1.3, 10);
		expect(r.nonCritDamage).toBeCloseTo(17071.936, 2);
		expect(r.critDamage).toBeCloseTo(47801.42, 1);
		expect(r.avgDamage).toBeCloseTo(39197.17, 1);
	});

	it('amplify, special, flat, shred ikut terhitung', () => {
		const r = calculateDamage({ ...input, flatDmg: 100, amplify: 0.2, special: 0.1, resShred: 0.1 });
		// RES efektif 0 -> faktor 1
		const expected = (29106 + 100) * 1.3 * 1.2 * 1.1 * (1520 / 3032) * 1;
		expect(r.nonCritDamage).toBeCloseTo(expected, 4);
	});
});

describe('preset musuh dari monsters.json', () => {
	it('Feilian Beringal: RES aero 0.4, elemen lain 0.1', () => {
		expect(presetResFor('feilian-beringal', 'aero')).toBe(0.4);
		for (const el of elements.filter((e) => e !== 'aero')) {
			expect(presetResFor('feilian-beringal', el)).toBe(0.1);
		}
	});
	it('id lama tetap berlaku dan default ada', () => {
		for (const id of ['inferno-rider', 'crownless', 'tempest-mephis', 'lampylumen-myriad', 'mourning-aix']) {
			expect(enemyPresets.some((p) => p.id === id)).toBe(true);
		}
		expect(DEFAULT_ENEMY_ID).toBe('mourning-aix');
		expect(presetResFor('tidak-ada', 'aero')).toBeNull();
	});
	it('id preset unik', () => {
		expect(new Set(enemyPresets.map((p) => p.id)).size).toBe(enemyPresets.length);
	});
	it('filter rarity dan nama', () => {
		expect(filterPresets('calamity', '').every((p) => p.rarity === 'calamity')).toBe(true);
		expect(filterPresets('all', 'FEILIAN').some((p) => p.id === 'feilian-beringal')).toBe(true);
	});
});

describe('skill picker helper', () => {
	const mk = (kind: string, scaling: string, mv1: number): SkillHit => ({
		id: 1,
		damageType: 'Basic Attack',
		kind,
		scaling,
		mv: Array.from({ length: 10 }, (_, i) => mv1 * (i + 1))
	});
	const skill = {
		hits: [mk('Damage', 'ATK', 10), mk('Damage', 'ATK', 5.5), mk('Heal', 'ATK', 99), mk('Damage', 'HP', 7)]
	} as unknown as GameSkill;

	it('jumlah MV hanya hit Damage berskala ATK', () => {
		expect(sumSkillMv(skill, 1)).toBe(15.5);
		expect(sumSkillMv(skill, 10)).toBe(155);
		expect(sumSkillMv(skill, 1, 'HP')).toBe(7);
	});
	it('level dijepit ke 1..10', () => {
		expect(mvAt(skill.hits[0], 0)).toBe(10);
		expect(mvAt(skill.hits[0], 99)).toBe(100);
	});
	it('label stat skala mengikuti hit', () => {
		const tr = (key: string, params?: Record<string, string | number>) => `${key}:${params?.stat}`;
		expect(scalingFieldLabel(scalingOf(skill.hits[3]), tr)).toBe('calc.inputs.scalingField:HP');
		expect(scalingFieldLabel(scalingOf(skill.hits[0]), tr)).toBe('calc.inputs.scalingField:ATK');
		expect(scalingOf({ ...skill.hits[0], scaling: 'Energy Regen' })).toBe('ATK');
	});
	it('heal dan Energy Regen bukan damage', () => {
		expect(isDamageHit(skill.hits[2])).toBe(false);
		expect(isDamageHit({ ...skill.hits[0], scaling: 'Energy Regen' })).toBe(false);
	});
	it('pemetaan damageType', () => {
		expect(mapDamageType('Heavy Attack')).toBe('heavy');
		expect(mapDamageType('Echo Skill')).toBe('echo');
		expect(mapDamageType('')).toBeNull();
	});
});
