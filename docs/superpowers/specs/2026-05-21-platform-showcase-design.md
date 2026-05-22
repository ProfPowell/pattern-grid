# Platform Showcase + `<paint-worklet>` Companion — Design

**Date:** 2026-05-21
**Status:** Drafted for user review
**Author:** Claude (brainstorming)

## Context

`<pattern-grid>` ships a ~75 LOC light-DOM web component that stamps an N×M grid of styleable cells. A companion `<seed-context>` provides seeded `--rand-N` / `--randi-N` custom properties per cell. The current `docs/showcase.html` contains 33 demo pieces spanning geometric, procedural, seeded-random, demoscene, op-art, SVG-filter, JS-driven, 3D, and fractal categories.

The user observed that the current showcase, while broad, *does not yet exceed* what [css-doodle](https://css-doodle.com/) demonstrates with its DSL. css-doodle's strongest features — `@shape()`, `@shaders()`, `@plot()`, `@svg()`, recursive `@doodle()`, hover transitions — all have direct equivalents using modern web-platform primitives that `<pattern-grid>`'s light-DOM design exposes. css-doodle's Shadow-DOM, DSL-driven architecture cannot reach those primitives.

This spec adds:

1. A second small companion element — `<paint-worklet>` — that registers a Houdini Paint Worklet declaratively, matching the deletable, optional pattern of `<seed-context>`.
2. Ten new showcase pieces (numbered 34–43) under a new "Modern platform showcase" section, each demonstrating a platform feature that css-doodle's sandbox cannot reach or that answers a css-doodle directive with a platform primitive.

## Non-Goals

- No changes to `src/pattern-grid.js`. The 80-line spec limit stands.
- No changes to `spec.md`'s Design Decisions section.
- No new attributes on `<pattern-grid>`.
- No `toPNG()` / export method.
- No `cell-shape`, `state`, or `data` attributes — those are the css-doodle DSL trap.
- No `@supports` gates or per-feature warning captions in the new demos. Browser strategy is "use latest features, no fallbacks; non-Chromium degrades visibly but remains functional."
- No inline-`textContent` form on `<paint-worklet>`; `src=URL` only, mirroring `<script>` semantics.

## Story

The narrative is binary and unambiguous:

- **css-doodle** is decorative pixels behind a Shadow DOM wall. It invented a DSL because CSS in 2018 could not count, randomize, or compose. Its 150 KB of code sit between the author and the platform.
- **`<pattern-grid>`** is structural HTML. It generates real DOM children in the light tree, leaves all visual concerns to author CSS, and — *because cells are real children* — inherits the entire modern platform: View Transitions, Anchor Positioning, Popover, scroll-driven animations, `:has()`, container queries, `color-mix()`, Web Audio on `<button>` cells, Houdini Paint Worklet, `<canvas>` / `<svg>` / `<video>` / MathML cell templates, real ARIA semantics, real keyboard focus.

The new showcase section makes that contrast concrete.

## `<paint-worklet>` companion

### Purpose

Houdini's Paint Worklet API (`CSS.paintWorklet.addModule(url)`) is the direct platform answer to css-doodle's `@shaders()`. Authors register a worklet once per page, then use `background: paint(name)` anywhere. `<paint-worklet>` makes that registration declarative.

### API

```html
<paint-worklet src="/worklets/swirl.js"></paint-worklet>
```

```css
.cell { background: paint(swirl); }
```

### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `src` | URL string | — | Path to a worklet module. Required. No-op if absent. |

No other attributes. No reactivity on `src` change after connect (worklet modules cannot be un-registered).

### Properties

```ts
class PaintWorklet extends HTMLElement {
  // No public properties beyond the inherited element interface.
}
```

### Events

| Event | Detail | When |
|---|---|---|
| `paint-worklet:registered` | `{ src }` | `addModule()` resolves successfully, *or* `src` was already registered by an earlier instance. Bubbles. |
| `paint-worklet:error` | `{ src, error }` | `addModule()` rejects, or `CSS.paintWorklet` is unavailable, or `src` was set but missing. Bubbles. |

### Behavior

1. On `connectedCallback`, read `src`.
2. If `src` is empty → no events, no work.
3. If `src` is already in the module-level `registered` set → dispatch `paint-worklet:registered` synchronously and return.
4. If `'paintWorklet' in CSS` is `false` → dispatch `paint-worklet:error` with `{ error: new Error('CSS.paintWorklet unavailable') }` and return.
5. Add `src` to `registered` and call `CSS.paintWorklet.addModule(src)`.
   - On resolve → dispatch `paint-worklet:registered`.
   - On reject → remove `src` from `registered` and dispatch `paint-worklet:error` with the rejection reason.

### Reference implementation (~25 LOC + JSDoc)

```js
// src/paint-worklet.js
/**
 * <paint-worklet> — declaratively register a Houdini Paint Worklet.
 * Removable when authors prefer raw CSS.paintWorklet.addModule().
 *
 * @element paint-worklet
 * @attr {string} src - Worklet module URL.
 * @fires paint-worklet:registered - { src } after successful addModule.
 * @fires paint-worklet:error - { src, error } on failure or missing API.
 */
const registered = new Set();

class PaintWorklet extends HTMLElement {
  connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) return;
    if (registered.has(src)) {
      this.#emit('paint-worklet:registered', { src });
      return;
    }
    if (!('paintWorklet' in CSS)) {
      this.#emit('paint-worklet:error', {
        src,
        error: new Error('CSS.paintWorklet unavailable'),
      });
      return;
    }
    registered.add(src);
    CSS.paintWorklet.addModule(src).then(
      () => this.#emit('paint-worklet:registered', { src }),
      (error) => {
        registered.delete(src);
        this.#emit('paint-worklet:error', { src, error });
      },
    );
  }

  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }
}

customElements.define('paint-worklet', PaintWorklet);
export default PaintWorklet;
```

### Browser support

- Houdini Paint Worklet API: Chromium ✅, Safari ❌ (not shipped), Firefox ❌ (not shipped).
- When unavailable, the element fires `paint-worklet:error` and `background: paint(name)` in CSS resolves to `invalid`, falling back to whatever `background-color` is set. Demos using the worklet show a flat color in Safari/Firefox.

## Showcase pieces 34–43

### Placement

Appended to `docs/showcase.html` after piece 33 (Sierpinski). New section heading `<h2>Modern platform showcase</h2>` plus a two-sentence introductory paragraph contrasting pattern-grid vs. css-doodle.

### Style scoping

Continue the existing convention: per-piece styles live in the `<style>` block at the top, scoped with `#sc-NN` IDs (`#sc-34` through `#sc-43`). Markup uses `<div class="tile" id="sc-NN-tile">…</div>` matching the existing pattern.

### Demo list

#### 34. Step sequencer (`#sc-step`)

- 16×4 grid of `<button type="button" aria-pressed="false">` cells in a `<template>`.
- Click toggles `aria-pressed` and a corresponding bit in a 64-bit state array.
- A small inline `<script>` after the grid uses Web Audio (`AudioContext` + `OscillatorNode`) to play a 4-voice step on a 120 BPM transport when the user clicks a "Play" button.
- Demonstrates: semantic cells, ARIA pressed state, keyboard focus/Space-to-toggle, Web Audio integration.

**Risk:** Web Audio requires user gesture. The Play button itself provides that. No autoplay.

#### 35. Morph layout (`#sc-morph`)

- 8×8 grid. A "Shuffle" `<button>` reorders cells (or swaps the grid between dense and sparse layouts) inside a `document.startViewTransition()` callback.
- Each cell receives `style="view-transition-name: c-N"` inline at render time via a one-shot inline `<script>` (cannot be done in pure CSS because `view-transition-name` does not accept `var()` interpolation into identifiers).
- Demonstrates: View Transitions API, per-cell `view-transition-name`.
- Firefox: snaps without animation. Functional.

**Risk:** Per-cell `view-transition-name` is set in JS. This is a *demo*, not a component feature — the JS lives in the showcase page's inline script, not in `src/pattern-grid.js`.

#### 36. Scroll-reveal mosaic (`#sc-scroll`)

- 12×12 grid. Each cell has `animation: reveal both; animation-timeline: view(); animation-range: entry 0% cover 30%`.
- Staggered with `animation-delay: calc(sibling-index() * -50ms)`.
- Demonstrates: `animation-timeline: view()` (scroll-driven animations).
- Firefox: cells render in final state. Functional but static.

#### 37. Anchored popovers (`#sc-anchor`)

- 6×6 grid of `<button popovertarget="pop-N">` cells inside a `<template>`. After render, an inline `<script>` assigns unique `id`/`popovertarget`/`anchor-name` per cell and creates corresponding `<div popover>` elements.
- Each popover uses `position-anchor: --cell-N` and `left: anchor(right)` / `top: anchor(top)` to dock beside its cell, showing `i / x / y`.
- Demonstrates: Popover API + Anchor Positioning.
- Safari/Firefox: Popover still opens (Baseline), but anchor positioning falls back to default placement. Functional.

**Risk:** Same as #35 — per-cell unique names assigned in JS. Demo-local, not component code.

#### 38. Neighbor glow (`#sc-neighbor`)

- 10×10 grid. CSS uses `:has()` to light up the 4-orthogonal-neighbours of a hovered cell:
  ```css
  #sc-neighbor i:hover,
  #sc-neighbor i:has(+ i:hover),
  #sc-neighbor i:hover + i { background: var(--accent); }
  ```
  (Row-neighbour selectors via `:nth-child` arithmetic and grid-row offset.)
- Demonstrates: `:has()` sibling reasoning; no JS hover handler.
- All browsers: ✅.

#### 39. Parametric clip shapes (`#sc-shape`)

- 8×8 grid. Each cell's `clip-path: polygon(...)` is a 6-pointed star defined by `calc(50% + cos(...))`-style expressions, with rotation driven by `--i`.
- Uses `shim="sibling"` so `--i` is available without Firefox waiting on `sibling-index()`.
- Demonstrates: `clip-path: polygon()` with trig — the direct answer to css-doodle's `@shape()`.

#### 40. Recursive grid (`#sc-recurse`)

- Outer `<pattern-grid cells="3x3">` whose `<template>` is `<div class="sub"><pattern-grid cells="3x3"></pattern-grid></div>`.
- A second-level CSS rule colors cells based on parent index, producing a Sierpinski-carpet-style fractal.
- Demonstrates: nested custom elements upgrade naturally inside `<template>` clones; recursive composition without a DSL.

**Risk:** Custom elements inside a `<template>` upgrade only on insertion into the document. `<pattern-grid>` already handles this because it's defined unconditionally in `src/pattern-grid.js`. Verify in tests.

#### 41. Paint worklet swirl (`#sc-paint`)

- 4×4 grid. Each cell has `background: paint(swirl); --hue: calc(sibling-index() * 22)`.
- A new `<paint-worklet src="/worklets/swirl.js">` registers the worklet at page load.
- `docs/worklets/swirl.js` defines a `SwirlPainter` class reading `--hue` and `--rand-0` (if a `<seed-context>` wraps the grid), painting a per-cell swirl with the Canvas 2D API.
- Demonstrates: Houdini Paint Worklet via the new `<paint-worklet>` companion — the direct answer to css-doodle's `@shaders()`.
- Safari/Firefox: flat fallback background.

#### 42. Contribution calendar (`#sc-calendar`)

- 53×7 grid of `<button type="button" aria-label="…">` cells wrapped in a `<seed-context seed="contrib">`.
- Inline `<script>` after the grid assigns each cell a real date label (`new Date(...)`) and `aria-label="No contributions on 2025-XX-XX"` / `"5 contributions on …"` based on `--randi-0`.
- Cell background: `background: color-mix(in oklch, var(--cal-low), var(--cal-high) calc(var(--randi-0) * 1%))`.
- Demonstrates: real semantic widget — keyboard-focusable, screen-reader-readable, real dates, `color-mix()` for perceptual gradients. css-doodle's Shadow DOM cannot expose this surface.

**Risk:** 371 cells × inline script. Verify performance is acceptable (single pass through `cellElements`).

#### 43. Lissajous point cloud (`#sc-lissajous`)

- 1×200 grid (`cols="200" rows="1"`). Container is `position: relative; aspect-ratio: 1`.
- Each cell:
  ```css
  position: absolute;
  left: 50%;
  top: 50%;
  --t: calc(sibling-index() / sibling-count() * 6.2832);
  translate: calc(cos(var(--t) * 3) * 40%) calc(sin(var(--t) * 4) * 40%);
  ```
- Color via `hsl(calc(sibling-index() * 1.8) 70% 60%)`.
- Demonstrates: parametric positioning — the direct answer to css-doodle's `@plot()`.

### CSS shim usage

Pieces 35, 37, 39, 42, and 43 work best when `--i` is reliably set. Use `shim="sibling"` on those grids so the per-cell `--i` is written by JS in browsers without `sibling-index()`. Native `sibling-index()` remains the path in supporting browsers because the shim is a no-op when not requested.

## File changes

### New files

- `src/paint-worklet.js` — companion element, ~25 LOC + JSDoc.
- `docs/worklets/swirl.js` — one demo paint worklet, ~30 LOC.
- `test/paint-worklet.spec.js` — Playwright tests for the companion.

### Modified files

- `docs/showcase.html` — append pieces 34–43, new section heading, ~250 added lines (style + markup).
- `pattern-grid.d.ts` — add `PaintWorklet` interface.
- `package.json` — add `"./paint-worklet"` and `"./paint-worklet.js"` exports; add `src/paint-worklet.js` to Vite build entries.
- `vite.config.js` — add `paint-worklet` as a Rollup input alongside `pattern-grid` and `seed-context`.
- `dist/paint-worklet.js` — Vite build output, committed (matches existing `dist/seed-context.js` convention).
- `CHANGELOG.md` — 0.3.0 entry.
- `README.md` — one new bullet describing `<paint-worklet>`.

### Untouched

- `src/pattern-grid.js` — must remain ≤80 LOC and unchanged in this work.
- `spec.md` Design Decisions section.
- `dist/pattern-grid.css`.

## Test plan

### `test/paint-worklet.spec.js`

| Case | Expectation |
|---|---|
| `<paint-worklet src="…">` connected with valid src | Dispatches `paint-worklet:registered` once, bubbles. |
| Two `<paint-worklet>` with same `src` | Both dispatch `paint-worklet:registered`; `addModule` called once across the page (stub `CSS.paintWorklet.addModule` and count calls). |
| `<paint-worklet>` with missing `src` | No events fired. |
| `<paint-worklet>` when `CSS.paintWorklet` is absent | Dispatches `paint-worklet:error` with `{ error: Error('CSS.paintWorklet unavailable') }`. |
| `addModule` rejects | Dispatches `paint-worklet:error` with the rejection reason; `src` removed from internal `registered` set (verified by a follow-up `<paint-worklet>` re-attempting). |

Playwright instruments `CSS.paintWorklet` via page evaluation; no real worklet load required. Existing config (`playwright.config.js` boots Vite) is sufficient.

### Showcase demos

Not Playwright-tested. They are documentation. Same convention as existing pieces.

## Browser support summary

| Feature | Chromium | Safari 26 | Firefox 137 | Used in |
|---|---|---|---|---|
| `:has()` | ✅ | ✅ | ✅ | 38 |
| `color-mix()` | ✅ | ✅ | ✅ | 42 |
| `clip-path: polygon()` + trig | ✅ | ✅ | ✅ | 39 |
| Web Audio | ✅ | ✅ | ✅ | 34 |
| Custom elements in `<template>` | ✅ | ✅ | ✅ | 40 |
| Popover API | ✅ | ✅ | ✅ | 37 |
| View Transitions | ✅ | ✅ | ❌ | 35 |
| `animation-timeline: view()` | ✅ | ✅ 26 | ❌ | 36 |
| Anchor Positioning | ✅ | ❌ | ❌ | 37 |
| Houdini Paint Worklet | ✅ | ❌ | ❌ | 41 |
| `sibling-index()` (native) | ✅ | ✅ | ❌ | all (shim covers Firefox) |

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `view-transition-name` and `anchor-name` cannot be set from `var()` in CSS | Per-cell inline `style=""` assigned by a tiny demo-local `<script>`. Stays out of `src/pattern-grid.js`. |
| Paint worklet `src` path differs between Vite dev and built static output | Use `/worklets/swirl.js` absolute path. Vite serves `docs/` as static in dev; the static build copies it. Verify during implementation. |
| 371 cells in piece 42 with per-cell script attribute assignment | Single pass, no DOM thrash beyond setting `aria-label` + `style.cssText`. Acceptable; verify with a render-time `performance.now()` log during implementation. |
| Custom element upgrade timing for nested `<pattern-grid>` inside `<template>` | Already guaranteed by `customElements.define` running at page load before any rendering. Add one test in `test/pattern-grid.spec.js` covering the nested case. |
| `paint-worklet:error` and `paint-worklet:registered` racing on a same-`src` second instance | Same-`src` second instance dispatches synchronously in `connectedCallback`. No race. |

## Scope

Single implementation plan, estimated 3–4 hours of focused work:

- One new component (~25 LOC)
- One demo worklet (~30 LOC)
- One test file (~40 LOC)
- Ten new showcase pieces (~25 LOC of style + markup each)
- Three small config touch-ups (Vite, package, .d.ts)
- One CHANGELOG entry and one README bullet

No decomposition into sub-projects required.

## Acceptance criteria

1. `npm test` passes, including `test/paint-worklet.spec.js`.
2. `npm run build` produces `dist/paint-worklet.js` alongside existing `dist/pattern-grid.js` and `dist/seed-context.js`.
3. `npm run dev` serves `docs/showcase.html` and pieces 34–43 render visibly in a Chromium browser.
4. `src/pattern-grid.js` line count is unchanged.
5. Piece 41 fires `paint-worklet:registered` in Chromium and `paint-worklet:error` in Safari/Firefox (manual verification).
6. Piece 42's calendar cells expose correct `aria-label` text and are focusable via Tab.
7. CHANGELOG and README updated.
