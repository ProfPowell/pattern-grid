var p = Object.defineProperty;
var u = (e) => {
  throw TypeError(e);
};
var w = (e, s, t) => s in e ? p(e, s, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[s] = t;
var m = (e, s, t) => w(e, typeof s != "symbol" ? s + "" : s, t), A = (e, s, t) => s.has(e) || u("Cannot " + t);
var d = (e, s, t) => s.has(e) ? u("Cannot add the same private member more than once") : s instanceof WeakSet ? s.add(e) : s.set(e, t);
var c = (e, s, t) => (A(e, s, "access private method"), t);
var i, o, h, a;
class b extends HTMLElement {
  constructor() {
    super(...arguments);
    d(this, i);
  }
  connectedCallback() {
    c(this, i, o).call(this);
  }
  attributeChangedCallback() {
    c(this, i, o).call(this);
  }
  get cols() {
    return c(this, i, a).call(this, "cols", 0);
  }
  set cols(t) {
    this.setAttribute("cols", t);
  }
  get rows() {
    return c(this, i, a).call(this, "rows", 1);
  }
  set rows(t) {
    this.setAttribute("rows", t);
  }
  get cell() {
    return this.getAttribute("cell") ?? "i";
  }
  set cell(t) {
    this.setAttribute("cell", t);
  }
  get total() {
    return this.cols * this.rows;
  }
  get cellElements() {
    return [...this.children].filter((t) => t.tagName !== "TEMPLATE");
  }
  cellAt(t, l) {
    const r = this.cellElements, n = l === void 0 ? t : t + l * this.cols;
    return r[n] ?? null;
  }
  render() {
    const t = this.total, l = this.querySelector(":scope > template"), n = Array.from({ length: t }, l ? () => l.content.cloneNode(!0) : () => document.createElement(this.cell));
    this.replaceChildren(...l ? [l, ...n] : n), this.getAttribute("shim") === "sibling" && c(this, i, h).call(this), this.dispatchEvent(new CustomEvent("pattern-grid:render", {
      detail: { cols: this.cols, rows: this.rows, total: t },
      bubbles: !0
    }));
  }
}
i = new WeakSet(), o = function() {
  const t = this.cols, l = this.rows;
  this.style.setProperty("--pg-cols", t), this.style.setProperty("--pg-rows", l), this.cellElements.length !== t * l ? this.render() : this.getAttribute("shim") === "sibling" && c(this, i, h).call(this);
}, h = function() {
  this.style.setProperty("--n", this.total), this.cellElements.forEach((t, l) => t.style.setProperty("--i", l + 1));
}, a = function(t, l) {
  const r = this.getAttribute("cells");
  if (r) {
    const n = r.includes("x") ? r.split("x") : [r, "1"];
    return g(+n[l] || 1);
  }
  return g(+(this.getAttribute(t) ?? 1));
}, m(b, "observedAttributes", ["cols", "rows", "cells", "cell", "seed", "shim"]);
const g = (e) => Math.max(1, Math.min(256, e | 0));
customElements.define("pattern-grid", b);
export {
  b as default
};
