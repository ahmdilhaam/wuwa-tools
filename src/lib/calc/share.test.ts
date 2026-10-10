import { describe, expect, it } from 'vitest';
import { defaultBuild, type BuildState } from './build';
import { decodeBuild, decodeShare, encodeBuild, encodeShare, type ShareState } from './share';

const build = (p: Partial<BuildState>): BuildState => ({ ...defaultBuild(), ...p });
const share = (p: Partial<ShareState>): ShareState => ({
	mode: 'single',
	single: defaultBuild(),
	buildA: defaultBuild(),
	buildB: defaultBuild(),
	...p
});

describe('encodeShare', () => {
	it('menghasilkan string kosong untuk state bawaan', () => {
		expect(encodeShare(share({}))).toBe('');
	});

	it('hanya menulis kolom yang berbeda dari bawaan, dengan kunci pendek', () => {
		const qs = encodeShare(share({ single: build({ pickCharacter: 'jiyan', scalingStat: 2500 }) }));
		expect(qs).toBe('c=jiyan&st=2500');
	});

	it('kolom angka berisi string dinormalkan, sama dengan bawaan tidak ditulis', () => {
		expect(encodeBuild(build({ scalingStat: '2400', critRatePct: '75.5' }))).toEqual([['cr', '75.5']]);
	});

	it('kolom yang dikosongkan ditulis sebagai nilai kosong', () => {
		expect(encodeBuild(build({ flatDmg: '', scalingStat: null }))).toEqual([
			['st', ''],
			['fd', '']
		]);
	});
});

describe('round-trip', () => {
	const full = build({
		attackerLevel: 80,
		scalingStat: 3100,
		scalingType: 'HP',
		critRatePct: 65.4,
		critDmgPct: 250,
		mvPct: 345.6,
		pickCharacter: 'jiyan',
		pickSkill: '2',
		pickHit: '1404020001',
		pickLevel: 9,
		pickedMv: 345.6,
		pickWeapon: '21020015',
		pickRefine: 3,
		weaponToggles: { 0: { on: true, stacks: 3 }, 2: { on: false, stacks: 1 } },
		flatDmg: 120,
		element: 'aero',
		elementBonusPct: 70,
		damageType: 'heavy',
		typeBonusPct: 12,
		generalBonusPct: 5,
		combatBonusPct: 20,
		amplifyPct: 30,
		specialPct: 10,
		enemyId: 'custom',
		enemyLevel: 100,
		customResPct: 20,
		defReductionPct: 8,
		defIgnorePct: 15,
		resShredPct: 10
	});

	it('mode tunggal mereproduksi semua kolom', () => {
		const s = share({ single: full });
		expect(decodeShare(encodeShare(s))).toEqual(s);
	});

	it('mode bandingkan memisahkan build A dan B', () => {
		const s = share({ mode: 'compare', buildA: full, buildB: build({ critDmgPct: 300 }) });
		const qs = encodeShare(s);
		expect(qs).toContain('m=cmp');
		expect(qs).toContain('b.cd=300');
		expect(decodeShare(qs)).toEqual(s);
	});

	it('kolom kosong tetap kosong setelah decode', () => {
		const s = share({ single: build({ flatDmg: null }) });
		expect(decodeShare(encodeShare(s)).single.flatDmg).toBeNull();
	});
});

describe('decodeShare mengabaikan parameter asing dan tidak valid', () => {
	it('kunci tak dikenal tidak memengaruhi state', () => {
		expect(decodeShare('utm_source=discord&foo=bar')).toEqual(share({}));
	});

	it('nilai tidak valid jatuh ke bawaan', () => {
		const d = defaultBuild();
		const b = decodeShare(
			'st=abc&sc=MP&el=quantum&dt=ult&e=no-such-enemy&r=9&c=../etc&pmv=x&wt=garbage,0.1.0'
		).single;
		expect(b.scalingStat).toBe(d.scalingStat);
		expect(b.scalingType).toBe(d.scalingType);
		expect(b.element).toBe(d.element);
		expect(b.damageType).toBe(d.damageType);
		expect(b.enemyId).toBe(d.enemyId);
		expect(b.pickRefine).toBe(d.pickRefine);
		expect(b.pickCharacter).toBe('');
		expect(b.pickedMv).toBeNull();
		expect(b.weaponToggles).toEqual({});
	});

	it('mode tak dikenal dibaca sebagai mode tunggal', () => {
		const s = decodeShare('m=xyz&cr=80');
		expect(s.mode).toBe('single');
		expect(s.single.critRatePct).toBe(80);
	});

	it('decodeBuild tanpa parameter sama dengan defaultBuild', () => {
		expect(decodeBuild(() => null)).toEqual(defaultBuild());
	});
});
