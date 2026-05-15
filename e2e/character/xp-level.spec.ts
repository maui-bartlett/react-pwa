import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('XP and Level editing (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ── XP ──────────────────────────────────────────────────────────────────

  test('Overview XP: tap left value → editable, type 1500 → display reads 1500 / 10', async ({
    page,
  }) => {
    const pill = page.locator('[data-pw="metric-ov-xp"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-ov-xp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('1500');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('1500');
    const suffix = page.locator('[data-pw="metric-ov-xp-suffix"]');
    await expect(suffix).toHaveText('/ 10');
  });

  test('Overview XP: persists after reload', async ({ page }) => {
    const pill = page.locator('[data-pw="metric-ov-xp"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-ov-xp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('5');
    await input.blur();
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-pw="metric-ov-xp"]').locator('p').first()).toHaveText('5');
  });

  test('Skills XP: tap → editable, edit to 3 → display reads 3 / 10', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="metric-sk-xp"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-sk-xp-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('3');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('3');
  });

  // ── Level ────────────────────────────────────────────────────────────────

  test('Overview Level SummaryStrip: tap → editable, edit to 14 → displays 14', async ({
    page,
  }) => {
    const pill = page.locator('[data-pw="metric-ov-level"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-ov-level-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('14');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('14');
  });

  test('Skills LVL: tap → editable, edit to 14 → displays 14', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="metric-sk-level"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-sk-level-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('14');
    await input.blur();
    await expect(pill.locator('p').first()).toHaveText('14');
  });

  test('Editing level on Skills tab updates non-Overview header eyebrow', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="metric-sk-level"]');
    await pill.click();
    const input = page.locator('[data-pw="metric-sk-level-input"]');
    await input.waitFor({ state: 'visible' });
    await input.fill('14');
    await input.blur();
    await expect(page.locator('[data-pw="header-eyebrow"]')).toHaveText(/LVL 14/i);
  });

  test('Non-Overview header eyebrow is display-only (tap does NOT enter edit mode)', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
    const eyebrow = page.locator('[data-pw="header-eyebrow"]');
    await eyebrow.click();
    // No input should appear after clicking the eyebrow
    await expect(page.locator('input[data-pw*="level"]')).not.toBeVisible();
  });

  // ── LV → LVL visual rename ───────────────────────────────────────────────

  test('Overview header shows LVL (not LV) in the right pill', async ({ page }) => {
    await expect(page.locator('[data-pw="header-action"]')).toHaveText(/LVL/);
  });

  test('Skills SummaryStrip label shows LVL', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
    // The label text inside the metric-sk-level pill
    await expect(page.locator('[data-pw="metric-sk-level"]')).toContainText('LVL');
  });

  test('Non-Overview header eyebrow reads LVL (not LV)', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-pw="header-eyebrow"]')).toHaveText(/LVL/);
    await expect(page.locator('[data-pw="header-eyebrow"]')).not.toHaveText(/\bLV\b/);
  });

  test('Overview Classes list shows LVL (e.g. LVL 10)', async ({ page }) => {
    // The classes list trailing labels should say LVL, not LV
    const classesCard = page.locator('text=LVL 10');
    await expect(classesCard).toBeVisible();
  });
});
