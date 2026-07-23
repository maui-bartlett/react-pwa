import { expect, test } from '@playwright/test';

test.describe('Fab U account flow', () => {
  test('opens account dialog and shows OAuth sign in options', async ({ page }) => {
    // Fab-U lives at /fab-u (home '/' now serves the Avatar Legends page)
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await page.locator('[data-pw="account-menu-button"]').click();
    await expect(page.locator('[data-pw="account-dialog"]')).toBeVisible();
    await expect(page.locator('[data-pw="settings-theme-toggle"]')).toBeVisible();

    await expect(page.locator('[data-pw="oauth-google"]')).toBeVisible();
    await expect(page.locator('[data-pw="oauth-discord"]')).toBeVisible();
    await expect(page.locator('[data-pw="auth-submit"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="auth-mode-signIn"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="auth-mode-signUp"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="auth-mode-magicLink"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="oauth-apple"]')).toHaveCount(0);
  });

  test('fills the active local character card with the app accent color', async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await page.locator('[data-pw="account-menu-button"]').click();
    await page.locator('[data-pw="account-characters"]').click();

    const activeCard = page.locator(
      '[data-pw="account-local-character-card"][aria-pressed="true"]',
    );
    await expect(activeCard).toBeVisible();
    await expect(activeCard).toHaveCSS('background-color', 'rgb(196, 148, 64)');
  });

  test('highlights a newly selected character card immediately', async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await page.locator('[data-pw="account-menu-button"]').click();
    await page.locator('[data-pw="account-characters"]').click();
    await page.getByRole('button', { name: 'Add character' }).click();

    const cards = page.locator('[data-pw="account-local-character-card"]');
    await expect(cards).toHaveCount(2);
    const newlySelectedCard = cards.first();
    await expect(newlySelectedCard).toHaveAttribute('aria-pressed', 'false');
    await newlySelectedCard.click();

    await expect(newlySelectedCard).toHaveAttribute('aria-pressed', 'true');
    await expect(newlySelectedCard).toHaveCSS('background-color', 'rgb(196, 148, 64)');
    await expect(
      page.locator('[data-pw="account-local-character-card"][aria-pressed="true"]'),
    ).toHaveCount(1);
  });
});
