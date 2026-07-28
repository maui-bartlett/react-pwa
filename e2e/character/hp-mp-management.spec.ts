import { devices, expect, test } from '@playwright/test';

import {
  patchActiveFabUCharacter,
  readActiveFabUCharacter,
  seedFabUHpMpBaseline,
} from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

const LAYOUT_TOLERANCE = 2;

test.describe('HP/MP management modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    await seedFabUHpMpBaseline(page);
    await page.reload();
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

  test('HP management opens as a centered modal with faded backdrop', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-hp"]').click();
    const modal = page.locator('[data-pw="hp-management-modal"]');
    await expect(modal).toBeVisible();
    const backdrop = page.locator('.MuiDialog-root .MuiBackdrop-root');
    await expect(backdrop).toBeVisible();
    const backdropColor = await backdrop.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(backdropColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backdropColor).not.toBe('transparent');

    const modifierButton = await page
      .locator('[data-pw="hp-management-show-modifiers"]')
      .boundingBox();
    const pointsLabel = await page.locator('[data-pw="hp-management-points-label"]').boundingBox();
    const modifierLabel = await page
      .locator('[data-pw="hp-management-modifier-label"]')
      .boundingBox();
    const heal = await page.locator('[data-pw="hp-management-add"]').boundingBox();
    const amount = await page.locator('[data-pw="hp-management-amount-control"]').boundingBox();
    const damage = await page.locator('[data-pw="hp-management-subtract"]').boundingBox();
    const wheel = await page.locator('[data-pw="hp-management-number-wheel"]').boundingBox();
    const paper = await modal.boundingBox();
    if (
      !modifierButton ||
      !pointsLabel ||
      !modifierLabel ||
      !heal ||
      !amount ||
      !damage ||
      !wheel ||
      !paper
    ) {
      throw new Error('HP management controls are not visible');
    }

    expect(Math.abs(pointsLabel.y - modifierLabel.y)).toBeLessThanOrEqual(LAYOUT_TOLERANCE);
    expect(Math.abs(wheel.y - heal.y)).toBeLessThanOrEqual(LAYOUT_TOLERANCE);
    const gaps = [amount.y - (heal.y + heal.height), damage.y - (amount.y + amount.height)];
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(LAYOUT_TOLERANCE);
    expect(Math.abs(wheel.y + wheel.height - (damage.y + damage.height))).toBeLessThanOrEqual(
      LAYOUT_TOLERANCE,
    );
    expect(
      paper.y + paper.height - Math.max(wheel.y + wheel.height, damage.y + damage.height),
    ).toBeLessThan(16);
    const damageRadius = await page
      .locator('[data-pw="hp-management-subtract"]')
      .evaluate((element) => getComputedStyle(element).borderRadius);
    await expect(page.locator('[data-pw="hp-management-show-modifiers"]')).toHaveCSS(
      'border-radius',
      damageRadius,
    );
    await expect(page.locator('[data-pw="hp-management-amount-control"]')).toHaveCSS(
      'border-radius',
      damageRadius,
    );

    await backdrop.click({ position: { x: 8, y: 8 }, force: true });
    await expect(modal).toBeHidden();
  });

  test('modifier list shows sources and adds a custom max modifier', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-hp"]').click();
    await page.locator('[data-pw="hp-management-show-modifiers"]').click();

    await expect(page.locator('[data-pw="hp-management-modifier-list"]')).toBeVisible();
    await expect(page.locator('[data-pw="hp-management-modifier-source"]').first()).toContainText(
      'Custom Modifier',
    );
    await expect(page.locator('[data-pw="hp-management-modifier-total"]')).toContainText('+5');

    await page.locator('[data-pw="hp-management-add-custom-modifier"]').click();
    await page.locator('[data-pw="hp-management-custom-modifier-label"]').fill('Tough as Nails');
    await page.locator('[data-pw="hp-management-custom-modifier-value"]').fill('2');
    await page.locator('[data-pw="hp-management-confirm-custom-modifier"]').click();

    await expect(page.locator('[data-pw="hp-management-modifier-list"]')).toContainText(
      'Tough as Nails',
    );
    await expect(page.locator('[data-pw="hp-management-modifier-total"]')).toContainText('+7');
    await expect(page.locator('[data-pw="statpill-ov-hp"]')).toContainText('/ 60');
  });

  test('clicking the MP pill opens the MP management modal', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-mp"]').click();
    await expect(page.locator('[data-pw="mp-management-modal"]')).toBeVisible();
    await page.locator('[data-pw="mp-management-close"]').click();
    await expect(page.locator('[data-pw="mp-management-modal"]')).toBeHidden();
  });

  test('existing characters with IP above base max keep that IP', async ({ page }) => {
    await patchActiveFabUCharacter(page, {
      currentIP: 12,
      inventoryPoints: 12,
      maxIP: 6,
      ipBonus: 0,
      customResourceModifiers: [],
      classes: [{ name: 'Guardian', level: 5, subtitle: 'Protector' }],
    });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await expect(page.locator('[data-pw="statpill-ov-ip"]').locator('p').first()).toHaveText('12');
    await expect(page.locator('[data-pw="statpill-ov-ip"]')).toContainText('/ 12');

    await expect
      .poll(async () => {
        const character = await readActiveFabUCharacter(page);
        return {
          currentIP: character.currentIP,
          inventoryPoints: character.inventoryPoints,
          ipBonus: character.ipBonus,
        };
      })
      .toEqual({ currentIP: 12, inventoryPoints: 12, ipBonus: 6 });
  });

  test('Tinkerer class benefit allows current IP to reach and remain at 8', async ({ page }) => {
    await patchActiveFabUCharacter(page, {
      currentIP: 6,
      inventoryPoints: 6,
      maxIP: 6,
      ipBonus: 0,
      classes: [{ name: 'Tinkerer', level: 1, subtitle: 'Emergency Item' }],
    });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    const ipPill = page.locator('[data-pw="statpill-ov-ip"]');
    await expect(ipPill).toContainText('/ 8');
    await ipPill.click();
    const currentInput = page.locator('[data-pw="ip-management-current-input"]');
    await currentInput.fill('8');
    await currentInput.blur();
    await expect(ipPill.locator('p').first()).toHaveText('8');

    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    await expect(page.locator('[data-pw="statpill-ov-ip"]').locator('p').first()).toHaveText('8');
    await expect
      .poll(async () => {
        const character = await readActiveFabUCharacter(page);
        return {
          currentIP: character.currentIP,
          inventoryPoints: character.inventoryPoints,
        };
      })
      .toEqual({ currentIP: 8, inventoryPoints: 8 });
  });

  test('HP pills fill red and pulse at half HP or less', async ({ page }) => {
    await patchActiveFabUCharacter(page, { currentHP: 30 });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await expect(page.locator('[data-pw="statpill-ov-hp"]').locator('p').first()).toHaveText('30');
    await expect
      .poll(() =>
        page
          .locator('[data-pw="statpill-ov-hp"]')
          .evaluate((element) => getComputedStyle(element).animationName),
      )
      .toBe('none');

    await patchActiveFabUCharacter(page, { currentHP: 29 });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    const overviewHpPill = page.locator('[data-pw="statpill-ov-hp"]');
    await expect(overviewHpPill.locator('p').first()).toHaveText('29');
    await expect
      .poll(() =>
        overviewHpPill.evaluate((element) => getComputedStyle(element, '::after').animationName),
      )
      .toContain('fabuSummaryMetricPersistentPulse');
    await expect
      .poll(() => overviewHpPill.evaluate((element) => getComputedStyle(element).backgroundImage))
      .toContain('rgba(179, 38, 30, 0.22)');
    await expect(overviewHpPill.locator('[data-pw="statpill-ov-hp-suffix"]')).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );

    await page.locator('[data-pw="app-footer"]').getByText('Spells').click();
    const stripHpPill = page.locator('[data-pw="metric-hp"]');
    await expect(stripHpPill).toContainText('29');
    await expect
      .poll(() =>
        stripHpPill.evaluate((element) => getComputedStyle(element, '::after').animationName),
      )
      .toContain('fabuSummaryMetricPersistentPulse');
    await expect
      .poll(() => stripHpPill.evaluate((element) => getComputedStyle(element).backgroundImage))
      .toContain('rgba(179, 38, 30, 0.22)');
    await expect(stripHpPill.locator('[data-pw="metric-hp-suffix"]')).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
  });

  test('scrolling the HP number wheel updates the amount input', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-hp"]').click();
    await expect(page.locator('[data-pw="hp-management-modal"]')).toBeVisible();

    await page.locator('[data-pw="hp-management-number-wheel-scroll"]').evaluate((element) => {
      element.scrollTo({ top: 5 * 32 });
      element.dispatchEvent(new Event('scroll', { bubbles: true }));
    });

    await expect(page.locator('[data-pw="hp-management-amount-input"]')).toHaveValue('5');
  });

  test('scrolling the MP number wheel updates the amount input', async ({ page }) => {
    await page.locator('[data-pw="statpill-ov-mp"]').click();
    await expect(page.locator('[data-pw="mp-management-modal"]')).toBeVisible();

    await page.locator('[data-pw="mp-management-number-wheel-scroll"]').evaluate((element) => {
      element.scrollTo({ top: 6 * 32 });
      element.dispatchEvent(new Event('scroll', { bubbles: true }));
    });

    await expect(page.locator('[data-pw="mp-management-amount-input"]')).toHaveValue('6');
  });

  test('damage reduces current HP by the entered amount', async ({ page }) => {
    const hpValue = page.locator('[data-pw="statpill-ov-hp"]').locator('p').first();
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
    const hpValue = page.locator('[data-pw="statpill-ov-hp"]').locator('p').first();
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
    const hpValue = page.locator('[data-pw="statpill-ov-hp"]').locator('p').first();
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
