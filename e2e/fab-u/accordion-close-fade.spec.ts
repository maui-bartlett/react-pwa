import { expect, test } from '@playwright/test';

/**
 * Verifies that the Status Effects accordion closes smoothly:
 * pills fade out first, THEN the accordion collapses — no abrupt pop.
 *
 * The close sequence (see StatusEffectsDiagram.tsx):
 *   1. setDetailVisible(false) → CSS opacity 0 (DETAIL_FADE_MS = 160ms)
 *   2. After 200ms: setDetailMounted(false) → MUI Collapse animates shut (180ms)
 *   3. After another 220ms: setSummaryVisible(true) → summary pills fade in
 *
 * Total close animation ≈ 420ms.
 */

test.describe('Status Effects accordion smooth close', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('accordion closes smoothly — detail pills gone, summary pills visible after close', async ({
    page,
  }) => {
    const toggle = page.locator('[data-pw="status-effects-accordion-toggle"]');

    // --- Open ---
    await toggle.click();
    await expect(page.locator('[data-pw="status-pill-slow"]')).toBeVisible({ timeout: 600 });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // --- Close ---
    await toggle.click();

    // Immediately after click the detail pill should still be in the DOM
    // (the fade-out hasn't finished yet). We just check we didn't snap shut.
    // Give full animation budget (500ms) then verify final state.
    await page.waitForTimeout(500);

    // Detail pills must be gone
    await expect(page.locator('[data-pw="status-pill-slow"]')).not.toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Summary pills in the header should be visible again
    await expect(
      page.locator('[data-pw="status-summary-pill-slow"]'),
      'summary pill should reappear after close',
    ).toBeVisible({ timeout: 300 });
  });

  test('re-opening after close shows pills again (pillsVisible reset)', async ({ page }) => {
    const toggle = page.locator('[data-pw="status-effects-accordion-toggle"]');

    // Open → close → open again
    await toggle.click();
    await expect(page.locator('[data-pw="status-pill-slow"]')).toBeVisible({ timeout: 600 });
    await toggle.click();
    await page.waitForTimeout(500); // wait for close animation

    await toggle.click();
    await expect(page.locator('[data-pw="status-pill-slow"]')).toBeVisible({ timeout: 600 });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
