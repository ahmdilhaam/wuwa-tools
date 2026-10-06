import type { Dict } from './id.ts';
import { calc_en } from './dict/calc.en.ts';
import { library_en } from './dict/library.en.ts';

// Tipe Dict membuat kunci yang kurang atau berlebih menjadi error compile.
export const en = {
	calc: calc_en,
	library: library_en,
	layout: {
		skip: 'Skip to content',
		brandLabel: 'WuWa Tools, home',
		navLabel: 'Main navigation',
		language: 'Language',
		nav: {
			calculator: 'Calculator',
			characters: 'Resonators',
			echoSets: 'Echo sets',
			weapons: 'Weapons',
			mechanics: 'Mechanics'
		},
		footer: {
			dataFrom: 'Game data from',
			disclaimer: 'Fan project, not affiliated with Kuro Games.'
		}
	},
	characters: {
		count: '{count} resonators'
	},
	home: {
		title: 'Calculate damage, check builds.',
		lede: 'A Wuthering Waves damage calculator, plus a library of resonators, echo sets, weapons, and mechanics.',
		rosterHeading: 'Resonator list',
		searchLabel: 'Search resonators',
		searchPlaceholder: 'Search resonators',
		noResults: 'No resonator named "{query}".',
		calc: {
			title: 'Damage calculator',
			text: 'Pick a resonator and skill, enter the stats from the attributes screen, and see per-hit damage against the enemy you choose.',
			open: 'Open calculator'
		},
		library: {
			title: 'Library',
			echoSets: '{count} Sonata sets with 2pc, 3pc, and 5pc bonuses.',
			weapons: '{count} weapons with ATK, secondary stats, and R1 to R5 passives.',
			mechanics: 'General build rules, forte priorities, and substat roll ranges.'
		},
		updated: 'Game data updated {date}.'
	}
} satisfies Dict;
