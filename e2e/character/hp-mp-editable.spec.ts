import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('HP / MP editable pills — Spells tab (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('HP pill shows currentHP with / totalHP suffix', async ({ page }) => {
    const hp = page.locator('[data-pw="metric-hp"]');
    await expect(hp).toContainText('58');
    const suffix = page.locator('[data-pw="metric-hp-suffix"]');
    await expect(suffix).toContainText('/ 58');
  });

  test('MP pill shows currentMP with / totalMP suffix', async ({ page }) => {
    const mp = page.locator('[data-pw="metric-mp"]');
    await expect(mp).toContainText('58');
    const suffix = page.locator('[data-pw="metric-mp-suffix"]');
    await expect(suffix).toContainText('/ 58');
  });

  test('HP pill: click opens input, edit commits on blur', async ({ page }) => {
    const hp = page.locator('[data-pw="metric-hp"]');
    const input = page.locator('[data-pw="metric-hp-input"]');

    await hp.click();
    await expect(input).toBeVisible();

    await input.fill('40');
    await input.blur();

    await expect(input).not.toBeVisible();
    await expect(hp).toContainText('40');
    const suffix = page.locator('[data-pw="metric-hp-suffix"]');
    await expect(suffix).toContainText('/ 58');
  });

  test('MP pill: click opens input, edit commits on blur', async ({ page }) => {
    const mp = page.locator('[data-pw="metric-mp"]');
    const input = page.locator('[data-pw="metric-mp-input"]');

    await mp.click();
    await expect(input).toBeVisible();

    await input.fill('20');
    await input.blur();

    await expect(input).not.toBeVisible();
    await expect(mp).toContainText('20');
    const suffix = page.locator('[data-pw="metric-mp-suffix"]');
    await expect(suffix).toContainText('/ 58');
  });

  test('clicking suffix does not open edit mode', async ({ page }) => {
    const suffix = page.locator('[data-pw="metric-hp-suffix"]');
    await suffix.click();
    const input = page.locator('[data-pw="metric-hp-input"]');
    await expect(input).not.toBeVisible();
  });

  test('HP and MP values persist across page reload', async ({ page }) => {
    await page.locator('[data-pw="metric-hp"]').click();
    await page.locator('[data-pw="metric-hp-input"]').fill('33');
    await page.locator('[data-pw="metric-hp-input"]').blur();

    await page.locator('[data-pw="metric-mp"]').click();
    await page.locator('[data-pw="metric-mp-input"]').fill('17');
    await page.locator('[data-pw="metric-mp-input"]').blur();

    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem('fab-u-character') ?? '{}'),
    );
    expect(stored.currentHP).toBe(33);
    expect(stored.currentMP).toBe(17);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-pw="metric-hp"]')).toContainText('33');
    await expect(page.locator('[data-pw="metric-mp"]')).toContainText('17');
  });

  test('Enter key commits HP edit', async ({ page }) => {
    await page.locator('[data-pw="metric-hp"]').click();
    const input = page.locator('[data-pw="metric-hp-input"]');
    await input.fill('55');
    await input.press('Enter');

    await expect(input).not.toBeVisible();
    await expect(page.locator('[data-pw="metric-hp"]')).toContainText('55');
  });
});
