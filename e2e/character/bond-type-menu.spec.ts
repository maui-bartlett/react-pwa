import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

/**
 * The bond-type menu stays open while multiple types are toggled, closes only
 * on tap-off, and grays out the mutually-exclusive opposite of a selected type.
 */
test.describe('Bond type menu — multi-select + exclusive pairs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    // Add a fresh bond with no types yet.
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('MenuTest');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=MenuTest').first()).toBeVisible();

    // Open its bond-type menu via the trailing + button.
    const row = page.locator('[data-pw^="bond-row-"]').filter({ hasText: 'MenuTest' }).first();
    await row.locator('[data-pw^="bond-add-"]').click();
    await expect(page.locator('[data-pw="bond-type-menu"]')).toBeVisible();
  });

  test('menu stays open across multiple selections and closes on tap-off', async ({ page }) => {
    const menu = page.locator('[data-pw="bond-type-menu"]');

    await page.locator('[data-pw="bond-type-admiration"]').click();
    await expect(page.locator('[data-pw="bond-type-admiration"]')).toHaveAttribute(
      'data-selected',
      'true',
    );
    await expect(menu).toBeVisible();

    await page.locator('[data-pw="bond-type-loyalty"]').click();
    await expect(page.locator('[data-pw="bond-type-loyalty"]')).toHaveAttribute(
      'data-selected',
      'true',
    );
    await expect(menu).toBeVisible();

    // Tap off (Escape mimics a backdrop dismiss) → menu closes.
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
  });

  test('selecting one of an exclusive pair grays out the other', async ({ page }) => {
    // Admiration / Inferiority are an exclusive pair.
    const inferiority = page.locator('[data-pw="bond-type-inferiority"]');
    await expect(inferiority).toHaveAttribute('data-disabled', 'false');

    await page.locator('[data-pw="bond-type-admiration"]').click();
    await expect(inferiority).toHaveAttribute('data-disabled', 'true');

    // The disabled item ignores clicks (force past pointer-events: none).
    await inferiority.click({ force: true });
    await expect(inferiority).toHaveAttribute('data-selected', 'false');

    // Deselecting Admiration re-enables Inferiority.
    await page.locator('[data-pw="bond-type-admiration"]').click();
    await expect(inferiority).toHaveAttribute('data-disabled', 'false');
  });
});
