# Groove Puzzles: art direction (v2, "Aero Studio")

**Audience:** kids aged 9–12, confident readers, on a phone first.
**Job:** teach how a beat is built (kick, backbeat, hats, space, bass, groove)
through small puzzles. Every level introduces one named idea.

## Look: Frutiger Aero
The glossy optimism of 2005–2012 tech: blue skies, green hills, glass, bubbles,
water-drop gloss. It reads as clean, bright and "pro but friendly", which suits
a kid who wants to make real beats rather than play a toy.

- **Sky, not a stage.** The page is a daylight sky (deep blue at the top,
  fading to near-white), with rolling green hills at the bottom, a soft sun
  glow and slow-rising bubbles. Everything readable sits on frosted glass above it.
- **Glass panels.** Cards are frosted white glass: a translucent gradient,
  backdrop blur, a bright 1px rim and a white inner highlight along the top edge.
- **Gloss buttons.** Pill buttons with the classic split gloss: a light top
  half, a hard midline, a deeper bottom half, plus an inner top highlight.
  Aqua for main actions, lime green for Play and Finish, and white glass for
  secondary actions.
- **Jelly notes.** Notes on the grid are glossy jelly pads: a vertical gradient
  of the lane colour, a white shine across the top half, a darker rim and a soft
  shadow. When the playhead hits them they pop, glow white and release bubbles.
- **Bubbles are the particle.** Bubbles rise from played notes, from a solved
  goal, and in the sky. The reduced-motion setting removes all of them.

## Palette
| token | use | value |
|---|---|---|
| sky-top / sky-mid / sky-low | background gradient | #1688dc / #6cc9f7 / #e8f8ff |
| grass / grass-deep | hills, Play, Finish, "done" | #63cf2e / #2f9a18 |
| aqua / aqua-deep | main buttons, playhead, focus | #19b3ef / #0077c2 |
| ink / ink-soft | text | #0b3556 / #4a7090 |
| glass | panels | white at 55–85% |
| sun | stars | #ffbe0b |
| berry | errors, "not yet" | #e5345e |

Lane colours are tuned for a light background, and every one sits on a darker rim:
kick #ff4f6e · snare #ff9a1f · clap #f5c400 · hat #14c2d6 · open hat #3b82f6 ·
perc #9b5cff · bass #3fbf3a · lead #ff5cc8.

## Type
**Nunito** (rounded humanist sans, weights 600–900) for everything, with
`font-variant-numeric: tabular-nums` wherever numbers sit in columns. The system
sans is the fallback, so the game still reads well offline.
Scale: 13 / 15 / 17 / 22 / 30 / clamp(44–84) for the logo.

## Icons
Each lane has a small drawn instrument icon (inline SVG, ink lines with a lane
colour fill): kick drum front, snare drum, clapping hands, closed hi-hat, open
hi-hat, cowbell, bass guitar and keyboard. Icons sit next to the lane name and
never replace it.

## Voice (ages 9–12)
Short sentences, second person, upbeat but not babyish. Use real producer words
and explain each one the first time in plain words ("the backbeat: the snap on
beats 2 and 4"). Praise the effort and say what was learned ("You learned
swing!"). Never talk down. No sarcasm.

## Learning structure
- **Chapters** group levels by skill: First Beats → Fix It Up → Bass Camp →
  Genre Tour.
- **A new idea per level.** Each level carries `lesson: {name, idea}`. It shows
  as a "New idea" strip in the level, on the level card ("Learn: …"), and as
  "You learned …" on the results screen.

## Accessibility
State is never shown by colour alone: ✓ and "done" text, stars as ★/☆, note
height for loudness, hatching for muted lanes. Text on glass stays at 4.5:1 or
better (ink on 70% white glass). Tap targets are at least 44px tall on phones.
Reduced motion removes bubbles, pulses and the pop animation.
