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

test('scroll gestures outside a Battle Actions popover reach the app content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  const contentArea = page.locator('[data-pw="content-area"]');
  await contentArea.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.getByRole('button', { name: 'Hinder' }).click();
  await expect(page.locator('[data-pw="hinder-popover"]')).toBeVisible();

  const contentBox = await contentArea.boundingBox();
  if (!contentBox) throw new Error('FabU content area is not visible');
  await page.mouse.move(contentBox.x + 12, contentBox.y + 220);
  await page.mouse.wheel(0, 400);

  await expect.poll(() => contentArea.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator('[data-pw="hinder-popover"]')).toBeVisible();
});

test('a tap outside closes the popover but a drag does not', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.getByRole('button', { name: 'Hinder' }).click();
  const popover = page.locator('[data-pw="hinder-popover"]');
  await expect(popover).toBeVisible();

  await page.mouse.move(20, 420);
  await page.mouse.down();
  await page.mouse.move(20, 320, { steps: 4 });
  await page.mouse.up();
  await expect(popover).toBeVisible();

  await page.mouse.click(20, 420);
  await expect(popover).not.toBeVisible();
});

test('the popover remains anchored to its Battle Action while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  const hinderButton = page.locator('[data-pw="battle-action-hinder"]');
  await hinderButton.click();
  const popover = page.locator('[data-pw="battle-action-popover-paper"]');

  const buttonBefore = await hinderButton.boundingBox();
  const popoverBefore = await popover.boundingBox();
  if (!buttonBefore || !popoverBefore) throw new Error('Battle Action popover is not visible');

  await page.locator('[data-pw="content-area"]').evaluate((element) => {
    element.scrollTop += 80;
  });

  await expect
    .poll(async () => {
      const buttonAfter = await hinderButton.boundingBox();
      const popoverAfter = await popover.boundingBox();
      if (!buttonAfter || !popoverAfter) return Number.POSITIVE_INFINITY;
      const buttonDelta = buttonAfter.y - buttonBefore.y;
      const popoverDelta = popoverAfter.y - popoverBefore.y;
      return Math.abs(buttonDelta - popoverDelta);
    })
    .toBeLessThan(2);
});
