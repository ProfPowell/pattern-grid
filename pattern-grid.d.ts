export interface PatternGridRenderDetail {
  cols: number;
  rows: number;
  total: number;
}

export default class PatternGrid extends HTMLElement {
  static observedAttributes: readonly ['cols', 'rows', 'cells', 'cell', 'seed', 'shim'];

  cols: number;
  rows: number;
  cell: string;

  readonly total: number;
  readonly cellElements: Element[];

  render(): void;
  cellAt(index: number): Element | null;
  cellAt(x: number, y: number): Element | null;
}

declare global {
  interface HTMLElementTagNameMap {
    'pattern-grid': PatternGrid;
  }
  interface HTMLElementEventMap {
    'pattern-grid:render': CustomEvent<PatternGridRenderDetail>;
  }
}
