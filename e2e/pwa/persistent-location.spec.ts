import { expect, test } from '@playwright/test';

const locationRecord = {
  version: 1,
  pathname: '/fab-u',
  appViews: {
    'fab-u': {
      tab: 'notes',
      'combat-tab': 'gear',
    },
  },
};

test('restores the last app and tab when the standalone PWA launches at root', async ({ page }) => {
  await page.addInitScript((record) => {
    localStorage.setItem('table-top-persistent-location', JSON.stringify(record));
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      if (query !== '(display-mode: standalone)') return nativeMatchMedia(query);
      return {
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      };
    };
  }, locationRecord);

  await page.goto('/');

  await expect(page).toHaveURL('/fab-u');
  await expect(page.locator('[data-pw="header-title"]')).toHaveText('Character Notes');
});

test('does not redirect an ordinary browser visit away from the home page', async ({ page }) => {
  await page.addInitScript((record) => {
    localStorage.setItem('table-top-persistent-location', JSON.stringify(record));
  }, locationRecord);

  await page.goto('/');

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Table-TopOnline');
});
