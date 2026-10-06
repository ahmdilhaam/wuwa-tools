# WuWa Tools

Kalkulator damage dan pustaka build untuk Wuthering Waves. Situs statis (SvelteKit + adapter-static).

## Fitur

- **Kalkulator damage** — satu hit dan perbandingan build A vs B, dengan pemilih karakter → skill → hit (MV resmi dari data game) dan preset RES dari 159 musuh.
- **Karakter** — 60 resonator: data build (echo, senjata, stat, tim, rotasi), tabel Motion Value per level, dan sequence S1–S6.
- **Echo set, senjata, mekanik** — bonus sonata, stat Lv90 + pasif R1–R5, aturan umum dan rentang roll substat.

## Sumber data

| Data | Sumber | Pembaruan |
|---|---|---|
| Fakta game (skill, MV, senjata, sonata, RES musuh) | [api-v2.encore.moe](https://api-v2.encore.moe) → `src/lib/data/game/` | `bun run sync` |
| Saran build (echo, tim, prioritas substat) | `reference/wuwa-core/` → `src/lib/data/characters.json` | `bun scripts/convert-characters.ts` |

## Pengembangan

```sh
bun install
bun run dev      # server dev
bun run test     # vitest
bun run check    # svelte-check
bun run build    # output statis ke build/
```

Catatan: SvelteKit 3 tidak lagi menyediakan `$lib`; impor memakai `#lib/...` dengan ekstensi eksplisit (mis. `#lib/calc/damage.ts`).
