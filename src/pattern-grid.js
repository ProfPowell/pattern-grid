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
    return [...this.children].filter((el) => el.tagName !== 'TEMPLATE');
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
      return clamp(+parts[axis] || 1);
    }
    return clamp(+(this.getAttribute(name) ?? 1));
  }
}

const clamp = (n) => Math.max(1, Math.min(256, n | 0));

customElements.define('pattern-grid', PatternGrid);
export default PatternGrid;
