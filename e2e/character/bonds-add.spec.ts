import { devices, expect, test } from '@playwright/test';

import { activeFabUCharacterHasBond } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('BondsCard + Bond add flow (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('+ Bond button is visible on Overview Bonds card', async ({ page }) => {
    await expect(page.locator('[data-pw="bond-add-new"]').first()).toBeVisible();
  });

  test('+ Bond button is visible on Combat > Bonds subtab', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
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
    await expect.poll(() => activeFabUCharacterHasBond(page, 'Vesper')).toBe(true);
    await page.reload();
    await expect(page.locator('text=Vesper').first()).toBeVisible();
    await expect.poll(() => activeFabUCharacterHasBond(page, 'Vesper')).toBe(true);
  });

  test('Empty submit → no row added, input cancels', async ({ page }) => {
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-pw="bond-add-new"]').first()).toBeVisible();
  });

  test('Escape cancels without adding', async ({ page }) => {
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('ShouldNotAppear');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-pw="bond-add-new"]').first()).toBeVisible();
    await expect(page.locator('text=ShouldNotAppear')).not.toBeVisible();
  });

  test('Add from Overview → appears on Combat > Bonds subtab', async ({ page }) => {
    await page.locator('[data-pw="bond-add-new"]').first().click();
    await page.locator('[data-pw="bond-name-input"]').fill('CrossCard');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: 'Combat' }).first().click();
    await expect(page.locator('text=CrossCard').first()).toBeVisible();
  });
});
