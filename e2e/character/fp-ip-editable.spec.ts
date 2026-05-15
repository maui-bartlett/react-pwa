import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('FP / IP editable pills (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.waitForLoadState('networkidle');
    // Navigate to Skills tab which shows both FP and IP pills
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('FP pill: click opens input, non-digit stripped, value commits on blur', async ({
    page,
  }) => {
    const fpPill = page.locator('[data-pw="metric-fp"]');
    const input = page.locator('[data-pw="metric-fp-input"]');

    // Default shows 4
    await expect(fpPill).toContainText('4');

    // Click to edit
    await fpPill.click();
    await expect(input).toBeVisible();

    // Type a non-digit then digits — non-digit should be stripped
    await input.fill('');
    await input.type('a12');
    await expect(input).toHaveValue('12');

    // Blur commits
    await input.blur();
    await expect(input).not.toBeVisible();
    await expect(fpPill).toContainText('12');
  });

  test('IP pill: click opens input, value commits, blur shows new value', async ({ page }) => {
    const ipPill = page.locator('[data-pw="metric-ip"]');
    const input = page.locator('[data-pw="metric-ip-input"]');

    await expect(ipPill).toContainText('8');

    await ipPill.click();
    await expect(input).toBeVisible();
    await input.fill('25');
    await input.blur();

    await expect(input).not.toBeVisible();
    await expect(ipPill).toContainText('25');
  });

  test('FP and IP values persist across page reload', async ({ page }) => {
    // Edit FP
    await page.locator('[data-pw="metric-fp"]').click();
    await page.locator('[data-pw="metric-fp-input"]').fill('7');
    await page.locator('[data-pw="metric-fp-input"]').blur();

    // Edit IP
    await page.locator('[data-pw="metric-ip"]').click();
    await page.locator('[data-pw="metric-ip-input"]').fill('15');
    await page.locator('[data-pw="metric-ip-input"]').blur();

    // Verify localStorage has the values
    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem('fab-u-character') ?? '{}'),
    );
    console.log('Stored character:', stored);
    expect(stored.fabulaPoints).toBe(7);
    expect(stored.inventoryPoints).toBe(15);

    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-pw="metric-fp"]')).toContainText('7');
    await expect(page.locator('[data-pw="metric-ip"]')).toContainText('15');
  });

  test('Enter key commits the value', async ({ page }) => {
    await page.locator('[data-pw="metric-fp"]').click();
    const input = page.locator('[data-pw="metric-fp-input"]');
    await input.fill('99');
    await input.press('Enter');

    await expect(input).not.toBeVisible();
    await expect(page.locator('[data-pw="metric-fp"]')).toContainText('99');
  });
});
