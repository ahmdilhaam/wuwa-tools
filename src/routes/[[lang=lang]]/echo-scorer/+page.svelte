<script lang="ts">
	import {
		genericPriority,
		maxSubstats,
		parsePriority,
		scoreEcho,
		substatDef,
		substatDefs,
		type EchoSubstat,
		type SubstatKey
	} from '#lib/calc/echoScore.ts';
	import { characterViews } from '#lib/data/merged.ts';
	import { formatNumber, t } from '#lib/i18n/index.svelte.ts';
	import IconSelect, { type IconOption } from '#lib/ui/IconSelect.svelte';

	type Row = { key: SubstatKey | ''; value: string };
	const emptyRows = (): Row[] => Array.from({ length: maxSubstats }, () => ({ key: '', value: '' }));

	let slug = $state('');
	let rows = $state<Row[]>(emptyRows());

	const characterOptions = $derived<IconOption[]>([
		{ value: '', label: t('echo.generic') },
		...characterViews.map((v) => ({ value: v.game.slug, label: v.game.name, icon: v.game.icon, rarity: v.game.rarity }))
	]);

	const view = $derived(characterViews.find((v) => v.game.slug === slug));
	const priorityText = $derived(view?.build?.substats?.value || genericPriority);
	const priority = $derived(parsePriority(priorityText));
	const groups = $derived(
		priority.reduce<(typeof priority)[]>((acc, p) => {
			(acc[p.group] ??= []).push(p);
			return acc;
		}, [])
	);

	const filled = $derived<EchoSubstat[]>(
		rows.filter((r) => r.key && r.value !== '').map((r) => ({ key: r.key as SubstatKey, value: Number(r.value) }))
	);
	const result = $derived(scoreEcho(filled, priority));
	const hasConditional = $derived(priority.some((p) => p.conditional));

	const fmt = (key: SubstatKey, value: number) =>
		formatNumber(value, { maximumFractionDigits: 1, minimumFractionDigits: substatDef(key).percent ? 1 : 0 }) +
		(substatDef(key).percent ? '%' : '');
	const pct = (n: number) => formatNumber(n, { maximumFractionDigits: 0 }) + '%';

	function onStat(row: Row) {
		row.value = '';
	}
	// Satu stat tidak bisa muncul dua kali di echo yang sama.
	const takenElsewhere = (i: number, key: SubstatKey) => rows.some((r, j) => j !== i && r.key === key);
</script>

<svelte:head>
	<title>{t('library.pageTitle', { name: t('echo.title') })}</title>
</svelte:head>

<div class="page-head">
	<h1>{t('echo.title')}</h1>
	<p>{t('echo.intro')}</p>
</div>

<div class="layout">
	<section class="card inputs" aria-labelledby="inputs-heading">
		<h2 id="inputs-heading" class="visually-hidden">{t('echo.substats')}</h2>
		<div class="field">
			<span class="field-label" id="char-label">{t('echo.character')}</span>
			<IconSelect bind:value={slug} options={characterOptions} labelledby="char-label" />
		</div>

		<div class="priority">
			<span class="field-label">{t('echo.priority')}</span>
			<ol class="groups">
				{#each groups as g, i (i)}
					<li>
						{#each g as p (p.key)}
							<span class="chip" class:cond={p.conditional}
								>{substatDef(p.key).label}<small>×{formatNumber(p.weight)}</small></span
							>
						{/each}
					</li>
				{/each}
			</ol>
			<p class="hint">
				{#if !slug}{t('echo.priorityGeneric')}{:else if !view?.build?.substats?.value}{t('echo.noBuild')}{:else}{priorityText}{/if}
			</p>
		</div>

		<fieldset>
			<legend>{t('echo.substats')}</legend>
			{#each rows as row, i (i)}
				<div class="row">
					<label>
						<span class="visually-hidden">{t('echo.slot', { n: i + 1 })} — </span>{t('echo.stat')}
						<select bind:value={row.key} onchange={() => onStat(row)}>
							<option value="">{t('echo.none')}</option>
							{#each substatDefs as d (d.key)}
								<option value={d.key} disabled={takenElsewhere(i, d.key)}>{d.label}</option>
							{/each}
						</select>
					</label>
					<label>
						<span class="visually-hidden">{t('echo.slot', { n: i + 1 })} — </span>{t('echo.value')}
						<select bind:value={row.value} disabled={!row.key}>
							<option value="">{t('echo.none')}</option>
							{#if row.key}
								{#each substatDef(row.key).rolls as r (r)}
									<option value={String(r)}>{fmt(row.key, r)}</option>
								{/each}
							{/if}
						</select>
					</label>
				</div>
			{/each}
			<button type="button" class="btn" onclick={() => (rows = emptyRows())}>{t('echo.reset')}</button>
		</fieldset>
	</section>

	<section class="panel-cut out" aria-labelledby="result-heading" aria-live="polite">
		<h2 id="result-heading">{t('echo.result')}</h2>
		{#if filled.length === 0}
			<p class="muted">{t('echo.empty')}</p>
		{:else}
			<div class="headline">
				<span class="grade g-{result.grade}">{result.grade}</span>
				<div>
					<div class="score">{t('echo.score')} <strong>{formatNumber(result.score, { maximumFractionDigits: 1 })}</strong> / 100</div>
					<p class="verdict">{t(`echo.verdict.${result.grade}`)}</p>
				</div>
			</div>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>{t('echo.stat')}</th>
							<th>{t('echo.quality')}</th>
							<th class="num">{t('echo.weight')}</th>
							<th class="num">{t('echo.points')}</th>
						</tr>
					</thead>
					<tbody>
						{#each result.substats as s (s.key)}
							<tr class:unused={s.weight === 0}>
								<td>
									<div>{substatDef(s.key).label} <strong>{fmt(s.key, s.value)}</strong></div>
									<span class="tier t-{s.tier}">{t(`echo.tier.${s.tier}`)}</span>
									{#if s.weight === 0}<span class="hint">{t('echo.unused')}</span>{/if}
								</td>
								<td>
									<div class="bar" aria-hidden="true"><span style:width="{s.quality * 100}%"></span></div>
									<span class="hint">{pct(s.quality * 100)}</span>
								</td>
								<td class="num">{formatNumber(s.weight)}</td>
								<td class="num">{formatNumber(s.points, { maximumFractionDigits: 2 })}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
		{#if hasConditional}<p class="hint">{t('echo.conditional')}</p>{/if}
		<p class="hint">{t('echo.method')}</p>
	</section>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: 1.25rem;
		align-items: start;
	}
	@media (max-width: 860px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.inputs,
	.out {
		display: grid;
		gap: 1rem;
	}
	.out {
		padding: 1rem 1.1rem;
	}
	h2 {
		margin: 0;
		font-size: var(--fs-lg);
	}
	.field {
		display: grid;
		gap: 0.3rem;
		font-size: var(--fs-sm);
		color: var(--text-muted);
	}
	.field-label {
		font-size: var(--fs-sm);
		color: var(--text-muted);
	}
	.priority {
		display: grid;
		gap: 0.4rem;
	}
	.groups {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.groups li {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		align-items: center;
	}
	.groups li + li::before {
		content: '>';
		color: var(--text-faint);
		margin-right: 0.15rem;
	}
	.chip {
		display: inline-flex;
		gap: 0.3rem;
		align-items: baseline;
		padding: 0.15rem 0.5rem;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		font-size: var(--fs-xs);
		color: var(--text);
	}
	.chip small {
		color: var(--text-faint);
	}
	.chip.cond {
		border-style: dashed;
	}
	fieldset {
		display: grid;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		padding: 0 0 0.4rem;
		font-weight: 600;
		font-size: var(--fs-sm);
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
		gap: 0.6rem;
	}
	.row label {
		display: grid;
		gap: 0.2rem;
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
	.row select {
		color: var(--text);
	}
	fieldset .btn {
		justify-self: start;
	}
	.hint {
		margin: 0;
		font-size: var(--fs-xs);
		color: var(--text-faint);
		line-height: 1.4;
	}
	.headline {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	.grade {
		display: grid;
		place-items: center;
		width: 3.6rem;
		height: 3.6rem;
		flex: none;
		font-family: var(--font-display);
		font-size: var(--fs-2xl);
		font-weight: 700;
		border: 2px solid currentColor;
		border-radius: var(--radius-sm);
	}
	.g-S {
		color: var(--gold);
		background: var(--gold-soft);
	}
	.g-A {
		color: var(--violet);
		background: var(--violet-soft);
	}
	.g-B {
		color: var(--ok);
	}
	.g-C {
		color: var(--text-muted);
	}
	.g-D {
		color: var(--danger);
		background: var(--danger-soft);
	}
	.score {
		color: var(--text-muted);
	}
	.score strong {
		color: var(--text);
		font-size: var(--fs-xl);
	}
	.verdict {
		margin: 0.15rem 0 0;
	}
	.tier {
		display: inline-block;
		margin-top: 0.2rem;
		padding: 0 0.4rem;
		border-radius: 4px;
		font-size: var(--fs-xs);
		background: var(--surface-3);
		color: var(--text-muted);
	}
	.t-midHigh {
		color: var(--violet);
		background: var(--violet-soft);
	}
	.t-high {
		color: var(--gold);
		background: var(--gold-soft);
	}
	.bar {
		height: 0.4rem;
		min-width: 3rem;
		background: var(--surface-3);
		border-radius: 999px;
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--gold);
	}
	tr.unused td {
		color: var(--text-faint);
	}
	tr.unused .bar span {
		background: var(--border-strong);
	}
	td {
		vertical-align: middle;
	}
	td .hint {
		display: block;
	}
	@media (max-width: 480px) {
		th,
		td {
			padding: 0.5rem 0.45rem;
		}
	}
</style>
