import { devices, expect, test } from '@playwright/test';

import { patchActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Dancer dances', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('shows a prepared Dancer Dances table when the Dancer has Dance', async ({ page }) => {
    await patchActiveFabUCharacter(page, {
      classes: [{ name: 'Dancer', level: 1, subtitle: '' }],
      skillGroups: [
        {
          className: 'Dancer',
          skills: [{ name: 'Dance', level: '1', maxLevel: 10, effect: '' }],
        },
      ],
      spellGroups: [],
    });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await page.locator('[data-pw="app-footer"]').getByText('Spells').click();

    await expect(page.getByText('Dancer Dances • 0/1')).toBeVisible();
    await expect(page.locator('[data-pw="spell-row"]')).toHaveCount(0);

    await page.locator('[data-pw="add-spell-button"]').click();
    const angelDanceOption = page
      .locator('[data-pw="fab-u-catalog-row"]')
      .filter({ hasText: 'Angel Dance' });
    await angelDanceOption.click();
    await angelDanceOption.getByRole('button', { name: 'Add' }).click();

    const angelDance = page.locator('[data-pw="spell-row"]').filter({ hasText: 'Angel Dance' });
    await expect(page.getByText('Dancer Dances • 1/1')).toBeVisible();
    await expect(page.locator('[data-pw="spell-row"]')).toHaveCount(1);
    await expect(angelDance).toContainText('10 MP');
    await expect(angelDance).toContainText('Until next turn');
    await angelDance.click();
    await expect(page.getByText(/Resistance to light damage/)).toBeVisible();
  });

  test('does not show Dancer dances until the Dance skill is taken', async ({ page }) => {
    await patchActiveFabUCharacter(page, {
      classes: [{ name: 'Dancer', level: 1, subtitle: '' }],
      skillGroups: [{ className: 'Dancer', skills: [] }],
      spellGroups: [],
    });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    await page.locator('[data-pw="app-footer"]').getByText('Spells').click();

    await expect(page.getByText(/Dancer Dances/)).toBeHidden();
    await expect(page.locator('[data-pw="spell-row"]')).toHaveCount(0);
  });
});
