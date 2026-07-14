import { type Page, expect, test } from '@playwright/test';

async function mockBraveBrowser(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'brave', {
      configurable: true,
      value: {
        isBrave: () => Promise.resolve(true),
      },
    });
  });
}

async function expectBraveBrowserClass(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains('is-brave-browser')))
    .toBe(true);
}

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

test('keeps Brave on the static installable manifest URL', async ({ page }) => {
  await mockBraveBrowser(page);

  await page.goto('/avatar-legends');

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
});

test('lifts app footer navigation into the Brave safe area', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockBraveBrowser(page);

  await page.goto('/avatar-legends');
  await expectBraveBrowserClass(page);
  await expect(page.locator('[data-pw="avatar-bottom-nav"]')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('[data-pw="avatar-bottom-nav"]')
        .evaluate((element) => parseFloat(getComputedStyle(element).paddingBottom)),
    )
    .toBeGreaterThanOrEqual(60);

  await page.goto('/dungeons-and-dragons');
  await expectBraveBrowserClass(page);
  await expect(page.locator('[data-pw="dnd-bottom-nav"]')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('[data-pw="dnd-bottom-nav"]')
        .evaluate((element) => parseFloat(getComputedStyle(element).bottom)),
    )
    .toBeGreaterThanOrEqual(55);

  await page.goto('/fab-u');
  await expectBraveBrowserClass(page);
  await expect(page.locator('[data-pw="app-footer"]')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('[data-pw="app-footer"]')
        .evaluate((element) => parseFloat(getComputedStyle(element).paddingBottom)),
    )
    .toBeGreaterThanOrEqual(60);
});

test('home install button uses the browser install prompt when available', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-pw="home-install-pwa"]')).toBeVisible();

  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>;
    };
    event.prompt = () => {
      window.sessionStorage.setItem('pwa-install-prompt-called', '1');
      return Promise.resolve();
    };
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    window.dispatchEvent(event);
  });

  await page.locator('[data-pw="home-install-pwa"]').click();

  await expect
    .poll(() => page.evaluate(() => window.sessionStorage.getItem('pwa-install-prompt-called')))
    .toBe('1');
  await expect(page.locator('[data-pw="home-install-pwa-message"]')).toHaveText('Installing.');
});

test('home install button gives Brave install guidance without a prompt event', async ({
  page,
}) => {
  await mockBraveBrowser(page);

  await page.goto('/');
  await page.locator('[data-pw="home-install-pwa"]').click();

  await expect(page.locator('[data-pw="home-install-pwa-message"]')).toHaveText(
    'In Brave, use the address bar install icon or Brave menu to install.',
  );
});

test('returns to the Table Top home from Avatar Legends', async ({ page }) => {
  await page.goto('/avatar-legends');

  const homeLink = page.getByRole('link', { name: 'Back to Table Top home' });
  await expect(homeLink).toHaveAttribute('href', '/');
  await homeLink.click();

  await expect(page).toHaveURL('/');
});

test('returns to the Table Top home from Fabula Ultima', async ({ page }) => {
  await page.goto('/fab-u');

  const homeLink = page.getByRole('link', { name: 'Back to Table Top home' });
  await expect(homeLink).toHaveAttribute('href', '/');
  await homeLink.click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Table-TopOnline');
});
