import { devices, expect, test } from '@playwright/test';

import { readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Zenit editable pill (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    await page.getByRole('button', { name: 'Gear' }).first().click();
  });

  test('Zenit pill shows default value of 30', async ({ page }) => {
    await expect(page.locator('[data-pw="metric-zenit"]')).toContainText('30');
  });

  test('click opens input, non-digits are stripped', async ({ page }) => {
    const pill = page.locator('[data-pw="metric-zenit"]');
    const input = page.locator('[data-pw="metric-zenit-input"]');

    await pill.click();
    await expect(input).toBeVisible();

    await input.fill('');
    await input.type('abc50');
    await expect(input).toHaveValue('50');
  });

  test('blur commits new value', async ({ page }) => {
    await page.locator('[data-pw="metric-zenit"]').click();
    const input = page.locator('[data-pw="metric-zenit-input"]');
    await input.fill('120');
    await input.blur();

    await expect(input).not.toBeVisible();
    await expect(page.locator('[data-pw="metric-zenit"]')).toContainText('120');
  });

  test('value persists to IndexedDB and across reload', async ({ page }) => {
    await page.locator('[data-pw="metric-zenit"]').click();
    await page.locator('[data-pw="metric-zenit-input"]').fill('250');
    await page.locator('[data-pw="metric-zenit-input"]').blur();

    await expect.poll(async () => (await readActiveFabUCharacter(page)).zenit).toBe(250);

    await page.reload();
    await page.getByRole('button', { name: 'Gear' }).first().click();

    await expect(page.locator('[data-pw="metric-zenit"]')).toContainText('250');
  });
});
