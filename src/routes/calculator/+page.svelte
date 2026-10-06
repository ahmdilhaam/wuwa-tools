<script lang="ts">
	import BuildInputs from '#lib/calc/BuildInputs.svelte';
	import { defaultBuild, toDamageInput } from '#lib/calc/build.ts';
	import { calculateDamage } from '#lib/calc/damage.ts';
	import { elementLabels } from '#lib/calc/enemies.ts';

	let mode = $state<'single' | 'compare'>('single');

	let single = $state(defaultBuild());
	let buildA = $state(defaultBuild());
	let buildB = $state(defaultBuild());

	const singleResult = $derived(calculateDamage(toDamageInput(single)));
	const resultA = $derived(calculateDamage(toDamageInput(buildA)));
	const resultB = $derived(calculateDamage(toDamageInput(buildB)));

	// Selisih rata-rata B terhadap A, dalam persen
	const diffPct = $derived(
		resultA.avgDamage > 0 ? (resultB.avgDamage / resultA.avgDamage - 1) * 100 : null
	);

	const intFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
	const fmt = (n: number) => intFmt.format(Math.round(n));
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
	<title>Kalkulator Damage · WuWa Tools</title>
</svelte:head>

<h1>Kalkulator Damage</h1>
<p class="muted">Kalkulator damage satu hit. Hasil dihitung ulang otomatis saat input berubah.</p>

<div class="tabs" role="tablist">
	<button role="tab" aria-selected={mode === 'single'} onclick={() => (mode = 'single')}>
		Satu hit
	</button>
	<button role="tab" aria-selected={mode === 'compare'} onclick={() => (mode = 'compare')}>
		Bandingkan build
	</button>
</div>

{#snippet breakdown(r: ReturnType<typeof calculateDamage>)}
	<details>
		<summary>Rincian langkah demi langkah</summary>
		<div class="table-wrap">
			<table>
				<tbody>
					<tr><th>Base DMG</th><td>{r.baseDmg.toFixed(2)}</td></tr>
					<tr><th>Pool DMG Bonus</th><td>×{mult(r.bonusPool)}</td></tr>
					<tr><th>Amplify</th><td>×{mult(r.amplifyMultiplier)}</td></tr>
					<tr><th>Special DMG</th><td>×{mult(r.specialMultiplier)}</td></tr>
					<tr><th>DEF musuh (dasar)</th><td>{r.enemyDef.toFixed(2)}</td></tr>
					<tr><th>DEF musuh (setelah modifikasi)</th><td>{r.modifiedDef.toFixed(2)}</td></tr>
					<tr><th>Suku level penyerang</th><td>{r.attackerDefTerm}</td></tr>
					<tr><th>DEF%</th><td>×{mult(r.defFactor)} ({pct(r.defFactor)})</td></tr>
					<tr><th>RES efektif</th><td>{pct(r.effectiveRes)}</td></tr>
					<tr><th>Faktor RES</th><td>×{mult(r.resFactor)}</td></tr>
					<tr><th>Pengali Crit</th><td>×{mult(r.critMultiplier)}</td></tr>
					<tr><th>Pengali Non-crit</th><td>×{mult(r.nonCritMultiplier)}</td></tr>
					<tr><th>Pengali Rata-rata</th><td>×{mult(r.avgCritMultiplier)}</td></tr>
				</tbody>
			</table>
		</div>
	</details>
{/snippet}

{#snippet bigNumbers(r: ReturnType<typeof calculateDamage>)}
	<div class="big">
		<div class="stat crit">
			<span class="label">Crit</span>
			<span class="value">{fmt(r.critDamage)}</span>
		</div>
		<div class="stat">
			<span class="label">Non-crit</span>
			<span class="value">{fmt(r.nonCritDamage)}</span>
		</div>
		<div class="stat avg">
			<span class="label">Rata-rata</span>
			<span class="value">{fmt(r.avgDamage)}</span>
		</div>
	</div>
{/snippet}

{#if mode === 'single'}
	<div class="cols">
		<div class="left">
			<BuildInputs bind:build={single} />
		</div>
		<div class="right">
			<div class="card sticky">
				<h2>Hasil · {elementLabels[single.element]}</h2>
				{@render bigNumbers(singleResult)}
				{@render breakdown(singleResult)}
			</div>
		</div>
	</div>
{:else}
	<div class="card diff">
		<span class="label">Selisih rata-rata, Build B terhadap Build A</span>
		{#if diffPct === null}
			<span class="value">–</span>
		{:else}
			<span class="value" class:neg={diffPct < 0}>
				{diffPct >= 0 ? '+' : ''}{diffPct.toFixed(2).replace('.', ',')}%
			</span>
		{/if}
	</div>
	<div class="compare">
		<section>
			<h2>Build A</h2>
			<div class="card">
				{@render bigNumbers(resultA)}
				{@render breakdown(resultA)}
			</div>
			<BuildInputs bind:build={buildA} />
		</section>
		<section>
			<h2>Build B</h2>
			<div class="card">
				{@render bigNumbers(resultB)}
				{@render breakdown(resultB)}
			</div>
			<BuildInputs bind:build={buildB} />
		</section>
	</div>
{/if}

<section class="rules">
	<h2>Aturan</h2>
	<div class="rule-grid">
		{#each rules as rule (rule.title)}
			<div class="card">
				<h3>{rule.title}</h3>
				<p>{rule.text}</p>
			</div>
		{/each}
	</div>

	<h3>Klasifikasi tipe damage karakter (terkonfirmasi)</h3>
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

	<h3>Checklist sebelum menghitung</h3>
	<div class="card checklist">
		{#each checklist as item, i (i)}
			<label>
				<input type="checkbox" bind:checked={checked[i]} />
				<span>{item}</span>
			</label>
		{/each}
	</div>
</section>

<style>
	.muted {
		color: var(--text-muted);
	}
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin: 1rem 0;
	}
	.tabs button {
		background: var(--surface-2);
		color: var(--text-muted);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font: inherit;
		cursor: pointer;
	}
	.tabs button[aria-selected='true'] {
		background: var(--accent-soft);
		color: var(--accent);
		border-color: var(--accent);
	}
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
	}
	.compare {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.25rem;
		align-items: start;
	}
	.compare section {
		display: grid;
		gap: 1rem;
	}
	.sticky {
		position: sticky;
		top: 1rem;
	}
	@media (max-width: 799px) {
		.cols,
		.compare {
			grid-template-columns: minmax(0, 1fr);
		}
		.sticky {
			position: static;
		}
		.right {
			order: -1;
		}
	}
	.big {
		display: grid;
		gap: 0.6rem;
		margin: 0.75rem 0;
	}
	.stat {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0.6rem 0.8rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
	}
	.stat .label,
	.diff .label {
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.stat .value {
		font-size: 1.7rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.stat.crit .value {
		color: var(--el-spectro);
	}
	.stat.avg {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.stat.avg .value {
		color: var(--accent);
		font-size: 2rem;
	}
	.diff {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 1rem;
	}
	.diff .value {
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--accent);
	}
	.diff .value.neg {
		color: var(--danger);
	}
	details summary {
		cursor: pointer;
		color: var(--accent);
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.4rem 0.6rem;
		border-bottom: 1px solid var(--border);
	}
	tbody th {
		font-weight: 500;
		color: var(--text-muted);
	}
	td {
		font-variant-numeric: tabular-nums;
	}
	.rules {
		margin-top: 2.5rem;
	}
	.rule-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.rule-grid h3 {
		margin: 0 0 0.4rem;
		font-size: 0.95rem;
	}
	.rule-grid p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.88rem;
	}
	.checklist {
		display: grid;
		gap: 0.5rem;
	}
	.checklist label {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		font-size: 0.9rem;
	}
	.checklist input {
		margin-top: 0.2rem;
		accent-color: var(--accent);
	}
</style>
