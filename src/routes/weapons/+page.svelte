<script lang="ts">
	import gameWeapons from '#lib/data/game/weapons.json';
	import type { GameWeapon, WeaponType } from '#lib/data/game/types.ts';
	import { weaponTypes } from '#lib/data/characters.ts';
	import { weapons as handWeapons, weaponNotes } from '#lib/data/weapons.ts';
	import { normalizeName } from '#lib/data/merged.ts';

	const list = gameWeapons as GameWeapon[];
	const usersByName = new Map(handWeapons.map((w) => [normalizeName(w.name), w]));

	let query = $state('');
	let type = $state<WeaponType | ''>('');
	let rarity = $state<number | 0>(0);
	/** Refinement per senjata (1–5), default R1 */
	let refine = $state<Record<number, number>>({});

	const rarities = [5, 4, 3, 2, 1];
	const filtered = $derived(
		list.filter(
			(w) =>
				w.name.toLowerCase().includes(query.trim().toLowerCase()) &&
				(type === '' || w.type === type) &&
				(rarity === 0 || w.rarity === rarity)
		)
	);

	const passiveText = (w: GameWeapon, r: number) =>
		w.passive[`r${r}` as 'r1' | 'r2' | 'r3' | 'r4' | 'r5'].en;
	const secondaryUnit = (name: string) => (name.endsWith('%') || name.startsWith('Crit') || name === 'Energy Regen' ? '%' : '');
</script>

<svelte:head>
	<title>Senjata — WuWa Tools</title>
</svelte:head>

<h1>Senjata</h1>
<p class="muted">{list.length} senjata dari data game. Teks pasif dari game (bahasa Inggris); kolom Pengguna ditulis tangan.</p>

<div class="filters card">
	<input type="search" placeholder="Cari senjata…" bind:value={query} aria-label="Cari senjata" />
	<label>Tipe
		<select bind:value={type}>
			<option value="">Semua tipe</option>
			{#each weaponTypes as t (t)}<option value={t}>{t}</option>{/each}
		</select>
	</label>
	<label>Rarity
		<select bind:value={rarity}>
			<option value={0}>Semua</option>
			{#each rarities as r (r)}<option value={r}>{r}★</option>{/each}
		</select>
	</label>
</div>

<p class="muted">{filtered.length} dari {list.length} senjata</p>

<div class="table-wrap card">
	<table>
		<thead>
			<tr><th>Senjata</th><th>Tipe</th><th>Rarity</th><th>ATK Lv90</th><th>Stat sekunder</th><th>Pengguna</th><th>Pasif</th></tr>
		</thead>
		<tbody>
			{#each filtered as w (w.id)}
				{@const hand = usersByName.get(normalizeName(w.name))}
				{@const r = refine[w.id] ?? 1}
				<tr>
					<td class="name">
						<img src={w.icon} alt="" loading="lazy" width="36" height="36" />
						<strong>{w.name}</strong>
					</td>
					<td>{w.type}</td>
					<td>{'★'.repeat(w.rarity)}</td>
					<td>{w.atk90}</td>
					<td>{w.secondary.name} {w.secondary.value90}{secondaryUnit(w.secondary.name)}</td>
					<td>{hand?.users.join(', ') ?? '—'}</td>
					<td>
						<details>
							<summary>{w.passive.name}</summary>
							<label class="ref">Refinement
								<select value={r} onchange={(e) => (refine[w.id] = Number(e.currentTarget.value))}>
									{#each [1, 2, 3, 4, 5] as n (n)}<option value={n}>R{n}</option>{/each}
								</select>
							</label>
							<p class="desc">{passiveText(w, r)}</p>
						</details>
					</td>
				</tr>
			{:else}
				<tr><td colspan="7" class="muted">Tidak ada senjata yang cocok.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<h2>Catatan Umum</h2>
<div class="card">
	<ul>
		{#each weaponNotes as n (n)}<li>{n}</li>{/each}
	</ul>
</div>

<style>
	.muted {
		color: var(--text-muted);
	}
	h2 {
		font-size: 1.15rem;
		margin: 1.5rem 0 0.4rem;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: end;
	}
	.filters input {
		flex: 2 1 220px;
	}
	.filters label,
	.ref {
		display: flex;
		flex-direction: column;
		font-size: 0.8rem;
		color: var(--text-muted);
		gap: 0.2rem;
		flex: 1 1 140px;
	}
	input[type='search'],
	select {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.45rem 0.7rem;
		color: var(--text);
	}
	.name {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.desc {
		white-space: pre-line;
		color: var(--text-muted);
		max-width: 48ch;
	}
	ul {
		margin: 0;
		padding-left: 1.2rem;
	}
</style>
