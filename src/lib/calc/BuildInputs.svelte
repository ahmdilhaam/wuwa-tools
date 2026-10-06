<script lang="ts">
	import characters from '#lib/data/game/characters.json';
	import type {
		CharacterSkills,
		GameCharacter,
		GameWeapon,
		MonsterClass
	} from '#lib/data/game/types.ts';
	import {
		CUSTOM_ENEMY_ID,
		elementLabels,
		elements,
		enemyPresets,
		filterPresets,
		rarityLabels,
		type Element
	} from './enemies';
	import { baseResOf, damageTypes, num, type BuildState } from './build';
	import { loadCharacterSkills } from './skillLoader';
	import { isDamageHit, mapDamageType, mvAt, scalingFieldLabel, scalingOf, sumSkillMv } from './skills';

	let { build = $bindable() }: { build: BuildState } = $props();

	const chars = characters as GameCharacter[];
	const isCustom = $derived(build.enemyId === CUSTOM_ENEMY_ID);
	const presetRes = $derived(Math.round(baseResOf(build) * 10000) / 100);

	// Filter preset musuh
	let rarityFilter = $state<MonsterClass | 'all'>('all');
	let enemyQuery = $state('');
	const filteredPresets = $derived.by(() => {
		const list = filterPresets(rarityFilter, enemyQuery);
		const current = enemyPresets.find((p) => p.id === build.enemyId);
		// Pilihan aktif tetap tampil walau tersaring agar <select> tidak kosong.
		return current && !list.includes(current) ? [current, ...list] : list;
	});

	// Skill picker
	let charSkills = $state<CharacterSkills | null>(null);
	let loadingSkills = $state(false);
	// pickSkill '' berarti belum dipilih; Number('') = 0 akan diam-diam memilih skill pertama.
	const skill = $derived(
		build.pickSkill === '' ? null : (charSkills?.skills[Number(build.pickSkill)] ?? null)
	);
	const hit = $derived(skill?.hits.find((h) => String(h.id) === build.pickHit) ?? null);
	const level = $derived(Math.min(Math.max(Math.round(num(build.pickLevel)) || 10, 1), 10));
	const mvEdited = $derived(build.pickedMv !== null && num(build.mvPct) !== build.pickedMv);
	const sumMv = $derived(skill ? sumSkillMv(skill, level) : 0);
	const scalingLabel = $derived(scalingFieldLabel(build.scalingType));

	// Muat data skill saat karakter terpilih (termasuk dari state awal)
	$effect(() => {
		const slug = build.pickCharacter;
		if (!slug) {
			charSkills = null;
			return;
		}
		if (charSkills?.slug === slug) return;
		loadingSkills = true;
		loadCharacterSkills(slug).then((d) => {
			if (build.pickCharacter === slug) charSkills = d;
			loadingSkills = false;
		});
	});

	function onCharacter() {
		build.pickSkill = '';
		build.pickHit = '';
		build.pickedMv = null;
		const c = chars.find((x) => x.slug === build.pickCharacter);
		if (c && (elements as readonly string[]).includes(c.element)) build.element = c.element as Element;
	}

	function onSkill() {
		build.pickHit = '';
		build.pickedMv = null;
	}

	/** Isi MV, tipe DMG, dan stat skala dari hit/skill yang dipilih. */
	function applyPick() {
		if (!skill || !build.pickHit) return;
		if (build.pickHit === 'all') {
			build.mvPct = build.pickedMv = sumSkillMv(skill, level);
			build.scalingType = 'ATK';
			const first = skill.hits.find(isDamageHit);
			const t = first ? mapDamageType(first.damageType) : null;
			if (t) build.damageType = t;
			return;
		}
		if (!hit) return;
		build.mvPct = build.pickedMv = mvAt(hit, level);
		build.scalingType = scalingOf(hit);
		const t = mapDamageType(hit.damageType);
		if (t) build.damageType = t;
	}

	// Picker senjata: dimuat malas setelah mount, hanya petunjuk (tidak mengubah ATK total)
	let weapons = $state<GameWeapon[] | null>(null);
	$effect(() => {
		import('#lib/data/game/weapons.json').then((m) => (weapons = m.default as GameWeapon[]));
	});
	const weapon = $derived(weapons?.find((w) => String(w.id) === build.pickWeapon) ?? null);
	const nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
</script>

<div class="inputs">
	<fieldset>
		<legend>Pilih skill (opsional)</legend>
		<div class="grid">
			<label>
				Karakter
				<select bind:value={build.pickCharacter} onchange={onCharacter}>
					<option value="">Manual (tanpa picker)</option>
					{#each chars as c (c.slug)}
						<option value={c.slug}>{c.name}</option>
					{/each}
				</select>
			</label>
			{#if build.pickCharacter}
				<label>
					Skill
					<select bind:value={build.pickSkill} onchange={onSkill} disabled={!charSkills}>
						<option value="">{loadingSkills ? 'Memuat…' : 'Pilih skill'}</option>
						{#each charSkills?.skills ?? [] as s, i (i)}
							<option value={String(i)}>{s.name} ({s.type})</option>
						{/each}
					</select>
				</label>
			{/if}
			{#if skill}
				<label>
					Hit
					<select bind:value={build.pickHit} onchange={applyPick}>
						<option value="">Pilih hit</option>
						<option value="all">Jumlahkan semua hit di skill ini</option>
						{#each skill.hits as h, i (h.id)}
							<option value={String(h.id)} disabled={!isDamageHit(h)}>
								#{i + 1} {h.damageType || 'Lainnya'}{h.condition ? ` · ${h.condition}` : ''}
								{isDamageHit(h) ? `· ${nf.format(mvAt(h, level))}% ${h.scaling}` : '· bukan damage'}
							</option>
						{/each}
					</select>
				</label>
				<label>
					Level skill (1–10)
					<input
						type="number"
						min="1"
						max="10"
						step="1"
						bind:value={build.pickLevel}
						onchange={applyPick}
					/>
				</label>
			{/if}
		</div>
		{#if build.pickHit === 'all'}
			<p class="note">
				Total MV semua hit damage berskala ATK di skill ini: {nf.format(sumMv)}%. Jumlah hit per
				cast dalam rotasi tidak dimodelkan.
			</p>
		{/if}
		{#if mvEdited}<p class="note warn">MV diubah manual (nilai picker: {nf.format(build.pickedMv ?? 0)}%).</p>{/if}
	</fieldset>

	<fieldset>
		<legend>Penyerang</legend>
		<div class="grid">
			<label>Level penyerang<input type="number" step="1" bind:value={build.attackerLevel} /></label>
			<label>{scalingLabel}<input type="number" step="any" bind:value={build.scalingStat} /></label>
			<label>Crit Rate (%)<input type="number" step="any" bind:value={build.critRatePct} /></label>
			<label>Crit DMG (%)<input type="number" step="any" bind:value={build.critDmgPct} /></label>
			<label>Motion Value (%)<input type="number" step="any" bind:value={build.mvPct} /></label>
			<label>DMG tetap (flat)<input type="number" step="any" bind:value={build.flatDmg} /></label>
			<label>
				Senjata (petunjuk)
				<select bind:value={build.pickWeapon}>
					<option value="">Tidak dipilih</option>
					{#each weapons ?? [] as w (w.id)}
						<option value={String(w.id)}>{w.name} ({w.type})</option>
					{/each}
					{#if !weapons && build.pickWeapon}
						<option value={build.pickWeapon}>Memuat…</option>
					{/if}
				</select>
			</label>
		</div>
		{#if weapon}
			<p class="note">
				ATK senjata Lv90: {nf.format(weapon.atk90)}, sekunder: {weapon.secondary.name}
				{nf.format(weapon.secondary.value90)}. Hanya petunjuk: ATK total tidak diubah karena halaman
				stat sudah final.
			</p>
		{/if}
	</fieldset>

	<fieldset>
		<legend>Bonus DMG</legend>
		<div class="grid">
			<label>
				Elemen
				<select bind:value={build.element}>
					{#each elements as el (el)}
						<option value={el}>{elementLabels[el]}</option>
					{/each}
				</select>
			</label>
			<label>Ele DMG (%)<input type="number" step="any" bind:value={build.elementBonusPct} /></label>
			<label>
				Tipe DMG
				<select bind:value={build.damageType}>
					{#each damageTypes as t (t.id)}
						<option value={t.id}>{t.label}</option>
					{/each}
				</select>
			</label>
			<label>Tipe DMG (%)<input type="number" step="any" bind:value={build.typeBonusPct} /></label>
			<label>General DMG (%)<input type="number" step="any" bind:value={build.generalBonusPct} /></label>
			<label>
				Bonus saat tempur (%)
				<input type="number" step="any" bind:value={build.combatBonusPct} />
			</label>
			<label>Amplify (%)<input type="number" step="any" bind:value={build.amplifyPct} /></label>
			<label>Special DMG (%)<input type="number" step="any" bind:value={build.specialPct} /></label>
		</div>
	</fieldset>

	<fieldset>
		<legend>Musuh</legend>
		<div class="grid">
			<label>
				Cari musuh
				<input type="search" placeholder="Ketik nama…" bind:value={enemyQuery} />
			</label>
			<label>
				Rarity
				<select bind:value={rarityFilter}>
					<option value="all">Semua</option>
					{#each ['elite', 'overlord', 'calamity'] as const as r (r)}
						<option value={r}>{rarityLabels[r]}</option>
					{/each}
				</select>
			</label>
			<label>
				Preset musuh
				<select bind:value={build.enemyId}>
					{#each filteredPresets as p (p.id)}
						<option value={p.id}>{p.name} · {rarityLabels[p.rarity]} ({p.element})</option>
					{/each}
					<option value={CUSTOM_ENEMY_ID}>Custom (RES manual)</option>
				</select>
			</label>
			<label>Level musuh<input type="number" step="1" bind:value={build.enemyLevel} /></label>
			{#if isCustom}
				<label>RES dasar (%)<input type="number" step="any" bind:value={build.customResPct} /></label>
			{:else}
				<label>
					RES dasar (%) · otomatis
					<input type="number" value={presetRes} disabled />
				</label>
			{/if}
			<label>DEF Reduction (%)<input type="number" step="any" bind:value={build.defReductionPct} /></label>
			<label>DEF Ignore (%)<input type="number" step="any" bind:value={build.defIgnorePct} /></label>
			<label>RES Shred (%)<input type="number" step="any" bind:value={build.resShredPct} /></label>
		</div>
	</fieldset>
</div>

<style>
	.inputs {
		display: grid;
		gap: 1rem;
	}
	fieldset {
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.75rem 1rem 1rem;
		margin: 0;
		background: var(--surface);
	}
	legend {
		padding: 0 0.4rem;
		color: var(--accent);
		font-weight: 600;
		font-size: 0.9rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.75rem;
	}
	.note {
		margin: 0.75rem 0 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.warn {
		color: var(--accent);
	}
	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	input,
	select {
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--text);
		border-radius: 6px;
		padding: 0.45rem 0.55rem;
		font: inherit;
		font-size: 0.95rem;
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
	}
	input:focus,
	select:focus {
		outline: 2px solid var(--accent);
		outline-offset: 0;
	}
	input:disabled,
	select:disabled {
		opacity: 0.6;
	}
</style>
