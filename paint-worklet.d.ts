// paint-worklet.d.ts
export interface PaintWorkletRegisteredDetail {
  src: string;
}

export interface PaintWorkletErrorDetail {
  src: string;
  error: Error;
}

export default class PaintWorklet extends HTMLElement {}

declare global {
  interface HTMLElementTagNameMap {
    'paint-worklet': PaintWorklet;
  }
  interface HTMLElementEventMap {
    'paint-worklet:registered': CustomEvent<PaintWorkletRegisteredDetail>;
    'paint-worklet:error': CustomEvent<PaintWorkletErrorDetail>;
  }
}
