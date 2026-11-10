# Groove Puzzles: design doc (v1)

A browser puzzle game that looks like a DAW piano roll and plays like a logic and
ear-training puzzle. The player is a producer who fixes, rebuilds and finishes beats.
It ships as one file, `index.html`, with vanilla JS, Canvas 2D for the grid, DOM for
the panels and the Web Audio API for sound. It has no dependencies and no audio files.

## 1. Data model

### Lanes (engine table `LANES`)
| id | name | kind | sound |
|---|---|---|---|
| kick | Kick | drum | sine sweep 160→40 Hz + click |
| snare | Snare | drum | high-passed noise + triangle tone |
| clap | Clap | drum | band-passed noise, 3 quick bursts |
| hat | Hat (closed) | drum | high-passed noise, 50 ms (chokes the open hat) |
| ohat | Open hat | drum | high-passed noise, 400 ms |
| perc | Perc | drum | short pitched sine "tick" |
| bass | Bass | pitched, 6 rows | sine + triangle through a low-pass |
| lead | Lead | pitched, 6 rows | 2 detuned saws through a low-pass |

Pitched lanes are **scale-locked**: their rows are C minor pentatonic
(C, E♭, F, G, B♭, C), so nothing can sound "wrong". Row 0 is the home note (C, ⌂).

### Note
`{ lane, step, pitch, len, vel }`
- `step` 0-based column. `pitch` is a row index (always 0 for drums).
- `len` in steps (drums are always 1; pitched notes can be resized).
- `vel` is 1 = soft, 2 = medium (default), 3 = loud. It is drawn as note height and brightness.
- Identity key: `lane:step:pitch`. Pitched lanes are monophonic (one note per step).

### Pattern in level data
Each lane maps to a list of entries. An entry is a bare step number or `{s, p, l, v}`.
`{ kick:[0,8], bass:[{s:0,p:0,l:4}] }`

### Level (plain data object, `LEVELS` array)
`id, title, kind, bpm, swing, steps, stepsPerBeat, lanes, locked, intro, initial,
target (ghost only), solution, rules, budget, star3, tools, hint, unlocks, backbeat?, metronome?`
- `kind` is one of `ghost | fix | fill | brief | remove`. The engine's `KINDS` table holds
  each kind's permissions (can add? can remove the starting notes?), so a level never
  needs engine code.
- `budget`: `moves` (a net edit cap, so undo refunds a move), `adds` (fill), `hints`, `listens`.
- `star3`: any of `maxMoves` (total edits), `maxHints`, `maxChecks`, `minGroove`.
- `tools`: subset of `draw | move | resize | velocity`.
- `unlocks`: `lane:x`, `tool:x`, `sandbox`, `swing`. Unlocks also gate the sandbox.

### Rule (data)
`{ type, ...params, optional?, label?, why? }`. Each type in the `RULES` registry has
`text(rule, level)` (plain English), `why` (a one-line explanation) and
`check(ctx, rule) → {pass, detail}`.

| type | params | passes when |
|---|---|---|
| noteAt | lane, steps, pitch? | an onset on every listed step |
| backbeat | lane, steps | same as noteAt, worded as the backbeat |
| silentSteps | lane, steps | nothing sounding (including held notes) on those steps |
| noteCount | lane, min, max | onset count in range |
| noOverlap | a, b | no step where both lanes start a note |
| noAdjacent | lane | no two onsets on neighbouring steps (no "flams") |
| density | max, min?, lanes? | notes / (steps × lanes) within range |
| syncopation | lane, min | ≥ min onsets that are not on a beat |
| kickBassLock | tolerance | every bass onset is within `tolerance` steps of a kick |
| maxFillLength | lane, n | longest run of consecutive onsets ≤ n |
| minRun | lane, n | some run of consecutive onsets ≥ n (rolls) |
| cover | lanes, steps | every step has an onset in at least one of the lanes |
| added | min, max | notes not in the starting loop, within range |
| matchTarget | lanes?, velocity? | exactly the target's notes in those lanes |
| noteLength | lane, step, min, max? | the note starting on `step` lasts min..max steps |
| distinctPitches | lane, min | ≥ min different rows used |
| accent | lane, steps | loud (vel 3) onsets on those steps |
| ghostNotes | lane, min | ≥ min soft (vel 1) notes |
| velVariety | lane, min | ≥ min distinct velocities |
| rangeCount | lanes, from, to, min, max | onsets in the step range, within count range |
| accentIn | lanes, from, to | at least one loud onset in the range |

## 2. Scheduler
The classic "two clocks" design:
- `setTimeout` runs every **25 ms**. Each tick schedules every step whose time falls
  before `audioContext.currentTime + 0.1 s`, using sample-accurate `start(t)` calls.
- Step length is `60 / bpm / stepsPerBeat`. **Swing** delays odd steps by `swing × stepDur`.
- Each scheduled step also goes into a **visual queue** `{step, time}`. The
  `requestAnimationFrame` loop pops entries once `currentTime ≥ time` and moves the
  playhead, glows the notes and fires particles. Visuals follow the audio clock, so
  timing does not depend on frame rate.
- When the tab wakes and `nextTime` has fallen behind, the scheduler resyncs instead
  of bursting.
- The source is either the player's pattern or the ghost target. "Hear target" plays
  2 loops of the target, then switches back to the player's pattern with no gap.
- Audio starts only after a gesture. Without Web Audio, the clock falls back to
  `performance.now()`, so the game stays playable with no sound.
- Master chain: gain → compressor (−16 dB, 4:1) → limiter (−1.5 dB, 20:1) → out.

## 3. Formulas

### Stars (1–3)
- ★ all required rules pass.
- ★★ every optional (bonus) rule also passes.
- ★★★ the level's `star3` targets are also met (edits ≤ par, hints ≤ max,
  checks ≤ max, groove ≥ min).

### Groove quality (0–100)
Five sub-scores of 0–20 each. A sub-score that cannot apply (for example backbeat
with no snare or clap lane) is left out, and the total is rescaled:
`total = round(100 × Σscore / (20 × applicable))`.
1. **Timing & placement.** "Heavy" hits are kick, snare, clap and bass. `off` = heavy
   hits not on the 8th-note grid. `20 − 5 × max(0, off − bars)`, so one off-grid
   heavy hit per bar is free.
2. **Variety.** `10 × lanesUsed/lanesAvailable + 10 × min(1, (distinctBeatShapes − 1)/(min(beats,4) − 1))`.
   A beat shape is the set of (lane, sub-step) hits within one beat.
3. **Use of space.** `d = notes / (steps × lanes)`. 20 inside [12%, 40%]; below that
   `20·d/0.12`; above it `20·(0.75 − d)/0.35` (floored at 0).
4. **Backbeat strength.** Snare or clap hits on the level's backbeat steps (default
   beats 2 and 4 of every bar; trap overrides this to beat 3). `20 × hit/targets`.
5. **Clutter.** `20 − 5 × flams(kick/snare/clap) − 3 × pile-ups(≥4 sounds on one step)`.

Every sub-score carries a "why" line. The single **tip** comes from the lowest
sub-score under 90% and names a lane and step, for example
*"Your hats never rest; try dropping beat 3 (step 9)."*

### Ghost levels
The matchTarget rule flips green live only when the beat matches exactly. The
Mastermind-style counts ("3 of 4 right, 1 extra") update only when the player
presses **Check**, so toggling cells one at a time cannot brute-force the answer.
Checks and hints are counted against ★★★.

### Solvability (verified at load)
`verifyLevels()` runs on boot and `console.assert`s, for every level:
the solution passes every required **and** optional rule; the starting loop does
**not** already pass; the solution's groove meets `star3.minGroove`; the minimum
edits from start to solution (`minMoves`, which counts a move as one edit) fit the
move budget and the par; fill levels only add and stay within `budget.adds`;
remove levels only remove; locked lanes are unchanged; every note is in bounds; every
lane and tool a level uses was unlocked by an earlier level. Failures appear in the
console and as a ⚠ badge on the level card.

## 4. Level list (18)
Steps are 0-based in data and shown 1-based to the player. In 16-step levels the
beats are steps 0, 4, 8 and 12.

| # | Title | Kind | Grid | Required rules | Solution |
|---|---|---|---|---|---|
| 1 | First Kick | brief | 8 steps, kick | kick on beat 1; 1–2 kicks. Bonus: kick on beat 3. ★★★ ≤2 edits | kick 0,4 |
| 2 | The Backbeat | brief | 8, kick (locked) + snare | snare backbeat on 2 and 4. Bonus: exactly 2 snares. ★★★ ≤2 edits | snare 2,6 |
| 3 | Echo | ghost | 8, kick | match 4-note target. ★★★ no hints | kick 0,3,4,6 |
| 4 | Four on the Floor | brief | 16, kick/snare/hat | kick every beat; backbeat; hats on the "and"s. Bonus: exactly 2 snares, exactly 4 hats. ★★★ groove ≥70 | kick 0,4,8,12 · snare 4,12 · hat 2,6,10,14 |
| 5 | Clumsy Drummer | fix (7 moves) | 16, kick/snare/hat | backbeat; no snare flams; no kick flams; hats ≤4 in a row. Bonus: no hats on 2 and 4. ★★★ ≤5 edits | remove kick 7, move snare 5→12, remove hats 4,9,12 |
| 6 | Hole in the Hats | fill (3 adds), swing | 16, +open hat | kick on 1 and 3; exactly 3 kicks; hat or open hat on every 8th; 1–2 open hats; hat and open hat never together; add exactly 3. Bonus: a syncopated kick. ★★★ ≤3 edits | + kick 8, kick 10, open hat 14 |
| 7 | Boom-Bap Ghost | ghost, swing | 16, kick/snare/hat | match kick+snare target. ★★★ no hints, ≤4 checks | kick 0,6,10 · snare 4,12 |
| 8 | Hat Avalanche | remove | 16, 5 lanes, 36 notes | ≤30% full; backbeat; exactly 2 snares; kick/snare apart; hat/open hat apart; hats ≤3 in a row. Bonus: ≤4 kicks, ≤22% full. ★★★ groove ≥75 | 15 notes, see data |
| 9 | Meet the Bass | brief | 16, + bass (drums locked) | bass home note on beat 1; every bass note with a kick; 3–6 bass notes. Bonus: 2+ pitches. ★★★ groove ≥70 | bass C@0, C@6, E♭@10 |
| 10 | Kick vs Bass | fix (5 moves) | 16, bass | every bass note with a kick; no bass flams; 3–4 bass notes. Bonus: home note on 1. ★★★ ≤3 edits | move 1→0, 7→6, remove 11 |
| 11 | Hold That Note | brief | 16, bass + resize | home note on 1; hold it ≥4 steps; kick lock; bass silent under the snares. Bonus: 2+ pitches, exactly 3 notes. ★★★ groove ≥70 | C@0 len4, G@8 len2, F@11 |
| 12 | Two-Bar Bassline | ghost | 32 steps (2 bars) | match the bass target, pitch included. ★★★ no hints, ≤5 checks | 6 bass notes on the kicks |
| 13 | Boom-Bap Brief | brief, 90 BPM, swing | 16, kick/snare/hat + velocity | kick on 1 and the "and" of 2; backbeat; 2–6 hats; no kick flams. Bonus: loud snares; 2+ syncopated kicks. ★★★ groove ≥75 | kick 0,6,10 · snare 4,12 (loud) · hat 0,4,8,12 |
| 14 | House Brief | brief, 124 | kick/clap/hat/open hat/bass | four on the floor; clap backbeat; open hat on every "and"; hat/open hat apart; bass dodges the kick; 3–8 bass. Bonus: 2+ soft hats; 2+ bass pitches. ★★★ ≥75 | see data |
| 15 | Trap Brief | brief, 140 | kick/snare/hat/perc/bass | snare on beat 3; 1–2 snares; hat roll ≥4; 6–16 hats; 2+ syncopated kicks; kick lock. Bonus: hat velocity variety; 1–4 perc. ★★★ ≥80 | see data |
| 16 | DnB Two-Step | brief, 172 | kick/snare/hat | kick on 1 and the "and" of 3; backbeat; hats on every 8th; 2–3 kicks. Bonus: a ghost snare. ★★★ ≥80 | kick 0,10 · snare 4,12, soft 7 · 8th hats |
| 17 | Lo-fi Fill | fill (4 adds), 78, swing | 32 steps | 3–4 hits in the last beat; add at most 4. Bonus: a loud hit in the last two steps; 2+ snares in the fill. ★★★ ≥75 | snare 28(soft), perc 29, snare 30, perc 31(loud) |
| 18 | Boss: The Remix | fix (10 moves) | 32 steps, 6 lanes incl. lead | 4-snare backbeat; no kick flams; kick lock; hats ≤4 in a row; hat/open hat apart; lead home note on bar 2 beat 1; ≤22% full. Bonus: 3+ bass pitches; 2–4 lead notes. ★★★ ≤8 edits | remove kick 1,27; add snare 28; remove hats 14,20,30; move bass 17→16; add lead C@16 |

Unlock path: snare (1), hat (3), Move tool (4), sandbox + open hat + swing (5),
perc (6), bass (8), Resize tool (10), Velocity tool + clap (12), lead (17).

## 5. Kinds → permissions
| kind | add | remove starting notes | extra |
|---|---|---|---|
| ghost | yes | yes | Hear target (2 loops per listen), Check, Reveal-a-note hints |
| fix | yes | yes | net move budget, with an "out of moves" fail state |
| fill | yes | **no** (starting notes are pinned) | add budget |
| brief | yes | yes | — |
| remove | **no** | yes | — |
