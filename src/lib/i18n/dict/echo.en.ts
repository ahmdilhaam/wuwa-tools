import type { echo_id } from './echo.id.ts';

// Echo scorer page dictionary (English), must follow the shape of echo_id.
export const echo_en = {
	title: 'Echo scorer',
	intro:
		"Enter up to five echo substats. Each roll is compared with its max roll, then weighted by the resonator's substat priority.",
	character: 'Resonator',
	generic: 'Generic (no resonator)',
	priority: 'Substat priority',
	priorityGeneric: 'Generic priority for ATK-scaling DPS.',
	noBuild: 'This resonator has no build data yet; using the generic priority.',
	substats: 'Substats',
	slot: 'Substat {n}',
	stat: 'Stat',
	value: 'Value',
	none: '—',
	reset: 'Clear',
	result: 'Result',
	score: 'Score',
	empty: 'Pick substats to see the score.',
	tier: {
		low: 'Low',
		midLow: 'Mid-low',
		midHigh: 'Mid-high',
		high: 'High'
	},
	quality: 'Roll quality',
	weight: 'Weight',
	points: 'Points',
	unused: 'Not prioritized',
	conditional: 'ER counts at half weight: it only helps until the ER target is met.',
	verdict: {
		S: 'Excellent — keep and use it.',
		A: 'Good — worth using and tuning.',
		B: 'Decent — a stopgap.',
		C: 'Weak — replace when you find better.',
		D: 'Poor — use it as upgrade fodder.'
	},
	method:
		'Score = Σ (value ÷ max roll × weight) ÷ an ideal echo (the five highest-weighted stats, all max rolls). Weight per priority group: 1, 0.8, 0.6, 0.45, 0.3, 0.2, 0.1. Grades: S ≥ 80, A ≥ 65, B ≥ 50, C ≥ 35.'
} satisfies typeof echo_id;
