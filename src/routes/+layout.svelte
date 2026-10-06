<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const nav = [
		{ href: '/calculator/', label: 'Kalkulator' },
		{ href: '/characters/', label: 'Resonator' },
		{ href: '/echo-sets/', label: 'Echo set' },
		{ href: '/weapons/', label: 'Senjata' },
		{ href: '/mechanics/', label: 'Mekanik' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>WuWa Tools</title>
</svelte:head>

<a class="skip" href="#main">Lewati ke konten</a>

<header class="topbar">
	<div class="inner">
		<a class="brand" href="/" aria-label="WuWa Tools, beranda">
			<!-- Gelombang resonansi: tiga puncak dengan amplitudo menurun -->
			<svg viewBox="0 0 40 20" aria-hidden="true">
				<path d="M1 10 Q5 1 9 10 T17 10 Q20 4 23 10 T29 10 Q31 7 33 10 T39 10" />
			</svg>
			<span>WuWa Tools</span>
		</a>
		<nav aria-label="Navigasi utama">
			{#each nav as item (item.href)}
				<a href={item.href} aria-current={page.url.pathname.startsWith(item.href) ? 'page' : undefined}
					>{item.label}</a
				>
			{/each}
		</nav>
	</div>
</header>

<main id="main">
	{@render children()}
</main>

<footer class="foot">
	<div class="inner">
		Data game dari <a href="https://encore.moe" rel="noopener">encore.moe</a>. Proyek penggemar, tidak
		berafiliasi dengan Kuro Games.
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
			width: 100%;
			gap: 0 0.1rem;
		}
		nav a {
			padding: 0.55rem 0.6rem;
			white-space: nowrap;
		}
	}
</style>
