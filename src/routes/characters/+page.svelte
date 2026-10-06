<script lang="ts">
	import { elementOrder, elementLabels, weaponTypes } from '#lib/data/characters.ts';
	import { characterViews } from '#lib/data/merged.ts';
	import type { Element, WeaponType } from '#lib/data/types.ts';

	let query = $state('');
	let element = $state<Element | null>(null);
	let role = $state('');
	let weapon = $state<WeaponType | ''>('');

	// Daftar peran unik (dipecah dari "Main DPS / Hybrid" dll).
	const roles = [...new Set(characterViews.flatMap((v) => v.build?.roles ?? []))].sort();

	const filtered = $derived(
		characterViews.filter(
			({ game: c, build }) =>
				c.name.toLowerCase().includes(query.trim().toLowerCase()) &&
				(element === null || c.element === element) &&
				(role === '' || (build?.roles.includes(role) ?? false)) &&
				(weapon === '' || c.weaponType === weapon)
		)
	);

	function reset() {
		query = '';
		element = null;
		role = '';
		weapon = '';
	}
</script>

<svelte:head>
	<title>Karakter — WuWa Tools</title>
</svelte:head>

<h1>Karakter</h1>

<div class="filters card">
	<input type="search" placeholder="Cari nama karakter…" bind:value={query} aria-label="Cari nama" />
	<div class="chips" role="group" aria-label="Filter elemen">
		<button type="button" class="chip" class:active={element === null} onclick={() => (element = null)}>Semua</button>
		{#each elementOrder as el (el)}
			<button
				type="button"
				class="chip"
				class:active={element === el}
				style="--c: var(--el-{el})"
				onclick={() => (element = element === el ? null : el)}>{elementLabels[el]}</button
			>
		{/each}
	</div>
	<div class="selects">
		<label
			>Peran
			<select bind:value={role}>
				<option value="">Semua peran</option>
				{#each roles as r (r)}<option value={r}>{r}</option>{/each}
			</select>
		</label>
		<label
			>Tipe senjata
			<select bind:value={weapon}>
				<option value="">Semua tipe</option>
				{#each weaponTypes as w (w)}<option value={w}>{w}</option>{/each}
			</select>
		</label>
		<button type="button" class="chip" onclick={reset}>Atur ulang</button>
	</div>
</div>

<p class="count">
	{filtered.length} dari {characterViews.length} karakter
	{#if role !== ''}<span class="muted"> — filter peran hanya mencakup karakter yang sudah punya data build.</span>{/if}
</p>

<div class="grid">
	{#each filtered as { game: c, build } (c.slug)}
		<a class="card char" href="/characters/{c.slug}/" style="--c: var(--el-{c.element})">
			<img src={c.icon} alt={c.name} loading="lazy" width="64" height="64" />
			<div class="info">
				<span class="el">{elementLabels[c.element]}</span>
				<h2>{c.name}</h2>
				<p class="meta">{'★'.repeat(c.rarity)} · {c.weaponType}</p>
				<p class="roles">
					{#if build}{build.roles.join(' / ')}{:else}<span class="badge">Belum ada data build</span>{/if}
				</p>
			</div>
		</a>
	{:else}
		<p class="muted">Tidak ada karakter yang cocok dengan filter.</p>
	{/each}
</div>

<style>
	.filters {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	input[type='search'],
	select {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.45rem 0.7rem;
		width: 100%;
	}
	.chips,
	.selects {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: end;
	}
	.selects label {
		display: flex;
		flex-direction: column;
		font-size: 0.8rem;
		color: var(--text-muted);
		gap: 0.2rem;
		flex: 1 1 160px;
	}
	.chip {
		--c: var(--accent);
		background: transparent;
		border: 1px solid var(--c);
		color: var(--c);
		border-radius: 999px;
		padding: 0.3rem 0.8rem;
		cursor: pointer;
	}
	.chip.active {
		background: var(--c);
		color: var(--bg);
	}
	.count {
		color: var(--text-muted);
		margin: 1rem 0 0.5rem;
	}
	.muted {
		color: var(--text-muted);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		gap: 0.8rem;
	}
	.char {
		display: flex;
		gap: 0.7rem;
		align-items: center;
		text-decoration: none;
		color: var(--text);
		border-left: 4px solid var(--c);
		transition: background 0.15s;
	}
	.char:hover {
		background: var(--surface-2);
	}
	.char h2 {
		margin: 0.1rem 0;
		font-size: 1.05rem;
	}
	.el {
		color: var(--c);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.roles,
	.meta {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.char img {
		width: 64px;
		height: 64px;
		border-radius: 8px;
		background: var(--surface-2);
		object-fit: cover;
		flex: none;
	}
	.badge {
		display: inline-block;
		padding: 0.05rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.72rem;
	}
</style>
