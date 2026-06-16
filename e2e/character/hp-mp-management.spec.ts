import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('HP/MP management modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('clicking the HP pill opens the HP management modal', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-hp"]').click();
    await expect(page.locator('[data-pw="hp-management-modal"]')).toBeVisible();
    await expect(page.locator('[data-pw="hp-management-add"]')).toBeVisible();
    await expect(page.locator('[data-pw="hp-management-subtract"]')).toBeVisible();
    await page.locator('[data-pw="hp-management-close"]').click();
    await expect(page.locator('[data-pw="hp-management-modal"]')).toBeHidden();
  });

  test('clicking the MP pill opens the MP management modal', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-mp"]').click();
    await expect(page.locator('[data-pw="mp-management-modal"]')).toBeVisible();
    await page.locator('[data-pw="mp-management-close"]').click();
    await expect(page.locator('[data-pw="mp-management-modal"]')).toBeHidden();
  });

  test('damage reduces current HP by the entered amount', async ({ page }) => {
    const hpValue = page.locator('[data-pw="statpill-ov-hp"]').locator('h6').first();
    const before = Number.parseInt((await hpValue.textContent()) ?? '0', 10);

    await page.locator('[data-pw="statpill-ov-hp"]').click();
    await expect(page.locator('[data-pw="hp-management-modal"]')).toBeVisible();
    await page.locator('[data-pw="hp-management-amount-input"]').fill('3');
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await page.locator('[data-pw="hp-management-close"]').click();

    await expect(hpValue).toHaveText(String(Math.max(0, before - 3)));
  });
});
