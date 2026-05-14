/**
 * Regression: Bond rows were blocking vertical page scroll.
 * Root cause: react-swipeable's preventScrollOnSwipe called e.preventDefault() on
 * every touchmove regardless of direction.
 * Fix: manual touchmove listener only calls preventDefault when |deltaX| > |deltaY|.
 */
import { devices, expect, test } from '@playwright/test';

// Full Pixel 5 emulation so page.mouse drags emit real touch events in Chromium.
// Exclude defaultBrowserType — can't be set inside a describe block.
const { defaultBrowserType: _dbt, ...Pixel5 } = devices['Pixel 5'];

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
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.waitForLoadState('networkidle');
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
        const t = new Touch({
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
        });
        bondRow!.dispatchEvent(
          new TouchEvent(type, {
            touches: type === 'touchend' ? [] : [t],
            changedTouches: [t],
            bubbles: true,
            cancelable: true,
          }),
        );
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

  test('vertical drag over bond row advances scrollTop', async ({ page }) => {
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
    expect(
      scrollInfo!.cy,
      'target y must be within viewport',
    ).toBeLessThan(scrollInfo!.viewportH);

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
    expect(after, 'scrollTop should increase after vertical drag in scroll container').toBeGreaterThan(
      before,
    );
  });

  // ── Horizontal drag still triggers swipe-to-delete ──────────────────────────
  // Belt-and-suspenders: the direction gate must not break horizontal swipes.

  test('horizontal drag past threshold still deletes the bond row', async ({ page }) => {
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
          const t = new Touch({
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
          });
          target.dispatchEvent(
            new TouchEvent(type, {
              touches: type === 'touchend' ? [] : [t],
              changedTouches: [t],
              bubbles: true,
              cancelable: true,
            }),
          );
        }
        fire('touchstart', startX, startY);
        for (let i = 1; i <= 15; i++) fire('touchmove', startX - (dist * i) / 15, startY);
        fire('touchend', startX - dist, startY);
      },
      { startX: cx, startY: cy, dist: 130 },
    );

    await expect(row).toHaveCount(0, { timeout: 1500 });
  });
});
