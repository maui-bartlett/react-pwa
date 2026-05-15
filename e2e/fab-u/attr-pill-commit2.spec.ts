import { expect, test } from '@playwright/test';

/**
 * Verifies Commit 2 changes:
 * 1. Mod input background matches Base select background in the AttributePill popover.
 * 2. When a Temp die is set, the resting AttributePill shows "(d<temp>)" format.
 * 3. Status Effects card has equal left/right padding and all pills fit within the card.
 */

test.describe('AttributePill popup polish + Status Effects layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Mod input background matches Base select background', async ({ page }) => {
    // Open the Dex attribute pill popup (on the overview tab)
    const dexPill = page.locator('[data-pw="attr-pill-dex"]');
    await expect(dexPill).toBeVisible();
    await dexPill.click();

    // Both Base and Mod fields should be visible
    const baseSelect = page.locator('[data-pw="attr-die-select"]');
    const modInput = page.locator('[data-pw="attr-mod-input"]');
    await expect(baseSelect).toBeVisible();
    await expect(modInput).toBeVisible();

    const baseBg = await baseSelect.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    const modBg = await modInput.evaluate((el) => {
      // InputBase renders an <input> — walk up to find the styled container
      const container = el.closest('[data-pw="attr-mod-input-shell"]') ?? el.parentElement;
      return container ? window.getComputedStyle(container).backgroundColor : '';
    });

    expect(
      modBg,
      `Mod input bg (${modBg}) should match Base select bg (${baseBg})`,
    ).toBe(baseBg);
  });

  test('Resting pill shows temp die in parens when temp is set', async ({ page }) => {
    // Open Insight pill popup and set Temp to d12
    const insightPill = page.locator('[data-pw="attr-pill-insight"]');
    await expect(insightPill).toBeVisible();
    await insightPill.click();

    const tempSelect = page.locator('[data-pw="attr-temp-select"]');
    await expect(tempSelect).toBeVisible();
    await tempSelect.selectOption('d12');

    // Close popover by pressing Escape
    await page.keyboard.press('Escape');

    // The resting pill text should now show "(d12)" format
    await expect(insightPill).toContainText('(d12)');
  });

  test('Resting pill shows base die when temp is null', async ({ page }) => {
    // Default Insight has no temp set
    const insightPill = page.locator('[data-pw="attr-pill-insight"]');
    await expect(insightPill).toBeVisible();

    // Should show the base die without parens
    const text = await insightPill.innerText();
    expect(text).not.toMatch(/\(/);
  });

  test('Status Effects pills fit within card with equal left/right padding', async ({ page }) => {
    // Status effects card is on the overview tab (default)
    const card = page.locator('[data-pw="status-pill-slow"]').locator('xpath=ancestor::*[contains(@class,"MuiPaper")]').first();

    // Locate a known pill on each side
    const leftPill = page.locator('[data-pw="status-pill-slow"]');
    const rightPill = page.locator('[data-pw="status-pill-shaken"]');
    await expect(leftPill).toBeVisible();
    await expect(rightPill).toBeVisible();

    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();

    const leftBox = await leftPill.boundingBox();
    const rightBox = await rightPill.boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();

    const cardLeft = cardBox!.x;
    const cardRight = cardBox!.x + cardBox!.width;
    const paddingLeft = leftBox!.x - cardLeft;
    const paddingRight = cardRight - (rightBox!.x + rightBox!.width);

    // Pills must not overflow the card
    expect(
      leftBox!.x,
      `Left pill (${leftBox!.x}) overflows card left edge (${cardLeft})`,
    ).toBeGreaterThanOrEqual(cardLeft);
    expect(
      rightBox!.x + rightBox!.width,
      `Right pill right (${rightBox!.x + rightBox!.width}) overflows card right edge (${cardRight})`,
    ).toBeLessThanOrEqual(cardRight + 1);

    // Left/right padding should be roughly equal (within 4px)
    expect(
      Math.abs(paddingLeft - paddingRight),
      `Left padding (${paddingLeft.toFixed(1)}px) vs right padding (${paddingRight.toFixed(1)}px) differ by more than 4px`,
    ).toBeLessThanOrEqual(4);
  });
});
