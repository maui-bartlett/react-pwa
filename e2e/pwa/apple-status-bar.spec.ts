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

test('exposes the site install icons before the app mounts', async ({ page }) => {
  await page.route('**/src/main.tsx', (route) => route.abort());
  await page.goto('/avatar-legends');

  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png',
  );
});

test('uses one root launch route across the site', async ({ page }) => {
  await page.goto('/avatar-legends');

  const manifest = await page.locator('link[rel="manifest"]').evaluate(async (link) => {
    const response = await fetch((link as HTMLLinkElement).href);
    return response.json() as Promise<{ id?: string; start_url?: string; scope?: string }>;
  });

  expect(manifest).toMatchObject({
    id: '/',
    start_url: '/',
    scope: '/',
  });
});

test('returns to the Table Top home from Avatar Legends', async ({ page }) => {
  await page.goto('/avatar-legends');

  const homeLink = page.getByRole('link', { name: 'Back to Table Top home' });
  await expect(homeLink).toHaveAttribute('href', '/');
  await homeLink.click();

  await expect(page).toHaveURL('/');
});
