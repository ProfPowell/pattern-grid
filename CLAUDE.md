# Claude notes for this repo

Before changing the component, read `spec.md`. The "Design Decisions" section
is non-negotiable; do not "fix" them.

In particular:

- **Light DOM, not Shadow DOM.** Author CSS must reach `pattern-grid > *`.
- **No DSL.** Two integer attributes (`cols`, `rows`) and a `<template>` slot.
  No parsing of expressions.
- **≤80 lines in `src/pattern-grid.js`.** If a change pushes it past that,
  the change is probably wrong.
- **Progressive enhancement.** The element must do something useful with
  hand-authored cells and no JS.

Build: `npm run build` (writes `dist/pattern-grid.js`; do **not** delete
`dist/pattern-grid.css`).

Tests: `npm test`. The Playwright config boots Vite automatically.

Demo: `npm run dev` opens `demo/index.html`.
