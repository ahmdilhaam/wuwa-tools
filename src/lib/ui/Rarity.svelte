<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';

	let { rarity }: { rarity: number } = $props();
</script>

<span class="rarity r{rarity}" role="img" aria-label={t('library.stars', { count: rarity })}>{'★'.repeat(rarity)}</span>

<style>
	.rarity {
		color: var(--r, var(--text-muted));
		letter-spacing: 0.05em;
		white-space: nowrap;
		line-height: 1;
	}
</style>
