import raw from './characters.json';
import type { Character, Element, WeaponType } from './types';

// Data hasil scripts/convert-characters.ts — jangan diedit manual.
export const characters = raw as Character[];

export const elementOrder: Element[] = ['aero', 'glacio', 'fusion', 'electro', 'spectro', 'havoc'];

export const weaponTypes: WeaponType[] = ['Sword', 'Broadblade', 'Pistols', 'Gauntlets', 'Rectifier'];

export const elementLabels: Record<Element, string> = {
	aero: 'Aero',
	glacio: 'Glacio',
	fusion: 'Fusion',
	electro: 'Electro',
	spectro: 'Spectro',
	havoc: 'Havoc'
};

export function getCharacter(slug: string): Character | undefined {
	return characters.find((c) => c.slug === slug);
}
