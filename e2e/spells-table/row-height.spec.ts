import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

const EXPECTED_ROW_H = 46; // 36 + 10
const TOLERANCE = 0.5; // px
const CENTER_TOLERANCE = 1; // px

test.describe('SpellsTable — uniform row height + flush container bottom (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('all spell data rows are exactly 46px tall (Spells tab)', async ({ page }) => {
    const rows = page.locator('[data-pw="spell-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);

    const heights = await Promise.all(
      Array.from({ length: count }, (_, i) => rows.nth(i).boundingBox().then((b) => b!.height)),
    );

    console.log('Row heights:', heights);
    for (const h of heights) {
      expect(Math.abs(h - EXPECTED_ROW_H)).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  test('spell row text is vertically centered within the row (Spells tab)', async ({ page }) => {
    const row = page.locator('[data-pw="spell-row"]').first();
    const textEl = row.locator('td').first().locator('*').first();

    const rowBB = await row.boundingBox();
    const textBB = await textEl.boundingBox();

    const rowMid = rowBB!.y + rowBB!.height / 2;
    const textMid = textBB!.y + textBB!.height / 2;

    console.log('Row mid:', rowMid, '| Text mid:', textMid, '| diff:', Math.abs(rowMid - textMid));
    expect(Math.abs(rowMid - textMid)).toBeLessThanOrEqual(CENTER_TOLERANCE);
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
