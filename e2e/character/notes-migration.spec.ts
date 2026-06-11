import { devices, expect, test } from '@playwright/test';

import { clearFabUCharacterStorage, readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Character notes — persistence and migration (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    await page.evaluate(() => {
      localStorage.removeItem('fab-u-character-notes');
    });
    await page.getByRole('button', { name: 'Notes' }).first().click();
  });

  test('notes field shows default character notes', async ({ page }) => {
    const notesCard = page.locator('text=Chuck Norris').first();
    await expect(notesCard).toBeVisible();
  });

  test('editing notes persists to IndexedDB', async ({ page }) => {
    const textarea = page.locator('textarea:not([aria-hidden])').last();
    await textarea.fill('New campaign notes here');
    await textarea.blur();

    await expect
      .poll(async () => (await readActiveFabUCharacter(page)).notes)
      .toBe('New campaign notes here');
  });

  test('notes value persists across page reload', async ({ page }) => {
    const textarea = page.locator('textarea:not([aria-hidden])').last();
    await textarea.fill('Persistent note');
    await textarea.blur();

    await page.reload();
    await page.getByRole('button', { name: 'Notes' }).first().click();

    const textareaAfter = page.locator('textarea:not([aria-hidden])').last();
    await expect(textareaAfter).toHaveValue('Persistent note');
  });

  test('migrates notes from old fab-u-character-notes key on first load', async ({ page }) => {
    await clearFabUCharacterStorage(page);
    await page.evaluate(() => {
      localStorage.removeItem('fab-u-character');
      localStorage.setItem('fab-u-character-notes', JSON.stringify('Migrated old note'));
    });

    await page.reload();
    await page.getByRole('button', { name: 'Notes' }).first().click();

    const textarea = page.locator('textarea:not([aria-hidden])').last();
    await expect(textarea).toHaveValue('Migrated old note');
  });
});
