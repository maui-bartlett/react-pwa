import { devices, expect, test } from '@playwright/test';

import { readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

const pillValue = (page: import('@playwright/test').Page, pillId: string, value: string) =>
  page.locator(`[data-pw="${pillId}"]`).getByRole('heading', { name: value });

test.describe('Attribute pills — die + modifier picker (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    // Overview tab has Attributes & Stats card with bottomRow attribute pills
  });

  test('Dexterity pill shows default d8', async ({ page }) => {
    await expect(page.getByText('d8').first()).toBeVisible();
  });

  test('Insight pill shows default d10', async ({ page }) => {
    await expect(page.getByText('d10').first()).toBeVisible();
  });

  test('Willpower pill shows d8 + 1 by default', async ({ page }) => {
    await expect(page.getByText('d8 + 1')).toBeVisible();
  });

  test('clicking Dexterity opens popover with die select', async ({ page }) => {
    await page.getByText('Dexterity').click();
    const dieSelect = page.locator('[data-pw="attr-die-select"]');
    await expect(dieSelect).toBeVisible();

    // All 5 options present
    for (const d of ['d6', 'd8', 'd10', 'd12', 'd20']) {
      await expect(dieSelect.locator(`option[value="${d}"]`)).toHaveCount(1);
    }
  });

  test('changing die to d12 updates pill display', async ({ page }) => {
    await page.getByText('Dexterity').click();
    const dieSelect = page.locator('[data-pw="attr-die-select"]');
    await dieSelect.selectOption('d12');

    // Close popover by pressing Escape
    await page.keyboard.press('Escape');
    await expect(pillValue(page, 'attr-pill-dexterity', 'd12')).toBeVisible();
  });

  test('setting modifier to 2 shows die + 2', async ({ page }) => {
    await page.getByText('Dexterity').click();
    const modSelect = page.locator('[data-pw="attr-mod-select"]');
    await modSelect.selectOption('2');
    await page.keyboard.press('Escape');

    await expect(pillValue(page, 'attr-pill-dexterity', 'd8 + 2')).toBeVisible();
  });

  test('setting modifier to 1 shows die + 1', async ({ page }) => {
    await page.getByText('Dexterity').click();
    const modSelect = page.locator('[data-pw="attr-mod-select"]');
    await modSelect.selectOption('1');
    await page.keyboard.press('Escape');

    await expect(pillValue(page, 'attr-pill-dexterity', 'd8 + 1')).toBeVisible();
  });

  test('setting modifier to 0 shows die only', async ({ page }) => {
    // Willpower has modifier 1 by default — clear it
    await page.getByText('Willpower').click();
    const modSelect = page.locator('[data-pw="attr-mod-select"]');
    await modSelect.selectOption('0');
    await page.keyboard.press('Escape');

    // Should no longer show '+ 1'
    await expect(page.getByText('d8 + 1')).not.toBeVisible();
  });

  test('attribute changes persist to IndexedDB and survive reload', async ({ page }) => {
    await page.getByText('Insight').click();
    await page.locator('[data-pw="attr-die-select"]').selectOption('d12');
    const modSelect = page.locator('[data-pw="attr-mod-select"]');
    await modSelect.selectOption('3');
    await page.keyboard.press('Escape');

    await expect
      .poll(async () => readActiveFabUCharacter(page))
      .toMatchObject({ attributes: { insight: { die: 'd12', modifier: 3 } } });

    await page.reload();

    await expect(pillValue(page, 'attr-pill-insight', 'd12 + 3')).toBeVisible();
  });

  test('attribute changes visible on Combat tab (same atom)', async ({ page }) => {
    await page.getByText('Might').click();
    await page.locator('[data-pw="attr-die-select"]').selectOption('d10');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Combat' }).first().click();

    await expect(pillValue(page, 'attr-pill-might', 'd10')).toBeVisible();
  });
});
