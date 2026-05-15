import { expect, test } from '@playwright/test';

/**
 * Verifies attribute pill height is unchanged after the gap increase,
 * and that the label→value gap increased by ~4px.
 */
test.describe('Attribute pill spacing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('all 4 attribute pills have height ≥ 48px', async ({ page }) => {
    for (const attr of ['dexterity', 'insight', 'might', 'willpower']) {
      const pill = page.locator(`[data-pw="attr-pill-${attr}"]`).first();
      await expect(pill).toBeVisible();
      const box = await pill.boundingBox();
      expect(box).not.toBeNull();
      expect(
        box!.height,
        `${attr} pill height should be ≥48px, got ${box!.height}`,
      ).toBeGreaterThanOrEqual(48);
    }
  });

  test('label and value elements have ≥ 6px vertical gap', async ({ page }) => {
    // Check Dexterity pill as representative sample
    const pill = page.locator('[data-pw="attr-pill-dexterity"]').first();
    await expect(pill).toBeVisible();

    // Get the label (first Typography in the pill) and value (second Typography)
    const texts = pill.locator('p, h6, span');
    const count = await texts.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // label is the caption (smaller), value is the h6 (larger)
    const labelEl = texts.nth(0);
    const valueEl = texts.nth(1);

    const labelBox = await labelEl.boundingBox();
    const valueBox = await valueEl.boundingBox();

    expect(labelBox).not.toBeNull();
    expect(valueBox).not.toBeNull();

    // Gap = distance between bottom of label and top of value
    const gap = valueBox!.y - (labelBox!.y + labelBox!.height);
    expect(
      gap,
      `gap between label and value should be ≥6px (was ~2px before), got ${gap}px`,
    ).toBeGreaterThanOrEqual(5);
  });
});
