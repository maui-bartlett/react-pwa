import { expect, test } from '@playwright/test';

/**
 * Verifies unified popup/popover positioning and border styling across the app.
 *
 * Covered popups:
 *   - AttributePill popup (Dex / Insight / Might / Willpower)  [data-pw="attr-popup"]
 *   - StatPill base+temp popup (Defense / MagicDef)             [data-pw="statpill-popup"]
 *   - BondsCard type-picker Menu                                 [data-pw="bond-type-menu"]
 *
 * Assertions:
 *   1. Popup opens BELOW its anchor (popup.y >= anchor.y + anchor.height − 4px tolerance)
 *   2. Popup stays inside the MobileScreen frame
 *   3. Light mode border = brand green (#315c4d)
 *   4. Dark mode border = white (#ffffff)
 */

test.describe('Popup positioning and border styling', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    // Full clear so theme defaults to dark (atomWithStorage default = DARK)
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate to Combat tab (default = overview after reload)
    await page.locator('[data-pw="app-footer"]').getByText('Combat').click();
    await page.waitForLoadState('networkidle');
  });

  // ─── AttributePill popup ───────────────────────────────────────────────────

  test('attr popup opens below the Dex pill', async ({ page }) => {
    const pill = page.locator('[data-pw="attr-pill-dex"]');
    await expect(pill).toBeVisible();

    const pillBox = await pill.boundingBox();
    expect(pillBox).not.toBeNull();

    await pill.click();

    const popup = page.locator('[data-pw="attr-popup"]');
    await expect(popup).toBeVisible();
    const popupBox = await popup.boundingBox();
    expect(popupBox).not.toBeNull();

    const pillBottom = pillBox!.y + pillBox!.height;
    expect(
      popupBox!.y,
      `attr-popup top (${popupBox!.y.toFixed(1)}) should be at or below Dex pill bottom (${pillBottom.toFixed(1)}) within 4px`,
    ).toBeGreaterThanOrEqual(pillBottom - 4);
  });

  test('attr popup stays inside the MobileScreen frame', async ({ page }) => {
    await page.locator('[data-pw="attr-pill-dex"]').click();

    const popup = page.locator('[data-pw="attr-popup"]');
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

  // ─── StatPill popup (Defense / MagicDef base+temp editor) ─────────────────

  test('statpill popup opens below the Defense pill', async ({ page }) => {
    const pill = page.locator('[data-pw="statpill-cb-defense"]');
    await expect(pill).toBeVisible();

    const pillBox = await pill.boundingBox();
    expect(pillBox).not.toBeNull();

    await pill.click();

    const popup = page.locator('[data-pw="statpill-popup"]');
    await expect(popup).toBeVisible();
    const popupBox = await popup.boundingBox();
    expect(popupBox).not.toBeNull();

    const pillBottom = pillBox!.y + pillBox!.height;
    expect(
      popupBox!.y,
      `statpill popup top (${popupBox!.y.toFixed(1)}) should be at or below Defense pill bottom (${pillBottom.toFixed(1)}) within 4px`,
    ).toBeGreaterThanOrEqual(pillBottom - 4);
  });

  // ─── BondsCard type-picker Menu ───────────────────────────────────────────

  test('bond type menu opens below the + button', async ({ page }) => {
    // Default combat sub-tab is 'bonds'
    const addBtn = page.locator('[data-pw="bond-add-jelena"]');
    await expect(addBtn).toBeVisible();

    const btnBox = await addBtn.boundingBox();
    expect(btnBox).not.toBeNull();

    await addBtn.click();

    const menu = page.locator('[data-pw="bond-type-menu"]');
    await expect(menu).toBeVisible();
    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();

    const btnBottom = btnBox!.y + btnBox!.height;
    expect(
      menuBox!.y,
      `bond-type-menu top (${menuBox!.y.toFixed(1)}) should be at or below + button bottom (${btnBottom.toFixed(1)}) within 4px`,
    ).toBeGreaterThanOrEqual(btnBottom - 4);
  });

  test('bond type menu stays inside the MobileScreen frame', async ({ page }) => {
    await page.locator('[data-pw="bond-add-jelena"]').click();

    const menu = page.locator('[data-pw="bond-type-menu"]');
    await expect(menu).toBeVisible();

    const frame = page.locator('[data-pw="mobile-screen"]');
    const frameBox = await frame.boundingBox();
    const menuBox = await menu.boundingBox();
    expect(frameBox).not.toBeNull();
    expect(menuBox).not.toBeNull();

    expect(menuBox!.x, 'menu left should not overflow frame left').toBeGreaterThanOrEqual(
      frameBox!.x - 1,
    );
    expect(
      menuBox!.x + menuBox!.width,
      'menu right should not overflow frame right',
    ).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 1);
  });

  // ─── Border color — dark mode (default after localStorage.clear) ───────────

  test('attr popup border is white in dark mode', async ({ page }) => {
    await page.locator('[data-pw="attr-pill-dex"]').click();

    const popup = page.locator('[data-pw="attr-popup"]');
    await expect(popup).toBeVisible();

    const borderColor = await popup.evaluate(
      (el) => window.getComputedStyle(el).borderTopColor,
    );
    // #ffffff → rgb(255, 255, 255)
    expect(borderColor, `dark-mode border should be white, got ${borderColor}`).toBe(
      'rgb(255, 255, 255)',
    );
  });

  test('attr popup border is brand green in light mode', async ({ page }) => {
    // Switch to light mode
    await page.locator('[data-pw="theme-toggle"]').click();

    await page.locator('[data-pw="attr-pill-dex"]').click();

    const popup = page.locator('[data-pw="attr-popup"]');
    await expect(popup).toBeVisible();

    const borderColor = await popup.evaluate(
      (el) => window.getComputedStyle(el).borderTopColor,
    );
    // color.brand = #315c4d → rgb(49, 92, 77)
    expect(borderColor, `light-mode border should be brand green, got ${borderColor}`).toBe(
      'rgb(49, 92, 77)',
    );
  });

  test('bond type menu border is white in dark mode', async ({ page }) => {
    await page.locator('[data-pw="bond-add-jelena"]').click();

    const menu = page.locator('[data-pw="bond-type-menu"]');
    await expect(menu).toBeVisible();

    const borderColor = await menu.evaluate(
      (el) => window.getComputedStyle(el).borderTopColor,
    );
    expect(borderColor, `dark-mode bond menu border should be white, got ${borderColor}`).toBe(
      'rgb(255, 255, 255)',
    );
  });

  test('bond type menu border is brand green in light mode', async ({ page }) => {
    // Switch to light mode
    await page.locator('[data-pw="theme-toggle"]').click();

    await page.locator('[data-pw="bond-add-jelena"]').click();

    const menu = page.locator('[data-pw="bond-type-menu"]');
    await expect(menu).toBeVisible();

    const borderColor = await menu.evaluate(
      (el) => window.getComputedStyle(el).borderTopColor,
    );
    // color.brand = #315c4d → rgb(49, 92, 77)
    expect(borderColor, `light-mode bond menu border should be brand green, got ${borderColor}`).toBe(
      'rgb(49, 92, 77)',
    );
  });
});
