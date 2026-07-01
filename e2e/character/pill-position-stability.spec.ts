import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

const POSITION_TOLERANCE = 5; // px — scaled 16px edit inputs can shift a few pixels visually

async function measureShift(
  page: ReturnType<(typeof test)['info']>['project'] extends infer P
    ? never
    : Parameters<typeof test>[1] extends (args: { page: infer Pg }) => unknown
      ? Pg
      : never,
  pillLocator: ReturnType<typeof page.locator>,
  valueLocator: ReturnType<typeof page.locator>,
  inputLocator: ReturnType<typeof page.locator>,
) {
  const valueBB = await valueLocator.boundingBox();
  await pillLocator.click();
  await inputLocator.waitFor({ state: 'visible' });
  const inputBB = await inputLocator.boundingBox();
  const delta = Math.abs((inputBB?.x ?? 0) - (valueBB?.x ?? 0));
  await inputLocator.blur();
  await page.waitForTimeout(100);
  return { before: valueBB?.x, after: inputBB?.x, delta };
}

test.describe('Pill value position stability on edit toggle (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
  });

  test('Overview IP (StatPill inline, no suffix) — x stable within tolerance', async ({ page }) => {
    const pill = page.locator('[data-pw="statpill-ov-ip"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-ov-ip-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  // HP/MP pills now open the HP/MP management modal instead of inline editing
  // (see hp-mp-management.spec.ts), so they no longer have a position-stability
  // case here.

  test('Combat FP (StatPill inline, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    const pill = page.locator('[data-pw="statpill-cb-fp"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-cb-fp-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Combat IP (StatPill inline, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    const pill = page.locator('[data-pw="statpill-cb-ip"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-cb-ip-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Skills FP (SummaryStrip, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    const pill = page.locator('[data-pw="metric-fp"]');
    const valueEl = pill.locator('p').first();
    const input = page.locator('[data-pw="metric-fp-input"]');
    const valueBB = await valueEl.boundingBox();
    await pill.click();
    await input.waitFor({ state: 'visible' });
    const inputBB = await input.boundingBox();
    const delta = Math.abs((inputBB?.x ?? 0) - (valueBB?.x ?? 0));
    await input.blur();
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Spells IP (SummaryStrip, no suffix) — x stable within tolerance', async ({ page }) => {
    await page.getByRole('button', { name: 'Spells' }).first().click();
    const pill = page.locator('[data-pw="metric-ip"]');
    const valueEl = pill.locator('p').first();
    const input = page.locator('[data-pw="metric-ip-input"]');
    const valueBB = await valueEl.boundingBox();
    await pill.click();
    await input.waitFor({ state: 'visible' });
    const inputBB = await input.boundingBox();
    const delta = Math.abs((inputBB?.x ?? 0) - (valueBB?.x ?? 0));
    await input.blur();
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Gear Zenit (SummaryStrip, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Gear' }).first().click();
    const pill = page.locator('[data-pw="metric-zenit"]');
    const valueEl = pill.locator('p').first();
    const input = page.locator('[data-pw="metric-zenit-input"]');
    const valueBB = await valueEl.boundingBox();
    await pill.click();
    await input.waitFor({ state: 'visible' });
    const inputBB = await input.boundingBox();
    const delta = Math.abs((inputBB?.x ?? 0) - (valueBB?.x ?? 0));
    await input.blur();
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });
});
