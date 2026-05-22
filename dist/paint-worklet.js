var l = (t) => {
  throw TypeError(t);
};
var c = (t, r, e) => r.has(t) || l("Cannot " + e);
var d = (t, r, e) => r.has(t) ? l("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(t) : r.set(t, e);
var i = (t, r, e) => (c(t, r, "access private method"), e);
const a = /* @__PURE__ */ new Set();
var n, o;
class p extends HTMLElement {
  constructor() {
    super(...arguments);
    d(this, n);
  }
  connectedCallback() {
    var s;
    const e = this.getAttribute("src");
    if (e) {
      if (a.has(e)) {
        i(this, n, o).call(this, "paint-worklet:registered", { src: e });
        return;
      }
      if (typeof ((s = CSS == null ? void 0 : CSS.paintWorklet) == null ? void 0 : s.addModule) != "function") {
        i(this, n, o).call(this, "paint-worklet:error", {
          src: e,
          error: new Error("CSS.paintWorklet unavailable")
        });
        return;
      }
      a.add(e), CSS.paintWorklet.addModule(e).then(
        () => i(this, n, o).call(this, "paint-worklet:registered", { src: e }),
        (u) => {
          a.delete(e), i(this, n, o).call(this, "paint-worklet:error", { src: e, error: u });
        }
      );
    }
  }
}
n = new WeakSet(), o = function(e, s) {
  this.dispatchEvent(new CustomEvent(e, { detail: s, bubbles: !0 }));
};
customElements.define("paint-worklet", p);
export {
  p as default
};
