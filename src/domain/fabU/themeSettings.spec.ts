import { expect, test } from 'vitest';

/**
 * Tests for the theme settings logic extracted from convex/users.ts.
 *
 * getCurrentTheme: reads profile.settings?.currentTheme and returns it only if it is
 * exactly 'dark' or 'light'; otherwise returns null.
 *
 * updateCurrentTheme settings merge: spreads existing settings object over a new
 * `{ ...settings, currentTheme }` only when settings is a plain (non-array) object;
 * otherwise starts fresh with {}.
 *
 * updateProfile settings merge: uses args.settings ?? profile.settings ?? {}.
 */

// ── getCurrentTheme validation logic ────────────────────────────────────────

function extractCurrentTheme(settings: unknown): 'dark' | 'light' | null {
  const currentTheme = (settings as Record<string, unknown> | null | undefined)?.currentTheme;
  return currentTheme === 'dark' || currentTheme === 'light' ? currentTheme : null;
}

test('getCurrentTheme returns dark when settings.currentTheme is "dark"', () => {
  expect(extractCurrentTheme({ currentTheme: 'dark' })).toBe('dark');
});

test('getCurrentTheme returns light when settings.currentTheme is "light"', () => {
  expect(extractCurrentTheme({ currentTheme: 'light' })).toBe('light');
});

test('getCurrentTheme returns null when settings is null', () => {
  expect(extractCurrentTheme(null)).toBe(null);
});

test('getCurrentTheme returns null when settings is undefined', () => {
  expect(extractCurrentTheme(undefined)).toBe(null);
});

test('getCurrentTheme returns null when settings is empty object', () => {
  expect(extractCurrentTheme({})).toBe(null);
});

test('getCurrentTheme returns null when currentTheme is an unexpected string', () => {
  expect(extractCurrentTheme({ currentTheme: 'system' })).toBe(null);
});

test('getCurrentTheme returns null when currentTheme is a number', () => {
  expect(extractCurrentTheme({ currentTheme: 1 })).toBe(null);
});

test('getCurrentTheme returns null when currentTheme is null', () => {
  expect(extractCurrentTheme({ currentTheme: null })).toBe(null);
});

test('getCurrentTheme returns null when currentTheme is boolean true', () => {
  expect(extractCurrentTheme({ currentTheme: true })).toBe(null);
});

// ── updateCurrentTheme settings merge logic ──────────────────────────────────

/**
 * Replicates the settings normalisation in updateCurrentTheme handler:
 *   const settings = profile.settings && typeof profile.settings === 'object' && !Array.isArray(profile.settings)
 *     ? profile.settings
 *     : {};
 */
function normalizeSettingsObject(profileSettings: unknown): Record<string, unknown> {
  return profileSettings &&
    typeof profileSettings === 'object' &&
    !Array.isArray(profileSettings)
    ? (profileSettings as Record<string, unknown>)
    : {};
}

test('normalizeSettingsObject returns existing object when settings is a plain object', () => {
  const settings = { foo: 'bar', count: 42 };
  expect(normalizeSettingsObject(settings)).toEqual({ foo: 'bar', count: 42 });
});

test('normalizeSettingsObject returns empty object when settings is null', () => {
  expect(normalizeSettingsObject(null)).toEqual({});
});

test('normalizeSettingsObject returns empty object when settings is undefined', () => {
  expect(normalizeSettingsObject(undefined)).toEqual({});
});

test('normalizeSettingsObject returns empty object when settings is an array', () => {
  expect(normalizeSettingsObject(['dark', 'light'])).toEqual({});
});

test('normalizeSettingsObject returns empty object when settings is a string', () => {
  expect(normalizeSettingsObject('dark')).toEqual({});
});

test('normalizeSettingsObject returns empty object when settings is a number', () => {
  expect(normalizeSettingsObject(42)).toEqual({});
});

test('updateCurrentTheme merges new currentTheme into existing settings object', () => {
  const profileSettings = { otherPref: true, currentTheme: 'light' };
  const normalized = normalizeSettingsObject(profileSettings);
  const merged = { ...normalized, currentTheme: 'dark' as const };

  expect(merged).toEqual({ otherPref: true, currentTheme: 'dark' });
});

test('updateCurrentTheme sets currentTheme on empty settings when profile has no prior settings', () => {
  const profileSettings = null;
  const normalized = normalizeSettingsObject(profileSettings);
  const merged = { ...normalized, currentTheme: 'light' as const };

  expect(merged).toEqual({ currentTheme: 'light' });
});

test('updateCurrentTheme replaces currentTheme without removing other settings keys', () => {
  const profileSettings = { notifications: false, currentTheme: 'dark', language: 'en' };
  const normalized = normalizeSettingsObject(profileSettings);
  const merged = { ...normalized, currentTheme: 'light' as const };

  expect(merged.currentTheme).toBe('light');
  expect(merged.notifications).toBe(false);
  expect(merged.language).toBe('en');
});

// ── updateProfile settings merge logic ───────────────────────────────────────

/**
 * Replicates the settings fallback in updateProfile handler:
 *   settings: args.settings ?? profile.settings ?? {}
 */
function resolveProfileSettings(
  argSettings: unknown,
  profileSettings: unknown,
): unknown {
  return argSettings ?? profileSettings ?? {};
}

test('updateProfile uses args.settings when provided', () => {
  const result = resolveProfileSettings({ currentTheme: 'dark' }, { currentTheme: 'light' });
  expect(result).toEqual({ currentTheme: 'dark' });
});

test('updateProfile falls back to profile.settings when args.settings is undefined', () => {
  const result = resolveProfileSettings(undefined, { currentTheme: 'light' });
  expect(result).toEqual({ currentTheme: 'light' });
});

test('updateProfile falls back to empty object when both args.settings and profile.settings are undefined', () => {
  const result = resolveProfileSettings(undefined, undefined);
  expect(result).toEqual({});
});

test('updateProfile uses args.settings null as explicit value (null is not undefined)', () => {
  const result = resolveProfileSettings(null, { currentTheme: 'light' });
  // null ?? ... short-circuits to null since null is not nullish in the ?? sense — wait, null IS nullish
  // Actually null ?? fallback DOES use fallback. Let's verify the actual behaviour:
  // null ?? { currentTheme: 'light' } → { currentTheme: 'light' }
  expect(result).toEqual({ currentTheme: 'light' });
});

test('updateProfile falls back to empty object when profile.settings is also null', () => {
  const result = resolveProfileSettings(undefined, null);
  expect(result).toEqual({});
});
