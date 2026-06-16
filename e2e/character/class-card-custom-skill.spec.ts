import { devices, expect, test } from '@playwright/test';

import { patchActiveFabUCharacter, readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

/**
 * When a class has no curated subtitle yet (placeholder) and a single custom
 * skill is recorded against it, the Classes card should surface that skill
 * name instead of "No skills recorded yet".
 */
test.describe('Class card surfaces lone custom skill name', () => {
  test('placeholder subtitle is replaced by the custom skill name', async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    // Take the first class and reshape it to the "freshly added + one custom
    // skill" state: placeholder subtitle, exactly one custom skill recorded.
    const character = await readActiveFabUCharacter(page);
    const classes = character.classes as Array<{ name: string; subtitle: string }>;
    expect(classes.length).toBeGreaterThan(0);
    const className = classes[0].name;

    const newClasses = classes.map((cls, i) =>
      i === 0 ? { ...cls, subtitle: 'No skills recorded yet' } : cls,
    );
    const skillGroups = (character.skillGroups as Array<{ className: string; skills: unknown[] }>).map(
      (group) =>
        group.className === className
          ? { className, skills: [{ name: 'Phantom Strike', level: '0' }] }
          : group,
    );

    await patchActiveFabUCharacter(page, { classes: newClasses, skillGroups });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    const classRow = page
      .locator('[data-pw="detail-list-row"]')
      .filter({ hasText: className })
      .first();
    await classRow.scrollIntoViewIfNeeded();

    await expect(classRow).toContainText('Phantom Strike');
    await expect(classRow).not.toContainText('No skills recorded yet');
  });
});
