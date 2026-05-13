import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

const PILLS = ['slow', 'dazed', 'enraged', 'weak', 'shaken', 'poisoned'] as const;
const RESTING_BG = 'rgb(255, 255, 255)';
const TOLERANCE = 1; // px — for bracket geometry checks

test.describe('StatusEffects — toggleable pills (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-status-effects'));
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
  });

  test('initial state: all pills have white resting background', async ({ page }) => {
    for (const id of PILLS) {
      await expect(
        page.locator(`[data-pw="status-pill-${id}"]`),
        `${id} should be resting`,
      ).toHaveCSS('background-color', RESTING_BG);
    }
  });

  test('clicking a pill fills it with a tinted background', async ({ page }) => {
    const pill = page.locator('[data-pw="status-pill-slow"]');
    await pill.click();
    // toHaveCSS retries until the transition settles (default 5s timeout)
    await expect(pill).not.toHaveCSS('background-color', RESTING_BG);

    // Verify the settled tint is darker than white
    const bg = await pill.evaluate((el) => getComputedStyle(el).backgroundColor);
    const avgRgb = (s: string) => {
      const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      return m ? (parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3])) / 3 : 255;
    };
    expect(avgRgb(bg)).toBeLessThan(255);
  });

  test('clicking a selected pill returns it to resting', async ({ page }) => {
    const pill = page.locator('[data-pw="status-pill-slow"]');
    await pill.click();
    await expect(pill).not.toHaveCSS('background-color', RESTING_BG); // wait for selected
    await pill.click();
    await expect(pill).toHaveCSS('background-color', RESTING_BG); // wait for deselected
  });

  test('each pill toggles independently', async ({ page }) => {
    await page.locator('[data-pw="status-pill-slow"]').click();
    await page.locator('[data-pw="status-pill-weak"]').click();

    await expect(page.locator('[data-pw="status-pill-slow"]')).not.toHaveCSS(
      'background-color',
      RESTING_BG,
    );
    await expect(page.locator('[data-pw="status-pill-weak"]')).not.toHaveCSS(
      'background-color',
      RESTING_BG,
    );
    await expect(page.locator('[data-pw="status-pill-dazed"]')).toHaveCSS(
      'background-color',
      RESTING_BG,
    );
  });

  test('selection persists across page reload', async ({ page }) => {
    await page.locator('[data-pw="status-pill-slow"]').click();
    await expect(page.locator('[data-pw="status-pill-slow"]')).not.toHaveCSS(
      'background-color',
      RESTING_BG,
    );
    await page.locator('[data-pw="status-pill-shaken"]').click();
    await expect(page.locator('[data-pw="status-pill-shaken"]')).not.toHaveCSS(
      'background-color',
      RESTING_BG,
    );

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-pw="status-pill-slow"]')).not.toHaveCSS(
      'background-color',
      RESTING_BG,
    );
    await expect(page.locator('[data-pw="status-pill-shaken"]')).not.toHaveCSS(
      'background-color',
      RESTING_BG,
    );
    await expect(page.locator('[data-pw="status-pill-dazed"]')).toHaveCSS(
      'background-color',
      RESTING_BG,
    );
  });

  test('connector drops remain flush with pill borders after toggling', async ({ page }) => {
    await page.locator('[data-pw="status-pill-slow"]').click();
    await expect(page.locator('[data-pw="status-pill-slow"]')).not.toHaveCSS(
      'background-color',
      RESTING_BG,
    );
    await page.locator('[data-pw="status-pill-enraged"]').click();

    const pillBB = await page.getByText('Slow').locator('..').boundingBox();
    const dropBB = await page.locator('[data-pw="left-drop"]').first().boundingBox();

    const pillBottom = pillBB!.y + pillBB!.height;
    const dropTop = dropBB!.y;

    console.log(
      'Slow pill bottom =',
      pillBottom,
      '| left-drop top =',
      dropTop,
      '| gap =',
      dropTop - pillBottom,
    );
    expect(Math.abs(dropTop - pillBottom)).toBeLessThanOrEqual(TOLERANCE);
  });
});
