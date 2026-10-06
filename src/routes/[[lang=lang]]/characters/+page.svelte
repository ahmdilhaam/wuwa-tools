<script lang="ts">
	import { elementOrder, weaponTypes } from '#lib/data/characters.ts';
	import { characterViews } from '#lib/data/merged.ts';
	import type { Element, WeaponType } from '#lib/data/types.ts';
	import Portrait from '#lib/ui/Portrait.svelte';
	import ElementChip from '#lib/ui/ElementChip.svelte';
	import { localize, t } from '#lib/i18n/index.svelte.ts';

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
	<title>{t('library.pageTitle', { name: t('library.characters.title') })}</title>
</svelte:head>

<div class="page-head">
	<h1>{t('library.characters.title')}</h1>
</div>

<div class="filters">
	<label class="grow">
		<span class="visually-hidden">{t('library.characters.searchLabel')}</span>
		<input type="search" placeholder={t('library.characters.searchPlaceholder')} bind:value={query} />
	</label>
	<div class="segmented" role="group" aria-label={t('library.characters.elementFilter')}>
		<button type="button" aria-pressed={element === null} onclick={() => (element = null)}>{t('library.characters.all')}</button>
		{#each elementOrder as el (el)}
			<button type="button" aria-pressed={element === el} onclick={() => (element = element === el ? null : el)}>
				<ElementChip element={el} />
			</button>
		{/each}
	</div>
	<label>
		{t('library.characters.role')}
		<select bind:value={role}>
			<option value="">{t('library.characters.allRoles')}</option>
			{#each roles as r (r)}<option value={r}>{r}</option>{/each}
		</select>
	</label>
	<label>
		{t('library.characters.weaponType')}
		<select bind:value={weapon}>
			<option value="">{t('library.characters.allWeaponTypes')}</option>
			{#each weaponTypes as w (w)}<option value={w}>{w}</option>{/each}
		</select>
	</label>
	<button type="button" class="btn" onclick={reset}>{t('library.characters.reset')}</button>
</div>

<p class="count muted">
	{t('characters.count', { count: filtered.length })}{#if role !== ''}. {t('library.characters.roleNote')}{/if}
</p>

<div class="grid">
	{#each filtered as { game: c, build } (c.slug)}
		<a class="tile" href={localize(`/characters/${c.slug}/`)}>
			<Portrait src={c.icon} name={c.name} element={c.element} rarity={c.rarity} />
			<span class="name">{c.name}</span>
			<span class="line"><ElementChip element={c.element} /><span class="weapon muted">{c.weaponType}</span></span>
			{#if build}
				<span class="roles muted">{build.roles.join(' / ')}</span>
			{:else}
				<span class="badge">{t('library.characters.noBuild')}</span>
			{/if}
		</a>
	{:else}
		<p class="muted">{t('library.characters.empty')}</p>
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
