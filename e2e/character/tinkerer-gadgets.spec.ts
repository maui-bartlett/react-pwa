import { devices, expect, test } from '@playwright/test';

import { patchActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Tinkerer Gadgets skill', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('first Gadgets level shows only Choose an Upgrade, not locked invention ranks', async ({
    page,
  }) => {
    await patchActiveFabUCharacter(page, {
      level: 5,
      classes: [{ name: 'Tinkerer', level: 5, subtitle: 'Gadgets' }],
      skillGroups: [
        {
          className: 'Tinkerer',
          skills: [
            {
              name: 'Gadgets',
              level: '1',
              maxLevel: 5,
              effect: 'Choose gadget invention types.',
            },
          ],
        },
      ],
      gadgets: {},
      spellGroups: [],
    });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.getByText('Gadgets', { exact: true }).first().click();
    await expect(page.locator('[data-pw="gadgets-skill-panel"]')).toBeVisible();
    await expect(page.locator('[data-pw="gadgets-pending-upgrades"]')).toBeVisible();
    await expect(page.getByText('Choose an upgrade')).toBeVisible();
    await expect(page.locator('[data-pw="gadgets-invention-ranks"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="gadgets-type-alchemy"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="gadgets-type-infusions"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="gadgets-type-magitech"]')).toHaveCount(0);

    await page.locator('[data-pw="gadgets-upgrade-alchemy-basic"]').click();
    await expect(page.locator('[data-pw="gadgets-invention-ranks"]')).toBeVisible();
    await expect(page.locator('[data-pw="gadgets-type-alchemy"]')).toBeVisible();
    await expect(page.locator('[data-pw="gadgets-type-alchemy"]')).toContainText('Basic');
  });

  test('Gadgets accordion shows invention upgrades and Magisphere spells after Superior Magitech', async ({
    page,
  }) => {
    await patchActiveFabUCharacter(page, {
      level: 20,
      classes: [
        { name: 'Tinkerer', level: 5, subtitle: 'Gadgets' },
        { name: 'Elementalist', level: 5, subtitle: 'Elemental Magic' },
      ],
      skillGroups: [
        {
          className: 'Tinkerer',
          skills: [
            {
              name: 'Gadgets',
              level: '3',
              maxLevel: 5,
              effect: 'Choose gadget invention types.',
            },
          ],
        },
        {
          className: 'Elementalist',
          skills: [
            {
              name: 'Elemental Magic',
              level: '5',
              maxLevel: 10,
              effect: 'Learn elemental spells.',
            },
          ],
        },
      ],
      gadgets: {
        magitech: 'advanced',
      },
      spellGroups: [],
    });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.getByText('Gadgets', { exact: true }).first().click();
    await expect(page.locator('[data-pw="gadgets-skill-panel"]')).toBeVisible();
    await expect(page.locator('[data-pw="gadgets-pending-upgrades"]')).toBeVisible();
    await page.locator('[data-pw="gadgets-upgrade-magitech-superior"]').click();
    await expect(page.locator('[data-pw="gadgets-magisphere-hint"]')).toBeVisible();
    await expect(page.locator('[data-pw="gadgets-magicannon-damage-select"]')).toBeVisible();

    await page.locator('[data-pw="app-footer"]').getByText('Spells').click();
    await expect(page.getByText('Tinkerer Spells')).toBeVisible();
  });
});
