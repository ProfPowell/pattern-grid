var H = Object.defineProperty;
var E = (s) => {
  throw TypeError(s);
};
var L = (s, t, e) => t in s ? H(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var M = (s, t, e) => L(s, typeof t != "symbol" ? t + "" : t, e), p = (s, t, e) => t.has(s) || E("Cannot " + e);
var i = (s, t, e) => (p(s, t, "read from private field"), e ? e.call(s) : t.get(s)), a = (s, t, e) => t.has(s) ? E("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(s) : t.set(s, e), S = (s, t, e, n) => (p(s, t, "write to private field"), n ? n.call(s, e) : t.set(s, e), e), u = (s, t, e) => (p(s, t, "access private method"), e);
var C = (s, t, e, n) => ({
  set _(o) {
    S(s, t, o, e);
  },
  get _() {
    return i(s, t, n);
  }
});
var c, f, l, r, m;
class v extends HTMLElement {
  constructor() {
    super(...arguments);
    a(this, r);
    a(this, c, /* @__PURE__ */ new Map());
    // pattern-grid -> gridOffset (stable per instance)
    a(this, f, 0);
    a(this, l, (e) => {
      u(this, r, m).call(this, e.target);
    });
  }
  connectedCallback() {
    T(), this.addEventListener("pattern-grid:render", i(this, l));
    for (const e of this.querySelectorAll(":scope pattern-grid"))
      e.cellElements && e.cellElements.length > 0 && u(this, r, m).call(this, e);
  }
  disconnectedCallback() {
    this.removeEventListener("pattern-grid:render", i(this, l));
  }
  attributeChangedCallback() {
    this.isConnected && this.reseed();
  }
  get seed() {
    return this.getAttribute("seed") ?? "";
  }
  set seed(e) {
    this.setAttribute("seed", e);
  }
  get count() {
    return $(+(this.getAttribute("count") ?? 8));
  }
  set count(e) {
    this.setAttribute("count", e);
  }
  get seedHash() {
    return F(this.seed);
  }
  get prng() {
    return y(this.seedHash);
  }
  reseed() {
    for (const e of i(this, c).keys()) u(this, r, m).call(this, e);
  }
}
c = new WeakMap(), f = new WeakMap(), l = new WeakMap(), r = new WeakSet(), m = function(e) {
  i(this, c).has(e) || i(this, c).set(e, C(this, f)._++);
  const n = i(this, c).get(e), o = e.cellElements, g = this.count, k = this.seedHash ^ Math.imul(n, 2246822507);
  for (let h = 0; h < o.length; h++) {
    const B = y(k ^ Math.imul(h, 2654435761));
    let b = "opacity:1;";
    for (let d = 0; d < g; d++) {
      const x = B();
      b += `--rand-${d}:${x};--randi-${d}:${Math.floor(x * 100)};`;
    }
    o[h].style.cssText = b;
  }
  this.dispatchEvent(new CustomEvent("seed-context:populated", {
    detail: { target: e, count: g },
    bubbles: !0
  }));
}, M(v, "observedAttributes", ["seed", "count"]);
const $ = (s) => Math.max(1, Math.min(32, s | 0)) || 8, F = (s) => {
  let t = 3735928559, e = 1103547991;
  for (let n = 0; n < s.length; n++) {
    const o = s.charCodeAt(n);
    t = Math.imul(t ^ o, 2654435761), e = Math.imul(e ^ o, 1597334677);
  }
  return t = Math.imul(t ^ t >>> 16, 2246822507), e = Math.imul(e ^ e >>> 13, 3266489909), e >>> 0 ^ t >>> 0;
}, y = (s) => () => {
  let t = s += 1831565813;
  return t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / 4294967296;
}, A = "seed-context-fouc";
function T() {
  if (document.getElementById(A)) return;
  const s = document.createElement("style");
  s.id = A, s.textContent = "seed-context > pattern-grid > *:not(template) { opacity: 0; transition: opacity 220ms ease-out; }", document.head.appendChild(s);
}
customElements.define("seed-context", v);
export {
  v as default
};
