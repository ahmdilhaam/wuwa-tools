<script lang="ts">
	import sonataSets from '#lib/data/game/sonata-sets.json';
	import type { SonataSet } from '#lib/data/game/types.ts';
	import { echoSets, comboNotes } from '#lib/data/echo-sets.ts';
	import { normalizeName } from '#lib/data/merged.ts';

	// Nama di game berbeda dari catatan tulisan tangan: samakan lewat alias.
	const aliases: Record<string, string> = {
		havoceclipse: 'sunsinkingeclipse',
		reelsofsplicedmemories: 'reelofsplicedmemories'
	};
	const key = (name: string) => {
		const n = normalizeName(name);
		return aliases[n] ?? n;
	};

	const notesByKey = new Map(echoSets.map((s) => [key(s.name), s]));

	const rows = (sonataSets as SonataSet[]).map((s) => {
		const hand = notesByKey.get(key(s.name));
		const text = (p: number) => s.bonuses.find((b) => b.pieces === p)?.text.en ?? '—';
		return {
			id: s.id,
			name: s.name,
			icon: s.icon,
			abbrev: hand?.abbrev ?? [],
			note: hand?.note,
			forCharacter: hand?.forCharacter,
			two: text(2),
			three: s.bonuses.some((b) => b.pieces === 3) ? text(3) : null,
			five: text(5),
			echoCount: s.echoIds.length
		};
	});

	let query = $state('');
	const filtered = $derived(
		rows.filter((r) => {
			const q = query.trim().toLowerCase();
			return q === '' || r.name.toLowerCase().includes(q) || r.abbrev.some((a) => a.toLowerCase().includes(q));
		})
	);
</script>

<svelte:head>
	<title>Echo Set — WuWa Tools</title>
</svelte:head>

<h1>Echo Set</h1>
<p class="muted">
	{rows.length} set Sonata dari data game. Teks dari game (bahasa Inggris); singkatan dan catatan ditulis tangan.
</p>

<input type="search" placeholder="Cari set atau singkatan…" bind:value={query} aria-label="Cari set" />

<div class="table-wrap card">
	<table>
		<thead>
			<tr>
				<th>Set</th>
				<th>Singkatan</th>
				<th>Echo</th>
				<th>2pc</th>
				<th>3pc</th>
				<th>5pc</th>
			</tr>
		</thead>
		<tbody>
			{#each filtered as r (r.id)}
				<tr>
					<td class="name">
						<img src={r.icon} alt="" loading="lazy" width="28" height="28" />
						<strong>{r.name}</strong>
					</td>
					<td>{r.abbrev.join(' / ') || '—'}</td>
					<td>{r.echoCount}</td>
					<td>{r.two}</td>
					<td>{r.three ?? '—'}</td>
					<td>{r.five}</td>
				</tr>
				{#if r.note}
					<tr class="note-row"><td colspan="6">Catatan: {r.note}</td></tr>
				{/if}
			{:else}
				<tr><td colspan="6" class="muted">Tidak ada set yang cocok.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<section>
	<h2>Kombinasi 3pc + 2pc Umum</h2>
	<div class="card">
		<ul>
			{#each comboNotes as n (n)}<li>{n}</li>{/each}
		</ul>
	</div>
</section>

<style>
	section {
		margin: 1.5rem 0;
	}
	h2 {
		font-size: 1.15rem;
		margin-bottom: 0.4rem;
	}
	.muted {
		color: var(--text-muted);
	}
	input[type='search'] {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.45rem 0.7rem;
		width: 100%;
		margin: 0.5rem 0 1rem;
	}
	.name {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.note-row td {
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	ul {
		margin: 0;
		padding-left: 1.2rem;
	}
</style>
