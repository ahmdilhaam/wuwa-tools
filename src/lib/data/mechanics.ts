// Mekanik universal (dari universal-mechanics.md): teks Indonesia ditulis ulang, teks Inggris
// diambil dari sumber aslinya.
import type { LocalizedText } from './types';

export interface MechanicBlock {
	id: string;
	title: LocalizedText;
	paragraphs: LocalizedText[];
}

export const mechanicBlocks: MechanicBlock[] = [
	{
		id: 'ele-vs-atk',
		title: { id: 'ELE+ELE vs ELE+ATK pada echo 3-cost', en: 'ELE+ELE vs ELE+ATK on 3-cost echoes' },
		paragraphs: [
			{
				id: 'Selisih memakai dua DMG Bonus elemen dibanding satu elemen + satu ATK% pada echo 3-cost hanya 1–3%.',
				en: 'Only 1–3% difference between using two element DMG bonuses vs one element + one ATK% on 3-cost echoes.'
			},
			{
				id: 'Aturan praktis: pilih kombinasi dengan substat yang lebih baik. Jangan mengorbankan substat bagus demi main stat "yang benar" bila selisihnya sekecil ini.',
				en: 'Practical rule: pick whichever combination has better substats. Never sacrifice good substats to chase the "correct" main stat combo if the difference is this small.'
			},
			{
				id: 'Pengecualian: sebagian karakter punya panduan khusus (mis. Jinhsi dengan sig Ages of Harvest memakai 1× Spectro DMG + 1× ATK%).',
				en: 'Exception: some characters have specific guidance (e.g. Jinhsi with Ages of Harvest sig uses 1× Spectro DMG + 1× ATK%).'
			}
		]
	},
	{
		id: 'echo-config',
		title: { id: 'Konfigurasi echo: 43311 vs 44111', en: 'Echo configuration: 43311 vs 44111' },
		paragraphs: [
			{
				id: '43311 lebih unggul dari 44111 pada kebanyakan kasus.',
				en: '43311 beats 44111 in most cases.'
			},
			{
				id: '44111 baru lebih baik bila karakter punya banyak sequence/dupe — slot 4-cost tambahan lebih bernilai saat multiplier sudah tinggi.',
				en: '44111 only becomes better when the character has many sequences/dupes: the extra 4-cost slot gives more value when multipliers are already high.'
			},
			{
				id: 'Rekomendasi default: selalu 43311 kecuali panduan karakter menyebut lain.',
				en: "Default recommendation: always go 43311 unless the character's guide says otherwise."
			}
		]
	},
	{
		id: 'sig-weapon',
		title: { id: 'Nilai senjata signature', en: 'Signature weapon value' },
		paragraphs: [
			{
				id: 'Senjata signature rata-rata memberi 10–20% DMG lebih tinggi dibanding alternatif F2P terbaik.',
				en: 'Signature weapons average 10–20% more damage than the best F2P alternative.'
			},
			{
				id: 'Main DPS: layak ditarik. Support/Sub-DPS: bersifat kemewahan — biasanya ada opsi F2P yang kuat.',
				en: 'Main DPS: worth pulling for. Supports/Sub-DPS: a luxury, as strong F2P options usually exist.'
			}
		]
	},
	{
		id: 'er-threshold',
		title: { id: 'Ambang Energy Regen', en: 'Energy Regen thresholds' },
		paragraphs: [
			{
				id: 'Ambang ER berbeda per karakter dan tim. Aturan utama:',
				en: 'ER thresholds vary by character and team. Key rules:'
			},
			{
				id: 'Karakter dengan set Tidebreaking Courage (mis. Brant) butuh minimal ambang ER agar bonus 5pc aktif.',
				en: 'Characters using the Tidebreaking Courage set (e.g. Brant) need at least the ER threshold to activate the 5pc bonus.'
			},
			{
				id: 'Support dengan Moonlit Clouds butuh ER cukup agar Outro konsisten tiap rotasi.',
				en: 'Supports in Moonlit Clouds need enough ER to Outro reliably each rotation.'
			},
			{
				id: 'Selalu cek entri karakter untuk target ER-nya.',
				en: "Always check the character's entry for their ER target."
			}
		]
	},
	{
		id: 'off-element',
		title: { id: 'Catatan set beda elemen', en: 'Notes on off-element sets' },
		paragraphs: [
			{
				id: 'Sebagian karakter memakai set beda elemen demi bonus 2pc-nya (mis. Moonlit Clouds untuk buff ATK saat Outro). Selalu cek rekomendasi set pada karakter — bisa jadi bukan set elemen aslinya.',
				en: "Some characters use off-element sets for their 2pc bonus (e.g. Moonlit Clouds for the ATK buff on Outro). Always check the character's echo set recommendation, as it may not be their element's native set."
			}
		]
	}
];

export interface ForteRow {
	skillShare: string;
	recommendation: LocalizedText;
}

/** Tabel prioritas Forte Tree: ditampilkan apa adanya dari sumber. */
export const forteRows: ForteRow[] = [
	{ skillShare: '1–9%', recommendation: { id: 'Lv1 atau Lv6', en: 'Lv1 or Lv6' } },
	{ skillShare: '≤10%', recommendation: { id: 'Minimal Lv6', en: 'At least Lv6' } },
	{ skillShare: '10–14%', recommendation: { id: 'Lv6–8, atau maks jika budget cukup', en: 'Lv6–8, or max if budget allows' } },
	{ skillShare: '≥15%', recommendation: { id: 'Lv10 (maks)', en: 'Lv10 (max)' } }
];

export const forteTableNote: LocalizedText = {
	id: 'Rentang tumpang tindih di sumber (1–9% dan ≤10%); ditampilkan apa adanya.',
	en: 'The ranges overlap in the source (1–9% and ≤10%); shown as-is.'
};

export const statTargets: { stat: string; goal: LocalizedText }[] = [
	{
		stat: 'Crit Ratio',
		goal: {
			id: '~70%:265% (senjata crit) atau 65%:225% (non-crit)',
			en: '~70%:265% (crit weapon) or 65%:225% (non-crit)'
		}
	},
	{ stat: 'ATK', goal: { id: '1800–2100+ tergantung karakter', en: '1800–2100+ depending on character' } },
	{ stat: 'ER', goal: { id: 'Bervariasi — lihat entri karakter', en: 'Varies; see the character entry' } }
];
