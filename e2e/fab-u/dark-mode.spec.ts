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

  // ── Section labels are yellow in dark mode ─────────────────────────────────
  // SectionLabel renders with data-pw="section-label" and bgcolor=highlight.
  // Dark: highlight = #c5a557 ≈ rgb(197, 165, 87) — R > G (yellow).
  // Light: highlight = brand  = #315c4d ≈ rgb(49,  92, 77) — G > R (green).

  test('section labels render in yellow accent (not green) in dark mode', async ({ page }) => {
    const labelBgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-pw="section-label"]')).map(
        (el) => getComputedStyle(el).backgroundColor,
      );
    });
    expect(labelBgs.length, 'should find section-label elements').toBeGreaterThan(0);
    for (const bg of labelBgs) {
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      expect(match, `section label bg should be an rgb color, got: ${bg}`).toBeTruthy();
      const r = parseInt(match![1]);
      const g = parseInt(match![2]);
      // Yellow (#c5a557): R≈197 > G≈165. Green (#315c4d): R≈49 < G≈92.
      expect(
        r,
        `section label bg should be yellow-ish (R=${r} > G=${g}), got: ${bg}`,
      ).toBeGreaterThan(g);
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

  // ── Light mode regression ──────────────────────────────────────────────────

  test('light mode still works — section labels are green', async ({ page }) => {
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
      // Light mode brand = #315c4d ≈ rgb(49, 92, 77) — G > R (green).
      expect(
        g,
        `section label in light mode should be green (G=${g} > R=${r}), got: ${bg}`,
      ).toBeGreaterThan(r);
    }
  });

  // ── Theme toggle works ─────────────────────────────────────────────────────

  test('theme toggle button exists and switches from dark to light', async ({ page }) => {
    const toggle = page.locator('[data-pw="theme-toggle"]');
    await expect(toggle).toBeVisible();

    // Currently dark — section labels should be yellow.
    const darkLabelBgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-pw="section-label"]')).map(
        (el) => getComputedStyle(el).backgroundColor,
      ),
    );
    expect(darkLabelBgs.length).toBeGreaterThan(0);
    for (const bg of darkLabelBgs) {
      const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) expect(parseInt(m[1])).toBeGreaterThan(parseInt(m[2])); // R > G = yellow
    }

    // Click toggle → light mode.
    await toggle.click();
    await page.waitForTimeout(150);

    // Section labels should now be green (light mode).
    const lightLabelBgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-pw="section-label"]')).map(
        (el) => getComputedStyle(el).backgroundColor,
      ),
    );
    expect(lightLabelBgs.length).toBeGreaterThan(0);
    for (const bg of lightLabelBgs) {
      const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) expect(parseInt(m[2])).toBeGreaterThan(parseInt(m[1])); // G > R = green
    }
  });
});
