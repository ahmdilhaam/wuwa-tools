---
name: wuwa-damage-calculator
description: >
  Builds and delivers an interactive single-hit damage calculator for Wuthering Waves using
  a React artifact. Trigger this skill whenever the user asks to calculate damage, build a
  damage calculator, estimate how hard a character hits, verify a damage number, or compare
  damage across builds in Wuthering Waves. Also trigger when the user shares in-game stat
  screenshots and asks for a predicted damage number, or when they want to verify a formula
  against an actual in-game result. This skill encodes all confirmed damage formula rules,
  enemy resistance data, and common character-specific edge cases discovered through live
  in-game testing.
---

# WuWa Damage Calculator Skill

## What this skill produces

An interactive React artifact: a single-hit damage calculator for Wuthering Waves. It
accepts character stats, skill MV, DMG bonus inputs, enemy preset, and DEF/RES modifiers,
then outputs critical hit, non-critical, and average damage with a step-by-step formula
breakdown. Updates live as inputs change.

---

## The confirmed damage formula

```
DMG = Base DMG × DMG Bonus Pool × Amplify × Special DMG × DEF% × RES Factor × Crit Multiplier
```

### Step-by-step

**1. Base DMG**
```
Base DMG = ATK × (MV / 100) + Flat DMG
```

**2. DMG Bonus Pool** (all additive within this tier)
```
DMG Bonus Pool = 1 + Element DMG% + DMG Type% + General DMG% + Combat-Triggered Bonus%
```

**3. DMG Amplify / Deepen** (separate multiplicative tier)
```
Amplify Multiplier = 1 + Amplify%
```

**4. Special DMG** (separate multiplicative tier, rare)
```
Special DMG Multiplier = 1 + Special DMG%
```

**5. DEF Factor**
```
Enemy DEF (base)     = 792 + 8 × EnemyLevel
Enemy DEF (modified) = EnemyDEF × (1 − DEF Reduction%) × (1 − DEF Ignore%)
DEF%                 = (800 + 8 × AttackerLevel) / (ModifiedDEF + 800 + 8 × AttackerLevel)
```

**6. RES Factor** (piecewise formula)
```
Effective RES = BaseRES% − ResShred%

If Effective RES < 0%:    RES Factor = 1 − (RES / 2)
If 0% ≤ Effective RES < 80%: RES Factor = 1 − RES
If Effective RES ≥ 80%:  RES Factor = 1 / (1 + 5 × RES)
```

**7. Crit Multiplier**
```
Crit hit:    Crit DMG%
Non-crit:    1.0
Average:     1 + Crit Rate% × (Crit DMG% − 1)
```

---

## Confirmed rules — MUST follow for every calculation

### Rule 1: Always verify the damage type classification
Never assume a skill's damage type matches its category name. Many Liberation skills are
internally classified as Resonance Skill DMG. Always check the skill description or wiki
before assigning the type bonus pool.

Known examples:
- Carlotta — Era of New Wave, Death Knell, Fatal Finale: **Resonance Skill DMG** (not Liberation)
- Jinhsi — Incarnation Basic Attacks during Liberation: **Resonance Skill DMG**
- Changli — True Sight: Conquest, True Sight: Charge, Flaming Sacrifice: **Resonance Skill DMG**
- Changli — Radiance of Fealty: standard **Resonance Liberation DMG**
- Camellya — Fervor Efflorescent: **Resonance Liberation DMG** but ALSO benefits from Basic Attack DMG Bonus

### Rule 2: Stat page shows final values — never double-count
The in-game attribute stat page always shows the complete total including:
- Weapon passive attribute DMG bonus (e.g. +12% Spectro from Ages of Harvest)
- Inherent skills that are always-on (e.g. Jinhsi +20% Spectro, Changli passive)
- Echo set 2pc passive bonuses

**Do NOT add these again on top of the stat page value.**

Only add separately if the buff is combat-triggered and therefore NOT shown:
- Lingering Tunes 5pc on-field ATK bonus
- Celestial Light 5pc Spectro DMG after Intro cast
- Molten Rift 5pc Fusion DMG after Skill cast
- Blazing Brilliance Searing Feather stacks (require dealing damage to build)
- Weapon Liberation/Skill buffs triggered mid-combat

### Rule 3: Enemy base RES = 10% for all elements; 40% for same element
Confirmed from wuthering.wiki raw monster data across all standard enemies:
- Every element: **10% RES** by default
- Enemy's own element: **40% RES**
- Physical-element enemies: still 10% Physical RES (no self-elevation)
- Never assume 0% — even "non-matching" elements have 10%

### Rule 4: DEF Ignore is applied to enemy DEF before the formula
DEF Ignore reduces the enemy's effective DEF stat directly:
`EffectiveDEF = BaseDEF × (1 − DEFIgnore%)`

It does NOT reduce the character's attacker level contribution.
DEF Reduction (a debuff on the enemy) is applied before DEF Ignore.

### Rule 5: Forte stacks sitting idle have no passive effect on Liberation
Confirmed on Changli: full Enflamement (4 stacks) at time of Liberation cast gives zero
bonus to Liberation damage. Stacks only matter for enabling Flaming Sacrifice (Forte Heavy).

### Rule 6: Inherent Skill enhancements on Liberation are NOT in the stat page
These are skill-specific enhancements applied during the hit, not character buffs:
- Changli Inherent Skill 2 (Sweeping Force): +20% Fusion DMG + 15% DEF Ignore on Liberation
  → Add the 20% to Combat-Triggered Bonus field; add 15% to DEF Ignore field
- These do NOT appear on the attribute page

---

## Enemy preset data (confirmed from wuthering.wiki)

| Enemy | Element | Aero | Glacio | Fusion | Electro | Spectro | Havoc | Physical |
|---|---|---|---|---|---|---|---|---|
| Feilian Beringal | Aero | **40%** | 10% | 10% | 10% | 10% | 10% | 10% |
| Inferno Rider | Fusion | 10% | 10% | **40%** | 10% | 10% | 10% | 10% |
| Crownless | Havoc | 10% | 10% | 10% | 10% | 10% | **40%** | 10% |
| Tempest Mephis | Electro | 10% | 10% | 10% | **40%** | 10% | 10% | 10% |
| Lampylumen Myriad | Glacio | 10% | **40%** | 10% | 10% | 10% | 10% | 10% |
| Mourning Aix | Spectro | 10% | 10% | 10% | 10% | **40%** | 10% | 10% |

---

## Notable Lv90 attacker DEF% values (no DEF ignore)

| Enemy Level | DEF% |
|---|---|
| 85 | 50.80% |
| 90 | 50.13% |
| 100 | 48.84% |
| 120 | 46.45% |

---

## How to build the calculator artifact

Read the component spec in `references/calculator-component.md` for the full React source.
The component includes:
- Two-column layout: inputs left, results right
- Live auto-calculation (no submit button)
- Enemy presets with auto RES lookup by attacker element
- Formula breakdown panel (collapsible)
- Piecewise RES formula
- Rules reminder panel

When asked to build or show the calculator:
1. Read `references/calculator-component.md`
2. Render it as a `.jsx` artifact
3. Pre-load with sensible defaults (ATK 2400, CR 72%, CD 280%, MV 1212.75%)

When doing a manual damage calculation from screenshots (no artifact needed):
1. Follow the formula steps in order above
2. Flag every unknown value before calculating — never assume
3. Verify the damage type classification before assigning the bonus pool
4. State clearly which values come from the stat page vs. combat triggers
5. Show the full step-by-step breakdown in the response

---

## Pre-Calculation Checklist (run before EVERY calc)

- [ ] **CR confirmed** — check weapon main stat (Crit Rate vs Crit DMG changes the ratio)
- [ ] **Damage type verified** — Basic / Heavy / Skill / Lib / Intro? Verified from kit, NOT assumed from skill category name
- [ ] **DMG Bonus pool confirmed** — which Ele% and Type% apply to this specific hit?
- [ ] **Amplify/Deepen confirmed** — which buffs are active, are they combat-triggered or permanent?
- [ ] **No double-counting** — nothing already on the stat page added again
- [ ] **Enemy level set** — Lv90=50.13%, Lv100=48.84%, Lv120=46.45% DEF% (at Lv90 attacker)
- [ ] **For rotation DPS** — per-hit MV confirmed from in-game skill card or wiki at Lv10, hit count confirmed

---

## Rotation DPS — Critical Rules

### The Root Cause of Underestimation
Rotation DPS estimates fail when ability hit counts are not accounted for. Named abilities in rotation strings represent *animation sequences*, not single hits. Each must be broken down to individual hit instances.

**Confirmed example — Jiyan's Lance of Qingloong:**
- Each cast in the rotation = **8 individual hits**
- If the rotation has 8 Lance casts → 64 total hit instances from this ability alone
- Treating each rotation entry as 1 hit produces ~5–6× underestimate

### Getting Hit Counts Right
Per-hit MVs must come from one of:
1. **In-game skill card at Lv10** — shows MV per hit for each stage of a multi-hit ability
2. **Wiki** (wutheringwaves.fandom.com or wuwa.wiki.gg) — skill tables with individual hit MVs
3. **IWinToLose simulator** — character data tabs contain exact per-hit MVs used in calculations

**Never estimate rotation MV by counting ability names.** Always count individual hit instances with confirmed MV per hit.

### Rotation DPS Formula
```
Total_Rotation_DMG = Σ (hits × per_hit_DMG) for all abilities in rotation
Rotation_DPS = Total_Rotation_DMG / Rotation_Duration_seconds
```

---

## Benchmark Reference — IWinToLose Rotation Simulator

**URL:** https://docs.google.com/spreadsheets/d/e/2PACX-1vR2iscTAIfIzg6JHhakvlrY_E3au2pFk0HDajhxSnkFZcosauLIvYCaSVP9_iN_hG11lJCVeI9u1DUZ/pubhtml
**Version:** V6.15.1 | **Standard:** 2-minute DPS, all S0R1

**Standardized substat inputs used by simulator:**
- CR = 0.405 (40.5%), CD = 0.81 (81%), Ele% = 0.172, Type% = 0.172, ER = 0.184 where applicable

| Team | Main DPS | Support 1 | Support 2 | 2-min DPS |
|---|---|---|---|---|
| Jiyan | S0R1 Verdant Summit | Mortefi S6R1 Static Mist | SK S0R1 Stellar Symphony | **60,674** |
| Carlotta | S0R1 The Last Dance | Zhezhi S0R1 Radiance Dancer | SK S0R1 Stellar Symphony | **61,368** |
| Xiangli Yao | S0R1 | Yinlin S0R1 | SK S0R1 | **50,192** |
| Encore | S0R1 Stringmaster | Lupa S0R1 Wildfire Mark | SK S0R1 | **61,735** |
| Changli | S0R1 Blazing Brilliance | Lupa S0R1 Wildfire Mark | Brant S0R1 Unflickering Valor | **76,185** |
| Augusta | S0R1 Thunderbolt | Iuno S0R1 Montage Sphere | SK S0R1 | **78,873** |
| Cartethyia | S0 Daybreak Twinblade | Ciaccona S0 Windrider Anthem | Rover Aero S2R3 Broadpeak | **82,777** |

These are the **ground truth** values for verifying rotation DPS calculations. If a calculated result is far from these, the error is almost always in total MV (hit count) or in Amplify/DEF% application.

---

## Weapon Comparison Rules

When comparing two weapons (A vs B):
```
Damage_Ratio = (ATK_A × bonus_multiplier_A) / (ATK_B × bonus_multiplier_B)
```

Where `bonus_multiplier` = everything after Base DMG in the formula that the weapon affects.

**Key principle:** Weapon stat page ATK is base ATK only — character base ATK + weapon base ATK. Echo ATK% bonuses multiply the full ATK, so higher base ATK from the weapon scales up echo ATK% bonuses too.

**Confirmed methodology from sessions:**
- Read exact weapon ATK and secondary stat from weapon card (never estimate)
- Check if weapon passive is permanent or combat-triggered
- Permanent passives show on stat page already — do NOT add again
- Combat-triggered passives (e.g. "after casting Skill, +X% DMG for 8s") must be added separately
- Signature weapons average 10–20% over non-signature 5★ standard weapons (Chasey data)

---

## Confirmed Character Damage Type Classifications

Always verify, but these are confirmed from live testing and kit reading:

| Character | Skill Name | Actual DMG Type | Common Wrong Assumption |
|---|---|---|---|
| Carlotta | Era of New Wave (Liberation) | **Resonance Skill DMG** | Liberation DMG |
| Carlotta | Death Knell × 4 (Liberation) | **Resonance Skill DMG** | Liberation DMG |
| Carlotta | Fatal Finale (Liberation) | **Resonance Skill DMG** | Liberation DMG |
| Jinhsi | Incarnation Basic ATKs (Liberation state) | **Resonance Skill DMG** | Basic ATK DMG |
| Changli | True Sight: Conquest (Forte Heavy) | **Resonance Skill DMG** | Heavy ATK DMG |
| Changli | True Sight: Charge (Forte) | **Resonance Skill DMG** | Heavy ATK DMG |
| Changli | Flaming Sacrifice (Forte) | **Resonance Skill DMG** | Skill DMG |
| Changli | Radiance of Fealty (Liberation) | **Resonance Liberation DMG** | — (correct) |
| Camellya | Enhanced Basic ATKs (Forte) | **Basic ATK DMG** | — |
| Camellya | Liberation initial hit | **Liberation DMG** also benefits from **Basic ATK DMG Bonus** | — |
| Jiyan | Lance of Qingloong (Liberation state Heavy ATKs) | **Heavy ATK DMG** | Basic ATK or Liberation |
| Jiyan | Windqueller in Qingloong Mode | **Heavy ATK DMG** | Resonance Skill DMG |
| Xiangli Yao | Liberation | **Resonance Liberation DMG** | — (correct) |
