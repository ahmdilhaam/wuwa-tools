import type { LocalizedText, SubstatRow } from './types';

export const substatRows: SubstatRow[] = [
	{ stat: 'Crit Rate', low: '6.3–6.9%', midLow: '7.5–8.1%', midHigh: '8.7–9.3%', high: '9.9–10.5%' },
	{ stat: 'Crit DMG', low: '12.6–13.8%', midLow: '15.0–16.2%', midHigh: '17.4–18.6%', high: '19.8–21.0%' },
	{ stat: { id: 'DMG Bonus (semua tipe)', en: 'DMG Bonus (all types)' }, low: '6.4–7.1%', midLow: '7.9–8.6%', midHigh: '9.4–10.1%', high: '10.9–11.6%' },
	{ stat: 'Energy Regen', low: '6.8–7.6%', midLow: '8.4–9.2%', midHigh: '10.0–10.8%', high: '11.6–12.4%' },
	{ stat: 'DEF%', low: '8.1–9.0%', midLow: '10.0–10.9%', midHigh: '11.8–12.8%', high: '13.8–14.7%' },
	{ stat: 'Flat ATK', low: '30 (19%)', midLow: '40 (42%)', midHigh: '50 (31%)', high: '60 (8%)' },
	{ stat: 'Flat HP', low: '320–360', midLow: '390–430', midHigh: '470–510', high: '540–580' },
	{ stat: 'Flat DEF', low: '40', midLow: '50', midHigh: '60', high: '70' }
];

export const substatProbabilityNotes: LocalizedText[] = [
	{
		id: 'CR dan CD punya peluang roll yang berbeda dari substat lain — lebih sulit didapat.',
		en: 'CR and CD have a different roll probability from other substats; they are harder to hit.'
	},
	{
		id: 'Substat berikut berbagi peluang roll % yang sama: Basic%, Heavy%, Skill%, Liberation%, ATK%, HP%.',
		en: 'The following substats share the same % roll chance: Basic%, Heavy%, Skill%, Liberation%, ATK%, HP%.'
	},
	{
		id: 'Distribusi Flat ATK: 30 (19% roll), 40 (42%), 50 (31%), 60 (8%) — 40 paling umum.',
		en: 'Flat ATK distribution: 30 (19% of rolls), 40 (42%), 50 (31%), 60 (8%); 40 is most common.'
	}
];

export const substatPracticalNotes: LocalizedText[] = [
	{ id: 'Roll CR 9.9%+ = tier tinggi.', en: 'CR roll of 9.9%+ = high tier.' },
	{ id: 'Roll CD 19.8%+ = tier tinggi.', en: 'CD roll of 19.8%+ = high tier.' },
	{ id: 'Flat ATK 40 = rata-rata, 50+ = lumayan, 60 = sangat baik.', en: 'Flat ATK 40 = average, 50+ = decent, 60 = excellent.' }
];

export const substatSource: LocalizedText = {
	id: 'Dataset Chasey (~5300 sampel), diperbarui 26 Juni 2026.',
	en: "Chasey's dataset (~5300 samples), updated June 26, 2026."
};
