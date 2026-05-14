import { type Page, devices, expect, test } from '@playwright/test';

test.use({ viewport: devices['Pixel 5'].viewport });

test.describe('Bond swipe-to-delete (mobile viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // Dispatch raw touch events to the inner swipe-handler Stack.
  // Uses the inner Stack (parent of bond-add-{id}) as target so the
  // events land directly on the element react-swipeable is attached to,
  // avoiding any overlap with the absolutely-positioned footer.
  async function touchSwipeLeft(page: Page, bondId: string, distancePx = 130) {
    await page.evaluate(
      ({ id, dist }) => {
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

        const steps = 15;
        target.dispatchEvent(makeTouchEvent('touchstart', cx, cy));
        for (let i = 1; i <= steps; i++) {
          target.dispatchEvent(makeTouchEvent('touchmove', cx - Math.round((dist * i) / steps), cy));
        }
        target.dispatchEvent(makeTouchEvent('touchend', cx - dist, cy));
      },
      { id: bondId, dist: distancePx },
    );
  }

  // Dispatch touchstart + touchmoves without touchend — leaves row in mid-swipe state.
  async function touchSwipeLeftPartial(page: Page, bondId: string, distancePx: number) {
    await page.evaluate(
      ({ id, dist }) => {
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
            touches: [touch],
            changedTouches: [touch],
            bubbles: true,
            cancelable: true,
          });
        }

        const steps = 15;
        target.dispatchEvent(makeTouchEvent('touchstart', cx, cy));
        for (let i = 1; i <= steps; i++) {
          target.dispatchEvent(makeTouchEvent('touchmove', cx - Math.round((dist * i) / steps), cy));
        }
        // No touchend — row stays in mid-swipe state
      },
      { id: bondId, dist: distancePx },
    );
  }

  // ── Threshold removes bond ────────────────────────────────────────────────

  test('Swipe left past threshold removes bond row and updates storage', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-jelena"]');
    await expect(row).toBeVisible();

    await touchSwipeLeft(page, 'jelena');

    // Row removed from DOM after collapse animation
    await expect(row).toHaveCount(0, { timeout: 1500 });

    const stored = await page.evaluate(() => localStorage.getItem('fab-u-character'));
    expect(stored).not.toContain('Jelena');
  });

  // ── Sub-threshold springs back ────────────────────────────────────────────

  test('Swipe left below threshold springs row back, bond stays', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-jelena"]');
    // Drag only 50px (below 100px threshold)
    await touchSwipeLeft(page, 'jelena', 50);

    // Row should remain visible
    await expect(row).toBeVisible();
    await expect(page.locator('text=Jelena').first()).toBeVisible();
  });

  // ── Child control tap doesn't delete ─────────────────────────────────────

  test('Tapping + button opens menu without removing bond', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-jelena"]');
    await expect(row).toBeVisible();

    // Simple click on the + button
    await page.locator('[data-pw="bond-add-jelena"]').click();

    // Menu should open
    await expect(page.locator('[role="menu"]')).toBeVisible();
    await page.keyboard.press('Escape');

    // Row still present
    await expect(row).toBeVisible();
    await expect(row).toHaveCount(1);
  });

  // ── Desktop × button removes bond ────────────────────────────────────────

  test('Click × button removes bond row', async ({ page }) => {
    const row = page.locator('[data-pw="bond-row-yoru"]');
    await expect(row).toBeVisible();

    // The × button is opacity:0 normally; force-click it
    await page.locator('[data-pw="bond-delete-yoru"]').click({ force: true });

    await expect(row).toHaveCount(0, { timeout: 1500 });

    const stored = await page.evaluate(() => localStorage.getItem('fab-u-character'));
    expect(stored).not.toContain('Yoru');
  });

  // ── Cross-card sync ───────────────────────────────────────────────────────

  test('Remove on Overview → bond gone from Combat > Bonds subtab', async ({ page }) => {
    await touchSwipeLeft(page, 'granada');
    await expect(page.locator('[data-pw="bond-row-granada"]')).toHaveCount(0, { timeout: 1500 });

    await page.getByRole('button', { name: 'Combat' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-pw="bond-row-granada"]')).toHaveCount(0);
    await expect(page.locator('text=Granada')).toHaveCount(0);
  });

  // ── Persistence after reload ──────────────────────────────────────────────

  test('Removed bond does not reappear after reload', async ({ page }) => {
    await touchSwipeLeft(page, 'juice');
    await expect(page.locator('[data-pw="bond-row-juice"]')).toHaveCount(0, { timeout: 1500 });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-pw="bond-row-juice"]')).toHaveCount(0);
    await expect(page.locator('text=Juice')).toHaveCount(0);
  });

  // ── Red channel + trash icon at mid-swipe (-50 px) ───────────────────────

  test('Mid-swipe -50px: red channel visible, trash opacity≈0.5, scale≈0.8', async ({ page }) => {
    await touchSwipeLeftPartial(page, 'jelena', 50);

    const redChannel = page.locator('[data-pw="bond-red-channel-jelena"]');
    await expect(redChannel).toBeVisible();

    const trash = page.locator('[data-pw="bond-trash-jelena"]');
    await expect(trash).toBeVisible();

    const opacity = await trash.evaluate((el) => (el as HTMLElement).style.opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.5, 1);

    const transform = await trash.evaluate((el) => (el as HTMLElement).style.transform);
    expect(transform).toContain('scale(0.8)');
  });

  // ── Red channel + trash icon at full threshold (-100 px, no touchend) ────

  test('Mid-swipe -100px: red channel visible, trash opacity=1, scale=1', async ({ page }) => {
    await touchSwipeLeftPartial(page, 'jelena', 100);

    const redChannel = page.locator('[data-pw="bond-red-channel-jelena"]');
    await expect(redChannel).toBeVisible();

    const trash = page.locator('[data-pw="bond-trash-jelena"]');
    await expect(trash).toBeVisible();

    const opacity = await trash.evaluate((el) => (el as HTMLElement).style.opacity);
    expect(parseFloat(opacity)).toBeCloseTo(1, 1);

    const transform = await trash.evaluate((el) => (el as HTMLElement).style.transform);
    expect(transform).toContain('scale(1)');
  });
});

// ── Mobile full emulation: × button NOT rendered ─────────────────────────

test.describe('Bond × button absent on touch device', () => {
  test.use({ viewport: devices['Pixel 5'].viewport, hasTouch: true, isMobile: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('× button not in DOM when pointer is coarse (touch device)', async ({ page }) => {
    await expect(page.locator('[data-pw="bond-delete-jelena"]')).toHaveCount(0);
  });
});

// ── Desktop: × button IS rendered ────────────────────────────────────────

test.describe('Bond × button present on desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => localStorage.removeItem('fab-u-character'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('× button is in DOM on desktop (hover: hover, pointer: fine)', async ({ page }) => {
    await expect(page.locator('[data-pw="bond-delete-jelena"]')).toHaveCount(1);
  });
});
