<script lang="ts">
	// Bendera Indonesia: merah di atas, putih di bawah, rasio 3:2.
	let { size = 18 }: { size?: number } = $props();
</script>

<svg viewBox="0 0 3 2" width={size} height={(size * 2) / 3} aria-hidden="true" focusable="false">
	<rect width="3" height="1" fill="#e70011" />
	<rect y="1" width="3" height="1" fill="#ffffff" />
</svg>
