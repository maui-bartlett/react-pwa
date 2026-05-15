import { expect, test } from '@playwright/test';

/**
 * Verifies:
 * 1. Defense and Magic Def. suffix does not overflow the pill's right edge.
 *    Root cause was minWidth:'2.5ch' being applied to the value Typography even
 *    for popover-mode (hasBaseTempEditor) pills. Restricting it to inline-edit
 *    pills eliminates the extra width and lets the suffix fit.
 *
 * 2. XP slash position in SummaryStrip — display and edit mode slash x ≤1px apart.
 *    SummaryStrip had its own rendering without the minWidth fix; now fixed.
 */

test.describe('Pill overflow and slash fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Defense suffix stays within pill bounds', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');

    const pill = page.locator('[data-pw="statpill-cb-defense"]');
    await expect(pill).toBeVisible();
    const pillBox = await pill.boundingBox();
    expect(pillBox).not.toBeNull();

    const suffix = page.locator('[data-pw="statpill-cb-defense-suffix"]');
    await expect(suffix).toBeVisible();
    const suffixBox = await suffix.boundingBox();
    expect(suffixBox).not.toBeNull();

    const pillRight = pillBox!.x + pillBox!.width;
    const suffixRight = suffixBox!.x + suffixBox!.width;
    expect(
      suffixRight,
      `Defense suffix (${suffixRight}px) overflows pill right edge (${pillRight}px)`,
    ).toBeLessThanOrEqual(pillRight + 1); // +1 for subpixel
  });

  test('Magic Def. suffix stays within pill bounds', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');

    const pill = page.locator('[data-pw="statpill-cb-magic-defense"]');
    await expect(pill).toBeVisible();
    const pillBox = await pill.boundingBox();
    expect(pillBox).not.toBeNull();

    const suffix = page.locator('[data-pw="statpill-cb-magic-defense-suffix"]');
    await expect(suffix).toBeVisible();
    const suffixBox = await suffix.boundingBox();
    expect(suffixBox).not.toBeNull();

    const pillRight = pillBox!.x + pillBox!.width;
    const suffixRight = suffixBox!.x + suffixBox!.width;
    expect(
      suffixRight,
      `Magic Def. suffix (${suffixRight}px) overflows pill right edge (${pillRight}px)`,
    ).toBeLessThanOrEqual(pillRight + 1);
  });

  test('XP SummaryStrip slash x unchanged between display and edit mode', async ({ page }) => {
    // XP strip is on the overview at the bottom
    const xpSuffix = page.locator('[data-pw="metric-ov-xp-suffix"]');
    await expect(xpSuffix).toBeVisible();

    const displayBox = await xpSuffix.boundingBox();
    expect(displayBox).not.toBeNull();

    // Click the XP metric to enter edit mode
    const xpMetric = page.locator('[data-pw="metric-ov-xp"]');
    await xpMetric.click();

    // Suffix still visible
    await expect(xpSuffix).toBeVisible();
    const editBox = await xpSuffix.boundingBox();
    expect(editBox).not.toBeNull();

    const diff = Math.abs(editBox!.x - displayBox!.x);
    expect(
      diff,
      `XP slash moved by ${diff}px (display=${displayBox!.x}, edit=${editBox!.x})`,
    ).toBeLessThanOrEqual(1);
  });
});
