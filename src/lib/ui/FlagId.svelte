<script lang="ts">
	// Indonesian flag: red on top, white below, 3:2 ratio.
	let { size = 18 }: { size?: number } = $props();
</script>

<svg viewBox="0 0 3 2" width={size} height={(size * 2) / 3} aria-hidden="true" focusable="false">
	<rect width="3" height="1" fill="#e70011" />
	<rect y="1" width="3" height="1" fill="#ffffff" />
</svg>
