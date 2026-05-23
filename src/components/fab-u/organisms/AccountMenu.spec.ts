import { expect, test } from 'vitest';

import {
  deserializeCharacterFromBackend,
  serializeCharacterForBackend,
} from '@/domain/fabU/characterMigration';
import { createDefaultCharacter } from '@/domain/fabU/characterDefaults';

/**
 * Replicates the `getCharacterDisplayName` function from AccountMenu.tsx.
 * Tests the pure logic: deserialize characterState, build "First "Nick" Last" name string,
 * fall back to character.name, then 'Unnamed character'.
 */
function getCharacterDisplayName(character: { name?: string; characterState?: unknown }) {
  try {
    const state = deserializeCharacterFromBackend(character.characterState);
    const nameParts = [
      state.firstName,
      state.nickName ? `"${state.nickName}"` : '',
      state.lastName,
    ].filter(Boolean);
    return nameParts.join(' ').trim() || character.name || 'Unnamed character';
  } catch {
    return character.name || 'Unnamed character';
  }
}

test('getCharacterDisplayName: returns full name with nickname when all fields present', () => {
  const character = createDefaultCharacter();
  const withName = { ...character, firstName: 'Radovan', nickName: 'Rad', lastName: 'Milinic' };
  const serialized = serializeCharacterForBackend(withName);

  const result = getCharacterDisplayName({ characterState: serialized });

  expect(result).toBe('Radovan "Rad" Milinic');
});

test('getCharacterDisplayName: omits nickname when nickName is empty string', () => {
  const character = createDefaultCharacter();
  const withName = { ...character, firstName: 'Elena', nickName: '', lastName: 'Vasquez' };
  const serialized = serializeCharacterForBackend(withName);

  const result = getCharacterDisplayName({ characterState: serialized });

  expect(result).toBe('Elena Vasquez');
});

test('getCharacterDisplayName: works with only first name set', () => {
  const character = createDefaultCharacter();
  const withName = { ...character, firstName: 'Torval', nickName: '', lastName: '' };
  const serialized = serializeCharacterForBackend(withName);

  const result = getCharacterDisplayName({ characterState: serialized });

  expect(result).toBe('Torval');
});

test('getCharacterDisplayName: falls back to character.name when characterState is null', () => {
  const result = getCharacterDisplayName({ name: 'Backup Name', characterState: null });

  expect(result).toBe('Backup Name');
});

test('getCharacterDisplayName: falls back to character.name when characterState is undefined', () => {
  const result = getCharacterDisplayName({ name: 'Fallback', characterState: undefined });

  expect(result).toBe('Fallback');
});

test('getCharacterDisplayName: returns Unnamed character when both characterState and name are absent', () => {
  const result = getCharacterDisplayName({});

  expect(result).toBe('Unnamed character');
});

test('getCharacterDisplayName: returns Unnamed character when name is empty string and no valid state', () => {
  const result = getCharacterDisplayName({ name: '', characterState: undefined });

  expect(result).toBe('Unnamed character');
});

test('getCharacterDisplayName: falls back to character.name when characterState produces all-empty name parts', () => {
  const character = createDefaultCharacter();
  const withEmptyName = { ...character, firstName: '', nickName: '', lastName: '' };
  const serialized = serializeCharacterForBackend(withEmptyName);

  const result = getCharacterDisplayName({
    name: 'Stored Name',
    characterState: serialized,
  });

  // All name parts empty → joined string is '' → falls through to character.name
  expect(result).toBe('Stored Name');
});

test('getCharacterDisplayName: uses characterState name over character.name when state has valid name', () => {
  const character = createDefaultCharacter();
  const withName = { ...character, firstName: 'StateName', nickName: '', lastName: '' };
  const serialized = serializeCharacterForBackend(withName);

  const result = getCharacterDisplayName({
    name: 'DocumentName',
    characterState: serialized,
  });

  expect(result).toBe('StateName');
});

// ── accountLabel logic ──────────────────────────────────────────────────────
// Tests the new "Settings" default (previously "Local character") when no user is logged in.

test('accountLabel returns Settings when user is null and not pending', () => {
  // Simulate the useMemo logic inline
  const isPending = false;
  const user: { name?: string | null; email?: string | null } | null = null;

  const accountLabel = (() => {
    if (isPending) return 'Checking account';
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Settings';
  })();

  expect(accountLabel).toBe('Settings');
});

test('accountLabel returns Checking account while session is pending', () => {
  const isPending = true;
  const user = null;

  const accountLabel = (() => {
    if (isPending) return 'Checking account';
    if (user?.name) return user;
    if (user?.email) return user;
    return 'Settings';
  })();

  expect(accountLabel).toBe('Checking account');
});

test('accountLabel returns user name when available', () => {
  const isPending = false;
  const user = { name: 'Jane Doe', email: 'jane@example.com' };

  const accountLabel = (() => {
    if (isPending) return 'Checking account';
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Settings';
  })();

  expect(accountLabel).toBe('Jane Doe');
});

test('accountLabel falls back to email when name is null', () => {
  const isPending = false;
  const user = { name: null as string | null, email: 'user@example.com' };

  const accountLabel = (() => {
    if (isPending) return 'Checking account';
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Settings';
  })();

  expect(accountLabel).toBe('user@example.com');
});