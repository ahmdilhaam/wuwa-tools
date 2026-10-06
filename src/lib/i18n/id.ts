import { calc_id } from './dict/calc.id.ts';
import { library_id } from './dict/library.id.ts';
// Kamus bahasa Indonesia: sumber kebenaran struktur. en.ts harus mengikuti bentuk yang sama.
export const id = {
	calc: calc_id,
	library: library_id,
	layout: {
		skip: 'Lewati ke konten',
		brandLabel: 'WuWa Tools, beranda',
		navLabel: 'Navigasi utama',
		language: 'Bahasa',
		nav: {
			calculator: 'Kalkulator',
			characters: 'Resonator',
			echoSets: 'Echo set',
			weapons: 'Senjata',
			mechanics: 'Mekanik'
		},
		footer: {
			dataFrom: 'Data game dari',
			disclaimer: 'Proyek penggemar, tidak berafiliasi dengan Kuro Games.'
		}
	},
	characters: {
		count: '{count} resonator'
	},
	home: {
		title: 'Hitung damage, cek build.',
		lede: 'Kalkulator damage Wuthering Waves dan pustaka resonator, echo set, senjata, serta mekanik, dalam Bahasa Indonesia.',
		rosterHeading: 'Daftar resonator',
		searchLabel: 'Cari resonator',
		searchPlaceholder: 'Cari resonator',
		noResults: 'Tidak ada resonator bernama "{query}".',
		calc: {
			title: 'Kalkulator damage',
			text: 'Pilih resonator dan skill, isi stat dari halaman atribut, lalu lihat damage per hit terhadap musuh pilihanmu.',
			open: 'Buka kalkulator'
		},
		library: {
			title: 'Pustaka',
			echoSets: '{count} set Sonata dengan bonus 2pc, 3pc, dan 5pc.',
			weapons: '{count} senjata dengan ATK, stat sekunder, dan pasif R1 sampai R5.',
			mechanics: 'Aturan umum build, prioritas forte, dan rentang roll substat.'
		},
		updated: 'Data game diperbarui {date}.'
	}
};

// Tipe struktur kamus: semua daun bertipe string.
export type Dict = typeof id;
