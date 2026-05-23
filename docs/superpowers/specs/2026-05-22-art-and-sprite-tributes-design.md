# Art tributes & 8-bit sprite walls — design

**Date:** 2026-05-22
**Scope:** New showcase section adding 14 pieces (44–57) to `docs/showcase.html`.
**Status:** Approved (brainstorm)

## Goal

Add a third showcase section to `docs/showcase.html` that demonstrates three
under-served categories for `<pattern-grid>`:

1. Tributes to abstract artists (Mondrian, Albers, LeWitt, Kandinsky,
   Kelly, Kusama).
2. 8-bit / sprite walls — single sprites, animated sprites, a sprite-sheet
   picker, palette cycling, and an interactive pixel scratchpad.
3. Pop & illusion crossovers — Escher tessellation and Lichtenstein POW.

The section is meant to read like a small gallery tour: hard-edge
geometric tributes, then painterly tributes, then pixel-art demos,
ending with two pop/illusion pieces that show off platform features
(tessellation via `clip-path`, anchor positioning + popover).

## Non-goals

- No changes to `src/pattern-grid.js`, `src/seed-context.js`, or
  `src/paint-worklet.js`. The ≤80-line core constraint in `CLAUDE.md`
  stays intact.
- No shared NES-style palette table. Each sprite demo is self-contained
  (per the user's brainstorm answer).
- No second-round artists in this batch: Malevich, Stella, Anni Albers,
  Agnes Martin, Warhol are explicitly deferred.

## Structure

A new `<h2 class="showcase-section">Tributes — abstract art & 8-bit
sprites</h2>` is appended to `docs/showcase.html`, after the existing
"Modern platform showcase" section. The numbering continues at 44 and
ends at 57. Each piece is a `<figure>` matching the existing showcase
pattern: tile + figcaption + `<details>` Source block.

Pieces are ordered by theme cluster (not by ID):

| ID | Theme cluster        | Title                                       |
|----|----------------------|---------------------------------------------|
| 44 | Hard-edge abstract   | Mondrian — Composition with Red, Yellow & Blue |
| 45 | Hard-edge abstract   | Albers — Homage to the Square               |
| 46 | Hard-edge abstract   | Sol LeWitt — algorithmic line work          |
| 47 | Soft / painterly     | Kandinsky — Squares with Concentric Circles |
| 48 | Soft / painterly     | Ellsworth Kelly — Colors for a Large Wall   |
| 49 | Soft / painterly     | Yayoi Kusama — infinity dots                |
| 50 | Single sprite        | Space Invader                               |
| 51 | Single sprite (anim) | Pac-Man chomp                               |
| 52 | Single sprite (hov)  | Mario-style idle → jump                     |
| 53 | Interactive sprite   | Sprite-sheet picker                         |
| 54 | Interactive sprite   | Palette-cycle invader                       |
| 55 | Interactive sprite   | Pixel-paint scratchpad                      |
| 56 | Pop & illusion       | Escher — tessellating birds                 |
| 57 | Pop & illusion       | Lichtenstein — POW                          |

## Shared CSS utilities

Added once at the top of the new styles block in `docs/styles.css`:

```css
/* --- Showcase: shared sprite utilities --- */
.pixel-grid {
  image-rendering: pixelated;
  gap: 0;
  background: var(--pg-bg, #111);
}
.pixel-grid > i,
.pixel-grid > button { background: transparent; aspect-ratio: 1; border: 0; padding: 0; }
.pixel-grid > [data-px] { background: var(--px, transparent); }
```

Each sprite demo sets `class="pixel-grid"` on its `<pattern-grid>` host
and writes per-attribute palette rules inline, e.g.:

```css
#sc-invader [data-px="1"] { --px: #00ff00; }
```

## Sprite cell generation

For sprite demos, cells come from a tiny inline `<script>` per figure
that expands a pixel string:

```html
<script>
  const grid = document.getElementById('sc-invader-grid');
  const pixels = "00011000..."; // 88 chars for 11×8
  grid.innerHTML = [...pixels].map(c => `<i data-px="${c}"></i>`).join('');
</script>
```

Pixel data lives as a literal string inside the page so the markup is
the source of truth. No external asset files.

## Per-piece notes

### 44. Mondrian — Composition with Red, Yellow & Blue

Hand-authored cell layout. The `<pattern-grid>` uses `cols="6" rows="6"`
and the cells are hand-written `<i>` elements with `style="grid-area:
…"` to span varying tracks, producing the asymmetric block layout.
Black gutters come from `gap: 6px` plus the host element's `background:
#111`.

Palette: primary red `#dd2222`, primary blue `#1f3fbf`, primary yellow
`#f0d040`, off-white `#f4f0e6`.

### 45. Albers — Homage to the Square

Three or four nested `<pattern-grid cols="1" rows="1">` layers. The
outer cell has `padding: 12%`; its single child is another
`<pattern-grid cols="1" rows="1">` with `padding: 12%`, and so on. Each
layer has a warm background (`#7a3b1c`, `#b25a26`, `#d77a37`, `#e8a55a`)
to evoke Albers' colour studies.

### 46. Sol LeWitt — algorithmic line work

`<pattern-grid cols="12" rows="12" shim="sibling">`. Each cell is a
single 1px-thick diagonal drawn via `clip-path: polygon(...)` and
rotated by `calc(var(--i) * 17deg)`. The cells share a single neutral
background; only the line orientation varies.

### 47. Kandinsky — Squares with Concentric Circles

`<seed-context seed="kandinsky" count="3">` wraps a `<pattern-grid
cols="4" rows="3">`. Each cell stacks four nested radial gradients of
shrinking radius, each with a different hue derived from `--rand-0`,
`--rand-1`, `--rand-2` (so all three colours within a cell are
seed-stable).

### 48. Ellsworth Kelly — Colors for a Large Wall

`<seed-context seed="kelly"><pattern-grid cols="8" rows="8"></seed-context>`.
Each cell's background:
```css
background: color-mix(in oklch,
                      hsl(calc(var(--rand-0) * 360) 85% 55%),
                      white calc(var(--rand-1) * 25%));
```
Flat, saturated, slightly off-white-mixed; reads as Bauhaus colour
field.

### 49. Yayoi Kusama — infinity dots

`<seed-context seed="kusama"><pattern-grid cols="16" rows="16"></seed-context>`.
Each cell:
```css
background: radial-gradient(circle at center,
                            #c00 0 calc(var(--rand-0) * 40%),
                            #fff calc(var(--rand-0) * 40% + 1px) 100%);
transition: scale 200ms;
```
Hover: `scale: 1.25` so the dot blooms.

### 50. Space Invader

`<pattern-grid cols="11" rows="8" class="pixel-grid">`. Pixel string is
88 chars of `0` (transparent) and `1` (green). Two palette rules. Tile
background is dark for contrast.

### 51. Pac-Man chomp

`<pattern-grid cols="13" rows="13" class="pixel-grid">`. Two pixel
arrays — mouth-open and mouth-closed — stored in JS. A 5-line `<script>`
uses `setInterval(() => { frame = 1 - frame;
grid.classList.toggle('frame-b'); }, 200)`. CSS:
```css
#sc-pacman:not(.frame-b) [data-px-a="1"] { --px: #ffeb00; }
#sc-pacman.frame-b       [data-px-b="1"] { --px: #ffeb00; }
```
Cells carry both `data-px-a` and `data-px-b` attributes; CSS picks
which is active based on host class.

(Note: simpler alternative — re-render `grid.innerHTML` every 200 ms
with the active pixel string. Acceptable; we'll pick at implementation
time based on which is cleaner.)

### 52. Mario-style idle → jump (hover-swap)

Two `<pattern-grid class="pixel-grid">` elements stacked in the tile
via `position: absolute`; `:hover` on the tile swaps `opacity`/`visibility`
between them. Both sprites are self-contained (own pixel strings + own
palettes).

Sprite content: a small generic platformer hero — round head, simple
body. We do *not* ship Nintendo-trademarked Mario; the caption can read
"hover-swap sprite" with Mario named as inspiration in the description.

### 53. Sprite-sheet picker

Four hidden `<input type="radio" name="sc-picker">` chips with `<label
for>` triggers visible above the tile. Below: four
`<pattern-grid class="pixel-grid">` sprites stacked, all `display:
none`. CSS:
```css
#sc-picker:has(#sc-picker-1:checked) #sc-pick-1 { display: grid; }
#sc-picker:has(#sc-picker-2:checked) #sc-pick-2 { display: grid; }
```
Each sprite owns its own palette + pixels (self-contained). Candidates:
Invader / Pac-Man Ghost / Mushroom / Heart.

### 54. Palette-cycle invader

Same invader pixel data as #50, but the colour comes from a registered
custom property:

```css
@property --hue { syntax: '<angle>'; inherits: true; initial-value: 0deg; }
#sc-cycle { animation: sc-hue-cycle 4s linear infinite; }
@keyframes sc-hue-cycle { to { --hue: 360deg; } }
#sc-cycle [data-px="1"] { --px: hsl(var(--hue) 80% 55%); }
```

The animation interpolates `--hue` smoothly because of `@property`.

### 55. Pixel-paint scratchpad

`<pattern-grid cols="16" rows="16" class="pixel-grid">` whose
`<template>` is `<button type="button" data-px="0"></button>`. A 6-line
JS click handler cycles `data-px` 0 → 1 → 2 → 3 → 0. CSS maps the four
values to four palette colours. No save/load — pure play.

### 56. Escher — tessellating birds

`<pattern-grid cols="10" rows="10" shim="sibling">`. Each cell renders
a bird-silhouette `clip-path: polygon(...)` so that adjacent cells
interlock — the negative space of one bird is the positive space of the
next. Two alternating palettes (light bird on dark, dark bird on light)
driven by `:nth-child(2n)`/`:nth-child(odd)` plus row-parity via
`calc(var(--i) / 10)` math. The clip-path is a hand-tuned set of points
that gives a stylised bird outline; cells in even rows are reflected
via `scale(-1, 1)` so the tessellation closes.

This is the "M.C. Escher Day and Night" effect at low fidelity —
recognisable as tessellating birds without claiming photorealism.

### 57. Lichtenstein — POW

`<pattern-grid cols="6" rows="4" shim="sibling">` with a Ben-Day dot
background applied to every cell:

```css
#sc-pow pattern-grid > i {
  background:
    radial-gradient(circle at 50% 50%, #c00 0 28%, transparent 30%)
      0 0 / 16px 16px;
  background-color: #fdd835;
}
```

One designated "hero" cell is a `<button popovertarget>` that opens an
anchored `<div popover>` styled as a comic-book speech balloon with the
word **POW!** in bold sans-serif, anchored above-right via CSS Anchor
Positioning. Hover/click both trigger the popover (the button gets
`popovertargetaction="toggle"`).

Demonstrates: anchor positioning + popover + Ben-Day-dot CSS gradients
in a pop-art tribute.

## File touch list

- `docs/showcase.html` — +12 figures (~30–80 lines each including
  `<details>` source) plus the new `<h2>` heading.
- `docs/styles.css` — new "Tributes" block at the end with the shared
  utilities and per-piece rules.

Estimated diff: ~700–1000 lines across the two files; almost entirely
additive.

## Implementation order

1. **Hard-edge cluster (44–46)** — pure CSS, fastest signal that the
   page structure and styling conventions are right.
2. **Painterly cluster (47–49)** — exercises `<seed-context>`,
   `color-mix(oklch)`, radial gradients, and hover scaling.
3. **Single sprites (50–52)** — pins down the pixel-string convention,
   shared `.pixel-grid` utility, and the inline-script cell generator.
4. **Interactive sprites (53–55)** — sprite-sheet picker, palette
   cycler, paint scratchpad.
5. **Pop & illusion (56–57)** — Escher tessellation (clip-path tuning)
   and Lichtenstein POW (popover + anchor positioning).

Within each cluster, the pieces can be reviewed and merged together or
individually.

## Risks

- **Cell count.** A 16×16 sprite renders 256 `<i>` elements. The
  existing scroll-reveal piece already renders 144. Two pieces (49
  Kusama and 55 paint scratchpad) hit 256. No expected performance
  issue.
- **Trademark.** Avoid named Nintendo/Sega/Namco IP in captions and
  source comments. Refer to "Pac-Man-style chomp", "Mario-style hover
  swap", "ghost-shaped sprite" — design language as inspiration, not
  reproduction.
- **`@property` browser support (#54).** `@property` is in Baseline
  but Firefox added it relatively recently; on unsupported browsers the
  invader simply doesn't cycle (the `data-px="1"` rule still paints it
  whatever the initial-value hue is). Acceptable degradation.
- **Pac-Man chomp (#51) approach.** The CSS-only frame-swap trick using
  two parallel `data-px-a` / `data-px-b` attributes is clever but
  doubles the cells' attribute payload. The 5-line JS alternative
  (re-render `innerHTML` every 200 ms) is simpler. Will pick at
  implementation time.
- **Escher tessellation (#56) tuning.** A clip-path that *truly*
  tessellates is hard to hand-tune; we'll accept a stylised
  bird-silhouette that *reads* as interlocking even if a few pixels
  don't perfectly mate. The piece sells the idea, not pixel-perfect
  Escher.
- **Popover + anchor positioning (#57).** `[popover]` and CSS Anchor
  Positioning are both Baseline 2024 but with Firefox catching up;
  unsupported browsers will fall back to the button just doing nothing
  on click. Acceptable degradation — the Ben-Day-dot tile still looks
  like Lichtenstein.

## Acceptance criteria

- New "Tributes — abstract art & 8-bit sprites" `<h2>` appears in the
  showcase, after "Modern platform showcase".
- All 14 pieces render without console errors on the live GitHub Pages
  build.
- Hover, click, and animation interactions work as described above.
- `npm test` continues to pass 36/36.
- No files outside `docs/showcase.html` and `docs/styles.css` change.
