// Game data types synced from api-v2.encore.moe (see scripts/sync-encore.ts).
import type { Element, WeaponType } from '#lib/data/types.ts';

export type { Element, WeaponType };

/** Bilingual text. If the source has no Indonesian translation yet, `id` holds a copy of `en`. */
export interface Localized {
	en: string;
	id: string;
}

export interface GameCharacter {
	/** Primary id (the smallest) */
	id: number;
	/** All ids sharing the same name+element (e.g. male/female Rover) */
	ids: number[];
	slug: string;
	name: string;
	element: Element;
	rarity: 4 | 5;
	weaponType: WeaponType;
	icon: string;
	/** Character base stats at Lv90 (no weapon/echo); used to convert ATK%/HP%/DEF% to flat numbers */
	base: { atk: number; hp: number; def: number };
}

export interface SkillAttribute {
	name: string;
	/** Levels 1..10, raw strings because some are formulas like "53.50%*4" */
	values: string[];
	/** '%', 's', or '' */
	unit: string;
}

export interface SkillHit {
	id: number;
	/** Damage type per the source, e.g. "Resonance Skill", "Heavy Attack" */
	damageType: string;
	/** "Damage" | "Heal" | "Shield" etc. (the source's DmgType) */
	kind: string;
	/** Stat the scaling is based on: ATK, HP, DEF */
	scaling: string;
	/** Levels 1..10, in percent (181 = 181%) */
	mv: number[];
	/** Hit condition (empty ones omitted) */
	condition?: string;
}

export interface GameSkill {
	name: string;
	type: string;
	/** Skill icon URL; not every skill has one */
	icon?: string;
	description: Localized;
	attributes: SkillAttribute[];
	hits: SkillHit[];
}

export interface Sequence {
	index: number;
	name: string;
	description: Localized;
}

export interface CharacterSkills {
	slug: string;
	skills: GameSkill[];
	sequences: Sequence[];
}

/** Calculator DMG type id (see damageTypes in calc/build.ts) */
export type DamageTypeId = 'basic' | 'heavy' | 'skill' | 'liberation' | 'intro' | 'outro' | 'echo' | 'tuneRupture';

export type WeaponEffectStat =
	| 'atkPct'
	| 'hpPct'
	| 'defPct'
	| 'critRate'
	| 'critDmg'
	| 'dmgBonus'
	| 'amplify'
	| 'defIgnore'
	| 'resShred'
	| 'energyRegen'
	| 'other';

/** One weapon passive effect derived from template text (see parseWeaponEffects). */
export interface WeaponEffect {
	stat: WeaponEffectStat;
	/** 'all' = all DMG (e.g. Attribute DMG Bonus); null = no scope (ATK%, Crit, etc.) */
	scope: 'all' | Element | DamageTypeId | null;
	/** R1..R5 values in percent (12 = 12%) */
	values: number[];
	/** "stacking up to N times"; null if it does not stack */
	maxStacks: number | null;
	/** Heuristic: the sentence has a condition (when/after/stack/...); false = permanent, already on the attributes page */
	triggered: boolean;
	/** Effect for teammates / other resonators, not the weapon holder */
	team: boolean;
	/** Source sentence with the R1 value, for display */
	sentence: string;
	/** Indonesian translation of sentence (i18n overlay); same as sentence if not yet translated */
	sentenceId?: string;
}

export interface WeaponPassive {
	name: string;
	r1: Localized;
	r2: Localized;
	r3: Localized;
	r4: Localized;
	r5: Localized;
	effects: WeaponEffect[];
}

export interface GameWeapon {
	id: number;
	name: string;
	type: WeaponType;
	rarity: 1 | 2 | 3 | 4 | 5;
	icon: string;
	/** Base ATK at level 90 */
	atk90: number;
	secondary: { name: string; value90: number };
	passive: WeaponPassive;
}

export interface SonataBonus {
	pieces: number;
	text: Localized;
}

export interface SonataSet {
	id: number;
	name: string;
	icon: string;
	bonuses: SonataBonus[];
	echoIds: number[];
}

/** Echoes from /echo (cosmetic Phantom Appearances excluded). Names can repeat across elements, key = id. */
export interface GameEcho {
	id: number;
	name: string;
	element: Element | 'physical';
	icon: string;
	setIds: number[];
}

export type MonsterClass = 'standard' | 'elite' | 'overlord' | 'calamity';

export interface Resistances {
	physical: number;
	glacio: number;
	fusion: number;
	electro: number;
	aero: number;
	spectro: number;
	havoc: number;
}

export interface GameMonster {
	id: number;
	name: string;
	rarity: MonsterClass;
	element: Element | 'physical';
	/** Fraction, 0.1 = 10% */
	res: Resistances;
}

export interface SyncMeta {
	fetchedAt: string;
	source: 'api-v2.encore.moe';
	/** Whether Indonesian text is actually available from the source */
	idLocalized: { character: boolean; weapon: boolean; echo: boolean };
	counts: Record<string, number>;
}
