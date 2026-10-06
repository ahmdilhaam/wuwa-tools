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
	import { gameText, t } from '#lib/i18n/index.svelte.ts';
</script>

<svelte:head>
	<title>{t('library.pageTitle', { name: t('library.mechanics.title') })}</title>
</svelte:head>

<div class="page-head">
	<h1>{t('library.mechanics.heading')}</h1>
	<p>{t('library.mechanics.intro')}</p>
</div>

{#each mechanicBlocks as b (b.id)}
	<section class="sec">
		<h2>{gameText(b.title)}</h2>
		{#each b.paragraphs as p (p.en)}<p>{gameText(p)}</p>{/each}
	</section>
{/each}

<section class="sec">
	<h2>{t('library.mechanics.forteHeading')}</h2>
	<p class="muted">{t('library.mechanics.forteIntro')}</p>
	<div class="table-wrap">
		<table>
			<thead><tr><th>{t('library.mechanics.skillShare')}</th><th>{t('library.mechanics.forteRecommended')}</th></tr></thead>
			<tbody>
				{#each forteRows as r (r.skillShare)}
					<tr><td>{r.skillShare}</td><td>{gameText(r.recommendation)}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="warn">{gameText(forteTableNote)}</p>
</section>

<section class="sec">
	<h2>{t('library.mechanics.targetsHeading')}</h2>
	<div class="table-wrap">
		<table>
			<thead><tr><th>{t('library.mechanics.stat')}</th><th>{t('library.mechanics.typicalGoal')}</th></tr></thead>
			<tbody>
				{#each statTargets as r (r.stat)}
					<tr><td>{r.stat}</td><td>{gameText(r.goal)}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<section class="sec">
	<h2>{t('library.mechanics.substatHeading')}</h2>
	<p class="muted">{gameText(substatSource)}</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>{t('library.mechanics.stat')}</th>
					<th class="num">{t('library.mechanics.low')}</th>
					<th class="num">{t('library.mechanics.midLow')}</th>
					<th class="num">{t('library.mechanics.midHigh')}</th>
					<th class="num">{t('library.mechanics.high')}</th>
				</tr>
			</thead>
			<tbody>
				{#each substatRows as r (typeof r.stat === 'string' ? r.stat : r.stat.en)}
					<tr>
						<td>{typeof r.stat === 'string' ? r.stat : gameText(r.stat)}</td>
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
	<h2>{t('library.mechanics.probabilityHeading')}</h2>
	<ul>{#each substatProbabilityNotes as n (n.en)}<li>{gameText(n)}</li>{/each}</ul>
</section>

<section class="sec">
	<h2>{t('library.mechanics.practicalHeading')}</h2>
	<p>{t('library.mechanics.practicalIntro')}</p>
	<ul>{#each substatPracticalNotes as n (n.en)}<li>{gameText(n)}</li>{/each}</ul>
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
