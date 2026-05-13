import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('StatusEffectsDiagram — bracket connectors (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
    // Status Effects is in the Combat tab
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('all four pills are visible', async ({ page }) => {
    await expect(page.getByText('Slow')).toBeVisible();
    await expect(page.getByText('Dazed')).toBeVisible();
    await expect(page.getByText('Enraged')).toBeVisible();
    await expect(page.getByText('Weak')).toBeVisible();
    await expect(page.getByText('Shaken')).toBeVisible();
    await expect(page.getByText('Poisoned')).toBeVisible();
  });

  test('left-drop connector exists below Slow pill and above the horizontal', async ({ page }) => {
    // The left vertical drop is tagged with data-pw="left-drop"
    const leftDrops = page.locator('[data-pw="left-drop"]');
    await expect(leftDrops.first()).toBeVisible();

    const slowBB   = await page.getByText('Slow').boundingBox();
    const dropBB   = await leftDrops.first().boundingBox();

    // Drop must start at or after the bottom of the Slow pill
    expect(dropBB!.y).toBeGreaterThanOrEqual(slowBB!.y + slowBB!.height - 2); // -2px tolerance for borders
    // Drop must have meaningful height (≥ 8px)
    expect(dropBB!.height).toBeGreaterThanOrEqual(8);
    // Drop must be horizontally centered near the Slow pill's center
    const slowCenter = slowBB!.x + slowBB!.width / 2;
    const dropCenter = dropBB!.x + dropBB!.width / 2;
    expect(Math.abs(slowCenter - dropCenter)).toBeLessThan(4);

    console.log('Slow pill bottom:', slowBB!.y + slowBB!.height);
    console.log('Left drop top:   ', dropBB!.y, ' height:', dropBB!.height);
  });

  test('right-drop connector exists below Dazed pill and above the horizontal', async ({ page }) => {
    const rightDrops = page.locator('[data-pw="right-drop"]');
    await expect(rightDrops.first()).toBeVisible();

    const dazedBB = await page.getByText('Dazed').boundingBox();
    const dropBB  = await rightDrops.first().boundingBox();

    expect(dropBB!.y).toBeGreaterThanOrEqual(dazedBB!.y + dazedBB!.height - 2);
    expect(dropBB!.height).toBeGreaterThanOrEqual(8);
    const dazedCenter = dazedBB!.x + dazedBB!.width / 2;
    const dropCenter  = dropBB!.x + dropBB!.width / 2;
    expect(Math.abs(dazedCenter - dropCenter)).toBeLessThan(4);

    console.log('Dazed pill bottom:', dazedBB!.y + dazedBB!.height);
    console.log('Right drop top:   ', dropBB!.y, ' height:', dropBB!.height);
  });

  test('second group also has both vertical drops (Weak / Shaken → Poisoned)', async ({ page }) => {
    const allLeftDrops  = page.locator('[data-pw="left-drop"]');
    const allRightDrops = page.locator('[data-pw="right-drop"]');
    await expect(allLeftDrops).toHaveCount(2);
    await expect(allRightDrops).toHaveCount(2);

    const weakBB   = await page.getByText('Weak').boundingBox();
    const shakenBB = await page.getByText('Shaken').boundingBox();
    const drop2LBB = await allLeftDrops.nth(1).boundingBox();
    const drop2RBB = await allRightDrops.nth(1).boundingBox();

    expect(drop2LBB!.y).toBeGreaterThanOrEqual(weakBB!.y + weakBB!.height - 2);
    expect(drop2RBB!.y).toBeGreaterThanOrEqual(shakenBB!.y + shakenBB!.height - 2);

    console.log('Weak pill bottom:   ', weakBB!.y + weakBB!.height, ' | drop2L top:', drop2LBB!.y);
    console.log('Shaken pill bottom: ', shakenBB!.y + shakenBB!.height, ' | drop2R top:', drop2RBB!.y);
  });
});
