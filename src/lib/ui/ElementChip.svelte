<script lang="ts">
	import { elementLabels } from '#lib/data/characters.ts';
	import type { Element } from '#lib/data/types.ts';

	let { element }: { element: Element } = $props();
</script>

<span class="el el-{element}">{elementLabels[element]}</span>
