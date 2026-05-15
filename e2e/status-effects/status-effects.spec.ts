import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

const TOLERANCE = 1; // px — sub-pixel rendering tolerance

test.describe('StatusEffectsDiagram — bracket connectors geometry (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('all six pills are visible', async ({ page }) => {
    for (const label of ['Slow', 'Dazed', 'Enraged', 'Weak', 'Shaken', 'Poisoned']) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test('left-drop top is flush with Slow pill outer bottom edge (within 1px)', async ({ page }) => {
    const pillBB = await page.getByText('Slow').locator('..').boundingBox();
    const dropBB = await page.locator('[data-pw="left-drop"]').first().boundingBox();

    const pillBottom = pillBB!.y + pillBB!.height;
    const dropTop    = dropBB!.y;

    console.log('BEFORE: pill bottom =', pillBottom, '| drop top =', dropTop, '| gap =', dropTop - pillBottom);
    expect(Math.abs(dropTop - pillBottom)).toBeLessThanOrEqual(TOLERANCE);
  });

  test('right-drop top is flush with Dazed pill outer bottom edge (within 1px)', async ({ page }) => {
    const pillBB = await page.getByText('Dazed').locator('..').boundingBox();
    const dropBB = await page.locator('[data-pw="right-drop"]').first().boundingBox();

    const pillBottom = pillBB!.y + pillBB!.height;
    const dropTop    = dropBB!.y;

    console.log('Dazed pill bottom =', pillBottom, '| drop top =', dropTop, '| gap =', dropTop - pillBottom);
    expect(Math.abs(dropTop - pillBottom)).toBeLessThanOrEqual(TOLERANCE);
  });

  test('center stem bottom is flush with Enraged pill outer top edge (within 1px)', async ({
    page,
  }) => {
    // Center stem has no data-pw — locate it by position: it is the sibling Box
    // between the horizontal and the Enraged pill. Use the Enraged pill's top.
    const enragedBB = await page.getByText('Enraged').locator('..').boundingBox();
    const dropBB    = await page.locator('[data-pw="left-drop"]').first().boundingBox();

    // Reconstruct: stem bottom = container_top + H_TOP + STEM_H
    // We know container_top from drop top - PILL_H
    const containerTop = dropBB!.y - 36; // PILL_H = 36
    const stemBottom   = containerTop + 46 + 12; // H_TOP + STEM_H

    const enragedTop = enragedBB!.y;

    console.log('Stem bottom =', stemBottom, '| Enraged top =', enragedTop, '| gap =', enragedTop - stemBottom);
    expect(Math.abs(stemBottom - enragedTop)).toBeLessThanOrEqual(TOLERANCE);
  });

  test('drop height is 10px', async ({ page }) => {
    const dropBB = await page.locator('[data-pw="left-drop"]').first().boundingBox();
    expect(dropBB!.height).toBe(10);
  });

  test('second group (Weak/Shaken → Poisoned) has same geometry', async ({ page }) => {
    const weakBB    = await page.getByText('Weak').locator('..').boundingBox();
    const shakenBB  = await page.getByText('Shaken').locator('..').boundingBox();
    const drop2L    = await page.locator('[data-pw="left-drop"]').nth(1).boundingBox();
    const drop2R    = await page.locator('[data-pw="right-drop"]').nth(1).boundingBox();

    expect(Math.abs(drop2L!.y - (weakBB!.y + weakBB!.height))).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(drop2R!.y - (shakenBB!.y + shakenBB!.height))).toBeLessThanOrEqual(TOLERANCE);

    console.log('Weak bottom =', weakBB!.y + weakBB!.height, '| drop2L top =', drop2L!.y);
    console.log('Shaken bottom =', shakenBB!.y + shakenBB!.height, '| drop2R top =', drop2R!.y);
  });
});
