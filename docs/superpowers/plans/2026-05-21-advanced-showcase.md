# Advanced Showcase (7 new pieces) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Push the showcase past the static-grid format with 7 advanced pieces: two single-composition radial pieces (Clover, Mandala), two SVG-filter pieces (Goo blobs, Turbulence), two JS-driven pieces (Game of Life, Mouse heatmap), and one 3D piece (Cube). Bring total to 31 showcase pieces.

**Architecture:** Same append-only pattern as previous showcase expansions — figures in `docs/showcase.html`, scoped CSS in `docs/styles.css`. New: inline `<script>` blocks per JS figure for GoL and heatmap, and inline `<svg><defs><filter>` blocks per SVG figure for Goo and Turbulence.

**Tech Stack:** HTML + CSS + SVG + inline JS. Components still load from unpkg.

**Locked decisions:**
- Inline `<script>` per JS figure (not a single bottom script).
- `prefers-reduced-motion` guards on every animated piece in this set (Mandala rotate, Goo drift, Turbulence shimmer, Cube spin); JS demos check `matchMedia` and step once/no-op if reduced.
- SVG filter IDs prefixed `sc-<slug>-filter` to keep the ID namespace clean.
- Pieces 25–31, total showcase = 31.

---

## File Structure

### Modified files

| Path | Change |
|---|---|
| `docs/showcase.html` | Append 7 `<figure>` blocks + 2 inline SVG `<defs>` + 2 inline `<script>` blocks. |
| `docs/styles.css` | Append 7 scoped `#sc-<slug>` rule blocks, each with `@media (prefers-reduced-motion: no-preference)` guards on animations. |
| `CHANGELOG.md` | Bump showcase note from "24 pieces" to "31 pieces" and add new category names. |

No file creations. No deletions. No `src/` changes.

---

## Piece roster

| # | Slug | Name | Category | Mechanic |
|---|---|---|---|---|
| 25 | `clover` | Clover | Symmetry | 6 cells overlapping at `grid-area: 1/1`, each rotated by 60°, blended via `mix-blend-mode`. |
| 26 | `mandala` | Mandala | Symmetry | Three nested `<pattern-grid>` rings (8/12/24 cells) with cells radiating via polar math. Slow rotation. |
| 27 | `goo` | Goo blobs | SVG filter | Inline `<filter id="sc-goo-filter">` with `feGaussianBlur` + `feColorMatrix` merges drifting colored cells into blob shapes. |
| 28 | `turb` | Turbulence | SVG filter | `feTurbulence` (fractalNoise) + `feDisplacementMap` warps a colorful grid into organic flow. |
| 29 | `gol` | Game of Life | JS | 24×24 grid, JS steps every 200ms, alive cells lit with neon green. Hooks into `pattern-grid:render` so cells exist before first step. |
| 30 | `heat` | Mouse heatmap | JS + CSS | `pointermove` sets `--mx`/`--my`; per-cell distance via `sqrt()` drives hue. Live interactive. |
| 31 | `cube` | 3D cube | CSS transform | `cells="6"` → 6 cube faces via `translateZ` + `rotateX/Y`; outer wrap on `preserve-3d` rotates. |

---

## Task 1: Pieces 25 + 26 (Clover, Mandala)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append two figures** inside `<div class="gallery">` in `docs/showcase.html` (after the existing `#sc-stars` figure):

```html
      <!-- 25. Clover -->
      <figure id="sc-clover">
        <div class="tile"><pattern-grid cells="6"></pattern-grid></div>
        <figcaption><strong>Clover</strong>6 stacked petals, each rotated 60°, blended.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="6"&gt;&lt;/pattern-grid&gt;

#sc-clover pattern-grid &gt; i {
  grid-area: 1 / 1;
  width: 70%;
  aspect-ratio: 1;
  background: hsl(calc(sibling-index() * 60) 80% 55%);
  clip-path: ellipse(20% 50% at 50% 50%);
  transform: rotate(calc(sibling-index() * 60deg));
  mix-blend-mode: multiply;
}</code></pre></details>
      </figure>

      <!-- 26. Mandala -->
      <figure id="sc-mandala">
        <div class="tile">
          <div class="mandala-stack">
            <pattern-grid cells="8"></pattern-grid>
            <pattern-grid cells="12"></pattern-grid>
            <pattern-grid cells="24"></pattern-grid>
          </div>
        </div>
        <figcaption><strong>Mandala</strong>Three nested pattern-grids form concentric rings.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;div class="mandala-stack"&gt;
  &lt;pattern-grid cells="8"&gt;&lt;/pattern-grid&gt;   &lt;!-- inner --&gt;
  &lt;pattern-grid cells="12"&gt;&lt;/pattern-grid&gt;  &lt;!-- middle --&gt;
  &lt;pattern-grid cells="24"&gt;&lt;/pattern-grid&gt;  &lt;!-- outer --&gt;
&lt;/div&gt;

/* Each ring positions its cells via polar math with a
   different --r (radius) per ring. */</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS** to end of `docs/styles.css`:

```css
/* --- Showcase: Clover --- */
#sc-clover .tile { background: #fff4e0; }
#sc-clover pattern-grid {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  width: 100%;
}
#sc-clover pattern-grid > i {
  grid-area: 1 / 1;
  width: 70%;
  aspect-ratio: 1;
  background: hsl(calc(sibling-index() * 60) 80% 55%);
  clip-path: ellipse(20% 50% at 50% 50%);
  transform: rotate(calc(sibling-index() * 60deg));
  mix-blend-mode: multiply;
}

/* --- Showcase: Mandala --- */
#sc-mandala .tile { background: #0d0220; }
#sc-mandala .mandala-stack {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
}
#sc-mandala pattern-grid {
  position: absolute;
  inset: 0;
  display: block;
  place-items: center;
}
#sc-mandala pattern-grid > i {
  --idx: calc(sibling-index() - 1);
  --n:   sibling-count();
  --angle: calc(var(--idx) / var(--n) * 360deg);
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8%;
  aspect-ratio: 1;
  border-radius: 50%;
  transform: translate(-50%, -50%)
             rotate(var(--angle))
             translateY(var(--r, -30%));
  background: hsl(calc(var(--idx) * 30) 75% 60%);
  box-shadow: 0 0 8px hsl(calc(var(--idx) * 30) 75% 60%);
}
#sc-mandala pattern-grid:nth-of-type(1) > i { --r: -15%; width: 6%; }
#sc-mandala pattern-grid:nth-of-type(2) > i { --r: -28%; width: 5%; }
#sc-mandala pattern-grid:nth-of-type(3) > i { --r: -42%; width: 4%; }

@media (prefers-reduced-motion: no-preference) {
  #sc-mandala .mandala-stack {
    animation: sc-mandala-spin 32s linear infinite;
  }
  @keyframes sc-mandala-spin {
    to { transform: rotate(360deg); }
  }
}
```

- [ ] **Step 3: Run tests**

Run: `npx playwright test 2>&1 | tail -3`
Expected: 31 passed. If count drops, STOP.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 25-26 (clover, mandala)"
```

---

## Task 2: Pieces 27 + 28 (Goo blobs, Turbulence)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

Both pieces use inline SVG `<defs>` with a filter. These defs go IMMEDIATELY inside the `<div class="tile">` (so the filter is reachable in the document) and the filter is applied via `filter: url(#...)` on the pattern-grid.

- [ ] **Step 1: Append two figures**:

```html
      <!-- 27. Goo blobs -->
      <figure id="sc-goo">
        <div class="tile">
          <svg class="filter-svg" aria-hidden="true">
            <defs>
              <filter id="sc-goo-filter">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
                <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g" />
                <feBlend in="SourceGraphic" in2="g" />
              </filter>
            </defs>
          </svg>
          <pattern-grid cells="8x8"></pattern-grid>
        </div>
        <figcaption><strong>Goo blobs</strong>Drifting cells merge via an SVG <code>feGaussianBlur</code> + <code>feColorMatrix</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;filter id="sc-goo-filter"&gt;
  &lt;feGaussianBlur stdDeviation="6" /&gt;
  &lt;feColorMatrix values="... 0 0 0 22 -10" /&gt;
&lt;/filter&gt;

#sc-goo .tile { filter: url(#sc-goo-filter); }
#sc-goo pattern-grid &gt; i {
  /* cells drift around with a per-cell offset animation */
  animation: drift 5s ease-in-out infinite;
  animation-delay: calc(sibling-index() * -80ms);
}</code></pre></details>
      </figure>

      <!-- 28. Turbulence -->
      <figure id="sc-turb">
        <div class="tile">
          <svg class="filter-svg" aria-hidden="true">
            <defs>
              <filter id="sc-turb-filter">
                <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" />
                <feDisplacementMap in="SourceGraphic" scale="22" />
              </filter>
            </defs>
          </svg>
          <pattern-grid cells="10x10"></pattern-grid>
        </div>
        <figcaption><strong>Turbulence</strong>SVG <code>feTurbulence</code> + <code>feDisplacementMap</code> warps a colorful grid.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;filter id="sc-turb-filter"&gt;
  &lt;feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" /&gt;
  &lt;feDisplacementMap scale="22" /&gt;
&lt;/filter&gt;

#sc-turb pattern-grid { filter: url(#sc-turb-filter); }
#sc-turb pattern-grid &gt; i {
  background: hsl(calc(sibling-index() * 7) 80% 60%);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* Hide inline filter SVGs (defs only, no visible content) */
.filter-svg {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
}

/* --- Showcase: Goo blobs --- */
#sc-goo .tile {
  background: #14002b;
  filter: url(#sc-goo-filter);
  overflow: hidden;
}
#sc-goo pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 14px;
  padding: 14px;
  width: 100%;
  height: 100%;
}
#sc-goo pattern-grid > i {
  aspect-ratio: 1;
  border-radius: 50%;
  background: hsl(calc(sibling-index() * 11) 85% 60%);
}
@media (prefers-reduced-motion: no-preference) {
  #sc-goo pattern-grid > i {
    animation: sc-goo-drift 4.5s ease-in-out infinite;
    animation-delay: calc(sibling-index() * -90ms);
  }
  @keyframes sc-goo-drift {
    0%, 100% { translate: 0   0;   }
    25%      { translate: 30%  -10%; }
    50%      { translate: -10% 35%; }
    75%      { translate: -25% -20%; }
  }
}

/* --- Showcase: Turbulence --- */
#sc-turb .tile { background: #000; overflow: hidden; }
#sc-turb pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  width: 100%;
  height: 100%;
  filter: url(#sc-turb-filter);
}
#sc-turb pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(sibling-index() * 7) 85% 60%);
}
```

- [ ] **Step 3: Run tests** → 31 passed.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 27-28 (goo, turbulence)"
```

---

## Task 3: Pieces 29 + 30 (Game of Life, Mouse heatmap)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

Both pieces include an inline `<script>` after the figure that wires up the JS behavior. Scripts use `id="sc-gol-grid"` and `id="sc-heat-grid"` on the pattern-grid to grab a stable handle.

- [ ] **Step 1: Append two figures + their scripts**:

```html
      <!-- 29. Game of Life -->
      <figure id="sc-gol">
        <div class="tile"><pattern-grid id="sc-gol-grid" cells="24x24"></pattern-grid></div>
        <figcaption><strong>Game of Life</strong>Conway's classic — 24×24, steps every 200ms.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid id="sc-gol-grid" cells="24x24"&gt;&lt;/pattern-grid&gt;
&lt;script&gt;
  const grid = document.getElementById('sc-gol-grid');
  const W = 24, N = W * W;
  let state = Array.from({ length: N }, () =&gt; +(Math.random() &lt; 0.3));
  function step() {
    const next = state.slice();
    for (let i = 0; i &lt; N; i++) {
      const x = i % W, y = (i / W) | 0;
      let n = 0;
      for (let dy = -1; dy &lt;= 1; dy++) for (let dx = -1; dx &lt;= 1; dx++) {
        if (dx || dy) n += state[((y+dy+W)%W) * W + (x+dx+W)%W];
      }
      next[i] = state[i] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
    }
    state = next;
    grid.cellElements.forEach((c, i) =&gt; c.classList.toggle('alive', !!state[i]));
  }
  grid.addEventListener('pattern-grid:render', () =&gt; { step(); }, { once: true });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(step, 200);
&lt;/script&gt;</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-gol-grid');
            if (!grid) return;
            const W = 24, N = W * W;
            let state = Array.from({ length: N }, () => +(Math.random() < 0.3));
            function step() {
              const next = state.slice();
              for (let i = 0; i < N; i++) {
                const x = i % W, y = (i / W) | 0;
                let n = 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                  if (dx || dy) n += state[((y + dy + W) % W) * W + (x + dx + W) % W];
                }
                next[i] = state[i] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
              }
              state = next;
              grid.cellElements.forEach((c, i) => c.classList.toggle('alive', !!state[i]));
            }
            grid.addEventListener('pattern-grid:render', () => { step(); }, { once: true });
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
              setInterval(step, 200);
            }
          })();
        </script>
      </figure>

      <!-- 30. Mouse heatmap -->
      <figure id="sc-heat">
        <div class="tile"><pattern-grid id="sc-heat-grid" cells="20x20"></pattern-grid></div>
        <figcaption><strong>Mouse heatmap</strong>Move your cursor — each cell colors by distance.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid id="sc-heat-grid" cells="20x20"&gt;&lt;/pattern-grid&gt;
&lt;script&gt;
  const grid = document.getElementById('sc-heat-grid');
  grid.addEventListener('pointermove', (e) =&gt; {
    const r = grid.getBoundingClientRect();
    grid.style.setProperty('--mx', (e.clientX - r.left) / r.width);
    grid.style.setProperty('--my', (e.clientY - r.top)  / r.height);
  });
&lt;/script&gt;

@property --mx { syntax: '&lt;number&gt;'; inherits: true; initial-value: 0.5; }
@property --my { syntax: '&lt;number&gt;'; inherits: true; initial-value: 0.5; }
#sc-heat pattern-grid &gt; i {
  --idx: calc(sibling-index() - 1);
  --col: calc(mod(var(--idx), 20) / 20);
  --row: calc(floor(calc(var(--idx) / 20)) / 20);
  --dx: calc(var(--col) - var(--mx));
  --dy: calc(var(--row) - var(--my));
  --d: calc(sqrt(var(--dx) * var(--dx) + var(--dy) * var(--dy)));
  background: hsl(calc(var(--d) * 720deg) 75% calc(40% + var(--d) * 50%));
}</code></pre></details>
        <script>
          (function () {
            const grid = document.getElementById('sc-heat-grid');
            if (!grid) return;
            grid.addEventListener('pointermove', (e) => {
              const r = grid.getBoundingClientRect();
              grid.style.setProperty('--mx', (e.clientX - r.left) / r.width);
              grid.style.setProperty('--my', (e.clientY - r.top) / r.height);
            });
          })();
        </script>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* --- Showcase: Game of Life --- */
#sc-gol .tile { background: #050a0d; }
#sc-gol pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 1px;
  padding: 4px;
  width: 100%;
  height: 100%;
}
#sc-gol pattern-grid > i {
  aspect-ratio: 1;
  background: rgba(0, 255, 80, 0.04);
  transition: background 100ms;
}
#sc-gol pattern-grid > i.alive {
  background: #1fff80;
  box-shadow: 0 0 6px #1fff80;
}

/* --- Showcase: Mouse heatmap --- */
@property --mx { syntax: '<number>'; inherits: true; initial-value: 0.5; }
@property --my { syntax: '<number>'; inherits: true; initial-value: 0.5; }
@property --col { syntax: '<number>'; inherits: false; initial-value: 0; }
@property --row { syntax: '<number>'; inherits: false; initial-value: 0; }
@property --d { syntax: '<number>'; inherits: false; initial-value: 0; }

#sc-heat pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  --mx: 0.5;
  --my: 0.5;
}
#sc-heat pattern-grid > i {
  aspect-ratio: 1;
  --idx: calc(sibling-index() - 1);
  --col: calc(mod(var(--idx), 20) / 20);
  --row: calc(floor(calc(var(--idx) / 20)) / 20);
  --dx: calc(var(--col) - var(--mx));
  --dy: calc(var(--row) - var(--my));
  --d: calc(sqrt(var(--dx) * var(--dx) + var(--dy) * var(--dy)));
  background: hsl(calc(var(--d) * 720deg) 75% calc(40% + var(--d) * 50%));
  transition: background 150ms;
}
```

- [ ] **Step 3: Run tests** → 31 passed.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 29-30 (game of life, mouse heatmap)"
```

---

## Task 4: Piece 31 (3D cube)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append figure**:

```html
      <!-- 31. 3D cube -->
      <figure id="sc-cube">
        <div class="tile">
          <div class="cube-perspective">
            <div class="cube-wrap">
              <pattern-grid cells="6"></pattern-grid>
            </div>
          </div>
        </div>
        <figcaption><strong>3D cube</strong><code>cells="6"</code> → six cube faces via <code>translateZ</code> + <code>rotate</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;div class="cube-perspective"&gt;
  &lt;div class="cube-wrap"&gt;
    &lt;pattern-grid cells="6"&gt;&lt;/pattern-grid&gt;
  &lt;/div&gt;
&lt;/div&gt;

.cube-perspective { perspective: 600px; }
.cube-wrap { transform-style: preserve-3d; }
#sc-cube pattern-grid &gt; i {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 80px; height: 80px;
}
#sc-cube pattern-grid &gt; i:nth-child(1) { transform: translateZ( 40px); background: #c33; }
#sc-cube pattern-grid &gt; i:nth-child(2) { transform: translateZ(-40px) rotateY(180deg); background: #3c3; }
#sc-cube pattern-grid &gt; i:nth-child(3) { transform: rotateY( 90deg) translateZ(40px); background: #33c; }
#sc-cube pattern-grid &gt; i:nth-child(4) { transform: rotateY(-90deg) translateZ(40px); background: #cc3; }
#sc-cube pattern-grid &gt; i:nth-child(5) { transform: rotateX( 90deg) translateZ(40px); background: #3cc; }
#sc-cube pattern-grid &gt; i:nth-child(6) { transform: rotateX(-90deg) translateZ(40px); background: #c3c; }</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* --- Showcase: 3D cube --- */
#sc-cube .tile {
  background: #0a0014;
  display: grid;
  place-items: center;
  overflow: hidden;
}
#sc-cube .cube-perspective {
  perspective: 600px;
  width: 80px;
  height: 80px;
}
#sc-cube .cube-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  transform-style: preserve-3d;
}
#sc-cube pattern-grid {
  display: block;
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}
#sc-cube pattern-grid > i {
  position: absolute;
  inset: 0;
  width: 80px;
  height: 80px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  opacity: 0.85;
}
#sc-cube pattern-grid > i:nth-child(1) { transform: translateZ( 40px);                  background: #ff5470; }
#sc-cube pattern-grid > i:nth-child(2) { transform: translateZ(-40px) rotateY(180deg);  background: #00cecb; }
#sc-cube pattern-grid > i:nth-child(3) { transform: rotateY( 90deg)  translateZ( 40px); background: #ffed66; }
#sc-cube pattern-grid > i:nth-child(4) { transform: rotateY(-90deg)  translateZ( 40px); background: #ffd166; }
#sc-cube pattern-grid > i:nth-child(5) { transform: rotateX( 90deg)  translateZ( 40px); background: #b388eb; }
#sc-cube pattern-grid > i:nth-child(6) { transform: rotateX(-90deg)  translateZ( 40px); background: #80ffdb; }

@media (prefers-reduced-motion: no-preference) {
  #sc-cube .cube-wrap {
    animation: sc-cube-spin 14s linear infinite;
  }
  @keyframes sc-cube-spin {
    from { transform: rotateX(-20deg) rotateY(  0deg); }
    to   { transform: rotateX(-20deg) rotateY(360deg); }
  }
}
```

- [ ] **Step 3: Run tests** → 31 passed.

- [ ] **Step 4: Commit**

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase piece 31 (3D cube)"
```

---

## Task 5: CHANGELOG + final browser verification

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update CHANGELOG**

Open `CHANGELOG.md`. Find the existing `## 0.2.0 — unreleased` entry. Replace the showcase bullet that mentions "24 css-doodle-style demos" with:

```markdown
- New docs page `docs/showcase.html` with 31 css-doodle-style demos covering geometric, procedural, animated, random, demoscene, SuperGraphics, Op-Art, emoji, radial-symmetry, SVG-filter, JS-driven, and 3D categories.
```

(Only the count and category list change.)

- [ ] **Step 2: Manual browser verification**

Run: `lsof -ti :5173 | xargs -r kill -9 2>/dev/null; npm run dev`

Open `http://localhost:5173/docs/showcase.html`. Scroll to the bottom — confirm 31 tiles render. Manually verify:
- Clover: 6 overlapping translucent petals form a flower silhouette.
- Mandala: 3 nested rings of glowing dots, slowly rotating.
- Goo blobs: drifting circles merge into amoebic shapes.
- Turbulence: warped colorful field that looks like a melted painting.
- Game of Life: cells light up green and evolve (visible motion).
- Mouse heatmap: hover the tile — colors track the cursor.
- 3D cube: a 6-faced cube spins.

If any of those is visually broken, STOP and report which one + what you see. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog notes 31-piece showcase"
```

---

## Self-Review Notes

**Spec coverage:**
- Clover (#25) — Task 1.
- Mandala (#26) — Task 1, three nested grids + slow rotation under `prefers-reduced-motion` guard.
- Goo blobs (#27) — Task 2, SVG `feGaussianBlur` + `feColorMatrix`; reduced-motion-guarded drift animation.
- Turbulence (#28) — Task 2, SVG `feTurbulence` + `feDisplacementMap`.
- Game of Life (#29) — Task 3, JS via inline `<script>`, hooks `pattern-grid:render`, reduced-motion guard skips the setInterval.
- Mouse heatmap (#30) — Task 3, JS sets `--mx`/`--my`; CSS uses `@property`-typed values + `sqrt()`/`pow()`-equivalent (we use `sqrt(x*x + y*y)`).
- 3D cube (#31) — Task 4, `transform-style: preserve-3d`, reduced-motion-guarded spin.

**Placeholder scan:** Every step contains the exact HTML/CSS/JS the engineer needs. No "TODO" / "tbd" / "similar to". Each animation block has its own keyframes named `sc-<slug>-<name>` to avoid collisions.

**Type consistency:**
- All `#sc-<slug>` IDs unique.
- SVG filter IDs (`sc-goo-filter`, `sc-turb-filter`) prefixed and unique.
- `@property` definitions in heatmap CSS prevent symbol leakage to other pieces (`--mx`/`--my` declared `inherits: true` so the parent grid's value flows down; `--col`/`--row`/`--d` are `inherits: false` because each cell computes its own).
- The `cellElements` API used in GoL is already part of pattern-grid's public surface and is type-declared in `pattern-grid.d.ts`.

**Known fragilities (with inline fallbacks):**
- **Heatmap** depends on `sqrt()` (CSS Values 4, Chrome 138+). If unavailable, cells will show their fallback initial-value-driven background; the demo degrades to a static gradient.
- **Mandala** depends on `sibling-count()` in cell-level `calc()`. Already used elsewhere in the showcase; risk is low.
- **3D cube** combines `transform-style: preserve-3d` with grid-display children; the plan switches the pattern-grid to `display: block` and absolutely-positions cells to make 3D transforms compose cleanly.
- **Game of Life** edge case: the `pattern-grid:render` event fires once when cells are first generated. We hook `{ once: true }` for the first step (so the grid is visible immediately even with reduced motion), and `setInterval` continues stepping for the normal-motion case.

**Runtime impact:** Zero. No `src/` changes. Tests should remain at 31 passing throughout. The new JS lives inside `docs/showcase.html` only.
