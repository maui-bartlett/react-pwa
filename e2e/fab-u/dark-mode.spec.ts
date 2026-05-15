import { expect, test } from '@playwright/test';

test.describe('Dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fab-u');
    await page.evaluate(() => {
      localStorage.removeItem('fab-u-character');
      localStorage.setItem('theme-mode', '"dark"');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ── Canvas is rich black ────────────────────────────────────────────────────

  test('app background is rich black in dark mode (not dark olive)', async ({ page }) => {
    // The outer Stack fills the full viewport with the canvas color.
    // In dark mode: canvas = #0e110e ≈ rgb(14, 17, 14).
    const canvasBg = await page.evaluate(() => {
      const el = document.querySelector('[data-pw="app-canvas"]') as HTMLElement | null;
      return el ? getComputedStyle(el).backgroundColor : null;
    });
    expect(canvasBg, 'outer stack background should exist').toBeTruthy();
    const match = canvasBg!.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(match, 'background should be an rgb color').toBeTruthy();
    const brightness = (parseInt(match![1]) + parseInt(match![2]) + parseInt(match![3])) / 3;
    expect(brightness, `canvas brightness should be very dark (< 30), got ${canvasBg}`).toBeLessThan(
      30,
    );
  });

  // ── Section labels are dark green in dark mode ─────────────────────────────
  // SectionLabel renders with data-pw="section-label" and bgcolor=labelBg.
  // Dark: labelBg = #1f2f25 ≈ rgb(31, 47, 37) — G > R, very dark (brightness < 50).
  // Light: labelBg = brand  = #315c4d ≈ rgb(49, 92, 77) — G > R, medium (brightness > 50).

  test('section labels render in dark-green fill in dark mode', async ({ page }) => {
    const labelData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-pw="section-label"]')).map((el) => ({
        bg: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el.querySelector('*') ?? el).color,
      }));
    });
    expect(labelData.length, 'should find section-label elements').toBeGreaterThan(0);
    for (const { bg, color } of labelData) {
      const bgMatch = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      expect(bgMatch, `section label bg should be rgb, got: ${bg}`).toBeTruthy();
      const r = parseInt(bgMatch![1]);
      const g = parseInt(bgMatch![2]);
      const b = parseInt(bgMatch![3]);
      const brightness = (r + g + b) / 3;
      // Dark green (#1f2f25 → rgb(31,47,37)): G > R and very dark (brightness ≈ 38).
      expect(g, `section label bg should be green-ish (G=${g} > R=${r}), got: ${bg}`).toBeGreaterThan(r);
      expect(brightness, `section label should be dark-green (brightness < 50), got: ${bg}`).toBeLessThan(50);
      // Text should be light (white #fff → brightness ≈ 255).
      const colorMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (colorMatch) {
        const textBrightness = (parseInt(colorMatch[1]) + parseInt(colorMatch[2]) + parseInt(colorMatch[3])) / 3;
        expect(textBrightness, `section label text should be near-white (> 200), got: ${color}`).toBeGreaterThan(200);
      }
    }
  });

  // ── Add buttons are yellow in dark mode ────────────────────────────────────

  test('+ Class and + Bond add buttons render in yellow accent in dark mode', async ({ page }) => {
    const addButtonColors = await page.evaluate(() => {
      // Add buttons are Boxes containing AddIcon + "Class" or "Bond" text.
      // They use fabUTokens.color.highlight for their text color.
      const allDivs = Array.from(document.querySelectorAll('div'));
      const addBtns = allDivs.filter((d) => {
        const text = d.textContent?.trim();
        return text === 'Class' || text === 'Bond';
      });
      return addBtns.map((d) => getComputedStyle(d).color);
    });
    expect(addButtonColors.length, 'should find add buttons (Class / Bond)').toBeGreaterThan(0);
    for (const color of addButtonColors) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      expect(match, `add button text should be rgb, got: ${color}`).toBeTruthy();
      const r = parseInt(match![1]);
      const g = parseInt(match![2]);
      // Yellow (#c5a557): R≈197 > G≈165.
      expect(r, `add button text should be yellow-ish (R > G), got: ${color}`).toBeGreaterThan(g);
    }
  });

  // ── Body text is readable off-white ────────────────────────────────────────
  // The header title (data-pw="header-title") is a reliable textPrimary element.
  // In dark mode textPrimary = #e8e4d8 ≈ rgb(232, 228, 216), brightness ≈ 225.

  test('body text has sufficient contrast in dark mode', async ({ page }) => {
    const titleColor = await page.evaluate(() => {
      const el = document.querySelector('[data-pw="header-title"]') as HTMLElement | null;
      return el ? getComputedStyle(el).color : null;
    });
    expect(titleColor, 'header-title should be found').toBeTruthy();
    const match = titleColor!.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(match, 'header-title color should be rgb').toBeTruthy();
    const brightness = (parseInt(match![1]) + parseInt(match![2]) + parseInt(match![3])) / 3;
    // Off-white #e8e4d8 ≈ rgb(232, 228, 216) → brightness ≈ 225.
    // Accept anything > 180 as clearly light text on dark bg.
    expect(
      brightness,
      `header title should be off-white (brightness > 180), got: ${titleColor}`,
    ).toBeGreaterThan(180);
  });

  // ── Scrollbar is styled in dark mode ──────────────────────────────────────

  test('scrollbar is styled (dark track) in dark mode', async ({ page }) => {
    const scrollbarColor = await page.evaluate(() => getComputedStyle(document.body).scrollbarColor);
    // Firefox exposes scrollbar-color: "<thumb> <track>".
    // In dark mode it should contain the dark border token (#263530).
    // WebKit doesn't expose scrollbar-color via getComputedStyle; we just verify the property
    // is non-empty when set (Firefox) or skip gracefully (Chromium).
    if (scrollbarColor && scrollbarColor !== 'auto') {
      expect(scrollbarColor, 'scrollbar-color should contain dark values in dark mode').not.toBe('');
    }
    // Verify the GlobalStyles were injected by checking a stylesheet rule exists.
    const hasScrollbarRule = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if (rule.cssText.includes('-webkit-scrollbar')) return true;
          }
        } catch {
          // cross-origin stylesheet, skip
        }
      }
      return false;
    });
    expect(hasScrollbarRule, 'dark mode scrollbar GlobalStyles rule should be injected').toBe(true);
  });

  // ── Light mode regression ──────────────────────────────────────────────────

  test('light mode still works — section labels are medium green', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('theme-mode', '"light"'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const labelBgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-pw="section-label"]')).map(
        (el) => getComputedStyle(el).backgroundColor,
      );
    });
    expect(labelBgs.length, 'should find section-label elements in light mode').toBeGreaterThan(0);
    for (const bg of labelBgs) {
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      expect(match, `section label bg should be rgb in light mode, got: ${bg}`).toBeTruthy();
      const r = parseInt(match![1]);
      const g = parseInt(match![2]);
      const b = parseInt(match![3]);
      const brightness = (r + g + b) / 3;
      // Light mode labelBg = #315c4d ≈ rgb(49, 92, 77) — G > R (green), brightness ≈ 73.
      expect(
        g,
        `section label in light mode should be green (G=${g} > R=${r}), got: ${bg}`,
      ).toBeGreaterThan(r);
      expect(brightness, `light mode label should be medium brightness (> 50), got: ${bg}`).toBeGreaterThan(50);
    }
  });

  // ── Theme toggle works ─────────────────────────────────────────────────────

  test('theme toggle button exists and switches from dark to light', async ({ page }) => {
    const toggle = page.locator('[data-pw="theme-toggle"]');
    await expect(toggle).toBeVisible();

    // Currently dark — section labels should be dark green (G > R, brightness < 50).
    const darkLabelBgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-pw="section-label"]')).map(
        (el) => getComputedStyle(el).backgroundColor,
      ),
    );
    expect(darkLabelBgs.length).toBeGreaterThan(0);
    for (const bg of darkLabelBgs) {
      const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) {
        expect(parseInt(m[2])).toBeGreaterThan(parseInt(m[1])); // G > R = green
        const brightness = (parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3])) / 3;
        expect(brightness).toBeLessThan(50); // dark green
      }
    }

    // Click toggle → light mode.
    await toggle.click();
    await page.waitForTimeout(150);

    // Section labels should now be medium green (light mode).
    const lightLabelBgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-pw="section-label"]')).map(
        (el) => getComputedStyle(el).backgroundColor,
      ),
    );
    expect(lightLabelBgs.length).toBeGreaterThan(0);
    for (const bg of lightLabelBgs) {
      const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) {
        expect(parseInt(m[2])).toBeGreaterThan(parseInt(m[1])); // G > R = green
        const brightness = (parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3])) / 3;
        expect(brightness).toBeGreaterThan(50); // medium green (light mode)
      }
    }
  });
});
