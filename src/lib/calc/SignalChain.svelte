<script lang="ts">
	import { formatNumber, t } from '#lib/i18n/index.svelte.ts';
	import type { DamageBreakdown } from './damage.ts';
	import type { WeaponContribution } from './weapon.ts';

	// wc: kontribusi pasif senjata (opsional); dipakai untuk sub-baris "dari senjata"
	let { r, wc = null }: { r: DamageBreakdown; wc?: WeaponContribution | null } = $props();

	const CAP = Math.log(4); // bar penuh = ×4 atau ×0,25
	const nf = { format: (n: number) => formatNumber(n, { maximumFractionDigits: 0 }) };
	const mf = { format: (n: number) => formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) };
	const pf = { format: (n: number) => formatNumber(n, { maximumFractionDigits: 2 }) };

	const steps = $derived.by(() => {
		const pct = (n: number) => `+${pf.format(n)}%`;
		const crit = [
			wc && wc.critRatePct ? `${pct(wc.critRatePct)} Crit Rate` : '',
			wc && wc.critDmgPct ? `${pct(wc.critDmgPct)} Crit DMG` : ''
		].filter(Boolean);
		const defs: { label: string; m: number; note: string }[] = [
			{
				label: t('calc.chain.bonus'),
				m: r.bonusPool,
				note: wc?.dmgBonusPct ? t('calc.chain.fromWeapon', { amount: pct(wc.dmgBonusPct) }) : ''
			},
			{
				label: t('calc.chain.amplify'),
				m: r.amplifyMultiplier,
				note: wc?.amplifyPct ? t('calc.chain.fromWeapon', { amount: pct(wc.amplifyPct) }) : ''
			},
			{ label: t('calc.chain.special'), m: r.specialMultiplier, note: '' },
			{
				label: t('calc.chain.def'),
				m: r.defFactor,
				note: wc?.defIgnorePct ? t('calc.chain.defIgnoreFromWeapon', { amount: pct(wc.defIgnorePct) }) : ''
			},
			{
				label: t('calc.chain.res'),
				m: r.resFactor,
				note: wc?.resShredPct ? t('calc.chain.resShredFromWeapon', { amount: pct(wc.resShredPct) }) : ''
			},
			{
				label: t('calc.chain.crit'),
				m: r.avgCritMultiplier,
				note: crit.length ? t('calc.chain.fromWeapon', { amount: crit.join(', ') }) : ''
			}
		];
		let total = r.baseDmg;
		return defs.map((d) => {
			total *= d.m;
			const ln = d.m > 0 ? Math.log(d.m) : -CAP;
			const w = Math.min(Math.abs(ln) / CAP, 1) * 50;
			return { ...d, total, w, dir: ln > 0 ? 'up' : 'down', neutral: Math.abs(ln) < 1e-9 };
		});
	});
</script>

<ol class="chain" aria-label={t('calc.chain.label')}>
	<li class="step base" aria-label={t('calc.chain.baseAria', { value: nf.format(r.baseDmg) })}>
		<span class="name">{t('calc.chain.base')}</span>
		<span class="val">{nf.format(r.baseDmg)}</span>
		<span class="track" aria-hidden="true"></span>
		<span class="run">{nf.format(r.baseDmg)}</span>
	</li>
	{#each steps as s (s.label)}
		<li
			class="step"
			class:dim={s.neutral}
			aria-label={t('calc.chain.stepAria', { label: s.label, mult: mf.format(s.m), total: nf.format(s.total) }) +
				(s.note ? `, ${s.note}` : '')}
		>
			<span class="name">{s.label}</span>
			<span class="val">×{mf.format(s.m)}</span>
			<span class="track" aria-hidden="true">
				<span class="bar {s.dir}" style={`width:${s.w}%`}></span>
			</span>
			<span class="run">{nf.format(s.total)}</span>
			{#if s.note}<span class="sub">{s.note}</span>{/if}
		</li>
	{/each}
	<li class="step final" aria-label={t('calc.chain.averageAria', { value: nf.format(r.avgDamage) })}>
		<span class="name">{t('calc.chain.average')}</span>
		<span class="val"></span>
		<span class="track" aria-hidden="true"></span>
		<span class="run">{nf.format(r.avgDamage)}</span>
	</li>
</ol>

<style>
	.chain {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
	}
	.step {
		display: grid;
		grid-template-columns: minmax(6.5rem, 8.75rem) 3.6rem minmax(2rem, 1fr) minmax(3.2rem, auto);
		align-items: center;
		gap: 0.6rem;
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--border);
		font-size: var(--fs-sm);
	}
	.name {
		color: var(--text);
	}
	.val {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.sub {
		grid-column: 1 / -1;
		margin-top: -0.2rem;
		font-size: var(--fs-xs);
		color: var(--gold);
	}
	.run {
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}
	.track {
		position: relative;
		height: 0.55rem;
		background: var(--bg-deep);
		border-radius: 2px;
	}
	.track:empty {
		background: transparent;
	}
	.step:not(.base):not(.final) .track::before {
		content: '';
		position: absolute;
		left: 50%;
		top: -2px;
		bottom: -2px;
		width: 1px;
		background: var(--border-strong);
	}
	.bar {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 2px;
		transition: width 200ms ease-out;
	}
	.bar.up {
		left: 50%;
		background: var(--gold);
	}
	.bar.down {
		right: 50%;
		background: var(--danger);
	}
	.dim {
		opacity: 0.5;
	}
	.final {
		border-bottom: 0;
		padding-top: 0.7rem;
		grid-template-columns: 1fr auto;
	}
	.final .track,
	.final .val {
		display: none;
	}
	.final .name,
	.final .run {
		color: var(--text);
		font-weight: 700;
		font-size: var(--fs-md);
	}
</style>
