<script lang="ts">
	import gameWeapons from '#lib/data/game/weapons.json';
	import type { GameWeapon, WeaponType } from '#lib/data/game/types.ts';
	import { weaponTypes } from '#lib/data/characters.ts';
	import { weapons as handWeapons, weaponNotes } from '#lib/data/weapons.ts';
	import { normalizeName } from '#lib/data/merged.ts';
	import Rarity from '#lib/ui/Rarity.svelte';
	import { gameText, getLocale, t } from '#lib/i18n/index.svelte.ts';

	const list = gameWeapons as GameWeapon[];
	const usersByName = new Map(handWeapons.map((w) => [normalizeName(w.name), w]));

	let query = $state('');
	let type = $state<WeaponType | ''>('');
	let rarity = $state<number | 0>(0);
	/** Refinement per senjata (1–5), default R1 */
	let refine = $state<Record<number, number>>({});

	const rarities = [5, 4, 3, 2, 1];
	const filtered = $derived(
		list.filter(
			(w) =>
				w.name.toLowerCase().includes(query.trim().toLowerCase()) &&
				(type === '' || w.type === type) &&
				(rarity === 0 || w.rarity === rarity)
		)
	);

	/** Tampilkan bahasa lainnya (bukan bahasa aktif) di detail pasif */
	let showOther = $state(false);
	const passiveText = (w: GameWeapon, r: number) => {
		const p = w.passive[`r${r}` as 'r1' | 'r2' | 'r3' | 'r4' | 'r5'];
		const lang = (getLocale() === 'en') !== showOther ? 'en' : 'id';
		return lang === 'en' ? p.en : p.id || p.en;
	};
	const translated = $derived(list.some((w) => w.passive.r1.id !== w.passive.r1.en));
	const secondaryUnit = (name: string) => (name.endsWith('%') || name.startsWith('Crit') || name === 'Energy Regen' ? '%' : '');
</script>

<svelte:head>
	<title>{t('library.pageTitle', { name: t('library.weapons.title') })}</title>
</svelte:head>

<div class="page-head">
	<h1>{t('library.weapons.title')}</h1>
	<p>{t('library.weapons.introCount', { count: list.length })}{#if !translated && getLocale() === 'id'} {t('library.weapons.introPassiveEnglish')}{/if} {t('library.weapons.introUsers')}</p>
</div>

<div class="filters">
	<label class="grow">
		<span class="visually-hidden">{t('library.weapons.searchLabel')}</span>
		<input type="search" placeholder={t('library.weapons.searchPlaceholder')} bind:value={query} />
	</label>
	<label>
		{t('library.weapons.type')}
		<select bind:value={type}>
			<option value="">{t('library.weapons.allTypes')}</option>
			{#each weaponTypes as t (t)}<option value={t}>{t}</option>{/each}
		</select>
	</label>
	<label>
		{t('library.weapons.rarity')}
		<select bind:value={rarity}>
			<option value={0}>{t('library.weapons.allRarities')}</option>
			{#each rarities as r (r)}<option value={r}>{t('library.stars', { count: r })}</option>{/each}
		</select>
	</label>
</div>

<p class="muted count">{t('library.weapons.count', { count: filtered.length })}</p>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>{t('library.weapons.weapon')}</th>
				<th>{t('library.weapons.type')}</th>
				<th>{t('library.weapons.rarity')}</th>
				<th class="num">{t('library.weapons.atk')}</th>
				<th class="num">{t('library.weapons.secondary')}</th>
				<th>{t('library.weapons.users')}</th>
				<th>{t('library.weapons.passive')}</th>
			</tr>
		</thead>
		<tbody>
			{#each filtered as w (w.id)}
				{@const hand = usersByName.get(normalizeName(w.name))}
				{@const r = refine[w.id] ?? 1}
				<tr>
					<td>
						<span class="nm">
							<img src={w.icon} alt="" loading="lazy" width="36" height="36" />
							<strong>{w.name}</strong>
						</span>
					</td>
					<td>{w.type}</td>
					<td><Rarity rarity={w.rarity} /></td>
					<td class="num">{w.atk90}</td>
					<td class="num"><span class="muted">{w.secondary.name}</span> {w.secondary.value90}{secondaryUnit(w.secondary.name)}</td>
					<td class="users">{hand?.users.join(', ') ?? '—'}</td>
					<td class="passive">
						<details>
							<summary>{w.passive.name}</summary>
							<div class="segmented" role="group" aria-label={t('library.weapons.refinement', { name: w.name })}>
								{#each [1, 2, 3, 4, 5] as n (n)}
									<button type="button" aria-pressed={r === n} onclick={() => (refine[w.id] = n)}>R{n}</button>
								{/each}
							</div>
							<p class="desc">{passiveText(w, r)}</p>
							{#if translated}
								<label class="orig muted"><input type="checkbox" bind:checked={showOther} />
									{getLocale() === 'en' ? t('library.toggle.showTranslation') : t('library.toggle.showOriginal')}</label>
							{/if}
						</details>
					</td>
				</tr>
			{:else}
				<tr><td colspan="7" class="muted">{t('library.weapons.empty')}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<section class="notes">
	<h2>{t('library.weapons.notesHeading')}</h2>
	<ul>
		{#each weaponNotes as n (n.en)}<li>{gameText(n)}</li>{/each}
	</ul>
</section>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: end;
	}
	.filters label {
		flex: 0 1 11rem;
	}
	.filters .grow {
		flex: 1 1 14rem;
	}
	.count {
		margin: 1rem 0 0.75rem;
		font-size: var(--fs-sm);
	}
	.nm {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		min-width: 11rem;
	}
	.nm img {
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		flex: none;
	}
	.users {
		max-width: 24ch;
		min-width: 10rem;
	}
	.orig {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
	}
	.passive {
		min-width: 16rem;
		max-width: 48ch;
	}
	.passive .segmented {
		margin: 0.5rem 0;
	}
	.passive .segmented button {
		padding: 0.25rem 0.6rem;
	}
	.desc {
		white-space: pre-line;
		color: var(--text-muted);
		max-width: 48ch;
		margin: 0;
	}
	.notes {
		margin-top: 2.5rem;
		max-width: 72ch;
	}
	.notes ul {
		margin: 0;
		padding-left: 1.2rem;
	}
	.notes li {
		margin: 0.3rem 0;
	}
</style>
