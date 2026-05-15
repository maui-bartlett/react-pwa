import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Add-row buttons — Classes and Bonds (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
    // Overview is the default tab — Classes and Bonds are both on it
  });

  test('Classes list has a "+ Class" add affordance at the bottom', async ({ page }) => {
    const addRow = page.getByText('Class').last();
    await expect(addRow).toBeVisible();

    const textContent = await addRow.textContent();
    expect(textContent).toBe('Class');
  });

  test('Bonds list has a "+ Bond" add affordance at the bottom', async ({ page }) => {
    const addRow = page.getByText('Bond').last();
    await expect(addRow).toBeVisible();

    const textContent = await addRow.textContent();
    expect(textContent).toBe('Bond');
  });

  test('"+ Class" add row is positioned after the last class item', async ({ page }) => {
    const tinkerer = page.getByText('Tinkerer');
    const addRow = page.getByText('Class').last();

    await expect(tinkerer).toBeVisible();
    await expect(addRow).toBeVisible();

    const tinkererBox = await tinkerer.boundingBox();
    const addRowBox = await addRow.boundingBox();
    expect(addRowBox!.y).toBeGreaterThan(tinkererBox!.y);
  });

  test('"+ Bond" add row is visible on Combat > Bonds subtab too', async ({ page }) => {
    // Navigate to Combat tab
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');

    // Bonds is the default combat subtab
    const addRow = page.getByText('Bond').last();
    await expect(addRow).toBeVisible();

    const textContent = await addRow.textContent();
    expect(textContent).toBe('Bond');
  });
});
