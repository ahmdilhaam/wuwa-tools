<script lang="ts">
	import { inlineMd } from '#lib/data/format.ts';
	import type { CharacterSection } from '#lib/data/types.ts';
	import Portrait from '#lib/ui/Portrait.svelte';
	import Rarity from '#lib/ui/Rarity.svelte';
	import ElementChip from '#lib/ui/ElementChip.svelte';

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
			: ([
					...c.echo.map((s) => ({ title: 'Echo', s })),
					c.weapons && { title: 'Senjata', s: c.weapons },
					c.stats && { title: 'Stat', s: c.stats },
					c.forte && { title: 'Forte', s: c.forte },
					c.substats && { title: 'Substat', s: c.substats },
					c.teams && { title: 'Tim', s: c.teams },
					c.rotation && { title: 'Rotasi', s: c.rotation },
					c.sequences && { title: 'Prioritas sequence', s: c.sequences },
					c.notes && { title: 'Catatan', s: c.notes },
					...c.other.map((s) => ({ title: 'Lainnya', s }))
				].filter(Boolean) as { title: string; s: CharacterSection }[])
	);

	// Teks Indonesia (fallback Inggris); paragraf dipisah baris kosong, baris baru tunggal dijaga lewat CSS.
	type Localized = { en: string; id: string };
	const paragraphs = (d: Localized, showEn: boolean) => (showEn ? d.en : d.id || d.en).split(/\n{2,}/);
	const hasTranslation = (list: { description: Localized }[]) => list.some((x) => x.description.id && x.description.id !== x.description.en);
	let showEnSkill = $state(false);
	let showEnSeq = $state(false);
	const skillsTranslated = $derived(hasTranslation(skills?.skills ?? []));
	const seqTranslated = $derived(hasTranslation(skills?.sequences ?? []));
	const movingSkills = $derived((skills?.skills ?? []).filter((sk) => sk.hits.length > 0));
</script>

<svelte:head>
	<title>{game.name} — WuWa Tools</title>
</svelte:head>

<p class="back"><a href="/characters/">Semua resonator</a></p>

<header class="panel-cut head" style="--c: var(--el-{game.element})">
	<svg class="wave" viewBox="0 0 400 120" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
		<path d="M0 60.0 L2 60.0 L4 60.0 L6 60.0 L8 60.0 L10 60.0 L12 60.0 L14 60.0 L16 60.0 L18 60.0 L20 60.0 L22 60.0 L24 60.0 L26 60.0 L28 60.0 L30 60.0 L32 60.0 L34 60.0 L36 60.0 L38 60.0 L40 60.0 L42 60.0 L44 60.0 L46 60.0 L48 60.0 L50 60.0 L52 60.0 L54 60.0 L56 60.0 L58 60.0 L60 60.0 L62 60.0 L64 60.0 L66 60.0 L68 60.0 L70 60.0 L72 60.0 L74 60.0 L76 60.0 L78 60.0 L80 60.0 L82 59.3 L84 57.3 L86 54.2 L88 50.5 L90 46.5 L92 42.7 L94 39.4 L96 36.9 L98 35.6 L100 35.6 L102 36.9 L104 39.7 L106 43.6 L108 48.5 L110 54.1 L112 60.0 L114 66.0 L116 71.6 L118 76.5 L120 80.6 L122 83.6 L124 85.6 L126 86.5 L128 86.3 L130 85.2 L132 83.2 L134 80.3 L136 76.9 L138 72.9 L140 68.7 L142 64.3 L144 60.0 L146 55.9 L148 52.1 L150 48.9 L152 46.2 L154 44.2 L156 42.8 L158 42.2 L160 42.3 L162 43.1 L164 44.5 L166 46.4 L168 48.7 L170 51.3 L172 54.2 L174 57.1 L176 60.0 L178 62.8 L180 65.3 L182 67.5 L184 69.3 L186 70.6 L188 71.5 L190 71.9 L192 71.8 L194 71.3 L196 70.4 L198 69.1 L200 67.6 L202 65.8 L204 63.9 L206 61.9 L208 60.0 L210 58.2 L212 56.5 L214 55.0 L216 53.8 L218 52.9 L220 52.3 L222 52.0 L224 52.1 L226 52.4 L228 53.0 L230 53.9 L232 54.9 L234 56.1 L236 57.4 L238 58.7 L240 60.0 L242 61.2 L244 62.4 L246 63.3 L248 64.2 L250 64.8 L252 65.2 L254 65.3 L256 65.3 L258 65.1 L260 64.7 L262 64.1 L264 63.4 L266 62.6 L268 61.8 L270 60.9 L272 60.0 L274 59.2 L276 58.4 L278 57.8 L280 57.2 L282 56.8 L284 56.5 L286 56.4 L288 56.4 L290 56.6 L292 56.9 L294 57.2 L296 57.7 L298 58.3 L300 58.8 L302 59.4 L304 60.0 L306 60.6 L308 61.1 L310 61.5 L312 61.9 L314 62.1 L316 62.3 L318 62.4 L320 62.4 L322 62.3 L324 62.1 L326 61.8 L328 61.5 L330 61.2 L332 60.8 L334 60.4 L336 60.0 L338 59.6 L340 59.3 L342 59.0 L344 58.7 L346 58.6 L348 58.4 L350 58.4 L352 58.4 L354 58.5 L356 58.6 L358 58.8 L360 59.0 L362 59.2 L364 59.5 L366 59.7 L368 60.0 L370 60.2 L372 60.5 L374 60.7 L376 60.8 L378 61.0 L380 61.0 L382 61.1 L384 61.1 L386 61.0 L388 60.9 L390 60.8 L392 60.7 L394 60.5 L396 60.4 L398 60.2 L400 60.0" />
	</svg>
	<Portrait src={game.icon} name={game.name} element={game.element} rarity={game.rarity} size={132} />
	<div class="info">
		<h1>{game.name}</h1>
		<div class="chips">
			<Rarity rarity={game.rarity} />
			<ElementChip element={game.element} />
			<span class="weapon">{game.weaponType}</span>
		</div>
		{#if c && c.roles.length}<p class="roles">{c.roles.join(' / ')}</p>{/if}
		{#if c?.source}<p class="src muted">Sumber: {c.source}</p>{/if}
	</div>
</header>

<nav class="subnav" aria-label="Bagian halaman">
	{#if c}<a href="#build">Build</a>{/if}
	{#if skills}
		<a href="#skill">Skill</a>
		<a href="#mv">Motion value</a>
		<a href="#sequence">Sequence</a>
	{/if}
</nav>

{#if !c}
	<p class="notice">Belum ada data build untuk resonator ini. Data skill dan sequence di bawah berasal dari game.</p>
{:else}
	<section id="build" class="block">
		<h2>Build</h2>
		<div class="sections">
			{#each blocks as { title, s }, i (i)}
				<section class="sec">
					<h3>{title}</h3>
					<p class="label muted">{s.label}</p>
					{#if s.value}<p>{@html inlineMd(s.value)}</p>{/if}
					{#if s.items.length}
						<ul>
							{#each s.items as item, j (j)}<li>{@html inlineMd(item)}</li>{/each}
						</ul>
					{/if}
				</section>
			{/each}
		</div>
	</section>
{/if}

{#if skills}
	<section id="skill" class="block">
		<h2>Skill</h2>
		{#if skillsTranslated}
			<button type="button" class="toggle" aria-pressed={showEnSkill} onclick={() => (showEnSkill = !showEnSkill)}>
				{showEnSkill ? 'Tampilkan terjemahan (Indonesia)' : 'Tampilkan teks asli (Inggris)'}
			</button>
		{:else}
			<p class="muted note">Teks dari game (bahasa Inggris)</p>
		{/if}
		{#each grouped as [type, list] (type)}
			<div class="group">
				<h3 class="group-title">{type}</h3>
				{#each list as sk, i (i)}
					<div class="skill">
						<strong>{sk.name}</strong>
						<details>
							<summary>Deskripsi</summary>
							{#each paragraphs(sk.description, showEnSkill) as para, k (k)}<p class="desc">{para}</p>{/each}
						</details>
					</div>
				{/each}
			</div>
		{/each}
	</section>

	<section id="mv" class="block">
		<h2>Motion value</h2>
		<div class="levels">
			<span class="muted" id="lvl-label">Level skill</span>
			<div class="segmented" role="group" aria-labelledby="lvl-label">
				{#each levels as l (l)}
					<button type="button" aria-pressed={level === l} onclick={() => (level = l)}>{l}</button>
				{/each}
			</div>
		</div>
		{#each movingSkills as sk, i (i)}
			<div class="mv">
				<h3>{sk.name} <span class="muted">{sk.type}</span></h3>
				<div class="table-wrap">
					<table>
						<thead>
							<tr><th>Jenis damage</th><th>Skala</th><th>Jenis</th><th class="num">MV Lv {level}</th></tr>
						</thead>
						<tbody>
							{#each sk.hits as h (h.id)}
								<tr>
									<td>{h.damageType}{#if h.condition}<div class="muted small">{h.condition}</div>{/if}</td>
									<td class="muted">{h.scaling}</td>
									<td class="muted">{h.kind}</td>
									<td class="num">{fmt(h.mv[level - 1])}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/each}
	</section>

	<section id="sequence" class="block">
		<h2>Sequence</h2>
		{#if seqTranslated}
			<button type="button" class="toggle" aria-pressed={showEnSeq} onclick={() => (showEnSeq = !showEnSeq)}>
				{showEnSeq ? 'Tampilkan terjemahan (Indonesia)' : 'Tampilkan teks asli (Inggris)'}
			</button>
		{/if}
		<ol class="seq">
			{#each skills.sequences as sq (sq.index)}
				<li>
					<span class="sn" aria-hidden="true">S{sq.index}</span>
					<div>
						<h3><span class="visually-hidden">S{sq.index}, </span>{sq.name}</h3>
						{#each paragraphs(sq.description, showEnSeq) as para, k (k)}<p class="desc">{para}</p>{/each}
					</div>
				</li>
			{/each}
		</ol>
	</section>
{/if}

<style>
	.back {
		margin: 0 0 0.75rem;
		font-size: var(--fs-sm);
	}
	.head {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		padding: 1.25rem 1.5rem;
		overflow: hidden;
	}
	.wave {
		position: absolute;
		right: 0;
		top: 0;
		width: auto;
		height: 100%;
		pointer-events: none;
		z-index: 0;
	}
	.wave path {
		fill: none;
		stroke: var(--c);
		stroke-width: 1.5;
		vector-effect: non-scaling-stroke;
		opacity: 0.35;
	}
	.head > :global(.portrait),
	.info {
		position: relative;
		z-index: 1;
	}
	.info h1 {
		font-size: var(--fs-2xl);
		margin: 0 0 0.5rem;
		overflow-wrap: anywhere;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 1rem;
		font-size: var(--fs-sm);
	}
	.weapon {
		font-size: var(--fs-xs);
		font-weight: 600;
		color: var(--text-muted);
	}
	.roles {
		margin: 0.6rem 0 0;
		font-size: var(--fs-sm);
	}
	.src {
		margin: 0.3rem 0 0;
		font-size: var(--fs-xs);
	}
	.subnav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		margin: 1.25rem 0 0.5rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--border);
		font-size: var(--fs-sm);
		font-weight: 500;
	}
	.subnav a {
		text-decoration: none;
	}
	.subnav a:hover {
		text-decoration: underline;
	}
	.notice {
		margin: 1rem 0;
		padding: 0.6rem 0.9rem;
		background: var(--violet-soft);
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
	}
	.block {
		margin-top: 2.5rem;
		scroll-margin-top: 4.5rem;
	}
	.sections {
		display: grid;
		gap: 1.75rem 2.5rem;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		align-items: start;
	}
	.sec {
		border-top: 1px solid var(--border-strong);
		padding-top: 0.6rem;
	}
	.sec h3 {
		margin-bottom: 0.2rem;
	}
	.label {
		margin: 0 0 0.4rem;
		font-size: var(--fs-xs);
	}
	.sec p,
	.sec li {
		overflow-wrap: anywhere;
	}
	ul {
		margin: 0.4rem 0 0;
		padding-left: 1.2rem;
	}
	li {
		margin: 0.2rem 0;
	}
	.note {
		font-size: var(--fs-sm);
	}
	.group {
		margin: 1.25rem 0;
		border-top: 1px solid var(--border);
		padding-top: 0.6rem;
	}
	.group-title {
		color: var(--text-muted);
		font-size: var(--fs-sm);
		font-weight: 500;
		margin-bottom: 0.4rem;
	}
	.skill {
		margin: 0.5rem 0;
	}
	.skill strong {
		font-weight: 600;
	}
	.desc {
		white-space: pre-line;
		color: var(--text-muted);
		max-width: 72ch;
		margin: 0.4rem 0 0;
	}
	.toggle {
		background: none;
		border: 0;
		padding: 0;
		color: var(--text-muted);
		font-size: var(--fs-xs);
		text-decoration: underline;
		cursor: pointer;
	}
	.levels {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.9rem;
		margin: 0.5rem 0 1.25rem;
		font-size: var(--fs-sm);
	}
	.mv {
		margin-bottom: 1.5rem;
	}
	.mv h3 {
		margin-bottom: 0.4rem;
	}
	.mv h3 .muted {
		font-size: var(--fs-xs);
		font-weight: 400;
		margin-left: 0.4rem;
	}
	.small {
		font-size: var(--fs-xs);
	}
	.seq {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1rem;
		max-width: 72ch;
	}
	.seq li {
		display: grid;
		grid-template-columns: 3rem 1fr;
		gap: 0.75rem;
		margin: 0;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
	}
	.sn {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: var(--fs-lg);
		color: var(--gold);
	}
	.seq h3 {
		margin-bottom: 0.2rem;
	}
	.seq .desc {
		margin-top: 0;
	}
	@media (max-width: 560px) {
		.head {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		.info h1 {
			font-size: var(--fs-xl);
		}
		.wave {
			top: 0;
			width: 60%;
			height: auto;
		}
	}
</style>
