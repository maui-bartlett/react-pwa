import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Gear tab — Backpack add-item affordance (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Gear' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('Backpack section has a "+ Item" add affordance at the bottom', async ({ page }) => {
    // Find the Backpack card by its label
    const backpackCard = page.locator('text=Backpack').locator('../..');

    // The add row should contain "Item" text (AddIcon is aria-hidden, so textContent = "Item")
    const addRow = page.getByText('Item').last();
    await expect(addRow).toBeVisible();

    const textContent = await addRow.textContent();
    expect(textContent).toBe('Item');
  });

  test('Equipment section still has its "+ Accessory" affordance', async ({ page }) => {
    const accessoryRow = page.getByText('Accessory').last();
    await expect(accessoryRow).toBeVisible();

    const textContent = await accessoryRow.textContent();
    expect(textContent).toBe('Accessory');
  });

  test('Backpack add row is visually after the item list', async ({ page }) => {
    // Verify "Green Crystal" and "Grimoire" appear before the add row
    const greenCrystal = page.getByText('Green Crystal');
    const grimoire = page.getByText('Grimoire');
    const addRow = page.getByText('Item').last();

    await expect(greenCrystal).toBeVisible();
    await expect(grimoire).toBeVisible();
    await expect(addRow).toBeVisible();

    // The add row's bounding box should be below the last item
    const grimoireBox = await grimoire.boundingBox();
    const addRowBox = await addRow.boundingBox();
    expect(addRowBox!.y).toBeGreaterThan(grimoireBox!.y);
  });
});
