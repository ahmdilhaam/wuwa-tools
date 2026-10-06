---
name: wuwa-core
description: Wuthering Waves Core Knowledge Library — the authoritative reference for all WuWa game mechanics, character builds, echo sets, weapons, and meta knowledge. Trigger this skill whenever any other skill (kit-researcher, scriptwriter, damage-calculator) needs to look up builds, echo set bonuses, universal mechanics, stat thresholds, or weapon effects. Also trigger when Sergieric asks to add new knowledge from video transcripts, wiki pages, or community resources. This is the living library that all WuWa content creation depends on — consult it any time factual WuWa data is needed.
---

# Wuthering Waves Core — Knowledge Library

This skill is the **single source of truth** for all Wuthering Waves game knowledge used across Sergieric's content workflow. It does not write scripts, analyze kits, or calculate damage — it stores and retrieves verified facts.

---

## How to Use This Library

When another skill (kit-researcher, scriptwriter, damage-calculator) needs factual game data:

1. **Look up the relevant reference file** from the index below
2. **Read that file** using the Read tool
3. **Cross-reference** the data against whatever kit or claim you're working with
4. **Flag conflicts** — if new data contradicts this library, surface the conflict to Sergieric before proceeding

When Sergieric sends new content to add (video transcript, wiki text, patch notes):
1. Extract the key facts, numbers, and mechanics
2. Identify which reference file(s) they belong in
3. Add them cleanly, preserving the existing format
4. Note the source and date

---

## Reference File Index

| File | Contents |
|---|---|
| `references/universal-mechanics.md` | ELE+ELE vs ELE+ATK rule, echo configs (43311 vs 44111), forte tree priority, sig weapon value, ER thresholds |
| `references/echo-sets.md` | All sonata sets — name, abbreviation, element, 2pc and 5pc bonuses |
| `references/echo-substats.md` | Substat roll ranges and distribution (Chasey dataset, ~5300 samples) |
| `references/weapons.md` | Signature and F2P weapon stats, passive effects, who they're for |
| `references/characters/index.md` | Master list of all characters, their element, role, and which file has their build data |
| `references/characters/aero.md` | Jiyan, Ciaccona, Cartethyia, Iuno, Qiuyuan, Rover (Aero), Sigrika |
| `references/characters/electro.md` | Augusta, Rebecca, Xiangli Yao, Yinlin |
| `references/characters/fusion.md` | Aemeath, Brant, Changli, Chixia, Denia, Lupa, Mortefi, Mornye |
| `references/characters/glacio.md` | Carlotta |
| `references/characters/havoc.md` | Camellya |
| `references/characters/spectro.md` | Jinhsi |

---

## Adding New Character Data

When a new character's guide is researched (from video transcript or kit reveal):

**Format per character:**
```markdown
### [Character Name] — [Role] ([Element])
- **Sig:** [Weapon name] (ATKxxx, secondary stat)
- **Echo:** [Main echo] [5pc set name]
- **Stats:** [ATK threshold], [ER%], [CR%:CD%]
- **Forte priority:** [Lv10 priority order], [what can stay Lv1 or 6]
- **Substats:** [priority order]
- **Teams:** [team comp names and members]
- **Pull priority:** [character > sig > sequences order]
- **Sequences:** [S1, S2, S3, S6 notes — what they do, worth it or not]
- **Notes:** [any special rules, e.g. can't use Spectro Frazzle, needs 250% ER, etc.]
- **Source:** [video title / creator / date]
```

---

## Content Workflow Context

This library fits into Sergieric's workflow like this:

```
1. Kit Researcher   → reads new character's kit (screenshots/reveal page)
2. WuWa Core        → provides echo set context, universal mechanics, 
                       comparable characters, synergy patterns
3. Scriptwriter     → uses kit research + wuwa-core to write the script
4. Damage Calculator → optional: cost-3 ELE+ELE vs ELE+ATK comparison, 
                                  weapon comparison
```

---

## Data Versioning

Each reference file should note the game version and last update date at the top. When patch notes change numbers or mechanics, update the relevant file and note the version change inline.

Current baseline: **Game Version 3.4 | Source: Chasey's WW Character Build Guide | Last Updated: June 26, 2026**
