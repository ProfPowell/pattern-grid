// test/seed-context.spec.js
import { test, expect } from '@playwright/test';

test.describe('<seed-context>', () => {
  test('writes --rand-0 and --randi-0 on each cell', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="hello">
        <pattern-grid cells="2x2"></pattern-grid>
      </seed-context>
    `);
    const values = await page.locator('pattern-grid > i').nth(0).evaluate((el) => ({
      rand0: el.style.getPropertyValue('--rand-0'),
      randi0: el.style.getPropertyValue('--randi-0'),
    }));
    expect(values.rand0).not.toBe('');
    expect(parseFloat(values.rand0)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(values.rand0)).toBeLessThan(1);
    expect(values.randi0).not.toBe('');
    expect(parseInt(values.randi0, 10)).toBeGreaterThanOrEqual(0);
    expect(parseInt(values.randi0, 10)).toBeLessThanOrEqual(99);
  });

  test('--randi-N is floor(--rand-N * 100)', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="t">
        <pattern-grid cells="3x3"></pattern-grid>
      </seed-context>
    `);
    const pairs = await page.locator('pattern-grid > i').evaluateAll((cells) =>
      cells.map((el) => ({
        rand: parseFloat(el.style.getPropertyValue('--rand-0')),
        randi: parseInt(el.style.getPropertyValue('--randi-0'), 10),
      })),
    );
    for (const { rand, randi } of pairs) {
      expect(randi).toBe(Math.floor(rand * 100));
    }
  });

  test('default count=8 writes --rand-0..7 and --randi-0..7', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x">
        <pattern-grid cells="2x1"></pattern-grid>
      </seed-context>
    `);
    const props = await page.locator('pattern-grid > i').first().evaluate((el) => {
      const out = {};
      for (let k = 0; k < 8; k++) {
        out[`rand-${k}`] = el.style.getPropertyValue(`--rand-${k}`);
        out[`randi-${k}`] = el.style.getPropertyValue(`--randi-${k}`);
      }
      out['rand-8'] = el.style.getPropertyValue('--rand-8');
      return out;
    });
    for (let k = 0; k < 8; k++) {
      expect(props[`rand-${k}`]).not.toBe('');
      expect(props[`randi-${k}`]).not.toBe('');
    }
    expect(props['rand-8']).toBe('');
  });

  test('same seed reproduces same --rand-0 on each cell', async ({ browser }) => {
    const html = `
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="alpha">
        <pattern-grid cells="3x3"></pattern-grid>
      </seed-context>
    `;
    // Use two separate pages so each gets a fresh document + fresh custom-element
    // upgrade cycle. A single page with setContent twice fails because cached
    // module scripts don't re-execute, causing the second render to fire while
    // elements are still detached.
    const page1 = await browser.newPage();
    await page1.setContent(html);
    const firstRun = await page1.locator('pattern-grid > i').evaluateAll((cells) =>
      cells.map((el) => el.style.getPropertyValue('--rand-0')),
    );
    await page1.close();

    const page2 = await browser.newPage();
    await page2.setContent(html);
    const secondRun = await page2.locator('pattern-grid > i').evaluateAll((cells) =>
      cells.map((el) => el.style.getPropertyValue('--rand-0')),
    );
    await page2.close();

    expect(firstRun.length).toBe(9);
    expect(secondRun).toEqual(firstRun);
  });

  test('different seed yields different --rand-0 on at least one cell', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context id="a" seed="alpha"><pattern-grid cells="3x3"></pattern-grid></seed-context>
      <seed-context id="b" seed="beta"><pattern-grid cells="3x3"></pattern-grid></seed-context>
    `);
    const a = await page.locator('#a pattern-grid > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    const b = await page.locator('#b pattern-grid > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    expect(a.length).toBe(9);
    expect(b.length).toBe(9);
    expect(a).not.toEqual(b);
  });
});
