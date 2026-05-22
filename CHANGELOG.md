# Changelog

## 0.3.0 — unreleased

- Add `<paint-worklet>` companion: declaratively registers a Houdini Paint Worklet via `src=URL`. Dispatches `paint-worklet:registered` / `paint-worklet:error`. Deduplicates same-`src` registrations across instances.
- New `./paint-worklet` package export and `dist/paint-worklet.js` build output.
- Showcase: new "Modern platform showcase" section with pieces 34–43:
  - 34 step sequencer (semantic `<button>` cells + Web Audio)
  - 35 morph layout (View Transitions API)
  - 36 scroll-reveal mosaic (`animation-timeline: view()`)
  - 37 anchored popovers (Popover + Anchor Positioning)
  - 38 neighbor glow (CSS `:has()`)
  - 39 parametric clip shapes (trig-driven `clip-path: polygon()`)
  - 40 recursive grid (nested `<pattern-grid>` via `<template>`)
  - 41 paint worklet swirl (Houdini Paint Worklet)
  - 42 contribution calendar (real ARIA dates + `color-mix()`)
  - 43 Lissajous point cloud (parametric positioning)

## 0.2.0 — unreleased

- Add `<seed-context>` companion: writes per-cell `--rand-N` (float) and `--randi-N` (integer) custom properties using a seeded mulberry32 PRNG. Listens for `pattern-grid:render` from any descendant pattern-grid.
- `count` default is 8 (16 properties per cell).
- Built-in anti-FOUC: cells inside a `<seed-context>` start invisible and fade in once populated.
- New docs page `docs/showcase.html` with 31 css-doodle-style demos covering geometric, procedural, animated, random, demoscene, SuperGraphics, Op-Art, emoji, radial-symmetry, SVG-filter, JS-driven, and 3D categories.
- New `dist/seed-context.js` and `dist/seed-context.css` build outputs.
- New `./seed-context` and `./seed-context.css` package exports.

## 0.1.0

Initial release.

- `cols`, `rows`, `cells`, `cell`, `seed`, `shim` attributes.
- `<template>` child support.
- `pattern-grid:render` event.
- Optional default stylesheet at `dist/pattern-grid.css`.
- Playwright test suite.
- 10-example demo page.
