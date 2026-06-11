import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Add-row buttons — Classes and Bonds (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    // Overview is the default tab — Classes and Bonds are both on it
  });

  test('Classes list hides the "+ Class" add affordance when no free levels are available', async ({
    page,
  }) => {
    await expect(page.getByText('Classes').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Class' })).not.toBeVisible();
  });

  test('Bonds list has a "+ Bond" add affordance at the bottom', async ({ page }) => {
    const addRow = page.locator('[data-pw="bond-add-new"]').first();
    await addRow.scrollIntoViewIfNeeded();
    await expect(addRow).toBeVisible();

    const textContent = await addRow.textContent();
    expect(textContent).toBe('Bond');
  });

  test('Classes card still renders all default class rows', async ({ page }) => {
    await expect(page.getByText('Entropist')).toBeVisible();
    await expect(page.getByText('Sharpshooter')).toBeVisible();
    const tinkerer = page.getByText('Tinkerer');

    await expect(tinkerer).toBeVisible();
  });

  test('"+ Bond" add row is visible on Combat > Bonds subtab too', async ({ page }) => {
    // Navigate to Combat tab
    await page.getByRole('button', { name: 'Combat' }).first().click();

    // Bonds is the default combat subtab
    const addRow = page.locator('[data-pw="bond-add-new"]').first();
    await addRow.scrollIntoViewIfNeeded();
    await expect(addRow).toBeVisible();

    const textContent = await addRow.textContent();
    expect(textContent).toBe('Bond');
  });
});
