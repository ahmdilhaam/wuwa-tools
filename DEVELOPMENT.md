# Development

Static site built with SvelteKit (adapter-static), Svelte 5, TypeScript, and bun.

## Commands

```sh
bun install
bun run dev      # dev server
bun run test     # vitest
bun run check    # svelte-check
bun run build    # static output in build/
```

## Updating data

| Data | Source | Command |
|---|---|---|
| Game facts (skills, MVs, weapons, sonata sets, enemy RES) | [api-v2.encore.moe](https://api-v2.encore.moe) → `src/lib/data/game/` | `bun run sync` (`--no-cache` to refetch) |
| Build advice (echoes, teams, substat priority) | `reference/wuwa-core/` → `src/lib/data/characters.json` | `bun scripts/convert-characters.ts` |

Generated JSON is committed so the build stays fully static. Raw API responses are cached in `.cache/encore/` (git-ignored).

## Notes

- SvelteKit 3 no longer provides `$lib`; import with `#lib/...` and an explicit file extension (e.g. `#lib/calc/damage.ts`).
- Identifiers are English; UI text and code comments are Indonesian.
- `vite preview` caches the build file list — restart it after rebuilding.
