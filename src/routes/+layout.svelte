<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const nav = [
		{ href: '/', label: 'Beranda' },
		{ href: '/calculator/', label: 'Kalkulator' },
		{ href: '/characters/', label: 'Karakter' },
		{ href: '/echo-sets/', label: 'Echo Set' },
		{ href: '/weapons/', label: 'Senjata' },
		{ href: '/mechanics/', label: 'Mekanik' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>WuWa Tools</title>
</svelte:head>

<header class="topbar">
	<a class="brand" href="/">WuWa Tools</a>
	<nav>
		{#each nav as item (item.href)}
			<a
				href={item.href}
				aria-current={item.href === '/'
					? page.url.pathname === '/'
					: page.url.pathname.startsWith(item.href)}>{item.label}</a
			>
		{/each}
	</nav>
</header>

<main>
	{@render children()}
</main>

<style>
	.topbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.5rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		position: sticky;
		top: 0;
		z-index: 10;
	}
	.brand {
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	nav a {
		padding: 0.35rem 0.7rem;
		border-radius: 6px;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.9rem;
	}
	nav a:hover {
		background: var(--surface-2);
		color: var(--text);
	}
	nav a[aria-current='true'] {
		background: var(--accent-soft);
		color: var(--accent);
	}
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}
</style>
