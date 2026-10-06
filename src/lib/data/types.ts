// Tipe data bersama untuk perpustakaan pengetahuan WuWa.

export type Element = 'aero' | 'glacio' | 'fusion' | 'electro' | 'spectro' | 'havoc';
export type WeaponType = 'Sword' | 'Broadblade' | 'Pistols' | 'Gauntlets' | 'Rectifier';

/** Satu bagian data karakter: label asli dari sumber, nilai satu baris, dan sub-bullet. */
export interface CharacterSection {
	label: string;
	value: string;
	/** Sub-bullet bersarang; teks markdown inline dipertahankan. */
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
	/** Label yang tidak terpetakan — tidak pernah dibuang. */
	other: CharacterSection[];
}

export interface EchoSet {
	name: string;
	abbrev: string[];
	/** 'universal', nama elemen, atau 'character' */
	kind: Element | 'universal' | 'character';
	forCharacter?: string;
	/** null = detail bonus belum ada di sumber. */
	bonuses: { twoPiece: string | null; fivePiece: string | null } | null;
	verified: boolean;
	note?: string;
}

export interface Weapon {
	name: string;
	type: WeaponType;
	stats?: string;
	users: string[];
	notes?: string;
	/** Catatan koreksi atas data sumber. */
	correction?: string;
}

export interface SubstatRow {
	stat: string;
	low: string;
	midLow: string;
	midHigh: string;
	high: string;
}
