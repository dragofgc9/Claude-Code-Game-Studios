# Groove Puzzles: design system

One set of components and two **skins**. A skin only sets tokens (CSS custom properties)
and a canvas palette, plus its own background "world". Components never hard-code a
colour, font or radius, so a new skin is a token block plus a `SKINS` entry and needs no
component changes.

| Skin | Who it's for | Look |
|---|---|---|
| **Daylight** (`aero`, default) | kids 9–12 | Frutiger Aero: sky, hills, white glass, split-gloss pills, jelly notes, bubbles. See `ART-DIRECTION.md`. |
| **Ether** (`ether`) | anyone who wants it eccentric | Aero × dreamcore × occult, from the UI reference board: teal-navy liquid glass, iridescent chrome rims, chrome blackletter and serif type, pixel numerals, Y2K window chrome, an underground fantasy world. |

The skin is switched on the title screen ("Daylight / Ether") or in the top bar, and saved
per device. `applySkin(id)` sets `body[data-skin]`, swaps lane colours, clears cached note
sprites and redraws.

## Tokens (CSS, on `:root`, overridden in `body[data-skin="ether"]`)
| Group | Tokens | Daylight | Ether |
|---|---|---|---|
| Type | `--font-body` `--font-display` `--font-logo` `--font-label` `--font-num` | Nunito everywhere | Clean white sans in-game (as on the board's game screen) · Cinzel for chapter and dialog titles · UnifrakturMaguntia logo |
| World text | `--world-text` `--world-ts` | white, blue drop shadow | white, violet glow |
| Surface text | `--text` `--text-dim` `--accent` `--focus` | ink #0b3556, aqua-deep accent | #f2f0ff, cyan #6ff3ff accent |
| Status | `--good-text` `--bad-text` `--star` `--star-empty` | green / berry / sun | neon green / pink / gold glow |
| Glass panel | `--panel-bg` `--panel-rim` `--panel-shadow` `--radius-panel` | white glass, white rim, 20px | deep teal glass, cyan-white to violet rim, 18px |
| Buttons | `--btn-*` (base) `--sel-*` (selected) `--go-*` (Play, Finish) `--busy-*` (playing) | split-gloss pills | liquid glass, 14px corners, cyan-white rims; Play/Stop stay green (Stop pulses) |
| Orbs | `--orb-bg` `--orb-done-bg` `--orb-off-bg` `--check-off-*` | aqua / lime spheres | iridescent conic orb / neon-green orb |
| Boxes | `--tip-*` `--ok-*` `--warn-*` `--bad-*` `--opt-*` `--under` | pale tints | translucent tints over a solid `--under` layer, so the rim never shows through |
| Chrome | `--lane-head-bg` `--icon-ink` `--dock-*` `--scrim` `--dialog-*` `--toast-*` `--title-fill` `--title-filter` | light | dark glass; chrome title fill |

**Rim technique:** every glass surface is `background: <fill> padding-box, <rim> border-box;
border: 1px solid transparent`. That gives gradient borders with rounded corners in both skins.

## Ether: the board's centre game screen
Ether reproduces the game mockup at the centre of the UI reference board, drawn in code:
- **The level** sits in one glass slab with a thick translucent rim and glass bubbles on its corners
  (desktop and tablet; phones go edge to edge).
- **Header:** a glass back button, the level name in a glass capsule, and "Genre Brief" in a dark glass pill.
- **Chips and panels:** dark glass chips; the brief panel leads with a chrome four-point sparkle.
- **Grid:** deep teal board with cyan lines, white beat numbers, no "&" marks, and one glowing cyan bar
  line; a thick glossy glass frame with bubbles.
- **Lane heads:** a coloured dot, the name, a gold lock, and round M and S glass buttons.
- **Notes:** narrow candy capsules centred in each step, with a small dot (long bass and lead notes
  stay long).
- **Dock:** a green Stop capsule (it pulses while playing), round glass Undo, Redo and tool buttons,
  and a Goals pill.
- **Surroundings:** purple clouds, green aurora, a glowing planet behind the header, green leafy vines,
  pink lilies, glass bubbles and blue butterflies.

## Canvas (`SKINS` table in the script)
`lanes` (eight lane colours), `particle` (`bubble` or `spark`), `noteGlow`, `board.noteShape` (`capsule` in Ether), and `board`
(background, lane tints, grid lines, bar glow, ruler font and colours, playhead, ink,
hatching, overlays). Notes are pre-painted "jelly" sprites (gradient, top shine, rim; Ether
adds a lane-coloured neon glow) and cached per colour, size and loudness.

## Components
Buttons (base, selected, go, busy) · glass panel · chip (plus warn and bad) · badge · title
capsule (Ether) · lesson strip · goal checklist (check orb, Done/Not yet text, Bonus tag) ·
star row (★/☆) · groove meter (glass track, gradient fill) · tip box · level card (orb,
title, "Learn:", stars) · chapter header · lane head (instrument icon, M/S) · bottom dock
(phones) · dialog (Ether: `groove.exe` title bar with `_ □ ×`) · toast (Ether:
`message.exe`, `success.exe` or `error.exe` window) · glass slider with an orb handle.

## Ether world (decor, drawn in code, `aria-hidden`)
Aurora (cyan, violet, green, purple) · chrome four-point sparkles · iridescent glass orbs ·
an arcane circle (a geometric star, no occult symbols) · lightning flicker · a spinning CD ·
a wireframe globe · a chrome chain with an iridescent drop · gothic spires that fade into a
checkerboard floor · blue morpho butterflies · pink lilies.
Decorations stay in the outer edge bands (x < 15% or x > 82%) so they never cross text.
Reduced motion stops every animation and hides the moving pieces.

**Not taken from the board:** photos of real people, band logos ("DG", "SMG"), the Windows
logo, dollar signs and religious or occult symbols. The board's motifs are redrawn as
original shapes.

## Rules
1. Components read tokens only. A new colour means a new token, not a literal.
2. Text sits on glass, never directly on busy decor. Contrast is at least 4.5:1 on panels.
3. State is never colour alone: ✓ and "done", ★/☆, note height for loudness, hatching for mute.
4. Tap targets are at least 44px tall on phones; the dock buttons are 52px.
5. Motion is transform and opacity only; blur sits only on the dock and dialogs; note
   sprites are cached. The boss level holds 60 fps.
