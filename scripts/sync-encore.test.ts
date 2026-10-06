import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	basisPointsToFraction,
	deriveUnit,
	fillParams,
	hasPlaceholder,
	renderedSonataText,
	kebab,
	parseMultiplier,
	parseWeaponEffects,
	classifyEffectStat,
	renderRefinement,
	secondaryName,
	stripRichText,
	toNumberTemplate,
	fromNumberTemplate,
	toIdDecimal,
	applyWeaponI18n
} from './encore-helpers';

describe('stripRichText', () => {
	it('membuang tag te/color/span dan mempertahankan teks dalam', () => {
		expect(stripRichText('Gain <te href=850032>Resolve</te> and <color=#fff>ATK</color>')).toBe(
			'Gain Resolve and ATK'
		);
	});
	it('mengubah <br> menjadi baris baru dan menangani tag rusak', () => {
		const raw =
			'<span class="a style="color:x;">Basic Attack</span></span><br><br>Deal <size=10> </span>DMG';
		expect(stripRichText(raw)).toBe('Basic Attack\n\nDeal DMG');
	});
	it('tidak memakan tanda kurang-dari biasa', () => {
		expect(stripRichText('HP < 50% &amp; ATK')).toBe('HP < 50% & ATK');
	});
});

describe('parseMultiplier', () => {
	it('mengubah string persen ke angka', () => {
		expect(parseMultiplier('181%')).toBe(181);
		expect(parseMultiplier('53.50%')).toBe(53.5);
		expect(parseMultiplier('587.50')).toBe(587.5);
	});
	it('mengembalikan null untuk rumus atau kosong', () => {
		expect(parseMultiplier('53.50%*4')).toBeNull();
		expect(parseMultiplier('')).toBeNull();
		expect(parseMultiplier(undefined)).toBeNull();
	});
});

describe('basisPointsToFraction', () => {
	it('1000 bp = 0.1', () => {
		expect(basisPointsToFraction(1000)).toBe(0.1);
		expect(basisPointsToFraction(4000)).toBe(0.4);
		expect(basisPointsToFraction(-2000)).toBe(-0.2);
		expect(basisPointsToFraction(0)).toBe(0);
	});
});

describe('fillParams & renderRefinement', () => {
	it('mengganti placeholder {i}', () => {
		expect(fillParams('ATK +{0}% for {1}s', ['12', '5'])).toBe('ATK +12% for 5s');
		expect(fillParams('x {2}', ['a'])).toBe('x {2}');
	});
	it('mengganti pola a/b/c/d/e sesuai refinement', () => {
		const desc =
			'ER <span style="c">12.8%/16%/19.2%/22.4%/25.6%</span>, max <span>3/3/3/3/3</span> stacks';
		const params = [
			{ ArrayString: ['12.8%', '16%', '19.2%', '22.4%', '25.6%'] },
			{ ArrayString: ['3', '3', '3', '3', '3'] }
		];
		expect(renderRefinement(desc, params, 1)).toBe('ER 12.8%, max 3 stacks');
		expect(renderRefinement(desc, params, 5)).toBe('ER 25.6%, max 3 stacks');
	});
	it('mendukung placeholder {i} di deskripsi', () => {
		expect(renderRefinement('DMG +{0}', [{ ArrayString: ['10%', '20%'] }], 2)).toBe('DMG +20%');
	});
});

describe('kebab, deriveUnit, secondaryName', () => {
	it('kebab', () => {
		expect(kebab('Rover: Spectro')).toBe('rover-spectro');
		expect(kebab('Yangyang: Xuanling')).toBe('yangyang-xuanling');
		expect(kebab('Xiangli Yao')).toBe('xiangli-yao');
	});
	it('deriveUnit', () => {
		expect(deriveUnit(['181.00%', '195%'], '')).toBe('%');
		expect(deriveUnit(['7', '7'], 's')).toBe('s');
		expect(deriveUnit(['16'], '')).toBe('');
	});
	it('secondaryName', () => {
		expect(secondaryName('ATK', true)).toBe('ATK%');
		expect(secondaryName('Crit. DMG', true)).toBe('Crit. DMG');
	});
});

describe('sonata: placeholder & teks terender', () => {
	it('hasPlaceholder', () => {
		expect(hasPlaceholder('Energy Regen + {0}')).toBe(true);
		expect(hasPlaceholder('Energy Regen + 10%')).toBe(false);
	});
	it('renderedSonataText mencocokkan lewat nama set dan EffectKeys', () => {
		const details = {
			'Frosty Resolve': { EffectKeys: [2, 5], EffectDescriptions: ['a', 'b'] },
			'Empyrean Anthem': { EffectKeys: [2, 5], EffectDescriptions: ['Energy Regen + 10%', 'c'] }
		};
		expect(renderedSonataText(details, 'Empyrean Anthem', 2)).toBe('Energy Regen + 10%');
		expect(renderedSonataText(details, 'Frosty Resolve', 5)).toBe('b');
		expect(renderedSonataText(details, 'Nope', 2)).toBeNull();
		expect(renderedSonataText(undefined, 'Nope', 2)).toBeNull();
	});
});

describe('parseWeaponEffects', () => {
	const verdant =
		'Increases Attribute DMG Bonus by 12%/15%/18%/21%/24%. Every time Intro Skill or Resonance Liberation is cast, increases Heavy Attack DMG Bonus by 24%/30%/36%/42%/48%, stacking up to 2/2/2/2/2 time(s). This effect lasts for 14/14/14/14/14s.';

	it('Verdant Summit: Attribute DMG permanen + Heavy Attack DMG terpicu bertumpuk 2', () => {
		const e = parseWeaponEffects(verdant);
		expect(e).toHaveLength(2);
		expect(e[0]).toMatchObject({ stat: 'dmgBonus', scope: 'all', values: [12, 15, 18, 21, 24], triggered: false, maxStacks: null });
		expect(e[1]).toMatchObject({ stat: 'dmgBonus', scope: 'heavy', values: [24, 30, 36, 42, 48], triggered: true, maxStacks: 2 });
		expect(e[1].sentence).toContain('by 24%');
	});

	it('Stringmaster: ATK% bertumpuk, ATK% tambahan saat off-field, Attribute DMG permanen', () => {
		const e = parseWeaponEffects(
			'Grants 12%/15%/18%/21%/24% Attribute DMG Bonus. When dealing Resonance Skill DMG, increases ATK by 12%/15%/18%/21%/24%, stacking up to 2/2/2/2/2 times. This effect lasts for 5/5/5/5/5s. When the wielder is not on the field, increases their ATK by an additional 12%/15%/18%/21%/24%.'
		);
		expect(e.map((x) => [x.stat, x.scope, x.triggered, x.maxStacks])).toEqual([
			['dmgBonus', 'all', false, null],
			['atkPct', null, true, 2],
			['atkPct', null, true, null]
		]);
	});

	it('Blazing Brilliance: ATK% permanen + Skill DMG per stack (maks 14)', () => {
		const e = parseWeaponEffects(
			'ATK increased by 12%/15%/18%/21%/24%. The wielder gains 1 stack of Searing Feather upon dealing damage, which can be triggered once every 0.5s, and gains 5 stacks of the same effect upon casting Resonance Skill. Each stack of Searing Feather gives 4%/5%/6%/7%/8% additional Resonance Skill DMG Bonus for up to 14 stacks. After reaching the max stacks, all stacks will be removed in 12/12/12/12/12s.'
		);
		expect(e.map((x) => [x.stat, x.scope, x.triggered, x.maxStacks])).toEqual([
			['atkPct', null, false, null],
			['dmgBonus', 'skill', true, 14]
		]);
		expect(e[1].values).toEqual([4, 5, 6, 7, 8]);
	});

	it('Static Mist: Energy Regen permanen + ATK% rekan tim (stack 1 = null)', () => {
		const e = parseWeaponEffects(
			"Increases Energy Regen by 12.8%/16%/19.2%/22.4%/25.6%. Incoming Resonator's ATK is increased by 10%/12.5%/15%/17.5%/20% for 14/14/14/14/14s, stackable for up to 1/1/1/1/1 times after the wielder casts Outro Skill."
		);
		expect(e[0]).toMatchObject({ stat: 'energyRegen', triggered: false });
		expect(e[1]).toMatchObject({ stat: 'atkPct', scope: null, triggered: true, maxStacks: null, team: true });
	});

	it('memecah satu angka ke beberapa scope dan mengenali DEF ignore, RES shred, Crit', () => {
		const lum = parseWeaponEffects(
			'When Resonance Skill is cast, increases Basic Attack DMG Bonus and Heavy Attack DMG Bonus by 20%/31%/42%/53%/64%, stacking up to 1/1/1/1/1 time(s).'
		);
		expect(lum.map((x) => x.scope)).toEqual(['basic', 'heavy']);
		const ev = parseWeaponEffects(
			"When inflicting Tune Rupture - Shifting, the wielder's Resonance Liberation DMG ignores 32%/40%/48%/56%/64% DEF and 10%/15%/20%/25%/30% Fusion RES on targets for 8/8/8/8/8s."
		);
		expect(ev.map((x) => [x.stat, x.scope])).toEqual([
			['defIgnore', 'liberation'],
			['resShred', 'fusion']
		]);
		const cr = parseWeaponEffects('Increase Crit. Rate by 8%/10%/12%/14%/16%. Casting Resonance Liberation gives 24%/30%/36%/42%/48% Basic Attack DMG Bonus for 10/10/10/10/10s.');
		expect(cr[0]).toMatchObject({ stat: 'critRate', triggered: false });
		expect(cr[1]).toMatchObject({ stat: 'dmgBonus', scope: 'basic', triggered: true });
	});

	it('Amplify, ambang HP, dan penyembuhan', () => {
		const e = parseWeaponEffects(
			"When the Resonator's HP is above 80%/80%/80%/80%/80%, increases ATK by 12%/15%/18%/21%/24%. When Resonance Skill is cast, heals 3%/3.75%/4.5%/5.25%/6% of the Resonator's Max HP. Resonance Skill DMG is Amplified by 36%/45%/54%/63%/72%."
		);
		expect(e.map((x) => [x.stat, x.scope])).toEqual([
			['atkPct', null],
			['other', null],
			['amplify', 'skill']
		]);
	});

	it('placeholder {i} dari DescParams ikut diurai', () => {
		const e = parseWeaponEffects('Increases ATK by {0}.', [{ ArrayString: ['4%', '5%', '6%', '7%', '8%'] }]);
		expect(e[0]).toMatchObject({ stat: 'atkPct', values: [4, 5, 6, 7, 8], triggered: false });
	});

	it('classifyEffectStat mengembalikan null untuk konteks tak dikenal', () => {
		expect(classifyEffectStat('Providing Healing increases ', ' of something')).toBeNull();
	});
});

describe('templat angka (i18n)', () => {
	it('mengubah titik desimal menjadi koma untuk teks Indonesia', () => {
		expect(toIdDecimal('12.8')).toBe('12,8');
		expect(toIdDecimal('14')).toBe('14');
		expect(fromNumberTemplate('sebesar {0}% selama {1} dtk', ['12.8', '14'].map(toIdDecimal))).toBe(
			'sebesar 12,8% selama 14 dtk'
		);
	});

	it('mengganti angka desimal dan persen dengan placeholder', () => {
		const { template, nums } = toNumberTemplate('Increases by 12.8%, lasting for 14s.');
		expect(template).toBe('Increases by {0}%, lasting for {1}s.');
		expect(nums).toEqual(['12.8', '14']);
		expect(fromNumberTemplate(template, nums)).toBe('Increases by 12.8%, lasting for 14s.');
	});

	it('teks tanpa angka tidak berubah', () => {
		expect(toNumberTemplate('Hello')).toEqual({ template: 'Hello', nums: [] });
	});

	it('round-trip tepat untuk semua teks pasif dan kalimat efek di weapons.json', () => {
		const weapons = JSON.parse(readFileSync(resolve(__dirname, '../src/lib/data/game/weapons.json'), 'utf8'));
		let n = 0;
		for (const w of weapons) {
			const texts: string[] = [
				...(['r1', 'r2', 'r3', 'r4', 'r5'] as const).map((k) => w.passive[k].en),
				...w.passive.effects.map((e: { sentence: string }) => e.sentence)
			];
			for (const t of texts) {
				const { template, nums } = toNumberTemplate(t);
				expect(fromNumberTemplate(template, nums)).toBe(t);
				n++;
			}
		}
		expect(n).toBeGreaterThan(500);
	});

	it('applyWeaponI18n: terjemahan valid dipakai, placeholder salah dilaporkan, kunci basi dicatat', () => {
		const mk = () => ({
			name: 'X',
			passive: {
				r1: { en: 'Up by 5%.', id: 'Up by 5%.' },
				r2: { en: 'Up by 6%.', id: 'Up by 6%.' },
				r3: { en: 'Up by 7%.', id: 'Up by 7%.' },
				r4: { en: 'Up by 8%.', id: 'Up by 8%.' },
				r5: { en: 'Up by 9%.', id: 'Up by 9%.' },
				effects: [{ sentence: 'Up by 5%.' } as { sentence: string; sentenceId?: string }]
			}
		});
		const w = mk();
		const ok = applyWeaponI18n([w], { 'Up by {0}%.': 'Naik {0}%.', 'Lama {0}': 'x' });
		expect(w.passive.r3.id).toBe('Naik 7%.');
		expect(w.passive.effects[0].sentenceId).toBe('Naik 5%.');
		expect(ok.missing).toEqual([]);
		expect(ok.stale).toEqual(['Lama {0}']);
		const w2 = mk();
		const bad = applyWeaponI18n([w2], { 'Up by {0}%.': 'Naik {0} {1}%.' });
		expect(bad.invalid).toHaveLength(1);
		expect(w2.passive.r1.id).toBe('Up by 5%.');
		expect(applyWeaponI18n([mk()], {}).missing).toEqual(['Up by {0}%.']);
	});
});
