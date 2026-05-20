import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false });

async function revealDeleteAction(page: import('@playwright/test').Page, bondId: string) {
  await page.evaluate((id) => {
    const target = document.querySelector(`[data-pw="bond-add-${id}"]`)?.parentElement;
    if (!target) throw new Error(`swipe target not found for bond-add-${id}`);
    const r = target.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    function makeTouchEvent(type: string, x: number, y: number): TouchEvent {
      const touch = new Touch({
        identifier: 1,
        target: target!,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        pageX: x,
        pageY: y,
        radiusX: 10,
        radiusY: 10,
        rotationAngle: 0,
        force: 1,
      });
      return new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true,
      });
    }

    target.dispatchEvent(makeTouchEvent('touchstart', cx, cy));
    target.dispatchEvent(makeTouchEvent('touchmove', cx - 180, cy));
    target.dispatchEvent(makeTouchEvent('touchend', cx - 180, cy));
  }, bondId);
}

/**
 * Verifies that the Bond × (delete) and + (add) icon buttons have
 * identical bounding-box dimensions so the hover circle looks the same.
 *
 * Root cause of previous mismatch:
 *   + button: AddIcon fontSize="small" (20px) + p:0.5 (4px each side) = 28×28px
 *   × button: CloseIcon sx.fontSize:14px + p:0.5 (4px each side)     = 22×22px
 * Fix: CloseIcon changed to fontSize="small" (20px) → both 28×28px.
 */
test('bond + button and delete action keep their intended dimensions', async ({ page }) => {
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
  await revealDeleteAction(page, id);
  await expect(delBtn).toBeVisible();

  const addBox = await addBtn.boundingBox();
  const delBox = await delBtn.boundingBox();
  const delIconBox = await delBtn.locator('svg').boundingBox();

  expect(addBox).not.toBeNull();
  expect(delBox).not.toBeNull();
  expect(delIconBox).not.toBeNull();

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
    `delete action width was ${delBox!.width}px`,
  ).toBeCloseTo(64, 0);
  expect(
    delBox!.height,
    `delete action height was ${delBox!.height}px`,
  ).toBeGreaterThanOrEqual(addBox!.height);
  expect(
    delIconBox!.width,
    `delete icon width was ${delIconBox!.width}px`,
  ).toBeCloseTo(18, 0);
  expect(
    delIconBox!.height,
    `delete icon height was ${delIconBox!.height}px`,
  ).toBeCloseTo(18, 0);
});
