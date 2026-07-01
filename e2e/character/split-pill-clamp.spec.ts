import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

// XP is still edited inline via its suffix pill. HP/MP are now adjusted through
// the HP/MP management modal (see hp-mp-management.spec.ts), so their inline
// click-through / clamping cases live there instead.
test.describe('XP split-pill click-through and clamping (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('Overview XP SummaryStrip: clicking suffix area enters edit mode', async ({ page }) => {
    await page.locator('[data-pw="metric-ov-xp"]').click({ position: { x: 70, y: 32 } });
    await expect(page.locator('[data-pw="metric-ov-xp-input"]')).toBeVisible();
    await page.locator('[data-pw="metric-ov-xp-input"]').blur();
  });

  test('Overview XP: typing 999 → rolls over into level and XP 9', async ({ page }) => {
    const pill = page.locator('[data-pw="metric-ov-xp"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-ov-xp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('9');
  });

  test('Skills XP: typing 999 → rolls over into level and XP 9', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    const pill = page.locator('[data-pw="metric-sk-xp"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-sk-xp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('9');
  });
});
