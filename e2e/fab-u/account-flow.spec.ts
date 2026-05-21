import { expect, test } from '@playwright/test';

test.describe('Fab U account flow', () => {
  test('opens account dialog and switches auth modes', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-pw="account-menu-button"]').click();
    await expect(page.locator('[data-pw="account-dialog"]')).toBeVisible();
    await expect(page.locator('[data-pw="settings-theme-toggle"]')).toBeVisible();
    await expect(page.locator('[data-pw="auth-submit"]')).toContainText('Sign in');

    await page.locator('[data-pw="auth-mode-signUp"]').click();
    await expect(page.locator('[data-pw="auth-submit"]')).toContainText('Create account');

    await expect(page.locator('[data-pw="oauth-google"]')).toBeVisible();
    await expect(page.locator('[data-pw="oauth-discord"]')).toBeVisible();
    await expect(page.locator('[data-pw="auth-mode-magicLink"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="oauth-apple"]')).toHaveCount(0);
  });
});
