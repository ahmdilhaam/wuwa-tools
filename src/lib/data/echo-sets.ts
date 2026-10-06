import type { EchoSet } from './types';

const b = (twoPiece: string | null, fivePiece: string | null) => ({ twoPiece, fivePiece });

/** Set yang disebut di data karakter tetapi tidak ada di echo-sets.md. */
const missingDetail = (name: string): EchoSet => ({
	name,
	abbrev: [],
	kind: 'universal',
	bonuses: null,
	verified: true,
	note: 'detail belum ada di sumber'
});

export const echoSets: EchoSet[] = [
	// --- Set elemen ---
	{ name: 'Sierra Gale', abbrev: ['SG', 'Gale'], kind: 'aero', bonuses: b('Aero DMG +10%', 'Aero DMG +30% selama 15 dtk setelah Intro Skill'), verified: true },
	{ name: 'Void Thunder', abbrev: ['VT'], kind: 'electro', bonuses: b('Electro DMG +10%', 'Electro DMG +15% setelah Heavy ATK atau Skill (stack 2×, masing-masing 15 dtk)'), verified: true },
	{ name: 'Molten Rift', abbrev: ['MR'], kind: 'fusion', bonuses: b('Fusion DMG +10%', 'Fusion DMG +30% selama 15 dtk setelah Resonance Skill'), verified: true },
	{ name: 'Freezing Frost', abbrev: ['FF'], kind: 'glacio', bonuses: b('Glacio DMG +10%', 'Glacio DMG +10% setelah Basic/Heavy ATK (stack 3×, masing-masing 15 dtk)'), verified: true },
	{
		// Nama di data game saat ini "Havoc Eclipse"; "Sun-sinking Eclipse" (SSE) adalah nama lamanya.
		name: 'Havoc Eclipse',
		abbrev: ['HE', 'SSE'],
		kind: 'havoc',
		bonuses: b('Havoc DMG +10%', 'Havoc DMG +7.5% setelah Basic/Heavy ATK (stack 4×, masing-masing 15 dtk)'),
		verified: true,
		note: 'Dulu bernama Sun-sinking Eclipse; singkatan SSE masih sering dipakai komunitas.'
	},
	{ name: 'Celestial Light', abbrev: ['CL'], kind: 'spectro', bonuses: b('Spectro DMG +10%', 'Spectro DMG +30% selama 15 dtk setelah Intro Skill'), verified: true },

	// --- Set universal ---
	{ name: 'Moonlit Clouds', abbrev: ['MC', 'Moonlit'], kind: 'universal', bonuses: b('ER +10%', 'Saat Outro Skill: Resonator berikutnya mendapat ATK +22.5% selama 15 dtk'), verified: true },
	{ name: 'Rejuvenating Glow', abbrev: ['RG', 'Rejuv', 'Heal'], kind: 'universal', bonuses: b('Healing +10%', 'Menyembuhkan sekutu: ATK seluruh party +15% selama 30 dtk'), verified: true },
	{
		// Sumber hanya menulis "kondisi khusus"; rincian di bawah dari pengetahuan umum, bukan dari file sumber.
		name: 'Tidebreaking Courage',
		abbrev: ['TC'],
		kind: 'universal',
		bonuses: b('ER +10%', 'ATK +15%; saat ER ≥ 250%, semua Attribute DMG +30%'),
		verified: false,
		note: 'perlu dicek — berasal dari pengetahuan umum, bukan file sumber (sumber hanya menyebut "kondisi khusus, mis. Brant butuh ER 250%").'
	},
	{ name: 'Lingering Tunes', abbrev: ['LT'], kind: 'universal', bonuses: b('ATK +10%', 'ATK +5% tiap 1.5 dtk saat on-field (stack 4×) + Outro DMG +60%'), verified: true },
	{
		// Sumber hanya menulis "set pendukung Coordinated ATK"; rincian dari pengetahuan umum.
		name: 'Empyrean Anthem',
		abbrev: ['EA'],
		kind: 'universal',
		bonuses: b('ER +10%', 'Coordinated Attack DMG +80%; saat Coordinated Attack crit, Resonator on-field mendapat ATK +20% selama 4 dtk'),
		verified: false,
		note: 'perlu dicek — berasal dari pengetahuan umum, bukan file sumber (sumber hanya menyebut "set pendukung Coordinated ATK").'
	},

	// --- Set khusus karakter (sumber hanya memberi catatan, bukan bonus) ---
	{ name: 'Frosty Resolve', abbrev: ['FR'], kind: 'character', forCharacter: 'Carlotta', bonuses: null, verified: true, note: 'Resonance Skill DMG. Detail bonus belum ada di sumber.' },
	{ name: 'Chromatic Foam', abbrev: ['CF'], kind: 'character', forCharacter: 'Denia', bonuses: null, verified: true, note: 'Fusion Burst DMG. Detail bonus belum ada di sumber.' },
	{ name: 'Flaming Clawprint', abbrev: ['FCP'], kind: 'character', forCharacter: 'Lupa', bonuses: null, verified: true, note: 'Set khusus Lupa. Detail bonus belum ada di sumber.' },
	{ name: 'Reels of Spliced Memories', abbrev: ['RSM'], kind: 'character', forCharacter: 'Denia', bonuses: null, verified: true, note: 'Alternatif 3-cost untuk Denia. Detail bonus belum ada di sumber.' },
	{ name: 'Trailblazing Star', abbrev: ['TS'], kind: 'character', forCharacter: 'Aemeath', bonuses: null, verified: true, note: 'Set Tune Break. Detail bonus belum ada di sumber.' },
	{ name: 'Eternal Radiance', abbrev: ['ER set'], kind: 'character', forCharacter: 'Pengguna Spectro Frazzle', bonuses: null, verified: true, note: 'Hanya untuk pengguna Spectro Frazzle — Jinhsi TIDAK bisa memakainya. Detail bonus belum ada di sumber.' },
	{ name: 'Sigillum', abbrev: [], kind: 'character', forCharacter: 'Aemeath', bonuses: null, verified: true, note: 'Set Tune Rupture. Detail bonus belum ada di sumber.' },

	// --- Disebut di data karakter, tidak ada di echo-sets.md: tanpa bonus, tidak dikarang ---
	missingDetail('Windward Pilgrimage'),
	missingDetail('Midnight Veil'),
	missingDetail('Wishes of Quiet Snowfall'),
	missingDetail('Gusts of Welkin'),
	missingDetail('Dream of the Lost'),
	missingDetail('Crown of Valor'),
	missingDetail('Rite of Gilded Revelation'),
	missingDetail('Thread of Severed Fate'),
	missingDetail('Sound of True Name'),
	missingDetail('Pact of Neonlight Leap'),
	missingDetail('Law of Harmony'),
	missingDetail('Halo of Starry Radiance'),
	missingDetail("Flamewing's Shadow"),
	missingDetail('Endless Resonance')
];

export const echoSetGroups: { kind: EchoSet['kind'] | 'missing'; title: string; hint?: string }[] = [
	{ kind: 'aero', title: 'Set Elemen — Aero' },
	{ kind: 'electro', title: 'Set Elemen — Electro' },
	{ kind: 'fusion', title: 'Set Elemen — Fusion' },
	{ kind: 'glacio', title: 'Set Elemen — Glacio' },
	{ kind: 'havoc', title: 'Set Elemen — Havoc' },
	{ kind: 'spectro', title: 'Set Elemen — Spectro' },
	{ kind: 'universal', title: 'Set Universal' },
	{ kind: 'character', title: 'Set Khusus Karakter', hint: 'Dirancang untuk satu karakter dan umumnya tidak cocok untuk yang lain.' }
];

export const comboNotes: string[] = [
	'3pc [set karakter] + 2pc Moonlit Clouds — untuk tambahan buff ATK dari Outro.',
	'3pc [set elemen] + 2pc [set elemen] — untuk DMG elemen murni.',
	'5pc [set universal] — untuk mekanik tertentu (mis. Brant dengan Tidebreaking Courage).',
	'Selalu cek entri build karakter untuk kombinasi yang direkomendasikan.'
];
