import { describe, expect, it } from 'vitest';
import {
	basisPointsToFraction,
	deriveUnit,
	fillParams,
	hasPlaceholder,
	renderedSonataText,
	kebab,
	parseMultiplier,
	renderRefinement,
	secondaryName,
	stripRichText
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
