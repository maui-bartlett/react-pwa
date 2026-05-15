import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('SpellsTable — expandable rows (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
    // Navigate to the Spells tab via the bottom nav bar (ButtonBase, renders as <button>)
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('default state: 4 columns (Spell / MP / Target / Duration) with no effect text visible', async ({
    page,
  }) => {
    const firstTable = page.locator('table').first();

    // Header columns
    await expect(firstTable.getByRole('columnheader', { name: /spell/i })).toBeVisible();
    await expect(firstTable.getByRole('columnheader', { name: /^mp$/i })).toBeVisible();
    await expect(firstTable.getByRole('columnheader', { name: /target/i })).toBeVisible();
    await expect(firstTable.getByRole('columnheader', { name: /duration/i })).toBeVisible();

    // Effect column header should NOT exist
    await expect(firstTable.getByRole('columnheader', { name: /^effect$/i })).not.toBeAttached();

    // Effect text should not be visible in the default state
    // "Accelerate" is the first spell — its effect text should be hidden
    await expect(page.getByText('Target takes one extra action on their turn.')).not.toBeVisible();
  });

  test('clicking a row expands and shows the Effect text', async ({ page }) => {
    const firstTable = page.locator('table').first();

    // Find the first spell row (Accelerate) and click it
    const accelerateRow = firstTable.getByRole('row', { name: /accelerate/i }).first();
    await accelerateRow.click();

    // The effect text should now be visible
    const effectText = page.getByText('Target takes one extra action on their turn.');
    await expect(effectText).toBeVisible();

    // Confirm the text content is correct
    const content = await effectText.textContent();
    expect(content).toBe('Target takes one extra action on their turn.');
  });

  test('clicking an expanded row collapses it again', async ({ page }) => {
    const firstTable = page.locator('table').first();
    const accelerateRow = firstTable.getByRole('row', { name: /accelerate/i }).first();

    // Expand
    await accelerateRow.click();
    await expect(page.getByText('Target takes one extra action on their turn.')).toBeVisible();

    // Collapse
    await accelerateRow.click();
    await expect(
      page.getByText('Target takes one extra action on their turn.'),
    ).not.toBeVisible();
  });

  test('only one row expands at a time', async ({ page }) => {
    const firstTable = page.locator('table').first();

    const accelerateRow = firstTable.getByRole('row', { name: /accelerate/i }).first();
    const drainRow = firstTable.getByRole('row', { name: /drain spirit/i }).first();

    await accelerateRow.click();
    await expect(page.getByText('Target takes one extra action on their turn.')).toBeVisible();

    await drainRow.click();
    // Accelerate effect should now be hidden
    await expect(
      page.getByText('Target takes one extra action on their turn.'),
    ).not.toBeVisible();
    // Drain Spirit effect should be visible
    await expect(page.getByText(/HR \+ 15 MP/)).toBeVisible();
  });
});
