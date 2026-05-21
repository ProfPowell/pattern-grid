# `<pattern-grid>` — Specification

A vanilla web component that stamps out a CSS-Grid of empty cells and gets out of the way. Cells are real DOM in the light tree; styling is done with author CSS using native `sibling-index()`, `sibling-count()`, trig, `random()`, and any other platform feature. No DSL. No parser. No shaders.

`<pattern-grid>` is the platform-first answer to [`<css-doodle>`](https://css-doodle.com/). Where `css-doodle` ships a ~150 KB DSL because CSS used to lack counting and randomness, this ships a ~1 KB element because CSS now has both.

Part of the [ProfPowell web component suite](https://github.com/ProfPowell) alongside `<code-block>`, `<browser-window>`, `<terminal-window>`, `<browser-console>`, and `<http-component>`.

---

## Mission

Provide a single declarative element that generates an N×M grid of styleable children. The element does one job — child generation — and delegates *all* visual concerns to author CSS. The component must shrink, not grow, as the CSS platform evolves.

---

## Design Decisions (read before changing anything)

These are deliberate and non-negotiable. A future Claude reading this spec **must not** "fix" them.

### 1. Light DOM, not Shadow DOM

The rest of the suite (`code-block`, `browser-window`, etc.) uses Shadow DOM v1 for encapsulation because those are self-contained UI widgets. `<pattern-grid>` is a **structural** component whose entire purpose is to expose styleable children. Shadow DOM would defeat that.

Specifically:

- Author CSS must reach `pattern-grid > *` with normal selectors. No `::part(cell)` contract for N cells.
- Vanilla Breeze design tokens (`--vb-color-*`, etc.) must cascade in naturally.
- `sibling-index()` and `sibling-count()` work on real DOM siblings — the cells must be real children in the same tree as the host.
- Dev tools `Inspect Element` on a cell should land on the actual cell, not a shadow tree boundary.

This is the **one** deliberate departure from the suite's Shadow DOM default.

### 2. No DSL

`css-doodle` invented `@grid`, `@p()`, `@r()`, `@i`, `@nx`, `:doodle`, `:container`, and ~60 other tokens. Those existed because CSS couldn't count or randomize. CSS now can. The author writes **real CSS** against the generated cells.

Do not invent attributes that compile to CSS. Do not parse anything. The component reads two integers (`cols`, `rows`) and generates that many children. That is the entire JS responsibility.

### 3. The element gets thinner over time

Every CSS Values L5 feature that lands removes responsibility from this component, never adds. When `random()` is Baseline, the `seed` attribute and the optional `<seed-context>` companion can be deprecated. When deeper sibling tree-counting lands, ad-hoc 2D index math can be replaced. **The implementation must be small enough that deletion is easy.**

Target: ≤ 80 lines of JS in `src/pattern-grid.js`. If it grows past that, something is wrong.

### 4. Progressive enhancement is mandatory

Without JS, an author can still hand-author cells:

```html
<pattern-grid cols="3" rows="3">
  <i></i><i></i><i></i>
  <i></i><i></i><i></i>
  <i></i><i></i><i></i>
</pattern-grid>
```

The CSS targeting `pattern-grid > i` works regardless of whether JS ran. The JS only generates cells when the count doesn't match `cols × rows`.

### 5. No bundled styling

The component sets two CSS custom properties on the host (`--pg-cols`, `--pg-rows`) and otherwise injects nothing. An optional `dist/pattern-grid.css` stylesheet ships separately with sane defaults (display: grid, etc.) that the author can opt into.

---

## API

### Attributes

| Attribute  | Type             | Default | Description                                                                                                                              |
| ---------- | ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `cols`     | integer          | `1`     | Number of columns. Range: 1–256. Values outside the range are clamped.                                                                   |
| `rows`     | integer          | `1`     | Number of rows. Range: 1–256. Values outside the range are clamped.                                                                      |
| `cells`    | string           | —       | Shorthand for `cols` × `rows`. Accepts `"8x8"` (2D) or `"64"` (1D shorthand for `cols=64 rows=1`). If present, overrides `cols`/`rows`.  |
| `cell`     | tag name         | `i`     | Tag used for generated cells. Must be a valid HTML tag. Ignored when a `<template>` child is provided.                                   |
| `seed`     | string \| number | —       | Reserved for `<seed-context>` companion. v1 stores the attribute and reflects it; behavior is implemented by the companion if present.   |

All attributes reflect to JS properties of the same camelCase name.

### Properties

```ts
class PatternGrid extends HTMLElement {
  cols: number;
  rows: number;
  cells: string | null;
  cell: string;
  seed: string | null;

  readonly total: number;        // cols * rows
  readonly cellElements: Element[]; // live array of generated cells

  render(): void;                // force regeneration
  cellAt(index: number): Element | null;
  cellAt(x: number, y: number): Element | null;
}
```

### Methods

| Method                      | Returns            | Description                                                              |
| --------------------------- | ------------------ | ------------------------------------------------------------------------ |
| `render()`                  | `void`             | Force regeneration of cells. Idempotent if count and tag haven't changed. |
| `cellAt(i)`                 | `Element \| null`  | Returns the i-th cell (0-indexed). Returns `null` if out of range.       |
| `cellAt(x, y)`              | `Element \| null`  | Returns the cell at column `x`, row `y` (both 0-indexed).                |

### Events

| Event                  | Detail                                  | When                                       |
| ---------------------- | --------------------------------------- | ------------------------------------------ |
| `pattern-grid:render`  | `{ cols, rows, total }`                 | After regeneration completes. Bubbles.     |

### CSS custom properties the component sets

These are set by JS on the host element. Author CSS reads them.

| Property      | Type      | Description                                |
| ------------- | --------- | ------------------------------------------ |
| `--pg-cols`   | `<integer>` | Resolved column count.                   |
| `--pg-rows`   | `<integer>` | Resolved row count.                      |

### CSS custom properties exposed for styling (optional default stylesheet)

If the author imports `dist/pattern-grid.css`, these are honored. Otherwise they are inert.

| Property              | Default                            | Description                          |
| --------------------- | ---------------------------------- | ------------------------------------ |
| `--pg-gap`            | `0`                                | Grid gap.                            |
| `--pg-aspect`         | `calc(var(--pg-cols) / var(--pg-rows))` | Aspect ratio of the grid container. |
| `--pg-cell-aspect`    | `1`                                | Aspect ratio of each cell.           |
| `--pg-bg`             | `transparent`                      | Default cell background.             |

---

## Default Behavior

### On `connectedCallback`

1. Compute `cols` and `rows` from attributes (`cells` takes precedence).
2. Set `--pg-cols` and `--pg-rows` as inline style properties on the host.
3. If `this.children.length !== cols * rows`, call `render()`.
4. Dispatch `pattern-grid:render`.

### On `attributeChangedCallback`

Re-run the connect logic. Observe: `cols`, `rows`, `cells`, `cell`, `seed`.

### `render()` semantics

1. Compute total = cols × rows.
2. If a `<template>` is a direct child, clone its content per cell. Otherwise create elements with `document.createElement(this.cell)`.
3. Use `replaceChildren(...)` to install cells. Preserve any `<template>` as a sibling of the cells (do not remove it).
4. Set `--pg-cols` and `--pg-rows` inline.

### Template support

```html
<pattern-grid cols="8" rows="8">
  <template>
    <span class="dot"></span>
  </template>
</pattern-grid>
```

Each cell is a clone of the template's content. The `cell` attribute is ignored when a template is present. Templates may contain arbitrary structure; CSS targeting `pattern-grid > .dot` works as expected because cells are appended to the light tree.

---

## CSS Contract (no default styles required)

The component itself does not need to render anything. The minimum styling to see a grid is author-provided:

```css
pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
pattern-grid > * {
  display: block;
  aspect-ratio: 1;
}
```

An optional `dist/pattern-grid.css` ships this plus the optional custom properties above. Authors who want the minimum reach can omit the stylesheet and write their own grid.

---

## Examples

### Hello rainbow

```html
<pattern-grid cells="8x8"></pattern-grid>

<style>
  pattern-grid { display: grid; grid-template-columns: repeat(var(--pg-cols), 1fr); }
  pattern-grid > i {
    aspect-ratio: 1;
    background: hsl(
      calc(sibling-index() / sibling-count() * 360) 70% 50%
    );
  }
</style>
```

### Concentric rotation

```html
<pattern-grid cells="32"></pattern-grid>

<style>
  pattern-grid {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
  }
  pattern-grid > i {
    grid-area: 1 / 1;
    width: calc(100% * sibling-index() / sibling-count());
    aspect-ratio: 1;
    border: 1px solid hsl(calc(sibling-index() * 11) 70% 60%);
    border-radius: 30%;
    transform: rotate(calc(sibling-index() * 5deg));
  }
</style>
```

### 2D coordinates from sibling-index

```html
<pattern-grid cells="16x16"></pattern-grid>

<style>
  pattern-grid {
    display: grid;
    grid-template-columns: repeat(var(--pg-cols), 1fr);
    --n: var(--pg-cols);
  }
  pattern-grid > i {
    --i: calc(sibling-index() - 1);
    --x: calc(mod(var(--i), var(--n)));
    --y: calc(floor(var(--i) / var(--n)));
    aspect-ratio: 1;
    background: hsl(
      calc((var(--x) + var(--y)) * 8) 70% 50%
    );
  }
</style>
```

### Hand-authored cells (no JS required)

```html
<pattern-grid cols="3" rows="2">
  <a href="/one"></a>
  <a href="/two"></a>
  <a href="/three"></a>
  <a href="/four"></a>
  <a href="/five"></a>
  <a href="/six"></a>
</pattern-grid>
```

JS, if loaded, sees `children.length === 6 === cols × rows` and skips regeneration.

### Template cells

```html
<pattern-grid cells="4x4">
  <template>
    <button type="button" class="tile"></button>
  </template>
</pattern-grid>
```

### Vanilla Breeze integration

```css
pattern-grid > i {
  background: hsl(
    calc(sibling-index() / sibling-count() * 360)
    var(--vb-color-saturation, 70%)
    var(--vb-color-lightness, 50%)
  );
  border-radius: var(--vb-radius-sm);
}
```

VB tokens cascade naturally because the cells are in the light DOM.

---

## Progressive Enhancement

The component layers cleanly:

| Layer            | Without that layer                          | Result                                     |
| ---------------- | ------------------------------------------- | ------------------------------------------ |
| HTML only        | No CSS, no JS                               | Empty `<pattern-grid>` element; no visual. |
| HTML + CSS       | No JS                                       | Hand-authored cells render as styled.      |
| HTML + CSS + JS  | Full functionality                          | Cells auto-generated; attrs reactive.      |

Authors who need a guaranteed visual without JS should hand-author the cells. The element acts as a styling hook (a named grid container) with or without script.

---

## Browser Support

### Required (Baseline)

- Custom Elements v1
- ES Modules
- CSS Grid Layout
- CSS Custom Properties
- `attributeChangedCallback` / `observedAttributes`

### Recommended (used in examples; check `@supports` for production)

| Feature                          | Status (May 2026)                          | Fallback strategy                                                 |
| -------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `sibling-index()`                | Chrome 137+, Safari, Firefox lagging       | `@supports` gate; opt-in JS shim that sets `--i` inline per cell. |
| `sibling-count()`                | Same as above                              | Same shim sets `--n` from `cols × rows`.                          |
| `random()` / `random-item()`     | Safari 26.2 only                           | Use `<seed-context>` companion (planned).                         |
| CSS trig (`sin`, `cos`, `mod`)   | Baseline                                   | None needed.                                                      |
| `@property`                      | Baseline                                   | None needed.                                                      |

### Optional JS fallback for `sibling-index()` / `sibling-count()`

Off by default. Authors who need Firefox today can opt in:

```html
<pattern-grid cells="8x8" shim="sibling"></pattern-grid>
```

When `shim="sibling"`, JS sets `style.setProperty('--i', i + 1)` on each cell during `render()`, and `--n` on the host. Author CSS can prefer the native function with a fallback:

```css
pattern-grid > i {
  --idx: var(--i, sibling-index());
  background: hsl(calc(var(--idx) * 10) 70% 50%);
}
```

When all target browsers support `sibling-index()`, the author drops `shim="sibling"` and the JS does no per-cell work.

---

## Reference Implementation

This is intended to be close to the final code. The complete implementation should not exceed ~80 lines.

```js
// src/pattern-grid.js
/**
 * <pattern-grid> — generate a CSS Grid of styleable cells.
 * @see https://github.com/ProfPowell/pattern-grid
 */
class PatternGrid extends HTMLElement {
  static observedAttributes = ['cols', 'rows', 'cells', 'cell', 'seed', 'shim'];

  connectedCallback() { this.#sync(); }
  attributeChangedCallback() { this.#sync(); }

  get cols() { return this.#dim('cols', 0); }
  set cols(v) { this.setAttribute('cols', v); }
  get rows() { return this.#dim('rows', 1); }
  set rows(v) { this.setAttribute('rows', v); }
  get cell() { return this.getAttribute('cell') ?? 'i'; }
  set cell(v) { this.setAttribute('cell', v); }
  get total() { return this.cols * this.rows; }
  get cellElements() {
    return [...this.children].filter(el => el.tagName !== 'TEMPLATE');
  }

  cellAt(a, b) {
    const cells = this.cellElements;
    const i = b === undefined ? a : a + b * this.cols;
    return cells[i] ?? null;
  }

  render() {
    const total = this.total;
    const tpl = this.querySelector(':scope > template');
    const make = tpl
      ? () => tpl.content.cloneNode(true)
      : () => document.createElement(this.cell);
    const next = Array.from({ length: total }, make);
    this.replaceChildren(...(tpl ? [tpl, ...next] : next));
    if (this.getAttribute('shim') === 'sibling') this.#shim();
    this.dispatchEvent(new CustomEvent('pattern-grid:render', {
      detail: { cols: this.cols, rows: this.rows, total },
      bubbles: true,
    }));
  }

  #sync() {
    const cols = this.cols, rows = this.rows;
    this.style.setProperty('--pg-cols', cols);
    this.style.setProperty('--pg-rows', rows);
    if (this.cellElements.length !== cols * rows) this.render();
    else if (this.getAttribute('shim') === 'sibling') this.#shim();
  }

  #shim() {
    this.style.setProperty('--n', this.total);
    this.cellElements.forEach((el, i) => el.style.setProperty('--i', i + 1));
  }

  #dim(name, axis) {
    const c = this.getAttribute('cells');
    if (c) {
      const parts = c.includes('x') ? c.split('x') : [c, '1'];
      return clamp(+parts[axis === 0 ? 0 : 1] || 1);
    }
    return clamp(+(this.getAttribute(name) ?? 1));
  }
}

const clamp = (n) => Math.max(1, Math.min(256, n | 0));

customElements.define('pattern-grid', PatternGrid);
export default PatternGrid;
```

Note: `#dim` uses axis `0` for cols and `1` for rows. The getters pass `0` and `1` respectively.

### Optional default stylesheet

```css
/* dist/pattern-grid.css — optional opt-in defaults */
pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols, 1), 1fr);
  aspect-ratio: var(--pg-aspect, calc(var(--pg-cols, 1) / var(--pg-rows, 1)));
  gap: var(--pg-gap, 0);
  container-type: inline-size;
}
pattern-grid > *:not(template) {
  display: block;
  aspect-ratio: var(--pg-cell-aspect, 1);
  background: var(--pg-bg, transparent);
}
```

---

## File Structure

Per [wc-standards.md](https://github.com/ProfPowell/code-block/blob/main/wc-standards.md):

```
pattern-grid/
├── src/
│   └── pattern-grid.js          # Main component (JSDoc-typed)
├── dist/
│   ├── pattern-grid.js          # ES module build (committed)
│   └── pattern-grid.css         # Optional default stylesheet
├── demo/
│   └── index.html               # GitHub Pages demo (10+ live examples)
├── test/
│   └── pattern-grid.spec.js     # Playwright tests
├── pattern-grid.d.ts            # Manual TypeScript defs
├── custom-elements.json         # Generated by CEM analyzer
├── package.json
├── vite.config.js
├── eslint.config.js
├── .prettierrc
├── playwright.config.js
├── README.md
├── LICENSE
├── CHANGELOG.md
└── CLAUDE.md
```

---

## Tooling (suite standard)

5 devDependencies, no more:

```json
{
  "devDependencies": {
    "vite": "^6.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "@playwright/test": "^1.57.0",
    "@custom-elements-manifest/analyzer": "^0.11.0"
  }
}
```

**Runtime dependencies: zero.**

### package.json

```json
{
  "name": "@profpowell/pattern-grid",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/pattern-grid.js",
  "module": "dist/pattern-grid.js",
  "types": "pattern-grid.d.ts",
  "exports": {
    ".": {
      "types": "./pattern-grid.d.ts",
      "import": "./dist/pattern-grid.js",
      "default": "./dist/pattern-grid.js"
    },
    "./css": "./dist/pattern-grid.css"
  },
  "files": [
    "dist",
    "pattern-grid.d.ts",
    "custom-elements.json",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write \"src/**/*.js\"",
    "format:check": "prettier --check \"src/**/*.js\"",
    "analyze": "cem analyze",
    "prepublishOnly": "npm run build && npm run analyze"
  }
}
```

### vite.config.js

```js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/pattern-grid.js',
      formats: ['es'],
      fileName: () => 'pattern-grid.js',
    },
  },
  server: {
    open: '/demo/index.html',
  },
});
```

---

## Tests (Playwright)

Required cases. Add more as needed.

```js
// test/pattern-grid.spec.js
import { test, expect } from '@playwright/test';

test.describe('<pattern-grid>', () => {
  test('generates cols × rows cells from cells="8x8"', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cells="8x8"></pattern-grid>
    `);
    await expect(page.locator('pattern-grid > i')).toHaveCount(64);
  });

  test('cols + rows attributes override defaults', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cols="4" rows="3"></pattern-grid>
    `);
    await expect(page.locator('pattern-grid > i')).toHaveCount(12);
  });

  test('attribute change regenerates cells', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cols="2" rows="2"></pattern-grid>
    `);
    await page.locator('pattern-grid').evaluate((el) => el.setAttribute('cols', '5'));
    await expect(page.locator('pattern-grid > i')).toHaveCount(10);
  });

  test('cell attribute uses custom tag', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cells="4" cell="span"></pattern-grid>
    `);
    await expect(page.locator('pattern-grid > span')).toHaveCount(4);
    await expect(page.locator('pattern-grid > i')).toHaveCount(0);
  });

  test('template child is cloned per cell', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cells="3">
        <template><b class="dot"></b></template>
      </pattern-grid>
    `);
    await expect(page.locator('pattern-grid > b.dot')).toHaveCount(3);
    await expect(page.locator('pattern-grid > template')).toHaveCount(1);
  });

  test('hand-authored cells with matching count are preserved', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cols="2" rows="2">
        <a href="/1"></a><a href="/2"></a><a href="/3"></a><a href="/4"></a>
      </pattern-grid>
    `);
    await expect(page.locator('pattern-grid > a')).toHaveCount(4);
    await expect(page.locator('pattern-grid > a[href="/1"]')).toHaveCount(1);
  });

  test('sets --pg-cols and --pg-rows custom properties', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cells="8x4"></pattern-grid>
    `);
    const cols = await page.locator('pattern-grid').evaluate(
      (el) => el.style.getPropertyValue('--pg-cols')
    );
    const rows = await page.locator('pattern-grid').evaluate(
      (el) => el.style.getPropertyValue('--pg-rows')
    );
    expect(cols).toBe('8');
    expect(rows).toBe('4');
  });

  test('dispatches pattern-grid:render event', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cells="4"></pattern-grid>
    `);
    const detail = await page.evaluate(() => new Promise((resolve) => {
      document.querySelector('pattern-grid').addEventListener(
        'pattern-grid:render',
        (e) => resolve(e.detail),
        { once: true }
      );
      document.querySelector('pattern-grid').render();
    }));
    expect(detail).toEqual({ cols: 4, rows: 1, total: 4 });
  });

  test('shim="sibling" sets --i on each cell and --n on host', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cells="3" shim="sibling"></pattern-grid>
    `);
    const n = await page.locator('pattern-grid').evaluate(
      (el) => el.style.getPropertyValue('--n')
    );
    expect(n).toBe('3');
    const cellTwoI = await page.locator('pattern-grid > i').nth(1).evaluate(
      (el) => el.style.getPropertyValue('--i')
    );
    expect(cellTwoI).toBe('2');
  });

  test('clamps cols and rows to [1, 256]', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cols="9999" rows="0"></pattern-grid>
    `);
    await expect(page.locator('pattern-grid > i')).toHaveCount(256);
  });

  test('cellAt(x, y) returns the correct cell', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/dist/pattern-grid.js"></script>
      <pattern-grid cells="3x3"></pattern-grid>
    `);
    const isSame = await page.evaluate(() => {
      const grid = document.querySelector('pattern-grid');
      return grid.cellAt(1, 1) === grid.cellAt(4);
    });
    expect(isSame).toBe(true);
  });
});
```

---

## Demo Page Requirements

`demo/index.html` is the GitHub Pages site. Include at minimum:

1. Hero — large animated doodle that updates on `auto:update` (CSS-only animation).
2. **Hello rainbow** — minimum viable example.
3. **Concentric rotation** — sibling-index + trig.
4. **2D coordinates** — mod/floor on sibling-index.
5. **Template cells** — `<template>` child with structured content.
6. **Hand-authored** — no-JS demonstration (open in NoScript).
7. **Vanilla Breeze tokens** — same doodle, themed via VB CSS vars.
8. **Sibling shim** — same visual with and without `shim="sibling"`.
9. **Seeded** — `<seed-context>` integration once that companion ships.
10. **API explorer** — sliders for `cols` and `rows` that mutate attributes live.

Each example uses `<code-block>` to show its source side-by-side. Cross-link to `code-block`, `browser-window`, and the rest of the suite.

---

## Non-Goals (do not implement)

- A DSL or any custom syntax inside the element body.
- Shadow DOM.
- SVG generation.
- WebGL/shader rendering.
- Image export (use a build-time screenshot tool if needed).
- Animation orchestration (CSS animations and View Transitions handle this).
- A pseudo-class API (`:doodle`, `:container`). Author the host element directly.
- A `seed` random-number generator inside this component. That belongs in the `<seed-context>` companion.
- Auto-update timers (`auto:update`, `click:update`). Author can call `render()` from a click handler.

If a future contributor proposes any of the above, point them at this section.

---

## Planned Companions (separate components, separate repos)

These are not part of `<pattern-grid>` but slot into the same authoring story.

### `<seed-context seed="42">`

Sets `--rand-0` through `--rand-N` custom properties on its children at connect time using a seeded PRNG (mulberry32). Removable when CSS `random(--key, ...)` is Baseline.

```html
<seed-context seed="hello">
  <pattern-grid cells="8x8"></pattern-grid>
</seed-context>
```

### `<viewport-grid>` (maybe)

`<pattern-grid>` variant that picks `cols`/`rows` from container queries. Useful for responsive decorative backgrounds.

---

## Relationship to the Rest of the Suite

| Component         | DOM mode  | Purpose                                    |
| ----------------- | --------- | ------------------------------------------ |
| `code-block`      | Shadow    | Encapsulated UI widget                     |
| `browser-window`  | Shadow    | Encapsulated UI chrome                     |
| `terminal-window` | Shadow    | Encapsulated UI widget                     |
| `browser-console` | Shadow    | Encapsulated UI widget                     |
| `http-component`  | Shadow    | Encapsulated UI widget                     |
| **`pattern-grid`** | **Light** | **Structural cell generator**              |

`pattern-grid` is the one suite member that intentionally uses light DOM, because its job is to expose styleable children, not to encapsulate a widget. Future structural components (e.g. `<seed-context>`, `<viewport-grid>`) follow the same light-DOM pattern. Future UI widgets follow the suite's Shadow DOM default.

---

## Changelog Discipline

- `0.1.0` — initial release: `cols`, `rows`, `cells`, `cell`, `seed`, `shim`, `<template>` support, optional default stylesheet, GitHub Pages demo.
- Subsequent feature additions require a corresponding browser-support justification in this spec.
- Removals (e.g. dropping `shim` once `sibling-index()` is Baseline) are encouraged.

---

## Open Questions for the Implementer

1. Should `seed` reflect down to children as a custom property even without `<seed-context>` present? Default: no. Decide before 0.1.0.
2. Should `pattern-grid:render` be cancelable? Default: no. Confirm.
3. Naming: `shim="sibling"` vs `polyfill="sibling-index"`. Pick one. Document choice in the changelog.

---

## License

MIT, matching the rest of the suite.
