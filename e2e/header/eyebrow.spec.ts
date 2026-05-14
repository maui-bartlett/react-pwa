import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function navigateTo(page: any, tab: string) {
  await page.getByRole('button', { name: tab }).first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('HeaderBar — eyebrow text per tab (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
  });

  test('Overview eyebrow contains "Fabula" and "Ultima" text with a sparkle SVG', async ({
    page,
  }) => {
    const eyebrow = page.locator('[data-pw="header-eyebrow"]');
    const text = await eyebrow.textContent();
    console.log('Overview eyebrow textContent:', text);
    expect(text).toMatch(/fabula/i);
    expect(text).toMatch(/ultima/i);
    // Sparkles icon renders as an SVG
    await expect(eyebrow.locator('svg')).toBeVisible();
  });

  test('Combat eyebrow contains Rad and LV 13', async ({ page }) => {
    await navigateTo(page, 'Combat');
    const text = await page.locator('[data-pw="header-eyebrow"]').textContent();
    console.log('Combat eyebrow textContent:', text);
    expect(text).toMatch(/rad/i);
    expect(text).toMatch(/lv\s*13/i);
    expect(text).toContain('•');
  });

  test('Skills eyebrow contains Rad and LV 13', async ({ page }) => {
    await navigateTo(page, 'Skills');
    const text = await page.locator('[data-pw="header-eyebrow"]').textContent();
    expect(text).toMatch(/rad/i);
    expect(text).toContain('•');
  });

  test('Spells eyebrow contains Rad and LV 13', async ({ page }) => {
    await navigateTo(page, 'Spells');
    const text = await page.locator('[data-pw="header-eyebrow"]').textContent();
    expect(text).toMatch(/rad/i);
    expect(text).toContain('•');
  });

  test('Gear eyebrow contains Rad and LV 13', async ({ page }) => {
    await navigateTo(page, 'Gear');
    const text = await page.locator('[data-pw="header-eyebrow"]').textContent();
    expect(text).toMatch(/rad/i);
    expect(text).toContain('•');
  });

  test('Notes eyebrow contains Rad and LV 13', async ({ page }) => {
    await navigateTo(page, 'Notes');
    const text = await page.locator('[data-pw="header-eyebrow"]').textContent();
    expect(text).toMatch(/rad/i);
    expect(text).toContain('•');
  });

  test('Overview eyebrow has no middle-dot (it is distinct from other tabs)', async ({ page }) => {
    const text = await page.locator('[data-pw="header-eyebrow"]').textContent();
    expect(text).not.toContain('•');
  });
});
