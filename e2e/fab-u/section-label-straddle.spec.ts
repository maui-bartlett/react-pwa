import { expect, test } from '@playwright/test';

/**
 * Verifies that section-label pills straddle the SurfaceCard top border
 * (pill vertical center ≈ card border top y) and that the inter-card
 * gap increased by the same amount the label shifted up.
 *
 * Label shift: top:5→0 moves center from 6px to 1px inside the outer
 * card border = 5px upward. New Stack spacing 2.775 (22.2px) vs old
 * 2.15 (17.2px) = +5px.
 */

test.describe('Section label straddle + inter-card spacing', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('label pill vertical center aligns with card top border (within 2px)', async ({ page }) => {
    // Use the first visible SurfaceCard that has a section label
    const card = page.locator('[data-pw="mobile-screen"] .MuiPaper-root').first();
    const label = card.locator('[data-pw="section-label"]').first();

    await expect(label).toBeVisible();

    const cardBox = await card.boundingBox();
    const labelBox = await label.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(labelBox).not.toBeNull();

    // Card top border is at cardBox.y (outer top edge of the Paper)
    const cardBorderY = cardBox!.y;
    // Label pill center
    const labelCenterY = labelBox!.y + labelBox!.height / 2;

    expect(
      Math.abs(labelCenterY - cardBorderY),
      `Label center (${labelCenterY.toFixed(1)}) should be within 2px of card border (${cardBorderY.toFixed(1)})`,
    ).toBeLessThanOrEqual(2);
  });

  test('label pill straddles border — top half above, bottom half inside', async ({ page }) => {
    const card = page.locator('[data-pw="mobile-screen"] .MuiPaper-root').first();
    const label = card.locator('[data-pw="section-label"]').first();

    await expect(label).toBeVisible();

    const cardBox = await card.boundingBox();
    const labelBox = await label.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(labelBox).not.toBeNull();

    const cardBorderY = cardBox!.y;
    const labelTop = labelBox!.y;
    const labelBottom = labelBox!.y + labelBox!.height;

    // Top of pill should be above or at the card border
    expect(labelTop, 'Label top should be above card border').toBeLessThanOrEqual(cardBorderY + 1);
    // Bottom of pill should be inside the card
    expect(labelBottom, 'Label bottom should be inside card').toBeGreaterThan(cardBorderY);
  });

  test('inter-card gap is at least 20px (≥ old 17.2px + shift)', async ({ page }) => {
    // Measure gap between the first two cards in the content stack
    const cards = page.locator('[data-pw="content-area"] .MuiPaper-root');
    const count = await cards.count();
    if (count < 2) return; // skip if only one card visible

    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();

    const gap = secondBox!.y - (firstBox!.y + firstBox!.height);
    expect(
      gap,
      `Gap between card 0 and card 1 (${gap.toFixed(1)}px) should be ≥ 20px`,
    ).toBeGreaterThanOrEqual(20);
  });
});
