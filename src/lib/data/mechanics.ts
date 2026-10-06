// Mekanik universal (dari universal-mechanics.md), teks tampilan dalam Bahasa Indonesia.

export interface MechanicBlock {
	id: string;
	title: string;
	paragraphs: string[];
}

export const mechanicBlocks: MechanicBlock[] = [
	{
		id: 'ele-vs-atk',
		title: 'ELE+ELE vs ELE+ATK pada echo 3-cost',
		paragraphs: [
			'Selisih memakai dua DMG Bonus elemen dibanding satu elemen + satu ATK% pada echo 3-cost hanya 1–3%.',
			'Aturan praktis: pilih kombinasi dengan substat yang lebih baik. Jangan mengorbankan substat bagus demi main stat "yang benar" bila selisihnya sekecil ini.',
			'Pengecualian: sebagian karakter punya panduan khusus (mis. Jinhsi dengan sig Ages of Harvest memakai 1× Spectro DMG + 1× ATK%).'
		]
	},
	{
		id: 'echo-config',
		title: 'Konfigurasi echo: 43311 vs 44111',
		paragraphs: [
			'43311 lebih unggul dari 44111 pada kebanyakan kasus.',
			'44111 baru lebih baik bila karakter punya banyak sequence/dupe — slot 4-cost tambahan lebih bernilai saat multiplier sudah tinggi.',
			'Rekomendasi default: selalu 43311 kecuali panduan karakter menyebut lain.'
		]
	},
	{
		id: 'sig-weapon',
		title: 'Nilai senjata signature',
		paragraphs: [
			'Senjata signature rata-rata memberi 10–20% DMG lebih tinggi dibanding alternatif F2P terbaik.',
			'Main DPS: layak ditarik. Support/Sub-DPS: bersifat kemewahan — biasanya ada opsi F2P yang kuat.'
		]
	},
	{
		id: 'er-threshold',
		title: 'Ambang Energy Regen',
		paragraphs: [
			'Ambang ER berbeda per karakter dan tim. Aturan utama:',
			'Karakter dengan set Tidebreaking Courage (mis. Brant) butuh minimal ambang ER agar bonus 5pc aktif.',
			'Support dengan Moonlit Clouds butuh ER cukup agar Outro konsisten tiap rotasi.',
			'Selalu cek entri karakter untuk target ER-nya.'
		]
	},
	{
		id: 'off-element',
		title: 'Catatan set beda elemen',
		paragraphs: [
			'Sebagian karakter memakai set beda elemen demi bonus 2pc-nya (mis. Moonlit Clouds untuk buff ATK saat Outro). Selalu cek rekomendasi set pada karakter — bisa jadi bukan set elemen aslinya.'
		]
	}
];

export interface ForteRow {
	skillShare: string;
	recommendation: string;
}

/** Tabel prioritas Forte Tree — ditampilkan apa adanya dari sumber. */
export const forteRows: ForteRow[] = [
	{ skillShare: '1–9%', recommendation: 'Lv1 atau Lv6' },
	{ skillShare: '≤10%', recommendation: 'Minimal Lv6' },
	{ skillShare: '10–14%', recommendation: 'Lv6–8, atau maks jika budget cukup' },
	{ skillShare: '≥15%', recommendation: 'Lv10 (maks)' }
];

export const forteTableNote = 'Rentang tumpang tindih di sumber (1–9% dan ≤10%); ditampilkan apa adanya.';

export const statTargets: { stat: string; goal: string }[] = [
	{ stat: 'Crit Ratio', goal: '~70%:265% (senjata crit) atau 65%:225% (non-crit)' },
	{ stat: 'ATK', goal: '1800–2100+ tergantung karakter' },
	{ stat: 'ER', goal: 'Bervariasi — lihat entri karakter' }
];
