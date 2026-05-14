import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Bonds type toggle (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ── Dropdown shows all six options ───────────────────────────────────────

  test('Tapping + opens dropdown with all six types', async ({ page }) => {
    await page.locator('[data-pw="bond-add-jelena"]').click();
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    for (const type of ['Admiration', 'Loyalty', 'Affection', 'Inferiority', 'Mistrust', 'Hatred']) {
      await expect(menu.getByRole('menuitem', { name: type })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  // ── Selected state shown in menu ─────────────────────────────────────────

  test('Pre-seeded type shows as selected in the menu (data-selected=true)', async ({ page }) => {
    // Juice is seeded with Loyalty
    await page.locator('[data-pw="bond-add-juice"]').click();
    const loyaltyItem = page.locator('[data-pw="bond-type-loyalty"]');
    await expect(loyaltyItem).toHaveAttribute('data-selected', 'true');
    const affectionItem = page.locator('[data-pw="bond-type-affection"]');
    await expect(affectionItem).toHaveAttribute('data-selected', 'false');
    await page.keyboard.press('Escape');
  });

  // ── Toggle: remove a selected type ───────────────────────────────────────

  test('Tapping a selected type removes its chip from the row', async ({ page }) => {
    // Juice seeded with Loyalty — tap Loyalty to remove it
    await page.locator('[data-pw="bond-add-juice"]').click();
    await page.locator('[data-pw="bond-type-loyalty"]').click();
    const row = page.locator('[data-pw="bond-add-juice"]').locator('..');
    await expect(row.locator('text=Loyalty')).not.toBeVisible();
  });

  test('After removing: reopening menu shows type as not selected', async ({ page }) => {
    await page.locator('[data-pw="bond-add-juice"]').click();
    await page.locator('[data-pw="bond-type-loyalty"]').click();
    // Re-open
    await page.locator('[data-pw="bond-add-juice"]').click();
    await expect(page.locator('[data-pw="bond-type-loyalty"]')).toHaveAttribute(
      'data-selected',
      'false',
    );
    await page.keyboard.press('Escape');
  });

  // ── Toggle: add then remove ───────────────────────────────────────────────

  test('Add Hatred then remove Hatred → chip gone', async ({ page }) => {
    const btn = page.locator('[data-pw="bond-add-yoru"]');
    // Yoru seeded with Affection; add Hatred
    await btn.click();
    await page.locator('[data-pw="bond-type-hatred"]').click();
    const row = btn.locator('..');
    await expect(row.locator('text=Hatred')).toBeVisible();
    // Remove Hatred
    await btn.click();
    await page.locator('[data-pw="bond-type-hatred"]').click();
    await expect(row.locator('text=Hatred')).not.toBeVisible();
  });

  // ── Persistence ───────────────────────────────────────────────────────────

  test('Removing a type persists after reload', async ({ page }) => {
    // Remove Loyalty from Juice
    await page.locator('[data-pw="bond-add-juice"]').click();
    await page.locator('[data-pw="bond-type-loyalty"]').click();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const row = page.locator('[data-pw="bond-add-juice"]').locator('..');
    await expect(row.locator('text=Loyalty')).not.toBeVisible();
  });

  test('Adding a type persists after reload', async ({ page }) => {
    await page.locator('[data-pw="bond-add-granada"]').click();
    await page.locator('[data-pw="bond-type-inferiority"]').click();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const row = page.locator('[data-pw="bond-add-granada"]').locator('..');
    await expect(row.locator('text=Inferiority')).toBeVisible();
    await expect(row.locator('text=Admiration')).toBeVisible();
  });

  // ── Cross-card sync ───────────────────────────────────────────────────────

  test('Toggle on Overview Bonds reflects on Combat > Bonds subtab', async ({ page }) => {
    // Remove Affection from Jelena on Overview
    await page.locator('[data-pw="bond-add-jelena"]').click();
    await page.locator('[data-pw="bond-type-affection"]').click();

    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    const combatRow = page.locator('[data-pw="bond-add-jelena"]').locator('..');
    await expect(combatRow.locator('text=Affection')).not.toBeVisible();
  });

  test('Toggle on Combat > Bonds reflects on Overview Bonds card', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');

    // Add Mistrust to Yoru on Combat
    await page.locator('[data-pw="bond-add-yoru"]').first().click();
    await page.locator('[data-pw="bond-type-mistrust"]').click();

    await page.getByRole('button', { name: 'Overview' }).first().click();
    await page.waitForLoadState('networkidle');
    const overviewRow = page.locator('[data-pw="bond-add-yoru"]').locator('..');
    await expect(overviewRow.locator('text=Mistrust')).toBeVisible();
  });
});
