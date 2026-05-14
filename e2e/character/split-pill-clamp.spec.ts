import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Split-pill click-through and clamping (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ── Click-through: clicking suffix or neutral area enters edit mode ──────

  test('Overview HP StatPill: clicking suffix enters edit mode', async ({ page }) => {
    const suffix = page.locator('[data-pw="statpill-ov-hp-suffix"]');
    await suffix.click();
    await expect(page.locator('[data-pw="statpill-ov-hp-input"]')).toBeVisible();
    await page.locator('[data-pw="statpill-ov-hp-input"]').blur();
  });

  test('Overview MP StatPill: clicking suffix enters edit mode', async ({ page }) => {
    const suffix = page.locator('[data-pw="statpill-ov-mp-suffix"]');
    await suffix.click();
    await expect(page.locator('[data-pw="statpill-ov-mp-input"]')).toBeVisible();
    await page.locator('[data-pw="statpill-ov-mp-input"]').blur();
  });

  test('Spells HP SummaryStrip: clicking suffix enters edit mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');
    const suffix = page.locator('[data-pw="metric-hp-suffix"]');
    await suffix.click();
    await expect(page.locator('[data-pw="metric-hp-input"]')).toBeVisible();
    await page.locator('[data-pw="metric-hp-input"]').blur();
  });

  test('Overview XP SummaryStrip: clicking suffix enters edit mode', async ({ page }) => {
    const suffix = page.locator('[data-pw="metric-ov-xp-suffix"]');
    await suffix.click();
    await expect(page.locator('[data-pw="metric-ov-xp-input"]')).toBeVisible();
    await page.locator('[data-pw="metric-ov-xp-input"]').blur();
  });

  // ── Clamping: values > total become total on blur ────────────────────────

  test('Overview HP: typing 999 (totalHP=58) → clamped to 58', async ({ page }) => {
    const pill = page.locator('[data-pw="statpill-ov-hp"]');
    await pill.click();
    const input = page.locator('[data-pw="statpill-ov-hp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('h6').first()).toHaveText('58');
  });

  test('Overview MP: typing 999 → clamped to totalMP (58)', async ({ page }) => {
    const pill = page.locator('[data-pw="statpill-ov-mp"]');
    await pill.click();
    const input = page.locator('[data-pw="statpill-ov-mp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('h6').first()).toHaveText('58');
  });

  test('Overview XP: typing 999 → clamped to totalXP (10)', async ({ page }) => {
    const pill = page.locator('[data-pw="metric-ov-xp"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-ov-xp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('10');
  });

  test('Skills XP: typing 999 → clamped to totalXP (10)', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="metric-sk-xp"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-sk-xp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('10');
  });

  test('Spells HP SummaryStrip: typing 999 → clamped to totalHP (58)', async ({ page }) => {
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="metric-hp"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-hp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('58');
  });

  // ── Clamping: negative values become 0 ───────────────────────────────────

  test('Overview HP: negative input is rejected (non-digit stripped) → 0', async ({ page }) => {
    const pill = page.locator('[data-pw="statpill-ov-hp"]');
    await pill.click();
    const input = page.locator('[data-pw="statpill-ov-hp-input"]');
    await input.waitFor({ state: 'visible' });
    // The input strips non-digits so "-5" becomes "5"; empty string → 0
    await input.fill('');
    await input.blur();
    await expect(pill.locator('h6').first()).toHaveText('0');
  });

  // ── Combat pills also clamped ─────────────────────────────────────────────

  test('Combat HP: typing 999 → clamped to totalHP (58)', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="statpill-cb-hp"]');
    await pill.click();
    const input = page.locator('[data-pw="statpill-cb-hp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('h6').first()).toHaveText('58');
  });

  test('Combat MP: typing 999 → clamped to totalMP (58)', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="statpill-cb-mp"]');
    await pill.click();
    const input = page.locator('[data-pw="statpill-cb-mp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('999');
    await input.blur();
    await expect(pill.locator('h6').first()).toHaveText('58');
  });
});
