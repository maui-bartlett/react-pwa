import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

async function seedCharacter(
  page: import('@playwright/test').Page,
  primaryTraining = 'Technology',
) {
  await page.addInitScript((training) => {
    if (localStorage.getItem('avatar-legends-character')) return;
    localStorage.setItem(
      'avatar-legends-character',
      JSON.stringify({
        name: 'Tom Dorito',
        className: 'Gears Test Playbook',
        primaryTraining: training,
        techniques: [
          ['technology', 'Gear Technique'],
          ['basic', 'Basic Technique'],
          ['firebending', 'Fire Technique'],
        ].map(([type, name]) => ({
          type,
          name,
          approach: 'Advance & Attack',
          level: 'learned',
          description: 'Mark 2-fatigue to perform this technique.',
          summary: 'Technique summary.',
        })),
      }),
    );
  }, primaryTraining);
  await page.goto('/avatar-legends');
  await expect(page.getByText('Tom Dorito', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Combat', exact: true }).click();
}

test('Technology characters can edit Gears beneath Fatigue, and the value persists', async ({
  page,
}) => {
  await seedCharacter(page);
  const gears = page.getByRole('spinbutton', { name: 'Current gears' });
  await expect(gears).toHaveValue('3');
  const fatigue = await page.getByText('Fatigue', { exact: true }).first().boundingBox();
  const gearsBox = await gears.boundingBox();
  expect(gearsBox!.y).toBeGreaterThan(fatigue!.y);
  await page.getByRole('button', { name: 'Increase gears' }).click();
  await expect(gears).toHaveValue('4');
  await page.getByRole('button', { name: 'Decrease gears' }).click();
  await gears.fill('7');
  await page.reload();
  await expect(gears).toHaveValue('7');
  await gears.fill('-1');
  await expect(gears).toHaveValue('0');
  await expect(page.getByRole('button', { name: 'Decrease gears' })).toBeDisabled();
});

test('Gears replace fatigue one at a time only on eligible techniques, and never refill on reload', async ({
  page,
}, testInfo) => {
  await seedCharacter(page);
  const gears = page.getByRole('spinbutton', { name: 'Current gears' });
  await expect(gears).toHaveValue('3');
  await page.getByRole('button', { name: /Gear Technique/ }).click();
  await page.getByRole('button', { name: 'Spend 1 Gear', exact: true }).click();
  await expect(gears).toHaveValue('2');
  await expect(page.getByRole('button', { name: 'Toggle base fatigue 1' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('button', { name: /Gear Technique/ }).click();
  await page.getByRole('button', { name: /Fire Technique/ }).click();
  await expect(page.getByRole('button', { name: 'Spend 1 Gear', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Basic Technique/ }).click();
  await page.getByRole('button', { name: 'Spend 1 Gear', exact: true }).click();
  await page.getByRole('button', { name: 'Spend 1 Gear', exact: true }).click();
  await expect(gears).toHaveValue('0');
  await expect(page.getByRole('button', { name: 'Spend 1 Gear', exact: true })).toBeDisabled();
  await page.screenshot({
    path: testInfo.outputPath('technology-gears.png'),
    animations: 'disabled',
  });
  await page.reload();
  await expect(gears).toHaveValue('0');
});

test('other primary trainings have no Gears controls', async ({ page }) => {
  await seedCharacter(page, 'Waterbending');
  await expect(page.getByRole('spinbutton', { name: 'Current gears' })).toHaveCount(0);
  await page.getByRole('button', { name: /Basic Technique/ }).click();
  await expect(page.getByRole('button', { name: 'Spend 1 Gear', exact: true })).toHaveCount(0);
});
