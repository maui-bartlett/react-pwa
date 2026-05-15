import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

const HEIGHT_TOLERANCE = 1; // px

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function navigateTo(page: any, tab: string) {
  await page.getByRole('button', { name: tab }).first().click();
  await page.waitForLoadState('networkidle');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function headerHeight(page: any) {
  return (await page.locator('[data-pw="header-bar"]').first().boundingBox())!.height;
}

test.describe('HeaderBar — consistency across tabs (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.waitForLoadState('networkidle');
  });

  test('Combat header height matches Skills header height (same content length)', async ({
    page,
  }) => {
    // Skills and Combat have similar title lengths; height should be identical
    // once Combat is no longer using the compact variant.
    await navigateTo(page, 'Skills');
    const skillsHeight = await headerHeight(page);

    await navigateTo(page, 'Combat');
    const combatHeight = await headerHeight(page);

    console.log('Skills height:', skillsHeight, '| Combat height:', combatHeight);
    expect(Math.abs(combatHeight - skillsHeight)).toBeLessThanOrEqual(HEIGHT_TOLERANCE);
  });

  test('Combat header shows "Combat" as heading text', async ({ page }) => {
    await navigateTo(page, 'Combat');
    await expect(page.locator('[data-pw="header-bar"] [data-pw="header-title"]')).toHaveText(
      'Combat',
    );
  });

  test('Combat heading font-size matches all other tab heading font-sizes', async ({ page }) => {
    const tabFontSizes: Record<string, string> = {};

    for (const tab of ['Overview', 'Combat', 'Skills', 'Spells', 'Gear', 'Notes']) {
      await navigateTo(page, tab);
      tabFontSizes[tab] = await page
        .locator('[data-pw="header-bar"] [data-pw="header-title"]')
        .first()
        .evaluate((el: HTMLElement) => getComputedStyle(el).fontSize);
    }

    console.log('Font sizes:', tabFontSizes);
    const sizes = Object.values(tabFontSizes);
    expect(new Set(sizes).size).toBe(1); // all identical
  });

  test('Combat header pill reads "Combat"', async ({ page }) => {
    await navigateTo(page, 'Combat');
    await expect(page.locator('[data-pw="header-bar"] [data-pw="header-action"]')).toHaveText(
      'Combat',
    );
  });

  test('Combat heading text is not uppercased (matches hero variant)', async ({ page }) => {
    await navigateTo(page, 'Combat');
    const textTransform = await page
      .locator('[data-pw="header-bar"] [data-pw="header-title"]')
      .first()
      .evaluate((el: HTMLElement) => getComputedStyle(el).textTransform);
    // compact variant forces uppercase; hero variant uses 'none'
    expect(textTransform).toBe('none');
  });
});
