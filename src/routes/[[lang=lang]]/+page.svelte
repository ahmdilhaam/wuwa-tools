<script lang="ts">
	import meta from '#lib/data/game/meta.json';
	import { characterViews } from '#lib/data/merged.ts';
	import type { Element } from '#lib/data/types.ts';
	import Portrait from '#lib/ui/Portrait.svelte';
	import ElementChip from '#lib/ui/ElementChip.svelte';
	import { localize, numberLocale, t } from '#lib/i18n/index.svelte.ts';

	const updated = $derived(
		new Date(meta.fetchedAt).toLocaleDateString(numberLocale(), {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		})
	);

	// Urutan elemen seperti di menu game.
	const order: Element[] = ['glacio', 'fusion', 'electro', 'aero', 'spectro', 'havoc'];

	let query = $state('');
	const groups = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return order
			.map((element) => ({
				element,
				list: characterViews.filter(
					({ game: c }) => c.element === element && c.name.toLowerCase().includes(q)
				)
			}))
			.filter((g) => g.list.length > 0);
	});

	const library = $derived([
		{ href: '/echo-sets/', title: t('layout.nav.echoSets'), text: t('home.library.echoSets', { count: 37 }) },
		{ href: '/weapons/', title: t('layout.nav.weapons'), text: t('home.library.weapons', { count: 124 }) },
		{ href: '/mechanics/', title: t('layout.nav.mechanics'), text: t('home.library.mechanics') }
	]);
</script>

<svelte:head>
	<title>WuWa Tools</title>
</svelte:head>

<h1 class="title">{t('home.title')}</h1>
<p class="lede muted">{t('home.lede')}</p>

<section class="roster" aria-labelledby="roster-h">
	<h2 id="roster-h" class="visually-hidden">{t('home.rosterHeading')}</h2>
	<label class="search">
		<span class="visually-hidden">{t('home.searchLabel')}</span>
		<input type="search" placeholder={t('home.searchPlaceholder')} bind:value={query} />
	</label>

	{#each groups as g (g.element)}
		<div class="row">
			<h3 class="row-title"><ElementChip element={g.element} /></h3>
			<ul class="wall">
				{#each g.list as { game: c } (c.slug)}
					<li>
						<a href={localize(`/characters/${c.slug}/`)} title={c.name} aria-label={c.name}>
							<Portrait src={c.icon} name={c.name} element={c.element} rarity={c.rarity} size={64} />
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{:else}
		<p class="muted">{t('home.noResults', { query })}</p>
	{/each}
</section>

<div class="split">
	<section class="calc">
		<h2>{t('home.calc.title')}</h2>
		<p class="muted">{t('home.calc.text')}</p>
		<a class="btn btn-primary" href={localize('/calculator/')}>{t('home.calc.open')}</a>
	</section>
	<section class="lib">
		<h2>{t('home.library.title')}</h2>
		<ul>
			{#each library as l (l.href)}
				<li>
					<a href={localize(l.href)}>{l.title}</a>
					<span class="muted">{l.text}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

<p class="fresh muted">{t('home.updated', { date: updated })}</p>

<style>
	.title {
		font-size: var(--fs-3xl);
		margin: 0.5rem 0 0.6rem;
	}
	.lede {
		margin-bottom: 1.5rem;
	}
	.search {
		max-width: 22rem;
		margin-bottom: 1rem;
	}
	.roster {
		margin-bottom: 2.5rem;
	}
	.row {
		display: grid;
		grid-template-columns: 6rem 1fr;
		gap: 0.75rem;
		align-items: start;
		padding: 0.75rem 0;
		border-top: 1px solid var(--border);
	}
	.row-title {
		margin: 0.35rem 0 0;
		font-size: var(--fs-sm);
	}
	.wall {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.wall a {
		display: block;
		border-radius: var(--radius-sm);
	}
	.wall a:hover {
		filter: brightness(1.15);
	}
	.split {
		display: grid;
		grid-template-columns: 3fr 2fr;
		gap: 2.5rem;
		align-items: start;
	}
	.calc {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 1.5rem 1.75rem;
	}
	.calc h2,
	.lib h2 {
		margin-bottom: 0.5rem;
	}
	.calc p {
		margin-bottom: 1.1rem;
	}
	.lib ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.lib li {
		display: grid;
		gap: 0.1rem;
		padding: 0.6rem 0;
		border-top: 1px solid var(--border);
		font-size: var(--fs-sm);
	}
	.lib li a {
		font-weight: 600;
		width: fit-content;
	}
	.fresh {
		margin-top: 2rem;
		font-size: var(--fs-xs);
	}
	@media (max-width: 720px) {
		.split {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		.row {
			grid-template-columns: 1fr;
			gap: 0.4rem;
		}
		.row-title {
			margin: 0;
		}
	}
</style>
