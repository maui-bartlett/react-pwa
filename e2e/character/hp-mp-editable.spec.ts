import { devices, expect, test } from '@playwright/test';

import { readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

// HP / MP are adjusted through the HP/MP management modal (see
// hp-mp-management.spec.ts). The Spells-tab summary pills open that same modal.
test.describe('HP / MP pills — Spells tab (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    await page.getByRole('button', { name: 'Spells' }).first().click();
  });

  test('HP pill shows currentHP with / totalHP suffix', async ({ page }) => {
    const hp = page.locator('[data-pw="metric-hp"]');
    await expect(hp).toContainText('58');
    await expect(page.locator('[data-pw="metric-hp-suffix"]')).toContainText('/ 58');
  });

  test('MP pill shows currentMP with / totalMP suffix', async ({ page }) => {
    const mp = page.locator('[data-pw="metric-mp"]');
    await expect(mp).toContainText('58');
    await expect(page.locator('[data-pw="metric-mp-suffix"]')).toContainText('/ 58');
  });

  test('HP pill opens the HP management modal and damage reduces HP', async ({ page }) => {
    await page.locator('[data-pw="metric-hp"]').click();
    await expect(page.locator('[data-pw="hp-management-modal"]')).toBeVisible();

    const amount = page.locator('[data-pw="hp-management-amount-input"]');
    await amount.fill('10');
    await expect(amount).toHaveValue('10');
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await page.locator('[data-pw="hp-management-close"]').click();

    await expect(page.locator('[data-pw="metric-hp"]')).toContainText('48');
  });

  test('MP pill opens the MP management modal and spend reduces MP', async ({ page }) => {
    await page.locator('[data-pw="metric-mp"]').click();
    await expect(page.locator('[data-pw="mp-management-modal"]')).toBeVisible();

    const amount = page.locator('[data-pw="mp-management-amount-input"]');
    await amount.fill('8');
    await expect(amount).toHaveValue('8');
    await page.locator('[data-pw="mp-management-subtract"]').click();
    await page.locator('[data-pw="mp-management-close"]').click();

    await expect(page.locator('[data-pw="metric-mp"]')).toContainText('50');
  });

  test('HP and MP changes persist across page reload', async ({ page }) => {
    await page.locator('[data-pw="metric-hp"]').click();
    const hpAmount = page.locator('[data-pw="hp-management-amount-input"]');
    await hpAmount.fill('25');
    await expect(hpAmount).toHaveValue('25');
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await page.locator('[data-pw="hp-management-close"]').click();

    await page.locator('[data-pw="metric-mp"]').click();
    const mpAmount = page.locator('[data-pw="mp-management-amount-input"]');
    await mpAmount.fill('41');
    await expect(mpAmount).toHaveValue('41');
    await page.locator('[data-pw="mp-management-subtract"]').click();
    await page.locator('[data-pw="mp-management-close"]').click();

    await expect
      .poll(async () => readActiveFabUCharacter(page))
      .toMatchObject({ currentHP: 33, currentMP: 17 });

    await page.reload();
    await page.getByRole('button', { name: 'Spells' }).first().click();

    await expect(page.locator('[data-pw="metric-hp"]')).toContainText('33');
    await expect(page.locator('[data-pw="metric-mp"]')).toContainText('17');
  });
});
