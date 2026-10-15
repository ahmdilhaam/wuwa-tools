import { describe, expect, it } from 'vitest';
import type { GameSkill, SkillHit } from '#lib/data/game/types.ts';
import { sumAllSkillsMv } from './skills';

const hit = (p: Partial<SkillHit>): SkillHit => ({
	id: 1,
	damageType: 'Basic Attack',
	kind: 'Damage',
	scaling: 'ATK',
	mv: [10, 20],
	...p
});
const skill = (hits: SkillHit[]): GameSkill => ({
	name: 'S',
	type: 'Basic Attack',
	description: { en: '', id: '' },
	attributes: [],
	hits
});

describe('sumAllSkillsMv', () => {
	it('menjumlah MV semua skill pada level yang dipilih', () => {
		const skills = [skill([hit({}), hit({ id: 2, mv: [5, 7.5] })]), skill([hit({ mv: [1, 2.25] })])];
		expect(sumAllSkillsMv(skills, 2)).toEqual({ mv: 29.75, stat: 'ATK' });
	});

	it('memakai stat skala dengan total terbesar dan mengabaikan hit non-damage', () => {
		const skills = [
			skill([hit({ scaling: 'HP', mv: [50] }), hit({ mv: [30] })]),
			skill([hit({ scaling: 'HP', mv: [40] }), hit({ kind: 'Heal', scaling: 'HP', mv: [999] })])
		];
		expect(sumAllSkillsMv(skills, 1)).toEqual({ mv: 90, stat: 'HP' });
	});

	it('mengembalikan 0 ATK bila tidak ada hit damage', () => {
		expect(sumAllSkillsMv([], 10)).toEqual({ mv: 0, stat: 'ATK' });
	});
});
