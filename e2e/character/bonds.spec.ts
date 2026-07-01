import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Bonds type toggle (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  // ── Dropdown shows all six options ───────────────────────────────────────

  test('Tapping + opens dropdown with all six types', async ({ page }) => {
    await page.locator('[data-pw="bond-add-jelena"]').click();
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    for (const type of [
      'Admiration',
      'Loyalty',
      'Affection',
      'Inferiority',
      'Mistrust',
      'Hatred',
    ]) {
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
    // The menu stays open; close it, then re-open to confirm the change stuck.
    await page.keyboard.press('Escape');
    await page.locator('[data-pw="bond-add-juice"]').click();
    await expect(page.locator('[data-pw="bond-type-loyalty"]')).toHaveAttribute(
      'data-selected',
      'false',
    );
    await page.keyboard.press('Escape');
  });

  // ── Toggle: add then remove ───────────────────────────────────────────────

  test('Add Mistrust then remove Mistrust → chip gone', async ({ page }) => {
    const btn = page.locator('[data-pw="bond-add-yoru"]');
    // Yoru seeded with Affection; add Mistrust (no exclusive-pair conflict).
    await btn.click();
    await page.locator('[data-pw="bond-type-mistrust"]').click();
    const row = btn.locator('..');
    await expect(row.locator('text=Mistrust')).toBeVisible();
    // The menu stays open — tap the same type again to remove it.
    await page.locator('[data-pw="bond-type-mistrust"]').click();
    await expect(row.locator('text=Mistrust')).not.toBeVisible();
    await page.keyboard.press('Escape');
  });

  // ── Persistence ───────────────────────────────────────────────────────────

  test('Removing a type persists after reload', async ({ page }) => {
    // Remove Loyalty from Juice
    await page.locator('[data-pw="bond-add-juice"]').click();
    await page.locator('[data-pw="bond-type-loyalty"]').click();
    await page.reload();
    const row = page.locator('[data-pw="bond-add-juice"]').locator('..');
    await expect(row.locator('text=Loyalty')).not.toBeVisible();
  });

  test('Adding a type persists after reload', async ({ page }) => {
    // Granada seeded with Admiration; add Loyalty (no exclusive-pair conflict).
    await page.locator('[data-pw="bond-add-granada"]').click();
    await page.locator('[data-pw="bond-type-loyalty"]').click();
    await page.reload();
    const row = page.locator('[data-pw="bond-add-granada"]').locator('..');
    await expect(row.locator('text=Loyalty')).toBeVisible();
    await expect(row.locator('text=Admiration')).toBeVisible();
  });

  // ── Cross-card sync ───────────────────────────────────────────────────────

  test('Toggle on Overview Bonds reflects on Combat > Bonds subtab', async ({ page }) => {
    // Remove Affection from Jelena on Overview
    await page.locator('[data-pw="bond-add-jelena"]').click();
    await page.locator('[data-pw="bond-type-affection"]').click();
    await page.keyboard.press('Escape'); // close the menu before navigating

    await page.locator('[data-pw="app-footer"]').getByText('Combat').click();
    const combatRow = page.locator('[data-pw="bond-add-jelena"]').locator('..');
    await expect(combatRow.locator('text=Affection')).not.toBeVisible();
  });

  test('Toggle on Combat > Bonds reflects on Overview Bonds card', async ({ page }) => {
    await page.locator('[data-pw="app-footer"]').getByText('Combat').click();

    // Add Mistrust to Yoru on Combat
    await page.locator('[data-pw="bond-add-yoru"]').first().click();
    await page.locator('[data-pw="bond-type-mistrust"]').click();
    await page.keyboard.press('Escape'); // close the menu before navigating

    await page.locator('[data-pw="app-footer"]').getByText('Character').click();
    const overviewRow = page.locator('[data-pw="bond-add-yoru"]').locator('..');
    await expect(overviewRow.locator('text=Mistrust')).toBeVisible();
  });
});
