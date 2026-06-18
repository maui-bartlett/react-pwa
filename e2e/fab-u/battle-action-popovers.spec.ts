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

  await expect(page.locator('[data-pw="objective-popover"]')).toContainText('No objective set');
});

test('Battle Actions poppers allow background scrolling and close on click-away', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 500 });
  const contentArea = page.locator('[data-pw="content-area"]');
  await page.getByRole('button', { name: 'Hinder' }).click();
  const popover = page.locator('[data-pw="hinder-popover"]');
  await expect(popover).toBeVisible();
  await expect(contentArea).toHaveCSS('overflow-y', 'auto');
  await expect(page.locator('[data-pw="mobile-screen"]')).not.toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await contentArea.evaluate((element) => {
    element.scrollTop = 0;
  });

  const scrollPoint = await page.evaluate(() => {
    const content = document.querySelector('[data-pw="content-area"]');
    const popper = document.querySelector('[data-pw="battle-action-popover-paper"]');
    if (!(content instanceof HTMLElement)) return null;
    const rect = content.getBoundingClientRect();
    for (let y = rect.top + 20; y < rect.bottom - 20; y += 20) {
      for (let x = rect.left + 10; x < rect.right - 10; x += 20) {
        const target = document.elementFromPoint(x, y);
        if (target && content.contains(target) && !popper?.contains(target)) return { x, y };
      }
    }
    return null;
  });
  if (!scrollPoint) throw new Error('No uncovered FabU content point is visible');
  await page.mouse.move(scrollPoint.x, scrollPoint.y);
  await page.mouse.wheel(0, 400);

  await expect.poll(() => contentArea.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(popover).toBeVisible();

  await page.mouse.click(20, 420);
  await expect(popover).not.toBeVisible();
});
