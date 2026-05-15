import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('BondsCard layout fixes (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('+ button is vertically centered within its bond row (within 1px)', async ({ page }) => {
    const btn = page.locator('[data-pw="bond-add-jelena"]');
    const row = btn.locator('..');

    const btnBB = await btn.boundingBox();
    const rowBB = await row.boundingBox();
    expect(btnBB).not.toBeNull();
    expect(rowBB).not.toBeNull();

    const btnCenter = btnBB!.y + btnBB!.height / 2;
    const rowCenter = rowBB!.y + rowBB!.height / 2;
    expect(Math.abs(btnCenter - rowCenter)).toBeLessThanOrEqual(1);
  });

  test('Menu paper background is white (rgb(255, 255, 255))', async ({ page }) => {
    await page.locator('[data-pw="bond-add-jelena"]').click();
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();

    const paper = page.locator('.MuiPaper-root').filter({ has: menu });
    const bg = await paper.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(255, 255, 255)');

    await page.keyboard.press('Escape');
  });
});
