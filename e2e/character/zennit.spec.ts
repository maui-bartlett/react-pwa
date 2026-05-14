import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Zennit editable pill (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Gear' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('Zennit pill shows default value of 30', async ({ page }) => {
    await expect(page.locator('[data-pw="metric-zennit"]')).toContainText('30');
  });

  test('click opens input, non-digits are stripped', async ({ page }) => {
    const pill = page.locator('[data-pw="metric-zennit"]');
    const input = page.locator('[data-pw="metric-zennit-input"]');

    await pill.click();
    await expect(input).toBeVisible();

    await input.fill('');
    await input.type('abc50');
    await expect(input).toHaveValue('50');
  });

  test('blur commits new value', async ({ page }) => {
    await page.locator('[data-pw="metric-zennit"]').click();
    const input = page.locator('[data-pw="metric-zennit-input"]');
    await input.fill('120');
    await input.blur();

    await expect(input).not.toBeVisible();
    await expect(page.locator('[data-pw="metric-zennit"]')).toContainText('120');
  });

  test('value persists to localStorage and across reload', async ({ page }) => {
    await page.locator('[data-pw="metric-zennit"]').click();
    await page.locator('[data-pw="metric-zennit-input"]').fill('250');
    await page.locator('[data-pw="metric-zennit-input"]').blur();

    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem('fab-u-character') ?? '{}'),
    );
    expect(stored.zennit).toBe(250);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Gear' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-pw="metric-zennit"]')).toContainText('250');
  });
});
