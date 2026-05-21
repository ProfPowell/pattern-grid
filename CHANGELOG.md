# Changelog

## 0.2.0 — unreleased

- Add `<seed-context>` companion: writes per-cell `--rand-N` (float) and `--randi-N` (integer) custom properties using a seeded mulberry32 PRNG. Listens for `pattern-grid:render` from any descendant pattern-grid.
- `count` default is 8 (16 properties per cell).
- Built-in anti-FOUC: cells inside a `<seed-context>` start invisible and fade in once populated.
- New docs page `docs/showcase.html` with 14 css-doodle-style demos.
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
