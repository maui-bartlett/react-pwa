import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Item picker — Equipment + Backpack (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    await page.getByRole('button', { name: 'Gear' }).first().click();
  });

  test('tapping an empty Equipment slot opens the item picker', async ({ page }) => {
    const slot = page.locator('[data-pw="equip-slot-add-armor"]').first();
    await slot.scrollIntoViewIfNeeded();
    await slot.click();

    const dialog = page.locator('[data-pw="item-picker-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Add to Armor');
    await expect(page.locator('[data-pw="item-picker-custom"]')).toBeVisible();
    const dialogBox = await page.locator('[data-pw="item-picker-paper"]').boundingBox();
    const viewport = page.viewportSize();
    expect(dialogBox?.height).toBeCloseTo(Math.min((viewport?.height ?? 0) * 0.8, 640), 0);
  });

  test('Custom Item still adds a blank equipment entry', async ({ page }) => {
    const slot = page.locator('[data-pw="equip-slot-add-accessory"]').first();
    await slot.scrollIntoViewIfNeeded();
    await slot.click();

    await page.locator('[data-pw="item-picker-custom"]').click();
    await expect(page.locator('[data-pw="item-picker-dialog"]')).not.toBeVisible();

    // The newly-added blank item shows in the Accessory slot.
    await expect(page.getByText('New Item').first()).toBeVisible();
  });

  test('picker can be dismissed via the close button', async ({ page }) => {
    const slot = page.locator('[data-pw="equip-slot-add-armor"]').first();
    await slot.scrollIntoViewIfNeeded();
    await slot.click();

    await expect(page.locator('[data-pw="item-picker-dialog"]')).toBeVisible();
    await page.locator('[data-pw="item-picker-close"]').click();
    await expect(page.locator('[data-pw="item-picker-dialog"]')).not.toBeVisible();
  });
});
