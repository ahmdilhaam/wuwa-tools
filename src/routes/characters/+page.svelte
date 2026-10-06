<script lang="ts">
	import { elementOrder, weaponTypes } from '#lib/data/characters.ts';
	import { characterViews } from '#lib/data/merged.ts';
	import type { Element, WeaponType } from '#lib/data/types.ts';
	import Portrait from '#lib/ui/Portrait.svelte';
	import ElementChip from '#lib/ui/ElementChip.svelte';

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
	<title>Resonator — WuWa Tools</title>
</svelte:head>

<div class="page-head">
	<h1>Resonator</h1>
</div>

<div class="filters">
	<label class="grow">
		<span class="visually-hidden">Cari nama</span>
		<input type="search" placeholder="Cari resonator" bind:value={query} />
	</label>
	<div class="segmented" role="group" aria-label="Filter elemen">
		<button type="button" aria-pressed={element === null} onclick={() => (element = null)}>Semua</button>
		{#each elementOrder as el (el)}
			<button type="button" aria-pressed={element === el} onclick={() => (element = element === el ? null : el)}>
				<ElementChip element={el} />
			</button>
		{/each}
	</div>
	<label>
		Peran
		<select bind:value={role}>
			<option value="">Semua peran</option>
			{#each roles as r (r)}<option value={r}>{r}</option>{/each}
		</select>
	</label>
	<label>
		Tipe senjata
		<select bind:value={weapon}>
			<option value="">Semua tipe</option>
			{#each weaponTypes as w (w)}<option value={w}>{w}</option>{/each}
		</select>
	</label>
	<button type="button" class="btn" onclick={reset}>Atur ulang</button>
</div>

<p class="count muted">
	{filtered.length} resonator{#if role !== ''}. Filter peran hanya mencakup yang sudah punya data build.{/if}
</p>

<div class="grid">
	{#each filtered as { game: c, build } (c.slug)}
		<a class="tile" href="/characters/{c.slug}/">
			<Portrait src={c.icon} name={c.name} element={c.element} rarity={c.rarity} />
			<span class="name">{c.name}</span>
			<span class="line"><ElementChip element={c.element} /><span class="weapon muted">{c.weaponType}</span></span>
			{#if build}
				<span class="roles muted">{build.roles.join(' / ')}</span>
			{:else}
				<span class="badge">Belum ada data build</span>
			{/if}
		</a>
	{:else}
		<p class="muted">Tidak ada resonator yang cocok dengan filter.</p>
	{/each}
</div>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: end;
	}
	.filters label {
		flex: 0 1 9rem;
	}
	.filters .grow {
		flex: 1 1 10rem;
	}
	.segmented button {
		display: inline-flex;
		align-items: center;
		min-height: 2rem;
	}
	.segmented button :global(.el) {
		color: inherit;
		font-size: var(--fs-sm);
		font-weight: 500;
	}
	.count {
		margin: 1rem 0 0.75rem;
		font-size: var(--fs-sm);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
		gap: 0.75rem;
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.5rem 0.5rem 0.75rem;
		background: var(--surface);
		border-radius: var(--radius);
		color: var(--text);
		text-decoration: none;
	}
	.tile:hover {
		background: var(--surface-2);
	}
	.name {
		font-weight: 600;
		margin-top: 0.3rem;
	}
	.line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.weapon,
	.roles {
		font-size: var(--fs-xs);
	}
	.badge {
		align-self: flex-start;
		font-size: var(--fs-xs);
		padding: 0.1rem 0.5rem;
		border-radius: var(--radius-sm);
		background: var(--violet-soft);
		color: var(--violet);
	}
</style>
