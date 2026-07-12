import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('IP management modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('clicking IP pills opens the IP management modal', async ({ page }) => {
    const overviewIp = page.locator('[data-pw="statpill-ov-ip"]');
    await overviewIp.click();
    await expect(page.locator('[data-pw="ip-management-modal"]')).toBeVisible();
    await expect(page.locator('[data-pw="ip-management-add"]')).toBeVisible();
    await expect(page.locator('[data-pw="ip-management-subtract"]')).toBeVisible();
    await page.locator('[data-pw="ip-management-close"]').click();

    await page.locator('[data-pw="app-footer"]').getByText('Combat').click();
    await page.locator('[data-pw="statpill-cb-ip"]').click();
    await expect(page.locator('[data-pw="ip-management-modal"]')).toBeVisible();
    await page.locator('[data-pw="ip-management-close"]').click();

    await page.locator('[data-pw="app-footer"]').getByText('Spells').click();
    await page.locator('[data-pw="metric-ip"]').click();
    await expect(page.locator('[data-pw="ip-management-modal"]')).toBeVisible();
    await page.locator('[data-pw="ip-management-close"]').click();

    await page.locator('[data-pw="app-footer"]').getByText('Gear').click();
    await page.locator('[data-pw="metric-ip"]').click();
    await expect(page.locator('[data-pw="ip-management-modal"]')).toBeVisible();
    await page.locator('[data-pw="ip-management-close"]').click();
    await expect(page.locator('[data-pw="ip-management-modal"]')).toBeHidden();
  });

  test('spending and recovering IP updates the pill value', async ({ page }) => {
    const ipValue = page.locator('[data-pw="statpill-ov-ip"]').locator('h6').first();
    await expect(ipValue).toHaveText('6');

    await page.locator('[data-pw="statpill-ov-ip"]').click();
    const amount = page.locator('[data-pw="ip-management-amount-input"]');
    await amount.fill('3');
    await expect(amount).toHaveValue('3');
    await page.locator('[data-pw="ip-management-subtract"]').click();
    await expect(ipValue).toHaveText('3');

    await amount.fill('2');
    await expect(amount).toHaveValue('2');
    await page.locator('[data-pw="ip-management-add"]').click();
    await expect(ipValue).toHaveText('5');
  });
});
