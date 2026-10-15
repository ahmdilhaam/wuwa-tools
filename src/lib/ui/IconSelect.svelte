<script lang="ts" module>
	export type IconOption = { value: string; label: string; icon?: string; rarity?: number };
</script>

<script lang="ts">
	// Select-only combobox (pola WAI-ARIA APG): <select> bawaan tidak bisa menampilkan gambar di opsinya.
	import { tick } from 'svelte';

	let {
		value = $bindable(),
		options,
		labelledby,
		describedby,
		onchange
	}: {
		value: string;
		options: IconOption[];
		labelledby?: string;
		describedby?: string;
		onchange?: () => void;
	} = $props();

	const uid = $props.id();
	let open = $state(false);
	let active = $state(0);
	let root: HTMLElement;
	let list = $state<HTMLUListElement>();

	const selected = $derived(options.find((o) => o.value === value) ?? options[0]);
	const optId = (i: number) => `${uid}-opt-${i}`;
	const rarityColor = (r?: number) => (r === 5 ? 'var(--gold)' : r === 4 ? 'var(--violet)' : 'var(--border)');

	async function show() {
		active = Math.max(0, options.findIndex((o) => o.value === value));
		open = true;
		await tick();
		reveal();
	}
	function pick(i: number) {
		const o = options[i];
		open = false;
		root.focus();
		if (!o || o.value === value) return;
		value = o.value;
		onchange?.();
	}
	function move(i: number) {
		active = Math.min(options.length - 1, Math.max(0, i));
		reveal();
	}
	function reveal() {
		list?.querySelector(`#${CSS.escape(optId(active))}`)?.scrollIntoView({ block: 'nearest' });
	}

	// Ketik untuk lompat ke opsi berawalan sama
	let typed = '';
	let typedAt = 0;
	function typeahead(ch: string) {
		const now = Date.now();
		typed = now - typedAt > 600 ? ch : typed + ch;
		typedAt = now;
		const from = typed.length === 1 ? active + 1 : active;
		const n = options.length;
		for (let k = 0; k < n; k++) {
			const i = (from + k) % n;
			if (options[i].label.toLowerCase().startsWith(typed)) return move(i);
		}
	}

	function onkeydown(e: KeyboardEvent) {
		const key = e.key;
		if (!open) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(key)) {
				e.preventDefault();
				show().then(() => {
					if (key === 'Home') move(0);
					if (key === 'End') move(options.length - 1);
				});
			} else if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
				show().then(() => typeahead(key.toLowerCase()));
			}
			return;
		}
		switch (key) {
			case 'ArrowDown':
				e.preventDefault();
				return move(active + 1);
			case 'ArrowUp':
				e.preventDefault();
				return e.altKey ? pick(active) : move(active - 1);
			case 'Home':
				e.preventDefault();
				return move(0);
			case 'End':
				e.preventDefault();
				return move(options.length - 1);
			case 'PageDown':
				e.preventDefault();
				return move(active + 8);
			case 'PageUp':
				e.preventDefault();
				return move(active - 8);
			case 'Enter':
			case ' ':
				e.preventDefault();
				return pick(active);
			case 'Escape':
				e.preventDefault();
				open = false;
				return;
			case 'Tab':
				pick(active);
				return;
			default:
				if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(key.toLowerCase());
		}
	}
</script>

<svelte:window
	onpointerdown={(e) => {
		if (open && !root.parentElement?.contains(e.target as Node)) open = false;
	}}
/>

<div class="wrap">
	<div
		bind:this={root}
		class="trigger"
		role="combobox"
		tabindex="0"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls="{uid}-list"
		aria-labelledby={labelledby}
		aria-describedby={describedby}
		aria-activedescendant={open ? optId(active) : undefined}
		onclick={() => (open ? (open = false) : show())}
		{onkeydown}
	>
		{#if selected?.icon}
			<img src={selected.icon} alt="" width="32" height="32" style="--c: {rarityColor(selected.rarity)}" />
		{/if}
		<span class="text">{selected?.label ?? ''}</span>
		<svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
			<path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" />
		</svg>
	</div>
	{#if open}
		<ul bind:this={list} id="{uid}-list" class="list" role="listbox" aria-labelledby={labelledby} tabindex="-1">
			{#each options as o, i (o.value)}
				<!-- keyboard ditangani combobox -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					id={optId(i)}
					role="option"
					aria-selected={o.value === value}
					class:active={i === active}
					onpointermove={() => (active = i)}
					onclick={() => pick(i)}
				>
					{#if o.icon}
						<img src={o.icon} alt="" width="32" height="32" loading="lazy" style="--c: {rarityColor(o.rarity)}" />
					{:else}
						<span class="blank"></span>
					{/if}
					<span class="text">{o.label}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
		min-width: 0;
	}
	.trigger {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		min-height: 2.4rem;
		padding: 0.25rem 0.65rem 0.25rem 0.3rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.trigger:hover {
		border-color: var(--border-strong);
	}
	.trigger:focus-visible,
	.trigger[aria-expanded='true'] {
		outline: none;
		border-color: var(--gold);
		box-shadow: 0 0 0 3px var(--gold-soft);
	}
	.text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chev {
		flex: none;
		color: var(--text-muted);
	}
	img,
	.blank {
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
	}
	img {
		border: 2px solid var(--c);
		background: var(--bg-deep);
		object-fit: cover;
	}
	.list {
		position: absolute;
		z-index: 20;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		max-height: min(22rem, 60vh);
		overflow-y: auto;
		margin: 0;
		padding: 0.25rem;
		list-style: none;
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow);
	}
	li {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.25rem 0.4rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	li.active {
		background: var(--surface-2);
	}
	li[aria-selected='true'] {
		color: var(--gold);
	}
</style>
