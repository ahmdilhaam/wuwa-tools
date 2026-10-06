<script lang="ts">
	let { rarity }: { rarity: number } = $props();
</script>

<span class="rarity r{rarity}" role="img" aria-label="{rarity} bintang">{'★'.repeat(rarity)}</span>

<style>
	.rarity {
		color: var(--r, var(--text-muted));
		letter-spacing: 0.05em;
		white-space: nowrap;
		line-height: 1;
	}
</style>
