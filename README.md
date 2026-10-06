# WuWa Tools

Damage calculator and build library for Wuthering Waves. Static site built with SvelteKit + adapter-static. The UI is in Indonesian.

## Features

- **Damage calculator** — single hit and build A vs B comparison, with a resonator → skill → hit picker (official MVs from game data), RES presets for 159 enemies, and a multiplier chain chart showing how each factor affects the result.
- **Resonators** — 60 characters: build data (echoes, weapons, stats, teams, rotation), Motion Value tables per skill level, and sequences S1–S6.
- **Echo sets, weapons, mechanics** — sonata bonuses, Lv90 weapon stats with R1–R5 passives, general build rules, and substat roll ranges.

## Data sources

| Data | Source | Update |
|---|---|---|
| Game facts (skills, MVs, weapons, sonata sets, enemy RES) | [api-v2.encore.moe](https://api-v2.encore.moe) → `src/lib/data/game/` | `bun run sync` |
| Build advice (echoes, teams, substat priority) | `reference/wuwa-core/` → `src/lib/data/characters.json` | `bun scripts/convert-characters.ts` |

## Development

```sh
bun install
bun run dev      # dev server
bun run test     # vitest
bun run check    # svelte-check
bun run build    # static output in build/
```

Note: SvelteKit 3 no longer provides `$lib`; import with `#lib/...` and an explicit file extension (e.g. `#lib/calc/damage.ts`).

Fan project, not affiliated with Kuro Games.
