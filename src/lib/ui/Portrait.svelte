<script lang="ts">
	import type { Element } from '#lib/data/types.ts';

	let {
		src,
		name,
		element,
		rarity,
		size
	}: { src: string; name: string; element: Element; rarity: 4 | 5; size?: number } = $props();

	let failed = $state(false);
	const initials = $derived(
		name
			.split(/\s+/)
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
	);
</script>

<span
	class="portrait r{rarity}"
	class:fluid={size === undefined}
	style="--c: var(--el-{element}); {size ? `width:${size}px` : ''}"
>
	{#if failed}
		<span class="ph" aria-label={name} role="img">{initials}</span>
	{:else}
		<img {src} alt={name} loading="lazy" width={size ?? 256} height={size ?? 256} onerror={() => (failed = true)} />
	{/if}
</span>

<style>
	.portrait {
		position: relative;
		display: block;
		aspect-ratio: 1;
		background: var(--surface-2);
		border-radius: var(--radius-sm);
		overflow: hidden;
		flex: none;
		border-bottom: 2px solid var(--c);
	}
	.fluid {
		width: 100%;
	}
	/* takik rarity di pojok kiri atas */
	.portrait::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
		width: 14px;
		height: 14px;
		background: var(--r);
		clip-path: polygon(0 0, 100% 0, 0 100%);
	}
	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.ph {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		font-family: var(--font-display);
		font-weight: 600;
		color: var(--text-muted);
	}
</style>
