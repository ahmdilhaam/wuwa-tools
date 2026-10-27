// Shared data types for the WuWa knowledge library.

/** Hand-written bilingual text. */
export interface LocalizedText {
	id: string;
	en: string;
}

export type Element = 'aero' | 'glacio' | 'fusion' | 'electro' | 'spectro' | 'havoc';
export type WeaponType = 'Sword' | 'Broadblade' | 'Pistols' | 'Gauntlets' | 'Rectifier';

/** One section of character data: the original label from the source, a single-line value, and sub-bullets. */
export interface CharacterSection {
	label: string;
	value: string;
	/** Nested sub-bullets; inline markdown text is preserved. */
	items: string[];
}

export interface Character {
	slug: string;
	name: string;
	element: Element;
	roles: string[];
	rarity: 4 | 5 | null;
	weaponType: WeaponType | null;
	source: string | null;
	echo: CharacterSection[];
	weapons: CharacterSection | null;
	stats: CharacterSection | null;
	forte: CharacterSection | null;
	substats: CharacterSection | null;
	teams: CharacterSection | null;
	rotation: CharacterSection | null;
	sequences: CharacterSection | null;
	notes: CharacterSection | null;
	/** Unmapped labels — never dropped. */
	other: CharacterSection[];
}

export interface EchoSet {
	name: string;
	abbrev: string[];
	/** 'universal', an element name, or 'character' */
	kind: Element | 'universal' | 'character';
	forCharacter?: string;
	/** null = bonus details not yet in the source. */
	bonuses: { twoPiece: string | null; fivePiece: string | null } | null;
	verified: boolean;
	note?: LocalizedText;
}

export interface Weapon {
	name: string;
	type: WeaponType;
	stats?: string;
	users: string[];
	notes?: LocalizedText;
	/** Correction note on the source data. */
	correction?: LocalizedText;
}

export interface SubstatRow {
	stat: string | LocalizedText;
	low: string;
	midLow: string;
	midHigh: string;
	high: string;
}
