# `<pattern-grid>`

A vanilla web component that stamps out a CSS-Grid of empty cells and gets out of the way.

```html
<pattern-grid cells="8x8"></pattern-grid>

<style>
  pattern-grid { display: grid; grid-template-columns: repeat(var(--pg-cols), 1fr); }
  pattern-grid > i {
    aspect-ratio: 1;
    background: hsl(calc(sibling-index() / sibling-count() * 360) 70% 50%);
  }
</style>
```

- ~1 KB JS. Zero runtime dependencies. Light DOM.
- All visual behavior is **author CSS**. No DSL.
- Progressive enhancement: hand-authored cells work without JS.
- Optional `shim="sibling"` mode for browsers lacking native `sibling-index()`.

## Install

```sh
npm install @profpowell/pattern-grid
```

```html
<script type="module" src="node_modules/@profpowell/pattern-grid/dist/pattern-grid.js"></script>
```

## API

See [spec.md](./spec.md) for the full contract. TL;DR:

- Attributes: `cols`, `rows`, `cells` (e.g. `"8x8"` or `"64"`), `cell` (tag name), `shim`, `seed`.
- Methods: `render()`, `cellAt(i)`, `cellAt(x, y)`.
- Event: `pattern-grid:render` with `{ cols, rows, total }`.
- CSS host props set by the component: `--pg-cols`, `--pg-rows`.

### `<seed-context>` companion

Wrap any `<pattern-grid>` to get per-cell pseudo-random custom properties:

```html
<seed-context seed="hello">
  <pattern-grid cells="8x8"></pattern-grid>
</seed-context>

<style>
  pattern-grid > i {
    background: hsl(calc(var(--rand-0) * 360deg) 70% 50%);
  }
</style>
```

- `seed` attribute reproduces the same randoms across reloads.
- `count` (default 8) controls how many `--rand-N` slots per cell.
- See the [showcase](https://profpowell.github.io/pattern-grid/showcase.html) for examples.

## Demo

[https://profpowell.github.io/pattern-grid](https://profpowell.github.io/pattern-grid)

## Suite

Part of the ProfPowell web component suite: `code-block`, `browser-window`, `terminal-window`, `browser-console`, `http-component`.

## License

MIT
