import { expect, test } from '@playwright/test';

test('declares translucent iOS standalone status bar support', async ({ page }) => {
  await page.goto('/avatar-legends');

  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
    'content',
    'yes',
  );
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute(
    'content',
    'black-translucent',
  );
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /viewport-fit=cover/,
  );
});

test('exposes Avatar Legends install icons before the app mounts', async ({ page }) => {
  await page.route('**/src/main.tsx', (route) => route.abort());
  await page.goto('/avatar-legends');

  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    'href',
    '/avatar-legends-pwa-192x192.png',
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/avatar-legends-pwa-512x512.png',
  );
});

test('sets Avatar Legends as its installed launch route', async ({ page }) => {
  await page.goto('/avatar-legends');

  const manifest = await page.locator('link[rel="manifest"]').evaluate(async (link) => {
    const response = await fetch((link as HTMLLinkElement).href);
    return response.json() as Promise<{ id?: string; start_url?: string; scope?: string }>;
  });

  expect(manifest).toMatchObject({
    id: '/avatar-legends',
    start_url: '/avatar-legends',
    scope: '/',
  });
});
