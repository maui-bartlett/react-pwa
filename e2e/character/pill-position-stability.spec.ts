import { devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

const POSITION_TOLERANCE = 2; // px — text must stay within 2px of original x

async function measureShift(
  page: ReturnType<typeof test['info']>['project'] extends infer P ? never : Parameters<typeof test>[1] extends (args: { page: infer Pg }) => unknown ? Pg : never,
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
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.waitForLoadState('networkidle');
  });

  test('Overview IP (StatPill inline, no suffix) — x stable within 2px', async ({ page }) => {
    const pill = page.locator('[data-pw="statpill-ov-ip"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-ov-ip-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Overview HP (StatPill inline, with suffix) — x stable within 2px', async ({ page }) => {
    const pill = page.locator('[data-pw="statpill-ov-hp"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-ov-hp-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Overview MP (StatPill inline, with suffix) — x stable within 2px', async ({ page }) => {
    const pill = page.locator('[data-pw="statpill-ov-mp"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-ov-mp-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Combat FP (StatPill inline, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="statpill-cb-fp"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-cb-fp-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Combat IP (StatPill inline, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="statpill-cb-ip"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-cb-ip-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Combat HP (StatPill inline, with suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="statpill-cb-hp"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-cb-hp-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Combat MP (StatPill inline, with suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="statpill-cb-mp"]');
    const valueEl = pill.locator('h6').first();
    const input = page.locator('[data-pw="statpill-cb-mp-input"]');
    const { delta } = await measureShift(page, pill, valueEl, input);
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Skills FP (SummaryStrip, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
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

  test('Skills IP (SummaryStrip, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Skills' }).first().click();
    await page.waitForLoadState('networkidle');
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

  test('Gear Zennit (SummaryStrip, no suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Gear' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="metric-zennit"]');
    const valueEl = pill.locator('p').first();
    const input = page.locator('[data-pw="metric-zennit-input"]');
    const valueBB = await valueEl.boundingBox();
    await pill.click();
    await input.waitFor({ state: 'visible' });
    const inputBB = await input.boundingBox();
    const delta = Math.abs((inputBB?.x ?? 0) - (valueBB?.x ?? 0));
    await input.blur();
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });

  test('Spells HP (SummaryStrip, with suffix) — x stable within 2px', async ({ page }) => {
    await page.getByRole('button', { name: 'Spells' }).first().click();
    await page.waitForLoadState('networkidle');
    const pill = page.locator('[data-pw="metric-hp"]');
    const valueEl = pill.locator('p').first();
    const input = page.locator('[data-pw="metric-hp-input"]');
    const valueBB = await valueEl.boundingBox();
    await pill.click();
    await input.waitFor({ state: 'visible' });
    const inputBB = await input.boundingBox();
    const delta = Math.abs((inputBB?.x ?? 0) - (valueBB?.x ?? 0));
    await input.blur();
    expect(delta).toBeLessThanOrEqual(POSITION_TOLERANCE);
  });
});
