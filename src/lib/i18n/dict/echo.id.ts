// Echo scorer page dictionary (Indonesian, source of the structure).
export const echo_id = {
	title: 'Penilai echo',
	intro:
		'Masukkan sampai lima substat echo. Setiap roll dibandingkan dengan roll maksimumnya lalu diberi bobot sesuai prioritas substat resonator.',
	character: 'Resonator',
	generic: 'Umum (tanpa resonator)',
	priority: 'Prioritas substat',
	priorityGeneric: 'Prioritas umum untuk DPS berbasis ATK.',
	noBuild: 'Resonator ini belum punya data build; memakai prioritas umum.',
	substats: 'Substat',
	slot: 'Substat {n}',
	stat: 'Stat',
	value: 'Nilai',
	none: '—',
	reset: 'Kosongkan',
	result: 'Hasil',
	score: 'Skor',
	empty: 'Pilih substat untuk melihat skor.',
	tier: {
		low: 'Rendah',
		midLow: 'Sedang-rendah',
		midHigh: 'Sedang-tinggi',
		high: 'Tinggi'
	},
	quality: 'Kualitas roll',
	weight: 'Bobot',
	points: 'Poin',
	unused: 'Tidak diprioritaskan',
	conditional: 'ER dihitung setengah bobot: hanya berguna sampai target ER tercapai.',
	verdict: {
		S: 'Sangat bagus — simpan dan pakai.',
		A: 'Bagus — layak dipakai dan di-tune.',
		B: 'Lumayan — pengisi sementara.',
		C: 'Kurang — ganti bila ada yang lebih baik.',
		D: 'Buruk — jadikan bahan upgrade.'
	},
	method:
		'Skor = Σ (nilai ÷ roll maksimum × bobot) ÷ skor echo ideal (lima stat berbobot tertinggi, semua roll maksimum). Bobot per kelompok prioritas: 1, 0,8, 0,6, 0,45, 0,3, 0,2, 0,1. Grade: S ≥ 80, A ≥ 65, B ≥ 50, C ≥ 35.'
};
