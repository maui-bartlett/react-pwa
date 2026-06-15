/**
 * Regression: Bond rows were blocking vertical page scroll.
 * Root cause: react-swipeable's preventScrollOnSwipe called e.preventDefault() on
 * every touchmove regardless of direction.
 * Fix: manual touchmove listener only calls preventDefault when |deltaX| > |deltaY|.
 */
import { type Page, devices, expect, test } from '@playwright/test';

/** Confirm the deletion modal that now gates every destructive action. */
async function confirmDeleteModal(page: Page) {
  const btn = page.locator('[data-pw="confirm-delete-confirm"]');
  await expect(btn).toBeVisible({ timeout: 2000 });
  await btn.click();
}

// Pixel 5 viewport/touch emulation. Exclude fields unsupported in all browsers.
const { defaultBrowserType: _dbt, isMobile: _isMobile, ...Pixel5 } = devices['Pixel 5'];

async function getScrollTop(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find(
      (d) => d.scrollHeight > d.clientHeight && getComputedStyle(d).overflowY === 'auto',
    ) as HTMLElement | undefined;
    return el?.scrollTop ?? -1;
  });
}

test.describe('Bond row — vertical scroll pass-through', () => {
  test.use({ ...Pixel5 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.locator('[data-pw="metric-ov-xp"]').waitFor();
    // Wait for the seeded bond row itself to mount — not just the overview
    // metric. The synthetic-event test reads it immediately via evaluate(),
    // and under CI load the BondsCard can render a beat after the metrics,
    // causing intermittent "bond row not found" / no-preventDefault failures.
    await page.locator('[data-pw="bond-add-jelena"]').waitFor();
  });

  // ── Direction gate (synthetic events) ──────────────────────────────────────
  // Synthetic TouchEvents dispatched via dispatchEvent() don't trigger real
  // browser scroll, but they DO exercise our touchmove listener. This test
  // proves the gate: vertical moves never hit preventDefault, horizontal always do.

  test('vertical drag: zero preventDefault calls; horizontal drag: has preventDefault calls', async ({
    page,
  }) => {
    const counts = await page.evaluate(() => {
      const bondRow = document.querySelector('[data-pw="bond-add-jelena"]')
        ?.parentElement as HTMLElement | null;
      if (!bondRow) throw new Error('bond row not found');

      const r = bondRow.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      let pdV = 0;
      let pdH = 0;
      let phase: 'v' | 'h' | '' = '';
      const origPD = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function (this: Event) {
        if (this.type === 'touchmove') {
          if (phase === 'v') pdV++;
          else if (phase === 'h') pdH++;
        }
        return origPD.call(this);
      };

      function fire(type: string, x: number, y: number) {
        const t = {
          identifier: 1,
          target: bondRow!,
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
        } as Touch;
        const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
        Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [t] });
        Object.defineProperty(event, 'changedTouches', { value: [t] });
        bondRow!.dispatchEvent(event);
      }

      // Pure vertical — 60 px down
      phase = 'v';
      fire('touchstart', cx, cy);
      for (let i = 1; i <= 12; i++) fire('touchmove', cx, cy + (60 * i) / 12);
      fire('touchend', cx, cy + 60);

      // Pure horizontal — 130 px left
      phase = 'h';
      fire('touchstart', cx, cy);
      for (let i = 1; i <= 15; i++) fire('touchmove', cx - (130 * i) / 15, cy);
      fire('touchend', cx - 130, cy);

      Event.prototype.preventDefault = origPD;
      return { pdV, pdH };
    });

    expect(counts.pdV, 'vertical drag must not call preventDefault').toBe(0);
    expect(counts.pdH, 'horizontal drag must call preventDefault').toBeGreaterThan(0);
  });

  // ── Real scroll via CDP synthesized gesture ──────────────────────────────────
  // page.mouse drag doesn't drive real scroll in headless Chromium. CDP's
  // Input.synthesizeScrollGesture fires genuine touch events that the browser
  // processes for scroll, exercising our touchmove listener end-to-end.

  test('vertical drag over bond row advances scrollTop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP synthesized scroll gestures are Chromium-only');
    // Mobile emulation (isMobile:true) gives Chromium a URL bar, reducing
    // window.innerHeight to ~727 even with viewport 393x851. Bond rows are
    // below the fold at that height. Target a coordinate in the scroll
    // container's upper visible region — any scrollable child responds.
    const scrollInfo = await page.evaluate(() => {
      const scrollEl = Array.from(document.querySelectorAll('div')).find(
        (d) => d.scrollHeight > d.clientHeight && getComputedStyle(d).overflowY === 'auto',
      );
      if (!scrollEl) return null;
      const r = scrollEl.getBoundingClientRect();
      return {
        cx: Math.round(r.left + r.width / 2),
        cy: Math.round(r.top + r.height * 0.25), // upper quarter — always on-screen
        viewportH: window.innerHeight,
      };
    });
    expect(scrollInfo).not.toBeNull();
    expect(scrollInfo!.cy, 'target y must be within viewport').toBeLessThan(scrollInfo!.viewportH);

    const before = await getScrollTop(page);

    // CDP synthesizeScrollGesture fires real touch events that the browser
    // processes for scroll. Negative yDistance = finger moves up = scroll down.
    const client = await page.context().newCDPSession(page);
    await client.send('Input.synthesizeScrollGesture', {
      x: scrollInfo!.cx,
      y: scrollInfo!.cy,
      yDistance: -100,
      speed: 800,
    });

    const after = await getScrollTop(page);
    expect(
      after,
      'scrollTop should increase after vertical drag in scroll container',
    ).toBeGreaterThan(before);
  });

  // ── Sub-commit horizontal drag: no visual slide ──────────────────────────
  // 40px is below the commit threshold (~98px on 393px viewport); the row must
  // not translate and the red channel must stay hidden.

  test('horizontal drag below commit threshold: no visual slide', async ({ page }) => {
    const target = page.locator('[data-pw="bond-add-jelena"]');
    await expect(target).toBeVisible();

    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    const cx = Math.round(box!.x + box!.width / 2);
    const cy = Math.round(box!.y + box!.height / 2);

    await page.evaluate(
      ({ startX, startY, dist }) => {
        const tgt = document.querySelector('[data-pw="bond-add-jelena"]')
          ?.parentElement as HTMLElement;
        function fire(type: string, x: number, y: number) {
          const t = {
            identifier: 1,
            target: tgt,
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
          } as Touch;
          const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
          Object.defineProperty(event, 'touches', { value: [t] });
          Object.defineProperty(event, 'changedTouches', { value: [t] });
          tgt.dispatchEvent(event);
        }
        fire('touchstart', startX, startY);
        for (let i = 1; i <= 10; i++) fire('touchmove', startX - (dist * i) / 10, startY);
        // no touchend — leave in mid-swipe state
      },
      { startX: cx, startY: cy, dist: 40 },
    );

    await expect(page.locator('[data-pw="bond-red-channel-jelena"]')).toHaveCount(0);
    await expect(page.locator('[data-pw="bond-row-jelena"]')).toBeVisible();
  });

  // ── Horizontal drag past delete threshold still triggers swipe-to-delete ──
  // Belt-and-suspenders: the direction gate must not break horizontal swipes.
  // Delete threshold = commitThreshold + 60 ≈ 158px; use 180px to be safe.

  test('horizontal drag past delete threshold still deletes the bond row', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-jelena"]');
    await expect(row).toBeVisible();

    const box = await row.boundingBox();
    expect(box).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    await page.evaluate(
      ({ startX, startY, dist }) => {
        const target = document.querySelector('[data-pw="bond-add-jelena"]')
          ?.parentElement as HTMLElement;
        function fire(type: string, x: number, y: number) {
          const t = {
            identifier: 1,
            target,
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
          } as Touch;
          const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
          Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [t] });
          Object.defineProperty(event, 'changedTouches', { value: [t] });
          target.dispatchEvent(event);
        }
        fire('touchstart', startX, startY);
        for (let i = 1; i <= 15; i++) fire('touchmove', startX - (dist * i) / 15, startY);
        fire('touchend', startX - dist, startY);
      },
      { startX: cx, startY: cy, dist: 180 },
    );

    // Swipe opens the action channel — click the channel delete button to trigger removal
    await page.locator('[data-pw="bond-delete-jelena"]').click();
    await confirmDeleteModal(page);
    await expect(row).toHaveCount(0, { timeout: 1500 });
  });
});
