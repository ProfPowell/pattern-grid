import { test, expect } from '@playwright/test';

test.describe('<pattern-grid>', () => {
  test('generates cols × rows cells from cells="8x8"', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cells="8x8"></pattern-grid>
    `);
    await expect(page.locator('pattern-grid > i')).toHaveCount(64);
  });

  test('cols + rows attributes override defaults', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cols="4" rows="3"></pattern-grid>
    `);
    await expect(page.locator('pattern-grid > i')).toHaveCount(12);
  });

  test('attribute change regenerates cells', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cols="2" rows="2"></pattern-grid>
    `);
    await page.locator('pattern-grid').evaluate((el) => el.setAttribute('cols', '5'));
    await expect(page.locator('pattern-grid > i')).toHaveCount(10);
  });

  test('cell attribute uses custom tag', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cells="4" cell="span"></pattern-grid>
    `);
    await expect(page.locator('pattern-grid > span')).toHaveCount(4);
    await expect(page.locator('pattern-grid > i')).toHaveCount(0);
  });

  test('template child is cloned per cell', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cells="3">
        <template><b class="dot"></b></template>
      </pattern-grid>
    `);
    await expect(page.locator('pattern-grid > b.dot')).toHaveCount(3);
    await expect(page.locator('pattern-grid > template')).toHaveCount(1);
  });

  test('hand-authored cells with matching count are preserved', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cols="2" rows="2">
        <a href="/1"></a><a href="/2"></a><a href="/3"></a><a href="/4"></a>
      </pattern-grid>
    `);
    await expect(page.locator('pattern-grid > a')).toHaveCount(4);
    await expect(page.locator('pattern-grid > a[href="/1"]')).toHaveCount(1);
  });

  test('sets --pg-cols and --pg-rows custom properties', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cells="8x4"></pattern-grid>
    `);
    const cols = await page
      .locator('pattern-grid')
      .evaluate((el) => el.style.getPropertyValue('--pg-cols'));
    const rows = await page
      .locator('pattern-grid')
      .evaluate((el) => el.style.getPropertyValue('--pg-rows'));
    expect(cols).toBe('8');
    expect(rows).toBe('4');
  });

  test('dispatches pattern-grid:render event', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cells="4"></pattern-grid>
    `);
    const detail = await page.evaluate(
      () =>
        new Promise((resolve) => {
          document
            .querySelector('pattern-grid')
            .addEventListener('pattern-grid:render', (e) => resolve(e.detail), { once: true });
          document.querySelector('pattern-grid').render();
        }),
    );
    expect(detail).toEqual({ cols: 4, rows: 1, total: 4 });
  });

  test('shim="sibling" sets --i on each cell and --n on host', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cells="3" shim="sibling"></pattern-grid>
    `);
    const n = await page
      .locator('pattern-grid')
      .evaluate((el) => el.style.getPropertyValue('--n'));
    expect(n).toBe('3');
    const cellTwoI = await page
      .locator('pattern-grid > i')
      .nth(1)
      .evaluate((el) => el.style.getPropertyValue('--i'));
    expect(cellTwoI).toBe('2');
  });

  test('clamps cols and rows to [1, 256]', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <pattern-grid cols="9999" rows="0"></pattern-grid>
    `);
    await expect(page.locator('pattern-grid > i')).toHaveCount(256);
  });
});
