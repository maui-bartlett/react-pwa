import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'table-top-last-seen-version';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    const resetMarker = `${key}:e2e-reset`;
    if (window.sessionStorage.getItem(resetMarker)) return;
    window.localStorage.removeItem(key);
    window.sessionStorage.setItem(resetMarker, 'true');
  }, STORAGE_KEY);
});

test('shows the current version once and can be closed', async ({ page }) => {
  await page.goto('/avatar-legends');

  const banner = page.locator('[data-pw="new-version-banner"]');
  await expect(banner).toContainText(/New Version! 🎉 \S+/);

  await page.locator('[data-pw="new-version-banner-close"]').click();
  await expect(banner).toHaveCount(0);

  await page.reload();
  await expect(page.locator('[data-pw="new-version-banner"]')).toHaveCount(0);
});
