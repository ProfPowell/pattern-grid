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

  test('empty seed still produces randoms', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const rand0 = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(rand0).not.toBe('');
  });

  test('changing seed attribute triggers reseed', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="one"><pattern-grid cells="3x3"></pattern-grid></seed-context>
    `);
    const before = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    await page.locator('seed-context').evaluate((el) => el.setAttribute('seed', 'two'));
    const after = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(after).not.toBe(before);
  });

  test('changing count rewrites with new slot count', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x" count="4"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const before = await page.locator('pattern-grid > i').first().evaluate((el) => ({
      r3: el.style.getPropertyValue('--rand-3'),
      r4: el.style.getPropertyValue('--rand-4'),
    }));
    expect(before.r3).not.toBe('');
    expect(before.r4).toBe('');
    await page.locator('seed-context').evaluate((el) => el.setAttribute('count', '6'));
    const after = await page.locator('pattern-grid > i').first().evaluate((el) => ({
      r5: el.style.getPropertyValue('--rand-5'),
      r6: el.style.getPropertyValue('--rand-6'),
    }));
    expect(after.r5).not.toBe('');
    expect(after.r6).toBe('');
  });

  test('count clamps 0 to 1 and 50 to 32', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context id="lo" seed="x" count="0"><pattern-grid cells="2x1"></pattern-grid></seed-context>
      <seed-context id="hi" seed="x" count="50"><pattern-grid cells="2x1"></pattern-grid></seed-context>
    `);
    const lo = await page.locator('#lo pattern-grid > i').first().evaluate((el) => ({
      r0: el.style.getPropertyValue('--rand-0'),
      r1: el.style.getPropertyValue('--rand-1'),
    }));
    expect(lo.r0).not.toBe('');
    expect(lo.r1).toBe('');
    const hi = await page.locator('#hi pattern-grid > i').first().evaluate((el) => ({
      r31: el.style.getPropertyValue('--rand-31'),
      r32: el.style.getPropertyValue('--rand-32'),
    }));
    expect(hi.r31).not.toBe('');
    expect(hi.r32).toBe('');
  });

  test('reseed() method re-writes without attribute change', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="s"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    await page.locator('pattern-grid > i').first().evaluate((el) => el.style.setProperty('--rand-0', '0.999'));
    await page.locator('seed-context').evaluate((el) => el.reseed());
    const restored = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(restored).not.toBe('0.999');
  });

  test('setting seed via JS property reflects to attribute and reseeds', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="one"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const before = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    await page.locator('seed-context').evaluate((el) => { el.seed = 'two'; });
    const attr = await page.locator('seed-context').evaluate((el) => el.getAttribute('seed'));
    const after = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(attr).toBe('two');
    expect(after).not.toBe(before);
  });

  test('seed-context appended after pattern-grid still populates cells', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <div id="host"><pattern-grid cells="2x2"></pattern-grid></div>
    `);
    const beforeWrap = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(beforeWrap).toBe('');
    await page.evaluate(() => {
      const host = document.getElementById('host');
      const grid = host.querySelector('pattern-grid');
      const ctx = document.createElement('seed-context');
      ctx.setAttribute('seed', 'late');
      // Move grid into disconnected ctx first so connectedCallback sees it when
      // ctx is appended to the document.
      ctx.appendChild(grid);
      host.appendChild(ctx);
    });
    const after = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(after).not.toBe('');
  });

  test('new pattern-grid appended into seed-context populates on render', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x"></seed-context>
    `);
    await page.evaluate(() => {
      const grid = document.createElement('pattern-grid');
      // Append first, then set cells so attributeChangedCallback fires while
      // connected — that triggers render() and the bubbling pattern-grid:render
      // event reaches seed-context's listener.
      document.querySelector('seed-context').appendChild(grid);
      grid.setAttribute('cells', '2x2');
    });
    const rand0 = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(rand0).not.toBe('');
  });

  test('disconnected seed-context stops populating new renders', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    await page.evaluate(() => {
      const ctx = document.querySelector('seed-context');
      ctx.remove();
    });
    await page.evaluate(() => {
      const grid = document.createElement('pattern-grid');
      document.body.appendChild(grid);
      grid.setAttribute('cells', '2x2');
    });
    const rand0 = await page.locator('body > pattern-grid > i').first().evaluate((el) => el.style.getPropertyValue('--rand-0'));
    expect(rand0).toBe('');
  });

  test('populates 1000 cells in under 50ms', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
    `);
    const duration = await page.evaluate(() => new Promise((resolve) => {
      const ctx = document.createElement('seed-context');
      ctx.setAttribute('seed', 'perf');
      document.body.appendChild(ctx);
      ctx.addEventListener('seed-context:populated', (e) => {
        if (e.detail.target.cellElements.length === 1000) {
          resolve(performance.now() - t0);
        }
      });
      const grid = document.createElement('pattern-grid');
      const t0 = performance.now();
      ctx.appendChild(grid);
      grid.setAttribute('cells', '50x20');
    }));
    expect(duration).toBeLessThan(50);
  });

  test('two pattern-grids inside one seed-context get independent randoms', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="x">
        <pattern-grid id="a" cells="3x3"></pattern-grid>
        <pattern-grid id="b" cells="3x3"></pattern-grid>
      </seed-context>
    `);
    const a = await page.locator('#a > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    const b = await page.locator('#b > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    expect(a).not.toEqual(b);
  });

  test('dispatches seed-context:populated event with correct detail', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="evt"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const detail = await page.evaluate(() => new Promise((resolve) => {
      document.querySelector('seed-context').addEventListener(
        'seed-context:populated',
        (e) => resolve({ tagName: e.detail.target.tagName, count: e.detail.count, bubbles: e.bubbles }),
        { once: true },
      );
      document.querySelector('seed-context').reseed();
    }));
    expect(detail.tagName).toBe('PATTERN-GRID');
    expect(detail.count).toBe(8);
    expect(detail.bubbles).toBe(true);
  });

  test('cells outside a seed-context are not opacity-hidden', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <pattern-grid cells="2x2"></pattern-grid>
    `);
    const opacity = await page.locator('pattern-grid > i').first().evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
  });

  test('cells inside a populated seed-context end up opacity 1', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context seed="o"><pattern-grid cells="2x2"></pattern-grid></seed-context>
    `);
    const inlineOpacity = await page.locator('pattern-grid > i').first().evaluate((el) => el.style.opacity);
    expect(inlineOpacity).toBe('1');
  });

  test('nested seed-contexts: innermost scan wins, values match a solo inner-seeded context', async ({ page }) => {
    // Both contexts observe the pattern-grid:render event. The innermost
    // seed-context's connectedCallback scan runs last (tree-order upgrades),
    // so its seed is the final write. Verify this by comparing against a
    // standalone seed-context with the same "inner" seed.
    await page.setContent(`
      <script type="module" src="http://localhost:5173/src/pattern-grid.js"></script>
      <script type="module" src="http://localhost:5173/src/seed-context.js"></script>
      <seed-context id="outer" seed="outer">
        <seed-context id="inner" seed="inner">
          <pattern-grid cells="3x3"></pattern-grid>
        </seed-context>
      </seed-context>
      <seed-context id="control" seed="inner">
        <pattern-grid cells="3x3"></pattern-grid>
      </seed-context>
    `);
    const nested = await page.locator('#outer pattern-grid > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    const control = await page.locator('#control pattern-grid > i').evaluateAll((c) => c.map((el) => el.style.getPropertyValue('--rand-0')));
    expect(nested.length).toBe(9);
    expect(nested).toEqual(control);
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
