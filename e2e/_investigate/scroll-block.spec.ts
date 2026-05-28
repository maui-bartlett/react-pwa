import { devices, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test('INVESTIGATION: vertical drag scrollTop + preventDefault call count', async ({ page }) => {
  await page.goto('/fab-u');
  await page.evaluate(() => localStorage.removeItem('fab-u-character'));
  await page.waitForLoadState('networkidle');

  const result = await page.evaluate(() => {
    // Scroll viewport: the flex-1 overflow-y:auto box in MobileScreen
    const allDivs = Array.from(document.querySelectorAll('div'));
    const scrollEl = allDivs.find(
      (el) => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto',
    ) as HTMLElement | null;

    const bondRow = document.querySelector('[data-pw="bond-add-jelena"]')
      ?.parentElement as HTMLElement | null;

    if (!scrollEl || !bondRow)
      return { error: `scrollEl=${!!scrollEl} bondRow=${!!bondRow}` };

    const r = bondRow.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    // Patch preventDefault to count calls on touchmove
    let pdVertical = 0;
    let pdHorizontal = 0;
    let counting: 'vertical' | 'horizontal' | 'off' = 'off';
    const origPD = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function (this: Event) {
      if (this.type === 'touchmove') {
        if (counting === 'vertical') pdVertical++;
        else if (counting === 'horizontal') pdHorizontal++;
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

    const scrollBefore = scrollEl.scrollTop;

    // ── TEST 1: pure vertical (60 px down) ──────────────────────────────
    counting = 'vertical';
    fire('touchstart', cx, cy);
    for (let i = 1; i <= 12; i++) fire('touchmove', cx, cy + (60 * i) / 12);
    fire('touchend', cx, cy + 60);
    counting = 'off';
    const scrollAfterVertical = scrollEl.scrollTop;

    // ── TEST 2: pure horizontal (130 px left) ───────────────────────────
    counting = 'horizontal';
    fire('touchstart', cx, cy);
    for (let i = 1; i <= 15; i++) fire('touchmove', cx - (130 * i) / 15, cy);
    fire('touchend', cx - 130, cy);
    counting = 'off';

    Event.prototype.preventDefault = origPD;

    return {
      scrollBefore,
      scrollAfterVertical,
      scrollChangedForVertical: scrollAfterVertical !== scrollBefore,
      pdVertical,
      pdHorizontal,
      verdict: pdVertical > 0
        ? `BUG: ${pdVertical} preventDefault calls during vertical drag — scroll blocked`
        : `OK: no preventDefault during vertical drag`,
    };
  });

  // Print so it shows up in test output
  // eslint-disable-next-line no-console
  console.log('\n=== INVESTIGATION RESULT ===\n' + JSON.stringify(result, null, 2));
});
