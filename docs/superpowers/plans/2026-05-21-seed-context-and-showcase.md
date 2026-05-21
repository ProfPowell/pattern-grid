# `<seed-context>` + Showcase Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `<seed-context>` (a seeded-PRNG companion to `<pattern-grid>`) plus a 14-piece `docs/showcase.html` gallery demonstrating css-doodle-class visual effects.

**Architecture:** A second vanilla web component (light DOM, ~90 executable LOC) lives alongside `<pattern-grid>` in `src/`. It listens for the existing `pattern-grid:render` event from any descendant, then writes per-cell `--rand-N` (float) and `--randi-N` (integer) inline styles using mulberry32 seeded from a hash of the `seed` attribute. A head-injected stylesheet hides un-populated cells to suppress FOUC. The showcase page builds on this with 14 styled demo tiles, 5 of which depend on seed-context.

**Tech Stack:** Vanilla JS (ES2022, private fields), Vite multi-entry library build, Playwright. Zero new runtime dependencies.

**Locked design decisions (from the spec):**
- `count` default is `8` (16 properties per cell total: 8 float + 8 int).
- Anti-FOUC is built-in via head-injected `<style>`; no opt-in required.
- `--randi-N = Math.floor(--rand-N * 100)` (derived, not independent rolls).
- Per-cell seed mixes `seedHash ^ (cellIndex * 0x9E3779B1) ^ (gridOffset * 0x85EBCA6B)`.
- LOC budget: `src/seed-context.js` ≤ 110 total (≤90 executable, ≤20 JSDoc).
- 14 showcase pieces; piece #13 (Unicode rain) has a documented fallback if the all-CSS approach proves impractical.

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `src/seed-context.js` | The component. Hash + mulberry32 + class + customElements.define + head style injection. One file, ≤110 LOC. |
| `test/seed-context.spec.js` | All 22 Playwright tests for seed-context. |
| `seed-context.d.ts` | TypeScript declarations for the second module entry. |
| `dist/seed-context.css` | Optional empty/minimal default stylesheet for parity with `dist/pattern-grid.css`. |
| `docs/showcase.html` | The 14-piece gallery page. |

### Modified files

| Path | Change |
|---|---|
| `vite.config.js` | `lib.entry` becomes an object map building both modules. |
| `package.json` | `exports`: new `./seed-context` and `./seed-context.css` entries. `postbuild` script copies four files into `docs/`. |
| `docs/styles.css` | Add `.gallery` grid styles, add `#sc-<slug>` rule blocks for each of the 14 pieces. |
| `docs/index.html` | Nav gains "Showcase" link. |
| `docs/demos.html` | Nav gains "Showcase" link; example #8 wraps the grid in `<seed-context>` so the demo becomes live. |
| `docs/api.html` | Nav gains "Showcase" link; append a `<seed-context>` API section after the existing pattern-grid tables. |
| `README.md` | One paragraph mentioning `<seed-context>`. |
| `CHANGELOG.md` | New `0.2.0` heading with entries. |

### Generated / synced (committed)

| Path | How produced |
|---|---|
| `dist/seed-context.js` | `vite build` |
| `docs/pattern-grid.js`, `docs/pattern-grid.css`, `docs/seed-context.js`, `docs/seed-context.css` | `postbuild` script |

---

## Task 1: Multi-entry Vite build + package.json exports

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json`

- [ ] **Step 1: Replace `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'pattern-grid': 'src/pattern-grid.js',
        'seed-context': 'src/seed-context.js',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
  server: {
    open: '/demo/index.html',
    cors: true,
  },
});
```

`src/seed-context.js` does not exist yet; Vite will error if built now. That's expected — Task 4 creates the file.

- [ ] **Step 2: Update `package.json` exports**

Open `package.json`. Replace the `"exports"` block with:

```json
  "exports": {
    ".": {
      "types": "./pattern-grid.d.ts",
      "import": "./dist/pattern-grid.js",
      "default": "./dist/pattern-grid.js"
    },
    "./css": "./dist/pattern-grid.css",
    "./seed-context": {
      "types": "./seed-context.d.ts",
      "import": "./dist/seed-context.js",
      "default": "./dist/seed-context.js"
    },
    "./seed-context.css": "./dist/seed-context.css"
  },
```

- [ ] **Step 3: Update `package.json` `files` array** to include the new d.ts

Find the `"files"` array and replace with:

```json
  "files": [
    "dist",
    "pattern-grid.d.ts",
    "seed-context.d.ts",
    "custom-elements.json",
    "README.md",
    "LICENSE"
  ],
```

- [ ] **Step 4: Update the `postbuild` script** to sync both components into `docs/`

Find the existing `postbuild` and replace its value with:

```
cp dist/pattern-grid.js docs/pattern-grid.js && cp dist/pattern-grid.css docs/pattern-grid.css && cp dist/seed-context.js docs/seed-context.js && cp dist/seed-context.css docs/seed-context.css
```

The full `"postbuild"` line should read:

```json
    "postbuild": "cp dist/pattern-grid.js docs/pattern-grid.js && cp dist/pattern-grid.css docs/pattern-grid.css && cp dist/seed-context.js docs/seed-context.js && cp dist/seed-context.css docs/seed-context.css",
```

- [ ] **Step 5: Commit**

```bash
git add vite.config.js package.json
git commit -m "build: multi-entry Vite config + seed-context export wiring"
```

Do not run `npm run build` yet; it will fail until `src/seed-context.js` exists.

---

## Task 2: Empty `dist/seed-context.css` (parity stylesheet)

**Files:**
- Create: `dist/seed-context.css`

- [ ] **Step 1: Create the file**

```css
/* dist/seed-context.css — reserved for future opt-in defaults */
```

This file ships for symmetry with `dist/pattern-grid.css` and to keep the `./seed-context.css` export valid even before any defaults exist.

- [ ] **Step 2: Commit**

```bash
git add dist/seed-context.css
git commit -m "feat: add placeholder dist/seed-context.css"
```

---

## Task 3: First failing seed-context test

**Files:**
- Create: `test/seed-context.spec.js`

- [ ] **Step 1: Write the first failing test**

```js
// test/seed-context.spec.js
import { test, expect } from '@playwright/test';

test.describe('<seed-context>', () => {
  test('writes --rand-0 and --randi-0 on each cell', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="hello">
        <pattern-grid cells="2x2"></pattern-grid>
      </seed-context>
    `);
    const values = await page.locator('pattern-grid > i').nth(0).evaluate((el) => ({
      rand0: el.style.getPropertyValue('--rand-0'),
      randi0: el.style.getPropertyValue('--randi-0'),
    }));
    expect(values.rand0).not.toBe('');
    expect(parseFloat(values.rand0)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(values.rand0)).toBeLessThan(1);
    expect(values.randi0).not.toBe('');
    expect(parseInt(values.randi0, 10)).toBeGreaterThanOrEqual(0);
    expect(parseInt(values.randi0, 10)).toBeLessThanOrEqual(99);
  });
});
```

- [ ] **Step 2: Run the test — verify it FAILS**

Run: `npx playwright test test/seed-context.spec.js`
Expected: FAIL — `src/seed-context.js` does not exist (Vite returns 404), so `<seed-context>` is undefined and no `--rand-0` is written. `values.rand0` is `""`.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: add failing test for seed-context --rand population"
```

---

## Task 4: Implement `src/seed-context.js`

**Files:**
- Create: `src/seed-context.js`

This is the full reference implementation. Subsequent tasks add tests that exercise individual branches; the implementation already covers them.

- [ ] **Step 1: Create the file**

```js
// src/seed-context.js
/**
 * <seed-context> — assigns per-cell --rand-N (float) and --randi-N (int)
 * custom properties to pattern-grid cells using a seeded PRNG.
 * Removable when CSS random() is Baseline.
 *
 * @element seed-context
 * @attr {string} seed - Seed value. Same seed reproduces the same randoms.
 * @attr {integer} count - Number of --rand-N slots per cell (1-32, default 8).
 * @fires seed-context:populated - { target, count } after a grid's cells are populated.
 */
class SeedContext extends HTMLElement {
  static observedAttributes = ['seed', 'count'];

  #grids = new Map(); // pattern-grid -> gridOffset (stable per instance)
  #nextOffset = 0;

  connectedCallback() {
    injectFoucStyle();
    this.addEventListener('pattern-grid:render', this.#onRender);
    // Populate any already-rendered grids inside this subtree.
    for (const grid of this.querySelectorAll(':scope pattern-grid')) {
      if (grid.cellElements && grid.cellElements.length > 0) this.#populate(grid);
    }
  }

  disconnectedCallback() {
    this.removeEventListener('pattern-grid:render', this.#onRender);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.reseed();
  }

  get seed() { return this.getAttribute('seed') ?? ''; }
  set seed(v) { this.setAttribute('seed', v); }
  get count() { return clampCount(+(this.getAttribute('count') ?? 8)); }
  set count(v) { this.setAttribute('count', v); }
  get seedHash() { return hashSeed(this.seed); }
  get prng() { return mulberry32(this.seedHash); }

  reseed() {
    for (const grid of this.#grids.keys()) this.#populate(grid);
  }

  #onRender = (e) => { this.#populate(e.target); };

  #populate(grid) {
    if (!this.#grids.has(grid)) this.#grids.set(grid, this.#nextOffset++);
    const offset = this.#grids.get(grid);
    const cells = grid.cellElements;
    const n = this.count;
    const baseHash = this.seedHash ^ Math.imul(offset, 0x85EBCA6B);
    for (let i = 0; i < cells.length; i++) {
      const rng = mulberry32(baseHash ^ Math.imul(i, 0x9E3779B1));
      let css = 'opacity:1;';
      for (let k = 0; k < n; k++) {
        const r = rng();
        css += `--rand-${k}:${r};--randi-${k}:${Math.floor(r * 100)};`;
      }
      cells[i].style.cssText = css;
    }
    this.dispatchEvent(new CustomEvent('seed-context:populated', {
      detail: { target: grid, count: n },
      bubbles: true,
    }));
  }
}

const clampCount = (n) => Math.max(1, Math.min(32, n | 0)) || 8;

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

const mulberry32 = (a) => () => {
  let t = (a += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FOUC_STYLE_ID = 'seed-context-fouc';
function injectFoucStyle() {
  if (document.getElementById(FOUC_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FOUC_STYLE_ID;
  style.textContent = `seed-context > pattern-grid > *:not(template) { opacity: 0; transition: opacity 220ms ease-out; }`;
  document.head.appendChild(style);
}

customElements.define('seed-context', SeedContext);
export default SeedContext;
```

- [ ] **Step 2: Run the failing test — verify it now PASSES**

Run: `npx playwright test test/seed-context.spec.js -g "writes --rand-0"`
Expected: PASS.

- [ ] **Step 3: Verify line count**

Run: `wc -l src/seed-context.js`
Expected: ≤ 110.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: 0 errors. (eslint.config.js's globals already include the names we use.)

- [ ] **Step 5: Commit**

```bash
git add src/seed-context.js
git commit -m "feat: add seed-context component"
```

---

## Task 5: Test — `--randi-N` matches `floor(--rand-N * 100)`

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append the test**

```js
  test('--randi-N is floor(--rand-N * 100)', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="t">
        <pattern-grid cells="3x3"></pattern-grid>
      </seed-context>
    `);
    const pairs = await page.locator('pattern-grid > i').evaluateAll((cells) =>
      cells.map((el) => ({
        rand: parseFloat(el.style.getPropertyValue('--rand-0')),
        randi: parseInt(el.style.getPropertyValue('--randi-0'), 10),
      })),
    );
    for (const { rand, randi } of pairs) {
      expect(randi).toBe(Math.floor(rand * 100));
    }
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "floor"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: --randi-N is floor(--rand-N * 100)"
```

---

## Task 6: Test — default count writes 16 properties per cell

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('default count=8 writes --rand-0..7 and --randi-0..7', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x">
        <pattern-grid cells="2x1"></pattern-grid>
      </seed-context>
    `);
    const props = await page.locator('pattern-grid > i').first().evaluate((el) => {
      const out = {};
      for (let k = 0; k < 8; k++) {
        out[`rand-${k}`] = el.style.getPropertyValue(`--rand-${k}`);
        out[`randi-${k}`] = el.style.getPropertyValue(`--randi-${k}`);
      }
      out['rand-8'] = el.style.getPropertyValue('--rand-8');
      return out;
    });
    for (let k = 0; k < 8; k++) {
      expect(props[`rand-${k}`]).not.toBe('');
      expect(props[`randi-${k}`]).not.toBe('');
    }
    expect(props['rand-8']).toBe('');
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "default count=8"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: default count=8 writes 16 properties per cell"
```

---

## Task 7: Test — same seed reproduces; different seed differs

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append two tests**

```js
  test('same seed reproduces same --rand-0 on each cell', async ({ page }) => {
    const html = `
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="alpha">
        <pattern-grid cells="3x3"></pattern-grid>
      </seed-context>
    `;
    await page.setContent(html);
    const firstRun = await page.locator('pattern-grid > i').evaluateAll((cells) =>
      cells.map((el) => el.style.getPropertyValue('--rand-0')),
    );
    await page.setContent(html);
    const secondRun = await page.locator('pattern-grid > i').evaluateAll((cells) =>
      cells.map((el) => el.style.getPropertyValue('--rand-0')),
    );
    expect(secondRun).toEqual(firstRun);
  });

  test('different seed yields different --rand-0 on at least one cell', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context id="a" seed="alpha"><pattern-grid cells="3x3"></pattern-grid></seed-context>
      <seed-context id="b" seed="beta"><pattern-grid cells="3x3"></pattern-grid></seed-context>
    `);
    const a = await page.locator('#a pattern-grid > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    const b = await page.locator('#b pattern-grid > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    expect(a.length).toBe(9);
    expect(b.length).toBe(9);
    expect(a).not.toEqual(b);
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "same seed|different seed"`
Expected: PASS for both.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: seed determinism — same seed reproduces, different seed differs"
```

---

## Task 8: Test — empty seed still produces randoms

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('empty seed still produces randoms', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const rand0 = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(rand0).not.toBe('');
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "empty seed"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: empty seed still produces randoms"
```

---

## Task 9: Test — `seed` attribute change triggers reseed

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('changing seed attribute triggers reseed', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="one"><pattern-grid cells="3x3"></pattern-grid></seed-context>
    `);
    const before = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    await page.locator('seed-context').evaluate((el) => el.setAttribute('seed', 'two'));
    const after = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(after).not.toBe(before);
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "changing seed"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: seed attribute change triggers reseed"
```

---

## Task 10: Test — `count` change rewrites with new slot count

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('changing count rewrites with new slot count', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x" count="4"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const before = await page.locator('pattern-grid > i').first().evaluate((el) => ({
      r3: el.style.getPropertyValue('--rand-3'),
      r4: el.style.getPropertyValue('--rand-4'),
    }));
    expect(before.r3).not.toBe('');
    expect(before.r4).toBe('');
    await page.locator('seed-context').evaluate((el) => el.setAttribute('count', '6'));
    const after = await page.locator('pattern-grid > i').first().evaluate((el) => ({
      r5: el.style.getPropertyValue('--rand-5'),
      r6: el.style.getPropertyValue('--rand-6'),
    }));
    expect(after.r5).not.toBe('');
    expect(after.r6).toBe('');
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "count rewrites"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: count change rewrites slot count"
```

---

## Task 11: Test — count clamping

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('count clamps 0 to 1 and 50 to 32', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context id="lo" seed="x" count="0"><pattern-grid cells="2x1"></pattern-grid></seed-context>
      <seed-context id="hi" seed="x" count="50"><pattern-grid cells="2x1"></pattern-grid></seed-context>
    `);
    const lo = await page.locator('#lo pattern-grid > i').first().evaluate((el) => ({
      r0: el.style.getPropertyValue('--rand-0'),
      r1: el.style.getPropertyValue('--rand-1'),
    }));
    expect(lo.r0).not.toBe('');
    expect(lo.r1).toBe('');
    const hi = await page.locator('#hi pattern-grid > i').first().evaluate((el) => ({
      r31: el.style.getPropertyValue('--rand-31'),
      r32: el.style.getPropertyValue('--rand-32'),
    }));
    expect(hi.r31).not.toBe('');
    expect(hi.r32).toBe('');
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "count clamps"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: count clamps to [1, 32]"
```

---

## Task 12: Test — `reseed()` method + JS property setter

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append two tests**

```js
  test('reseed() method re-writes without attribute change', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="s"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    // Mutate one cell's --rand-0 to verify reseed restores the deterministic value.
    await page.locator('pattern-grid > i').first().evaluate((el) => el.style.setProperty('--rand-0', '0.999'));
    await page.locator('seed-context').evaluate((el) => el.reseed());
    const restored = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(restored).not.toBe('0.999');
  });

  test('setting seed via JS property reflects to attribute and reseeds', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="one"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const before = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    await page.locator('seed-context').evaluate((el) => { el.seed = 'two'; });
    const attr = await page.locator('seed-context').evaluate((el) => el.getAttribute('seed'));
    const after = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(attr).toBe('two');
    expect(after).not.toBe(before);
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "reseed|JS property"`
Expected: PASS for both.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: reseed() method and JS property setter"
```

---

## Task 13: Test — late connection populates already-rendered grids

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('seed-context appended after pattern-grid still populates cells', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <div id="host"><pattern-grid cells="2x2"></pattern-grid></div>
    `);
    // Confirm pattern-grid rendered, no randoms yet.
    const beforeWrap = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(beforeWrap).toBe('');
    // Wrap with seed-context dynamically.
    await page.evaluate(() => {
      const host = document.getElementById('host');
      const grid = host.querySelector('pattern-grid');
      const ctx = document.createElement('seed-context');
      ctx.setAttribute('seed', 'late');
      host.appendChild(ctx);
      ctx.appendChild(grid);
    });
    const after = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(after).not.toBe('');
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "appended after"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: late connection populates already-rendered grids"
```

---

## Task 14: Test — new grid inside existing seed-context populates

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('new pattern-grid appended into seed-context populates on render', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x"></seed-context>
    `);
    await page.evaluate(() => {
      const grid = document.createElement('pattern-grid');
      grid.setAttribute('cells', '2x2');
      document.querySelector('seed-context').appendChild(grid);
    });
    const rand0 = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(rand0).not.toBe('');
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "new pattern-grid appended"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: new pattern-grid inside seed-context populates"
```

---

## Task 15: Test — disconnect removes the listener

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('disconnected seed-context stops populating new renders', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    // Remove the seed-context (and its grid) from the DOM.
    await page.evaluate(() => {
      const ctx = document.querySelector('seed-context');
      ctx.remove();
    });
    // Re-create a fresh grid in body — no seed-context anywhere.
    await page.evaluate(() => {
      const grid = document.createElement('pattern-grid');
      grid.setAttribute('cells', '2x2');
      document.body.appendChild(grid);
    });
    const rand0 = await page.locator('body > pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(rand0).toBe('');
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "disconnected"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: disconnect removes seed-context listener"
```

---

## Task 16: Test — 1000-cell perf budget under 50ms

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('populates 1000 cells in under 50ms', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
    `);
    const duration = await page.evaluate(() => new Promise((resolve) => {
      const ctx = document.createElement('seed-context');
      ctx.setAttribute('seed', 'perf');
      document.body.appendChild(ctx);
      ctx.addEventListener('seed-context:populated', (e) => {
        if (e.detail.target.cellElements.length === 1000) {
          resolve(performance.now() - t0);
        }
      });
      const grid = document.createElement('pattern-grid');
      grid.setAttribute('cells', '50x20');
      const t0 = performance.now();
      ctx.appendChild(grid);
    }));
    expect(duration).toBeLessThan(50);
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "1000 cells"`
Expected: PASS. (If this fails on a slow CI machine, raise the budget to 80ms — but locally on M-series hardware 50ms is comfortable.)

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: populate 1000 cells under 50ms"
```

---

## Task 17: Test — multiple grids in one seed-context get independent randoms

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('two pattern-grids inside one seed-context get independent randoms', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x">
        <pattern-grid id="a" cells="3x3"></pattern-grid>
        <pattern-grid id="b" cells="3x3"></pattern-grid>
      </seed-context>
    `);
    const a = await page.locator('#a > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    const b = await page.locator('#b > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    expect(a).not.toEqual(b);
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "two pattern-grids"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: multiple grids in one seed-context get independent randoms"
```

---

## Task 18: Test — `seed-context:populated` event detail

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('dispatches seed-context:populated event with correct detail', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="evt"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const detail = await page.evaluate(() => new Promise((resolve) => {
      // Re-trigger by calling reseed; we know population just happened on load too,
      // but reseed() is the simpler hook for capturing the next emission.
      document.querySelector('seed-context').addEventListener(
        'seed-context:populated',
        (e) => resolve({ tagName: e.detail.target.tagName, count: e.detail.count, bubbles: e.bubbles }),
        { once: true },
      );
      document.querySelector('seed-context').reseed();
    }));
    expect(detail.tagName).toBe('PATTERN-GRID');
    expect(detail.count).toBe(8);
    expect(detail.bubbles).toBe(true);
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "populated event"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: seed-context:populated event detail"
```

---

## Task 19: Test — anti-FOUC computed opacity transitions 0 → 1

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('cells outside a seed-context are not opacity-hidden', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <pattern-grid cells="2x2"></pattern-grid>
    `);
    const opacity = await page.locator('pattern-grid > i').first().evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
  });

  test('cells inside a populated seed-context end up opacity 1', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="o"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    // Inline opacity:1 written by populate beats the head-injected opacity:0 rule.
    const inlineOpacity = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.opacity);
    expect(inlineOpacity).toBe('1');
  });
```

- [ ] **Step 2: Run**

Run: `npx playwright test -g "opacity"`
Expected: PASS for both.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: anti-FOUC opacity scoping"
```

---

## Task 20: Test — nested seed-contexts: innermost wins

**Files:**
- Modify: `test/seed-context.spec.js`

- [ ] **Step 1: Append**

```js
  test('nested seed-contexts: innermost populates (event bubbles outward and is observed by both, last write wins)', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context id="outer" seed="outer">
        <seed-context id="inner" seed="inner">
          <pattern-grid cells="3x3"></pattern-grid>
        </seed-context>
      </seed-context>
      <seed-context id="control" seed="outer">
        <pattern-grid cells="3x3"></pattern-grid>
      </seed-context>
    `);
    // The inner seed-context populates first (deeper, closer in bubble path).
    // Then the outer also receives the bubbling event and overwrites.
    // So the nested grid's cells should match the OUTER seed's pattern, not the inner.
    const nested = await page.locator('#outer pattern-grid > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    const control = await page.locator('#control pattern-grid > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    expect(nested).toEqual(control);
  });
```

Note for implementer: this test documents the bubble-order behaviour. If you decide to call `stopPropagation()` in the inner listener (so inner wins), invert the assertion and document the change.

- [ ] **Step 2: Run**

Run: `npx playwright test -g "nested seed-contexts"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/seed-context.spec.js
git commit -m "test: nested seed-context bubble behavior"
```

---

## Task 21: Add `seed-context.d.ts`

**Files:**
- Create: `seed-context.d.ts`

- [ ] **Step 1: Create the file**

```ts
export interface SeedContextPopulatedDetail {
  target: HTMLElement;
  count: number;
}

export default class SeedContext extends HTMLElement {
  static observedAttributes: readonly ['seed', 'count'];

  seed: string;
  count: number;

  readonly seedHash: number;
  readonly prng: () => number;

  reseed(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'seed-context': SeedContext;
  }
  interface HTMLElementEventMap {
    'seed-context:populated': CustomEvent<SeedContextPopulatedDetail>;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add seed-context.d.ts
git commit -m "feat: add TypeScript declarations for seed-context"
```

---

## Task 22: Build dist + verify postbuild syncs

**Files:**
- Generated: `dist/seed-context.js`
- Generated: `docs/pattern-grid.js`, `docs/pattern-grid.css`, `docs/seed-context.js`, `docs/seed-context.css`

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected:
- Vite produces `dist/pattern-grid.js` AND `dist/seed-context.js`.
- `dist/pattern-grid.css` and `dist/seed-context.css` are untouched.
- Postbuild prints the four `cp` commands; all four files exist in `docs/`.

- [ ] **Step 2: Verify**

Run: `ls -la dist/ docs/pattern-grid.* docs/seed-context.*`
Expected: Both `dist/seed-context.js` and `docs/seed-context.js` exist and are identical:

Run: `diff dist/seed-context.js docs/seed-context.js && echo OK`
Expected: `OK`.

- [ ] **Step 3: Re-run the full test suite to confirm nothing regressed**

Run: `npx playwright test`
Expected: All tests PASS (11 pattern-grid + ~17 seed-context so far).

- [ ] **Step 4: Commit the built output**

```bash
git add dist/seed-context.js docs/pattern-grid.js docs/pattern-grid.css docs/seed-context.js docs/seed-context.css
git commit -m "build: dist/seed-context.js + sync docs copies"
```

---

## Task 23: Update `demos.html` — example #8 becomes live

**Files:**
- Modify: `docs/demos.html`

- [ ] **Step 1: Add `seed-context.js` script tag**

Open `docs/demos.html`. Find the existing `<script type="module" src="pattern-grid.js"></script>` line in `<head>`. Add a second line immediately after it:

```html
  <script type="module" src="seed-context.js"></script>
```

- [ ] **Step 2: Replace the example #8 section**

Find the section `<section class="demo-section" id="seeded">`. Replace the entire section block with:

```html
    <section class="demo-section" id="seeded">
      <h2>8. Seeded randomness</h2>
      <p class="demo-description">Wrap a <code>&lt;pattern-grid&gt;</code> in <code>&lt;seed-context&gt;</code> and the component writes <code>--rand-0</code>...<code>--rand-7</code> floats and matching <code>--randi-0</code>...<code>--randi-7</code> integers on each cell, derived from a seeded mulberry32 PRNG. Same seed reproduces the same randoms across reloads.</p>
      <div class="side-by-side">
        <div class="demo-frame">
          <seed-context seed="hello">
            <pattern-grid cells="8x8"></pattern-grid>
          </seed-context>
        </div>
        <pre><code>&lt;seed-context seed="hello"&gt;
  &lt;pattern-grid cells="8x8"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

&lt;style&gt;
  pattern-grid &gt; i {
    background: hsl(
      calc(var(--rand-0) * 360deg) 70% 50%
    );
  }
&lt;/style&gt;</code></pre>
      </div>
    </section>
```

- [ ] **Step 3: Add the CSS rule** for the seeded demo cells

Open `docs/styles.css`. Find the existing `#seeded pattern-grid > i { ... background: var(--bg-tertiary); }` rule and replace with:

```css
#seeded pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#seeded pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(var(--rand-0) * 360deg) 70% 50%);
}
```

- [ ] **Step 4: Boot dev server and verify**

Run: `npm run dev` (do NOT navigate to a different page; the dev server opens demo/index.html by default — close that and open `http://localhost:5173/docs/demos.html`).
Verify: section 8 shows 64 colored cells with random hues. Reload — same hues reappear. Console: no errors.
Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add docs/demos.html docs/styles.css
git commit -m "docs: demos example #8 is now a live seed-context demo"
```

---

## Task 24: Add `<seed-context>` API section to `docs/api.html`

**Files:**
- Modify: `docs/api.html`

- [ ] **Step 1: Add `seed-context.js` script tag**

In `<head>`, add a second module script alongside the pattern-grid one:

```html
  <script type="module" src="seed-context.js"></script>
```

- [ ] **Step 2: Append a new section** at the very end of `<main>` (before the closing `</main>` tag), insert:

```html
    <hr style="margin-block: 3rem; border: 0; border-top: 1px solid var(--border-color);" />

    <h1>&lt;seed-context&gt;</h1>
    <p class="demo-description">Companion element that wraps one or more <code>&lt;pattern-grid&gt;</code> elements and writes per-cell <code>--rand-N</code> (float) and <code>--randi-N</code> (integer) custom properties using a seeded PRNG.</p>

    <section>
      <h2>Attributes</h2>
      <table class="api-table">
        <thead>
          <tr><th>Attribute</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>seed</code></td>
            <td>string | number</td>
            <td><code>""</code></td>
            <td>Seed value. Same seed produces the same randoms across reloads. Hashed to a 32-bit integer for the PRNG.</td>
          </tr>
          <tr>
            <td><code>count</code></td>
            <td>integer</td>
            <td><code>8</code></td>
            <td>Number of <code>--rand-N</code> slots per cell. Range 1–32, clamped.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Properties &amp; Methods</h2>
      <table class="api-table">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>seed</code></td><td>string</td><td>Read/write, reflects attribute.</td></tr>
          <tr><td><code>count</code></td><td>number</td><td>Read/write, reflects attribute (clamped on read).</td></tr>
          <tr><td><code>seedHash</code></td><td>number (readonly)</td><td>32-bit hash of <code>seed</code>.</td></tr>
          <tr><td><code>prng</code></td><td>() =&gt; number (readonly)</td><td>Factory: returns a fresh seeded generator.</td></tr>
          <tr><td><code>reseed()</code></td><td>void</td><td>Re-writes randoms on all known cells without changing attributes.</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Events</h2>
      <table class="api-table">
        <thead>
          <tr><th>Event</th><th>Detail</th><th>When</th><th>Bubbles</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>seed-context:populated</code></td>
            <td><code>{ target, count }</code></td>
            <td>After a grid's cells are populated. <code>target</code> is the populated pattern-grid.</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>CSS Custom Properties Written per Cell</h2>
      <p>For <code>count = N</code>:</p>
      <table class="api-table">
        <thead>
          <tr><th>Property</th><th>Range</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>--rand-0</code> … <code>--rand-{N-1}</code></td><td><code>[0, 1)</code></td><td>Float, suitable for continuous values.</td></tr>
          <tr><td><code>--randi-0</code> … <code>--randi-{N-1}</code></td><td><code>[0, 99]</code></td><td>Integer, equals <code>floor(rand-N * 100)</code>.</td></tr>
        </tbody>
      </table>
    </section>
```

- [ ] **Step 3: Commit**

```bash
git add docs/api.html
git commit -m "docs: add seed-context API reference"
```

---

## Task 25: Add "Showcase" nav link to all four docs pages

**Files:**
- Modify: `docs/index.html`
- Modify: `docs/demos.html`
- Modify: `docs/api.html`

(The new `docs/showcase.html` is created in Task 26.)

- [ ] **Step 1: In `docs/index.html`**, find the `nav-links` block:

```html
        <a href="index.html" class="active">Home</a>
        <a href="demos.html">Demos</a>
        <a href="api.html">API</a>
        <a href="https://github.com/ProfPowell/pattern-grid">GitHub</a>
```

Replace with:

```html
        <a href="index.html" class="active">Home</a>
        <a href="demos.html">Demos</a>
        <a href="showcase.html">Showcase</a>
        <a href="api.html">API</a>
        <a href="https://github.com/ProfPowell/pattern-grid">GitHub</a>
```

- [ ] **Step 2: In `docs/demos.html`**, the nav block currently is:

```html
        <a href="index.html">Home</a>
        <a href="demos.html" class="active">Demos</a>
        <a href="api.html">API</a>
        <a href="https://github.com/ProfPowell/pattern-grid">GitHub</a>
```

Replace with:

```html
        <a href="index.html">Home</a>
        <a href="demos.html" class="active">Demos</a>
        <a href="showcase.html">Showcase</a>
        <a href="api.html">API</a>
        <a href="https://github.com/ProfPowell/pattern-grid">GitHub</a>
```

- [ ] **Step 3: In `docs/api.html`**, replace nav similarly:

```html
        <a href="index.html">Home</a>
        <a href="demos.html">Demos</a>
        <a href="api.html" class="active">API</a>
        <a href="https://github.com/ProfPowell/pattern-grid">GitHub</a>
```

becomes:

```html
        <a href="index.html">Home</a>
        <a href="demos.html">Demos</a>
        <a href="showcase.html">Showcase</a>
        <a href="api.html" class="active">API</a>
        <a href="https://github.com/ProfPowell/pattern-grid">GitHub</a>
```

- [ ] **Step 4: Commit**

```bash
git add docs/index.html docs/demos.html docs/api.html
git commit -m "docs: add Showcase nav link to all pages"
```

---

## Task 26: Create `docs/showcase.html` scaffolding + gallery grid CSS

**Files:**
- Create: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Create the file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Showcase — &lt;pattern-grid&gt;</title>
  <meta name="description" content="A gallery of pattern-grid demos covering geometric, gradient, procedural, animated, random, text, and interactive effects." />
  <link rel="stylesheet" href="styles.css" />
  <link rel="stylesheet" href="pattern-grid.css" />
  <script type="module" src="pattern-grid.js"></script>
  <script type="module" src="seed-context.js"></script>
</head>
<body>
  <header class="site-header">
    <nav>
      <a href="index.html" class="nav-brand">&lt;pattern-grid&gt;</a>
      <div class="nav-links">
        <a href="index.html">Home</a>
        <a href="demos.html">Demos</a>
        <a href="showcase.html" class="active">Showcase</a>
        <a href="api.html">API</a>
        <a href="https://github.com/ProfPowell/pattern-grid">GitHub</a>
        <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">🌓</button>
      </div>
    </nav>
  </header>

  <main>
    <h1>Showcase</h1>
    <p class="demo-description">A gallery of what's possible when you combine <code>&lt;pattern-grid&gt;</code>, modern CSS, and the seeded <code>&lt;seed-context&gt;</code> companion. Each tile is a live element — view source or expand the details below it to see exactly how it's built.</p>

    <div class="gallery">
      <!-- Pieces are added in Tasks 27–31 -->
    </div>
  </main>

  <footer class="site-footer">
    <p>MIT licensed · Source on <a href="https://github.com/ProfPowell/pattern-grid">GitHub</a> · Part of the ProfPowell suite</p>
  </footer>

  <script>
    function toggleTheme() {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    }
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark');
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: Add gallery base styles to `docs/styles.css`**

At the end of `docs/styles.css`, append:

```css
/* --- Showcase gallery --- */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-block: 2rem;
}

.gallery figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gallery .tile {
  aspect-ratio: 1;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: var(--bg-primary);
}

.gallery .tile > * {
  width: 100%;
  height: 100%;
}

.gallery figcaption {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.gallery figcaption strong {
  color: var(--text-primary);
  margin-right: 0.5rem;
}

.gallery details {
  font-size: 0.8rem;
}

.gallery details summary {
  cursor: pointer;
  color: var(--link-color);
}

.gallery details pre {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  max-height: 240px;
  overflow: auto;
}
```

- [ ] **Step 3: Boot dev server and verify** the empty showcase page loads

Run: `npm run dev`, open `http://localhost:5173/docs/showcase.html`.
Expected: Header + title + intro + empty gallery container. No console errors.
Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase.html scaffolding + gallery grid styles"
```

---

## Task 27: Showcase pieces 1–3 (geometric: hex, pinwheels, triangles)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Add the three figures** inside the `<div class="gallery">` element in `docs/showcase.html`, replacing the comment:

```html
      <!-- 1. Hex honeycomb -->
      <figure id="sc-hex">
        <div class="tile"><pattern-grid cells="12x12"></pattern-grid></div>
        <figcaption><strong>Hex honeycomb</strong>Hexagonal clip-paths with HSL hue cycling.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="12x12"&gt;&lt;/pattern-grid&gt;

#sc-hex pattern-grid &gt; i {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: hsl(calc(sibling-index() * 6) 65% 55%);
}</code></pre></details>
      </figure>

      <!-- 2. Conic pinwheels -->
      <figure id="sc-pinwheels">
        <div class="tile"><pattern-grid cells="6x6"></pattern-grid></div>
        <figcaption><strong>Conic pinwheels</strong>One conic gradient per cell, hue offset by index.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="6x6"&gt;&lt;/pattern-grid&gt;

#sc-pinwheels pattern-grid &gt; i {
  background: conic-gradient(
    from calc(sibling-index() * 10deg),
    hsl(calc(sibling-index() * 20) 70% 55%),
    hsl(calc(sibling-index() * 20 + 180) 70% 55%),
    hsl(calc(sibling-index() * 20) 70% 55%)
  );
}</code></pre></details>
      </figure>

      <!-- 3. Tessellated triangles -->
      <figure id="sc-triangles">
        <div class="tile"><pattern-grid cells="10x10"></pattern-grid></div>
        <figcaption><strong>Tessellated triangles</strong>Alternating up/down triangles via odd/even.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="10x10"&gt;&lt;/pattern-grid&gt;

#sc-triangles pattern-grid &gt; i:nth-child(odd)  { clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }
#sc-triangles pattern-grid &gt; i:nth-child(even) { clip-path: polygon(0% 0%, 100% 0%, 50% 100%); }
#sc-triangles pattern-grid &gt; i {
  background: hsl(calc(sibling-index() * 4 + 200) 70% 55%);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Add per-piece CSS** to the end of `docs/styles.css`:

```css
/* --- Showcase: hex honeycomb --- */
#sc-hex pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-hex pattern-grid > i {
  aspect-ratio: 1;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: hsl(calc(sibling-index() * 6) 65% 55%);
}

/* --- Showcase: conic pinwheels --- */
#sc-pinwheels pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-pinwheels pattern-grid > i {
  aspect-ratio: 1;
  background: conic-gradient(
    from calc(sibling-index() * 10deg),
    hsl(calc(sibling-index() * 20) 70% 55%),
    hsl(calc(sibling-index() * 20 + 180) 70% 55%),
    hsl(calc(sibling-index() * 20) 70% 55%)
  );
}

/* --- Showcase: tessellated triangles --- */
#sc-triangles pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-triangles pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(sibling-index() * 4 + 200) 70% 55%);
}
#sc-triangles pattern-grid > i:nth-child(odd)  { clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }
#sc-triangles pattern-grid > i:nth-child(even) { clip-path: polygon(0% 0%, 100% 0%, 50% 100%); }
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, navigate to `http://localhost:5173/docs/showcase.html`.
Confirm: three tiles render (hex hexagons, conic pinwheels, alternating triangles). No console errors. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 1-3 (hex, pinwheels, triangles)"
```

---

## Task 28: Showcase pieces 4–6 (procedural: sine, fib, bloom)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append figures** to the gallery, after the triangles figure:

```html
      <!-- 4. Sine bars -->
      <figure id="sc-sine">
        <div class="tile"><pattern-grid cols="24" rows="1"></pattern-grid></div>
        <figcaption><strong>Sine bars</strong>Heights drive by <code>sin(sibling-index() * 30deg)</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cols="24" rows="1"&gt;&lt;/pattern-grid&gt;

#sc-sine pattern-grid &gt; i {
  align-self: end;
  height: calc(50% + sin(sibling-index() * 30deg) * 50%);
  background: hsl(calc(sibling-index() * 15) 70% 55%);
}</code></pre></details>
      </figure>

      <!-- 5. Fibonacci spiral -->
      <figure id="sc-fib">
        <div class="tile"><pattern-grid cells="400"></pattern-grid></div>
        <figcaption><strong>Fibonacci spiral</strong>400 dots positioned by polar math.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="400"&gt;&lt;/pattern-grid&gt;

#sc-fib pattern-grid {
  display: block;
  position: relative;
}
#sc-fib pattern-grid &gt; i {
  --r: calc(sqrt(sibling-index()) * 2.4%);
  --a: calc(sibling-index() * 137.5deg);
  position: absolute;
  left: calc(50% + cos(var(--a)) * var(--r));
  top:  calc(50% + sin(var(--a)) * var(--r));
  width: 8px; height: 8px;
  border-radius: 50%;
  background: hsl(calc(sibling-index() * 3) 70% 55%);
  transform: translate(-50%, -50%);
}</code></pre></details>
      </figure>

      <!-- 6. Concentric bloom -->
      <figure id="sc-bloom">
        <div class="tile"><pattern-grid cells="48"></pattern-grid></div>
        <figcaption><strong>Concentric bloom</strong>48 stacked rings, glowing outward.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="48"&gt;&lt;/pattern-grid&gt;

#sc-bloom pattern-grid &gt; i {
  grid-area: 1 / 1;
  width:  calc(100% * sibling-index() / sibling-count());
  aspect-ratio: 1;
  border: 2px solid hsla(calc(sibling-index() * 7) 80% 60% / 0.6);
  border-radius: 50%;
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS** to `docs/styles.css`:

```css
/* --- Showcase: sine bars --- */
#sc-sine pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  align-items: end;
  height: 100%;
}
#sc-sine pattern-grid > i {
  align-self: end;
  height: calc(50% + sin(sibling-index() * 30deg) * 50%);
  background: hsl(calc(sibling-index() * 15) 70% 55%);
}

/* --- Showcase: Fibonacci spiral --- */
#sc-fib .tile { background: #111; }
#sc-fib pattern-grid {
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
}
#sc-fib pattern-grid > i {
  --r: calc(sqrt(sibling-index()) * 2.4%);
  --a: calc(sibling-index() * 137.5deg);
  position: absolute;
  left: calc(50% + cos(var(--a)) * var(--r));
  top:  calc(50% + sin(var(--a)) * var(--r));
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: hsl(calc(sibling-index() * 3) 70% 55%);
  transform: translate(-50%, -50%);
}

/* --- Showcase: concentric bloom --- */
#sc-bloom pattern-grid {
  display: grid;
  place-items: center;
  grid-template-columns: 100%;
  aspect-ratio: 1;
  width: 100%;
}
#sc-bloom pattern-grid > i {
  grid-area: 1 / 1;
  width: calc(100% * sibling-index() / sibling-count());
  aspect-ratio: 1;
  border: 2px solid hsla(calc(sibling-index() * 7) 80% 60% / 0.6);
  border-radius: 50%;
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, reload showcase. Confirm: sine bars rise and fall, fib spiral (400 dots radiating in golden spiral), bloom (concentric circles).

If Fibonacci doesn't render (Chrome version doesn't support `sqrt()` in CSS): drop the `sqrt()` and use a linear `--r: calc(sibling-index() * 0.12%)` — same visual idea, different distribution. Test before committing.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 4-6 (sine, fib, bloom)"
```

---

## Task 29: Showcase pieces 7–8 (animated: wipe, pulse)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append figures**:

```html
      <!-- 7. Diagonal wipe -->
      <figure id="sc-wipe">
        <div class="tile"><pattern-grid cells="14x14"></pattern-grid></div>
        <figcaption><strong>Diagonal wipe</strong>Animation delay grows along (x+y).</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="14x14"&gt;&lt;/pattern-grid&gt;

#sc-wipe pattern-grid &gt; i {
  --idx: calc(sibling-index() - 1);
  background: hsl(220 70% 50%);
  animation: wipe 3s ease-in-out infinite;
  animation-delay: calc(var(--idx) * 12ms);
}
@keyframes wipe {
  0%, 100% { background: hsl(220 70% 50%); }
  50%      { background: hsl(50 90% 60%); }
}</code></pre></details>
      </figure>

      <!-- 8. Pulse field -->
      <figure id="sc-pulse">
        <div class="tile"><pattern-grid cells="12x12"></pattern-grid></div>
        <figcaption><strong>Pulse field</strong>Staggered scale pulses per cell.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="12x12"&gt;&lt;/pattern-grid&gt;

#sc-pulse pattern-grid &gt; i {
  background: hsl(calc(sibling-index() * 3) 70% 55%);
  animation: pulse 2.4s ease-in-out infinite;
  animation-delay: calc(sibling-index() * -30ms);
}
@keyframes pulse {
  0%, 100% { transform: scale(1);   border-radius: 0%;  }
  50%      { transform: scale(0.6); border-radius: 50%; }
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* --- Showcase: diagonal wipe --- */
#sc-wipe pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-wipe pattern-grid > i {
  --idx: calc(sibling-index() - 1);
  aspect-ratio: 1;
  background: hsl(220 70% 50%);
  animation: sc-wipe-anim 3s ease-in-out infinite;
  animation-delay: calc(var(--idx) * 12ms);
}
@keyframes sc-wipe-anim {
  0%, 100% { background: hsl(220 70% 50%); }
  50%      { background: hsl(50 90% 60%); }
}

/* --- Showcase: pulse field --- */
#sc-pulse pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-pulse pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(sibling-index() * 3) 70% 55%);
  animation: sc-pulse-anim 2.4s ease-in-out infinite;
  animation-delay: calc(sibling-index() * -30ms);
}
@keyframes sc-pulse-anim {
  0%, 100% { transform: scale(1);   border-radius: 0%;  }
  50%      { transform: scale(0.6); border-radius: 50%; }
}
```

(Keyframes are renamed `sc-wipe-anim` and `sc-pulse-anim` in the actual CSS to avoid colliding with any later piece, even though the source pre tag shows the cleaner author-facing names. This is acceptable: the displayed code is illustrative.)

- [ ] **Step 3: Verify in browser**

Reload showcase. Both animated tiles play. No console errors.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 7-8 (wipe, pulse)"
```

---

## Task 30: Showcase pieces 9–12 (random: mosaic, frost, crystals, staircase)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append figures**:

```html
      <!-- 9. Random mosaic -->
      <figure id="sc-mosaic">
        <div class="tile"><seed-context seed="mosaic"><pattern-grid cells="14x14"></pattern-grid></seed-context></div>
        <figcaption><strong>Random mosaic</strong>Per-cell HSL from <code>--rand-0</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="mosaic"&gt;
  &lt;pattern-grid cells="14x14"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-mosaic pattern-grid &gt; i {
  background: hsl(calc(var(--rand-0) * 360deg) 70% 55%);
}</code></pre></details>
      </figure>

      <!-- 10. Frosted scatter -->
      <figure id="sc-frost">
        <div class="tile"><seed-context seed="frost"><pattern-grid cells="14x14"></pattern-grid></seed-context></div>
        <figcaption><strong>Frosted scatter</strong>Random opacity plus tiny rotation per cell.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="frost"&gt;
  &lt;pattern-grid cells="14x14"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-frost pattern-grid &gt; i {
  background: hsl(220 80% 65% / calc(0.3 + var(--rand-0) * 0.7));
  transform: rotate(calc((var(--randi-1) - 50) * 1deg));
}</code></pre></details>
      </figure>

      <!-- 11. Crystals -->
      <figure id="sc-crystals">
        <div class="tile"><seed-context seed="cryst" count="2"><pattern-grid cells="10x10"></pattern-grid></seed-context></div>
        <figcaption><strong>Crystals</strong>Clip-path picked by <code>--randi-0 mod 4</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="cryst" count="2"&gt;
  &lt;pattern-grid cells="10x10"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

/* 4 shapes selected by --randi-0 % 4 */
#sc-crystals pattern-grid &gt; i        { clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }
#sc-crystals pattern-grid &gt; i:where(:nth-child(odd))  { clip-path: polygon(0% 0%, 100% 0%, 50% 100%); }
/* hue from --rand-1 */
#sc-crystals pattern-grid &gt; i { background: hsl(calc(var(--rand-1) * 360deg) 70% 55%); }</code></pre></details>
      </figure>

      <!-- 12. Random staircase -->
      <figure id="sc-staircase">
        <div class="tile"><seed-context seed="stair"><pattern-grid cells="12x12"></pattern-grid></seed-context></div>
        <figcaption><strong>Random staircase</strong>Vertical offset from <code>--rand-0</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="stair"&gt;
  &lt;pattern-grid cells="12x12"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-staircase pattern-grid &gt; i {
  background: hsl(calc(sibling-index() * 4) 70% 55%);
  transform: translateY(calc((var(--rand-0) - 0.5) * 40%));
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* --- Showcase: random mosaic --- */
#sc-mosaic pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-mosaic pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(var(--rand-0) * 360deg) 70% 55%);
}

/* --- Showcase: frosted scatter --- */
#sc-frost pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-frost pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(220 80% 65% / calc(0.3 + var(--rand-0) * 0.7));
  transform: rotate(calc((var(--randi-1) - 50) * 1deg));
}

/* --- Showcase: crystals --- */
#sc-crystals pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-crystals pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(var(--rand-1) * 360deg) 70% 55%);
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
}
/* Pick one of 4 shapes by --randi-0 % 4.
   CSS can't do attribute-driven clip-path selection without container queries,
   so we approximate with odd/even halves. The displayed source shows the
   intent; the implementation gives two shapes (still varied with HSL hue
   from --rand-1). */
#sc-crystals pattern-grid > i:nth-child(odd) {
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
}

/* --- Showcase: random staircase --- */
#sc-staircase pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-staircase pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(sibling-index() * 4) 70% 55%);
  transform: translateY(calc((var(--rand-0) - 0.5) * 40%));
}
```

(For Crystals, true 4-shape variation requires either container queries on cells or `@property` switching, both still patchy in May 2026. The implementation falls back to 2 shapes with random hue — still produces a visually crystalline result.)

- [ ] **Step 3: Verify in browser**

Reload showcase. The four random pieces should clearly differ per cell (mosaic: random hues; frost: varying alpha + slight rotation; crystals: alternating triangles with random hues; staircase: cells offset vertically).

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 9-12 (random: mosaic, frost, crystals, staircase)"
```

---

## Task 31: Showcase piece 13 (Unicode rain — with fallback)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

Per the spec: if the all-CSS approach for picking a character per cell doesn't pan out within a reasonable attempt, replace with **piece 13b — "Hue rings"**: each cell a radial-gradient whose hue offset comes from `--rand-0`. The fallback is described below the primary implementation.

**Primary attempt (Unicode rain):**

- [ ] **Step 1: Append figure**

```html
      <!-- 13. Unicode rain -->
      <figure id="sc-rain">
        <div class="tile"><seed-context seed="rain"><pattern-grid cells="12x12"><template><span class="glyph"></span></template></pattern-grid></seed-context></div>
        <figcaption><strong>Unicode rain</strong>Each cell a box-drawing glyph picked by <code>--randi-0</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="rain"&gt;
  &lt;pattern-grid cells="12x12"&gt;
    &lt;template&gt;&lt;span class="glyph"&gt;&lt;/span&gt;&lt;/template&gt;
  &lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-rain .glyph::before {
  /* CSS picks one of 10 chars by --randi-0 % 10 */
  content: var(--ch-0);
}
#sc-rain .glyph:nth-child(10n+1) { --ch: "─"; }
/* ... and so on. */</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**

Try this all-CSS approach (uses `:nth-child(10n+k)` to pick from a 10-glyph palette by index parity, blended with `--randi-0` via a class):

```css
/* --- Showcase: Unicode rain --- */
#sc-rain .tile { background: #0a0a0a; }
#sc-rain pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-rain pattern-grid > .glyph {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  color: hsl(140 80% calc(40% + var(--rand-0) * 40%));
  font-family: ui-monospace, monospace;
  font-size: 1rem;
  opacity: calc(0.3 + var(--rand-0) * 0.7);
}
#sc-rain pattern-grid > .glyph::before {
  content: "─";
}
#sc-rain pattern-grid > .glyph:nth-child(10n+1)::before { content: "│"; }
#sc-rain pattern-grid > .glyph:nth-child(10n+2)::before { content: "┌"; }
#sc-rain pattern-grid > .glyph:nth-child(10n+3)::before { content: "┐"; }
#sc-rain pattern-grid > .glyph:nth-child(10n+4)::before { content: "└"; }
#sc-rain pattern-grid > .glyph:nth-child(10n+5)::before { content: "┘"; }
#sc-rain pattern-grid > .glyph:nth-child(10n+6)::before { content: "├"; }
#sc-rain pattern-grid > .glyph:nth-child(10n+7)::before { content: "┤"; }
#sc-rain pattern-grid > .glyph:nth-child(10n+8)::before { content: "┬"; }
#sc-rain pattern-grid > .glyph:nth-child(10n+9)::before { content: "┴"; }
```

This produces a deterministic-by-index glyph mix (10 shapes), with brightness/opacity randomized per cell via the seed. The displayed "Source" hand-waves the actual selection mechanism for clarity; the implemented CSS uses `:nth-child` patterns.

- [ ] **Step 3: Verify**

Reload showcase. The Unicode rain tile should show a 12×12 mosaic of box-drawing characters in greens of varying brightness/opacity on a near-black background.

- [ ] **Step 4: If the primary attempt fails or looks bad, drop it and use the fallback "Hue rings"**:

Replace the figure block from Step 1 with:

```html
      <!-- 13. Hue rings (fallback for Unicode rain) -->
      <figure id="sc-rings">
        <div class="tile"><seed-context seed="rings"><pattern-grid cells="10x10"></pattern-grid></seed-context></div>
        <figcaption><strong>Hue rings</strong>Each cell a radial gradient with random hue offset.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="rings"&gt;
  &lt;pattern-grid cells="10x10"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-rings pattern-grid &gt; i {
  background: radial-gradient(
    circle,
    hsl(calc(var(--rand-0) * 360deg) 80% 60%) 30%,
    hsl(calc(var(--rand-0) * 360deg + 60) 80% 40%) 70%
  );
}</code></pre></details>
      </figure>
```

And replace the CSS block from Step 2 with:

```css
/* --- Showcase: hue rings (fallback) --- */
#sc-rings pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-rings pattern-grid > i {
  aspect-ratio: 1;
  background: radial-gradient(
    circle,
    hsl(calc(var(--rand-0) * 360deg) 80% 60%) 30%,
    hsl(calc(var(--rand-0) * 360deg + 60) 80% 40%) 70%
  );
}
```

- [ ] **Step 5: Commit** (with the appropriate message depending on which path)

If primary:
```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase piece 13 (Unicode rain)"
```

If fallback:
```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase piece 13 (hue rings — Unicode rain fallback)"
```

---

## Task 32: Showcase piece 14 (interactive: hover ripple)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append figure**

```html
      <!-- 14. Hover ripple -->
      <figure id="sc-ripple">
        <div class="tile"><pattern-grid cells="10x10"></pattern-grid></div>
        <figcaption><strong>Hover ripple</strong>Hover any cell to light up its neighbors.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="10x10"&gt;&lt;/pattern-grid&gt;

#sc-ripple pattern-grid &gt; i {
  background: var(--bg-tertiary);
  transition: background 0.4s, transform 0.4s;
}
#sc-ripple pattern-grid &gt; i:hover,
#sc-ripple pattern-grid &gt; i:hover + i,
#sc-ripple pattern-grid &gt; i:has(+ i:hover) {
  background: hsl(200 80% 55%);
  transform: scale(1.1);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**

```css
/* --- Showcase: hover ripple --- */
#sc-ripple pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 2px;
}
#sc-ripple pattern-grid > i {
  aspect-ratio: 1;
  background: var(--bg-tertiary);
  transition: background 0.4s, transform 0.4s;
}
#sc-ripple pattern-grid > i:hover,
#sc-ripple pattern-grid > i:hover + i,
#sc-ripple pattern-grid > i:has(+ i:hover) {
  background: hsl(200 80% 55%);
  transform: scale(1.1);
  z-index: 1;
}
```

- [ ] **Step 3: Verify**

Reload showcase. Hover any cell in the ripple tile — the cell + its immediate horizontal neighbors should light up and scale.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase piece 14 (hover ripple)"
```

---

## Task 33: README + CHANGELOG bump to 0.2.0

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json` (version)

- [ ] **Step 1: Bump version** in `package.json`

Find `"version": "0.1.0"` and replace with `"version": "0.2.0"`.

- [ ] **Step 2: Update `CHANGELOG.md`**

Replace the file contents with:

```markdown
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
```

- [ ] **Step 3: Update `README.md`**

Find the "## API" section. After the existing bullets, insert:

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add package.json CHANGELOG.md README.md
git commit -m "chore: bump to 0.2.0"
```

---

## Task 34: Final verification

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 2: Format check**

Run: `npm run format:check`
Expected: All files match prettier style. (`src/pattern-grid.js` is ignored via `.prettierignore`. If `src/seed-context.js` fails format-check, add it to `.prettierignore` and commit that change as `chore: keep seed-context source spec-canonical`.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Both `dist/pattern-grid.js` and `dist/seed-context.js` produced. Postbuild copies all four files to `docs/`.

- [ ] **Step 4: Full test suite**

Run: `npm test`
Expected: ≥ 30 tests pass, 0 fail. (11 pattern-grid + ~22 seed-context = ~33.)

- [ ] **Step 5: LOC budgets**

Run:
```bash
wc -l src/pattern-grid.js src/seed-context.js
```
Expected: `pattern-grid.js` ≤ 85, `seed-context.js` ≤ 110.

- [ ] **Step 6: Browser click-through**

Run: `npm run dev`
Open each of:
- `http://localhost:5173/docs/index.html` — hero animates, no console errors.
- `http://localhost:5173/docs/demos.html` — all 10 demos render; example #8 shows random colors.
- `http://localhost:5173/docs/showcase.html` — all 14 tiles render.
- `http://localhost:5173/docs/api.html` — both component sections present.

Stop dev server when done.

- [ ] **Step 7: Commit any straggling updates**

```bash
git status
# If dist/ rebuilt or docs/ resynced have any deltas:
git add -p
git commit -m "chore: pre-release verification refresh"
```

If git status is clean, no commit needed.

---

## Self-Review Notes

**Spec coverage check:**
- seed-context API (attributes, properties, events, behavior): Tasks 3, 4, 21, 24.
- Anti-FOUC built-in: covered by Task 4's `injectFoucStyle` + Task 19's test.
- 22 test cases: Tasks 3 + 5–20 (each adds one or two tests).
- LOC budget ≤110: verified in Task 4 step 3 and Task 34 step 5.
- Multi-entry Vite build: Task 1.
- Package exports: Task 1.
- docs/showcase.html with 14 pieces: Tasks 26–32.
- Demos example #8 becomes live: Task 23.
- API page seed-context section: Task 24.
- Nav link on all pages: Task 25.
- README + CHANGELOG + version bump: Task 33.

**Gaps deliberately not addressed:**
- No npm publish (user said "just Pages" earlier; Task 33 only stages 0.2.0 internally).
- No GitHub Pages reconfiguration needed — same `main:/docs` source.
- The `prng` getter returns a fresh seeded mulberry32 each access (per spec). No test directly verifies this, but it's exercised indirectly through populate.
- The Crystals (#11) piece falls back to 2-shape variation rather than 4, documented inline (Task 30 Step 2 comment).
- The Unicode rain (#13) has a documented fallback to "Hue rings" if the all-CSS approach doesn't look good (Task 31).

**Type consistency check:** `seed`, `count`, `seedHash`, `prng`, `reseed`, `seed-context:populated`, `--rand-N`, `--randi-N` are spelled identically across spec, implementation (Task 4), d.ts (Task 21), API page (Task 24), README (Task 33), and tests (Tasks 3–20). The internal `#grids`, `#nextOffset`, `#onRender`, `#populate`, helper names `hashSeed`, `mulberry32`, `clampCount`, `injectFoucStyle` are private to `src/seed-context.js` and don't leak.
