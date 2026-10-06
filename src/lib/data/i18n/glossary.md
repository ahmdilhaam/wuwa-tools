# Glosarium terjemahan pasif senjata

Dipakai untuk menerjemahkan `weapon-passives.source.json` ke `weapon-passives.id.json`.
Placeholder `{0}`, `{1}`, ... WAJIB dipertahankan persis (jumlah dan isinya sama), tanda `%` dan satuan tetap di luar placeholder.

## Istilah yang WAJIB tetap bahasa Inggris

Kalkulator memakai istilah ini di UI, jadi jangan diterjemahkan.

- Basic Attack, Heavy Attack, Resonance Skill, Resonance Liberation, Intro Skill, Outro Skill, Echo Skill
- Forte Circuit, Concerto Energy, Resonance Energy
- Attribute DMG Bonus, DMG Bonus, Amplify, Healing Bonus
- ATK, HP, DEF, Crit. Rate, Crit. DMG, Energy Regen
- Dodge Counter, Coordinated Attack, Tune Break / Tune Rupture, Off-Tune
- Negative Status: Spectro Frazzle, Aero Erosion, Havoc Bane, Fusion Burst, Glacio Chafe, Electro Flare
- Resonator, Echo, Sonata
- Nama elemen (Glacio, Fusion, Electro, Aero, Spectro, Havoc) dan nama karakter/senjata/efek bernama lainnya

## Pola frasa yang disarankan

| Inggris | Indonesia |
|---|---|
| Increases X by {0} | Meningkatkan X sebesar {0} |
| for {0}s | selama {0} dtk |
| lasting for {0}s | selama {0} dtk |
| stacking up to {0} time(s) | bertumpuk hingga {0} kali |
| the wielder | pemakai |
| Incoming Resonator | Resonator yang masuk |
| When hitting a target with ... | Saat mengenai target dengan ... |

# Skill & sequence

Dipakai untuk `skills/{slug}.source.json` -> `skills/{slug}.id.json` (`{ "templat Inggris": "templat Indonesia" }`).
Nama skill dan nama sequence TIDAK diterjemahkan (nama diri); hanya deskripsinya.

## Aturan teknis

- Placeholder `{0}`, `{1}`, ... WAJIB identik (jumlah dan isi) dengan sumber; urutannya boleh berubah.
- Pertahankan baris kosong (`\n\n`) dan baris baru tunggal (`\n`) persis seperti sumber: jumlah paragraf dan baris sama.
- Pertahankan awalan butir `- ` di awal baris, tanda kutip `"..."`, dan tanda baca nama (`Stage 3 - Commendable`, `Final Act - Breakdown Form`) apa adanya.
- `%` dan satuan (`s`) tetap menempel di luar placeholder: `{0}%`, `{0}s` -> `{0}%`, `{0} dtk`.
- Hindari kata ganti orang kedua ("kamu", "Anda"); pakai kalimat imperatif atau deskriptif.

## Istilah yang WAJIB tetap bahasa Inggris

- Jenis skill: Basic Attack, Heavy Attack, Plunging Attack, Dodge Counter, Mid-air Attack, Normal Attack (nama tombol), Resonance Skill, Resonance Liberation, Forte Circuit, Intro Skill, Outro Skill, Inherent Skill, Echo Skill
- Energi/mekanik umum: Concerto Energy, Resonance Energy, Off-Tune, Tune Break, Tune Rupture, Tune Strain, Stamina
- Nama stat: ATK, HP, DEF, Crit. Rate, Crit. DMG, Energy Regen, DMG Bonus, Healing Bonus, RES
- Nama elemen: Glacio, Fusion, Electro, Aero, Spectro, Havoc
- Negative Status: Spectro Frazzle, Aero Erosion, Havoc Bane, Fusion Burst, Glacio Chafe, Electro Flare
- Mekanik atau kondisi bernama dari kit karakter: SEMUA yang diawali huruf kapital dan bukan kata umum tetap Inggris, mis. "Resolve", "Qingloong Mode", "Emerald Storm: Prelude", "Enflamement", "Searing Feather", "Focus Ring", "Perfect Focus", "Trace"
- Aturan praktis: jika sebuah istilah berhuruf kapital dan bukan kata umum bahasa Inggris, biarkan.

## Pola frasa yang disarankan

| Inggris | Indonesia |
|---|---|
| Hold Normal Attack | Tahan Normal Attack |
| Press / Pressing | Tekan / Menekan |
| Release | Lepas |
| Consumes / Consume | Mengonsumsi / Konsumsi |
| Can be performed in mid-air | Dapat dilakukan di udara |
| Stage {0} | Tahap {0} |
| dealing Aero DMG | memberikan Aero DMG |
| considered as Heavy Attack DMG | dianggap sebagai Heavy Attack DMG |
| consecutive attacks | serangan beruntun |
| is increased by {0}% | meningkat sebesar {0}% |
| for {0}s | selama {0} dtk |
| can be used {0} more time | dapat digunakan {0} kali lagi |
| the target / nearby targets | target / target di sekitar |
| the team | tim |
| stacking up to {0} times | bertumpuk hingga {0} kali |
| stack(s) | stack |

## Contoh terjemahan lengkap (gaya acuan, dari jiyan.json)

### 1. Normal Attack (Resonance Skill "Normal Attack")

Sumber (bentuk templat):

```
Basic Attack

Perform up to {0} consecutive attacks, dealing Aero DMG.

Heavy Attack

Consume Stamina to thrust forward, dealing Aero DMG.

Heavy Attack: Windborne Strike

Hold Basic Attack during Heavy Attack to cast Windborne Strike after Heavy Attack ends, dealing Aero DMG.

Heavy Attack: Abyssal Slash

Release Basic Attack during Heavy Attack to cast Abyssal Slash after Heavy Attack ends, dealing Aero DMG.

Mid-Air Attack

Consume Stamina to perform a Plunging Attack while in mid-air, dealing Aero DMG.
After performing the Plunging Attack, use Basic Attack to perform a follow-up attack, dealing Aero DMG.

Mid-Air Attack: Banner of Triumph

After casting Heavy Attack Windborne Strike or Resonance Skill Windqueller in mid-air, Jiyan can perform a mid-air attack, dealing Aero DMG.

Dodge Counter

Use Basic Attack after a successful Dodge to attack the target, dealing Aero DMG.
```

Terjemahan:

```
Basic Attack

Melakukan hingga {0} serangan beruntun yang memberikan Aero DMG.

Heavy Attack

Mengonsumsi Stamina untuk menusuk ke depan, memberikan Aero DMG.

Heavy Attack: Windborne Strike

Tahan Basic Attack saat Heavy Attack untuk melancarkan Windborne Strike setelah Heavy Attack berakhir, memberikan Aero DMG.

Heavy Attack: Abyssal Slash

Lepas Basic Attack saat Heavy Attack untuk melancarkan Abyssal Slash setelah Heavy Attack berakhir, memberikan Aero DMG.

Mid-Air Attack

Mengonsumsi Stamina untuk melakukan Plunging Attack di udara, memberikan Aero DMG.
Setelah Plunging Attack, gunakan Basic Attack untuk melakukan serangan lanjutan yang memberikan Aero DMG.

Mid-Air Attack: Banner of Triumph

Setelah Heavy Attack Windborne Strike atau Resonance Skill Windqueller dilancarkan di udara, Jiyan dapat melakukan serangan di udara yang memberikan Aero DMG.

Dodge Counter

Gunakan Basic Attack setelah Dodge berhasil untuk menyerang target, memberikan Aero DMG.
```

### 2. Resonance Liberation ("Emerald Storm - Prelude")

Sumber:

```
After releasing Emerald Storm - Prelude, Jiyan enters Qingloong Mode.

Qingloong Mode

Jiyan has increased resistance to interruption.
Basic Attack, Heavy Attack and Dodge Counter are replaced with Heavy Attack Lance of Qingloong.

Heavy Attack: Lance of Qingloong

Perform up to {0} consecutive attacks, dealing Aero DMG, considered as Heavy Attack DMG.
```

Terjemahan:

```
Setelah Emerald Storm - Prelude dilepaskan, Jiyan memasuki Qingloong Mode.

Qingloong Mode

Jiyan memiliki ketahanan lebih tinggi terhadap interupsi.
Basic Attack, Heavy Attack, dan Dodge Counter digantikan oleh Heavy Attack Lance of Qingloong.

Heavy Attack: Lance of Qingloong

Melakukan hingga {0} serangan beruntun yang memberikan Aero DMG, dianggap sebagai Heavy Attack DMG.
```

### 3. Sequence (S6 "Fortitude")

Sumber:

```
Every time Heavy Attack, Intro Skill Tactical Strike or Resonance Skill Windqueller is used, Jiyan gains {0} stack(s) of "Momentum", stacking up to {1} times.
Resonance Liberation Emerald Storm: Finale will consume all "Momentum", and each stack consumed increases the DMG multiplier of Resonance Liberation Emerald Storm: Finale by {2}%.
```

Terjemahan:

```
Setiap kali Heavy Attack, Intro Skill Tactical Strike, atau Resonance Skill Windqueller digunakan, Jiyan mendapat {0} stack "Momentum", bertumpuk hingga {1} kali.
Resonance Liberation Emerald Storm: Finale akan mengonsumsi seluruh "Momentum", dan setiap stack yang dikonsumsi meningkatkan pengali DMG Resonance Liberation Emerald Storm: Finale sebesar {2}%.
```
