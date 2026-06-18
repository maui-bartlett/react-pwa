import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('HP/MP management modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('clicking the HP pill opens the HP management modal', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-hp"]').click();
    await expect(page.locator('[data-pw="hp-management-modal"]')).toBeVisible();
    await expect(page.locator('[data-pw="hp-management-add"]')).toBeVisible();
    await expect(page.locator('[data-pw="hp-management-subtract"]')).toBeVisible();
    await page.locator('[data-pw="hp-management-close"]').click();
    await expect(page.locator('[data-pw="hp-management-modal"]')).toBeHidden();
  });

  test('HP management uses a compact aligned non-modal popper', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-hp"]').click();
    const popper = page.locator('[data-pw="hp-management-modal"]');
    await expect(popper).toBeVisible();
    await expect(page.locator('[data-pw="mobile-screen"]')).not.toHaveAttribute(
      'aria-hidden',
      'true',
    );

    const modifier = await page.locator('[data-pw="hp-management-modifier-control"]').boundingBox();
    const heal = await page.locator('[data-pw="hp-management-add"]').boundingBox();
    const amount = await page.locator('[data-pw="hp-management-amount-control"]').boundingBox();
    const damage = await page.locator('[data-pw="hp-management-subtract"]').boundingBox();
    const wheel = await page.locator('[data-pw="hp-management-number-wheel"]').boundingBox();
    const paper = await popper.boundingBox();
    if (!modifier || !heal || !amount || !damage || !wheel || !paper) {
      throw new Error('HP management controls are not visible');
    }

    expect(Math.abs(wheel.y - modifier.y)).toBeLessThan(1);
    const gaps = [
      heal.y - (modifier.y + modifier.height),
      amount.y - (heal.y + heal.height),
      damage.y - (amount.y + amount.height),
    ];
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(1);
    expect(
      paper.y + paper.height - Math.max(wheel.y + wheel.height, damage.y + damage.height),
    ).toBeLessThan(16);

    await page.mouse.click(12, 12);
    await expect(popper).toBeHidden();
  });

  test('clicking the MP pill opens the MP management modal', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-mp"]').click();
    await expect(page.locator('[data-pw="mp-management-modal"]')).toBeVisible();
    await page.locator('[data-pw="mp-management-close"]').click();
    await expect(page.locator('[data-pw="mp-management-modal"]')).toBeHidden();
  });

  test('damage reduces current HP by the entered amount', async ({ page }) => {
    const hpValue = page.locator('[data-pw="statpill-ov-hp"]').locator('h6').first();
    await expect(hpValue).toHaveText('58'); // seeded at full HP; wait for hydration
    const before = 58;

    await page.locator('[data-pw="statpill-ov-hp"]').click();
    await expect(page.locator('[data-pw="hp-management-modal"]')).toBeVisible();
    const amount = page.locator('[data-pw="hp-management-amount-input"]');
    await amount.fill('3');
    await expect(amount).toHaveValue('3');
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await page.locator('[data-pw="hp-management-close"]').click();

    await expect(hpValue).toHaveText(String(Math.max(0, before - 3)));
  });

  test('repeated damage clamps HP to 0 (never negative)', async ({ page }) => {
    const hpValue = page.locator('[data-pw="statpill-ov-hp"]').locator('h6').first();
    await expect(hpValue).toHaveText('58'); // seeded at full HP; wait for hydration
    const max = 58;

    await page.locator('[data-pw="statpill-ov-hp"]').click();
    const amount = page.locator('[data-pw="hp-management-amount-input"]');
    await amount.fill('40');
    await expect(amount).toHaveValue('40');
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await expect(hpValue).toHaveText(String(Math.max(0, max - 40)));
    // Damaging past 0 clamps rather than going negative.
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await expect(hpValue).toHaveText('0');
  });

  test('healing past max clamps HP to its maximum', async ({ page }) => {
    const hpValue = page.locator('[data-pw="statpill-ov-hp"]').locator('h6').first();
    await expect(hpValue).toHaveText('58'); // seeded at full HP; wait for hydration
    const max = 58;

    await page.locator('[data-pw="statpill-ov-hp"]').click();
    const amount = page.locator('[data-pw="hp-management-amount-input"]');
    // Drop below max, then heal more than the deficit — current clamps to max.
    await amount.fill('20');
    await expect(amount).toHaveValue('20');
    await page.locator('[data-pw="hp-management-subtract"]').click();
    await expect(hpValue).toHaveText(String(Math.max(0, max - 20)));

    await amount.fill('40');
    await expect(amount).toHaveValue('40');
    await page.locator('[data-pw="hp-management-add"]').click();
    await expect(hpValue).toHaveText(String(max));
  });
});
