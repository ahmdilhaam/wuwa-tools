<script lang="ts">
	import { elementLabels } from '#lib/data/characters.ts';
	import { inlineMd } from '#lib/data/format.ts';
	import type { CharacterSection } from '#lib/data/types.ts';

	let { data } = $props();
	const game = $derived(data.view.game);
	const c = $derived(data.view.build);
	const skills = $derived(data.skills);

	// Urutan jenis skill yang ditampilkan; jenis lain menyusul sesuai urutan sumber.
	const typeOrder = ['Normal Attack', 'Resonance Skill', 'Resonance Liberation', 'Forte Circuit', 'Intro Skill', 'Outro Skill', 'Inherent Skill', 'Tune Break'];
	const grouped = $derived.by(() => {
		const map = new Map<string, NonNullable<typeof skills>['skills']>();
		for (const sk of skills?.skills ?? []) {
			if (!map.has(sk.type)) map.set(sk.type, []);
			map.get(sk.type)!.push(sk);
		}
		return [...map.entries()].sort(
			([a], [b]) => (typeOrder.indexOf(a) + 100) % 100 - (typeOrder.indexOf(b) + 100) % 100
		);
	});

	// Level MV yang dipilih (1–10), default Lv10.
	let level = $state(10);
	const levels = Array.from({ length: 10 }, (_, i) => i + 1);
	const fmt = (n: number | undefined) => (n === undefined ? '—' : `${Math.round(n * 100) / 100}%`);

	// Urutan tetap bagian: Echo, Senjata, Stat, Forte, Substat, Tim, Rotasi, Sequence, Catatan, lainnya.
	const blocks = $derived(
		!c
			? []
			: [
			...c.echo.map((s) => ({ title: 'Echo', s })),
			c.weapons && { title: 'Senjata', s: c.weapons },
			c.stats && { title: 'Stat', s: c.stats },
			c.forte && { title: 'Forte', s: c.forte },
			c.substats && { title: 'Substat', s: c.substats },
			c.teams && { title: 'Tim', s: c.teams },
			c.rotation && { title: 'Rotasi', s: c.rotation },
			c.sequences && { title: 'Sequence', s: c.sequences },
			c.notes && { title: 'Catatan', s: c.notes },
			...c.other.map((s) => ({ title: 'Lainnya', s }))
		].filter(Boolean) as { title: string; s: CharacterSection }[]
	);
</script>

<svelte:head>
	<title>{game.name} — WuWa Tools</title>
</svelte:head>

<p><a href="/characters/">← Semua karakter</a></p>

<header class="head" style="--c: var(--el-{game.element})">
	<img src={game.icon} alt={game.name} width="96" height="96" />
	<div>
		<span class="el">{elementLabels[game.element]}</span>
		<h1>{game.name}</h1>
		<p class="meta">
			{'★'.repeat(game.rarity)} · {game.weaponType}
			{#if c && c.roles.length}· {c.roles.join(' / ')}{/if}
		</p>
		{#if c?.source}<p class="src">Sumber: {c.source}</p>{/if}
	</div>
</header>

{#if !c}
	<p class="card notice">Belum ada data build untuk karakter ini. Data skill dan sequence di bawah berasal dari game.</p>
{/if}

<div class="sections">
	{#each blocks as { title, s }, i (i)}
		<section class="card">
			<h2>{title}</h2>
			<p class="label">{s.label}</p>
			{#if s.value}<p>{@html inlineMd(s.value)}</p>{/if}
			{#if s.items.length}
				<ul>
					{#each s.items as item, j (j)}<li>{@html inlineMd(item)}</li>{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>

{#if skills}
	<p class="muted src-note">Teks dari game (bahasa Inggris).</p>

	<h2 class="sec">Skill</h2>
	{#each grouped as [type, list] (type)}
		<section class="card skill-group">
			<h3>{type}</h3>
			{#each list as sk, i (i)}
				<div class="skill">
					<strong>{sk.name}</strong>
					<details>
						<summary>Deskripsi</summary>
						<p class="desc">{sk.description.en}</p>
					</details>
				</div>
			{/each}
		</section>
	{/each}

	<h2 class="sec">Motion Value</h2>
	<label class="lvl">Level skill
		<select bind:value={level}>
			{#each levels as l (l)}<option value={l}>Lv {l}</option>{/each}
		</select>
	</label>
	{#each skills.skills.filter((sk) => sk.hits.length > 0) as sk, i (i)}
		<section class="card">
			<h3>{sk.name} <span class="muted">({sk.type})</span></h3>
			<div class="table-wrap">
				<table>
					<thead>
						<tr><th>Jenis damage</th><th>Skala</th><th>Jenis</th><th>MV Lv {level}</th></tr>
					</thead>
					<tbody>
						{#each sk.hits as h (h.id)}
							<tr>
								<td>{h.damageType}{#if h.condition}<div class="muted small">{h.condition}</div>{/if}</td>
								<td>{h.scaling}</td>
								<td>{h.kind}</td>
								<td>{fmt(h.mv[level - 1])}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/each}

	<h2 class="sec">Sequence</h2>
	<div class="sections">
		{#each skills.sequences as sq (sq.index)}
			<section class="card">
				<h3>S{sq.index} — {sq.name}</h3>
				<p class="desc">{sq.description.en}</p>
			</section>
		{/each}
	</div>
{/if}

<style>
	.head {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	.head img {
		width: 96px;
		height: 96px;
		border-radius: 10px;
		background: var(--surface-2);
	}
	.notice {
		border-color: var(--danger);
	}
	.muted {
		color: var(--text-muted);
	}
	.small {
		font-size: 0.8rem;
	}
	.sec {
		margin: 2rem 0 0.6rem;
	}
	.skill-group,
	section.card {
		margin-bottom: 0.8rem;
	}
	h3 {
		margin: 0 0 0.4rem;
		font-size: 1rem;
	}
	.skill {
		margin: 0.4rem 0;
	}
	.desc {
		white-space: pre-line;
		color: var(--text-muted);
	}
	.lvl {
		display: inline-flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 0.8rem;
	}
	.lvl select {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.35rem 0.6rem;
		color: var(--text);
	}

	.head {
		border-left: 4px solid var(--c);
		padding-left: 1rem;
		margin-bottom: 1.5rem;
	}
	.head h1 {
		margin: 0.1rem 0;
	}
	.el {
		color: var(--c);
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.meta,
	.src,
	.label {
		margin: 0.2rem 0;
		color: var(--text-muted);
		font-size: 0.9rem;
	}
	.sections {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
		align-items: start;
	}
	h2 {
		margin: 0 0 0.2rem;
		font-size: 1.1rem;
		color: var(--accent);
	}
	ul {
		margin: 0.4rem 0 0;
		padding-left: 1.2rem;
	}
	li {
		margin: 0.2rem 0;
	}
	p {
		overflow-wrap: anywhere;
	}
</style>
