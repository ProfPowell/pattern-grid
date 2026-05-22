# Platform Showcase + `<paint-worklet>` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `<paint-worklet>` companion element (~25 LOC) and 10 new showcase pieces (numbered 34–43) under a new "Modern platform showcase" section, demonstrating platform features that css-doodle's Shadow-DOM/DSL architecture cannot reach.

**Architecture:** New companion element mirrors `<seed-context>` pattern — separate `src/paint-worklet.js`, separate `dist/paint-worklet.js` build entry, separate package export, optional/deletable. Showcase pieces are pure markup + scoped CSS appended to `docs/showcase.html` and `docs/styles.css`. `src/pattern-grid.js` is untouched.

**Tech Stack:** Vanilla JS (ES2022, private methods), Vite (build), Playwright (tests), Houdini Paint Worklet API, View Transitions API, Anchor Positioning, Popover API, `animation-timeline: view()`, `:has()`, `color-mix()`, Web Audio API.

**Spec:** `docs/superpowers/specs/2026-05-21-platform-showcase-design.md`

---

## File Structure

**New files:**
- `src/paint-worklet.js` — companion element (~30 LOC with JSDoc)
- `paint-worklet.d.ts` — TypeScript definitions
- `test/paint-worklet.spec.js` — Playwright tests
- `docs/worklets/swirl.js` — demo paint worklet (~35 LOC)

**Modified files:**
- `vite.config.js` — add paint-worklet build entry
- `package.json` — add export entry, bump to 0.3.0
- `docs/showcase.html` — append section + 10 pieces
- `docs/styles.css` — append per-piece styles
- `CHANGELOG.md` — 0.3.0 entry
- `README.md` — one bullet

**Untouched:**
- `src/pattern-grid.js` (must stay ≤80 LOC)
- `spec.md`
- `dist/pattern-grid.css`

---

## Task 1: `<paint-worklet>` — failing tests

**Files:**
- Test: `test/paint-worklet.spec.js`

- [ ] **Step 1: Create the test file with all failing cases**

```js
// test/paint-worklet.spec.js
import { test, expect } from '@playwright/test';

const PAGE_BASE = `
  <script type="module" src="http://localhost:5173/src/paint-worklet.js"></script>
`;

test.describe('<paint-worklet>', () => {
  test('dispatches paint-worklet:registered when src loads successfully', async ({ page }) => {
    await page.addInitScript(() => {
      // Stub CSS.paintWorklet with a resolving addModule
      window.__pw_addModuleCalls = [];
      Object.defineProperty(window.CSS, 'paintWorklet', {
        value: {
          addModule: (url) => {
            window.__pw_addModuleCalls.push(url);
            return Promise.resolve();
          },
        },
        configurable: true,
      });
    });
    await page.setContent(PAGE_BASE);
    const detail = await page.evaluate(async () => {
      return new Promise((resolve) => {
        document.addEventListener('paint-worklet:registered', (e) => resolve(e.detail));
        const el = document.createElement('paint-worklet');
        el.setAttribute('src', '/worklets/test.js');
        document.body.appendChild(el);
      });
    });
    expect(detail).toEqual({ src: '/worklets/test.js' });
    const calls = await page.evaluate(() => window.__pw_addModuleCalls);
    expect(calls).toEqual(['/worklets/test.js']);
  });

  test('dispatches paint-worklet:error when CSS.paintWorklet is absent', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window.CSS, 'paintWorklet', {
        value: undefined,
        configurable: true,
      });
    });
    await page.setContent(PAGE_BASE);
    const detail = await page.evaluate(async () => {
      return new Promise((resolve) => {
        document.addEventListener('paint-worklet:error', (e) =>
          resolve({ src: e.detail.src, message: e.detail.error.message }),
        );
        const el = document.createElement('paint-worklet');
        el.setAttribute('src', '/worklets/test.js');
        document.body.appendChild(el);
      });
    });
    expect(detail.src).toBe('/worklets/test.js');
    expect(detail.message).toMatch(/paintWorklet unavailable/i);
  });

  test('dispatches paint-worklet:error when addModule rejects', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window.CSS, 'paintWorklet', {
        value: {
          addModule: () => Promise.reject(new Error('404')),
        },
        configurable: true,
      });
    });
    await page.setContent(PAGE_BASE);
    const detail = await page.evaluate(async () => {
      return new Promise((resolve) => {
        document.addEventListener('paint-worklet:error', (e) =>
          resolve({ src: e.detail.src, message: e.detail.error.message }),
        );
        const el = document.createElement('paint-worklet');
        el.setAttribute('src', '/worklets/missing.js');
        document.body.appendChild(el);
      });
    });
    expect(detail.src).toBe('/worklets/missing.js');
    expect(detail.message).toBe('404');
  });

  test('does nothing when src is missing', async ({ page }) => {
    await page.addInitScript(() => {
      window.__pw_addModuleCalls = [];
      Object.defineProperty(window.CSS, 'paintWorklet', {
        value: {
          addModule: (url) => {
            window.__pw_addModuleCalls.push(url);
            return Promise.resolve();
          },
        },
        configurable: true,
      });
    });
    await page.setContent(PAGE_BASE);
    const result = await page.evaluate(async () => {
      let fired = false;
      document.addEventListener('paint-worklet:registered', () => (fired = true));
      document.addEventListener('paint-worklet:error', () => (fired = true));
      const el = document.createElement('paint-worklet');
      document.body.appendChild(el);
      await new Promise((r) => setTimeout(r, 50));
      return { fired, calls: window.__pw_addModuleCalls };
    });
    expect(result.fired).toBe(false);
    expect(result.calls).toEqual([]);
  });

  test('deduplicates same src across multiple instances', async ({ page }) => {
    await page.addInitScript(() => {
      window.__pw_addModuleCalls = [];
      Object.defineProperty(window.CSS, 'paintWorklet', {
        value: {
          addModule: (url) => {
            window.__pw_addModuleCalls.push(url);
            return Promise.resolve();
          },
        },
        configurable: true,
      });
    });
    await page.setContent(PAGE_BASE);
    const result = await page.evaluate(async () => {
      const events = [];
      document.addEventListener('paint-worklet:registered', (e) => events.push(e.detail.src));
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('paint-worklet');
        el.setAttribute('src', '/worklets/dup.js');
        document.body.appendChild(el);
      }
      await new Promise((r) => setTimeout(r, 50));
      return { events, calls: window.__pw_addModuleCalls };
    });
    expect(result.calls).toEqual(['/worklets/dup.js']);
    expect(result.events.length).toBe(3);
    expect(result.events.every((s) => s === '/worklets/dup.js')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail (component not yet implemented)**

Run: `npm test -- paint-worklet.spec.js`
Expected: all 5 tests fail with "Cannot find module" or "paint-worklet is undefined" (Vite returns 404 for missing src).

---

## Task 2: `<paint-worklet>` — implementation

**Files:**
- Create: `src/paint-worklet.js`

- [ ] **Step 1: Write the component**

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
 *
 * @see https://github.com/ProfPowell/pattern-grid
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
    if (typeof CSS?.paintWorklet?.addModule !== 'function') {
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

- [ ] **Step 2: Run the tests to confirm they pass**

Run: `npm test -- paint-worklet.spec.js`
Expected: all 5 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/paint-worklet.js test/paint-worklet.spec.js
git commit -m "feat: add <paint-worklet> companion element"
```

---

## Task 3: TypeScript definitions

**Files:**
- Create: `paint-worklet.d.ts`

- [ ] **Step 1: Write the .d.ts file**

```ts
// paint-worklet.d.ts
export interface PaintWorkletRegisteredDetail {
  src: string;
}

export interface PaintWorkletErrorDetail {
  src: string;
  error: Error;
}

export default class PaintWorklet extends HTMLElement {}

declare global {
  interface HTMLElementTagNameMap {
    'paint-worklet': PaintWorklet;
  }
  interface HTMLElementEventMap {
    'paint-worklet:registered': CustomEvent<PaintWorkletRegisteredDetail>;
    'paint-worklet:error': CustomEvent<PaintWorkletErrorDetail>;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add paint-worklet.d.ts
git commit -m "feat: add paint-worklet TypeScript definitions"
```

---

## Task 4: Vite + package.json wiring

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json`

- [ ] **Step 1: Add `paint-worklet` to Vite build entries**

Edit `vite.config.js`. Change the `entry` block from:

```js
      entry: {
        'pattern-grid': 'src/pattern-grid.js',
        'seed-context': 'src/seed-context.js',
      },
```

to:

```js
      entry: {
        'pattern-grid': 'src/pattern-grid.js',
        'seed-context': 'src/seed-context.js',
        'paint-worklet': 'src/paint-worklet.js',
      },
```

- [ ] **Step 2: Add the package export and bump version**

Edit `package.json`. Change `"version": "0.2.0"` to `"version": "0.3.0"`. In the `exports` block, after the `"./seed-context.css"` line, add:

```json
    "./paint-worklet": {
      "types": "./paint-worklet.d.ts",
      "import": "./dist/paint-worklet.js",
      "default": "./dist/paint-worklet.js"
    },
```

In the `files` array, after `"seed-context.d.ts"`, add `"paint-worklet.d.ts"`.

- [ ] **Step 3: Build and verify dist output**

Run: `npm run build`
Expected: `dist/paint-worklet.js` exists alongside `dist/pattern-grid.js` and `dist/seed-context.js`.

Verify with: `ls dist/paint-worklet.js`

- [ ] **Step 4: Commit**

```bash
git add vite.config.js package.json
git commit -m "build: register paint-worklet as Vite build entry, bump 0.3.0"
```

---

## Task 5: Demo paint worklet (`docs/worklets/swirl.js`)

**Files:**
- Create: `docs/worklets/swirl.js`

- [ ] **Step 1: Create the worklets directory and write the worklet**

```bash
mkdir -p docs/worklets
```

Write `docs/worklets/swirl.js`:

```js
// docs/worklets/swirl.js
// A demonstration Paint Worklet for <pattern-grid> showcase piece #41.
// Reads --hue and (optionally) --rand-0 from the painted element and renders
// a per-cell swirl using the Canvas 2D API.

class SwirlPainter {
  static get inputProperties() {
    return ['--hue', '--rand-0'];
  }

  paint(ctx, geom, properties) {
    const hue = parseFloat(properties.get('--hue').toString()) || 0;
    const rand = parseFloat(properties.get('--rand-0').toString()) || 0.5;
    const { width: w, height: h } = geom;
    const cx = w / 2, cy = h / 2;
    const arms = 4 + Math.floor(rand * 4); // 4..7
    const maxR = Math.hypot(cx, cy);

    ctx.fillStyle = `hsl(${hue}, 60%, 12%)`;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 80; i++) {
      const t = i / 80;
      const r = t * maxR;
      const a = t * Math.PI * 2 * arms + rand * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const light = 30 + (1 - t) * 50;
      ctx.fillStyle = `hsl(${(hue + t * 60) % 360}, 80%, ${light}%)`;
      ctx.beginPath();
      ctx.arc(x, y, (1 - t) * w * 0.08 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

registerPaint('swirl', SwirlPainter);
```

- [ ] **Step 2: Commit**

```bash
git add docs/worklets/swirl.js
git commit -m "docs: add swirl paint worklet for showcase piece 41"
```

---

## Task 6: Showcase section header + paint-worklet import

**Files:**
- Modify: `docs/showcase.html`

- [ ] **Step 1a: Add the paint-worklet script import to `<head>`**

Find the line containing `<script type="module" src="https://unpkg.com/@profpowell/pattern-grid/seed-context"></script>` and insert immediately after it:

```html
  <script type="module" src="https://unpkg.com/@profpowell/pattern-grid/paint-worklet"></script>
```

- [ ] **Step 1b: Add the `<paint-worklet>` element as the first child of `<body>`**

The element must live in `<body>`, not `<head>`. Place it as the very first child of `<body>`, before `<header class="site-header">`. The final `<body>` opens with:

```html
<body>
  <paint-worklet src="/worklets/swirl.js"></paint-worklet>
  <header class="site-header">
```

This self-registers the swirl worklet on page load for piece #41.

- [ ] **Step 2: Add the section heading before piece 34**

Find the existing piece 33 (Sierpinski) — it ends with `</figure>` near line 720. Immediately *after* that closing `</figure>` and *before* the closing `</div>` of `.gallery`, insert:

```html

      <!-- ============================================================ -->
      <!-- Modern platform showcase                                     -->
      <!-- Pieces 34-43 demonstrate platform features css-doodle's      -->
      <!-- Shadow-DOM/DSL architecture cannot reach.                    -->
      <!-- ============================================================ -->

      <h2 class="showcase-section">Modern platform showcase</h2>
      <p class="showcase-section-lead">The previous pieces match what <a href="https://css-doodle.com/">css-doodle</a> does. The next ten show what <em>only</em> a light-DOM component can do — real semantic cells, View Transitions, Anchor Positioning, Popover, scroll-driven animations, <code>:has()</code>, container queries, Houdini Paint Worklet — features that live outside the Shadow-DOM wall.</p>
```

- [ ] **Step 3: Add the matching `.showcase-section` style**

`.gallery` is CSS grid (`display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`). Spanning the full row with `grid-column: 1 / -1` is required.

Edit `docs/styles.css`. After the existing `/* --- Showcase gallery --- */` block (around line 582), find the end of the gallery-wide styles (before the first per-piece block at `/* --- Showcase: hex honeycomb --- */`) and add:

```css
.showcase-section {
  grid-column: 1 / -1;
  margin-block: 3rem 0.5rem;
  font-size: 1.6rem;
  border-top: 1px solid var(--border-color, #ccc);
  padding-top: 2rem;
}
.showcase-section-lead {
  grid-column: 1 / -1;
  margin-block: 0 1rem;
  color: var(--muted, #666);
  max-width: 60ch;
}
```

- [ ] **Step 4: View showcase to verify the heading renders cleanly**

Run: `npm run dev`
Open: `http://localhost:5173/docs/showcase.html`
Scroll to the bottom — verify the new section heading + lead paragraph appear after piece 33 with no layout breakage.

- [ ] **Step 5: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add platform-showcase section heading + paint-worklet import"
```

---

## Task 7: Piece 34 — Step sequencer (Web Audio)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html` (immediately after the section-lead paragraph from Task 6)**

```html
      <!-- 34. Step sequencer -->
      <figure id="sc-step">
        <div class="tile">
          <pattern-grid id="sc-step-grid" cols="16" rows="4">
            <template><button type="button" aria-pressed="false" aria-label="step"></button></template>
          </pattern-grid>
          <div class="sc-step-controls">
            <button type="button" id="sc-step-play">▶ Play</button>
          </div>
        </div>
        <figcaption><strong>Step sequencer</strong>Real <code>&lt;button&gt;</code> cells with ARIA pressed state; Web Audio plays the toggled cells on a 120 BPM transport.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cols="16" rows="4"&gt;
  &lt;template&gt;&lt;button type="button" aria-pressed="false"&gt;&lt;/button&gt;&lt;/template&gt;
&lt;/pattern-grid&gt;</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-step-grid');
            const play = document.getElementById('sc-step-play');
            const state = new Uint8Array(64);
            let ctx, timer;
            grid.addEventListener('pattern-grid:render', () => {
              grid.cellElements.forEach((btn, i) => {
                btn.addEventListener('click', () => {
                  state[i] ^= 1;
                  btn.setAttribute('aria-pressed', state[i] ? 'true' : 'false');
                });
              });
            }, { once: true });
            const FREQS = [262, 330, 392, 523]; // C4 E4 G4 C5, one per row
            function tick(step) {
              for (let row = 0; row < 4; row++) {
                if (state[row * 16 + step]) {
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.frequency.value = FREQS[row];
                  gain.gain.setValueAtTime(0.12, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
                  osc.connect(gain).connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.2);
                }
              }
              grid.cellElements.forEach((c, i) => c.classList.toggle('beat', (i % 16) === step));
            }
            play.addEventListener('click', () => {
              if (timer) {
                clearInterval(timer);
                timer = null;
                play.textContent = '▶ Play';
                grid.cellElements.forEach((c) => c.classList.remove('beat'));
                return;
              }
              ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
              play.textContent = '⏸ Stop';
              let step = 0;
              timer = setInterval(() => { tick(step); step = (step + 1) % 16; }, 125);
            });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append the styles to `docs/styles.css`**

```css
/* --- Showcase: step sequencer --- */
#sc-step pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 3px;
}
#sc-step pattern-grid > button {
  aspect-ratio: 1;
  border: 1px solid #444;
  background: #1a1a24;
  cursor: pointer;
  padding: 0;
  transition: background 80ms;
}
#sc-step pattern-grid > button[aria-pressed="true"] {
  background: hsl(190 80% 55%);
  border-color: hsl(190 80% 70%);
}
#sc-step pattern-grid > button.beat {
  outline: 2px solid #fff;
  outline-offset: -2px;
}
#sc-step .sc-step-controls {
  margin-top: 0.75rem;
  text-align: center;
}
#sc-step .sc-step-controls button {
  font: inherit;
  padding: 0.4rem 1rem;
  cursor: pointer;
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev` (if not already running). Open the showcase, click some cells in piece 34 (toggle their pressed state), click ▶ Play. Verify: cells toggle, audio plays, the moving beat outline tracks across the columns.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 34 (step sequencer, Web Audio)"
```

---

## Task 8: Piece 35 — Morph layout (View Transitions)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 35. Morph layout -->
      <figure id="sc-morph">
        <div class="tile">
          <pattern-grid id="sc-morph-grid" cells="8x8"></pattern-grid>
          <div class="sc-morph-controls"><button type="button" id="sc-morph-shuffle">Shuffle</button></div>
        </div>
        <figcaption><strong>Morph layout</strong>Per-cell <code>view-transition-name</code> animates a reshuffle natively via the View Transitions API.</figcaption>
        <details><summary>Source</summary><pre><code>document.startViewTransition(() =&gt; {
  // reorder cells; each has a unique view-transition-name
});</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-morph-grid');
            const shuffle = document.getElementById('sc-morph-shuffle');
            function tagCells() {
              grid.cellElements.forEach((c, i) => {
                c.style.viewTransitionName = `sc-morph-c${i}`;
                c.style.background = `hsl(${(i * 137.5) % 360} 70% 55%)`;
              });
            }
            grid.addEventListener('pattern-grid:render', tagCells, { once: true });
            shuffle.addEventListener('click', () => {
              const cells = [...grid.cellElements];
              cells.sort(() => Math.random() - 0.5);
              const run = () => grid.replaceChildren(...cells);
              if (document.startViewTransition) {
                document.startViewTransition(run);
              } else {
                run();
              }
            });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: morph layout --- */
#sc-morph pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 2px;
}
#sc-morph pattern-grid > i { aspect-ratio: 1; }
#sc-morph .sc-morph-controls { margin-top: 0.75rem; text-align: center; }
#sc-morph .sc-morph-controls button { font: inherit; padding: 0.4rem 1rem; cursor: pointer; }
::view-transition-group(*) { animation-duration: 600ms; }
```

- [ ] **Step 3: Verify in browser**

Click Shuffle in Chromium — cells smoothly animate to new positions. In Firefox, they snap (no error).

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 35 (morph layout, View Transitions)"
```

---

## Task 9: Piece 36 — Scroll-reveal mosaic

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 36. Scroll-reveal mosaic -->
      <figure id="sc-scroll">
        <div class="tile"><pattern-grid cells="12x12" shim="sibling"></pattern-grid></div>
        <figcaption><strong>Scroll-reveal mosaic</strong>Each cell uses <code>animation-timeline: view()</code> — entry/exit driven entirely by scroll position. Zero JS hooks.</figcaption>
        <details><summary>Source</summary><pre><code>#sc-scroll pattern-grid &gt; i {
  animation: sc-reveal both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
  animation-delay: calc((var(--i, sibling-index())) * -8ms);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: scroll-reveal --- */
#sc-scroll pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 2px;
}
#sc-scroll pattern-grid > i {
  --idx: var(--i, sibling-index());
  aspect-ratio: 1;
  background: hsl(calc(var(--idx) * 2.5) 70% 55%);
  animation: sc-scroll-reveal both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
  animation-delay: calc(var(--idx) * -8ms);
}
@keyframes sc-scroll-reveal {
  from { opacity: 0; transform: scale(0.3) rotate(-20deg); }
  to   { opacity: 1; transform: none; }
}
```

- [ ] **Step 3: Verify in browser**

Scroll the showcase up and down so the mosaic enters/exits the viewport. In Chromium, cells fan in. In Firefox, they appear static (functional).

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 36 (scroll-reveal mosaic)"
```

---

## Task 10: Piece 37 — Anchored popovers

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 37. Anchored popovers -->
      <figure id="sc-anchor">
        <div class="tile">
          <pattern-grid id="sc-anchor-grid" cells="6x6"></pattern-grid>
          <div id="sc-anchor-pops"></div>
        </div>
        <figcaption><strong>Anchored popovers</strong>Each cell is a <code>&lt;button popovertarget&gt;</code>. Popovers dock beside their cell via CSS Anchor Positioning.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;button popovertarget="pop-N" style="anchor-name: --c-N"&gt;&lt;/button&gt;
&lt;div id="pop-N" popover style="position-anchor: --c-N; left: anchor(right); top: anchor(top)"&gt;...&lt;/div&gt;</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-anchor-grid');
            const pops = document.getElementById('sc-anchor-pops');
            grid.addEventListener('pattern-grid:render', () => {
              const cols = grid.cols;
              grid.replaceChildren(...grid.cellElements.map((_, i) => {
                const x = i % cols, y = Math.floor(i / cols);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.setAttribute('popovertarget', `sc-anchor-pop-${i}`);
                btn.style.anchorName = `--sc-anchor-c-${i}`;
                btn.style.background = `hsl(${i * 10} 65% 55%)`;
                btn.setAttribute('aria-label', `cell ${x}, ${y}`);
                const pop = document.createElement('div');
                pop.id = `sc-anchor-pop-${i}`;
                pop.setAttribute('popover', '');
                pop.style.positionAnchor = `--sc-anchor-c-${i}`;
                pop.textContent = `i=${i}, x=${x}, y=${y}`;
                pops.appendChild(pop);
                return btn;
              }));
            }, { once: true });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: anchored popovers --- */
#sc-anchor pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 3px;
}
#sc-anchor pattern-grid > button {
  aspect-ratio: 1;
  border: 0;
  padding: 0;
  cursor: pointer;
}
#sc-anchor [popover] {
  position: fixed;
  left: anchor(right);
  top: anchor(top);
  margin: 0 0 0 6px;
  padding: 0.35rem 0.6rem;
  font: 0.85rem/1.2 ui-monospace, monospace;
  background: #111;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
}
```

- [ ] **Step 3: Verify in browser**

Click a cell — popover opens. In Chromium it docks to the right of the cell. In Safari/Firefox the popover opens but uses default positioning (functional).

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 37 (anchored popovers)"
```

---

## Task 11: Piece 38 — Neighbor glow (`:has()`)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 38. Neighbor glow -->
      <figure id="sc-neighbor">
        <div class="tile"><pattern-grid cells="10x10"></pattern-grid></div>
        <figcaption><strong>Neighbor glow</strong>Hover one cell — its left/right siblings glow via <code>:has()</code> with zero JavaScript.</figcaption>
        <details><summary>Source</summary><pre><code>#sc-neighbor i:hover,
#sc-neighbor i:has(+ i:hover),
#sc-neighbor i:hover + i { background: var(--accent); }</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: :has() neighbor glow --- */
#sc-neighbor pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 2px;
}
#sc-neighbor pattern-grid > i {
  aspect-ratio: 1;
  background: #2a2a3a;
  transition: background 160ms;
}
#sc-neighbor pattern-grid > i:hover,
#sc-neighbor pattern-grid > i:has(+ i:hover),
#sc-neighbor pattern-grid > i:hover + i {
  background: hsl(45 95% 60%);
}
```

- [ ] **Step 3: Verify in browser**

Hover any cell — that cell and its two horizontal siblings light up. No JS involved.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 38 (neighbor glow via :has())"
```

---

## Task 12: Piece 39 — Parametric clip shapes

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 39. Parametric clip shapes -->
      <figure id="sc-shape">
        <div class="tile"><pattern-grid cells="8x8" shim="sibling"></pattern-grid></div>
        <figcaption><strong>Parametric clip shapes</strong>Six-pointed stars from trig-driven <code>clip-path: polygon()</code> — pattern-grid's answer to css-doodle's <code>@shape()</code>.</figcaption>
        <details><summary>Source</summary><pre><code>#sc-shape pattern-grid &gt; i {
  clip-path: polygon(...trig...);
  rotate: calc(var(--i, sibling-index()) * 8deg);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: parametric clip shapes --- */
#sc-shape pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 4px;
}
#sc-shape pattern-grid > i {
  --idx: var(--i, sibling-index());
  aspect-ratio: 1;
  background: hsl(calc(var(--idx) * 6) 75% 55%);
  rotate: calc(var(--idx) * 8deg);
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%,
    79% 91%, 50% 70%, 21% 91%, 32% 57%,
    2% 35%, 39% 35%
  );
  transition: rotate 600ms;
}
#sc-shape pattern-grid > i:hover { rotate: 0deg; }
```

- [ ] **Step 3: Verify in browser**

Star polygons appear, each rotated by index. Hover stops the rotation on the hovered star.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 39 (parametric clip shapes)"
```

---

## Task 13: Piece 40 — Recursive grid

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 40. Recursive grid -->
      <figure id="sc-recurse">
        <div class="tile">
          <pattern-grid id="sc-recurse-grid" cells="3x3">
            <template>
              <div class="sc-recurse-cell">
                <pattern-grid cells="3x3"></pattern-grid>
              </div>
            </template>
          </pattern-grid>
        </div>
        <figcaption><strong>Recursive grid</strong>A <code>&lt;pattern-grid&gt;</code> whose <code>&lt;template&gt;</code> contains another <code>&lt;pattern-grid&gt;</code>. Custom elements upgrade naturally inside cloned templates — Sierpinski carpet without a DSL.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="3x3"&gt;
  &lt;template&gt;
    &lt;div&gt;&lt;pattern-grid cells="3x3"&gt;&lt;/pattern-grid&gt;&lt;/div&gt;
  &lt;/template&gt;
&lt;/pattern-grid&gt;</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: recursive grid --- */
#sc-recurse pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 4px;
  aspect-ratio: 1;
}
#sc-recurse .sc-recurse-cell { aspect-ratio: 1; }
/* Outer center hole */
#sc-recurse > .tile > pattern-grid > .sc-recurse-cell:nth-child(5) { visibility: hidden; }
/* Inner cells colored; their center hole */
#sc-recurse .sc-recurse-cell > pattern-grid {
  gap: 2px;
}
#sc-recurse .sc-recurse-cell > pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(sibling-index() * 25) 75% 60%);
}
#sc-recurse .sc-recurse-cell > pattern-grid > i:nth-child(5) {
  visibility: hidden;
}
```

- [ ] **Step 3: Verify in browser**

A 9-cell grid with the center hidden; each visible cell contains a smaller 9-cell grid with its center hidden. Classic Sierpinski carpet step 2.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 40 (recursive grid, Sierpinski carpet)"
```

---

## Task 14: Piece 41 — Paint worklet swirl

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 41. Paint worklet swirl -->
      <figure id="sc-paint">
        <div class="tile">
          <seed-context seed="swirl" count="1">
            <pattern-grid cells="4x4" shim="sibling"></pattern-grid>
          </seed-context>
        </div>
        <figcaption><strong>Paint worklet swirl</strong>Each cell calls <code>paint(swirl)</code> — a Houdini Paint Worklet registered declaratively via <code>&lt;paint-worklet src&gt;</code>. The platform answer to css-doodle's <code>@shaders()</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;paint-worklet src="/worklets/swirl.js"&gt;&lt;/paint-worklet&gt;

#sc-paint pattern-grid &gt; i {
  --hue: calc(var(--i, sibling-index()) * 22);
  background: paint(swirl);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: paint worklet swirl --- */
#sc-paint pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 4px;
}
#sc-paint pattern-grid > i {
  --idx: var(--i, sibling-index());
  --hue: calc(var(--idx) * 22);
  aspect-ratio: 1;
  background: hsl(var(--hue) 60% 40%) paint(swirl);
}
@property --hue {
  syntax: '<number>';
  initial-value: 0;
  inherits: false;
}
@property --rand-0 {
  syntax: '<number>';
  initial-value: 0.5;
  inherits: false;
}
```

Note: `@property` declarations are required for the worklet's `inputProperties` to pick up animatable typed values. They are scoped globally in CSS; declaring once is enough.

- [ ] **Step 3: Verify in browser**

In Chromium, each cell shows a unique swirl pattern. In Safari/Firefox, cells fall back to the flat HSL background. Open DevTools console — should see no errors.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 41 (paint worklet swirl)"
```

---

## Task 15: Piece 42 — Contribution calendar

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 42. Contribution calendar -->
      <figure id="sc-calendar">
        <div class="tile">
          <seed-context seed="contrib" count="1">
            <pattern-grid id="sc-cal-grid" cols="53" rows="7">
              <template><button type="button" aria-label="day"></button></template>
            </pattern-grid>
          </seed-context>
        </div>
        <figcaption><strong>Contribution calendar</strong>53×7 real <code>&lt;button&gt;</code> cells — keyboard-focusable, screen-reader-readable, real dates, <code>color-mix()</code> for perceptual gradients. css-doodle's Shadow DOM cannot expose this surface.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cols="53" rows="7"&gt;
  &lt;template&gt;&lt;button aria-label="day"&gt;&lt;/button&gt;&lt;/template&gt;
&lt;/pattern-grid&gt;
/* color via color-mix(in oklch, low, high calc(--randi-0 * 1%)) */</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-cal-grid');
            const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            function label() {
              const today = new Date();
              const start = new Date(today);
              start.setDate(start.getDate() - 371);
              grid.cellElements.forEach((btn, i) => {
                const col = i % 53, row = Math.floor(i / 53);
                const d = new Date(start);
                d.setDate(d.getDate() + col * 7 + row);
                const count = Math.floor(parseFloat(btn.style.getPropertyValue('--randi-0') || '0') / 25);
                btn.setAttribute('aria-label',
                  count === 0
                    ? `No contributions on ${fmt.format(d)}`
                    : `${count} contribution${count === 1 ? '' : 's'} on ${fmt.format(d)}`);
              });
            }
            // seed-context populates after pattern-grid renders, so listen on the seed-context.
            document.addEventListener('seed-context:populated', (e) => {
              if (e.detail.target === grid) label();
            });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: contribution calendar --- */
#sc-calendar pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  grid-auto-flow: column;
  grid-template-rows: repeat(var(--pg-rows), 1fr);
  gap: 2px;
  --cal-low: #161b22;
  --cal-high: #39d353;
}
#sc-calendar pattern-grid > button {
  aspect-ratio: 1;
  border: 0;
  padding: 0;
  border-radius: 2px;
  cursor: pointer;
  background: color-mix(in oklch, var(--cal-low), var(--cal-high) calc(var(--randi-0, 0) * 1%));
}
#sc-calendar pattern-grid > button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
```

- [ ] **Step 3: Verify in browser**

The calendar renders a 53-week grid colored by random "contribution counts." Tab through several cells — each is focusable. Inspect a cell — its `aria-label` should read `"N contribution(s) on Month Day, Year"`.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 42 (contribution calendar)"
```

---

## Task 16: Piece 43 — Lissajous point cloud

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure**

```html
      <!-- 43. Lissajous point cloud -->
      <figure id="sc-lissajous">
        <div class="tile"><pattern-grid cells="200" shim="sibling"></pattern-grid></div>
        <figcaption><strong>Lissajous point cloud</strong>200 cells placed by <code>cos(3t)</code>/<code>sin(4t)</code> — pattern-grid's answer to css-doodle's <code>@plot()</code>.</figcaption>
        <details><summary>Source</summary><pre><code>#sc-lissajous pattern-grid &gt; i {
  --t: calc(var(--i, sibling-index()) / var(--pg-cols) * 6.2832);
  translate: calc(cos(var(--t) * 3) * 40%) calc(sin(var(--t) * 4) * 40%);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append styles**

```css
/* --- Showcase: Lissajous point cloud --- */
#sc-lissajous .tile { aspect-ratio: 1; }
#sc-lissajous pattern-grid {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  background: #0f1118;
}
#sc-lissajous pattern-grid > i {
  --idx: var(--i, sibling-index());
  --t: calc(var(--idx) / var(--pg-cols) * 6.2832);
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  margin: -4px;
  border-radius: 50%;
  background: hsl(calc(var(--idx) * 1.8) 75% 60%);
  translate: calc(cos(var(--t) * 3) * 40%) calc(sin(var(--t) * 4) * 40%);
}
```

- [ ] **Step 3: Verify in browser**

A 3:4 Lissajous figure formed by 200 colored dots.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs(showcase): add piece 43 (Lissajous point cloud)"
```

---

## Task 17: CHANGELOG and README

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Step 1: Prepend 0.3.0 entry to `CHANGELOG.md`**

Insert above the existing `## 0.2.0 — unreleased` block (or replace its `unreleased` marker if 0.2.0 ships first — verify with `git log -- CHANGELOG.md`):

```markdown
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

```

- [ ] **Step 2: Add a `<paint-worklet>` section to `README.md`**

`README.md` has a `### <seed-context> companion` section at line 41 with an HTML usage example. Immediately after that section (after its closing fence and any blank line, before the next `### …` or `## …` heading), insert:

```markdown
### `<paint-worklet>` companion

Declaratively register a Houdini Paint Worklet:

\`\`\`html
<script type="module" src="https://unpkg.com/@profpowell/pattern-grid/paint-worklet"></script>

<paint-worklet src="/worklets/swirl.js"></paint-worklet>

<style>
  pattern-grid > i { background: paint(swirl); }
</style>
\`\`\`

Fires `paint-worklet:registered` on success and `paint-worklet:error` on failure (including in browsers where Houdini Paint Worklet is not available — currently Safari and Firefox). Optional. Removable when authors prefer raw `CSS.paintWorklet.addModule()` calls.
```

(Replace `\`` with backticks. The fenced block above is escaped to be visible inside this plan.)

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md README.md
git commit -m "docs: changelog + readme for 0.3.0 (paint-worklet + platform showcase)"
```

---

## Task 18: Final build and verification

**Files:** none modified

- [ ] **Step 1: Confirm `src/pattern-grid.js` is unchanged**

Run: `git log --oneline src/pattern-grid.js | head -2`
Expected: no new commit on `src/pattern-grid.js` since the start of this plan.

Run: `wc -l src/pattern-grid.js`
Expected: 85 lines (matches the pre-plan value; do not grow it).

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all tests pass (existing pattern-grid tests + new paint-worklet tests).

- [ ] **Step 3: Run the build**

Run: `npm run build`
Expected: `dist/pattern-grid.js`, `dist/seed-context.js`, `dist/paint-worklet.js` all present:

```bash
ls dist/pattern-grid.js dist/seed-context.js dist/paint-worklet.js
```

- [ ] **Step 4: Manual showcase walkthrough**

Run: `npm run dev`
Open: `http://localhost:5173/docs/showcase.html`
Scroll to "Modern platform showcase" and verify each of pieces 34–43:

| # | Check |
|---|---|
| 34 | Cells toggle on click; Play button triggers audio (allow audio prompt) |
| 35 | Shuffle button animates cells smoothly (Chromium) |
| 36 | Mosaic fans in as you scroll the section into view (Chromium/Safari 26) |
| 37 | Click a cell — popover appears, docked to the right (Chromium) |
| 38 | Hover any cell — that cell + its horizontal siblings glow |
| 39 | Six-pointed stars visible, hover stops rotation |
| 40 | Sierpinski-carpet step 2: 8 small grids, each missing its center |
| 41 | Each cell shows a unique swirl (Chromium); flat fallback elsewhere |
| 42 | Calendar renders; Tab through cells; inspect aria-label format |
| 43 | Lissajous 3:4 curve of dots |

- [ ] **Step 5: Tag and announce (manual)**

This step is informational only — do not commit a release tag without user request. Note in your final report: "Ready for `git tag v0.3.0` and `npm publish` at user's discretion."

---

## Notes for the executor

- **Do not modify `src/pattern-grid.js`.** The 80-line spec rule is non-negotiable. If a demo seems to need a component change, that is the demo being wrong — fix the demo.
- **Showcase demos are documentation, not tested code.** Only `test/paint-worklet.spec.js` runs in CI. Visual verification is manual per Task 18 step 4.
- **`shim="sibling"` is used in pieces 36, 39, 41, 42 (via seed-context), and 43.** This is intentional — guarantees `--i` works in Firefox today. Other pieces rely on native CSS hover/anchor selectors that don't need `--i`.
- **`@property` declarations in piece 41** are global. If a later showcase update declares `--hue` differently, conflicts are possible. Today there are no other `@property --hue` declarations in `docs/styles.css` (verify with `grep "@property" docs/styles.css`).
- **The `<paint-worklet>` placement in `<body>`** is necessary because custom elements can register before they connect, but `CSS.paintWorklet.addModule` should be called once at page load. Inside `<head>` it would run before the `<paint-worklet>` definition module loads. The first-child-of-body placement runs after the module-import resolves.
