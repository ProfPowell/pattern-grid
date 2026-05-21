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
});
