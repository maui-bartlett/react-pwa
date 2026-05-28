import { devices, test } from '@playwright/test';
const { defaultBrowserType: _, ...Pixel5 } = devices['Pixel 5'];
test.use({ ...Pixel5 });

test('debug coords', async ({ page }) => {
  await page.goto('/fab-u');
  await page.evaluate(() => localStorage.removeItem('fab-u-character'));
  await page.waitForLoadState('networkidle');

  const data = await page.evaluate(() => {
    const row = document.querySelector('[data-pw="bond-add-jelena"]')?.parentElement;
    const box = row?.getBoundingClientRect();
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      dpr: window.devicePixelRatio,
      rowBox: box ? { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) } : null,
    };
  });
  // eslint-disable-next-line no-console
  console.log('COORDS:', JSON.stringify(data));
});
