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
