import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('avatar-legends-character')) {
      localStorage.setItem(
        'avatar-legends-character',
        JSON.stringify({
          name: 'Move Picker Hero',
          className: 'Picker Test Playbook',
          classMoves: ['Move One', 'Move Two', 'Move Three'].map((title) => ({
            title,
            body: `${title} description.`,
          })),
        }),
      );
    }
  });
  await page.goto('/avatar-legends');
  await expect(page.getByText('Move Picker Hero', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Moves', exact: true }).click();
  await page.getByRole('button', { name: 'Class', exact: true }).click();
});

test('shows the full catalog only in the picker, with no arbitrary default selections', async ({
  page,
}) => {
  await expect(page.getByRole('button', { name: 'Move One', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Class Moves 0/2' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose Class Moves' });
  for (const name of ['Move One', 'Move Two', 'Move Three']) {
    await expect(picker.getByRole('checkbox', { name, exact: true })).not.toBeChecked();
    await expect(picker.getByText(`${name} description.`)).toBeVisible();
  }
  await picker.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Class Moves 0/2' })).toBeVisible();
});

test('saves two picks, indicates them on reopening, supports replacement and cancel, and persists after reload', async ({
  page,
}, testInfo) => {
  await page.getByRole('button', { name: 'Class Moves 0/2' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose Class Moves' });
  await picker.getByRole('checkbox', { name: 'Move One', exact: true }).check();
  await picker.getByRole('checkbox', { name: 'Move Two', exact: true }).check();
  await expect(picker.getByRole('checkbox', { name: 'Move Three', exact: true })).toBeDisabled();
  await page.screenshot({
    path: testInfo.outputPath('class-move-picker.png'),
    animations: 'disabled',
  });
  await picker.getByRole('button', { name: 'Save Moves' }).click();
  await expect(page.getByRole('button', { name: 'Move One', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Move Two', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Move Three', exact: true })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('selected-class-moves.png'),
    animations: 'disabled',
  });

  await page.getByRole('button', { name: 'Class Moves 2/2' }).click();
  await expect(picker.getByRole('checkbox', { name: 'Move One', exact: true })).toBeChecked();
  await expect(picker.getByRole('checkbox', { name: 'Move Two', exact: true })).toBeChecked();
  await picker.getByRole('checkbox', { name: 'Move One', exact: true }).uncheck();
  await picker.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Move One', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Class Moves 2/2' }).click();
  await picker.getByRole('checkbox', { name: 'Move One', exact: true }).uncheck();
  await picker.getByRole('checkbox', { name: 'Move Three', exact: true }).check();
  await picker.getByRole('button', { name: 'Save Moves' }).click();
  await expect(page.getByRole('button', { name: 'Move One', exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Class', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Class Moves 2/2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Move Two', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Move Three', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Move One', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Move One', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Move Two', exact: true })).toBeVisible();
});
