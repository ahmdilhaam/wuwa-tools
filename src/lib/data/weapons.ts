import type { Weapon } from './types';

export const weapons: Weapon[] = [
	{
		name: 'The Last Dance',
		// Koreksi: sumber menulis (Sword); The Last Dance adalah Pistols.
		type: 'Pistols',
		stats: 'ATK 500, CDmg 72%',
		users: ['Carlotta (BiS)', 'Chixia (BiS)'],
		notes: 'Secondary CDmg membuatnya kuat untuk DPS yang bergantung pada crit.',
		correction: 'Sumber menulis Sword; dikoreksi menjadi Pistols.'
	},
	{ name: 'Red Spring', type: 'Sword', stats: 'ATK 587, CR 24.3%', users: ['Camellya (BiS sig)'] },
	{
		name: 'Ages of Harvest',
		type: 'Broadblade',
		stats: 'ATK 587, CR 24.3%',
		users: ['Jinhsi (BiS sig)'],
		notes: 'Dengan senjata ini Jinhsi memakai 1× Spectro DMG + 1× ATK% pada echo 3-cost.'
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
		notes: 'ER tinggi membantu Brant mencapai ambang ER 250% untuk Tidebreaking Courage.',
		correction: 'Sumber menulis Rectifier; dikoreksi menjadi Sword (Brant pengguna pedang).'
	},
	{ name: 'Everbright Polestar', type: 'Rectifier', users: ['Aemeath (BiS sig)'], notes: 'Stat belum dicatat di sumber.' }
];

export const weaponNotes: string[] = [
	'Senjata signature rata-rata memberi 10–20% DMG lebih tinggi dibanding F2P terbaik.',
	'Secondary CDmg (mis. Verdant Summit, Wildfire Mark 48.6%) cocok untuk karakter yang sudah punya CR tinggi dari echo.',
	'Secondary CR (mis. Red Spring, Ages of Harvest 24.3%) memungkinkan investasi lebih besar ke CDmg di echo.'
];
