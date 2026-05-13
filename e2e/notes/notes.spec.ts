import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Notes tab — editable persistent fields (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for a clean slate
    await page.goto('/fab-u');
    await page.evaluate(() => {
      localStorage.removeItem('fab-u-backstory-answers');
      localStorage.removeItem('fab-u-character-notes');
    });
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Notes' }).first().click();
    await page.waitForLoadState('networkidle');
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

    // Reload and navigate back to Notes
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Notes' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('textarea:not([aria-hidden])').first()).toHaveValue('Persistent answer text');
  });

  test('notes field text persists across page reload', async ({ page }) => {
    // Notes field is the last textarea (after the 3 backstory answer fields)
    const fields = page.locator('textarea:not([aria-hidden])');
    const count = await fields.count();
    const notesField = fields.nth(count - 1);

    await notesField.fill('My persistent campaign notes');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Notes' }).first().click();
    await page.waitForLoadState('networkidle');

    const reloadedFields = page.locator('textarea:not([aria-hidden])');
    const reloadedCount = await reloadedFields.count();
    await expect(reloadedFields.nth(reloadedCount - 1)).toHaveValue(
      'My persistent campaign notes',
    );
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

    // Parse RGB values and verify focused is darker (lower average RGB)
    const parseRgb = (s: string) => {
      const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!m) return 255;
      return (parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3])) / 3;
    };

    expect(parseRgb(focusedBorder)).toBeLessThan(parseRgb(unfocusedBorder));
  });
});
