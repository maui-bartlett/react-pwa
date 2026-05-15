import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

const ATTRS = ['dexterity', 'insight', 'might', 'willpower'];

test.describe('Attribute popup overhaul', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  for (const attr of ATTRS) {
    test(`${attr}: popup stays within screen bounds`, async ({ page }) => {
      const pill = page.locator(`[data-pw="attr-pill-${attr}"]`).first();
      await expect(pill).toBeVisible();
      await pill.click();

      // Wait for popover to appear
      const popover = page.locator('[data-pw="attr-die-select"]').first();
      await expect(popover).toBeVisible();

      // Get the popover paper bounding box
      const paper = page.locator('.MuiPopover-paper').first();
      const box = await paper.boundingBox();
      expect(box).not.toBeNull();

      const vp = page.viewportSize()!;
      expect(box!.x, 'popover left edge off screen').toBeGreaterThanOrEqual(0);
      expect(box!.y, 'popover top edge off screen').toBeGreaterThanOrEqual(0);
      expect(
        box!.x + box!.width,
        `popover right edge (${box!.x + box!.width}) exceeds viewport (${vp.width})`,
      ).toBeLessThanOrEqual(vp.width + 1); // +1 for subpixel rounding
      expect(
        box!.y + box!.height,
        `popover bottom edge (${box!.y + box!.height}) exceeds viewport (${vp.height})`,
      ).toBeLessThanOrEqual(vp.height + 1);

      await page.keyboard.press('Escape');
    });

    test(`${attr}: popup renders Base, Mod, Temp in vertical order`, async ({ page }) => {
      const pill = page.locator(`[data-pw="attr-pill-${attr}"]`).first();
      await pill.click();

      const baseSelect = page.locator('[data-pw="attr-die-select"]').first();
      const modInput = page.locator('[data-pw="attr-mod-input"]').first();
      const tempSelect = page.locator('[data-pw="attr-temp-select"]').first();

      await expect(baseSelect).toBeVisible();
      await expect(modInput).toBeVisible();
      await expect(tempSelect).toBeVisible();

      // Verify vertical stacking: each element should be below the previous
      const baseBox = await baseSelect.boundingBox();
      const modBox = await modInput.boundingBox();
      const tempBox = await tempSelect.boundingBox();

      expect(baseBox).not.toBeNull();
      expect(modBox).not.toBeNull();
      expect(tempBox).not.toBeNull();

      expect(
        modBox!.y,
        'Mod should be below Base',
      ).toBeGreaterThan(baseBox!.y);
      expect(
        tempBox!.y,
        'Temp should be below Mod',
      ).toBeGreaterThan(modBox!.y);

      await page.keyboard.press('Escape');
    });

    test(`${attr}: label reads "Base" not "Die"`, async ({ page }) => {
      const pill = page.locator(`[data-pw="attr-pill-${attr}"]`).first();
      await pill.click();

      await expect(page.locator('[data-pw="attr-die-select"]').first()).toBeVisible();

      // Find the popover paper and check its text contains "Base" but not "Die"
      const paper = page.locator('.MuiPopover-paper').first();
      const text = await paper.textContent();
      expect(text).toContain('Base');
      expect(text?.toLowerCase()).not.toContain('die');

      await page.keyboard.press('Escape');
    });
  }
});
