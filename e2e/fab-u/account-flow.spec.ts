import { expect, test } from '@playwright/test';

test.describe('Fab U account flow', () => {
  test('opens account dialog and switches auth modes', async ({ page }) => {
    // Fab-U lives at /fab-u (home '/' now serves the Avatar Legends page)
    await page.goto('/fab-u');

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

test.describe('Fab U account dialog — Characters screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.waitForLoadState('networkidle');
  });

  test('dialog title shows account label on profile screen (unauthenticated)', async ({ page }) => {
    await page.locator('[data-pw="account-menu-button"]').click();
    await expect(page.locator('[data-pw="account-dialog"]')).toBeVisible();

    // The dialog title heading should NOT say "Characters" on the profile screen
    const titleText = await page
      .locator('[data-pw="account-dialog"]')
      .getByRole('heading')
      .first()
      .textContent();
    expect(titleText).not.toBe('Characters');
  });

  test('Characters button is visible in account dialog for unauthenticated user', async ({
    page,
  }) => {
    await page.locator('[data-pw="account-menu-button"]').click();
    await expect(page.locator('[data-pw="account-dialog"]')).toBeVisible();

    await expect(page.locator('[data-pw="account-characters"]')).toBeVisible();
    await expect(page.locator('[data-pw="account-characters"]')).toContainText('Characters');
  });

  test('clicking Characters button navigates to Characters screen', async ({ page }) => {
    await page.locator('[data-pw="account-menu-button"]').click();
    await page.locator('[data-pw="account-characters"]').click();

    // Dialog title changes to "Characters"
    const dialog = page.locator('[data-pw="account-dialog"]');
    await expect(dialog).toContainText('Characters');
  });

  test('Characters screen shows Back button instead of Close button', async ({ page }) => {
    await page.locator('[data-pw="account-menu-button"]').click();
    await page.locator('[data-pw="account-characters"]').click();

    const dialog = page.locator('[data-pw="account-dialog"]');
    await expect(dialog.getByRole('button', { name: 'Back to profile' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close account dialog' })).toHaveCount(0);
  });

  test('clicking Back button on Characters screen returns to profile screen', async ({ page }) => {
    await page.locator('[data-pw="account-menu-button"]').click();
    await page.locator('[data-pw="account-characters"]').click();

    const dialog = page.locator('[data-pw="account-dialog"]');
    await dialog.getByRole('button', { name: 'Back to profile' }).click();

    // Back on profile: theme toggle visible, close button visible
    await expect(page.locator('[data-pw="settings-theme-toggle"]')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close account dialog' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Back to profile' })).toHaveCount(0);
  });

  test('Characters screen shows local character info for unauthenticated user', async ({
    page,
  }) => {
    await page.locator('[data-pw="account-menu-button"]').click();
    await page.locator('[data-pw="account-characters"]').click();

    const dialog = page.locator('[data-pw="account-dialog"]');
    // Should show "Local Character" label for guest users
    await expect(dialog).toContainText('Local Character');
  });

  test('closing dialog via close button resets screen to profile', async ({ page }) => {
    await page.locator('[data-pw="account-menu-button"]').click();
    await page.locator('[data-pw="account-characters"]').click();

    // Go back to profile, then close
    const dialog = page.locator('[data-pw="account-dialog"]');
    await dialog.getByRole('button', { name: 'Back to profile' }).click();
    await dialog.getByRole('button', { name: 'Close account dialog' }).click();

    await expect(dialog).not.toBeVisible();

    // Reopen — should start on profile screen, not characters
    await page.locator('[data-pw="account-menu-button"]').click();
    await expect(page.locator('[data-pw="settings-theme-toggle"]')).toBeVisible();
    await expect(page.locator('[data-pw="account-characters"]')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Back to profile' })).toHaveCount(0);
  });

  test('reopening dialog always starts on profile screen', async ({ page }) => {
    // Navigate to characters screen then close via backdrop
    await page.locator('[data-pw="account-menu-button"]').click();
    await page.locator('[data-pw="account-characters"]').click();
    await expect(page.locator('[data-pw="account-dialog"]')).toContainText('Characters');

    // Close by pressing Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-pw="account-dialog"]')).not.toBeVisible();

    // Reopen — must start on profile screen
    await page.locator('[data-pw="account-menu-button"]').click();
    await expect(page.locator('[data-pw="settings-theme-toggle"]')).toBeVisible();
    await expect(page.locator('[data-pw="account-dialog"]').getByRole('button', { name: 'Back to profile' })).toHaveCount(0);
  });

  test('profile screen still shows theme toggle and auth form for unauthenticated user', async ({
    page,
  }) => {
    await page.locator('[data-pw="account-menu-button"]').click();

    // Navigate to characters and back
    await page.locator('[data-pw="account-characters"]').click();
    await page.locator('[data-pw="account-dialog"]').getByRole('button', { name: 'Back to profile' }).click();

    // Profile screen content should be intact
    await expect(page.locator('[data-pw="settings-theme-toggle"]')).toBeVisible();
    await expect(page.locator('[data-pw="auth-submit"]')).toBeVisible();
  });
});
