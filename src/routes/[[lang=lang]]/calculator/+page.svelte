<script lang="ts">
	import BuildInputs from '#lib/calc/BuildInputs.svelte';
	import { clampRefine, weaponContribution, effectStatLabel } from '#lib/calc/weapon.ts';
	import { findCharacter, weaponStore } from '#lib/calc/weaponStore.svelte.ts';
	import { defaultBuild, toDamageInput, type BuildState } from '#lib/calc/build.ts';
	import SignalChain from '#lib/calc/SignalChain.svelte';
	import { calculateDamage } from '#lib/calc/damage.ts';
	import { elementLabels } from '#lib/calc/enemies.ts';
	import { formatNumber, t, type DictKey } from '#lib/i18n/index.svelte.ts';

	let mode = $state<'single' | 'compare'>('single');

	let single = $state(defaultBuild());
	let buildA = $state(defaultBuild());
	let buildB = $state(defaultBuild());

	// Hasil + kontribusi pasif senjata (senjata dimuat malas lewat weaponStore)
	function compute(b: BuildState) {
		const weapon = weaponStore.find(b.pickWeapon);
		const character = findCharacter(b.pickCharacter);
		return {
			r: calculateDamage(toDamageInput(b, weapon, character)),
			wc: weaponContribution(b, weapon, character),
			weapon,
			refine: clampRefine(b.pickRefine)
		};
	}
	type Computed = ReturnType<typeof compute>;
	const singleCalc = $derived(compute(single));
	const calcA = $derived(compute(buildA));
	const calcB = $derived(compute(buildB));
	const resultA = $derived(calcA.r);
	const resultB = $derived(calcB.r);

	// Selisih rata-rata B terhadap A, dalam persen
	const diffPct = $derived(
		resultA.avgDamage > 0 ? (resultB.avgDamage / resultA.avgDamage - 1) * 100 : null
	);

	const fmt = (n: number) => formatNumber(Math.round(n), { maximumFractionDigits: 0 });
	const pf = { format: (n: number) => formatNumber(n, { maximumFractionDigits: 2 }) };
	const fixed = (n: number, d: number) => formatNumber(n, { minimumFractionDigits: d, maximumFractionDigits: d });
	const mult = (n: number) => fixed(n, 4);
	const pct = (n: number) => `${fixed(n * 100, 2)}%`;

	const checklist: DictKey[] = [
		'calc.rules.c1',
		'calc.rules.c2',
		'calc.rules.c3',
		'calc.rules.c4',
		'calc.rules.c5',
		'calc.rules.c6',
		'calc.rules.c7'
	];
	let checked = $state<boolean[]>(checklist.map(() => false));

	const rules: { title: DictKey; text: DictKey }[] = [
		{ title: 'calc.rules.r1Title', text: 'calc.rules.r1Text' },
		{ title: 'calc.rules.r2Title', text: 'calc.rules.r2Text' },
		{ title: 'calc.rules.r3Title', text: 'calc.rules.r3Text' },
		{ title: 'calc.rules.r4Title', text: 'calc.rules.r4Text' },
		{ title: 'calc.rules.r5Title', text: 'calc.rules.r5Text' },
		{ title: 'calc.rules.r6Title', text: 'calc.rules.r6Text' }
	];

	// Sel tabel: teks literal (istilah game, tidak diterjemahkan) atau kunci kamus.
	type Cell = string | { key: DictKey };
	const k = (key: DictKey): Cell => ({ key });
	const correct = k('calc.classes.correct');
	const classifications: Cell[][] = [
		['Carlotta', 'Era of New Wave (Liberation)', 'Resonance Skill DMG', 'Liberation DMG'],
		['Carlotta', 'Death Knell × 4 (Liberation)', 'Resonance Skill DMG', 'Liberation DMG'],
		['Carlotta', 'Fatal Finale (Liberation)', 'Resonance Skill DMG', 'Liberation DMG'],
		['Jinhsi', k('calc.classes.jinhsiIncarnation'), 'Resonance Skill DMG', 'Basic ATK DMG'],
		['Changli', 'True Sight: Conquest (Forte Heavy)', 'Resonance Skill DMG', 'Heavy ATK DMG'],
		['Changli', 'True Sight: Charge (Forte)', 'Resonance Skill DMG', 'Heavy ATK DMG'],
		['Changli', 'Flaming Sacrifice (Forte)', 'Resonance Skill DMG', 'Skill DMG'],
		['Changli', 'Radiance of Fealty (Liberation)', 'Resonance Liberation DMG', correct],
		['Camellya', 'Enhanced Basic ATKs (Forte)', 'Basic ATK DMG', '—'],
		['Camellya', 'Liberation initial hit', k('calc.classes.camellyaLibActual'), '—'],
		['Jiyan', k('calc.classes.jiyanLance'), 'Heavy ATK DMG', k('calc.classes.jiyanBasicOrLib')],
		['Jiyan', k('calc.classes.jiyanWindqueller'), 'Heavy ATK DMG', 'Resonance Skill DMG'],
		['Xiangli Yao', 'Liberation', 'Resonance Liberation DMG', correct]
	];
</script>

<svelte:head>
	<title>{t('calc.page.metaTitle')}</title>
</svelte:head>

<header class="page-head">
	<h1>{t('calc.page.title')}</h1>
	<p>{t('calc.page.intro')}</p>
</header>

<div class="segmented tabs" role="tablist" aria-label={t('calc.page.modeLabel')}>
	<button role="tab" aria-selected={mode === 'single'} onclick={() => (mode = 'single')}>
		{t('calc.page.modeSingle')}
	</button>
	<button role="tab" aria-selected={mode === 'compare'} onclick={() => (mode = 'compare')}>
		{t('calc.page.modeCompare')}
	</button>
</div>

{#snippet resultPanel(c: Computed, element: keyof typeof elementLabels)}
	{@const r = c.r}
	<section class="panel-cut result" aria-label={t('calc.result.label')}>
		<div class="result-top">
			<span class="label">{t('calc.result.average')}</span>
			<span class={`el el-${element}`}>{elementLabels[element]}</span>
		</div>
		<div class="hero">{fmt(r.avgDamage)}</div>
		{#if c.weapon && c.wc.active}
			<p class="weapon-note">{t('calc.result.weaponNote', { weapon: c.weapon.name, refine: c.refine })}</p>
		{/if}
		<div class="pair">
			<div>
				<span class="label">{t('calc.result.crit')}</span>
				<span class="pv crit">{fmt(r.critDamage)}</span>
			</div>
			<div>
				<span class="label">{t('calc.result.nonCrit')}</span>
				<span class="pv">{fmt(r.nonCritDamage)}</span>
			</div>
		</div>
		<h3 class="chain-title">{t('calc.result.chainTitle')}</h3>
		<p class="chain-help">{t('calc.result.chainHelp')}</p>
		<SignalChain {r} wc={c.wc.active ? c.wc : null} />
		<details class="full">
			<summary>{t('calc.result.fullValues')}</summary>
			<div class="table-wrap">
				<table>
					<tbody>
						<tr><th>Base DMG</th><td class="num">{r.baseDmg.toFixed(2)}</td></tr>
						<tr><th>{t('calc.result.poolBonus')}</th><td class="num">×{mult(r.bonusPool)}</td></tr>
						<tr><th>Amplify</th><td class="num">×{mult(r.amplifyMultiplier)}</td></tr>
						<tr><th>Special DMG</th><td class="num">×{mult(r.specialMultiplier)}</td></tr>
						<tr><th>{t('calc.result.enemyDefBase')}</th><td class="num">{r.enemyDef.toFixed(2)}</td></tr>
						<tr><th>{t('calc.result.enemyDefModified')}</th><td class="num">{r.modifiedDef.toFixed(2)}</td></tr>
						<tr><th>{t('calc.result.attackerTerm')}</th><td class="num">{r.attackerDefTerm}</td></tr>
						<tr><th>DEF%</th><td class="num">×{mult(r.defFactor)} ({pct(r.defFactor)})</td></tr>
						<tr><th>{t('calc.result.effectiveRes')}</th><td class="num">{pct(r.effectiveRes)}</td></tr>
						<tr><th>{t('calc.result.resFactor')}</th><td class="num">×{mult(r.resFactor)}</td></tr>
						<tr><th>{t('calc.result.critMult')}</th><td class="num">×{mult(r.critMultiplier)}</td></tr>
						<tr><th>{t('calc.result.nonCritMult')}</th><td class="num">×{mult(r.nonCritMultiplier)}</td></tr>
						<tr><th>{t('calc.result.avgMult')}</th><td class="num">×{mult(r.avgCritMultiplier)}</td></tr>
						{#if c.weapon && c.wc.active}
							<tr>
								<th>{t('calc.result.fromWeapon', { weapon: c.weapon.name, refine: c.refine })}</th>
								<td class="num weapon-rows">
									{#each c.wc.effects.filter((e) => e.contributes) as e (e.index)}
										<span>
											{e.effect.stat === 'atkPct' || e.effect.stat === 'hpPct' || e.effect.stat === 'defPct'
												? `+${fmt(e.flat)} ${effectStatLabel(e.effect, t)}`
												: `+${pf.format(e.valuePct)}% ${effectStatLabel(e.effect, t)}`}
										</span>
									{/each}
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</details>
	</section>
{/snippet}

{#if mode === 'single'}
	<div class="cols">
		<div class="left">
			<BuildInputs bind:build={single} />
		</div>
		<div class="right">
			<div class="sticky">
				{@render resultPanel(singleCalc, single.element)}
			</div>
		</div>
	</div>
{:else}
	<div class="diff panel-cut" aria-live="polite">
		<div class="dcell">
			<span class="label">{t('calc.page.buildA')}</span>
			<span class="dv">{fmt(resultA.avgDamage)}</span>
		</div>
		<div class="dcell">
			<span class="label">{t('calc.page.buildB')}</span>
			<span class="dv">{fmt(resultB.avgDamage)}</span>
		</div>
		<div class="dcell delta">
			<span class="label">{t('calc.page.diffLabel')}</span>
			{#if diffPct === null}
				<span class="dp">-</span>
			{:else}
				<span class="dp" class:neg={diffPct < 0}>
					{diffPct >= 0 ? '+' : '−'}{fixed(Math.abs(diffPct), 2)}%
				</span>
			{/if}
		</div>
	</div>
	<div class="compare">
		<section aria-label={t('calc.page.buildA')}>
			<h2>{t('calc.page.buildA')}</h2>
			<BuildInputs bind:build={buildA} />
			{@render resultPanel(calcA, buildA.element)}
		</section>
		<section aria-label={t('calc.page.buildB')}>
			<h2>{t('calc.page.buildB')}</h2>
			<BuildInputs bind:build={buildB} />
			{@render resultPanel(calcB, buildB.element)}
		</section>
	</div>
{/if}

<section class="rules">
	<h2>{t('calc.rules.heading')}</h2>
	<div class="rules-grid">
		<div>
			<h3>{t('calc.rules.rulesTitle')}</h3>
			<dl>
				{#each rules as rule (rule.title)}
					<div>
						<dt>{t(rule.title)}</dt>
						<dd>{t(rule.text)}</dd>
					</div>
				{/each}
			</dl>
		</div>
		<div>
			<h3>{t('calc.rules.checklistTitle')}</h3>
			<div class="checklist">
				{#each checklist as item, i (i)}
					<label>
						<input type="checkbox" bind:checked={checked[i]} />
						<span>{t(item)}</span>
					</label>
				{/each}
			</div>
		</div>
	</div>

	<details class="class-table">
		<summary>{t('calc.classes.summary')}</summary>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>{t('calc.classes.character')}</th>
						<th>{t('calc.classes.skill')}</th>
						<th>{t('calc.classes.actual')}</th>
						<th>{t('calc.classes.assumed')}</th>
					</tr>
				</thead>
				<tbody>
					{#each classifications as row, i (i)}
						<tr>
							{#each row as cell, j (j)}<td>{typeof cell === 'string' ? cell : t(cell.key)}</td>{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
</section>

<style>
	.tabs {
		margin-bottom: 1.5rem;
	}
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		gap: 2rem;
		align-items: start;
	}
	.compare {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2rem;
		align-items: start;
	}
	.compare section {
		display: grid;
		gap: 1.5rem;
		min-width: 0;
	}
	.compare h2 {
		margin: 0;
	}
	.sticky {
		position: sticky;
		top: 4.5rem;
	}
	@media (max-width: 899px) {
		.cols {
			grid-template-columns: minmax(0, 1fr);
		}
		.sticky {
			position: static;
		}
	}
	@media (max-width: 719px) {
		.compare {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.label {
		color: var(--text-muted);
		font-size: var(--fs-sm);
	}
	.result {
		padding: 1.25rem;
	}
	.result-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding-right: 0.8rem;
	}
	.hero {
		font-family: var(--font-display);
		font-size: clamp(2.4rem, 4vw, 3.2rem);
		font-weight: 600;
		line-height: 1.1;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
		margin: 0.2rem 0 1rem;
		overflow-wrap: anywhere;
	}
	.weapon-note {
		margin: -0.6rem 0 1rem;
		font-size: var(--fs-xs);
		color: var(--gold);
	}
	.weapon-rows {
		display: grid;
		gap: 0.15rem;
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}
	.pair > div {
		display: grid;
	}
	.pv {
		font-size: var(--fs-xl);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.pv.crit {
		color: var(--gold);
	}
	.chain-title {
		margin: 1rem 0 0.25rem;
		font-size: var(--fs-sm);
		color: var(--text);
		font-weight: 600;
	}
	.chain-help {
		margin: 0 0 0.5rem;
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	.full {
		margin-top: 1rem;
	}
	.full summary {
		margin-bottom: 0.5rem;
	}
	.full th {
		font-weight: 500;
		color: var(--text-muted);
	}

	.diff {
		position: sticky;
		top: 4.5rem;
		z-index: 5;
		display: grid;
		grid-template-columns: 1fr 1fr 1.3fr;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		margin-bottom: 1.5rem;
		background-color: var(--surface);
	}
	.dcell {
		display: grid;
		min-width: 0;
	}
	.dv {
		font-size: var(--fs-lg);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.dp {
		font-family: var(--font-display);
		font-size: var(--fs-xl);
		font-weight: 600;
		color: var(--ok);
		font-variant-numeric: tabular-nums;
	}
	.dp.neg {
		color: var(--danger);
	}
	@media (max-width: 480px) {
		.diff {
			grid-template-columns: 1fr 1fr;
			padding-right: 1.5rem;
		}
		.delta {
			grid-column: 1 / -1;
		}
	}

	.rules {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}
	.rules-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2rem;
		margin-bottom: 1.5rem;
	}
	@media (max-width: 799px) {
		.rules-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	dl {
		margin: 0;
		display: grid;
		gap: 0.9rem;
	}
	dt {
		font-weight: 600;
		font-size: var(--fs-sm);
	}
	dd {
		margin: 0.15rem 0 0;
		color: var(--text-muted);
		font-size: var(--fs-sm);
	}
	.checklist {
		display: grid;
		gap: 0.6rem;
	}
	.checklist label {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		color: var(--text);
	}
	.checklist input {
		margin-top: 0.15rem;
		flex: none;
	}
	.class-table summary {
		margin-bottom: 0.75rem;
	}
</style>
