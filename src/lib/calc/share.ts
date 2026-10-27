// Serializes calculator state into a query string so a calculation can be shared via link.
// Only fields that differ from defaultBuild() are written, using short keys.
import { damageTypes, defaultBuild, type BuildState, type NumField } from './build';
import { CUSTOM_ENEMY_ID, elements, enemyPresets } from './enemies';
import type { WeaponToggle } from './weapon';

export type CalcMode = 'single' | 'compare';

export interface ShareState {
	mode: CalcMode;
	single: BuildState;
	buildA: BuildState;
	buildB: BuildState;
}

type NumKey = {
	[K in keyof BuildState]: BuildState[K] extends NumField ? (NumField extends BuildState[K] ? K : never) : never;
}[keyof BuildState];

/** Free numeric fields (may be empty). */
const numKeys: Record<string, NumKey> = {
	lv: 'attackerLevel',
	st: 'scalingStat',
	cr: 'critRatePct',
	cd: 'critDmgPct',
	mv: 'mvPct',
	sl: 'pickLevel',
	fd: 'flatDmg',
	eb: 'elementBonusPct',
	tb: 'typeBonusPct',
	gb: 'generalBonusPct',
	cb: 'combatBonusPct',
	amp: 'amplifyPct',
	sp: 'specialPct',
	elv: 'enemyLevel',
	res: 'customResPct',
	dr: 'defReductionPct',
	di: 'defIgnorePct',
	rs: 'resShredPct'
};

/** Choice fields with a closed set of values. */
const enumKeys = {
	sc: { field: 'scalingType', values: ['ATK', 'HP', 'DEF'] },
	el: { field: 'element', values: elements },
	dt: { field: 'damageType', values: damageTypes.map((d) => d.id) },
	e: { field: 'enemyId', values: [...enemyPresets.map((p) => p.id), CUSTOM_ENEMY_ID] }
} as const satisfies Record<string, { field: keyof BuildState; values: readonly string[] }>;

/** Free ids (character, skill, hit, weapon); only the format is validated, data is checked on use. */
const idKeys = {
	c: 'pickCharacter',
	s: 'pickSkill',
	h: 'pickHit',
	w: 'pickWeapon'
} as const satisfies Record<string, keyof BuildState>;

const ID_PATTERN = /^[a-z0-9_-]{1,64}$/i;
const COMPARE = 'cmp';

/** Normalized NumField value: null for empty / invalid. */
function normNum(v: NumField): number | null {
	if (v === null || v === undefined || v === '') return null;
	const n = typeof v === 'number' ? v : Number(v);
	return Number.isFinite(n) ? n : null;
}

function parseNum(raw: string): number | null | undefined {
	if (raw === '') return null;
	const n = Number(raw);
	return Number.isFinite(n) ? n : undefined;
}

function encodeToggles(t: Record<number, WeaponToggle>): string {
	return Object.entries(t)
		.map(([i, v]) => `${i}.${v.on ? 1 : 0}.${v.stacks}`)
		.join(',');
}

function decodeToggles(raw: string): Record<number, WeaponToggle> {
	const out: Record<number, WeaponToggle> = {};
	for (const part of raw.split(',')) {
		const m = /^(\d{1,2})\.([01])\.(\d{1,3})$/.exec(part);
		if (!m) continue;
		const stacks = Number(m[3]);
		if (stacks < 1) continue;
		out[Number(m[1])] = { on: m[2] === '1', stacks };
	}
	return out;
}

/** [key, value] pairs for fields that differ from the defaults. */
export function encodeBuild(b: BuildState): [string, string][] {
	const d = defaultBuild();
	const out: [string, string][] = [];
	for (const [key, field] of Object.entries(idKeys)) {
		if (b[field] !== d[field]) out.push([key, b[field]]);
	}
	for (const [key, { field }] of Object.entries(enumKeys)) {
		if (b[field] !== d[field]) out.push([key, b[field]]);
	}
	for (const [key, field] of Object.entries(numKeys)) {
		const v = normNum(b[field]);
		if (v !== normNum(d[field])) out.push([key, v === null ? '' : String(v)]);
	}
	if (b.pickedMv !== null) out.push(['pmv', String(b.pickedMv)]);
	if (b.pickRefine !== d.pickRefine) out.push(['r', String(b.pickRefine)]);
	const wt = encodeToggles(b.weaponToggles);
	if (wt) out.push(['wt', wt]);
	return out;
}

/** Build a BuildState from parameters; unknown keys or invalid values are ignored. */
export function decodeBuild(get: (key: string) => string | null): BuildState {
	const b = defaultBuild();
	for (const [key, field] of Object.entries(idKeys)) {
		const raw = get(key);
		if (raw !== null && ID_PATTERN.test(raw)) b[field] = raw;
	}
	for (const [key, { field, values }] of Object.entries(enumKeys)) {
		const raw = get(key);
		if (raw !== null && (values as readonly string[]).includes(raw)) {
			(b as unknown as Record<string, string>)[field] = raw;
		}
	}
	for (const [key, field] of Object.entries(numKeys)) {
		const raw = get(key);
		if (raw === null) continue;
		const v = parseNum(raw);
		if (v !== undefined) b[field] = v;
	}
	const pmv = get('pmv');
	if (pmv !== null) {
		const v = parseNum(pmv);
		if (typeof v === 'number') b.pickedMv = v;
	}
	const r = Number(get('r'));
	if (Number.isInteger(r) && r >= 1 && r <= 5) b.pickRefine = r;
	const wt = get('wt');
	if (wt !== null) b.weaponToggles = decodeToggles(wt);
	return b;
}

/** Query string (without "?") for the whole calculator state; empty when everything is default. */
export function encodeShare(s: ShareState): string {
	const params = new URLSearchParams();
	if (s.mode === 'compare') {
		params.set('m', COMPARE);
		for (const [k, v] of encodeBuild(s.buildA)) params.set(`a.${k}`, v);
		for (const [k, v] of encodeBuild(s.buildB)) params.set(`b.${k}`, v);
	} else {
		for (const [k, v] of encodeBuild(s.single)) params.set(k, v);
	}
	return params.toString();
}

/** Inverse of encodeShare. Compare mode reads the "a." and "b." prefixes. */
export function decodeShare(search: string | URLSearchParams): ShareState {
	const params = typeof search === 'string' ? new URLSearchParams(search) : search;
	const at = (prefix: string) => (key: string) => params.get(prefix + key);
	if (params.get('m') === COMPARE) {
		return {
			mode: 'compare',
			single: defaultBuild(),
			buildA: decodeBuild(at('a.')),
			buildB: decodeBuild(at('b.'))
		};
	}
	return { mode: 'single', single: decodeBuild(at('')), buildA: defaultBuild(), buildB: defaultBuild() };
}
