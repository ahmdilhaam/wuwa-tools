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

## Languages

Indonesian is the default (`/…`); English lives under `/en/…`. All routes sit in `src/routes/[[lang=lang]]/` (matcher in `src/params.ts`) and both languages are prerendered.

- UI strings: typed dictionaries in `src/lib/i18n/` — `id.ts` / `en.ts` plus per-area files in `dict/` (`calc.*`, `library.*`). The English file uses `satisfies` the Indonesian shape, so a missing or extra key fails `bun run check`.
- In components: `t('key', params)`, `localize('/path/')` for every internal link, `formatNumber()` for numbers, `gameText({ en, id })` for game text.

## Translations of game text (Indonesian)

The API has no Indonesian text, so translations live in overlay files that `bun run sync` never overwrites:

| Text | Overlay |
|---|---|
| Weapon passives | `src/lib/data/i18n/weapon-passives.id.json` |
| Skill & sequence descriptions | `src/lib/data/i18n/skills/<slug>.id.json` |

Keys are the English text with numbers replaced by placeholders (`{0}`, `{1}`, …), so one translation covers every refinement or skill level. Style rules and terms that must stay English are in `src/lib/data/i18n/glossary.md`.

### New character, weapon, or changed text after a patch

1. `bun run sync` — the summary reports untranslated templates (e.g. `16 templat belum diterjemahkan`). Untranslated text falls back to English on the site.
2. `bun run i18n:extract` — writes `<slug>.source.json` and creates an empty `<slug>.id.json` for new characters (existing overlays are never overwritten).
3. Fill the overlay: each source string as the key, its Indonesian translation as the value, placeholders kept exactly.
4. `bun run i18n:apply` — applies and validates. It fails on placeholder mismatches and lists the offending slug/template. Add `--list` to print missing templates. Keys whose English source changed are reported as stale.
5. Commit `src/lib/data/i18n/` together with the regenerated `src/lib/data/game/` files.

Build advice for a new character is separate: it stays empty ("Belum ada data build") until `reference/wuwa-core/` is updated and `bun scripts/convert-characters.ts` is re-run.

## Notes

- SvelteKit 3 no longer provides `$lib`; import with `#lib/...` and an explicit file extension (e.g. `#lib/calc/damage.ts`).
- Identifiers are English; UI text and code comments are Indonesian.
- `vite preview` caches the build file list — restart it after rebuilding.
