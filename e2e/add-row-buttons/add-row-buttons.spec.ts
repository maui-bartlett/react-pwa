import { devices, expect, test } from '@playwright/test';

import { patchActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Add-row buttons — Classes and Bonds (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    // Overview is the default tab — Classes and Bonds are both on it
  });

  test('Classes list hides the "+ Class" add affordance when no free levels are available', async ({
    page,
  }) => {
    await expect(page.getByText('Classes').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Class' })).not.toBeVisible();
  });

  test('Bonds list has a "+ Bond" add affordance at the bottom', async ({ page }) => {
    const addRow = page.locator('[data-pw="bond-add-new"]').first();
    await addRow.scrollIntoViewIfNeeded();
    await expect(addRow).toBeVisible();

    const textContent = await addRow.textContent();
    expect(textContent).toBe('Bond');
  });

  test('Classes card still renders all default class rows', async ({ page }) => {
    await expect(page.getByText('Entropist')).toBeVisible();
    await expect(page.getByText('Sharpshooter')).toBeVisible();
    const tinkerer = page.getByText('Tinkerer');

    await expect(tinkerer).toBeVisible();
  });

  test('"+ Class" opens a catalog picker and adds the selected class', async ({ page }) => {
    const classes = [
      { name: 'Entropist', level: 7, subtitle: 'Time and entropy magic' },
      { name: 'Sharpshooter', level: 5, subtitle: 'Ranged precision' },
    ];
    await patchActiveFabUCharacter(page, {
      level: 13,
      classes,
      skillGroups: [
        {
          className: 'Entropist',
          skills: [{ name: 'Entropic Magic', level: '7', maxLevel: 10 }],
        },
        {
          className: 'Sharpshooter',
          skills: [{ name: 'Ranged Weapon Mastery', level: '5', maxLevel: 5 }],
        },
      ],
      spellGroups: [],
    });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    const addClass = page.locator('[data-pw="detail-list-add-class"]').first();
    await addClass.scrollIntoViewIfNeeded();
    await expect(addClass).toBeVisible();
    await addClass.click();

    const picker = page.locator('[data-pw="fab-u-catalog-picker-dialog"]');
    await expect(picker).toBeVisible();
    await expect(picker).toContainText('Class Catalog');
    await expect(picker).not.toContainText('Entropist');
    await expect(
      picker.locator('[data-pw="fab-u-catalog-row"]').filter({ hasText: 'Arcanist' }),
    ).toBeVisible();

    await picker.locator('[data-pw="fab-u-catalog-row"]').filter({ hasText: 'Arcanist' }).click();
    await expect(picker).not.toBeVisible();
    await expect(
      page.locator('[data-pw="detail-list-row"]').filter({ hasText: 'Arcanist' }),
    ).toBeVisible();
  });

  test('"+ Bond" add row is visible on Combat > Bonds subtab too', async ({ page }) => {
    // Navigate to Combat tab
    await page.getByRole('button', { name: 'Combat' }).first().click();

    // Bonds is the default combat subtab
    const addRow = page.locator('[data-pw="bond-add-new"]').first();
    await addRow.scrollIntoViewIfNeeded();
    await expect(addRow).toBeVisible();

    const textContent = await addRow.textContent();
    expect(textContent).toBe('Bond');
  });
});
