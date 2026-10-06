<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		enableLocationSuffix,
		localize,
		pathForLocale,
		switchLocaleHref,
		t,
		type Locale
	} from '#lib/i18n/index.svelte.ts';
	import FlagId from '#lib/ui/FlagId.svelte';
	import FlagUk from '#lib/ui/FlagUk.svelte';
	import '../../app.css';

	let { children } = $props();

	const nav = [
		{ href: '/calculator/', label: 'layout.nav.calculator' },
		{ href: '/characters/', label: 'layout.nav.characters' },
		{ href: '/echo-sets/', label: 'layout.nav.echoSets' },
		{ href: '/weapons/', label: 'layout.nav.weapons' },
		{ href: '/mechanics/', label: 'layout.nav.mechanics' }
	] as const;

	const languages: { locale: Locale; code: string; name: string }[] = [
		{ locale: 'id', code: 'ID', name: 'Bahasa Indonesia' },
		{ locale: 'en', code: 'EN', name: 'English' }
	];

	const current = $derived<Locale>(page.params.lang === 'en' ? 'en' : 'id');

	onMount(enableLocationSuffix);

	// Navigasi klien tidak memuat ulang HTML, jadi <html lang> disinkronkan di sini.
	$effect(() => {
		document.documentElement.lang = current;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>WuWa Tools</title>
	<link rel="alternate" hreflang="id" href={pathForLocale(page.url.pathname, 'id')} />
	<link rel="alternate" hreflang="en" href={pathForLocale(page.url.pathname, 'en')} />
	<link rel="alternate" hreflang="x-default" href={pathForLocale(page.url.pathname, 'id')} />
</svelte:head>

<a class="skip" href="#main">{t('layout.skip')}</a>

<header class="topbar">
	<div class="inner">
		<a class="brand" href={localize('/')} aria-label={t('layout.brandLabel')}>
			<!-- Gelombang resonansi: tiga puncak dengan amplitudo menurun -->
			<svg viewBox="0 0 40 20" aria-hidden="true">
				<path d="M1 10 Q5 1 9 10 T17 10 Q20 4 23 10 T29 10 Q31 7 33 10 T39 10" />
			</svg>
			<span>WuWa Tools</span>
		</a>
		<nav aria-label={t('layout.navLabel')}>
			{#each nav as item (item.href)}
				<a
					href={localize(item.href)}
					aria-current={page.url.pathname.startsWith(localize(item.href)) ? 'page' : undefined}
					>{t(item.label)}</a
				>
			{/each}
		</nav>
		<div class="lang" role="group" aria-label={t('layout.language')}>
			{#each languages as l (l.locale)}
				<a
					href={switchLocaleHref(l.locale)}
					hreflang={l.locale}
					lang={l.locale}
					aria-label={l.name}
					aria-current={current === l.locale ? 'true' : undefined}
				>
					<span class="flag">
						{#if l.locale === 'id'}<FlagId size={18} />{:else}<FlagUk size={18} />{/if}
					</span>
					{l.code}
				</a>
			{/each}
		</div>
	</div>
</header>

<main id="main">
	{@render children()}
</main>

<footer class="foot">
	<div class="inner">
		{t('layout.footer.dataFrom')}
		<a href="https://encore.moe" rel="noopener">encore.moe</a>. {t('layout.footer.disclaimer')}
	</div>
</footer>

<style>
	.skip {
		position: absolute;
		left: -999px;
		top: 0.5rem;
		padding: 0.5rem 0.8rem;
		background: var(--gold);
		color: #1a1405;
		border-radius: var(--radius-sm);
		z-index: 20;
	}
	.skip:focus {
		left: 0.5rem;
	}
	.topbar {
		position: sticky;
		top: 0;
		z-index: 10;
		background: color-mix(in srgb, var(--bg) 82%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--border);
	}
	.inner {
		max-width: 1240px;
		margin: 0 auto;
		padding: 0 1rem;
	}
	.topbar .inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 2rem;
		min-height: 3.5rem;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		color: var(--text);
		text-decoration: none;
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.95rem;
		letter-spacing: -0.01em;
	}
	.brand svg {
		width: 2rem;
		height: 1rem;
		fill: none;
		stroke: var(--gold);
		stroke-width: 2;
		stroke-linecap: round;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem;
		margin-left: -0.6rem;
	}
	nav a {
		position: relative;
		padding: 0.9rem 0.6rem;
		color: var(--text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
		font-weight: 500;
	}
	nav a:hover {
		color: var(--text);
	}
	nav a[aria-current='page'] {
		color: var(--text);
	}
	nav a[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 0.6rem;
		right: 0.6rem;
		bottom: -1px;
		height: 2px;
		background: var(--gold);
	}
	.lang {
		display: inline-flex;
		margin-left: auto;
		padding: 2px;
		gap: 2px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}
	.lang a {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.55rem;
		color: var(--text-muted);
		text-decoration: none;
		font-size: var(--fs-xs);
		font-weight: 600;
		border-radius: 4px;
	}
	.lang a:hover {
		color: var(--text);
	}
	.lang a[aria-current='true'] {
		background: var(--surface-3);
		color: var(--text);
	}
	.flag {
		display: inline-flex;
		line-height: 0;
		border-radius: 2px;
		outline: 1px solid var(--border-strong);
		outline-offset: 0;
		overflow: hidden;
	}
	main {
		max-width: 1240px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
		min-height: 70vh;
	}
	.foot {
		border-top: 1px solid var(--border);
		color: var(--text-faint);
		font-size: var(--fs-xs);
	}
	.foot .inner {
		padding: 1.25rem 1rem 2rem;
	}
	.foot a {
		color: var(--text-muted);
	}
	@media (max-width: 640px) {
		.topbar .inner {
			padding-top: 0.5rem;
		}
		/* Lima tautan muat dalam dua baris; lebih rapi daripada scroll horizontal. */
		nav {
			order: 2;
			width: 100%;
			gap: 0 0.1rem;
		}
		/* Pengganti bahasa tetap di baris merek, rata kanan; nav turun ke bawah. */
		.lang {
			order: 1;
		}
		nav a {
			padding: 0.55rem 0.6rem;
			white-space: nowrap;
		}
	}
</style>
