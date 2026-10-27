<script lang="ts">
	// Union Jack: standard 60x30 construction. The box renders at 3:2 to line up with FlagId,
	// so the left and right sides are slightly cropped (slice); the cross stays centered.
	let { size = 18 }: { size?: number } = $props();
	const uid = $props.id();
</script>

<svg
	viewBox="0 0 60 30"
	width={size}
	height={(size * 2) / 3}
	preserveAspectRatio="xMidYMid slice"
	aria-hidden="true"
	focusable="false"
>
	<clipPath id="{uid}-s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
	<clipPath id="{uid}-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
	<g clip-path="url(#{uid}-s)">
		<path d="M0,0 v30 h60 v-30 z" fill="#012169" />
		<path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" stroke-width="6" />
		<!-- Thin red diagonal is offset: clipped per quadrant via clipPath -t -->
		<path
			d="M0,0 L60,30 M60,0 L0,30"
			clip-path="url(#{uid}-t)"
			stroke="#c8102e"
			stroke-width="4"
		/>
		<path d="M30,0 v30 M0,15 h60" stroke="#ffffff" stroke-width="10" />
		<path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6" />
	</g>
</svg>
