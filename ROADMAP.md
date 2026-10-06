# Roadmap

Planned features, in recommended order. Each item lists what already exists so it can be picked up in a fresh session. Read `DEVELOPMENT.md` first (routing, i18n, data pipeline, SvelteKit 3 quirks).

Status legend: ☐ not started · ◐ in progress · ☑ done

---

## 1. Share calculator state via URL ☐

**Why:** let players share an exact calculation (friends, videos, Discord). Small effort, high value.

**Exists:** the whole calculator input is one `BuildState` object (`src/lib/calc/build.ts`); compare mode holds two of them.

**Approach:**
- Serialize only fields that differ from `defaultBuild()` into a compact query string (short keys, e.g. `?c=jiyan&s=1&h=1404020001&atk=2400`), or base64url JSON for compare mode (`?a=…&b=…`).
- Read it on mount (prerendered pages can't read `url.search` during prerender — see `enableLocationSuffix()` in `src/lib/i18n/index.svelte.ts` for the existing pattern).
- Update the URL with `replaceState` on change (debounced), and a "Copy link" button.
- Keep the language prefix (`/en/calculator/?…`).

**Done when:** a copied link reproduces the same numbers in a new tab, in both languages and both tabs; unit tests for encode/decode round-trip and for ignoring unknown/invalid params.

## 2. Rotation DPS calculator ☐

**Why:** the most common mistake in rotation estimates is counting ability names instead of individual hits (see `reference/wuwa-damage-calculator/SKILL.md`, "Rotation DPS — Critical Rules"). No other tool in this site covers it.

**Exists:**
- Per-hit MV and damage type for 60 characters: `src/lib/data/game/skills/{slug}.json` → `skills[].hits[]`.
- Single-hit engine: `calculateDamage()` in `src/lib/calc/damage.ts`.
- Benchmarks to validate against (IWinToLose 2-min DPS table) in the same SKILL.md.

**Approach:**
- New tab or route `/rotation/`: build a sequence of rows `{ hitId, count }` per character (team of 1–3), each row reusing the shared stat/enemy inputs; total damage = Σ count × per-hit damage; DPS = total ÷ rotation duration (user input, seconds).
- Row picker reuses the skill/hit picker from `BuildInputs.svelte`; show per-row damage and share of total (a sorted bar list fits the existing chart style).
- Optional: buffs that apply only to part of the rotation (toggle per row).

**Done when:** a hand-built Jiyan rotation lands in the same order of magnitude as the benchmark table; tests for summing and duration handling.

## 3. Stat builder from scratch ☐

**Why:** today the user copies totals from the in-game attribute page. A builder computes them.

**Exists:** character base ATK/HP/DEF at Lv90 (`src/lib/data/game/characters.json` → `base`), weapon ATK Lv90 + secondary (`weapons.json`), substat roll ranges (`src/lib/data/substats.ts`), echo cost configs (43311 / 44111) in `src/lib/data/mechanics.ts`.

**Approach:**
- Optional mode in the calculator: base ATK (character + weapon) × (1 + ATK% from echo main/sub stats + weapon secondary if ATK%) + flat ATK; same for crit, element DMG, ER.
- Echo main stat values per cost need a data source (not synced yet) — check encore.moe echo/phantom endpoints first; otherwise hand-write a small table.
- Output feeds the existing fields; manual entry stays the default (Rule 2: stat page values are final).

**Done when:** a sample build matches an in-game attribute page within rounding.

## 4. Echo scorer ☐

**Why:** players want to know if an echo is worth keeping.

**Exists:** roll ranges per substat (`substats.ts`), substat priority per character in build data (`src/lib/data/characters.json` → `substats`).

**Approach:** input up to 5 substats with values → score each roll against its max roll, weight by the character's priority, show a simple grade and which rolls are low/high tier.

**Done when:** scoring is unit-tested with known high/low examples from the roll table.

## 5. Team buff presets ☐

**Why:** common support buffs (Outro amplify, 5pc set buffs, sequences) are typed manually into "In-combat bonus" / "Amplify" today.

**Exists:** weapon passives already use a toggle model with structured effects (`src/lib/calc/weapon.ts`, parser in `scripts/encore-helpers.ts`); sequence and skill texts are synced per character.

**Approach:** a hand-curated list of the top supports' team buffs (`src/lib/data/team-buffs.ts`, `{ id, en }` labels), each with stat/scope/value like `WeaponEffect`, rendered as toggles next to the weapon section and summed by the same contribution logic.

**Done when:** enabling a buff changes the result by the expected amount (test), and the breakdown shows its source.

## 6. Scheduled data sync (GitHub Action) ☐

**Why:** patches add characters/weapons; keeping data fresh shouldn't need a manual run.

**Exists:** `bun run sync` (cached, validated, exits non-zero on bad data) and the translation report (`bun run i18n:apply --list`).

**Approach:** weekly workflow: `bun install` → `bun run sync --no-cache` → `bun run i18n:extract` → `bun run test && bun run check && bun run build` → if `src/lib/data/` changed, open a PR whose body lists new characters/weapons and untranslated templates. Never auto-merge.

**Done when:** a manual `workflow_dispatch` run opens a PR (or reports "no changes").

## 7. Complete build data ☐

**Why:** 7 characters show "no build data yet", and Aero data is from Patch 3.2.

**Exists:** `reference/wuwa-core/references/characters/*.md` → `bun scripts/convert-characters.ts` → `src/lib/data/characters.json`. Missing: Rover (Electro), Yangyang: Xuanling, Suisui, Qingxiao, Hsin, Jingran, Suoming.

**Approach:** update the reference markdown (same per-character format as SKILL.md), re-run the converter, translate nothing (build text stays English by design). Also update the Aero file header/version.

**Done when:** the converter's gap report lists no missing core fields for these characters.

## 8. SEO ☐

**Why:** the site is prerendered in two languages but has no sitemap and uses relative `hreflang` URLs.

**Approach (after the production domain is fixed):** absolute `hreflang` / canonical URLs in `src/routes/[[lang=lang]]/+layout.svelte`, a prerendered `sitemap.xml` covering both languages, per-page `<meta name="description">`, and OG images per character (portrait + element color).

**Done when:** sitemap lists all 132 pages and validates; links in `hreflang` are absolute.
