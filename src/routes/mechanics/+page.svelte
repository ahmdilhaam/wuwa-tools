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

<div class="page-head">
	<h1>Mekanik universal</h1>
	<p>Aturan umum build. Game versi 3.4.</p>
</div>

{#each mechanicBlocks as b (b.id)}
	<section class="sec">
		<h2>{b.title}</h2>
		{#each b.paragraphs as p (p)}<p>{p}</p>{/each}
	</section>
{/each}

<section class="sec">
	<h2>Prioritas forte tree</h2>
	<p class="muted">Berdasarkan nilai skill share (penguatan dari skill pasif).</p>
	<div class="table-wrap">
		<table>
			<thead><tr><th>Skill share</th><th>Level forte yang disarankan</th></tr></thead>
			<tbody>
				{#each forteRows as r (r.skillShare)}
					<tr><td>{r.skillShare}</td><td>{r.recommendation}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="warn">{forteTableNote}</p>
</section>

<section class="sec">
	<h2>Target stat umum</h2>
	<div class="table-wrap">
		<table>
			<thead><tr><th>Stat</th><th>Target umum</th></tr></thead>
			<tbody>
				{#each statTargets as r (r.stat)}
					<tr><td>{r.stat}</td><td>{r.goal}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<section class="sec">
	<h2>Rentang roll substat</h2>
	<p class="muted">{substatSource}</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Stat</th>
					<th class="num">Rendah</th>
					<th class="num">Menengah-rendah</th>
					<th class="num">Menengah-tinggi</th>
					<th class="num">Tinggi</th>
				</tr>
			</thead>
			<tbody>
				{#each substatRows as r (r.stat)}
					<tr>
						<td>{r.stat}</td>
						<td class="num">{r.low}</td>
						<td class="num">{r.midLow}</td>
						<td class="num">{r.midHigh}</td>
						<td class="num">{r.high}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<section class="sec">
	<h2>Catatan peluang roll</h2>
	<ul>{#each substatProbabilityNotes as n (n)}<li>{n}</li>{/each}</ul>
</section>

<section class="sec">
	<h2>Penggunaan praktis</h2>
	<p>Menilai apakah sebuah echo cukup bagus:</p>
	<ul>{#each substatPracticalNotes as n (n)}<li>{n}</li>{/each}</ul>
</section>

<style>
	.sec {
		margin: 0 0 2.25rem;
	}
	.sec :global(.table-wrap) {
		max-width: 56rem;
	}
	.warn {
		color: var(--text-muted);
		font-size: var(--fs-sm);
		margin-top: 0.6rem;
	}
	ul {
		margin: 0;
		padding-left: 1.2rem;
		max-width: 72ch;
	}
	li {
		margin: 0.3rem 0;
	}
</style>
