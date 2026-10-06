<script lang="ts">
	import sonataSets from '#lib/data/game/sonata-sets.json';
	import type { SonataSet } from '#lib/data/game/types.ts';
	import { echoSets, comboNotes } from '#lib/data/echo-sets.ts';
	import { normalizeName } from '#lib/data/merged.ts';

	// Nama di game berbeda dari catatan tulisan tangan: samakan lewat alias.
	const aliases: Record<string, string> = {
		reelsofsplicedmemories: 'reelofsplicedmemories'
	};
	const key = (name: string) => {
		const n = normalizeName(name);
		return aliases[n] ?? n;
	};

	const notesByKey = new Map(echoSets.map((s) => [key(s.name), s]));

	const rows = (sonataSets as SonataSet[]).map((s) => {
		const hand = notesByKey.get(key(s.name));
		return {
			id: s.id,
			name: s.name,
			icon: s.icon,
			abbrev: hand?.abbrev ?? [],
			note: hand?.note,
			forCharacter: hand?.forCharacter,
			// Urut per jumlah keping; set 3pc tidak punya bonus 2pc/5pc.
			bonuses: [...s.bonuses].sort((a, b) => a.pieces - b.pieces).map((b) => ({ pieces: b.pieces, text: b.text.en })),
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
	<title>Echo set — WuWa Tools</title>
</svelte:head>

<div class="page-head">
	<h1>Echo set</h1>
	<p>{rows.length} set Sonata. Teks bonus dari game (bahasa Inggris); singkatan dan catatan ditulis tangan.</p>
</div>

<div class="filters">
	<label>
		<span class="visually-hidden">Cari set</span>
		<input type="search" placeholder="Cari set atau singkatan" bind:value={query} />
	</label>
	<span class="muted count">{filtered.length} set</span>
</div>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Set</th>
				<th>Singkatan</th>
				<th class="num">Echo</th>
				<th>Bonus</th>
			</tr>
		</thead>
		<tbody>
			{#each filtered as r (r.id)}
				<tr>
					<td class="name">
						<span class="nm">
							{#if r.icon}<img src={r.icon} alt="" loading="lazy" width="28" height="28" />{/if}
							<strong>{r.name}</strong>
						</span>
						{#if r.note}<div class="muted small">{r.note}</div>{/if}
					</td>
					<td class="muted">{r.abbrev.join(', ') || '—'}</td>
					<td class="num">{r.echoCount}</td>
					<td class="txt">
						<dl class="bonuses">
							{#each r.bonuses as b (b.pieces)}
								<div>
									<dt>{b.pieces}pc</dt>
									<dd>{b.text}</dd>
								</div>
							{/each}
						</dl>
					</td>
				</tr>
			{:else}
				<tr><td colspan="4" class="muted">Tidak ada set yang cocok.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<section class="combo">
	<h2>Kombinasi 3pc + 2pc umum</h2>
	<ul>
		{#each comboNotes as n (n)}<li>{n}</li>{/each}
	</ul>
</section>

<style>
	.filters {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.filters label {
		flex: 0 1 22rem;
	}
	.count {
		font-size: var(--fs-sm);
	}
	.nm {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		min-width: 11rem;
	}
	.nm img {
		border-radius: var(--radius-sm);
		flex: none;
	}
	.name {
		min-width: 12rem;
	}
	.txt {
		min-width: 22rem;
	}
	.bonuses {
		display: grid;
		gap: 0.45rem;
		margin: 0;
		max-width: 68ch;
	}
	.bonuses div {
		display: grid;
		grid-template-columns: 2.6rem 1fr;
		gap: 0.5rem;
	}
	.bonuses dt {
		font-weight: 600;
		color: var(--gold);
	}
	.bonuses dd {
		margin: 0;
	}
	.small {
		font-size: var(--fs-xs);
		margin-top: 0.25rem;
		max-width: 40ch;
	}
	.combo {
		margin-top: 2.5rem;
		max-width: 72ch;
	}
	.combo ul {
		margin: 0;
		padding-left: 1.2rem;
	}
	.combo li {
		margin: 0.3rem 0;
	}
</style>
