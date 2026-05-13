import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

const TOLERANCE = 0.5; // px

test.describe('SpellsTable — uniform row height + flush container bottom (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('all spell data rows have the same height (Spells tab)', async ({ page }) => {
    const rows = page.locator('[data-pw="spell-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);

    const heights = await Promise.all(
      Array.from({ length: count }, (_, i) => rows.nth(i).boundingBox().then((b) => b!.height)),
    );

    const first = heights[0];
    for (const h of heights) {
      expect(Math.abs(h - first)).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  test('table container bottom is flush with last spell row bottom (Spells tab)', async ({
    page,
  }) => {
    const container = page.locator('table').first().locator('..');
    const rows = page.locator('[data-pw="spell-row"]');
    const count = await rows.count();
    const lastRow = rows.nth(count - 1);

    const containerBB = await container.boundingBox();
    const lastRowBB = await lastRow.boundingBox();

    const containerInnerBottom = containerBB!.y + containerBB!.height - 1; // subtract 1px border
    const lastRowBottom = lastRowBB!.y + lastRowBB!.height;

    console.log(
      'Container inner bottom:',
      containerInnerBottom,
      '| Last row bottom:',
      lastRowBottom,
      '| gap:',
      containerInnerBottom - lastRowBottom,
    );

    expect(Math.abs(containerInnerBottom - lastRowBottom)).toBeLessThanOrEqual(2);
  });

  test('all spell data rows have the same height (Combat > Spells subtab)', async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');

    const rows = page.locator('[data-pw="spell-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);

    const heights = await Promise.all(
      Array.from({ length: count }, (_, i) => rows.nth(i).boundingBox().then((b) => b!.height)),
    );

    const first = heights[0];
    for (const h of heights) {
      expect(Math.abs(h - first)).toBeLessThanOrEqual(TOLERANCE);
    }
  });
});
