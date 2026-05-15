import { expect, test } from '@playwright/test';

/**
 * Verifies that the "/" slash in HP/MP/XP suffix pills does not shift
 * horizontally when entering inline edit mode.
 * The display-mode Typography and edit-mode InputBase must share the
 * same minimum width so the following "/" stays at the same x position.
 */
test.describe('StatPill slash position parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('slash x position unchanged between display and edit mode (HP overview)', async ({
    page,
  }) => {
    const suffix = page.locator('[data-pw="statpill-ov-hp-suffix"]');
    await expect(suffix).toBeVisible();

    // Record slash x in display mode
    const displayBox = await suffix.boundingBox();
    expect(displayBox).not.toBeNull();

    // Click the pill to enter edit mode
    await page.locator('[data-pw="statpill-ov-hp"]').click();

    // Suffix stays visible during editing
    await expect(suffix).toBeVisible();
    const editBox = await suffix.boundingBox();
    expect(editBox).not.toBeNull();

    const diff = Math.abs(editBox!.x - displayBox!.x);
    expect(diff, `slash shifted by ${diff}px (display x=${displayBox!.x}, edit x=${editBox!.x})`).toBeLessThanOrEqual(1);
  });

  test('slash x position unchanged between display and edit mode (MP overview)', async ({
    page,
  }) => {
    const suffix = page.locator('[data-pw="statpill-ov-mp-suffix"]');
    await expect(suffix).toBeVisible();

    const displayBox = await suffix.boundingBox();
    expect(displayBox).not.toBeNull();

    await page.locator('[data-pw="statpill-ov-mp"]').click();

    await expect(suffix).toBeVisible();
    const editBox = await suffix.boundingBox();
    expect(editBox).not.toBeNull();

    const diff = Math.abs(editBox!.x - displayBox!.x);
    expect(diff, `slash shifted by ${diff}px`).toBeLessThanOrEqual(1);
  });
});
