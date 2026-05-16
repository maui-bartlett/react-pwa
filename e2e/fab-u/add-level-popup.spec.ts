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
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate to Combat → Skills sub-tab
    await page.locator('[data-pw="app-footer"]').getByText('Combat').click();
    await page.waitForLoadState('networkidle');
    await page.locator('[data-pw="content-area"]').getByText('Skills').click();
    await page.waitForLoadState('networkidle');
  });

  test('+ button opens popover below itself', async ({ page }) => {
    const btn = page.locator('[data-pw="skill-add-level-entropic-magic"]');
    await expect(btn).toBeVisible();

    const btnBox = await btn.boundingBox();
    expect(btnBox).not.toBeNull();

    await btn.click();

    const popup = page.locator('[data-pw="add-level-popup"]');
    await expect(popup).toBeVisible();

    const popupBox = await popup.boundingBox();
    expect(popupBox).not.toBeNull();

    const btnBottom = btnBox!.y + btnBox!.height;
    expect(
      popupBox!.y,
      `add-level-popup top (${popupBox!.y.toFixed(1)}) should be at or below + button bottom (${btnBottom.toFixed(1)}) within 4px`,
    ).toBeGreaterThanOrEqual(btnBottom - 4);
  });

  test('popover stays inside the MobileScreen frame', async ({ page }) => {
    await page.locator('[data-pw="skill-add-level-entropic-magic"]').click();

    const popup = page.locator('[data-pw="add-level-popup"]');
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

    const popup = page.locator('[data-pw="add-level-popup"]');
    await expect(popup).toBeVisible();

    await popup.getByRole('button', { name: 'Cancel' }).click();
    await expect(popup).not.toBeVisible();
  });

  test('Add confirms and closes the popover', async ({ page }) => {
    await page.locator('[data-pw="skill-add-level-entropic-magic"]').click();

    const popup = page.locator('[data-pw="add-level-popup"]');
    await expect(popup).toBeVisible();

    await popup.getByRole('button', { name: 'Add' }).click();
    await expect(popup).not.toBeVisible();
  });

  test('popover background is dark surface token in dark mode', async ({ page }) => {
    await page.locator('[data-pw="skill-add-level-entropic-magic"]').click();

    const popup = page.locator('[data-pw="add-level-popup"]');
    await expect(popup).toBeVisible();

    const bg = await popup.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // darkFabUTokens.color.surface = #131613 → rgb(19, 22, 19)
    expect(bg, `dark-mode add-level popup bg should be dark surface, got ${bg}`).toBe(
      'rgb(19, 22, 19)',
    );
  });
});
