import { type Page, devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Bond swipe-to-delete (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  async function swipeLeft(page: Page, locator: ReturnType<Page['locator']>, distancePx = 130) {
    const box = await locator.boundingBox();
    if (!box) throw new Error(`No bounding box for locator`);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - distancePx, cy, { steps: 12 });
    await page.mouse.up();
  }

  // ── Threshold removes bond ────────────────────────────────────────────────

  test('Swipe left past threshold removes bond row and updates storage', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-jelena"]');
    await expect(row).toBeVisible();

    await swipeLeft(page, row);

    // Row removed from DOM after collapse animation
    await expect(row).toHaveCount(0, { timeout: 1500 });

    const stored = await page.evaluate(() => localStorage.getItem('fab-u-character'));
    expect(stored).not.toContain('Jelena');
  });

  // ── Sub-threshold springs back ────────────────────────────────────────────

  test('Swipe left below threshold springs row back, bond stays', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-jelena"]');
    // Drag only 50px (below 100px threshold)
    await swipeLeft(page, row, 50);

    // Row should remain visible
    await expect(row).toBeVisible();
    await expect(page.locator('text=Jelena').first()).toBeVisible();
  });

  // ── Child control tap doesn't delete ─────────────────────────────────────

  test('Tapping + button opens menu without removing bond', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-jelena"]');
    await expect(row).toBeVisible();

    // Simple click on the + button
    await page.locator('[data-pw="bond-add-jelena"]').click();

    // Menu should open
    await expect(page.locator('[role="menu"]')).toBeVisible();
    await page.keyboard.press('Escape');

    // Row still present
    await expect(row).toBeVisible();
    await expect(row).toHaveCount(1);
  });

  // ── Desktop × button removes bond ────────────────────────────────────────

  test('Click × button removes bond row', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-yoru"]');
    await expect(row).toBeVisible();

    // The × button is opacity:0 normally; force-click it
    await page.locator('[data-pw="bond-delete-yoru"]').click({ force: true });

    await expect(row).toHaveCount(0, { timeout: 1500 });

    const stored = await page.evaluate(() => localStorage.getItem('fab-u-character'));
    expect(stored).not.toContain('Yoru');
  });

  // ── Cross-card sync ───────────────────────────────────────────────────────

  test('Remove on Overview → bond gone from Combat > Bonds subtab', async ({ page }) => {
    await swipeLeft(page, page.locator('[data-pw="bond-row-granada"]'));
    await expect(page.locator('[data-pw="bond-row-granada"]')).toHaveCount(0, { timeout: 1500 });

    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-pw="bond-row-granada"]')).toHaveCount(0);
    await expect(page.locator('text=Granada')).toHaveCount(0);
  });

  // ── Persistence after reload ──────────────────────────────────────────────

  test('Removed bond does not reappear after reload', async ({ page }) => {
    await swipeLeft(page, page.locator('[data-pw="bond-row-juice"]'));
    await expect(page.locator('[data-pw="bond-row-juice"]')).toHaveCount(0, { timeout: 1500 });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-pw="bond-row-juice"]')).toHaveCount(0);
    await expect(page.locator('text=Juice')).toHaveCount(0);
  });
});
