import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('BondsCard + Bond add flow (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('+ Bond button is visible on Overview Bonds card', async ({ page }) => {
    await expect(page.locator('[data-pw="bond-add-new"]').first()).toBeVisible();
  });

  test('+ Bond button is visible on Combat > Bonds subtab', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-pw="bond-add-new"]').first()).toBeVisible();
  });

  test('Clicking + Bond opens input with focus', async ({ page }) => {
    await page.locator('[data-pw="bond-add-new"]').first().click();
    const input = page.locator('[data-pw="bond-name-input"]');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('Type Vesper + Enter → row appears, input collapses to + Bond', async ({ page }) => {
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('Vesper');
    await page.keyboard.press('Enter');
    // New bond row should appear
    await expect(page.locator('text=Vesper').first()).toBeVisible();
    // Input collapses back to + Bond button
    await expect(page.locator('[data-pw="bond-add-new"]').first()).toBeVisible();
    await expect(page.locator('[data-pw="bond-name-input"]')).not.toBeVisible();
  });

  test('New bond persists after reload', async ({ page }) => {
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('Vesper');
    await page.keyboard.press('Enter');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Vesper').first()).toBeVisible();
    // Verify via localStorage
    const stored = await page.evaluate(() => localStorage.getItem('fab-u-character'));
    expect(stored).toContain('Vesper');
  });

  test('Empty submit → no row added, input cancels', async ({ page }) => {
    const bondCount = await page.locator('[data-pw^="bond-add-"]').count();
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-pw="bond-add-new"]').first()).toBeVisible();
    // Bond count unchanged (minus the add-new button itself)
    const newCount = await page.locator('[data-pw^="bond-add-"]').count();
    expect(newCount).toBe(bondCount);
  });

  test('Escape cancels without adding', async ({ page }) => {
    const bondCount = await page.locator('[data-pw^="bond-add-"]').count();
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('ShouldNotAppear');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-pw="bond-add-new"]').first()).toBeVisible();
    await expect(page.locator('text=ShouldNotAppear')).not.toBeVisible();
    const newCount = await page.locator('[data-pw^="bond-add-"]').count();
    expect(newCount).toBe(bondCount);
  });

  test('Add from Overview → appears on Combat > Bonds subtab', async ({ page }) => {
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('CrossCard');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=CrossCard').first()).toBeVisible();
  });
});
