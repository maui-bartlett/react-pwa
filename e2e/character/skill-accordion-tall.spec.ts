import { devices, expect, test } from '@playwright/test';

import { patchActiveFabUCharacter, readActiveFabUCharacter } from '../helpers/fabUStorage';

test.use({ viewport: devices['Pixel 5'].viewport });

const LONG_DESCRIPTION = Array.from(
  { length: 40 },
  (_, i) =>
    `Sentence ${i + 1}: this skill description is intentionally verbose to exceed the old fixed accordion cap.`,
).join(' ');

/**
 * A skill's description accordion must grow to fit very long content — there is
 * no fixed max-height clipping it (the old 300px cap is gone).
 */
test.describe('Skill description accordion grows with content', () => {
  test('a very long description expands well past the old 300px cap', async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    // Give the first skill of the first class a very long description.
    const character = await readActiveFabUCharacter(page);
    const skillGroups = character.skillGroups as Array<{
      className: string;
      skills: Array<{ name: string; level?: string; description?: string }>;
    }>;
    const targetGroup = skillGroups.find((g) => g.skills.length > 0);
    expect(targetGroup).toBeTruthy();
    const skillName = targetGroup!.skills[0].name;

    const patchedGroups = skillGroups.map((g) =>
      g.className === targetGroup!.className
        ? {
            ...g,
            skills: g.skills.map((s, i) => (i === 0 ? { ...s, description: LONG_DESCRIPTION } : s)),
          }
        : g,
    );

    await patchActiveFabUCharacter(page, { skillGroups: patchedGroups });
    await page.reload();
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();

    // Open the Skills sub-tab under Combat.
    await page.locator('[data-pw="app-footer"]').getByText('Combat').click();
    await page.locator('[data-pw="content-area"]').getByRole('button', { name: 'Skills' }).click();

    // Expand the target skill row.
    const skillRow = page
      .locator('[data-pw="skill-table-row"]')
      .filter({ hasText: skillName })
      .first();
    await skillRow.scrollIntoViewIfNeeded();
    await skillRow.click();

    const description = page.locator('[data-pw="skill-row-description"]').first();
    await expect(description).toBeVisible();
    await expect(description).toContainText('Sentence 40:');

    // The fully-rendered description is taller than the old 300px cap, proving
    // the accordion is no longer clipped.
    const box = await description.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(300);
  });
});
