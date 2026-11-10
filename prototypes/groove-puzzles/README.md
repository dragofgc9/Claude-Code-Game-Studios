# Groove Puzzles (prototype)

A DAW-style beat puzzle game. You fix, rebuild and finish drum and bass loops on a
piano-roll grid. It plays like a logic and ear-training puzzle, and you don't need
any music theory.

- **Audience and look (v2):** kids aged 9–12, in a Frutiger Aero "Aero Studio" style: a daylight
  sky, glass panels, glossy buttons, jelly notes and bubbles. Every level teaches one named idea
  ("New idea" strip, "You learned" on the results), and levels are grouped into four chapters.
  See `ART-DIRECTION.md`.
- **Skins:** Daylight (default, kids) and Ether (eccentric: iridescent liquid glass, chrome type, an
  underground fantasy world), both from one token-based design system. See `DESIGN-SYSTEM.md`.
- **Hypothesis:** placing notes on a grid against live, plain-English rules
  (with an honest groove score) is fun and teaches rhythm without theory.
- **Run it:** open `index.html` in a modern browser. It has no build step, no
  dependencies and no network requests. Add `?unlockall` to the URL to open
  every level.
- **On iPhone (home-screen app):** serve this folder over https (GitHub Pages works), open
  it in Safari, then tap **Share → Add to Home Screen**. It runs full-screen with its own
  icon and works offline (`sw.js` caches it; `manifest.webmanifest` + `icons/`). Phone-first
  layout: a bottom thumb dock (Play, Undo, Redo, Tool, Goals/Finish), tall tap rows, and a
  bigger grid in landscape. iOS details: plays with the silent switch on, recovers after
  calls or app switches, keeps the screen awake while a loop plays.
- **Design:** `DESIGN.md` covers the data model, scheduler, formulas and all 18 levels.
- **Test:** `node tests/e2e.cjs` (Playwright + Chromium) runs 69 checks. They cover
  the solvability of all 18 levels, real mouse, keyboard and touch input, the
  playback clock, the fail, permission and budget paths, the sandbox, phone width,
  blocked localStorage, frame rate, the iPhone dock and landscape layout, and an offline reload through the service worker.
- **Evidence:** `evidence/` holds retained screenshots. `v2-*` shows the Aero redesign.
- **Status:** in progress (v1 playable).
- **Findings:** not playtested with people yet.
