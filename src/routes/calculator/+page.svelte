<script lang="ts">
	import BuildInputs from '#lib/calc/BuildInputs.svelte';
	import { clampRefine, weaponContribution, effectStatLabel } from '#lib/calc/weapon.ts';
	import { findCharacter, weaponStore } from '#lib/calc/weaponStore.svelte.ts';
	import { defaultBuild, toDamageInput, type BuildState } from '#lib/calc/build.ts';
	import SignalChain from '#lib/calc/SignalChain.svelte';
	import { calculateDamage } from '#lib/calc/damage.ts';
	import { elementLabels } from '#lib/calc/enemies.ts';

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

	const intFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
	const fmt = (n: number) => intFmt.format(Math.round(n));
	const pf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
	const mult = (n: number) => n.toFixed(4);
	const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

	const checklist = [
		'CR terkonfirmasi: cek main stat senjata (Crit Rate vs Crit DMG mengubah rasio)',
		'Tipe damage terverifikasi: Basic / Heavy / Skill / Lib / Intro, dari kit, bukan dari nama kategori skill',
		'Pool DMG Bonus terkonfirmasi: Ele% dan Type% mana yang berlaku untuk hit ini?',
		'Amplify/Deepen terkonfirmasi: buff mana yang aktif, permanen atau terpicu saat tempur?',
		'Tidak ada double-count: tidak ada nilai halaman stat yang ditambahkan lagi',
		'Level musuh sudah diatur (Lv90 = 50,13%, Lv100 = 48,84%, Lv120 = 46,45% DEF% pada penyerang Lv90)',
		'Untuk DPS rotasi: MV per hit dan jumlah hit sudah dikonfirmasi dari kartu skill Lv10 atau wiki'
	];
	let checked = $state<boolean[]>(checklist.map(() => false));

	const rules = [
		{
			title: 'Rule 1: Verifikasi klasifikasi tipe damage',
			text: 'Jangan asumsikan tipe damage sama dengan nama kategori skill. Banyak skill Liberation yang secara internal tergolong Resonance Skill DMG. Cek deskripsi skill atau wiki sebelum memilih pool bonus tipe.'
		},
		{
			title: 'Rule 2: Halaman stat sudah final',
			text: 'Halaman atribut in-game sudah mencakup pasif senjata, inherent skill permanen, dan bonus 2pc echo set. Jangan ditambahkan lagi. Tambahkan terpisah hanya buff yang terpicu saat tempur (mis. 5pc on-field, stack Searing Feather).'
		},
		{
			title: 'Rule 3: RES dasar musuh',
			text: 'RES dasar 10% untuk semua elemen dan 40% untuk elemen milik musuh itu sendiri. Jangan pernah mengasumsikan 0%.'
		},
		{
			title: 'Rule 4: DEF Ignore',
			text: 'DEF Ignore mengurangi DEF musuh sebelum rumus, bukan kontribusi level penyerang. DEF Reduction (debuff pada musuh) diterapkan lebih dulu daripada DEF Ignore.'
		},
		{
			title: 'Rule 5: Stack Forte yang menganggur',
			text: 'Stack Forte yang diam tidak memberi efek pasif pada Liberation (terkonfirmasi pada Changli). Stack hanya berguna untuk mengaktifkan Flaming Sacrifice.'
		},
		{
			title: 'Rule 6: Enhancement Inherent Skill pada Liberation',
			text: 'Peningkatan ini bersifat khusus per hit dan tidak tampil di halaman stat. Contoh Changli Inherent Skill 2: +20% Fusion DMG masuk ke kolom Bonus saat tempur, +15% DEF Ignore masuk ke kolom DEF Ignore.'
		}
	];

	const classifications = [
		['Carlotta', 'Era of New Wave (Liberation)', 'Resonance Skill DMG', 'Liberation DMG'],
		['Carlotta', 'Death Knell × 4 (Liberation)', 'Resonance Skill DMG', 'Liberation DMG'],
		['Carlotta', 'Fatal Finale (Liberation)', 'Resonance Skill DMG', 'Liberation DMG'],
		['Jinhsi', 'Incarnation Basic ATKs (state Liberation)', 'Resonance Skill DMG', 'Basic ATK DMG'],
		['Changli', 'True Sight: Conquest (Forte Heavy)', 'Resonance Skill DMG', 'Heavy ATK DMG'],
		['Changli', 'True Sight: Charge (Forte)', 'Resonance Skill DMG', 'Heavy ATK DMG'],
		['Changli', 'Flaming Sacrifice (Forte)', 'Resonance Skill DMG', 'Skill DMG'],
		['Changli', 'Radiance of Fealty (Liberation)', 'Resonance Liberation DMG', '— (sudah benar)'],
		['Camellya', 'Enhanced Basic ATKs (Forte)', 'Basic ATK DMG', '—'],
		[
			'Camellya',
			'Liberation initial hit',
			'Liberation DMG, juga menerima Basic ATK DMG Bonus',
			'—'
		],
		[
			'Jiyan',
			'Lance of Qingloong (Heavy ATK state Liberation)',
			'Heavy ATK DMG',
			'Basic ATK atau Liberation'
		],
		['Jiyan', 'Windqueller di Qingloong Mode', 'Heavy ATK DMG', 'Resonance Skill DMG'],
		['Xiangli Yao', 'Liberation', 'Resonance Liberation DMG', '— (sudah benar)']
	];
</script>

<svelte:head>
	<title>Kalkulator damage - WuWa Tools</title>
</svelte:head>

<header class="page-head">
	<h1>Kalkulator damage</h1>
	<p>Hitung damage satu hit dari skill, stat, dan musuh. Hasil diperbarui otomatis saat input berubah.</p>
</header>

<div class="segmented tabs" role="tablist" aria-label="Mode kalkulator">
	<button role="tab" aria-selected={mode === 'single'} onclick={() => (mode = 'single')}>
		Satu hit
	</button>
	<button role="tab" aria-selected={mode === 'compare'} onclick={() => (mode = 'compare')}>
		Bandingkan build
	</button>
</div>

{#snippet resultPanel(c: Computed, element: keyof typeof elementLabels)}
	{@const r = c.r}
	<section class="panel-cut result" aria-label="Hasil damage">
		<div class="result-top">
			<span class="label">Rata-rata</span>
			<span class={`el el-${element}`}>{elementLabels[element]}</span>
		</div>
		<div class="hero">{fmt(r.avgDamage)}</div>
		{#if c.weapon && c.wc.active}
			<p class="weapon-note">Termasuk pasif senjata: {c.weapon.name} R{c.refine}</p>
		{/if}
		<div class="pair">
			<div>
				<span class="label">Crit</span>
				<span class="pv crit">{fmt(r.critDamage)}</span>
			</div>
			<div>
				<span class="label">Non-crit</span>
				<span class="pv">{fmt(r.nonCritDamage)}</span>
			</div>
		</div>
		<h3 class="chain-title">Cara damage ini dihitung</h3>
			<p class="chain-help">
				Dimulai dari damage dasar, lalu tiap baris mengalikan hasil sebelumnya. Batang emas menaikkan
				damage, batang merah menurunkannya.
			</p>
		<SignalChain {r} wc={c.wc.active ? c.wc : null} />
		<details class="full">
			<summary>Nilai lengkap</summary>
			<div class="table-wrap">
				<table>
					<tbody>
						<tr><th>Base DMG</th><td class="num">{r.baseDmg.toFixed(2)}</td></tr>
						<tr><th>Pool DMG Bonus</th><td class="num">×{mult(r.bonusPool)}</td></tr>
						<tr><th>Amplify</th><td class="num">×{mult(r.amplifyMultiplier)}</td></tr>
						<tr><th>Special DMG</th><td class="num">×{mult(r.specialMultiplier)}</td></tr>
						<tr><th>DEF musuh (dasar)</th><td class="num">{r.enemyDef.toFixed(2)}</td></tr>
						<tr><th>DEF musuh (setelah modifikasi)</th><td class="num">{r.modifiedDef.toFixed(2)}</td></tr>
						<tr><th>Suku level penyerang</th><td class="num">{r.attackerDefTerm}</td></tr>
						<tr><th>DEF%</th><td class="num">×{mult(r.defFactor)} ({pct(r.defFactor)})</td></tr>
						<tr><th>RES efektif</th><td class="num">{pct(r.effectiveRes)}</td></tr>
						<tr><th>Faktor RES</th><td class="num">×{mult(r.resFactor)}</td></tr>
						<tr><th>Pengali Crit</th><td class="num">×{mult(r.critMultiplier)}</td></tr>
						<tr><th>Pengali Non-crit</th><td class="num">×{mult(r.nonCritMultiplier)}</td></tr>
						<tr><th>Pengali Rata-rata</th><td class="num">×{mult(r.avgCritMultiplier)}</td></tr>
						{#if c.weapon && c.wc.active}
							<tr>
								<th>Dari pasif senjata ({c.weapon.name} R{c.refine})</th>
								<td class="num weapon-rows">
									{#each c.wc.effects.filter((e) => e.contributes) as e (e.index)}
										<span>
											{e.effect.stat === 'atkPct' || e.effect.stat === 'hpPct' || e.effect.stat === 'defPct'
												? `+${fmt(e.flat)} ${effectStatLabel(e.effect)}`
												: `+${pf.format(e.valuePct)}% ${effectStatLabel(e.effect)}`}
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
			<span class="label">Build A</span>
			<span class="dv">{fmt(resultA.avgDamage)}</span>
		</div>
		<div class="dcell">
			<span class="label">Build B</span>
			<span class="dv">{fmt(resultB.avgDamage)}</span>
		</div>
		<div class="dcell delta">
			<span class="label">Selisih B terhadap A</span>
			{#if diffPct === null}
				<span class="dp">-</span>
			{:else}
				<span class="dp" class:neg={diffPct < 0}>
					{diffPct >= 0 ? '+' : '−'}{Math.abs(diffPct).toFixed(2).replace('.', ',')}%
				</span>
			{/if}
		</div>
	</div>
	<div class="compare">
		<section aria-label="Build A">
			<h2>Build A</h2>
			<BuildInputs bind:build={buildA} />
			{@render resultPanel(calcA, buildA.element)}
		</section>
		<section aria-label="Build B">
			<h2>Build B</h2>
			<BuildInputs bind:build={buildB} />
			{@render resultPanel(calcB, buildB.element)}
		</section>
	</div>
{/if}

<section class="rules">
	<h2>Aturan dan pengecekan</h2>
	<div class="rules-grid">
		<div>
			<h3>Aturan</h3>
			<dl>
				{#each rules as rule (rule.title)}
					<div>
						<dt>{rule.title}</dt>
						<dd>{rule.text}</dd>
					</div>
				{/each}
			</dl>
		</div>
		<div>
			<h3>Checklist sebelum menghitung</h3>
			<div class="checklist">
				{#each checklist as item, i (i)}
					<label>
						<input type="checkbox" bind:checked={checked[i]} />
						<span>{item}</span>
					</label>
				{/each}
			</div>
		</div>
	</div>

	<details class="class-table">
		<summary>Klasifikasi tipe damage karakter (terkonfirmasi)</summary>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Karakter</th>
						<th>Skill</th>
						<th>Tipe DMG sebenarnya</th>
						<th>Asumsi yang sering keliru</th>
					</tr>
				</thead>
				<tbody>
					{#each classifications as row, i (i)}
						<tr>
							{#each row as cell, j (j)}<td>{cell}</td>{/each}
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
