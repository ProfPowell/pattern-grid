# Art tributes & 8-bit sprite walls — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 14 new showcase pieces (44–57) — abstract-art tributes, 8-bit sprite walls, and two pop/illusion pieces — to `docs/showcase.html` and `docs/styles.css`, with no changes to the `<pattern-grid>` core.

**Architecture:** Each piece is a self-contained `<figure>` matching the existing showcase pattern: a `<div class="tile">` host with one or more `<pattern-grid>` elements inside, a `<figcaption>`, and a `<details>` source-display block. Pieces are appended after piece 43 (Lissajous) inside the existing `<div class="gallery">`, under a new `<h2 class="showcase-section">` heading. All styling lives in `docs/styles.css` after the existing rules. Sprite pieces share a tiny `.pixel-grid` utility plus a `[data-px]` attribute mapping, but each sprite owns its own palette and pixel string (no shared palette table).

**Tech Stack:** Plain HTML, CSS (including `clip-path`, `radial-gradient`, `color-mix(in oklch)`, CSS Anchor Positioning, the Popover API, `@property` / `@keyframes`, `image-rendering: pixelated`), and a handful of inline `<script>` tags ≤10 lines each. No build step, no library dependencies. Verification uses the existing Vite dev server + Chrome DevTools MCP for visual smoke tests; the Playwright suite (`npm test`) must continue to pass 36/36.

**Spec:** `docs/superpowers/specs/2026-05-22-art-and-sprite-tributes-design.md`

---

## File Structure

Only two files change:

- **`docs/showcase.html`** — append a new `<h2>` heading, an intro `<p>`, and 14 `<figure>` blocks. Insert *after* the closing `</figure>` of piece 43 (line 1016) and *before* the closing `</div>` of `.gallery` (line 1018). Each figure follows the existing convention: `<figure id="sc-…"> → <div class="tile">…</div> → <figcaption>…</figcaption> → <details><summary>Source</summary><pre><code>…</code></pre></details>` plus an optional inline `<script>`.
- **`docs/styles.css`** — append a new "Tributes — abstract art & 8-bit sprites" block at the end of the file containing shared sprite utilities and per-piece rules.

No other files are touched. `src/pattern-grid.js`, `src/seed-context.js`, and `src/paint-worklet.js` stay byte-for-byte identical.

## Testing strategy

The existing Playwright suite (`test/pattern-grid.spec.js`, `test/seed-context.spec.js`) tests the LIBRARY, not showcase pieces. We do not add new automated tests — the showcase has always been verified visually. Each piece task ends with a Chrome DevTools MCP verify step (navigate, scroll to figure, screenshot, check console for errors). The final task re-runs `npm test` (must stay 36/36) and re-verifies every new piece on the live dev server.

---

## Task 1: Scaffolding — new section heading and shared sprite utilities

**Files:**
- Modify: `docs/showcase.html` (insert at line 1017, between the closing `</figure>` of piece 43 and the closing `</div>` of `.gallery`)
- Modify: `docs/styles.css` (append at end of file)

- [ ] **Step 1: Start the dev server**

Run:
```bash
cd /Users/tpowell/src/pattern-grid && npm run dev > /tmp/vite-tributes.log 2>&1 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/docs/showcase.html
```
Expected: `200`. If not, check `/tmp/vite-tributes.log` for errors.

- [ ] **Step 2: Insert the section heading + intro paragraph into `docs/showcase.html`**

Insert immediately after the closing `</figure>` of piece 43 (currently line 1016), at the same indentation level as the existing `<h2 class="showcase-section">` on line 742. Use Edit with `old_string` matching the unique transition from piece 43 to the gallery wrapper:

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

    </div>
```

…and replace with the same content plus the new section header inserted before `</div>`:

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

      <!-- ============================================================ -->
      <!-- TRIBUTES — abstract art & 8-bit sprites (pieces 44–57)        -->
      <!-- ============================================================ -->

      <h2 class="showcase-section">Tributes — abstract art &amp; 8-bit sprites</h2>
      <p class="showcase-section-lead">A small gallery tour: three hard-edge geometric tributes (Mondrian, Albers, Sol&nbsp;LeWitt), three painterly ones (Kandinsky, Kelly, Kusama), six pixel-sprite pieces (single sprites, an animated chomp, a hover-swap, a CSS-only sprite-sheet picker, a palette-cycling sprite, and an interactive paint scratchpad), and two pop-and-illusion crossovers (Escher tessellation, Lichtenstein POW with <code>popover</code> and CSS Anchor Positioning).</p>

    </div>
```

- [ ] **Step 3: Append shared sprite utilities to `docs/styles.css`**

Append the following block at the very end of `docs/styles.css`:

```css

/* ============================================================ */
/* Showcase: Tributes — abstract art & 8-bit sprites             */
/* ============================================================ */

/* --- Shared sprite utilities (used by pieces 50–55, 57) --- */
.pixel-grid {
  image-rendering: pixelated;
  gap: 0;
  background: var(--pg-bg, #111);
}
.pixel-grid > i,
.pixel-grid > button {
  background: transparent;
  aspect-ratio: 1;
  border: 0;
  padding: 0;
  margin: 0;
}
.pixel-grid > [data-px] { background: var(--px, transparent); }
```

- [ ] **Step 4: Verify the new heading renders without errors**

Navigate Chrome DevTools MCP to `http://localhost:5173/docs/showcase.html`, then:
```javascript
() => {
  document.querySelector('h2.showcase-section:last-of-type').scrollIntoView({ block: 'center' });
  return {
    headingText: document.querySelector('h2.showcase-section:last-of-type').textContent,
    headingCount: document.querySelectorAll('h2.showcase-section').length,
  };
}
```
Expected: `headingText` contains `"Tributes"`, `headingCount` is `2`. Then list console messages — expect zero errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/tpowell/src/pattern-grid
git add docs/showcase.html docs/styles.css
git commit -m "feat(showcase): scaffold Tributes section + shared sprite utilities"
```

---

## Task 2: Piece 44 — Mondrian (Composition with Red, Yellow & Blue)

**Files:**
- Modify: `docs/showcase.html` (append inside the new Tributes section, before the closing `</div>` of `.gallery`)
- Modify: `docs/styles.css` (append after the shared sprite utilities block)

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

Use Edit. The `old_string` is the heading paragraph we just added plus the closing `</div>` so insertion lands inside the gallery:

```html
      <p class="showcase-section-lead">A small gallery tour: three hard-edge geometric tributes (Mondrian, Albers, Sol&nbsp;LeWitt), three painterly ones (Kandinsky, Kelly, Kusama), six pixel-sprite pieces (single sprites, an animated chomp, a hover-swap, a CSS-only sprite-sheet picker, a palette-cycling sprite, and an interactive paint scratchpad), and two pop-and-illusion crossovers (Escher tessellation, Lichtenstein POW with <code>popover</code> and CSS Anchor Positioning).</p>

    </div>
```

Replace with the same plus the new figure:

```html
      <p class="showcase-section-lead">A small gallery tour: three hard-edge geometric tributes (Mondrian, Albers, Sol&nbsp;LeWitt), three painterly ones (Kandinsky, Kelly, Kusama), six pixel-sprite pieces (single sprites, an animated chomp, a hover-swap, a CSS-only sprite-sheet picker, a palette-cycling sprite, and an interactive paint scratchpad), and two pop-and-illusion crossovers (Escher tessellation, Lichtenstein POW with <code>popover</code> and CSS Anchor Positioning).</p>

      <!-- 44. Mondrian — Composition with Red, Yellow & Blue -->
      <figure id="sc-mondrian">
        <div class="tile">
          <pattern-grid cols="6" rows="6">
            <i style="grid-area: 1 / 1 / 4 / 4" data-fill="white"></i>
            <i style="grid-area: 1 / 4 / 3 / 7" data-fill="white"></i>
            <i style="grid-area: 3 / 4 / 5 / 6" data-fill="white"></i>
            <i style="grid-area: 3 / 6 / 7 / 7" data-fill="yellow"></i>
            <i style="grid-area: 4 / 1 / 7 / 2" data-fill="white"></i>
            <i style="grid-area: 4 / 2 / 7 / 4" data-fill="red"></i>
            <i style="grid-area: 5 / 4 / 7 / 6" data-fill="blue"></i>
          </pattern-grid>
        </div>
        <figcaption><strong>Mondrian — Composition with Red, Yellow &amp; Blue</strong>Hand-authored cells with <code>grid-area</code> spans; primary colours, off-white fields, thick black gutters from <code>gap</code> + host background.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cols="6" rows="6"&gt;
  &lt;i style="grid-area: 1 / 1 / 4 / 4" data-fill="white"&gt;&lt;/i&gt;
  &lt;i style="grid-area: 1 / 4 / 3 / 7" data-fill="white"&gt;&lt;/i&gt;
  &lt;i style="grid-area: 3 / 4 / 5 / 6" data-fill="white"&gt;&lt;/i&gt;
  &lt;i style="grid-area: 3 / 6 / 7 / 7" data-fill="yellow"&gt;&lt;/i&gt;
  &lt;i style="grid-area: 4 / 1 / 7 / 2" data-fill="white"&gt;&lt;/i&gt;
  &lt;i style="grid-area: 4 / 2 / 7 / 4" data-fill="red"&gt;&lt;/i&gt;
  &lt;i style="grid-area: 5 / 4 / 7 / 6" data-fill="blue"&gt;&lt;/i&gt;
&lt;/pattern-grid&gt;</code></pre></details>
      </figure>

    </div>
```

Note the hand-authored `<i>` cells: `pattern-grid` will see 7 children (matching `cols*rows = 36`? No — 7 ≠ 36, so the component will re-render with 36 default cells). To suppress this, we must give it exactly the right number of children OR we use the `cells` attribute to set a single-track layout. The trick is that pattern-grid's `#sync` calls `render()` *only when* `cellElements.length !== cols * rows`. So we need 36 cells, OR we accept that pattern-grid will overwrite our cells. **Use this alternative form** — no `cols`/`rows`, the parent CSS uses an explicit grid:

Replace the above figure with this version:

```html
      <!-- 44. Mondrian — Composition with Red, Yellow & Blue -->
      <figure id="sc-mondrian">
        <div class="tile">
          <div class="sc-mondrian-grid">
            <i style="grid-area: 1 / 1 / 4 / 4" data-fill="white"></i>
            <i style="grid-area: 1 / 4 / 3 / 7" data-fill="white"></i>
            <i style="grid-area: 3 / 4 / 5 / 6" data-fill="white"></i>
            <i style="grid-area: 3 / 6 / 7 / 7" data-fill="yellow"></i>
            <i style="grid-area: 4 / 1 / 7 / 2" data-fill="white"></i>
            <i style="grid-area: 4 / 2 / 7 / 4" data-fill="red"></i>
            <i style="grid-area: 5 / 4 / 7 / 6" data-fill="blue"></i>
          </div>
        </div>
        <figcaption><strong>Mondrian — Composition with Red, Yellow &amp; Blue</strong>Hand-authored cells with <code>grid-area</code> spans; primary colours, off-white fields, thick black gutters via <code>gap</code> + black host background. The grid here is plain CSS — <code>&lt;pattern-grid&gt;</code> would re-render uneven cell counts.</figcaption>
        <details><summary>Source</summary><pre><code>.sc-mondrian-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 6px;
  background: #111;
  aspect-ratio: 1;
}
.sc-mondrian-grid &gt; [data-fill="red"]    { background: #dd2222; }
.sc-mondrian-grid &gt; [data-fill="blue"]   { background: #1f3fbf; }
.sc-mondrian-grid &gt; [data-fill="yellow"] { background: #f0d040; }
.sc-mondrian-grid &gt; [data-fill="white"]  { background: #f4f0e6; }</code></pre></details>
      </figure>

    </div>
```

- [ ] **Step 2: Append Mondrian styles to `docs/styles.css`**

Append after the shared sprite utilities block:

```css

/* --- 44. Mondrian — Composition with Red, Yellow & Blue --- */
#sc-mondrian .sc-mondrian-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 6px;
  background: #111;
  aspect-ratio: 1;
  padding: 6px;
}
#sc-mondrian .sc-mondrian-grid > [data-fill="red"]    { background: #dd2222; }
#sc-mondrian .sc-mondrian-grid > [data-fill="blue"]   { background: #1f3fbf; }
#sc-mondrian .sc-mondrian-grid > [data-fill="yellow"] { background: #f0d040; }
#sc-mondrian .sc-mondrian-grid > [data-fill="white"]  { background: #f4f0e6; }
```

- [ ] **Step 3: Verify visually**

Reload Chrome DevTools MCP page, then:
```javascript
() => {
  const fig = document.getElementById('sc-mondrian');
  fig.scrollIntoView({ block: 'center' });
  const cells = [...fig.querySelectorAll('.sc-mondrian-grid > [data-fill]')];
  return {
    figExists: !!fig,
    cellCount: cells.length,
    fills: cells.map(c => c.dataset.fill),
  };
}
```
Expected: `figExists: true`, `cellCount: 7`, `fills` includes red/blue/yellow/white. Take a screenshot and confirm it visually reads as a Mondrian (large white blocks, a red panel lower-left, blue lower-middle, yellow strip right). List console — expect no errors.

---

## Task 3: Piece 45 — Albers (Homage to the Square)

**Files:**
- Modify: `docs/showcase.html` (append inside the Tributes section)
- Modify: `docs/styles.css` (append after Mondrian rules)

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

Find the closing of piece 44:
```html
        <details><summary>Source</summary><pre><code>.sc-mondrian-grid {
…
.sc-mondrian-grid &gt; [data-fill="white"]  { background: #f4f0e6; }</code></pre></details>
      </figure>

    </div>
```

Replace with that plus the new figure:

```html
        <details><summary>Source</summary><pre><code>.sc-mondrian-grid {
…
.sc-mondrian-grid &gt; [data-fill="white"]  { background: #f4f0e6; }</code></pre></details>
      </figure>

      <!-- 45. Albers — Homage to the Square -->
      <figure id="sc-albers">
        <div class="tile">
          <div class="sc-albers-layer sc-albers-l1">
            <div class="sc-albers-layer sc-albers-l2">
              <div class="sc-albers-layer sc-albers-l3">
                <div class="sc-albers-layer sc-albers-l4"></div>
              </div>
            </div>
          </div>
        </div>
        <figcaption><strong>Albers — Homage to the Square</strong>Four nested squares, each offset downward by uneven padding. Warm palette, no recursion of <code>&lt;pattern-grid&gt;</code> needed here — pure nesting demonstrates the same compositional grammar.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;div class="sc-albers-layer sc-albers-l1"&gt;
  &lt;div class="sc-albers-layer sc-albers-l2"&gt;
    &lt;div class="sc-albers-layer sc-albers-l3"&gt;
      &lt;div class="sc-albers-layer sc-albers-l4"&gt;&lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre></details>
      </figure>

    </div>
```

- [ ] **Step 2: Append Albers styles to `docs/styles.css`**

```css

/* --- 45. Albers — Homage to the Square --- */
#sc-albers .sc-albers-layer {
  aspect-ratio: 1;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}
#sc-albers .sc-albers-l1 { background: #6a2818; padding: 8% 8% 14% 8%; }
#sc-albers .sc-albers-l2 { background: #b25a26; padding: 8% 8% 14% 8%; }
#sc-albers .sc-albers-l3 { background: #d77a37; padding: 8% 8% 14% 8%; }
#sc-albers .sc-albers-l4 { background: #f0c266; }
```

- [ ] **Step 3: Verify visually**

```javascript
() => {
  const fig = document.getElementById('sc-albers');
  fig.scrollIntoView({ block: 'center' });
  return {
    figExists: !!fig,
    layerCount: fig.querySelectorAll('.sc-albers-layer').length,
    innermostBg: getComputedStyle(fig.querySelector('.sc-albers-l4')).backgroundColor,
  };
}
```
Expected: `layerCount: 4`, `innermostBg: "rgb(240, 194, 102)"`. Screenshot — should look like four concentric warm-tone squares with the inner ones nudged downward (Albers' signature).

---

## Task 4: Piece 46 — Sol LeWitt (algorithmic line work)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 45's closing `</figure>`, append:

```html
      <!-- 46. Sol LeWitt — algorithmic line work -->
      <figure id="sc-lewitt">
        <div class="tile"><pattern-grid cols="12" rows="12" shim="sibling"></pattern-grid></div>
        <figcaption><strong>Sol LeWitt — algorithmic line work</strong>Each cell is a single 2px-thick diagonal whose angle is <code>calc(var(--i) * 17deg)</code>. Zero JavaScript art that feels hand-drawn but is entirely algorithmic.</figcaption>
        <details><summary>Source</summary><pre><code>#sc-lewitt pattern-grid &gt; i {
  background: #f4ede2;
  position: relative;
}
#sc-lewitt pattern-grid &gt; i::before {
  content: "";
  position: absolute;
  inset: 0;
  background: #1a1a1a;
  clip-path: polygon(0 49%, 100% 49%, 100% 51%, 0 51%);
  rotate: calc(var(--i) * 17deg);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append LeWitt styles to `docs/styles.css`**

```css

/* --- 46. Sol LeWitt — algorithmic line work --- */
#sc-lewitt pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 0;
  background: #f4ede2;
  aspect-ratio: 1;
}
#sc-lewitt pattern-grid > i {
  aspect-ratio: 1;
  position: relative;
  background: #f4ede2;
}
#sc-lewitt pattern-grid > i::before {
  content: "";
  position: absolute;
  inset: 0;
  background: #1a1a1a;
  clip-path: polygon(0 49%, 100% 49%, 100% 51%, 0 51%);
  rotate: calc(var(--i) * 17deg);
}
```

- [ ] **Step 3: Verify visually**

```javascript
() => {
  const grid = document.querySelector('#sc-lewitt pattern-grid');
  grid.scrollIntoView({ block: 'center' });
  return {
    cellCount: grid.cellElements.length,
    iOnFirst: grid.cellElements[0].style.getPropertyValue('--i'),
    rotateLast: getComputedStyle(grid.cellElements[143], '::before').rotate,
  };
}
```
Expected: `cellCount: 144`, `iOnFirst: "1"`, `rotateLast` contains some angle. Screenshot — should look like a swirling field of black hairlines on a cream background.

---

## Task 5: Commit hard-edge cluster (44–46)

- [ ] **Step 1: Re-run the existing Playwright tests**

```bash
cd /Users/tpowell/src/pattern-grid && npm test 2>&1 | tail -5
```
Expected: `36 passed`.

- [ ] **Step 2: Commit**

```bash
cd /Users/tpowell/src/pattern-grid
git add docs/showcase.html docs/styles.css
git commit -m "feat(showcase): add Mondrian + Albers + LeWitt tributes (44-46)"
```

---

## Task 6: Piece 47 — Kandinsky (Squares with Concentric Circles)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 46's closing `</figure>`, append:

```html
      <!-- 47. Kandinsky — Squares with Concentric Circles -->
      <figure id="sc-kandinsky">
        <div class="tile">
          <seed-context seed="kandinsky" count="3">
            <pattern-grid cols="4" rows="3"></pattern-grid>
          </seed-context>
        </div>
        <figcaption><strong>Kandinsky — Squares with Concentric Circles</strong>4×3 cells, each a stack of four nested radial gradients driven by three seeded randoms per cell. Same painting twice in a row because the seed is stable.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="kandinsky" count="3"&gt;
  &lt;pattern-grid cols="4" rows="3"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-kandinsky pattern-grid &gt; i {
  background:
    radial-gradient(circle at center,
      hsl(calc(var(--rand-0) * 360) 75% 55%) 0 18%,
      transparent 19%),
    radial-gradient(circle at center,
      hsl(calc(var(--rand-1) * 360) 75% 55%) 0 30%,
      transparent 31%),
    radial-gradient(circle at center,
      hsl(calc(var(--rand-2) * 360) 75% 55%) 0 42%,
      transparent 43%),
    hsl(calc(var(--rand-0) * 360) 30% 90%);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append Kandinsky styles to `docs/styles.css`**

```css

/* --- 47. Kandinsky — Squares with Concentric Circles --- */
#sc-kandinsky pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 6px;
  background: #2a2522;
  padding: 6px;
}
#sc-kandinsky pattern-grid > i {
  aspect-ratio: 1;
  background:
    radial-gradient(circle at center,
      hsl(calc(var(--rand-0) * 360) 75% 55%) 0 18%,
      transparent 19%),
    radial-gradient(circle at center,
      hsl(calc(var(--rand-1) * 360) 75% 55%) 0 30%,
      transparent 31%),
    radial-gradient(circle at center,
      hsl(calc(var(--rand-2) * 360) 75% 55%) 0 42%,
      transparent 43%),
    hsl(calc(var(--rand-0) * 360) 30% 90%);
}
```

- [ ] **Step 3: Verify visually**

```javascript
() => {
  const grid = document.querySelector('#sc-kandinsky pattern-grid');
  grid.scrollIntoView({ block: 'center' });
  return {
    cellCount: grid.cellElements.length,
    rand0OnFirst: grid.cellElements[0].style.getPropertyValue('--rand-0'),
    hasGradient: getComputedStyle(grid.cellElements[0]).background.includes('gradient'),
  };
}
```
Expected: `cellCount: 12`, `rand0OnFirst` is a number string between 0 and 1, `hasGradient: true`. Screenshot — should show 12 cells, each with concentric circle motif.

---

## Task 7: Piece 48 — Ellsworth Kelly (Colors for a Large Wall)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 47, append:

```html
      <!-- 48. Ellsworth Kelly — Colors for a Large Wall -->
      <figure id="sc-kelly">
        <div class="tile">
          <seed-context seed="kelly" count="2">
            <pattern-grid cols="8" rows="8"></pattern-grid>
          </seed-context>
        </div>
        <figcaption><strong>Ellsworth Kelly — Colors for a Large Wall</strong>8×8 flat saturated tiles, palette from seeded random hues mixed with paper-white via <code>color-mix(in oklch)</code>.</figcaption>
        <details><summary>Source</summary><pre><code>#sc-kelly pattern-grid &gt; i {
  background: color-mix(in oklch,
    hsl(calc(var(--rand-0) * 360) 85% 55%),
    white calc(var(--rand-1) * 25%));
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append Kelly styles to `docs/styles.css`**

```css

/* --- 48. Ellsworth Kelly — Colors for a Large Wall --- */
#sc-kelly pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 4px;
  background: #fcfaf4;
  padding: 4px;
}
#sc-kelly pattern-grid > i {
  aspect-ratio: 1;
  background: color-mix(in oklch,
    hsl(calc(var(--rand-0) * 360) 85% 55%),
    white calc(var(--rand-1) * 25%));
}
```

- [ ] **Step 3: Verify visually**

```javascript
() => {
  const grid = document.querySelector('#sc-kelly pattern-grid');
  grid.scrollIntoView({ block: 'center' });
  const colors = [...grid.cellElements].slice(0, 4).map(c => getComputedStyle(c).backgroundColor);
  return { cellCount: grid.cellElements.length, sampleColors: colors };
}
```
Expected: `cellCount: 64`, `sampleColors` are four different rgb strings. Screenshot — 64 flat colour tiles, no two identical.

---

## Task 8: Piece 49 — Yayoi Kusama (infinity dots)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 48, append:

```html
      <!-- 49. Yayoi Kusama — infinity dots -->
      <figure id="sc-kusama">
        <div class="tile">
          <seed-context seed="kusama" count="1">
            <pattern-grid cols="16" rows="16"></pattern-grid>
          </seed-context>
        </div>
        <figcaption><strong>Yayoi Kusama — infinity dots</strong>16×16 red-on-white dots whose radius comes from <code>--rand-0</code>. Hover any cell to make its dot bloom.</figcaption>
        <details><summary>Source</summary><pre><code>#sc-kusama pattern-grid &gt; i {
  background:
    radial-gradient(circle at center,
      #c00 0 calc(var(--rand-0) * 40%),
      #fff calc(var(--rand-0) * 40% + 1px) 100%);
  transition: scale 200ms;
}
#sc-kusama pattern-grid &gt; i:hover { scale: 1.4; z-index: 2; }</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append Kusama styles to `docs/styles.css`**

```css

/* --- 49. Yayoi Kusama — infinity dots --- */
#sc-kusama pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 0;
  background: #fff;
}
#sc-kusama pattern-grid > i {
  aspect-ratio: 1;
  background:
    radial-gradient(circle at center,
      #c00 0 calc(var(--rand-0) * 40%),
      #fff calc(var(--rand-0) * 40% + 1px) 100%);
  transition: scale 200ms;
}
#sc-kusama pattern-grid > i:hover { scale: 1.4; z-index: 2; }
```

- [ ] **Step 3: Verify visually**

```javascript
() => {
  const grid = document.querySelector('#sc-kusama pattern-grid');
  grid.scrollIntoView({ block: 'center' });
  return {
    cellCount: grid.cellElements.length,
    sampleRand: grid.cellElements[7].style.getPropertyValue('--rand-0'),
  };
}
```
Expected: `cellCount: 256`, `sampleRand` is a number string between 0 and 1. Screenshot — a field of red dots of varying sizes on white.

---

## Task 9: Commit painterly cluster (47–49)

- [ ] **Step 1: Re-run tests**

```bash
cd /Users/tpowell/src/pattern-grid && npm test 2>&1 | tail -3
```
Expected: `36 passed`.

- [ ] **Step 2: Commit**

```bash
cd /Users/tpowell/src/pattern-grid
git add docs/showcase.html docs/styles.css
git commit -m "feat(showcase): add Kandinsky + Kelly + Kusama tributes (47-49)"
```

---

## Task 10: Piece 50 — Space Invader (defines the sprite-cell pattern)

This task establishes the convention for all sprite pieces: a `<pattern-grid>` host with `class="pixel-grid"`, child cells generated by an inline `<script>` from a pixel-string literal, and per-piece palette rules using `[data-px="N"] { --px: <colour> }`.

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 49, append:

```html
      <!-- 50. Space Invader (single sprite) -->
      <figure id="sc-invader">
        <div class="tile">
          <pattern-grid id="sc-invader-grid" class="pixel-grid" cols="11" rows="8"></pattern-grid>
        </div>
        <figcaption><strong>Space-invader-style sprite</strong>11×8 grid where each cell carries <code>data-px="0|1"</code>. CSS maps <code>data-px="1"</code> to bright green. The pixel string is the source of truth.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid class="pixel-grid" cols="11" rows="8"&gt;&lt;/pattern-grid&gt;

const pixels =
  "00100000100" +
  "00010001000" +
  "00111111100" +
  "01101110110" +
  "11111111111" +
  "10111111101" +
  "10100000101" +
  "00011011000";
grid.innerHTML = [...pixels].map(c =&gt; `&lt;i data-px="${c}"&gt;&lt;/i&gt;`).join('');

#sc-invader [data-px="1"] { --px: #2eff2e; }</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-invader-grid');
            const pixels =
              "00100000100" +
              "00010001000" +
              "00111111100" +
              "01101110110" +
              "11111111111" +
              "10111111101" +
              "10100000101" +
              "00011011000";
            const draw = () => {
              grid.innerHTML = [...pixels].map(c => `<i data-px="${c}"></i>`).join('');
            };
            grid.addEventListener('pattern-grid:render', draw, { once: true });
          })();
        </script>
      </figure>
```

Why the `pattern-grid:render` hook: `pattern-grid` would otherwise overwrite our `<i data-px>` children. We let it render the default 88 cells once, then we replace them with our own `<i data-px>` children. From that point on `pattern-grid` won't re-render unless `cols`/`rows` change.

- [ ] **Step 2: Append Space Invader styles to `docs/styles.css`**

```css

/* --- 50. Space Invader (single sprite) --- */
#sc-invader pattern-grid { --pg-bg: #0a0a18; aspect-ratio: 11 / 8; }
#sc-invader [data-px="1"] { --px: #2eff2e; }
```

- [ ] **Step 3: Verify visually**

```javascript
() => {
  const grid = document.getElementById('sc-invader-grid');
  grid.scrollIntoView({ block: 'center' });
  const cells = grid.children;
  const dataPxCells = grid.querySelectorAll('[data-px]');
  return {
    childrenCount: cells.length,
    dataPxCount: dataPxCells.length,
    firstDataPx: dataPxCells[0]?.dataset.px,
    pixel44: dataPxCells[44]?.dataset.px, // mid of row 5, should be "1"
  };
}
```
Expected: `childrenCount: 88`, `dataPxCount: 88`, `firstDataPx: "0"`, `pixel44: "1"`. Screenshot — a green invader on a dark tile.

---

## Task 11: Piece 51 — Pac-Man chomp (single sprite, animated)

We use the **simpler JS approach** (re-render `grid.innerHTML` every 200 ms with the active pixel string) rather than the two-attribute CSS trick — it's cleaner and easier to debug.

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 50, append:

```html
      <!-- 51. Pac-Man-style chomp (single sprite, animated) -->
      <figure id="sc-chomp">
        <div class="tile">
          <pattern-grid id="sc-chomp-grid" class="pixel-grid" cols="13" rows="13"></pattern-grid>
        </div>
        <figcaption><strong>Pac-Man-style chomp</strong>Two pixel arrays — mouth open and closed — swapped every 200 ms by re-rendering <code>innerHTML</code>. CSS handles the colour.</figcaption>
        <details><summary>Source</summary><pre><code>const frames = [
  /* closed */ "...",
  /* open */   "...",
];
let f = 0;
const draw = () =&gt; grid.innerHTML = [...frames[f]].map(c =&gt; `&lt;i data-px="${c}"&gt;&lt;/i&gt;`).join('');
setInterval(() =&gt; { f = 1 - f; draw(); }, 200);

#sc-chomp [data-px="1"] { --px: #ffeb00; }</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-chomp-grid');
            const FRAMES = [
              /* closed */
              "0000011111000" +
              "0011111111100" +
              "0111111111110" +
              "0111111111110" +
              "1111111111111" +
              "1111111111111" +
              "1111111111111" +
              "1111111111111" +
              "1111111111111" +
              "0111111111110" +
              "0111111111110" +
              "0011111111100" +
              "0000011111000",
              /* open */
              "0000011111000" +
              "0011111111100" +
              "0111111111110" +
              "0111111111110" +
              "1111111000000" +
              "1111100000000" +
              "1110000000000" +
              "1111100000000" +
              "1111111000000" +
              "0111111111110" +
              "0111111111110" +
              "0011111111100" +
              "0000011111000",
            ];
            let f = 0;
            const draw = () => {
              grid.innerHTML = [...FRAMES[f]].map(c => `<i data-px="${c}"></i>`).join('');
            };
            grid.addEventListener('pattern-grid:render', () => {
              draw();
              setInterval(() => { f = 1 - f; draw(); }, 200);
            }, { once: true });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append Pac-Man styles to `docs/styles.css`**

```css

/* --- 51. Pac-Man-style chomp --- */
#sc-chomp pattern-grid { --pg-bg: #000; aspect-ratio: 1; }
#sc-chomp [data-px="1"] { --px: #ffeb00; }
```

- [ ] **Step 3: Verify visually**

```javascript
async () => {
  const grid = document.getElementById('sc-chomp-grid');
  grid.scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 400));
  const before = [...grid.querySelectorAll('[data-px]')].slice(50, 70).map(c => c.dataset.px).join('');
  await new Promise(r => setTimeout(r, 220));
  const after = [...grid.querySelectorAll('[data-px]')].slice(50, 70).map(c => c.dataset.px).join('');
  return { cellCount: grid.querySelectorAll('[data-px]').length, before, after, changed: before !== after };
}
```
Expected: `cellCount: 169`, `changed: true` (frames swapped). Screenshot — a yellow circle (sometimes open-mouthed).

---

## Task 12: Piece 52 — Hover-swap sprite (idle → jump)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 51, append:

```html
      <!-- 52. Hover-swap sprite (Mario-style idle → jump) -->
      <figure id="sc-hoverswap">
        <div class="tile sc-hoverswap-tile">
          <pattern-grid id="sc-hover-idle" class="pixel-grid" cols="8" rows="8"></pattern-grid>
          <pattern-grid id="sc-hover-jump" class="pixel-grid" cols="8" rows="8"></pattern-grid>
        </div>
        <figcaption><strong>Hover-swap sprite</strong>Two 8×8 sprites stacked in the tile. Hovering the tile fades one out and the other in. Mario-style in spirit, generic in art.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;div class="tile sc-hoverswap-tile"&gt;
  &lt;pattern-grid class="pixel-grid" cols="8" rows="8" id="..."&gt;&lt;/pattern-grid&gt;
  &lt;pattern-grid class="pixel-grid" cols="8" rows="8" id="..."&gt;&lt;/pattern-grid&gt;
&lt;/div&gt;

.sc-hoverswap-tile { position: relative; }
.sc-hoverswap-tile &gt; pattern-grid { position: absolute; inset: 0; transition: opacity 200ms; }
#sc-hover-jump { opacity: 0; }
.sc-hoverswap-tile:hover #sc-hover-idle { opacity: 0; }
.sc-hoverswap-tile:hover #sc-hover-jump { opacity: 1; }</code></pre></details>
        <script>
          (function () {
            const IDLE =
              "00111100" +
              "01111110" +
              "01011010" +
              "01111110" +
              "00111100" +
              "01111110" +
              "01100110" +
              "01100110";
            const JUMP =
              "00111100" +
              "01111110" +
              "01011010" +
              "01111110" +
              "10111101" +
              "11111111" +
              "00100100" +
              "01100110";
            const PAINT = (grid, pixels) => {
              const draw = () => {
                grid.innerHTML = [...pixels].map(c => `<i data-px="${c}"></i>`).join('');
              };
              grid.addEventListener('pattern-grid:render', draw, { once: true });
            };
            PAINT(document.getElementById('sc-hover-idle'), IDLE);
            PAINT(document.getElementById('sc-hover-jump'), JUMP);
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append hover-swap styles to `docs/styles.css`**

```css

/* --- 52. Hover-swap sprite --- */
#sc-hoverswap .sc-hoverswap-tile { position: relative; aspect-ratio: 1; }
#sc-hoverswap .sc-hoverswap-tile > pattern-grid {
  position: absolute;
  inset: 0;
  transition: opacity 200ms;
  --pg-bg: #1c2438;
}
#sc-hover-jump { opacity: 0; }
#sc-hoverswap .sc-hoverswap-tile:hover #sc-hover-idle { opacity: 0; }
#sc-hoverswap .sc-hoverswap-tile:hover #sc-hover-jump { opacity: 1; }
#sc-hoverswap [data-px="1"] { --px: #ff7b3d; }
```

- [ ] **Step 3: Verify visually**

```javascript
async () => {
  const fig = document.getElementById('sc-hoverswap');
  fig.scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 200));
  const idle = document.getElementById('sc-hover-idle');
  const jump = document.getElementById('sc-hover-jump');
  return {
    idleCells: idle.querySelectorAll('[data-px]').length,
    jumpCells: jump.querySelectorAll('[data-px]').length,
    idleOpacityBefore: getComputedStyle(idle).opacity,
    jumpOpacityBefore: getComputedStyle(jump).opacity,
  };
}
```
Expected: `idleCells: 64`, `jumpCells: 64`, `idleOpacityBefore: "1"`, `jumpOpacityBefore: "0"`. Then manually verify hover works by hovering the tile — `idle` should fade out, `jump` should fade in.

---

## Task 13: Commit single-sprite cluster (50–52)

- [ ] **Step 1: Re-run tests**

```bash
cd /Users/tpowell/src/pattern-grid && npm test 2>&1 | tail -3
```
Expected: `36 passed`.

- [ ] **Step 2: Commit**

```bash
cd /Users/tpowell/src/pattern-grid
git add docs/showcase.html docs/styles.css
git commit -m "feat(showcase): add 8-bit single sprites — invader, chomp, hover-swap (50-52)"
```

---

## Task 14: Piece 53 — Sprite-sheet picker (CSS-only)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 52, append:

```html
      <!-- 53. Sprite-sheet picker (CSS-only via :has() + radios) -->
      <figure id="sc-picker">
        <div class="tile">
          <div class="sc-picker-chips">
            <input type="radio" name="sc-picker-radio" id="sc-picker-1" checked>
            <label for="sc-picker-1">Invader</label>
            <input type="radio" name="sc-picker-radio" id="sc-picker-2">
            <label for="sc-picker-2">Ghost</label>
            <input type="radio" name="sc-picker-radio" id="sc-picker-3">
            <label for="sc-picker-3">Mushroom</label>
            <input type="radio" name="sc-picker-radio" id="sc-picker-4">
            <label for="sc-picker-4">Heart</label>
          </div>
          <div class="sc-picker-stack">
            <pattern-grid id="sc-pick-1" class="pixel-grid" cols="11" rows="8"></pattern-grid>
            <pattern-grid id="sc-pick-2" class="pixel-grid" cols="8" rows="8"></pattern-grid>
            <pattern-grid id="sc-pick-3" class="pixel-grid" cols="8" rows="8"></pattern-grid>
            <pattern-grid id="sc-pick-4" class="pixel-grid" cols="8" rows="7"></pattern-grid>
          </div>
        </div>
        <figcaption><strong>Sprite-sheet picker</strong>Four hidden radio buttons + four stacked sprites. <code>:has(input:checked)</code> picks which sprite is visible. Zero JS for the picker logic — the sprite content is loaded once per cell.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;input type="radio" name="..." id="sc-picker-1" checked&gt;
&lt;label for="sc-picker-1"&gt;Invader&lt;/label&gt;
…

#sc-picker .sc-picker-stack &gt; pattern-grid { display: none; }
#sc-picker:has(#sc-picker-1:checked) #sc-pick-1 { display: grid; }
#sc-picker:has(#sc-picker-2:checked) #sc-pick-2 { display: grid; }
…</code></pre></details>
        <script>
          (function () {
            const SPRITES = {
              'sc-pick-1':
                "00100000100" +
                "00010001000" +
                "00111111100" +
                "01101110110" +
                "11111111111" +
                "10111111101" +
                "10100000101" +
                "00011011000",
              'sc-pick-2':
                "00111100" +
                "01111110" +
                "10101011" +
                "11111111" +
                "11111111" +
                "11111111" +
                "11111111" +
                "10101010",
              'sc-pick-3':
                "00111100" +
                "01000111" +
                "11110111" +
                "11001011" +
                "11000111" +
                "01111110" +
                "00111100" +
                "00011000",
              'sc-pick-4':
                "01100110" +
                "11111111" +
                "11111111" +
                "11111111" +
                "01111110" +
                "00111100" +
                "00011000",
            };
            for (const id of Object.keys(SPRITES)) {
              const grid = document.getElementById(id);
              const pixels = SPRITES[id];
              grid.addEventListener('pattern-grid:render', () => {
                grid.innerHTML = [...pixels].map(c => `<i data-px="${c}"></i>`).join('');
              }, { once: true });
            }
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append picker styles to `docs/styles.css`**

```css

/* --- 53. Sprite-sheet picker --- */
#sc-picker .sc-picker-chips { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; justify-content: center; }
#sc-picker .sc-picker-chips input { position: absolute; opacity: 0; pointer-events: none; }
#sc-picker .sc-picker-chips label {
  font: inherit;
  padding: 0.3rem 0.7rem;
  border: 1px solid #888;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
#sc-picker .sc-picker-chips input:checked + label {
  background: #1a73e8;
  color: #fff;
  border-color: #1a73e8;
}
#sc-picker .sc-picker-stack { position: relative; aspect-ratio: 1; }
#sc-picker .sc-picker-stack > pattern-grid { display: none; position: absolute; inset: 0; --pg-bg: #0a0a18; }
#sc-picker:has(#sc-picker-1:checked) #sc-pick-1 { display: grid; }
#sc-picker:has(#sc-picker-2:checked) #sc-pick-2 { display: grid; }
#sc-picker:has(#sc-picker-3:checked) #sc-pick-3 { display: grid; }
#sc-picker:has(#sc-picker-4:checked) #sc-pick-4 { display: grid; }
#sc-pick-1 [data-px="1"] { --px: #2eff2e; }
#sc-pick-2 [data-px="1"] { --px: #ff52d1; }
#sc-pick-3 [data-px="1"] { --px: #ff5050; }
#sc-pick-4 [data-px="1"] { --px: #e54066; }
```

- [ ] **Step 3: Verify visually**

```javascript
async () => {
  const fig = document.getElementById('sc-picker');
  fig.scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 200));
  const visibleStart = [...fig.querySelectorAll('.sc-picker-stack > pattern-grid')]
    .map(g => ({ id: g.id, display: getComputedStyle(g).display }));
  document.getElementById('sc-picker-3').checked = true;
  document.getElementById('sc-picker-3').dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  const visibleAfter = [...fig.querySelectorAll('.sc-picker-stack > pattern-grid')]
    .map(g => ({ id: g.id, display: getComputedStyle(g).display }));
  return { visibleStart, visibleAfter };
}
```
Expected: `visibleStart` shows `sc-pick-1` as `grid` and the others as `none`. After flipping the third radio, `sc-pick-3` becomes `grid`. Screenshot — clicking each chip should swap which sprite shows.

---

## Task 15: Piece 54 — Palette-cycle invader

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 53, append:

```html
      <!-- 54. Palette-cycle invader -->
      <figure id="sc-cycle">
        <div class="tile">
          <pattern-grid id="sc-cycle-grid" class="pixel-grid" cols="11" rows="8"></pattern-grid>
        </div>
        <figcaption><strong>Palette-cycle invader</strong>Same invader pixels as #50, but the foreground colour cycles through the hue wheel via <code>@property --hue</code> + <code>@keyframes</code>. CSS-only colour cycling.</figcaption>
        <details><summary>Source</summary><pre><code>@property --hue { syntax: '&lt;angle&gt;'; inherits: true; initial-value: 0deg; }
#sc-cycle { animation: sc-hue-cycle 4s linear infinite; }
@keyframes sc-hue-cycle { to { --hue: 360deg; } }
#sc-cycle [data-px="1"] { --px: hsl(var(--hue) 85% 60%); }</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-cycle-grid');
            const pixels =
              "00100000100" +
              "00010001000" +
              "00111111100" +
              "01101110110" +
              "11111111111" +
              "10111111101" +
              "10100000101" +
              "00011011000";
            grid.addEventListener('pattern-grid:render', () => {
              grid.innerHTML = [...pixels].map(c => `<i data-px="${c}"></i>`).join('');
            }, { once: true });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append palette-cycle styles to `docs/styles.css`**

```css

/* --- 54. Palette-cycle invader --- */
@property --hue { syntax: '<angle>'; inherits: true; initial-value: 0deg; }
#sc-cycle { animation: sc-hue-cycle 4s linear infinite; }
@keyframes sc-hue-cycle { to { --hue: 360deg; } }
#sc-cycle pattern-grid { --pg-bg: #0a0a18; aspect-ratio: 11 / 8; }
#sc-cycle [data-px="1"] { --px: hsl(var(--hue) 85% 60%); }
```

- [ ] **Step 3: Verify visually**

```javascript
async () => {
  const grid = document.getElementById('sc-cycle-grid');
  grid.scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 300));
  const cellOn = grid.querySelector('[data-px="1"]');
  const c1 = getComputedStyle(cellOn).backgroundColor;
  await new Promise(r => setTimeout(r, 1200));
  const c2 = getComputedStyle(cellOn).backgroundColor;
  return { hasFig: !!grid, c1, c2, changed: c1 !== c2 };
}
```
Expected: `changed: true` (the colour cycles smoothly over time). Screenshot — an invader whose colour is currently somewhere on the rainbow.

---

## Task 16: Piece 55 — Pixel-paint scratchpad

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 54, append:

```html
      <!-- 55. Pixel-paint scratchpad -->
      <figure id="sc-paint-pad">
        <div class="tile">
          <pattern-grid id="sc-paint-grid" class="pixel-grid" cols="16" rows="16">
            <template><button type="button" data-px="0" aria-label="pixel"></button></template>
          </pattern-grid>
          <div class="sc-paint-legend">click cycles 0 → 1 → 2 → 3 → 0</div>
        </div>
        <figcaption><strong>Pixel-paint scratchpad</strong>16×16 of real <code>&lt;button&gt;</code> cells. Click cycles <code>data-px</code> through four palette slots. No save, no load — pure play.</figcaption>
        <details><summary>Source</summary><pre><code>grid.addEventListener('click', e =&gt; {
  const btn = e.target.closest('button[data-px]');
  if (!btn) return;
  btn.dataset.px = (Number(btn.dataset.px) + 1) % 4;
});

#sc-paint-pad [data-px="0"] { --px: #1a1a24; }
#sc-paint-pad [data-px="1"] { --px: #ff5470; }
#sc-paint-pad [data-px="2"] { --px: #ffd166; }
#sc-paint-pad [data-px="3"] { --px: #06d6a0; }</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-paint-grid');
            grid.addEventListener('click', e => {
              const btn = e.target.closest('button[data-px]');
              if (!btn) return;
              btn.dataset.px = (Number(btn.dataset.px) + 1) % 4;
            });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append paint-scratchpad styles to `docs/styles.css`**

```css

/* --- 55. Pixel-paint scratchpad --- */
#sc-paint-pad pattern-grid { --pg-bg: #1a1a24; aspect-ratio: 1; }
#sc-paint-pad [data-px="0"] { --px: #1a1a24; }
#sc-paint-pad [data-px="1"] { --px: #ff5470; }
#sc-paint-pad [data-px="2"] { --px: #ffd166; }
#sc-paint-pad [data-px="3"] { --px: #06d6a0; }
#sc-paint-pad button[data-px] { cursor: pointer; }
#sc-paint-pad .sc-paint-legend {
  margin-top: 0.5rem;
  text-align: center;
  font: 0.85rem/1.2 ui-monospace, monospace;
  opacity: 0.7;
}
```

- [ ] **Step 3: Verify visually**

```javascript
async () => {
  const grid = document.getElementById('sc-paint-grid');
  grid.scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 200));
  const btn = grid.children[10];
  const before = btn.dataset.px;
  btn.click();
  const after = btn.dataset.px;
  btn.click();
  btn.click();
  btn.click();
  const wrapped = btn.dataset.px;
  return { cellCount: grid.children.length, before, after, wrapped };
}
```
Expected: `cellCount: 256` (16×16), `before: "0"`, `after: "1"`, `wrapped: "0"` (after 4 clicks total: 0→1→2→3→0).

---

## Task 17: Commit interactive-sprite cluster (53–55)

- [ ] **Step 1: Re-run tests**

```bash
cd /Users/tpowell/src/pattern-grid && npm test 2>&1 | tail -3
```
Expected: `36 passed`.

- [ ] **Step 2: Commit**

```bash
cd /Users/tpowell/src/pattern-grid
git add docs/showcase.html docs/styles.css
git commit -m "feat(showcase): add interactive sprite walls — picker, palette cycle, paint pad (53-55)"
```

---

## Task 18: Piece 56 — Escher tessellating birds

This is the hardest piece visually. We accept a stylised bird silhouette that *reads* as tessellating rather than a pixel-perfect Escher reproduction (see the spec's "Risks" section).

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 55, append:

```html
      <!-- 56. Escher — tessellating birds -->
      <figure id="sc-escher">
        <div class="tile">
          <pattern-grid cols="10" rows="10" shim="sibling"></pattern-grid>
        </div>
        <figcaption><strong>Escher — tessellating birds</strong>Each cell is a bird silhouette via <code>clip-path</code>. Alternate columns and rows are reflected so the negative space of one bird is the positive space of its neighbour. Stylised, not pixel-perfect — sells the tessellation idea.</figcaption>
        <details><summary>Source</summary><pre><code>#sc-escher pattern-grid &gt; i {
  background: #1a1a24;
  clip-path: polygon(
    20% 10%, 50% 0%, 80% 10%,
    100% 35%, 90% 60%, 95% 90%,
    70% 100%, 30% 100%, 5% 90%,
    10% 60%, 0% 35%
  );
}
#sc-escher pattern-grid &gt; i:nth-child(odd) {
  background: #f5e6c8;
  scale: -1 1;
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append Escher styles to `docs/styles.css`**

```css

/* --- 56. Escher — tessellating birds --- */
#sc-escher pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 0;
  background: #2a2a3a;
  aspect-ratio: 1;
}
#sc-escher pattern-grid > i {
  aspect-ratio: 1;
  background: #1a1a24;
  clip-path: polygon(
    20% 10%, 50% 0%, 80% 10%,
    100% 35%, 90% 60%, 95% 90%,
    70% 100%, 30% 100%, 5% 90%,
    10% 60%, 0% 35%
  );
}
#sc-escher pattern-grid > i:nth-child(odd) {
  background: #f5e6c8;
  scale: -1 1;
}
```

- [ ] **Step 3: Verify visually**

```javascript
() => {
  const grid = document.querySelector('#sc-escher pattern-grid');
  grid.scrollIntoView({ block: 'center' });
  const cells = grid.cellElements;
  return {
    cellCount: cells.length,
    firstBg: getComputedStyle(cells[0]).backgroundColor,
    secondBg: getComputedStyle(cells[1]).backgroundColor,
    secondScale: getComputedStyle(cells[1]).scale,
  };
}
```
Expected: `cellCount: 100`, `firstBg` and `secondBg` are different. Screenshot — alternating dark/light bird shapes interlocking.

---

## Task 19: Piece 57 — Lichtenstein POW (Ben-Day dots + popover + anchor positioning)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append the figure to `docs/showcase.html`**

After piece 56, append:

```html
      <!-- 57. Lichtenstein — POW (popover + anchor positioning) -->
      <figure id="sc-pow">
        <div class="tile">
          <pattern-grid id="sc-pow-grid" cols="6" rows="4" shim="sibling"></pattern-grid>
          <div id="sc-pow-balloon" popover>
            POW!
          </div>
        </div>
        <figcaption><strong>Lichtenstein — POW</strong>Ben-Day dots painted on every cell with a CSS radial gradient. One cell is a <code>&lt;button popovertarget&gt;</code> that opens a comic-book "POW!" speech balloon anchored above-right via CSS Anchor Positioning.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cols="6" rows="4" shim="sibling"&gt;&lt;/pattern-grid&gt;
&lt;div id="sc-pow-balloon" popover&gt;POW!&lt;/div&gt;

// after render, replace one cell with a popover-trigger button
const hero = grid.cellElements[10];
hero.replaceWith(Object.assign(document.createElement('button'), {
  type: 'button',
  innerHTML: ''
}));

#sc-pow pattern-grid &gt; i,
#sc-pow pattern-grid &gt; button {
  background:
    radial-gradient(circle at 50% 50%, #c00 0 28%, transparent 30%) 0 0 / 16px 16px,
    #fdd835;
  anchor-name: --sc-pow-hero;
}
#sc-pow-balloon {
  position-anchor: --sc-pow-hero;
  left: anchor(right);
  bottom: anchor(top);
}</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-pow-grid');
            grid.addEventListener('pattern-grid:render', () => {
              const hero = grid.cellElements[10];
              if (!hero) return;
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.setAttribute('popovertarget', 'sc-pow-balloon');
              btn.setAttribute('popovertargetaction', 'toggle');
              btn.setAttribute('aria-label', 'Show POW');
              btn.className = 'sc-pow-hero';
              hero.replaceWith(btn);
            }, { once: true });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append POW styles to `docs/styles.css`**

```css

/* --- 57. Lichtenstein — POW --- */
#sc-pow .tile { position: relative; }
#sc-pow pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 4px;
  background: #fdd835;
  aspect-ratio: 6 / 4;
}
#sc-pow pattern-grid > i,
#sc-pow pattern-grid > button {
  aspect-ratio: 1;
  background:
    radial-gradient(circle at 50% 50%, #c00 0 30%, transparent 32%) 0 0 / 14px 14px,
    #fdd835;
  border: 0;
  padding: 0;
  cursor: pointer;
}
#sc-pow .sc-pow-hero {
  anchor-name: --sc-pow-hero;
  outline: 3px solid #1a1a24;
  outline-offset: -3px;
}
#sc-pow-balloon {
  position-anchor: --sc-pow-hero;
  position: fixed;
  left: anchor(right);
  bottom: anchor(top);
  margin: 0 0 8px 8px;
  padding: 0.6rem 1.4rem;
  font: 900 2rem/1 "Arial Black", "Helvetica Neue", sans-serif;
  color: #ffeb3b;
  background: #d50000;
  border: 4px solid #1a1a24;
  border-radius: 8px;
  transform: rotate(-8deg);
  text-shadow: 2px 2px 0 #1a1a24;
}
```

- [ ] **Step 3: Verify visually**

```javascript
async () => {
  const grid = document.getElementById('sc-pow-grid');
  grid.scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 200));
  const hero = grid.querySelector('button.sc-pow-hero');
  const popover = document.getElementById('sc-pow-balloon');
  const popoverSupported = typeof HTMLElement.prototype.showPopover === 'function';
  hero?.click();
  await new Promise(r => setTimeout(r, 50));
  return {
    cellCount: grid.cellElements.length,
    heroExists: !!hero,
    popoverSupported,
    popoverOpen: popover.matches(':popover-open'),
  };
}
```
Expected: `cellCount: 24` (6×4), `heroExists: true`, `popoverSupported: true`, `popoverOpen: true`. Take a screenshot with the popover open — should show a yellow Ben-Day-dot field with the outlined hero cell and a red "POW!" balloon docked above-right.

---

## Task 20: Commit pop & illusion cluster (56–57)

- [ ] **Step 1: Re-run tests**

```bash
cd /Users/tpowell/src/pattern-grid && npm test 2>&1 | tail -3
```
Expected: `36 passed`.

- [ ] **Step 2: Commit**

```bash
cd /Users/tpowell/src/pattern-grid
git add docs/showcase.html docs/styles.css
git commit -m "feat(showcase): add Escher tessellation + Lichtenstein POW (56-57)"
```

---

## Task 21: Final verification & push

- [ ] **Step 1: Re-run the full test suite one more time**

```bash
cd /Users/tpowell/src/pattern-grid && npm test 2>&1 | tail -5
```
Expected: `36 passed`.

- [ ] **Step 2: Smoke-test all 14 pieces in the browser**

Reload `http://localhost:5173/docs/showcase.html` in Chrome DevTools MCP, then:

```javascript
async () => {
  const ids = [
    'sc-mondrian', 'sc-albers', 'sc-lewitt',
    'sc-kandinsky', 'sc-kelly', 'sc-kusama',
    'sc-invader', 'sc-chomp', 'sc-hoverswap',
    'sc-picker', 'sc-cycle', 'sc-paint-pad',
    'sc-escher', 'sc-pow',
  ];
  const results = [];
  for (const id of ids) {
    const fig = document.getElementById(id);
    if (!fig) { results.push({ id, found: false }); continue; }
    fig.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise(r => setTimeout(r, 150));
    const grids = fig.querySelectorAll('pattern-grid, .sc-mondrian-grid, .sc-albers-layer');
    results.push({
      id,
      found: true,
      gridCount: grids.length,
      firstGridChildren: grids[0]?.children.length || 0,
    });
  }
  return results;
}
```
Expected: every id `found: true`, each has at least one grid with children. Then list console messages — expect zero errors across all 14 pieces.

- [ ] **Step 3: Stop the dev server**

```bash
pkill -f vite 2>/dev/null; echo "vite stopped"
```

- [ ] **Step 4: Push to remote**

```bash
cd /Users/tpowell/src/pattern-grid && git push origin main
```

Expected: 5 new commits pushed (`scaffold`, `44-46`, `47-49`, `50-52`, `53-55`, `56-57` — 6 actually, plus scaffold).

- [ ] **Step 5: Verify on live GitHub Pages (~2 min after push)**

Navigate to `https://profpowell.github.io/pattern-grid/showcase.html`, hard-refresh, scroll to the new "Tributes — abstract art & 8-bit sprites" section, and confirm all 14 pieces render. Report any pieces that look broken in production but worked locally (this would indicate a path or build issue, not a logic bug).
