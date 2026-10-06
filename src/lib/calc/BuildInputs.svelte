<script lang="ts">
	import characters from '#lib/data/game/characters.json';
	import { formatNumber, getLocale, t } from '#lib/i18n/index.svelte.ts';
	import type { CharacterSkills, GameCharacter, MonsterClass, WeaponEffect } from '#lib/data/game/types.ts';
	import {
		CUSTOM_ENEMY_ID,
		elementLabels,
		elements,
		enemyPresets,
		filterPresets,
		rarityKeys,
		type Element
	} from './enemies';
	import { baseResOf, damageTypes, num, type BuildState } from './build';
	import { clampRefine, defaultToggle, effectAmountLabel, weaponContribution } from './weapon';
	import { weaponStore } from './weaponStore.svelte';
	import { loadCharacterSkills } from './skillLoader';
	import { isDamageHit, mapDamageType, mvAt, scalingFieldLabel, scalingOf, sumSkillMv } from './skills';

	let { build = $bindable() }: { build: BuildState } = $props();
	// Mode bandingkan merender dua BuildInputs: id petunjuk harus unik per instance.
	const uid = $props.id();

	const chars = characters as GameCharacter[];
	const isCustom = $derived(build.enemyId === CUSTOM_ENEMY_ID);
	const pickedChar = $derived(chars.find((x) => x.slug === build.pickCharacter) ?? null);
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
	const scalingLabel = $derived(scalingFieldLabel(build.scalingType, t));

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

	// Picker senjata: dimuat malas setelah mount; efek terpicu ikut dihitung (lihat weapon.ts)
	$effect(() => weaponStore.ensure());
	let showAllWeapons = $state(false);
	const weapon = $derived(weaponStore.find(build.pickWeapon));
	const weaponChoices = $derived.by(() => {
		const all = weaponStore.list ?? [];
		const list = pickedChar && !showAllWeapons ? all.filter((w) => w.type === pickedChar.weaponType) : all;
		return weapon && !list.includes(weapon) ? [weapon, ...list] : list;
	});
	const contrib = $derived(weaponContribution(build, weapon, pickedChar));
	const nf = { format: (n: number) => formatNumber(n, { maximumFractionDigits: 2 }) };
	const fmt = (n: number) => nf.format(Math.round(n * 100) / 100);
	// Kalimat efek dari data game dua bahasa: Indonesia memakai terjemahan bila ada.
	const sentenceOf = (e: WeaponEffect) => (getLocale() === 'id' ? (e.sentenceId ?? e.sentence) : e.sentence);
	const refine = $derived(clampRefine(build.pickRefine));
	const secondaryUnit = (name: string) =>
		name.endsWith('%') || name.startsWith('Crit') || name === 'Energy Regen' ? '%' : '';

	function onWeapon() {
		build.weaponToggles = {};
	}
	function setToggle(i: number, e: WeaponEffect, patch: { on?: boolean; stacks?: number }) {
		build.weaponToggles[i] = { ...(build.weaponToggles[i] ?? defaultToggle(e)), ...patch };
	}
</script>

<div class="inputs">
	<fieldset class="primary">
		<legend>{t('calc.inputs.pickLegend')}</legend>
		<div class="grid">
			<label>
				{t('calc.inputs.character')}
				<span class="picker">
					{#if pickedChar}
						<img
							src={pickedChar.icon}
							width="40"
							height="40"
							loading="lazy"
							alt=""
							style={`--c: var(--el-${pickedChar.element})`}
						/>
					{/if}
					<select bind:value={build.pickCharacter} onchange={onCharacter}>
						<option value="">{t('calc.inputs.manual')}</option>
						{#each chars as c (c.slug)}
							<option value={c.slug}>{c.name}</option>
						{/each}
					</select>
				</span>
			</label>
			{#if build.pickCharacter}
				<label>
					{t('calc.inputs.skill')}
					<select bind:value={build.pickSkill} onchange={onSkill} disabled={!charSkills}>
						<option value="">{loadingSkills ? t('calc.inputs.loading') : t('calc.inputs.pickSkill')}</option>
						{#each charSkills?.skills ?? [] as s, i (i)}
							<option value={String(i)}>{s.name} ({s.type})</option>
						{/each}
					</select>
				</label>
			{/if}
			{#if skill}
				<label>
					{t('calc.inputs.hit')}
					<select bind:value={build.pickHit} onchange={applyPick}>
						<option value="">{t('calc.inputs.pickHit')}</option>
						<option value="all">{t('calc.inputs.sumAllHits')}</option>
						{#each skill.hits as h, i (h.id)}
							<option value={String(h.id)} disabled={!isDamageHit(h)}>
								{t(isDamageHit(h) ? 'calc.inputs.hitDamage' : 'calc.inputs.hitNotDamage', {
									n: i + 1,
									type: h.damageType || t('calc.inputs.otherType'),
									cond: h.condition ? `, ${h.condition}` : '',
									mv: nf.format(mvAt(h, level)),
									scaling: h.scaling
								})}
							</option>
						{/each}
					</select>
				</label>
				<label>
					{t('calc.inputs.skillLevel')}
					<input
						type="number"
						min="1"
						max="10"
						step="1"
						bind:value={build.pickLevel}
						onchange={applyPick}
						aria-describedby="{uid}-skill-level"
					/>
				<span class="hint" id="{uid}-skill-level">{t('calc.inputs.skillLevelHint')}</span>
				</label>
			{/if}
		</div>
		{#if build.pickHit === 'all'}
			<p class="note">
				{t('calc.inputs.sumNote', { mv: nf.format(sumMv) })}
			</p>
		{/if}
		{#if mvEdited}<p class="note warn">{t('calc.inputs.mvEdited', { mv: nf.format(build.pickedMv ?? 0) })}</p>{/if}
	</fieldset>

	<fieldset>
		<legend>{t('calc.inputs.attackerLegend')}</legend>
		<div class="grid">
			<label>
				{t('calc.inputs.attackerLevel')}
				<input type="number" step="1" bind:value={build.attackerLevel} aria-describedby="{uid}-atk-level" />
				<span class="hint" id="{uid}-atk-level">{t('calc.inputs.attackerLevelHint')}</span>
			</label>
			<label>
				{scalingLabel}
				<input type="number" step="any" bind:value={build.scalingStat} aria-describedby="{uid}-scaling" />
				<span class="hint" id="{uid}-scaling">{t('calc.inputs.scalingHint')}</span>
			</label>
			<label>
				{t('calc.inputs.critRate')}
				<input type="number" step="any" bind:value={build.critRatePct} aria-describedby="{uid}-cr" />
				<span class="hint" id="{uid}-cr">{t('calc.inputs.critRateHint')}</span>
			</label>
			<label>
				{t('calc.inputs.critDmg')}
				<input type="number" step="any" bind:value={build.critDmgPct} aria-describedby="{uid}-cd" />
				<span class="hint" id="{uid}-cd">{t('calc.inputs.critDmgHint')}</span>
			</label>
			<label>
				{t('calc.inputs.mv')}
				<input type="number" step="any" bind:value={build.mvPct} aria-describedby="{uid}-mv" />
				<span class="hint" id="{uid}-mv">{t('calc.inputs.mvHint')}</span>
			</label>
			<label>
				{t('calc.inputs.flat')}
				<input type="number" step="any" bind:value={build.flatDmg} aria-describedby="{uid}-flat" />
				<span class="hint" id="{uid}-flat">{t('calc.inputs.flatHint')}</span>
			</label>
		</div>
	</fieldset>

	<fieldset>
		<legend>{t('calc.weapon.legend')}</legend>
		<div class="grid">
			<label>
				{t('calc.weapon.label')}
				<select bind:value={build.pickWeapon} onchange={onWeapon} aria-describedby="{uid}-weapon">
					<option value="">{t('calc.weapon.none')}</option>
					{#each weaponChoices as w (w.id)}
						<option value={String(w.id)}>{w.name} ({w.type})</option>
					{/each}
					{#if !weaponStore.list && build.pickWeapon}
						<option value={build.pickWeapon}>{t('calc.inputs.loading')}</option>
					{/if}
				</select>
				<span class="hint" id="{uid}-weapon">{t('calc.weapon.hint')}</span>
			</label>
			<div class="field">
				<span class="field-label" id="{uid}-refine-label">{t('calc.weapon.refinement')}</span>
				<div class="segmented" role="group" aria-labelledby="{uid}-refine-label">
					{#each [1, 2, 3, 4, 5] as n (n)}
						<button type="button" aria-pressed={refine === n} onclick={() => (build.pickRefine = n)}>R{n}</button>
					{/each}
				</div>
			</div>
		</div>
		{#if pickedChar}
			<label class="check">
				<input type="checkbox" bind:checked={showAllWeapons} />
				<span>{t('calc.weapon.showAll', { type: pickedChar.weaponType })}</span>
			</label>
		{/if}
		{#if weapon}
			<p class="note">
				{t('calc.weapon.info', {
					atk: nf.format(weapon.atk90),
					secondary: weapon.secondary.name,
					value: nf.format(weapon.secondary.value90),
					unit: secondaryUnit(weapon.secondary.name),
					passive: weapon.passive.name
				})}
			</p>
			{#if weapon.passive.effects.length === 0}
				<p class="note">{t('calc.weapon.noEffects')}</p>
			{:else}
				<ul class="effects" aria-label={t('calc.weapon.effectsLabel', { weapon: weapon.name })}>
					{#each contrib.effects as r (r.index)}
						<li class="effect" class:muted={r.kind !== 'toggle'} class:inactive={r.kind === 'toggle' && !r.applies}>
							{#if r.kind === 'toggle'}
								<label class="check">
									<input
										type="checkbox"
										checked={r.on}
										onchange={(ev) => setToggle(r.index, r.effect, { on: ev.currentTarget.checked })}
									/>
									<span>{sentenceOf(r.effect)}</span>
								</label>
								{#if r.effect.team}
									<span class="tag">{t('calc.weapon.teamBuff')}</span>
								{/if}
								{#if r.effect.maxStacks && r.effect.maxStacks > 1}
									<label class="stacks">
										{t('calc.weapon.stacks', { max: r.effect.maxStacks })}
										<input
											type="number"
											min="1"
											max={r.effect.maxStacks}
											step="1"
											value={r.stacks}
											oninput={(ev) => setToggle(r.index, r.effect, { stacks: ev.currentTarget.valueAsNumber })}
										/>
									</label>
								{/if}
								{#if !r.applies}
									<span class="result none">{r.reason ? t(r.reason.key, r.reason.params) : ''}</span>
								{:else if r.on}
									<span class="result">{effectAmountLabel(r, fmt, t)}</span>
								{/if}
							{:else if r.kind === 'permanent'}
								<span>{sentenceOf(r.effect)}</span>
								<span class="tag">{t('calc.weapon.permanent')}</span>
							{:else}
								<span>{sentenceOf(r.effect)}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</fieldset>

	<fieldset>
		<legend>{t('calc.inputs.bonusLegend')}</legend>
		<div class="grid">
			<label>
				{t('calc.inputs.element')}
				<select bind:value={build.element} aria-describedby="{uid}-element">
					{#each elements as el (el)}
						<option value={el}>{elementLabels[el]}</option>
					{/each}
				</select>
				<span class="hint" id="{uid}-element">{t('calc.inputs.elementHint')}</span>
			</label>
			<label>
				{t('calc.inputs.eleDmg')}
				<input type="number" step="any" bind:value={build.elementBonusPct} aria-describedby="{uid}-ele-dmg" />
				<span class="hint" id="{uid}-ele-dmg">{t('calc.inputs.eleDmgHint')}</span>
			</label>
			<label>
				{t('calc.inputs.damageType')}
				<select bind:value={build.damageType} aria-describedby="{uid}-type">
					{#each damageTypes as t (t.id)}
						<option value={t.id}>{t.label}</option>
					{/each}
				</select>
				<span class="hint" id="{uid}-type">{t('calc.inputs.damageTypeHint')}</span>
			</label>
			<label>
				{t('calc.inputs.typeDmg')}
				<input type="number" step="any" bind:value={build.typeBonusPct} aria-describedby="{uid}-type-dmg" />
				<span class="hint" id="{uid}-type-dmg">{t('calc.inputs.typeDmgHint')}</span>
			</label>
			<label>
				{t('calc.inputs.generalDmg')}
				<input type="number" step="any" bind:value={build.generalBonusPct} aria-describedby="{uid}-general" />
				<span class="hint" id="{uid}-general">{t('calc.inputs.generalDmgHint')}</span>
			</label>
			<label>
				{t('calc.inputs.combat')}
				<input type="number" step="any" bind:value={build.combatBonusPct} aria-describedby="{uid}-combat" />
				<span class="hint" id="{uid}-combat">{t('calc.inputs.combatHint')}</span>
			</label>
			<label>
				{t('calc.inputs.amplify')}
				<input type="number" step="any" bind:value={build.amplifyPct} aria-describedby="{uid}-amplify" />
				<span class="hint" id="{uid}-amplify">{t('calc.inputs.amplifyHint')}</span>
			</label>
			<label>
				{t('calc.inputs.special')}
				<input type="number" step="any" bind:value={build.specialPct} aria-describedby="{uid}-special" />
				<span class="hint" id="{uid}-special">{t('calc.inputs.specialHint')}</span>
			</label>
		</div>
	</fieldset>

	<fieldset>
		<legend>{t('calc.inputs.enemyLegend')}</legend>
		<div class="grid">
			<label>
				{t('calc.inputs.enemySearch')}
				<input type="search" placeholder={t('calc.inputs.enemySearchPlaceholder')} bind:value={enemyQuery} />
			</label>
			<label>
				{t('calc.inputs.rarity')}
				<select bind:value={rarityFilter}>
					<option value="all">{t('calc.inputs.rarityAll')}</option>
					{#each ['elite', 'overlord', 'calamity'] as const as r (r)}
						<option value={r}>{t(rarityKeys[r])}</option>
					{/each}
				</select>
			</label>
			<label>
				{t('calc.inputs.enemyPreset')}
				<select bind:value={build.enemyId} aria-describedby="{uid}-enemy">
					{#each filteredPresets as p (p.id)}
						<option value={p.id}>{p.name}, {t(rarityKeys[p.rarity])} ({p.element})</option>
					{/each}
					<option value={CUSTOM_ENEMY_ID}>{t('calc.inputs.enemyCustom')}</option>
				</select>
				<span class="hint" id="{uid}-enemy">{t('calc.inputs.enemyHint')}</span>
			</label>
			<label>
				{t('calc.inputs.enemyLevel')}
				<input type="number" step="1" bind:value={build.enemyLevel} aria-describedby="{uid}-enemy-level" />
				<span class="hint" id="{uid}-enemy-level">{t('calc.inputs.enemyLevelHint')}</span>
			</label>
			{#if isCustom}
				<label>
					{t('calc.inputs.baseRes')}
					<input type="number" step="any" bind:value={build.customResPct} aria-describedby="{uid}-res" />
					<span class="hint" id="{uid}-res">{t('calc.inputs.baseResHint')}</span>
				</label>
			{:else}
				<label>
					{t('calc.inputs.baseResAuto')}
					<input type="number" value={presetRes} disabled aria-describedby="{uid}-res" />
					<span class="hint" id="{uid}-res">{t('calc.inputs.baseResHint')}</span>
				</label>
			{/if}
			<label>
				{t('calc.inputs.defReduction')}
				<input type="number" step="any" bind:value={build.defReductionPct} aria-describedby="{uid}-def-red" />
				<span class="hint" id="{uid}-def-red">{t('calc.inputs.defReductionHint')}</span>
			</label>
			<label>
				{t('calc.inputs.defIgnore')}
				<input type="number" step="any" bind:value={build.defIgnorePct} aria-describedby="{uid}-def-ign" />
				<span class="hint" id="{uid}-def-ign">{t('calc.inputs.defIgnoreHint')}</span>
			</label>
			<label>
				{t('calc.inputs.resShred')}
				<input type="number" step="any" bind:value={build.resShredPct} aria-describedby="{uid}-res-shred" />
				<span class="hint" id="{uid}-res-shred">{t('calc.inputs.resShredHint')}</span>
			</label>
		</div>
	</fieldset>
</div>

<style>
	.inputs {
		display: grid;
		gap: 1.75rem;
	}
	fieldset {
		border: 0;
		border-top: 1px solid var(--border);
		padding: 0.25rem 0 0;
		margin: 0;
		min-width: 0;
	}
	legend {
		padding: 0 0.6rem 0 0;
		color: var(--text);
		font-weight: 600;
		font-size: var(--fs-sm);
	}
	fieldset > .grid {
		margin-top: 0.75rem;
	}
	fieldset.primary {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem 1rem 1rem;
	}
	fieldset.primary legend {
		padding: 0 0.4rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
		gap: 0.9rem 0.85rem;
	}
	/* Petunjuk di bawah satu isian tidak boleh meregangkan isian lain di baris yang sama. */
	.grid > label {
		align-content: start;
	}
	.picker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.picker img {
		flex: none;
		border-radius: var(--radius-sm);
		border: 2px solid var(--c, var(--border));
		background: var(--bg-deep);
		object-fit: cover;
	}
	.note {
		margin: 0.75rem 0 0;
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	.warn {
		color: var(--gold);
	}
	.hint {
		font-size: var(--fs-xs);
		color: var(--text-faint);
		line-height: 1.35;
	}
	.field {
		display: grid;
		gap: 0.4rem;
		align-content: start;
	}
	.field-label {
		color: var(--text);
	}
	.check {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		margin-top: 0.75rem;
		color: var(--text);
	}
	.check input {
		margin-top: 0.2rem;
		flex: none;
	}
	.effects {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		display: grid;
	}
	.effect {
		display: grid;
		gap: 0.3rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--border);
		font-size: var(--fs-sm);
	}
	.effect .check {
		margin-top: 0;
	}
	.effect.muted {
		color: var(--text-muted);
	}
	.effect.inactive {
		opacity: 0.75;
	}
	.tag {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
	.stacks {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	.stacks input {
		width: 5rem;
	}
	.result {
		font-size: var(--fs-xs);
		font-weight: 600;
		color: var(--gold);
	}
	.result.none {
		font-weight: 400;
		color: var(--text-faint);
	}
	input:disabled,
	select:disabled {
		opacity: 0.6;
	}
</style>
