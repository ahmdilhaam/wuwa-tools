// Tipe data game hasil sinkronisasi dari api-v2.encore.moe (lihat scripts/sync-encore.ts).
import type { Element, WeaponType } from '#lib/data/types.ts';

export type { Element, WeaponType };

/** Teks dua bahasa. Kalau terjemahan Indonesia belum tersedia di sumber, `id` berisi salinan `en`. */
export interface Localized {
	en: string;
	id: string;
}

export interface GameCharacter {
	/** Id utama (terkecil) */
	id: number;
	/** Semua id dengan nama+elemen sama (mis. Rover laki-laki/perempuan) */
	ids: number[];
	slug: string;
	name: string;
	element: Element;
	rarity: 4 | 5;
	weaponType: WeaponType;
	icon: string;
}

export interface SkillAttribute {
	name: string;
	/** Level 1..10, string mentah karena ada rumus seperti "53.50%*4" */
	values: string[];
	/** '%', 's', atau '' */
	unit: string;
}

export interface SkillHit {
	id: number;
	/** Jenis damage menurut sumber, mis. "Resonance Skill", "Heavy Attack" */
	damageType: string;
	/** "Damage" | "Heal" | "Shield" dst. (DmgType sumber) */
	kind: string;
	/** Stat yang jadi acuan skala: ATK, HP, DEF */
	scaling: string;
	/** Level 1..10, satuan persen (181 = 181%) */
	mv: number[];
	/** Kondisi hit (kosong dihilangkan) */
	condition?: string;
}

export interface GameSkill {
	name: string;
	type: string;
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

export interface WeaponPassive {
	name: string;
	r1: Localized;
	r2: Localized;
	r3: Localized;
	r4: Localized;
	r5: Localized;
}

export interface GameWeapon {
	id: number;
	name: string;
	type: WeaponType;
	rarity: 1 | 2 | 3 | 4 | 5;
	icon: string;
	/** ATK dasar di level 90 */
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
	/** Pecahan, 0.1 = 10% */
	res: Resistances;
}

export interface SyncMeta {
	fetchedAt: string;
	source: 'api-v2.encore.moe';
	/** Apakah teks bahasa Indonesia benar-benar tersedia dari sumber */
	idLocalized: { character: boolean; weapon: boolean; echo: boolean };
	counts: Record<string, number>;
}
