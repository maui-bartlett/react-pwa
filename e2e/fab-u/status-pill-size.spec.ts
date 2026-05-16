import { expect, test } from '@playwright/test';

/**
 * Verifies that the Status Effects pills (in the expanded accordion) are
 * larger than the old baseline (minHeight 36px) and that the bracket
 * connector's top edge still meets the pill's bottom edge.
 */

test.describe('Status Effects pill size increase', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open the accordion to reveal the full-size StatusPillGroup
    const toggle = page.locator('[data-pw="status-effects-accordion-toggle"]');
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Wait for the pills to be visible
    await expect(page.locator('[data-pw="status-pill-slow"]')).toBeVisible();
  });

  test('status pills are taller than the old 36px baseline', async ({ page }) => {
    const pill = page.locator('[data-pw="status-pill-slow"]');
    const box = await pill.boundingBox();
    expect(box).not.toBeNull();

    expect(
      box!.height,
      `Slow pill height (${box!.height}px) should exceed old 36px minHeight`,
    ).toBeGreaterThan(36);
  });

  test('status pills are wider than the old 72px minWidth baseline', async ({ page }) => {
    const pill = page.locator('[data-pw="status-pill-slow"]');
    const box = await pill.boundingBox();
    expect(box).not.toBeNull();

    expect(
      box!.width,
      `Slow pill width (${box!.width}px) should exceed old 72px minWidth`,
    ).toBeGreaterThan(72);
  });

  test('bracket drop connector top meets upper pill bottom (≤2px gap)', async ({ page }) => {
    // The "Slow" pill is the top-left; the left-drop connector starts at PILL_H
    const pill = page.locator('[data-pw="status-pill-slow"]');
    const drop = page.locator('[data-pw="left-drop"]').first();

    await expect(drop).toBeVisible();

    const pillBox = await pill.boundingBox();
    const dropBox = await drop.boundingBox();
    expect(pillBox).not.toBeNull();
    expect(dropBox).not.toBeNull();

    const pillBottom = pillBox!.y + pillBox!.height;
    const dropTop = dropBox!.y;
    const gap = Math.abs(dropTop - pillBottom);

    expect(
      gap,
      `Gap between pill bottom (${pillBottom}px) and drop top (${dropTop}px) is ${gap}px — should be ≤2px`,
    ).toBeLessThanOrEqual(2);
  });

  test('result pill (Enraged) is visible and wider than regular pills', async ({ page }) => {
    const regularPill = page.locator('[data-pw="status-pill-slow"]');
    const resultPill = page.locator('[data-pw="status-pill-enraged"]');

    await expect(resultPill).toBeVisible();

    const regularBox = await regularPill.boundingBox();
    const resultBox = await resultPill.boundingBox();
    expect(regularBox).not.toBeNull();
    expect(resultBox).not.toBeNull();

    expect(
      resultBox!.width,
      `Enraged result pill (${resultBox!.width}px) should be wider than Slow pill (${regularBox!.width}px)`,
    ).toBeGreaterThanOrEqual(regularBox!.width);
  });

  test('two StatusPillGroups fit within the card width', async ({ page }) => {
    const slowPill = page.locator('[data-pw="status-pill-slow"]');
    const shakenPill = page.locator('[data-pw="status-pill-shaken"]');

    const cardEl = page.locator('[data-pw="status-effects-accordion-toggle"]').locator('xpath=ancestor::*[contains(@class,"MuiPaper")]').first();
    const cardBox = await cardEl.boundingBox();
    const slowBox = await slowPill.boundingBox();
    const shakenBox = await shakenPill.boundingBox();

    expect(cardBox).not.toBeNull();
    expect(slowBox).not.toBeNull();
    expect(shakenBox).not.toBeNull();

    expect(slowBox!.x, 'Slow pill overflows card left').toBeGreaterThanOrEqual(cardBox!.x);
    expect(
      shakenBox!.x + shakenBox!.width,
      'Shaken pill overflows card right',
    ).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1);
  });
});
