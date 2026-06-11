import { expect, test } from '@playwright/test';

/**
 * Verifies the "Add levels" popover in SkillsTable.
 *
 * Prerequisites: default character state has level 13, total skill levels 12,
 * so freeSkillLevels=1 and the + button is visible on skills with room to grow.
 */

test.describe('Add Level popover', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    await page.evaluate(() => localStorage.removeItem('theme-mode'));
    await page.reload();

    // Navigate to Skills tab
    await page.locator('[data-pw="app-footer"]').getByText('Skills').click();
  });

  test('+ button opens popover below itself', async ({ page }) => {
    const btn = page.locator('[data-pw="skill-add-level-entropic-magic"]');
    await expect(btn).toBeVisible();

    const btnBox = await btn.boundingBox();
    expect(btnBox).not.toBeNull();

    await btn.click();

    const popup = page.locator('[data-pw="add-level-menu"]');
    await expect(popup).toBeVisible();

    const popupBox = await popup.boundingBox();
    expect(popupBox).not.toBeNull();

    const btnBottom = btnBox!.y + btnBox!.height;
    expect(
      popupBox!.y + popupBox!.height,
      `add-level-menu should overlap or sit below the + button bottom (${btnBottom.toFixed(1)})`,
    ).toBeGreaterThan(btnBottom);
    expect(
      popupBox!.y,
      `add-level-menu top (${popupBox!.y.toFixed(1)}) should remain anchored near the + button bottom (${btnBottom.toFixed(1)})`,
    ).toBeLessThanOrEqual(btnBottom + 8);
  });

  test('popover stays inside the MobileScreen frame', async ({ page }) => {
    await page.locator('[data-pw="skill-add-level-entropic-magic"]').click();

    const popup = page.locator('[data-pw="add-level-menu"]');
    await expect(popup).toBeVisible();

    const frame = page.locator('[data-pw="mobile-screen"]');
    const frameBox = await frame.boundingBox();
    const popupBox = await popup.boundingBox();
    expect(frameBox).not.toBeNull();
    expect(popupBox).not.toBeNull();

    expect(popupBox!.x, 'popup left should not overflow frame left').toBeGreaterThanOrEqual(
      frameBox!.x - 1,
    );
    expect(
      popupBox!.x + popupBox!.width,
      'popup right should not overflow frame right',
    ).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 1);
  });

  test('Cancel closes the popover without adding levels', async ({ page }) => {
    const btn = page.locator('[data-pw="skill-add-level-entropic-magic"]');
    await btn.click();

    const popup = page.locator('[data-pw="add-level-menu"]');
    await expect(popup).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
  });

  test('Selecting a level closes the popover', async ({ page }) => {
    await page.locator('[data-pw="skill-add-level-entropic-magic"]').click();

    const popup = page.locator('[data-pw="add-level-menu"]');
    await expect(popup).toBeVisible();

    await page.locator('[data-pw="skill-level-option-8"]').click();
    await expect(popup).not.toBeVisible();
  });

  test('popover background is dark surface token in dark mode', async ({ page }) => {
    await page.locator('[data-pw="skill-add-level-entropic-magic"]').click();

    const popup = page.locator('[data-pw="add-level-menu"]');
    await expect(popup).toBeVisible();

    const bg = await popup.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // darkFabUTokens.color.surface = #131613 → rgb(19, 22, 19)
    expect(bg, `dark-mode add-level popup bg should be dark surface, got ${bg}`).toBe(
      'rgb(19, 22, 19)',
    );
  });
});
