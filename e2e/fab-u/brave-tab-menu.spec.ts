import { type Page, expect, test } from '@playwright/test';

async function mockBraveBrowser(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'brave', {
      configurable: true,
      value: {
        isBrave: () => Promise.resolve(true),
      },
    });
  });
}

test('shows the FabU header tab menu only in Brave', async ({ page }) => {
  await page.goto('/fab-u');

  await expect(page.locator('[data-pw="fab-u-brave-tab-menu-button"]')).toBeHidden();

  await mockBraveBrowser(page);
  await page.goto('/fab-u');

  await expect(page.locator('[data-pw="fab-u-brave-tab-menu-button"]')).toBeVisible();
});

test('switches FabU tabs from the Brave header tab menu', async ({ page }) => {
  await mockBraveBrowser(page);
  await page.goto('/fab-u');

  await page.locator('[data-pw="fab-u-brave-tab-menu-button"]').click();
  await expect(page.locator('[data-pw="fab-u-brave-tab-menu"]')).toBeVisible();
  await page.locator('[data-pw="fab-u-brave-tab-menu-gear"]').click();

  await expect(page.locator('[data-pw="header-title"]')).toHaveText('Gear & Inventory');
  await expect(page.locator('[data-pw="fab-u-brave-tab-menu"]')).toBeHidden();
});
