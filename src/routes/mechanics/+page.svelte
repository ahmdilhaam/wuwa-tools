<script lang="ts">
	import {
		mechanicBlocks,
		forteRows,
		forteTableNote,
		statTargets
	} from '#lib/data/mechanics.ts';
	import {
		substatRows,
		substatProbabilityNotes,
		substatPracticalNotes,
		substatSource
	} from '#lib/data/substats.ts';
</script>

<svelte:head>
	<title>Mekanik — WuWa Tools</title>
</svelte:head>

<h1>Mekanik Universal</h1>
<p class="muted">Aturan umum build. Game Version 3.4.</p>

<div class="blocks">
	{#each mechanicBlocks as b (b.id)}
		<section class="card">
			<h2>{b.title}</h2>
			{#each b.paragraphs as p (p)}<p>{p}</p>{/each}
		</section>
	{/each}
</div>

<h2 class="big">Prioritas Forte Tree</h2>
<p class="muted">Berdasarkan nilai skill share (penguatan dari skill pasif).</p>
<div class="table-wrap card">
	<table>
		<thead><tr><th>Skill Share</th><th>Level Forte yang Disarankan</th></tr></thead>
		<tbody>
			{#each forteRows as r (r.skillShare)}
				<tr><td>{r.skillShare}</td><td>{r.recommendation}</td></tr>
			{/each}
		</tbody>
	</table>
</div>
<p class="warn">{forteTableNote}</p>

<h2 class="big">Target Stat Umum</h2>
<div class="table-wrap card">
	<table>
		<thead><tr><th>Stat</th><th>Target Umum</th></tr></thead>
		<tbody>
			{#each statTargets as r (r.stat)}
				<tr><td>{r.stat}</td><td>{r.goal}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<h2 class="big">Rentang Roll Substat</h2>
<p class="muted">{substatSource}</p>
<div class="table-wrap card">
	<table>
		<thead>
			<tr><th>Stat</th><th>Rendah</th><th>Menengah-Rendah</th><th>Menengah-Tinggi</th><th>Tinggi</th></tr>
		</thead>
		<tbody>
			{#each substatRows as r (r.stat)}
				<tr><td>{r.stat}</td><td>{r.low}</td><td>{r.midLow}</td><td>{r.midHigh}</td><td>{r.high}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<div class="blocks">
	<section class="card">
		<h2>Catatan Peluang Roll</h2>
		<ul>{#each substatProbabilityNotes as n (n)}<li>{n}</li>{/each}</ul>
	</section>
	<section class="card">
		<h2>Penggunaan Praktis</h2>
		<p>Menilai apakah sebuah echo "cukup bagus":</p>
		<ul>{#each substatPracticalNotes as n (n)}<li>{n}</li>{/each}</ul>
	</section>
</div>

<style>
	.muted {
		color: var(--text-muted);
	}
	.warn {
		color: var(--danger);
		font-size: 0.85rem;
	}
	.blocks {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
		gap: 1rem;
		margin: 1rem 0;
		align-items: start;
	}
	h2 {
		font-size: 1.1rem;
		margin: 0 0 0.4rem;
		color: var(--accent);
	}
	h2.big {
		margin-top: 2rem;
		color: var(--text);
	}
	p {
		margin: 0.4rem 0;
	}
	ul {
		margin: 0;
		padding-left: 1.2rem;
	}
</style>
