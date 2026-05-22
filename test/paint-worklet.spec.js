// test/paint-worklet.spec.js
import { test, expect } from '@playwright/test';

// CSS.paintWorklet is undefined in Playwright's headless Chromium context,
// and page.addInitScript timing was unreliable for this setup. We install
// the stub via an inline classic script that runs before the module import.

const PAGE = (stub) => `
  <script>${stub}</script>
  <script type="module" src="http://localhost:5173/src/paint-worklet.js"></script>
`;

const STUB_OK = `
  window.__pw_addModuleCalls = [];
  window.CSS.paintWorklet = {
    addModule: (url) => {
      window.__pw_addModuleCalls.push(url);
      return Promise.resolve();
    },
  };
`;
const STUB_REJECT = `
  window.CSS.paintWorklet = {
    addModule: () => Promise.reject(new Error('404')),
  };
`;
const STUB_ABSENT = `/* leave CSS.paintWorklet undefined */`;

test.describe('<paint-worklet>', () => {
  test('dispatches paint-worklet:registered when src loads successfully', async ({ page }) => {
    await page.setContent(PAGE(STUB_OK));
    const detail = await page.evaluate(async () => {
      await customElements.whenDefined('paint-worklet');
      return new Promise((resolve) => {
        document.addEventListener('paint-worklet:registered', (e) => resolve(e.detail));
        const el = document.createElement('paint-worklet');
        el.setAttribute('src', '/worklets/test.js');
        document.body.appendChild(el);
      });
    });
    expect(detail).toEqual({ src: '/worklets/test.js' });
    const calls = await page.evaluate(() => window.__pw_addModuleCalls);
    expect(calls).toEqual(['/worklets/test.js']);
  });

  test('dispatches paint-worklet:error when CSS.paintWorklet is unavailable', async ({ page }) => {
    await page.setContent(PAGE(STUB_ABSENT));
    const detail = await page.evaluate(async () => {
      await customElements.whenDefined('paint-worklet');
      return new Promise((resolve) => {
        document.addEventListener('paint-worklet:error', (e) =>
          resolve({ src: e.detail.src, message: e.detail.error.message }),
        );
        const el = document.createElement('paint-worklet');
        el.setAttribute('src', '/worklets/test.js');
        document.body.appendChild(el);
      });
    });
    expect(detail.src).toBe('/worklets/test.js');
    expect(detail.message).toMatch(/paintWorklet unavailable/i);
  });

  test('dispatches paint-worklet:error when addModule rejects', async ({ page }) => {
    await page.setContent(PAGE(STUB_REJECT));
    const detail = await page.evaluate(async () => {
      await customElements.whenDefined('paint-worklet');
      return new Promise((resolve) => {
        document.addEventListener('paint-worklet:error', (e) =>
          resolve({ src: e.detail.src, message: e.detail.error.message }),
        );
        const el = document.createElement('paint-worklet');
        el.setAttribute('src', '/worklets/missing.js');
        document.body.appendChild(el);
      });
    });
    expect(detail.src).toBe('/worklets/missing.js');
    expect(detail.message).toBe('404');
  });

  test('does nothing when src is missing', async ({ page }) => {
    await page.setContent(PAGE(STUB_OK));
    const result = await page.evaluate(async () => {
      await customElements.whenDefined('paint-worklet');
      let fired = false;
      document.addEventListener('paint-worklet:registered', () => (fired = true));
      document.addEventListener('paint-worklet:error', () => (fired = true));
      const el = document.createElement('paint-worklet');
      document.body.appendChild(el);
      await new Promise((r) => setTimeout(r, 50));
      return { fired, calls: window.__pw_addModuleCalls };
    });
    expect(result.fired).toBe(false);
    expect(result.calls).toEqual([]);
  });

  test('deduplicates same src across multiple instances', async ({ page }) => {
    await page.setContent(PAGE(STUB_OK));
    const result = await page.evaluate(async () => {
      await customElements.whenDefined('paint-worklet');
      const events = [];
      document.addEventListener('paint-worklet:registered', (e) => events.push(e.detail.src));
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('paint-worklet');
        el.setAttribute('src', '/worklets/dup.js');
        document.body.appendChild(el);
      }
      await new Promise((r) => setTimeout(r, 50));
      return { events, calls: window.__pw_addModuleCalls };
    });
    expect(result.calls).toEqual(['/worklets/dup.js']);
    expect(result.events.length).toBe(3);
    expect(result.events.every((s) => s === '/worklets/dup.js')).toBe(true);
  });
});
