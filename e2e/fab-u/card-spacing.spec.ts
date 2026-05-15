import { expect, test } from '@playwright/test';

/**
 * Verifies that all labeled SurfaceCards share the same header-pill→content
 * vertical gap (canonical: 3.4 MUI spacing units = 27.2px).
 */
test.describe('Card heading→content spacing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => {
      localStorage.removeItem('fab-u-character');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('all labeled SurfaceCards have consistent paddingTop (≈27px)', async ({ page }) => {
    // Collect paddingTop of every element that is a SurfaceCard Paper root.
    // SurfaceCard renders a <Paper data-pw="section-label"> sibling — we find
    // section-label elements and walk up to their grandparent Paper.
    const paddings = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('[data-pw="section-label"]'));
      return labels.map((label) => {
        // label → wrapper Box → Paper (SurfaceCard root)
        const card = label.parentElement?.parentElement as HTMLElement | null;
        if (!card) return null;
        return parseFloat(getComputedStyle(card).paddingTop);
      }).filter((v): v is number => v !== null);
    });

    expect(paddings.length, 'should find labeled SurfaceCards').toBeGreaterThan(0);

    const first = paddings[0];
    for (const pt of paddings) {
      // Allow ±2px tolerance for sub-pixel rounding
      expect(
        Math.abs(pt - first),
        `all labeled cards should share the same paddingTop (${first}px), got ${pt}px`,
      ).toBeLessThanOrEqual(2);
    }

    // The canonical value is 3.4 * 8 = 27.2px
    expect(first, 'paddingTop should be ≈27px (3.4 × 8)').toBeGreaterThan(24);
    expect(first, 'paddingTop should be ≈27px (3.4 × 8)').toBeLessThan(30);
  });
});
