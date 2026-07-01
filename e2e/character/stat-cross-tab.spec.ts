import { devices, expect, test } from '@playwright/test';

import { readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('HP/MP/FP/IP cross-tab sync (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('adjusting HP in Spells tab shows on Overview AttributesStatsCard', async ({ page }) => {
    await page.getByRole('button', { name: 'Spells' }).first().click();

    // 58 - 18 = 40 via the HP management modal.
    await page.locator('[data-pw="metric-hp"]').click();
    const hpAmount = page.locator('[data-pw="hp-management-amount-input"]');
    await hpAmount.fill('18');
    await expect(hpAmount).toHaveValue('18');
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await page.locator('[data-pw="hp-management-close"]').click();

    await page.locator('[data-pw="app-footer"]').getByText('Character').click();

    await expect(page.locator('[data-pw="statpill-ov-hp"]')).toContainText('40');
  });

  test('adjusting MP in Combat tab shows on Spells SummaryStrip', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();

    // 58 - 36 = 22 via the MP management modal.
    await page.locator('[data-pw="statpill-cb-mp"]').click();
    const mpAmount = page.locator('[data-pw="mp-management-amount-input"]');
    await mpAmount.fill('36');
    await expect(mpAmount).toHaveValue('36');
    await page.locator('[data-pw="mp-management-subtract"]').click();
    await page.locator('[data-pw="mp-management-close"]').click();

    await page.locator('[data-pw="app-footer"]').getByText('Spells').click();

    await expect(page.locator('[data-pw="metric-mp"]')).toContainText('22');
  });

  test('editing FP in Skills tab reflects in Combat AttributesStatsCard', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();

    await page.locator('[data-pw="metric-fp"]').click();
    await page.locator('[data-pw="metric-fp-input"]').fill('9');
    await page.locator('[data-pw="metric-fp-input"]').blur();

    await page.getByRole('button', { name: 'Combat' }).first().click();

    await expect.poll(async () => (await readActiveFabUCharacter(page)).fabulaPoints).toBe(9);
  });

  test('editing IP in Gear tab reflects in IndexedDB', async ({ page }) => {
    await page.getByRole('button', { name: 'Gear' }).first().click();

    await page.locator('[data-pw="metric-ip"]').click();
    await page.locator('[data-pw="metric-ip-input"]').fill('12');
    await page.locator('[data-pw="metric-ip-input"]').blur();

    await expect.poll(async () => (await readActiveFabUCharacter(page)).inventoryPoints).toBe(12);
  });
});
