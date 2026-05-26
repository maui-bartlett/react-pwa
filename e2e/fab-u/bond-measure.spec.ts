import { expect, test } from '@playwright/test';

test('measure bond add/delete button sizes', async ({ page, browserName }) => {
  // The swipe gesture below dispatches synthetic Touch/TouchEvent objects,
  // which Firefox and WebKit do not expose. This is a Chromium-only
  // measurement/debugging test.
  test.skip(browserName !== 'chromium', 'requires Touch/TouchEvent constructors');

  await page.goto('/fab-u');
  await page.evaluate(() => localStorage.removeItem('fab-u-character'));
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Get bond ID for Jelena
  const row = page.locator('[data-pw^="bond-row-"]').filter({ hasText: 'Jelena' }).first();
  const pw = await row.getAttribute('data-pw');
  const id = pw!.replace('bond-row-', '');

  const addBtn = page.locator(`[data-pw="bond-add-${id}"]`);
  const delBtn = page.locator(`[data-pw="bond-delete-${id}"]`);
  await page.evaluate((bondId) => {
    const target = document.querySelector(`[data-pw="bond-add-${bondId}"]`)?.parentElement;
    if (!target) throw new Error(`swipe target not found for bond-add-${bondId}`);
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
  }, id);
  await expect(delBtn).toBeVisible();

  const addBox = await addBtn.boundingBox();
  const delBox = await delBtn.boundingBox();

  // Get computed styles
  const addStyles = await addBtn.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      width: cs.width,
      height: cs.height,
      padding: cs.padding,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      borderRadius: cs.borderRadius,
      fontSize: cs.fontSize,
    };
  });

  const delStyles = await delBtn.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      width: cs.width,
      height: cs.height,
      padding: cs.padding,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      borderRadius: cs.borderRadius,
      fontSize: cs.fontSize,
    };
  });

  // Get the icon sizes
  const addIconStyles = await addBtn.locator('svg').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, width: el.getAttribute('width'), height: el.getAttribute('height') };
  });

  const delIconStyles = await delBtn.locator('svg').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, width: el.getAttribute('width'), height: el.getAttribute('height') };
  });

  console.log('ADD button:', JSON.stringify({ box: addBox, styles: addStyles, icon: addIconStyles }, null, 2));
  console.log('DEL button:', JSON.stringify({ box: delBox, styles: delStyles, icon: delIconStyles }, null, 2));

  // This is just a measurement test — always passes
  expect(true).toBe(true);
});
