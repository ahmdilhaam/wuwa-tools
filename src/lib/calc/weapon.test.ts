import { describe, expect, it } from 'vitest';
import type { GameCharacter, GameWeapon, WeaponEffect } from '#lib/data/game/types.ts';
import { defaultBuild, toDamageInput, type BuildState } from './build';
import { calculateDamage } from './damage';
import { scopeMatches, weaponContribution } from './weapon';

const eff = (p: Partial<WeaponEffect>): WeaponEffect => ({
	stat: 'dmgBonus',
	scope: null,
	values: [10, 20, 30, 40, 50],
	maxStacks: null,
	triggered: true,
	team: false,
	sentence: 'tes',
	...p
});

const weapon = (effects: WeaponEffect[]): GameWeapon => ({
	id: 1,
	name: 'Senjata Uji',
	type: 'Broadblade',
	rarity: 5,
	icon: '',
	atk90: 500,
	secondary: { name: 'Crit. Rate', value90: 24 },
	passive: { name: 'P', r1: { en: '', id: '' }, r2: { en: '', id: '' }, r3: { en: '', id: '' }, r4: { en: '', id: '' }, r5: { en: '', id: '' }, effects }
});

const jiyan = { base: { atk: 400, hp: 10000, def: 1000 } } as GameCharacter;

const build = (p: Partial<BuildState> = {}): BuildState => ({
	...defaultBuild(),
	element: 'aero',
	damageType: 'heavy',
	scalingType: 'ATK',
	...p
});

describe('scopeMatches', () => {
	it('null dan all selalu cocok; elemen dan tipe DMG dicocokkan dengan build', () => {
		const b = build();
		expect(scopeMatches(null, b)).toBe(true);
		expect(scopeMatches('all', b)).toBe(true);
		expect(scopeMatches('aero', b)).toBe(true);
		expect(scopeMatches('fusion', b)).toBe(false);
		expect(scopeMatches('heavy', b)).toBe(true);
		expect(scopeMatches('basic', b)).toBe(false);
	});
});

describe('weaponContribution', () => {
	it('tanpa saklar menyala kontribusinya nol', () => {
		const w = weapon([eff({ scope: 'heavy' })]);
		const c = weaponContribution(build(), w, jiyan);
		expect(c.dmgBonusPct).toBe(0);
		expect(c.active).toBe(false);
	});

	it('tanpa senjata kontribusinya nol', () => {
		expect(weaponContribution(build(), null, jiyan).active).toBe(false);
	});

	it('memilih nilai sesuai refinement', () => {
		const w = weapon([eff({ scope: 'heavy' })]);
		const toggles = { 0: { on: true, stacks: 1 } };
		expect(weaponContribution(build({ weaponToggles: toggles, pickRefine: 1 }), w, jiyan).dmgBonusPct).toBe(10);
		expect(weaponContribution(build({ weaponToggles: toggles, pickRefine: 5 }), w, jiyan).dmgBonusPct).toBe(50);
	});

	it('stack mengalikan nilai dan dijepit ke maxStacks', () => {
		const w = weapon([eff({ scope: 'heavy', maxStacks: 3 })]);
		const at = (stacks: number) => weaponContribution(build({ weaponToggles: { 0: { on: true, stacks } } }), w, jiyan).dmgBonusPct;
		expect(at(2)).toBe(20);
		expect(at(3)).toBe(30);
		expect(at(9)).toBe(30);
		expect(at(0)).toBe(10);
	});

	it('scope tak cocok: tidak berlaku, kontribusi nol, ada alasan', () => {
		const w = weapon([eff({ scope: 'basic' })]);
		const c = weaponContribution(build({ weaponToggles: { 0: { on: true, stacks: 1 } } }), w, jiyan);
		expect(c.dmgBonusPct).toBe(0);
		expect(c.effects[0].applies).toBe(false);
		expect(c.effects[0].reason).toBe('Tidak berlaku untuk hit ini');
	});

	it('scope elemen cocok dengan elemen build; all selalu berlaku', () => {
		const w = weapon([eff({ scope: 'fusion' }), eff({ scope: 'all', values: [5, 5, 5, 5, 5] })]);
		const t = { 0: { on: true, stacks: 1 }, 1: { on: true, stacks: 1 } };
		expect(weaponContribution(build({ weaponToggles: t, element: 'fusion' }), w, jiyan).dmgBonusPct).toBe(15);
		expect(weaponContribution(build({ weaponToggles: t, element: 'aero' }), w, jiyan).dmgBonusPct).toBe(5);
	});

	it('ATK% dikonversi dari (ATK dasar karakter + ATK senjata) x persen', () => {
		const w = weapon([eff({ stat: 'atkPct', values: [10, 20, 30, 40, 50] })]);
		const c = weaponContribution(build({ weaponToggles: { 0: { on: true, stacks: 1 } }, pickRefine: 2 }), w, jiyan);
		// (400 + 500) x 20% = 180
		expect(c.scalingStat).toBeCloseTo(180, 6);
	});

	it('HP% dan DEF% memakai stat dasar karakter, hanya bila cocok dengan stat skala', () => {
		const w = weapon([eff({ stat: 'hpPct', values: [10, 10, 10, 10, 10] }), eff({ stat: 'defPct', values: [10, 10, 10, 10, 10] })]);
		const t = { 0: { on: true, stacks: 1 }, 1: { on: true, stacks: 1 } };
		expect(weaponContribution(build({ weaponToggles: t, scalingType: 'HP' }), w, jiyan).scalingStat).toBeCloseTo(1000, 6);
		expect(weaponContribution(build({ weaponToggles: t, scalingType: 'DEF' }), w, jiyan).scalingStat).toBeCloseTo(100, 6);
		const atk = weaponContribution(build({ weaponToggles: t, scalingType: 'ATK' }), w, jiyan);
		expect(atk.scalingStat).toBe(0);
		expect(atk.effects[0].reason).toContain('berskala ATK');
	});

	it('ATK% tanpa karakter terpilih: tidak berlaku dengan alasan', () => {
		const w = weapon([eff({ stat: 'atkPct' })]);
		const c = weaponContribution(build({ weaponToggles: { 0: { on: true, stacks: 1 } } }), w, null);
		expect(c.scalingStat).toBe(0);
		expect(c.effects[0].reason).toBe('Pilih karakter untuk menghitung stat dasar');
	});

	it('efek permanen dan teks-saja tidak pernah dihitung (Rule 2)', () => {
		const w = weapon([eff({ triggered: false, scope: 'all' }), eff({ stat: 'other' })]);
		const c = weaponContribution(build({ weaponToggles: { 0: { on: true, stacks: 1 }, 1: { on: true, stacks: 1 } } }), w, jiyan);
		expect(c.dmgBonusPct).toBe(0);
		expect(c.active).toBe(false);
		expect(c.effects.map((e) => e.kind)).toEqual(['permanent', 'text']);
	});

	it('menjumlahkan crit, amplify, DEF ignore, dan RES shred', () => {
		const w = weapon([
			eff({ stat: 'critRate' }),
			eff({ stat: 'critDmg' }),
			eff({ stat: 'amplify', scope: 'heavy' }),
			eff({ stat: 'defIgnore' }),
			eff({ stat: 'resShred', scope: 'aero' })
		]);
		const t = Object.fromEntries([0, 1, 2, 3, 4].map((i) => [i, { on: true, stacks: 1 }]));
		const c = weaponContribution(build({ weaponToggles: t }), w, jiyan);
		expect([c.critRatePct, c.critDmgPct, c.amplifyPct, c.defIgnorePct, c.resShredPct]).toEqual([10, 10, 10, 10, 10]);
	});
});

describe('toDamageInput dengan senjata', () => {
	it('menambah delta di atas isian tanpa mengubah isian pengguna', () => {
		const w = weapon([eff({ scope: 'heavy', maxStacks: 2, values: [24, 30, 36, 42, 48] })]);
		const b = build({ weaponToggles: { 0: { on: true, stacks: 2 } }, combatBonusPct: 5 });
		const before = JSON.stringify(b);
		const withW = toDamageInput(b, w, jiyan);
		const without = toDamageInput(build({ combatBonusPct: 5 }), w, jiyan);
		expect(withW.combatBonus).toBeCloseTo(0.05 + 0.48, 9);
		expect(without.combatBonus).toBeCloseTo(0.05, 9);
		expect(JSON.stringify(b)).toBe(before);
	});

	it('damage rata-rata naik sebesar rasio kolam bonus', () => {
		const w = weapon([eff({ scope: 'heavy', values: [50, 50, 50, 50, 50] })]);
		const off = calculateDamage(toDamageInput(build({ elementBonusPct: 30 }), w, jiyan)).avgDamage;
		const on = calculateDamage(toDamageInput(build({ elementBonusPct: 30, weaponToggles: { 0: { on: true, stacks: 1 } } }), w, jiyan)).avgDamage;
		// pool 1.3 -> 1.8
		expect(on / off).toBeCloseTo(1.8 / 1.3, 9);
	});
});
