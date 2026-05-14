import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Bonds type editing (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ── Overview tab Bonds card ───────────────────────────────────────────────

  test('Tapping + on a bond row opens dropdown with all six types', async ({ page }) => {
    await page.locator('[data-pw="bond-add-jelena"]').click();
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    for (const type of ['Admiration', 'Loyalty', 'Affection', 'Inferiority', 'Mistrust', 'Hatred']) {
      await expect(menu.getByRole('menuitem', { name: type })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  test('Adding Loyalty to Yoru → Loyalty chip appears; Loyalty disabled on next open', async ({
    page,
  }) => {
    // Yoru starts with only Affection seeded; add Loyalty
    await page.locator('[data-pw="bond-add-yoru"]').click();
    await page.getByRole('menuitem', { name: 'Loyalty' }).click();
    // Chip visible
    await expect(page.locator('[data-pw="bond-add-yoru"]').locator('..').locator('text=Loyalty')).toBeVisible();
    // Re-open: Loyalty is disabled
    await page.locator('[data-pw="bond-add-yoru"]').click();
    const loyaltyItem = page.getByRole('menuitem', { name: 'Loyalty' });
    await expect(loyaltyItem).toBeDisabled();
    await page.keyboard.press('Escape');
  });

  test('Adding Affection then Mistrust to Juice → both chips visible', async ({ page }) => {
    // Juice starts with Loyalty; add Affection
    await page.locator('[data-pw="bond-add-juice"]').click();
    await page.getByRole('menuitem', { name: 'Affection' }).click();
    // Add Mistrust
    await page.locator('[data-pw="bond-add-juice"]').click();
    await page.getByRole('menuitem', { name: 'Mistrust' }).click();
    const row = page.locator('[data-pw="bond-add-juice"]').locator('..');
    await expect(row.locator('text=Affection')).toBeVisible();
    await expect(row.locator('text=Mistrust')).toBeVisible();
  });

  test('Bond types persist after page reload', async ({ page }) => {
    await page.locator('[data-pw="bond-add-granada"]').click();
    await page.getByRole('menuitem', { name: 'Inferiority' }).click();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const row = page.locator('[data-pw="bond-add-granada"]').locator('..');
    await expect(row.locator('text=Inferiority')).toBeVisible();
    // Admiration was seeded and should also persist
    await expect(row.locator('text=Admiration')).toBeVisible();
  });

  // ── Cross-card sync (Combat > Bonds) ─────────────────────────────────────

  test('Edits on Overview Bonds appear on Combat > Bonds subtab', async ({ page }) => {
    // Add Hatred to Yoru on Overview
    await page.locator('[data-pw="bond-add-yoru"]').click();
    await page.getByRole('menuitem', { name: 'Hatred' }).click();

    // Navigate to Combat > Bonds
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    // Combat tab defaults to bonds subtab
    const combatRow = page.locator('[data-pw="bond-add-yoru"]').locator('..');
    await expect(combatRow.locator('text=Hatred')).toBeVisible();
  });

  test('Edits on Combat Bonds appear on Overview Bonds card', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');

    await page.locator('[data-pw="bond-add-jelena"]').first().click();
    await page.getByRole('menuitem', { name: 'Mistrust' }).click();

    // Navigate back to Overview
    await page.getByRole('button', { name: 'Overview' }).first().click();
    await page.waitForLoadState('networkidle');
    const overviewRow = page.locator('[data-pw="bond-add-jelena"]').locator('..');
    await expect(overviewRow.locator('text=Mistrust')).toBeVisible();
  });
});
