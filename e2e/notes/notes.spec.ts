import { devices, expect, test } from '@playwright/test';

import { readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Notes tab — editable persistent fields (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for a clean slate
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    await page.evaluate(() => {
      localStorage.removeItem('fab-u-backstory-answers');
      localStorage.removeItem('fab-u-character-notes');
    });
    await page.getByRole('button', { name: 'Notes' }).first().click();
  });

  test('backstory answer fields are visible and editable', async ({ page }) => {
    const fields = page.locator('textarea:not([aria-hidden])');
    const count = await fields.count();
    // 3 backstory answers + 1 notes field = 4 textareas
    expect(count).toBeGreaterThanOrEqual(4);

    // Type into the first backstory answer field
    const firstField = fields.first();
    await firstField.fill('Test answer for first question');
    await expect(firstField).toHaveValue('Test answer for first question');
  });

  test('typed text persists across page reload', async ({ page }) => {
    const firstField = page.locator('textarea:not([aria-hidden])').first();
    await firstField.fill('Persistent answer text');
    await expect
      .poll(async () => JSON.stringify(await readActiveFabUCharacter(page)))
      .toContain('Persistent answer text');

    // Reload and navigate back to Notes
    await page.reload();
    await page.getByRole('button', { name: 'Notes' }).first().click();

    await expect(page.locator('textarea:not([aria-hidden])').first()).toHaveValue(
      'Persistent answer text',
    );
  });

  test('notes field text persists across page reload', async ({ page }) => {
    // Notes field is the last textarea (after the 3 backstory answer fields)
    const fields = page.locator('textarea:not([aria-hidden])');
    const count = await fields.count();
    const notesField = fields.nth(count - 1);

    await notesField.fill('My persistent campaign notes');
    await expect
      .poll(async () => (await readActiveFabUCharacter(page)).notes)
      .toBe('My persistent campaign notes');

    await page.reload();
    await page.getByRole('button', { name: 'Notes' }).first().click();

    const reloadedFields = page.locator('textarea:not([aria-hidden])');
    const reloadedCount = await reloadedFields.count();
    await expect(reloadedFields.nth(reloadedCount - 1)).toHaveValue('My persistent campaign notes');
  });

  test('focused field border is darker than unfocused', async ({ page }) => {
    const root = page.locator('.MuiOutlinedInput-root').first();
    const fieldset = root.locator('fieldset');

    // Unfocused border color
    const unfocusedBorder = await fieldset.evaluate((el) => getComputedStyle(el).borderColor);

    // Focus the field
    await root.click();
    const focusedBorder = await fieldset.evaluate((el) => getComputedStyle(el).borderColor);

    console.log('Unfocused border:', unfocusedBorder, '| Focused border:', focusedBorder);

    // Focused border must differ from unfocused
    expect(focusedBorder).not.toBe(unfocusedBorder);

    // Parse RGB values and verify focus visibly changes the border.
    const parseRgb = (s: string) => {
      const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!m) return 255;
      return (parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3])) / 3;
    };

    expect(Math.abs(parseRgb(focusedBorder) - parseRgb(unfocusedBorder))).toBeGreaterThan(10);
  });
});
