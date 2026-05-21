# `<seed-context>` + Pattern-Grid Showcase — Design

**Date:** 2026-05-21
**Status:** Approved, ready for implementation plan
**Author:** Brainstormed with Claude

---

## Summary

Two changes that ship together:

1. **`<seed-context>`** — a sibling vanilla web component that wraps any `<pattern-grid>` (or future component that emits the same render event) and assigns per-cell pseudo-random CSS custom properties. Enables every css-doodle-style demo that needs randomness without a DSL.
2. **`docs/showcase.html`** — a new gallery page on the docs site with 14 polished demos covering the visual categories that `css-doodle.com` showcases. The existing `demos.html` remains the pedagogical tour; `showcase.html` is the "look what's possible" highlight reel.

Both ship in the same repo to keep iteration speed high. `seed-context` is a separate ES module entry but lives alongside `pattern-grid` in `src/`.

---

## Background

The `<pattern-grid>` spec calls out `<seed-context>` as a *planned companion* because CSS `random()` is Safari-only as of May 2026. Without it, demos that depend on randomness (random colors, random shapes, random positions — the bulk of `css-doodle.com`'s visual interest) can't be expressed in author CSS alone.

The `<pattern-grid>` docs site currently shows 10 pedagogical demos that explain the API. They are useful but not visually impressive. To compete with `css-doodle.com`'s gallery, we need a separate gallery page with showpieces.

---

## Part 1: `<seed-context>`

### Mission

Wrap any subtree containing one or more `<pattern-grid>` elements (or any future component that emits `pattern-grid:render`) and assign per-cell pseudo-random CSS custom properties so author CSS can produce varied output. Removable when CSS `random()` lands in all engines.

### Non-goals

- Not a general-purpose PRNG library exposed to JS.
- Not a context provider for arbitrary state — only seeded randomness.
- Not a DSL. No expression parsing, no value generators beyond `--rand-N` / `--randi-N`.
- No animation orchestration.

### API

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `seed` | string \| number | `""` | Seed value. Same seed → same randoms across reloads. Hashed to a 32-bit integer for the PRNG. |
| `count` | integer | `8` | How many `--rand-N` slots per cell. Range 1–32. Values outside the range are clamped. |

Attributes reflect to camelCase JS properties.

#### Properties

```ts
class SeedContext extends HTMLElement {
  seed: string;
  count: number;

  readonly seedHash: number;     // 32-bit hash of `seed`
  readonly prng: () => number;   // factory: returns a fresh seeded mulberry32
  reseed(): void;                // re-write randoms on all known cells without changing seed
}
```

#### Events

| Event | Detail | When |
|---|---|---|
| `seed-context:populated` | `{ target: HTMLElement, count: number }` | After randoms are written to a grid's cells. `target` is the pattern-grid that emitted the render. Bubbles. |

### Custom properties written per cell

For `count = N`:
- `--rand-0`, `--rand-1`, … `--rand-{N-1}` — floats in `[0, 1)`
- `--randi-0`, `--randi-1`, … `--randi-{N-1}` — integers in `[0, 99]`

Both forms are written so authors can pick whichever is ergonomic. Float for continuous values (`calc(var(--rand-0) * 360deg)`); integer for stepped ones (`calc(var(--randi-0) * 1%)`).

### Behavior

1. On `connectedCallback`:
   - Compute `seedHash` from `seed` (via a small string-hashing function).
   - Install a `pattern-grid:render` listener on `this` (capture phase off; default bubble path works because the event bubbles).
   - Walk current descendants for any `<pattern-grid>` whose cells are already rendered (the seed-context connected late). For each, populate cells immediately as if a render had fired.

2. On `pattern-grid:render` event from any descendant:
   - For each cell in `e.target.cellElements`, derive a per-cell seed from `(seedHash, cellTagSum, cellIndex)` and run mulberry32 to produce `count` floats. Write them as inline styles in one `cssText` assignment per cell.
   - Dispatch `seed-context:populated` with `{ target: e.target, count }`.

3. On `attributeChangedCallback` for `seed` or `count`:
   - Recompute `seedHash`.
   - Call `reseed()` — walk known pattern-grid descendants and re-populate their cells with the new values.

4. `reseed()` is also available as a public method for authors who want to force a re-roll without touching attributes.

### Algorithms

**String hash** — `cyrb53`-style, ~10 lines:

```js
const hashSeed = (s) => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return (h2 >>> 0) ^ (h1 >>> 0);
};
```

**PRNG** — mulberry32, ~5 lines:

```js
const mulberry32 = (a) => () => {
  let t = (a += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
```

Per-cell seed: `seedHash ^ (cellIndex * 0x9E3779B1) ^ (gridOffset * 0x85EBCA6B)`, where `gridOffset` is a counter incremented for each pattern-grid the seed-context has populated. This guarantees that two pattern-grids inside the same seed-context get different sequences even at matching cell indices.

Each cell gets its own generator, so adding/removing cells doesn't shift the random sequence of unrelated cells. The `--randi-N` integer is derived from the same draw as `--rand-N` via `Math.floor(rand * 100)` — not an independent roll.

### Size budget

≤ 90 lines of executable JS in `src/seed-context.js` (≤110 with JSDoc). Slightly more headroom than pattern-grid's 80-line budget because seed-context carries the hash + PRNG helpers, the head-style injection, and the multi-grid bookkeeping. Still small enough that deletion remains easy when CSS `random()` is Baseline.

### Anti-FOUC (built-in, no opt-in)

`<seed-context>` injects a `<style>` element into `<head>` exactly once per page (module-level side effect, gated by an `id` check so HMR / multiple imports don't duplicate it). The injected rule:

```css
seed-context > pattern-grid > *:not(template) {
  opacity: 0;
  transition: opacity 220ms ease-out;
}
```

When seed-context populates a cell, its inline `cssText` includes `opacity: 1` alongside the `--rand-N` / `--randi-N` properties. Inline beats stylesheet so populated cells become visible. The result: cells inside a `<seed-context>` only appear once they have their randoms, fading in together. No author opt-in needed.

This also handles the `:not(:defined)` upgrade window — the CSS rule selects on tag name, which matches before the element upgrades, so cells stay hidden until the JS has executed and populated them.

`dist/seed-context.css` still ships as an empty / additional-defaults file for parity with `pattern-grid.css`, but is not required for FOUC suppression.

### Tests (Playwright)

Core behavior:
- Default `count="8"` writes `--rand-0..7` floats *and* `--randi-0..7` ints on each cell after a pattern-grid:render fires (16 properties per cell).
- `--rand-N` is in `[0, 1)`; `--randi-N` is in `[0, 99]`.
- `--randi-N` equals `floor(rand-N * 100)` (the two are derived from the same draw, not independent rolls).
- Same `seed` produces identical values across reloads.
- Different `seed` produces different values for at least one cell.
- Empty `seed` (`seed=""`) still produces randoms (hashes to a constant; tests check at least one cell has any randoms set).
- Changing `seed` attribute triggers reseed (a sampled cell's `--rand-0` changes).
- Changing `count` attribute rewrites with the new slot count (verify `--rand-{new-1}` is set and `--rand-{old-1}` may be cleared if new < old).
- `count="0"` clamps to 1; `count="50"` clamps to 32.
- `reseed()` method re-writes values without changing attributes (sampled cell value changes if the internal `prng` was advanced; otherwise identical — clarify in implementation).
- Setting `seed` via JS property (`el.seed = "x"`) reflects to the attribute and triggers reseed.

Lifecycle / late attachment:
- Late connection: seed-context appended *after* the pattern-grid already rendered still populates cells (walks descendants on connect).
- Adding a new `<pattern-grid>` inside an existing seed-context: the new grid's cells get populated on first render (event bubbles up; listener catches it).
- Removing a `<pattern-grid>` and re-adding it: still populates (listener is on seed-context, not on the grid).
- Disconnecting seed-context: removes the listener, no further population.

Demo-realistic / "fancy" coverage:
- A grid with 1000 cells (`cells="50x20"`) populates in under 50 ms (perf budget; uses `performance.now()`).
- Two `<pattern-grid>` elements inside one seed-context get independent per-cell randoms — different cells in different grids have different values (cells indexed 0 in grid A and cell index 0 in grid B should not collide because the per-cell seed mixes a per-grid offset).
- Nested seed-contexts: an outer `<seed-context seed="a">` wrapping an inner `<seed-context seed="b">` wrapping a pattern-grid — the *innermost* seed-context wins because `pattern-grid:render` bubbles to it first and `stopPropagation()` is called by the populated handler (or we accept double-population and the inner wins by virtue of being deeper / running second — clarify in implementation).
- `seed-context:populated` event fires with `{ target: <the pattern-grid>, count: N }`; bubbles.

Anti-FOUC:
- Before populated: a sampled cell has computed `opacity: 0`.
- After populated: same cell has computed `opacity: 1`.
- Cells outside any seed-context are unaffected (computed `opacity: 1` baseline).

Total: ~22 test cases.

---

## Part 2: Showcase gallery (`docs/showcase.html`)

### Structure

Standard site chrome (header with nav, footer). Above the gallery: an `<h1>Showcase</h1>` and a single-paragraph intro. The gallery itself is a CSS Grid:

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
```

Each piece is a `<figure>` containing:

1. A `.tile` `<div>` with `aspect-ratio: 1` holding the live `<pattern-grid>` (and `<seed-context>` wrapper where needed).
2. `<figcaption>` with the piece's name and a 6–10 word description.
3. `<details><summary>Source</summary>` containing the relevant CSS excerpt for the piece.

Nav gains a new "Showcase" link in every page's header (`index.html`, `demos.html`, `api.html`, `showcase.html`).

### Roster (14 pieces)

Each piece's per-tile CSS lives in `docs/styles.css` under a scoped `#sc-<slug>` selector so styles don't bleed between tiles.

| # | Slug | Name | Category | Needs `<seed-context>`? | Mechanic |
|---|---|---|---|---|---|
| 1 | `hex` | Hex honeycomb | Geometric | no | `clip-path: polygon()` hexagon per cell, HSL hue from `sibling-index()` |
| 2 | `pinwheels` | Conic pinwheels | Gradient | no | `background: conic-gradient(...)` per cell, hue offset by sibling-index |
| 3 | `triangles` | Tessellated triangles | Geometric | no | Two `clip-path: polygon()` shapes; alternating via `:nth-child(odd/even)` |
| 4 | `sine` | Sine bars | Procedural | no | Cell height = `calc(50% + sin(sibling-index() * 30deg) * 50%)` |
| 5 | `fib` | Fibonacci spiral | Procedural | no | `cells="500"`, position via `cos()`/`sin()` of golden angle |
| 6 | `bloom` | Concentric bloom | Geometric | no | Stacked circles, radius from sibling-index, with HSL glow |
| 7 | `wipe` | Diagonal wipe | Animated | no | `animation-delay` = `calc((x + y) * 20ms)` for a sweeping band |
| 8 | `pulse` | Pulse field | Animated | no | Staggered `scale(0.7..1)` keyframes per cell via `sibling-index()` |
| 9 | `mosaic` | Random mosaic | Random | **yes** | `hsl(calc(var(--rand-0) * 360deg) 70% 55%)` per cell |
| 10 | `frost` | Frosted scatter | Random | **yes** | Random opacity + small random rotation |
| 11 | `crystals` | Crystal shapes | Random | **yes** | 4 clip-path shapes indexed by `--randi-0` mod 4 |
| 12 | `staircase` | Random staircase | Random | **yes** | `translateY(calc(var(--rand-0) * 20px))` per cell |
| 13 | `rain` | Unicode rain | Text | **yes** | `<template>` cell with `::before` content from a string indexed by `--randi-0` |
| 14 | `ripple` | Hover ripple | Interactive | no | `:has(:hover)` on grid + sibling combinator delays expanding outward |

### Notes on a few tricky pieces

- **Fibonacci spiral (5):** uses a single grid container with `position: relative`; cells are `position: absolute` with `left`/`top` driven by polar math against `sibling-index()`. Needs ≥ Chrome 137 for `sibling-index()` in `calc()` everywhere. We accept that as the showcase's target audience.
- **Unicode rain (13):** the `<template>` content is a `<span>` whose CSS `content` property is selected from a string of box-drawing characters by `--randi-0`. We use `content: attr()`? No — we use `content: ""` plus a `::before` that uses `counter()` math? Actually simplest: pre-build a string and pick a substring with `text-overflow`/`overflow`. Realistic implementation: a single character per cell rendered via `font-feature-settings` on a static glyph palette, or just `text-content` rotation via CSS `content: counter(--randi-0)` if supported. **This piece may need a small companion script** — to be evaluated during implementation; if it needs > 5 lines of JS, drop it from the showcase and replace with an alternative random demo.
- **Hover ripple (14):** purely CSS, using `:has(> :hover)` to scope, plus N+ general-sibling selectors with cumulative delays. Lots of selectors but no JS.

### File changes

#### New files

- `src/seed-context.js` — the component (≤80 LOC executable + JSDoc).
- `test/seed-context.spec.js` — Playwright tests (9 cases above).
- `docs/showcase.html` — the gallery page.
- `dist/seed-context.css` — optional anti-FOUC stylesheet (8 lines).
- `seed-context.d.ts` — TypeScript declarations.

#### Modified files

- `vite.config.js` — `lib.entry` becomes an object: `{ 'pattern-grid': 'src/pattern-grid.js', 'seed-context': 'src/seed-context.js' }`. Verify `dist/seed-context.js` is produced alongside `dist/pattern-grid.js`.
- `package.json`
  - `exports`: add `"./seed-context"` and `"./seed-context.css"` entries pointing at the new dist files.
  - `files`: dist already covers it.
  - No new devDependencies.
  - `postbuild` script extended: `cp dist/pattern-grid.js docs/ && cp dist/pattern-grid.css docs/ && cp dist/seed-context.js docs/ && cp dist/seed-context.css docs/`.
- `pattern-grid.d.ts` — unchanged, but a new `seed-context.d.ts` is added next to it (separate file mirrors the separate-module export).
- `docs/index.html`, `docs/demos.html`, `docs/api.html` — nav gains a "Showcase" link before "GitHub".
- `docs/styles.css` — add `.gallery` grid styles and per-tile `#sc-<slug>` rules for each of the 14 pieces. Estimated +250 lines.
- `docs/api.html` — append a short "`<seed-context>`" section after the existing pattern-grid API tables (Attributes, Properties, Events, Custom Properties Written). This keeps the suite-component reference in one place; if it grows, we split later.
- `docs/demos.html` — example #8 ("Seeded randomness (planned)") is updated. The grid is wrapped in `<seed-context>` so the example becomes live.
- `README.md` — add a one-paragraph mention of `<seed-context>` in the Suite section.
- `CHANGELOG.md` — bump to `0.2.0 — unreleased` and list seed-context + showcase additions.

#### Removed files

None.

### Build & test impact

- Vite multi-entry build produces two ES modules in `dist/`. Both committed (npm publishing reads from `dist/`).
- Playwright spec count grows from 11 to ~20 (existing 11 + 9 for seed-context).
- Lint, format, build, tests all must remain green.

### Browser support

- `<seed-context>` itself only depends on Custom Elements v1 + CSS Custom Properties — Baseline everywhere.
- Showcase pieces that use `sibling-index()`, `mod()`, `floor()` are Chrome 137+ only without the shim. The showcase page accepts this; the `demos.html` page (which is the API tour) already covers the shim-fallback story. We *could* add `shim="sibling"` to every showcase grid to widen support; we'll decide piece-by-piece during implementation.

---

## Open questions reserved for implementer judgement

These don't block this design. They're noted so the implementer doesn't get stuck.

1. **Unicode rain feasibility.** If the all-CSS approach for piece #13 doesn't pan out within a few attempts, swap in another random-driven piece (e.g. "Random hue rings": each cell a `radial-gradient` whose hue offset comes from `--rand-0`).
2. **`seed-context.css` file vs inline.** Currently planned as a separate optional `dist/seed-context.css`. If it stays at ~8 lines, consider merging into `dist/pattern-grid.css` to reduce file count. Decide based on package ergonomics — leave separate if `pattern-grid` users don't always pull `seed-context`.
3. **Whether to add a `target` attribute to seed-context.** Current design assumes pattern-grid is the only source of `:render` events. If a future component (say `<viewport-grid>`) emits a different event, we'll generalize then.

---

## Acceptance criteria

The design is "done" when:
- `npm test` reports ≥33 passing Playwright tests (11 existing + ~22 seed-context).
- `npm run build` produces both `dist/pattern-grid.js` and `dist/seed-context.js`.
- `docs/showcase.html` renders 14 visible tiles in Chrome 148+ with no console errors.
- At least the 5 seeded pieces (mosaic, frost, crystals, staircase, rain) all show clearly random-per-cell variation when the page is reloaded with the same seed (same output) and with a different seed (different output).
- `wc -l src/seed-context.js` ≤ 110 (≤90 executable to accommodate hash + PRNG + style injection + grid-offset bookkeeping, ≤20 JSDoc).
- `wc -l src/pattern-grid.js` unchanged at 85.

---

## Out of scope (deliberately)

- npm publish of `0.2.0`. We ship to Pages; the user will publish when ready.
- A separate `<seed-context>` repo. Will extract later if seed-context graduates to a multi-consumer companion.
- Polyfills for browsers older than Chrome 137 in the showcase. The pedagogical `demos.html` already shows the shim path; the showcase targets the modern web.
- A separate `seed-context` Pages site. It rides on this site under the existing `<pattern-grid>` umbrella.
