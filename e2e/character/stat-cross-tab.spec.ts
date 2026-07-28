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

    const startingHp = Number.parseInt(
      (await page.locator('[data-pw="metric-hp"]').locator('p').first().textContent()) ?? '0',
      10,
    );
    const damage = 18;
    await page.locator('[data-pw="metric-hp"]').click();
    const hpAmount = page.locator('[data-pw="hp-management-amount-input"]');
    await hpAmount.fill(String(damage));
    await expect(hpAmount).toHaveValue(String(damage));
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await page.locator('[data-pw="hp-management-close"]').click();

    await page.locator('[data-pw="app-footer"]').getByText('Character').click();

    await expect(page.locator('[data-pw="statpill-ov-hp"]')).toContainText(
      String(Math.max(0, startingHp - damage)),
    );
  });

  test('adjusting MP in Combat tab shows on Spells SummaryStrip', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();

    const startingMp = Number.parseInt(
      (await page.locator('[data-pw="statpill-cb-mp"]').locator('p').first().textContent()) ?? '0',
      10,
    );
    const mpSpend = 36;
    await page.locator('[data-pw="statpill-cb-mp"]').click();
    const mpAmount = page.locator('[data-pw="mp-management-amount-input"]');
    await mpAmount.fill(String(mpSpend));
    await expect(mpAmount).toHaveValue(String(mpSpend));
    await page.locator('[data-pw="mp-management-subtract"]').click();
    await page.locator('[data-pw="mp-management-close"]').click();

    await page.locator('[data-pw="app-footer"]').getByText('Spells').click();

    await expect(page.locator('[data-pw="metric-mp"]')).toContainText(
      String(Math.max(0, startingMp - mpSpend)),
    );
  });

  test('editing FP in Skills tab reflects in Combat AttributesStatsCard', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();

    await page.locator('[data-pw="metric-fp"]').click();
    await page.locator('[data-pw="metric-fp-input"]').fill('9');
    await page.locator('[data-pw="metric-fp-input"]').blur();

    await page.getByRole('button', { name: 'Combat' }).first().click();

    await expect.poll(async () => (await readActiveFabUCharacter(page)).fabulaPoints).toBe(9);
  });

  test('managing IP in Gear tab reflects in IndexedDB', async ({ page }) => {
    await page.getByRole('button', { name: 'Gear' }).first().click();

    await page.locator('[data-pw="metric-ip"]').click();
    await page.locator('[data-pw="ip-management-current-input"]').fill('5');
    await page.locator('[data-pw="ip-management-current-input"]').blur();
    await page.locator('[data-pw="ip-management-close"]').click();

    await expect.poll(async () => (await readActiveFabUCharacter(page)).inventoryPoints).toBe(5);
  });
});
