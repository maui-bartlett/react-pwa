import { devices, expect, test } from '@playwright/test';

import { readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('HP/MP/FP/IP cross-tab sync (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('editing HP in Spells tab shows on Overview AttributesStatsCard', async ({ page }) => {
    await page.getByRole('button', { name: 'Spells' }).first().click();

    await page.locator('[data-pw="metric-hp"]').click();
    await page.locator('[data-pw="metric-hp-input"]').fill('40');
    await page.locator('[data-pw="metric-hp-input"]').blur();

    await page.locator('[data-pw="app-footer"]').getByText('Character').click();

    // Overview AttributesStatsCard HP pill should show 40
    const hpPill = page.locator('text=HP').first().locator('..').locator('..');
    await expect(hpPill).toContainText('40');
  });

  test('editing MP in Combat tab shows on Spells SummaryStrip', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();

    // Click the MP pill in the Attributes & Stats middleRow (contains "MP" label, inline layout)
    const mpPills = page.locator('text=MP');
    // The stat pill in the middleRow — click the one in the Attributes card
    const mpPill = mpPills.first().locator('..').locator('..');
    await mpPill.click();
    // type new value
    const input = page.locator('input[inputmode="numeric"]').first();
    await input.fill('22');
    await input.blur();

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
