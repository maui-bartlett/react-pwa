import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/fab-u');
  await page.getByRole('button', { name: 'Combat' }).click();
  await expect(
    page.getByTestId('content-area').getByText('Battle Actions', { exact: true }),
  ).toBeVisible();
});

test('Hinder offers the four main status effects', async ({ page }) => {
  await page.getByRole('button', { name: 'Hinder' }).click();

  const popover = page.locator('[data-pw="hinder-popover"]');
  await expect(popover).toBeVisible();
  for (const status of ['Slow', 'Dazed', 'Weak', 'Shaken']) {
    await expect(popover.getByRole('button', { name: status })).toBeVisible();
  }
});

test('Study shows its check and result tiers', async ({ page }) => {
  await page.getByRole('button', { name: 'Study' }).click();

  const popover = page.locator('[data-pw="study-popover"]');
  await expect(popover).toContainText('Make an [INS + INS] check');
  await expect(popover).toContainText('7–9');
  await expect(popover).toContainText('Basic information');
  await expect(popover).toContainText('16+');
  await expect(popover).toContainText('Encyclopedic');
});

test('Guard shows benefits and its once-per-turn caveat', async ({ page }) => {
  await page.getByRole('button', { name: 'Guard' }).click();

  const popover = page.locator('[data-pw="guard-popover"]');
  await expect(popover).toContainText('Gain Resistance');
  await expect(popover).toContainText('+2 on all opposed actions');
  await expect(popover).toContainText('cannot be targeted by a melee attack');
  await expect(popover).toContainText('Guard can be used only once per turn');
});

test('Objective explains when no shared campaign clock is available', async ({ page }) => {
  await page.getByRole('button', { name: 'Objective' }).click();

  await expect(page.locator('[data-pw="objective-popover"]')).toContainText(
    'No objective clock has been set',
  );
});
