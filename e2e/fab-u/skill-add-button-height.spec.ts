import { expect, test } from '@playwright/test';

/**
 * Verifies that the "+ Skill" button at the bottom of a SkillsTable has
 * the same minimum height as a regular skill row, so the visual rhythm
 * is consistent (within 1px tolerance).
 *
 * Default character: level 13, total skill levels 12 → canAddMoreSkills = true.
 * Entropist table total = 8 < 10 → showAddSkillButton = true.
 */

test.describe('+ Skill button height matches skill row height', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate to the Combat tab via the footer nav
    await page.locator('[data-pw="app-footer"]').getByText('Combat').click();

    // Click the "Skills" sub-tab within Combat
    await page.locator('[data-pw="content-area"]').getByRole('button', { name: 'Skills' }).click();

    // Wait for at least one skill row to appear
    await expect(page.locator('[data-pw="skill-table-row"]').first()).toBeVisible({
      timeout: 2000,
    });
  });

  test('+ Skill button height equals skill row height within 1px', async ({ page }) => {
    const skillRow = page.locator('[data-pw="skill-table-row"]').first();
    const addButton = page.locator('[data-pw="add-skill-button"]').first();

    await expect(addButton).toBeVisible({ timeout: 2000 });

    const rowBox = await skillRow.boundingBox();
    const btnBox = await addButton.boundingBox();

    expect(rowBox).not.toBeNull();
    expect(btnBox).not.toBeNull();

    expect(
      Math.abs(btnBox!.height - rowBox!.height),
      `+ Skill button height (${btnBox!.height.toFixed(1)}px) should match skill row height (${rowBox!.height.toFixed(1)}px) within 1px`,
    ).toBeLessThanOrEqual(1);
  });
});
