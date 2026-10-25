import { describe, expect, it } from 'vitest';
import characters from '#lib/data/characters.json';
import { substatRows } from '#lib/data/substats.ts';
import {
	genericPriority,
	gradeOf,
	parsePriority,
	rollTier,
	scoreEcho,
	substatDef,
	substatDefs,
	type EchoSubstat,
	type SubstatKey
} from './echoScore';

const maxRoll = (key: SubstatKey) => substatDef(key).rolls.at(-1)!;
const minRoll = (key: SubstatKey) => substatDef(key).rolls[0];

describe('tabel roll', () => {
	it('roll min/maks cocok dengan tabel substat di halaman mekanik', () => {
		const byLabel: Record<string, SubstatKey> = {
			'Crit Rate': 'critRate',
			'Crit DMG': 'critDmg',
			'Energy Regen': 'energyRegen',
			'DEF%': 'defPct',
			'Flat ATK': 'atkFlat',
			'Flat HP': 'hpFlat',
			'Flat DEF': 'defFlat',
			'DMG Bonus (all types)': 'basicDmg'
		};
		for (const row of substatRows) {
			const label = typeof row.stat === 'string' ? row.stat : row.stat.en;
			const key = byLabel[label];
			const numbers = (s: string) => s.replace(/\(.*?\)/g, '').match(/\d+(\.\d+)?/g)!.map(Number);
			expect(minRoll(key), label).toBe(numbers(row.low)[0]);
			expect(maxRoll(key), label).toBe(numbers(row.high).at(-1));
		}
	});

	it('setiap stat punya roll menaik', () => {
		for (const d of substatDefs) expect([...d.rolls].sort((a, b) => a - b)).toEqual(d.rolls);
	});

	it('tier mengikuti posisi roll', () => {
		expect(rollTier('critRate', 6.3)).toEqual({ tier: 'low', offTable: false });
		expect(rollTier('critRate', 8.1)).toEqual({ tier: 'midLow', offTable: false });
		expect(rollTier('critRate', 8.7)).toEqual({ tier: 'midHigh', offTable: false });
		expect(rollTier('critDmg', 19.8)).toEqual({ tier: 'high', offTable: false });
		expect(rollTier('atkFlat', 40)).toEqual({ tier: 'midLow', offTable: false });
		expect(rollTier('atkFlat', 60)).toEqual({ tier: 'high', offTable: false });
		expect(rollTier('critRate', 10.4)).toEqual({ tier: 'high', offTable: true });
	});
});

describe('parsePriority', () => {
	it('mengelompokkan = dan memisah >', () => {
		const p = parsePriority('ER (until breakpoint) >= CRIT Rate = CRIT DMG > ATK% > Flat ATK = Heavy DMG%');
		expect(p.map((e) => [e.key, e.group])).toEqual([
			['energyRegen', 0],
			['critRate', 1],
			['critDmg', 1],
			['atkPct', 2],
			['atkFlat', 3],
			['heavyDmg', 3]
		]);
	});

	it('membatasi bobot ER bersyarat, bukan ER tanpa target', () => {
		const [er] = parsePriority('ER (until satisfied) > CRIT Rate');
		expect(er).toMatchObject({ conditional: true, weight: 0.5 });
		const [verina] = parsePriority('ER% (Energy Regen) > ATK%');
		expect(verina).toMatchObject({ key: 'energyRegen', conditional: false, weight: 1 });
	});

	it('mengenali alias: CR/CD, Res. Skill, Basic ATK DMG, flat ATK, HP flat', () => {
		const keys = (s: string) => parsePriority(s).map((e) => e.key);
		expect(keys('CR/CD > ATK%')).toEqual(['critRate', 'critDmg', 'atkPct']);
		expect(keys('Res. Skill DMG% > Basic ATK DMG% > ATK flat > HP flat > Res. Liberation DMG')).toEqual([
			'skillDmg',
			'basicDmg',
			'atkFlat',
			'hpFlat',
			'liberationDmg'
		]);
		expect(keys('Skill ATK DMG% > flat DEF > DEF%')).toEqual(['skillDmg', 'defFlat', 'defPct']);
	});

	it('mengabaikan stat yang muncul lagi dan catatan dalam kurung', () => {
		const p = parsePriority('ER (until 250%) > CRIT Rate = CRIT DMG > ER (above 250% for extra ATK scaling) > ATK%');
		expect(p.map((e) => e.key)).toEqual(['energyRegen', 'critRate', 'critDmg', 'atkPct']);
		expect(p.find((e) => e.key === 'atkPct')!.group).toBe(2);
	});

	it('setiap karakter dengan data build menghasilkan minimal tiga stat', () => {
		for (const c of characters as { slug: string; substats: { value: string } | null }[]) {
			if (!c.substats?.value) continue;
			expect(parsePriority(c.substats.value).length, c.slug).toBeGreaterThanOrEqual(3);
		}
	});
});

describe('scoreEcho', () => {
	const generic = parsePriority(genericPriority);
	const at = (key: SubstatKey, pick: 'max' | 'min') => ({ key, value: pick === 'max' ? maxRoll(key) : minRoll(key) });

	it('lima stat teratas dengan roll maksimum = 100 (S)', () => {
		const echo = (['critRate', 'critDmg', 'atkPct', 'energyRegen', 'atkFlat'] as const).map((k) => at(k, 'max'));
		const r = scoreEcho(echo, generic);
		expect(r.score).toBeCloseTo(100);
		expect(r.grade).toBe('S');
	});

	it('crit roll tinggi + ATK% tinggi tanpa stat kelima tetap S', () => {
		const echo: EchoSubstat[] = [
			{ key: 'critRate', value: 9.9 },
			{ key: 'critDmg', value: 21 },
			{ key: 'atkPct', value: 11.6 },
			{ key: 'energyRegen', value: 10.8 },
			{ key: 'defFlat', value: 70 }
		];
		const r = scoreEcho(echo, generic);
		// (0.943 + 1 + 0.8 + 0.871×0.5) / (1 + 1 + 0.8 + 0.5 + 0.45)
		expect(r.score).toBeCloseTo(84.8, 0);
		expect(r.grade).toBe('S');
	});

	it('stat yang tidak diprioritaskan bernilai nol walau roll maksimum', () => {
		const echo = (['hpFlat', 'defFlat', 'defPct', 'hpPct', 'heavyDmg'] as const).map((k) => at(k, 'max'));
		const r = scoreEcho(echo, generic);
		expect(r.score).toBe(0);
		expect(r.grade).toBe('D');
		expect(r.substats.every((s) => s.tier === 'high')).toBe(true);
	});

	it('crit roll terendah dinilai lebih rendah dari crit roll tertinggi', () => {
		const low = scoreEcho([at('critRate', 'min'), at('critDmg', 'min')], generic);
		const high = scoreEcho([at('critRate', 'max'), at('critDmg', 'max')], generic);
		expect(low.score).toBeCloseTo(high.score * 0.6, 1);
		expect(low.substats.map((s) => s.tier)).toEqual(['low', 'low']);
	});

	it('prioritas karakter mengubah skor: HP% bernilai untuk Shorekeeper, nol untuk DPS ATK', () => {
		const echo = [at('hpPct', 'max'), at('hpFlat', 'max')];
		expect(scoreEcho(echo, parsePriority('ER% (to 250% total) > HP% > HP flat')).score).toBeGreaterThan(50);
		expect(scoreEcho(echo, generic).score).toBe(0);
	});

	it('skor dibulatkan sebelum grade: 64,96 menjadi 65 (A)', () => {
		const echo: EchoSubstat[] = [
			{ key: 'critRate', value: 8.1 },
			{ key: 'critDmg', value: 16.2 },
			{ key: 'atkPct', value: 8.6 },
			{ key: 'atkFlat', value: 40 }
		];
		const r = scoreEcho(echo, generic);
		expect(r.score).toBe(65);
		expect(r.grade).toBe('A');
	});

	it('batas grade', () => {
		expect(gradeOf(80)).toBe('S');
		expect(gradeOf(79.9)).toBe('A');
		expect(gradeOf(50)).toBe('B');
		expect(gradeOf(35)).toBe('C');
		expect(gradeOf(0)).toBe('D');
	});
});
