import { devices, expect, test } from '@playwright/test';

import { patchActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

test('adding the Comet heroic skill adds Comet to Entropist Spells', async ({ page }) => {
  await page.goto('/fab-u');
  await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  await patchActiveFabUCharacter(page, {
    level: 10,
    classes: [{ name: 'Entropist', level: 10, subtitle: 'Time and entropy magic' }],
    skillGroups: [
      {
        className: 'Entropist',
        skills: [{ name: 'Entropic Magic', level: '10', maxLevel: 10, effect: 'Learn spells.' }],
      },
    ],
    spellGroups: [{ className: 'Entropist', spells: [] }],
  });
  await page.reload();
  await page.locator('[data-pw="metric-ov-xp"]').waitFor();

  await page.locator('[data-pw="app-footer"]').getByText('Skills').click();
  await page.locator('[data-pw="add-mastered-skill-button"]').click();
  const picker = page.locator('[data-pw="fab-u-catalog-picker-dialog"]');
  const cometOption = picker.locator('[data-pw="fab-u-catalog-row"]').filter({ hasText: 'Comet' });
  await cometOption.click();
  await cometOption.getByRole('button', { name: 'Add' }).click();
  await expect(picker).not.toBeVisible();

  await page.locator('[data-pw="app-footer"]').getByText('Spells').click();
  await expect(page.locator('[data-pw="spell-row"]').filter({ hasText: 'Comet' })).toBeVisible();
});
