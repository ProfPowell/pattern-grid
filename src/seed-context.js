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
