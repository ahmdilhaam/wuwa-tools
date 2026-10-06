import type { library_id } from './library.id.ts';

// Kamus area library (bahasa Inggris), harus mengikuti bentuk library_id.
export const library_en = {
	pageTitle: '{name} — WuWa Tools',
	stars: '{count} stars',
	toggle: {
		showOriginal: 'Show original text (English)',
		showTranslation: 'Show Indonesian translation'
	},
	characters: {
		title: 'Resonators',
		searchLabel: 'Search by name',
		searchPlaceholder: 'Search resonators',
		elementFilter: 'Element filter',
		all: 'All',
		role: 'Role',
		allRoles: 'All roles',
		weaponType: 'Weapon type',
		allWeaponTypes: 'All types',
		reset: 'Reset',
		roleNote: 'The role filter only covers resonators that have build data.',
		noBuild: 'No build data yet',
		empty: 'No resonators match the filters.'
	},
	detail: {
		notFound: 'Character not found',
		back: 'All resonators',
		source: 'Source: {source}',
		subnavLabel: 'Page sections',
		noBuildNotice: 'No build data for this resonator yet. The skill and sequence data below come from the game.',
		gameTextEnglish: 'Game text (English)',
		description: 'Description',
		skillLevel: 'Skill level',
		section: {
			build: 'Build',
			skill: 'Skill',
			motionValue: 'Motion value',
			sequence: 'Sequence'
		},
		block: {
			echo: 'Echo',
			weapons: 'Weapons',
			stats: 'Stats',
			forte: 'Forte',
			substats: 'Substats',
			teams: 'Teams',
			rotation: 'Rotation',
			sequences: 'Sequence priority',
			notes: 'Notes',
			other: 'Other'
		},
		mv: {
			damageType: 'Damage type',
			scaling: 'Scaling',
			kind: 'Kind',
			column: 'MV Lv {level}'
		}
	},
	echoSets: {
		title: 'Echo sets',
		intro: '{count} Sonata sets. Bonus text is from the game; abbreviations and notes are hand-written.',
		searchLabel: 'Search sets',
		searchPlaceholder: 'Search by set or abbreviation',
		count: '{count} sets',
		set: 'Set',
		abbreviation: 'Abbreviation',
		echoes: 'Echoes',
		bonus: 'Bonus',
		empty: 'No sets match.',
		comboHeading: 'Common 3pc + 2pc combos'
	},
	weapons: {
		title: 'Weapons',
		introCount: '{count} weapons.',
		introPassiveEnglish: 'Passive text is from the game (English).',
		introUsers: 'The users column is hand-written.',
		searchLabel: 'Search weapons',
		searchPlaceholder: 'Search weapons',
		type: 'Type',
		allTypes: 'All types',
		rarity: 'Rarity',
		allRarities: 'All',
		count: '{count} weapons',
		weapon: 'Weapon',
		atk: 'ATK Lv90',
		secondary: 'Secondary stat',
		users: 'Users',
		passive: 'Passive',
		refinement: 'Refinement {name}',
		empty: 'No weapons match.',
		notesHeading: 'General notes'
	},
	mechanics: {
		title: 'Mechanics',
		heading: 'Universal mechanics',
		intro: 'General build rules. Game version 3.4.',
		forteHeading: 'Forte tree priority',
		forteIntro: 'Based on the skill share value (amplification from passive skills).',
		skillShare: 'Skill share',
		forteRecommended: 'Recommended forte level',
		targetsHeading: 'General stat targets',
		stat: 'Stat',
		typicalGoal: 'Typical goal',
		substatHeading: 'Substat roll ranges',
		low: 'Low',
		midLow: 'Mid-low',
		midHigh: 'Mid-high',
		high: 'High',
		probabilityHeading: 'Roll probability notes',
		practicalHeading: 'Practical use',
		practicalIntro: 'When evaluating whether an echo is good enough:'
	}
} satisfies typeof library_id;
