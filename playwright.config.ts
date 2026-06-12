import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

import { createDefaultCharacter } from './src/domain/fabU/characterDefaults';

const PORT = process.env.CI ? 4173 : 5173;
const BASE_URL = `http://localhost:${PORT}`;
const defaultFabUCharacter = createDefaultCharacter();
let pwaVersion: string;

try {
  const manifest = JSON.parse(
    readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'),
  ) as Record<string, unknown>;

  if (typeof manifest.pwa_version !== 'string') {
    throw new Error('manifest.json is missing a valid pwa_version');
  }

  pwaVersion = manifest.pwa_version;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`Failed to load the PWA version: ${message}`);
}

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    testIdAttribute: 'data-pw',
    baseURL: BASE_URL,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [
            {
              name: 'fab-u-character',
              value: JSON.stringify(defaultFabUCharacter),
            },
            {
              name: 'table-top-last-seen-version',
              value: pwaVersion,
            },
          ],
        },
      ],
    },
  },

  timeout: 30 * 1000,

  /* Configure projects for major browsers */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },

    { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI ? 'npm run build && npm run preview' : 'npm run dev',
    url: `http://localhost:${PORT}`,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
});
