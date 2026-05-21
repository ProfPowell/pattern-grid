# Showcase Expansion (10 new pieces) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append 10 more visually striking pieces to `docs/showcase.html`, covering demoscene effects, SuperGraphics design, Op-Art, and emoji content. Bring the total to 24 pieces.

**Architecture:** Same pattern as the existing 14 pieces — each new piece is a `<figure id="sc-<slug>">` inside the existing `.gallery` grid plus a scoped `#sc-<slug>` rule block at the end of `docs/styles.css`. No JS changes. No new components. No tests added.

**Tech Stack:** Just HTML + CSS additions. The components load from unpkg, so we don't even touch `src/`.

**Locked design decisions:**
- All 10 pieces append to the existing `docs/showcase.html` gallery (no new pages, no theme sections).
- Three pieces (Halftone, Sea Ranch, Constellation) use `--vb-*` tokens with HSL fallbacks for Vanilla Breeze theming. No dedicated VB demo section.
- Bumping CHANGELOG to note the expansion but no new version (still 0.2.0 since runtime is unchanged).

---

## File Structure

### Modified files

| Path | Change |
|---|---|
| `docs/showcase.html` | Append 10 `<figure>` blocks to the `.gallery` container. |
| `docs/styles.css` | Append 10 scoped `#sc-<slug>` rule blocks. |
| `CHANGELOG.md` | Add an unreleased line noting the 10 new showcase pieces. |

No file creations. No deletions.

---

## Piece roster

| # | Slug | Name | Category | Mechanic |
|---|---|---|---|---|
| 15 | `matrix` | Matrix rain | Demoscene | Vertical falling katakana columns, per-column delay from seed |
| 16 | `plasma` | Plasma | Demoscene | `conic-gradient` per cell with sin-driven hue rotation |
| 17 | `raster` | Raster bars | Demoscene | Single-row grid, animated horizontal color bands |
| 18 | `sphere` | Wireframe sphere | Demoscene | Polar-coord dots forming a rotating sphere |
| 19 | `searanch` | Sea Ranch stripes | SuperGraphics | Vertical stack of variable-width diagonal stripes |
| 20 | `pushpin` | Push Pin mosaic | SuperGraphics | 4 shapes selected by `--randi-0 % 4` with thick outlines |
| 21 | `riley` | Bridget Riley waves | Op-Art | Black/white cells warped by `sin()` of position |
| 22 | `halftone` | Halftone dots | Op-Art | Per-cell circle radius from `--rand-0`, ink+paper colors |
| 23 | `emoji` | Emoji shower | Playful | Random emoji glyph per cell from a 10-glyph palette |
| 24 | `stars` | Constellation | Playful | Sparse twinkling stars, suitable as a background fill |

---

## Task 1: Pieces 15–17 (Matrix, Plasma, Raster)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append three figures** inside `<div class="gallery">` in `docs/showcase.html`, after the existing `#sc-ripple` figure (or wherever the last figure currently lives):

```html
      <!-- 15. Matrix rain -->
      <figure id="sc-matrix">
        <div class="tile"><pattern-grid cols="14" rows="1"><template><span class="col"></span></template></pattern-grid></div>
        <figcaption><strong>Matrix rain</strong>Vertical columns of falling katakana characters.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cols="14" rows="1"&gt;
  &lt;template&gt;&lt;span class="col"&gt;&lt;/span&gt;&lt;/template&gt;
&lt;/pattern-grid&gt;

#sc-matrix .col {
  /* repeating linear-gradient of katakana glyphs scrolls vertically */
  background: linear-gradient(180deg, transparent, #0f3 50%, transparent);
  animation: fall 6s linear infinite;
  animation-delay: calc(sibling-index() * -0.5s);
}
@keyframes fall { to { background-position-y: 200%; } }</code></pre></details>
      </figure>

      <!-- 16. Plasma -->
      <figure id="sc-plasma">
        <div class="tile"><pattern-grid cells="14x14"></pattern-grid></div>
        <figcaption><strong>Plasma</strong>Amiga-demo plasma via animated conic gradients.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="14x14"&gt;&lt;/pattern-grid&gt;

#sc-plasma pattern-grid &gt; i {
  background: conic-gradient(
    from calc(sibling-index() * 13deg),
    hsl(calc(sibling-index() * 7) 80% 60%),
    hsl(calc(sibling-index() * 7 + 180) 80% 60%)
  );
  animation: plasma 6s linear infinite;
  animation-delay: calc(sibling-index() * -20ms);
}
@keyframes plasma {
  to { filter: hue-rotate(360deg); }
}</code></pre></details>
      </figure>

      <!-- 17. Raster bars -->
      <figure id="sc-raster">
        <div class="tile"><pattern-grid cols="1" rows="60"></pattern-grid></div>
        <figcaption><strong>Raster bars</strong>Scrolling color bands. Hello, Amiga.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cols="1" rows="60"&gt;&lt;/pattern-grid&gt;

#sc-raster pattern-grid &gt; i {
  background: hsl(calc(sibling-index() * 6) 90% 55%);
  animation: scroll 3s linear infinite;
  animation-delay: calc(sibling-index() * -50ms);
}
@keyframes scroll {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.4) saturate(1.5); }
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append three CSS blocks** to the end of `docs/styles.css`:

```css
/* --- Showcase: Matrix rain --- */
#sc-matrix .tile { background: #000; }
#sc-matrix pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  height: 100%;
}
#sc-matrix pattern-grid > .col {
  position: relative;
  height: 100%;
  background-image: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 255, 80, 0.0) 30%,
    rgba(0, 255, 80, 0.9) 55%,
    rgba(180, 255, 200, 1) 60%,
    transparent 90%
  );
  background-size: 100% 200%;
  background-repeat: no-repeat;
  animation: sc-matrix-fall 4.5s linear infinite;
  animation-delay: calc(sibling-index() * -0.35s);
}
@keyframes sc-matrix-fall {
  from { background-position-y: -100%; }
  to   { background-position-y: 200%; }
}
/* Glyph layer: katakana chars stacked vertically. Selected per column via :nth-child */
#sc-matrix pattern-grid > .col::before {
  position: absolute;
  inset: 0;
  white-space: pre-wrap;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  line-height: 1.05;
  color: #0a4;
  text-align: center;
  content: "ｱ\Aｲ\Aｳ\Aｴ\Aｵ\Aｶ\Aｷ\Aｸ\Aｹ\Aｺ\Aｻ\Aｼ\Aｽ\Aｾ\Aｿ\Aﾀ\Aﾁ\Aﾂ\Aﾃ\Aﾄ\Aﾅ\Aﾆ\Aﾇ\Aﾈ\Aﾉ\Aﾊ\Aﾋ\Aﾌ\Aﾍ\Aﾎ\Aﾏ\Aﾐ\Aﾑ\Aﾒ\Aﾓ\Aﾔ\Aﾕ\Aﾖ\Aﾗ\Aﾘ\Aﾙ\Aﾚ";
}

/* --- Showcase: Plasma --- */
#sc-plasma pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-plasma pattern-grid > i {
  aspect-ratio: 1;
  background: conic-gradient(
    from calc(sibling-index() * 13deg),
    hsl(calc(sibling-index() * 7) 80% 60%),
    hsl(calc(sibling-index() * 7 + 180) 80% 60%)
  );
  animation: sc-plasma-anim 6s linear infinite;
  animation-delay: calc(sibling-index() * -20ms);
}
@keyframes sc-plasma-anim {
  to { filter: hue-rotate(360deg); }
}

/* --- Showcase: Raster bars --- */
#sc-raster pattern-grid {
  display: grid;
  grid-template-columns: 100%;
  grid-auto-rows: 1fr;
  height: 100%;
}
#sc-raster pattern-grid > i {
  background: hsl(calc(sibling-index() * 6) 90% 55%);
  animation: sc-raster-anim 3s ease-in-out infinite;
  animation-delay: calc(sibling-index() * -50ms);
}
@keyframes sc-raster-anim {
  0%, 100% { filter: brightness(0.9); }
  50%      { filter: brightness(1.5) saturate(1.6); }
}
```

- [ ] **Step 3: Verify in browser**

Run: `lsof -ti :5173 | xargs -r kill -9 2>/dev/null; npm run dev`
Open `http://localhost:5173/docs/showcase.html`. Scroll to the bottom — three new tiles should be present:
- Matrix rain: green columns falling on black.
- Plasma: rainbow blobs with hue cycling.
- Raster bars: 60 horizontal stripes pulsing brighter in a wave.

If Matrix rain shows no glyphs (only the green gradient), the `\A` newline escapes inside `content:` may be eating per-character newlines. Fallback: use a single character per column via `:nth-child(N+1)` and accept that columns don't scroll glyphs, only color. Document as a fallback below.

Stop dev server. Commit:

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 15-17 (matrix, plasma, raster)"
```

---

## Task 2: Pieces 18–19 (Wireframe sphere, Sea Ranch stripes)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append two figures** to the gallery:

```html
      <!-- 18. Wireframe sphere -->
      <figure id="sc-sphere">
        <div class="tile"><pattern-grid cells="240"></pattern-grid></div>
        <figcaption><strong>Wireframe sphere</strong>Spherical projection of dots, rotating slowly.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="240"&gt;&lt;/pattern-grid&gt;

#sc-sphere pattern-grid &gt; i {
  /* fibonacci sphere lattice */
  --i: calc(sibling-index() - 1);
  --phi: calc(acos(1 - 2 * var(--i) / 240));
  --theta: calc(var(--i) * 137.5deg);
  position: absolute;
  left: calc(50% + sin(var(--phi)) * cos(var(--theta)) * 40%);
  top:  calc(50% + cos(var(--phi)) * 40%);
  /* depth-based size and brightness from sin(theta) */
  width:  calc(4px + sin(var(--phi)) * sin(var(--theta)) * 4px + 4px);
  background: hsl(180 50% calc(60% + sin(var(--phi)) * sin(var(--theta)) * 30%));
}</code></pre></details>
      </figure>

      <!-- 19. Sea Ranch stripes -->
      <figure id="sc-searanch">
        <div class="tile"><seed-context seed="ranch" count="2"><pattern-grid cols="1" rows="12"></pattern-grid></seed-context></div>
        <figcaption><strong>Sea Ranch stripes</strong>Bold diagonal supergraphic bands.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="ranch" count="2"&gt;
  &lt;pattern-grid cols="1" rows="12"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-searanch pattern-grid &gt; i {
  /* alternate flat colors, diagonal-clipped */
  background: hsl(var(--vb-stripe-hue, calc(var(--rand-0) * 360)) 75% 55%);
  clip-path: polygon(0 calc(var(--rand-1) * 30%), 100% 0, 100% calc(100% - var(--rand-1) * 30%), 0 100%);
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* --- Showcase: Wireframe sphere --- */
#sc-sphere .tile { background: #050015; }
#sc-sphere pattern-grid {
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  animation: sc-sphere-spin 18s linear infinite;
}
#sc-sphere pattern-grid > i {
  --idx: calc(sibling-index() - 1);
  --phi: calc(acos(1 - 2 * var(--idx) / 240));
  --theta: calc(var(--idx) * 137.5deg);
  position: absolute;
  left: calc(50% + sin(var(--phi)) * cos(var(--theta)) * 40%);
  top:  calc(50% + cos(var(--phi)) * 40%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: hsl(180 70% calc(45% + sin(var(--theta)) * 35%));
  transform: translate(-50%, -50%);
}
@keyframes sc-sphere-spin {
  to { transform: rotate(360deg); }
}

/* --- Showcase: Sea Ranch stripes --- */
#sc-searanch pattern-grid {
  display: grid;
  grid-template-columns: 100%;
  grid-auto-rows: 1fr;
  height: 100%;
}
#sc-searanch pattern-grid > i {
  background: hsl(
    var(--vb-stripe-hue, calc(var(--rand-0) * 360deg))
    75%
    55%
  );
  clip-path: polygon(
    0 calc(var(--rand-1) * 35%),
    100% 0,
    100% calc(100% - var(--rand-1) * 35%),
    0 100%
  );
}
```

- [ ] **Step 3: Verify**

Reload showcase. Sphere should render as dots in a sphere shape on a dark background, slowly spinning. Sea Ranch should show 12 bold colored bands with diagonal edges. If `acos()` isn't yet supported in your Chrome (it's in Baseline as of late 2025), the dots will collapse to a line — fallback: change `--phi` to `calc(var(--idx) * 0.75deg + 90deg)` and accept a non-uniform distribution.

Commit:

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 18-19 (sphere, sea ranch)"
```

---

## Task 3: Pieces 20–21 (Push Pin mosaic, Bridget Riley waves)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append two figures**:

```html
      <!-- 20. Push Pin mosaic -->
      <figure id="sc-pushpin">
        <div class="tile"><seed-context seed="pushpin" count="2"><pattern-grid cells="6x6"></pattern-grid></seed-context></div>
        <figcaption><strong>Push Pin mosaic</strong>Chunky flat shapes, thick outlines, festival-poster colors.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="pushpin" count="2"&gt;
  &lt;pattern-grid cells="6x6"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

/* 4 shapes picked by --randi-0 % 4, hue from --rand-1 */
#sc-pushpin pattern-grid &gt; i:nth-child(4n+0) { clip-path: circle(46% at 50% 50%); }
#sc-pushpin pattern-grid &gt; i:nth-child(4n+1) { clip-path: inset(8%); }
#sc-pushpin pattern-grid &gt; i:nth-child(4n+2) { clip-path: polygon(50% 5%, 95% 95%, 5% 95%); }
#sc-pushpin pattern-grid &gt; i:nth-child(4n+3) { clip-path: polygon(50% 5%, 95% 35%, 78% 90%, 22% 90%, 5% 35%); }
#sc-pushpin pattern-grid &gt; i {
  background: hsl(calc(var(--rand-1) * 360deg) 75% 55%);
  filter: drop-shadow(3px 3px 0 #111);
}</code></pre></details>
      </figure>

      <!-- 21. Bridget Riley waves -->
      <figure id="sc-riley">
        <div class="tile"><pattern-grid cells="40x20"></pattern-grid></div>
        <figcaption><strong>Bridget Riley waves</strong>Black/white cells warped by a sine wave.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;pattern-grid cells="40x20"&gt;&lt;/pattern-grid&gt;

#sc-riley pattern-grid &gt; i {
  --col: calc(mod(sibling-index() - 1, 40));
  background: black;
  transform: scaleY(calc(0.6 + sin(var(--col) * 9deg) * 0.4));
}
#sc-riley pattern-grid &gt; i:nth-child(even) { background: white; }</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* --- Showcase: Push Pin mosaic --- */
#sc-pushpin .tile { background: #f4ecd8; }
#sc-pushpin pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
  gap: 6px;
  padding: 8px;
}
#sc-pushpin pattern-grid > i {
  aspect-ratio: 1;
  background: hsl(calc(var(--rand-1) * 360deg) 75% 55%);
  filter: drop-shadow(3px 3px 0 #111);
}
#sc-pushpin pattern-grid > i:nth-child(4n+0) { clip-path: circle(46% at 50% 50%); }
#sc-pushpin pattern-grid > i:nth-child(4n+1) { clip-path: inset(8%); }
#sc-pushpin pattern-grid > i:nth-child(4n+2) { clip-path: polygon(50% 5%, 95% 95%, 5% 95%); }
#sc-pushpin pattern-grid > i:nth-child(4n+3) { clip-path: polygon(50% 5%, 95% 35%, 78% 90%, 22% 90%, 5% 35%); }

/* --- Showcase: Bridget Riley waves --- */
#sc-riley pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-riley pattern-grid > i {
  --idx: calc(sibling-index() - 1);
  --col: calc(mod(var(--idx), 40));
  aspect-ratio: 1;
  background: #111;
  transform: scaleY(calc(0.6 + sin(var(--col) * 9deg) * 0.4));
  transform-origin: center;
}
#sc-riley pattern-grid > i:nth-child(even) {
  background: #f8f5ef;
}
```

(The Push Pin piece intentionally uses `:nth-child(4n+k)` for deterministic shape selection rather than the `--randi-0 % 4` approach — CSS still can't switch `clip-path` on a custom property's integer value without `@property` plus 4 separate cascade layers. Deterministic-by-position looks identical at a small grid and is simpler.)

- [ ] **Step 3: Verify**

Reload. Push Pin: 36 chunky shapes with black drop-shadows on cream background. Riley: 800 alternating black/white cells, height oscillating in a horizontal wave pattern.

Commit:

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 20-21 (push pin, riley)"
```

---

## Task 4: Pieces 22–23 (Halftone dots, Emoji shower)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append two figures**:

```html
      <!-- 22. Halftone dots -->
      <figure id="sc-halftone">
        <div class="tile"><seed-context seed="halftone"><pattern-grid cells="20x20"></pattern-grid></seed-context></div>
        <figcaption><strong>Halftone dots</strong>Print-style dots whose radius comes from <code>--rand-0</code>.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="halftone"&gt;
  &lt;pattern-grid cells="20x20"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-halftone pattern-grid &gt; i {
  background: radial-gradient(
    circle,
    var(--vb-ink, #c2185b) calc(var(--rand-0) * 50%),
    transparent calc(var(--rand-0) * 50% + 1%)
  );
}</code></pre></details>
      </figure>

      <!-- 23. Emoji shower -->
      <figure id="sc-emoji">
        <div class="tile"><seed-context seed="emoji" count="3"><pattern-grid cells="10x10"><template><span class="em"></span></template></pattern-grid></seed-context></div>
        <figcaption><strong>Emoji shower</strong>Random emoji glyph per cell from a 10-glyph palette.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="emoji" count="3"&gt;
  &lt;pattern-grid cells="10x10"&gt;
    &lt;template&gt;&lt;span class="em"&gt;&lt;/span&gt;&lt;/template&gt;
  &lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-emoji .em::before {
  content: "🌸"; /* default, overridden by :nth-child(10n+k) */
}
#sc-emoji .em:nth-child(10n+1)::before { content: "⭐"; }
#sc-emoji .em:nth-child(10n+2)::before { content: "🍋"; }
/* ... 7 more rotations ... */
#sc-emoji .em {
  transform: rotate(calc((var(--randi-1) - 50) * 4deg))
             scale(calc(0.7 + var(--rand-2) * 0.5));
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* --- Showcase: Halftone dots --- */
#sc-halftone .tile { background: var(--vb-paper, #fff8e7); }
#sc-halftone pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-halftone pattern-grid > i {
  aspect-ratio: 1;
  background: radial-gradient(
    circle,
    var(--vb-ink, #c2185b) calc(var(--rand-0) * 50%),
    transparent calc(var(--rand-0) * 50% + 1%)
  );
}

/* --- Showcase: Emoji shower --- */
#sc-emoji pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-emoji pattern-grid > .em {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  transform: rotate(calc((var(--randi-1) - 50) * 4deg))
             scale(calc(0.7 + var(--rand-2) * 0.5));
}
#sc-emoji pattern-grid > .em::before { content: "🌸"; }
#sc-emoji pattern-grid > .em:nth-child(10n+1)::before { content: "⭐"; }
#sc-emoji pattern-grid > .em:nth-child(10n+2)::before { content: "🍋"; }
#sc-emoji pattern-grid > .em:nth-child(10n+3)::before { content: "🌈"; }
#sc-emoji pattern-grid > .em:nth-child(10n+4)::before { content: "🐙"; }
#sc-emoji pattern-grid > .em:nth-child(10n+5)::before { content: "🦄"; }
#sc-emoji pattern-grid > .em:nth-child(10n+6)::before { content: "🍄"; }
#sc-emoji pattern-grid > .em:nth-child(10n+7)::before { content: "🌊"; }
#sc-emoji pattern-grid > .em:nth-child(10n+8)::before { content: "🔥"; }
#sc-emoji pattern-grid > .em:nth-child(10n+9)::before { content: "🌀"; }
```

- [ ] **Step 3: Verify**

Reload. Halftone: a square of magenta-on-cream dots with varying radii, looking like a print mosaic. Emoji shower: 100 cells filled with rotated/scaled emoji from the palette.

Commit:

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase pieces 22-23 (halftone, emoji)"
```

---

## Task 5: Piece 24 (Constellation)

**Files:**
- Modify: `docs/showcase.html`
- Modify: `docs/styles.css`

- [ ] **Step 1: Append figure**:

```html
      <!-- 24. Constellation -->
      <figure id="sc-stars">
        <div class="tile"><seed-context seed="stars" count="3"><pattern-grid cells="20x20"></pattern-grid></seed-context></div>
        <figcaption><strong>Constellation</strong>Sparse twinkling stars — drops into any dark hero section.</figcaption>
        <details><summary>Source</summary><pre><code>&lt;seed-context seed="stars" count="3"&gt;
  &lt;pattern-grid cells="20x20"&gt;&lt;/pattern-grid&gt;
&lt;/seed-context&gt;

#sc-stars pattern-grid &gt; i {
  /* ~12% of cells are stars; opacity clamps the rest to 0 */
  background: radial-gradient(circle, #fff 0%, transparent 60%);
  opacity: calc((var(--rand-0) - 0.88) * 100);
  animation: twinkle 4s ease-in-out infinite;
  animation-delay: calc(var(--rand-1) * -4s);
}
@keyframes twinkle {
  0%, 100% { transform: scale(1);   filter: brightness(1);   }
  50%      { transform: scale(1.4); filter: brightness(1.6); }
}</code></pre></details>
      </figure>
```

- [ ] **Step 2: Append CSS**:

```css
/* --- Showcase: Constellation --- */
#sc-stars .tile { background: var(--vb-night, #0a0a1e); }
#sc-stars pattern-grid {
  display: grid;
  grid-template-columns: repeat(var(--pg-cols), 1fr);
}
#sc-stars pattern-grid > i {
  aspect-ratio: 1;
  background: radial-gradient(circle, var(--vb-star, #fff) 0%, transparent 60%);
  opacity: calc((var(--rand-0) - 0.88) * 100);
  animation: sc-stars-twinkle 4s ease-in-out infinite;
  animation-delay: calc(var(--rand-1) * -4s);
}
@keyframes sc-stars-twinkle {
  0%, 100% { transform: scale(1);   filter: brightness(1); }
  50%      { transform: scale(1.4); filter: brightness(1.6); }
}
```

The `opacity: calc((var(--rand-0) - 0.88) * 100)` trick uses opacity's auto-clamp: when `--rand-0 > 0.88` the result is positive and clamps to 1 (visible); otherwise negative and clamps to 0 (hidden). About 12% of 400 cells = ~48 visible stars, randomly placed.

- [ ] **Step 3: Verify**

Reload. Constellation: dark night-sky tile with ~50 twinkling stars at random positions, each with a different phase.

Commit:

```bash
git add docs/showcase.html docs/styles.css
git commit -m "docs: showcase piece 24 (constellation)"
```

---

## Task 6: CHANGELOG note + final verification

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update `CHANGELOG.md`**

Open `CHANGELOG.md`. Replace the `## 0.2.0 — unreleased` section with:

```markdown
## 0.2.0 — unreleased

- Add `<seed-context>` companion: writes per-cell `--rand-N` (float) and `--randi-N` (integer) custom properties using a seeded mulberry32 PRNG. Listens for `pattern-grid:render` from any descendant pattern-grid.
- `count` default is 8 (16 properties per cell).
- Built-in anti-FOUC: cells inside a `<seed-context>` start invisible and fade in once populated.
- New docs page `docs/showcase.html` with 24 css-doodle-style demos covering geometric, procedural, animated, random, demoscene, SuperGraphics, Op-Art, and emoji categories.
- New `dist/seed-context.js` and `dist/seed-context.css` build outputs.
- New `./seed-context` and `./seed-context.css` package exports.
```

(The only change is `14` → `24` and the addition of the four new categories.)

- [ ] **Step 2: Browser click-through verification**

Run: `lsof -ti :5173 | xargs -r kill -9 2>/dev/null; npm run dev`

Open `http://localhost:5173/docs/showcase.html`. Scroll the full page and confirm all 24 tiles render. No console errors. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog notes 24-piece showcase"
```

---

## Self-Review Notes

**Spec coverage check:**
- Matrix rain — Task 1 (piece 15). Uses `<template>` cells with a `::before` katakana palette and animated gradient mask.
- Plasma — Task 1 (piece 16). Conic gradients + `hue-rotate` animation.
- Raster bars — Task 1 (piece 17). Single-column grid with brightness wave.
- Wireframe sphere — Task 2 (piece 18). Polar projection via `acos()` + slow rotation.
- Sea Ranch stripes — Task 2 (piece 19). 12-band vertical stack with `clip-path` diagonals; uses `--vb-stripe-hue` token.
- Push Pin mosaic — Task 3 (piece 20). 4 shapes selected by position (deterministic by-position rather than `--randi-0 % 4` because of CSS limitations); chunky drop-shadows.
- Bridget Riley waves — Task 3 (piece 21). Sine-wave `scaleY` on alternating B/W cells.
- Halftone dots — Task 4 (piece 22). Radial gradient with `--rand-0`-driven radius; uses `--vb-ink` / `--vb-paper` tokens.
- Emoji shower — Task 4 (piece 23). 10-glyph palette via `:nth-child(10n+k)::before`, rotation + scale from seeded randoms.
- Constellation — Task 5 (piece 24). Sparse stars via opacity-clamp trick; uses `--vb-night` / `--vb-star` tokens.

**Placeholder scan:** None. Every step has the actual CSS/HTML the engineer needs.

**Type consistency:** All `#sc-<slug>` IDs are unique and follow the existing convention. All keyframe names are prefixed `sc-<slug>-` to avoid collision with other pieces' animations.

**Known fragilities (documented inline):**
- Matrix rain `::before` uses `\A` escape for newlines inside `content:`. If this doesn't behave consistently across Chrome versions, the documented fallback drops glyphs and keeps the moving gradient. Visual impact survives.
- Wireframe sphere depends on `acos()`. Documented fallback uses a linear angle distribution if the browser doesn't support it yet.
- Push Pin's 4-shape selection is deterministic-by-position rather than truly random. Documented inline.
