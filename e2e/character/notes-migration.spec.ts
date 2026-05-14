import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Character notes — persistence and migration (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => {
      localStorage.removeItem('fab-u-character');
      localStorage.removeItem('fab-u-character-notes');
    });
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Notes' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('notes field shows default character notes', async ({ page }) => {
    const notesCard = page.locator('text=Chuck Norris').first();
    await expect(notesCard).toBeVisible();
  });

  test('editing notes persists to localStorage under fab-u-character key', async ({ page }) => {
    const textarea = page.locator('textarea').last();
    await textarea.fill('New campaign notes here');
    await textarea.blur();

    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem('fab-u-character') ?? '{}'),
    );
    expect(stored.notes).toBe('New campaign notes here');
  });

  test('notes value persists across page reload', async ({ page }) => {
    const textarea = page.locator('textarea').last();
    await textarea.fill('Persistent note');
    await textarea.blur();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Notes' }).first().click();
    await page.waitForLoadState('networkidle');

    const textareaAfter = page.locator('textarea').last();
    await expect(textareaAfter).toHaveValue('Persistent note');
  });

  test('migrates notes from old fab-u-character-notes key on first load', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('fab-u-character');
      localStorage.setItem('fab-u-character-notes', JSON.stringify('Migrated old note'));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Notes' }).first().click();
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').last();
    await expect(textarea).toHaveValue('Migrated old note');

    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem('fab-u-character') ?? '{}'),
    );
    expect(stored.notes).toBe('Migrated old note');
  });
});
