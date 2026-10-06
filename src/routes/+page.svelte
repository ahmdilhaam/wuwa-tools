<script lang="ts">
	import meta from '#lib/data/game/meta.json';

	const updated = new Date(meta.fetchedAt).toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
</script>

<svelte:head>
	<title>WuWa Tools — Beranda</title>
</svelte:head>

<h1>WuWa Tools</h1>
<p class="intro">
	Kumpulan alat dan pustaka pengetahuan Wuthering Waves: kalkulator damage, build karakter, echo set,
	senjata, dan mekanik universal — semuanya dalam Bahasa Indonesia.
</p>

<div class="notices">
	<div class="card">
		<strong>Data game diperbarui</strong>
		<p>Data game diperbarui: {updated} (sumber: {meta.source}).</p>
	</div>
	<div class="card">
		<strong>Bahasa teks game</strong>
		<p>Teks skill, pasif, dan bonus set berasal dari game dalam bahasa Inggris karena sumber belum menyediakan bahasa Indonesia.</p>
	</div>
</div>

<div class="grid">
	<a class="card link" href="/calculator/">
		<h2>Kalkulator</h2>
		<p>Hitung damage dan bandingkan konfigurasi build.</p>
	</a>
	<a class="card link" href="/characters/">
		<h2>Karakter</h2>
		<p>60 karakter dengan data skill, motion value, sequence, serta build (echo, senjata, tim, rotasi) bila tersedia.</p>
	</a>
	<a class="card link" href="/echo-sets/">
		<h2>Echo Set</h2>
		<p>37 set Sonata dengan bonus 2pc/3pc/5pc dan kombinasi umum.</p>
	</a>
	<a class="card link" href="/weapons/">
		<h2>Senjata</h2>
		<p>124 senjata dengan ATK, stat sekunder, dan pasif R1–R5.</p>
	</a>
	<a class="card link" href="/mechanics/">
		<h2>Mekanik</h2>
		<p>Aturan umum build, prioritas forte, dan rentang roll substat.</p>
	</a>
</div>

<style>
	.intro {
		color: var(--text-muted);
		max-width: 65ch;
	}
	.notices,
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1rem;
		margin: 1.5rem 0;
	}
	.notices p {
		margin: 0.25rem 0 0;
		color: var(--text-muted);
	}
	.link {
		text-decoration: none;
		color: var(--text);
		transition: border-color 0.15s;
	}
	.link:hover {
		border-color: var(--accent);
	}
	.link h2 {
		margin: 0 0 0.35rem;
		font-size: 1.1rem;
		color: var(--accent);
	}
	.link p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9rem;
	}
</style>
