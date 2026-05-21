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
});
