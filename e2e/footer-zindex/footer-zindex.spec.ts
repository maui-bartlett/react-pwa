import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Bottom nav footer z-index — stays above bond card rows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.waitForLoadState('networkidle');
  });

  test('footer has explicit zIndex higher than bond rows', async ({ page }) => {
    const footer = page.locator('[data-pw="app-footer"]');
    const bondRow = page.locator('[data-pw="detail-list-row"]').first();

    await expect(footer).toBeVisible();
    await expect(bondRow).toBeVisible();

    const { footerZIndex, rowZIndex } = await page.evaluate(() => {
      const footerEl = document.querySelector('[data-pw="app-footer"]') as HTMLElement;
      const rowEl = document.querySelector('[data-pw="detail-list-row"]') as HTMLElement;
      return {
        footerZIndex: getComputedStyle(footerEl).zIndex,
        rowZIndex: getComputedStyle(rowEl).zIndex,
      };
    });

    const footerZ = footerZIndex === 'auto' ? 0 : parseInt(footerZIndex, 10);
    const rowZ = rowZIndex === 'auto' ? 0 : parseInt(rowZIndex, 10);

    expect(footerZ).toBeGreaterThan(rowZ);
    expect(footerZ).toBe(10);
  });

  test('footer visually covers bond row when row scrolls into footer area', async ({ page }) => {
    const footer = page.locator('[data-pw="app-footer"]');
    const bondRows = page.locator('[data-pw="detail-list-row"]');

    await expect(footer).toBeVisible();

    const footerRect = await footer.boundingBox();
    expect(footerRect).not.toBeNull();

    // Scroll the last bond row down into the footer overlap zone
    const lastRow = bondRows.last();
    await lastRow.scrollIntoViewIfNeeded();

    const rowRect = await lastRow.boundingBox();
    expect(rowRect).not.toBeNull();

    // After scrolling the footer must still be on top (zIndex check)
    const { footerZIndex, rowZIndex } = await page.evaluate(() => {
      const footerEl = document.querySelector('[data-pw="app-footer"]') as HTMLElement;
      const rowEl = document.querySelectorAll('[data-pw="detail-list-row"]');
      const lastRow = rowEl[rowEl.length - 1] as HTMLElement;
      return {
        footerZIndex: getComputedStyle(footerEl).zIndex,
        rowZIndex: getComputedStyle(lastRow).zIndex,
      };
    });

    const footerZ = footerZIndex === 'auto' ? 0 : parseInt(footerZIndex, 10);
    const rowZ = rowZIndex === 'auto' ? 0 : parseInt(rowZIndex, 10);

    expect(footerZ).toBeGreaterThan(rowZ);
  });
});
