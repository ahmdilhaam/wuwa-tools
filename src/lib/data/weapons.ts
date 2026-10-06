import type { LocalizedText, Weapon } from './types';

export const weapons: Weapon[] = [
	{
		name: 'The Last Dance',
		// Koreksi: sumber menulis (Sword); The Last Dance adalah Pistols.
		type: 'Pistols',
		stats: 'ATK 500, CDmg 72%',
		users: ['Carlotta (BiS)', 'Chixia (BiS)'],
		notes: {
			id: 'Secondary CDmg membuatnya kuat untuk DPS yang bergantung pada crit.',
			en: 'CDmg secondary stat makes it strong for crit-scaling DPS.'
		},
		correction: { id: 'Sumber menulis Sword; dikoreksi menjadi Pistols.', en: 'The source says Sword; corrected to Pistols.' }
	},
	{ name: 'Red Spring', type: 'Sword', stats: 'ATK 587, CR 24.3%', users: ['Camellya (BiS sig)'] },
	{
		name: 'Ages of Harvest',
		type: 'Broadblade',
		stats: 'ATK 587, CR 24.3%',
		users: ['Jinhsi (BiS sig)'],
		notes: {
			id: 'Dengan senjata ini Jinhsi memakai 1× Spectro DMG + 1× ATK% pada echo 3-cost.',
			en: 'With this weapon Jinhsi uses 1× Spectro DMG + 1× ATK% on 3-cost echoes.'
		}
	},
	{ name: 'Verdant Summit', type: 'Broadblade', stats: 'ATK 587, CDmg 48.6%', users: ['Jiyan (BiS sig)'] },
	{ name: 'Wildfire Mark', type: 'Pistols', stats: 'ATK 587, CDmg 48.6%', users: ['Lupa (BiS sig)'] },
	{ name: 'Forged Dwarf Star', type: 'Pistols', stats: 'ATK 500, CR 36%', users: ['Denia (BiS sig)'] },
	{
		name: 'Unflickering Valor',
		// Koreksi: sumber menulis (Rectifier); Brant pengguna pedang, jadi Sword.
		type: 'Sword',
		stats: 'ATK 412, ER 77%',
		users: ['Brant (BiS sig)'],
		notes: {
			id: 'ER tinggi membantu Brant mencapai ambang ER 250% untuk Tidebreaking Courage.',
			en: 'High ER helps Brant reach the 250% ER threshold for Tidebreaking Courage.'
		},
		correction: {
			id: 'Sumber menulis Rectifier; dikoreksi menjadi Sword (Brant pengguna pedang).',
			en: 'The source says Rectifier; corrected to Sword (Brant uses swords).'
		}
	},
	{ name: 'Everbright Polestar', type: 'Rectifier', users: ['Aemeath (BiS sig)'], notes: { id: 'Stat belum dicatat di sumber.', en: 'Stats are not recorded in the source yet.' } }
];

export const weaponNotes: LocalizedText[] = [
	{
		id: 'Senjata signature rata-rata memberi 10–20% DMG lebih tinggi dibanding F2P terbaik.',
		en: 'Sig weapons average 10–20% more DMG than the best F2P option.'
	},
	{
		id: 'Secondary CDmg (mis. Verdant Summit, Wildfire Mark 48.6%) cocok untuk karakter yang sudah punya CR tinggi dari echo.',
		en: 'CDmg secondaries (e.g. Verdant Summit, Wildfire Mark at 48.6%) pair well with characters who already have high CR from echoes.'
	},
	{
		id: 'Secondary CR (mis. Red Spring, Ages of Harvest 24.3%) memungkinkan investasi lebih besar ke CDmg di echo.',
		en: 'CR secondaries (e.g. Red Spring, Ages of Harvest at 24.3%) let you invest more into CDmg in echoes.'
	}
];
