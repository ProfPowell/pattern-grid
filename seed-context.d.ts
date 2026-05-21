export interface SeedContextPopulatedDetail {
  target: HTMLElement;
  count: number;
}

export default class SeedContext extends HTMLElement {
  static observedAttributes: readonly ['seed', 'count'];

  seed: string;
  count: number;

  readonly seedHash: number;
  readonly prng: () => number;

  reseed(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'seed-context': SeedContext;
  }
  interface HTMLElementEventMap {
    'seed-context:populated': CustomEvent<SeedContextPopulatedDetail>;
  }
}
