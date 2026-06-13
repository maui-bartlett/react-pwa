import { describe, expect, it } from 'vitest';

import {
  PERSISTENT_APP_LOCATION_KEY,
  persistAppPathname,
  persistAppView,
  readPersistentAppLocation,
  readPersistentAppView,
} from './persistentAppLocation';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('persistent app location', () => {
  it('persists a route and per-app views in one shared record', () => {
    const storage = createMemoryStorage();

    persistAppPathname('/fab-u', storage);
    persistAppView('fab-u', 'tab', 'notes', storage);
    persistAppView('fab-u', 'combat-tab', 'gear', storage);

    expect(readPersistentAppLocation(storage)).toEqual({
      version: 1,
      pathname: '/fab-u',
      appViews: {
        'fab-u': {
          tab: 'notes',
          'combat-tab': 'gear',
        },
      },
    });
  });

  it('returns only allowed app view values', () => {
    const storage = createMemoryStorage();
    persistAppView('avatar-legends', 'tab', 'moves', storage);

    expect(
      readPersistentAppView(
        'avatar-legends',
        'tab',
        ['character', 'moves', 'combat', 'backpack'] as const,
        'character',
        storage,
      ),
    ).toBe('moves');
    expect(
      readPersistentAppView(
        'avatar-legends',
        'tab',
        ['character', 'combat'] as const,
        'character',
        storage,
      ),
    ).toBe('character');
  });

  it('ignores malformed persisted records', () => {
    const storage = createMemoryStorage();
    storage.setItem(PERSISTENT_APP_LOCATION_KEY, '{"version":1,"pathname":"https://bad.test"}');

    expect(readPersistentAppLocation(storage)).toEqual({
      version: 1,
      pathname: '/',
      appViews: {},
    });
  });
});
