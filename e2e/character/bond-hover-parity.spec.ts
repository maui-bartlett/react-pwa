import { devices, expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false });

/**
 * Verifies that the Bond × (delete) and + (add) icon buttons have
 * identical bounding-box dimensions so the hover circle looks the same.
 *
 * Root cause of previous mismatch:
 *   + button: AddIcon fontSize="small" (20px) + p:0.5 (4px each side) = 28×28px
 *   × button: CloseIcon sx.fontSize:14px + p:0.5 (4px each side)     = 22×22px
 * Fix: CloseIcon changed to fontSize="small" (20px) → both 28×28px.
 */
test('bond + and × buttons have equal bounding box size', async ({ page }) => {
  await page.goto('/fab-u');
  await page.evaluate(() => localStorage.removeItem('fab-u-character'));
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Resolve bond ID by name
  const row = page.locator('[data-pw^="bond-row-"]').filter({ hasText: 'Jelena' }).first();
  const pw = await row.getAttribute('data-pw');
  const id = pw!.replace('bond-row-', '');

  const addBtn = page.locator(`[data-pw="bond-add-${id}"]`);
  const delBtn = page.locator(`[data-pw="bond-delete-${id}"]`);

  const addBox = await addBtn.boundingBox();
  const delBox = await delBtn.boundingBox();

  expect(addBox).not.toBeNull();
  expect(delBox).not.toBeNull();

  // Both should be 28×28px (icon 20px + padding 4px × 2)
  expect(
    addBox!.width,
    `+ button width was ${addBox!.width}px`,
  ).toBeCloseTo(28, 0);
  expect(
    addBox!.height,
    `+ button height was ${addBox!.height}px`,
  ).toBeCloseTo(28, 0);
  expect(
    delBox!.width,
    `× button width was ${delBox!.width}px`,
  ).toBeCloseTo(28, 0);
  expect(
    delBox!.height,
    `× button height was ${delBox!.height}px`,
  ).toBeCloseTo(28, 0);

  // Sizes must match
  expect(
    Math.abs(addBox!.width - delBox!.width),
    `width mismatch: + is ${addBox!.width}px, × is ${delBox!.width}px`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(addBox!.height - delBox!.height),
    `height mismatch: + is ${addBox!.height}px, × is ${delBox!.height}px`,
  ).toBeLessThanOrEqual(1);
});
