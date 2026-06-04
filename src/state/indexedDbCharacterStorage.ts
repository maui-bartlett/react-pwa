import type { AsyncStorage } from 'jotai/vanilla/utils/atomWithStorage';

const DB_NAME = 'tabletop-games-local';
const DB_VERSION = 1;
const STORE_NAME = 'characters';

type Migration<T> = (key: string, initialValue: T) => T | Promise<T>;

type IndexedDbCharacterStorageOptions<T> = {
  migrateFromLocalStorage?: Migration<T>;
  onWrite?: (key: string, value: T) => void;
  onRemove?: (key: string) => void;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('Unable to open IndexedDB'));
    };
  });

  return dbPromise;
}

async function readIndexedDbValue(key: string): Promise<unknown> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error('Unable to read IndexedDB value'));
  });
}

async function writeIndexedDbValue(key: string, value: unknown): Promise<void> {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const request = transaction.objectStore(STORE_NAME).put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Unable to write IndexedDB value'));
  });
}

async function removeIndexedDbValue(key: string): Promise<void> {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const request = transaction.objectStore(STORE_NAME).delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Unable to remove IndexedDB value'));
  });
}

function readJsonLocalStorage(key: string): unknown {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return null;
  }
}

function writeJsonLocalStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // IndexedDB remains the source of truth; localStorage fallback is best effort.
  }
}

function removeLocalStorageKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clean up when browser storage is unavailable.
  }
}

function createIndexedDbCharacterStorage<T>({
  migrateFromLocalStorage,
  onWrite,
  onRemove,
}: IndexedDbCharacterStorageOptions<T> = {}): AsyncStorage<T> {
  return {
    async getItem(key, initialValue) {
      try {
        const stored = await readIndexedDbValue(key);
        if (stored !== null) return stored as T;

        const migrated = migrateFromLocalStorage
          ? await migrateFromLocalStorage(key, initialValue)
          : ((readJsonLocalStorage(key) ?? initialValue) as T);

        await writeIndexedDbValue(key, migrated);
        removeLocalStorageKey(key);
        return migrated;
      } catch {
        const fallback = migrateFromLocalStorage
          ? await migrateFromLocalStorage(key, initialValue)
          : ((readJsonLocalStorage(key) ?? initialValue) as T);
        return fallback;
      }
    },
    async setItem(key, value) {
      try {
        await writeIndexedDbValue(key, value);
        removeLocalStorageKey(key);
      } catch {
        writeJsonLocalStorage(key, value);
      }
      onWrite?.(key, value);
    },
    async removeItem(key) {
      try {
        await removeIndexedDbValue(key);
      } catch {
        removeLocalStorageKey(key);
      }
      onRemove?.(key);
    },
  };
}

async function readIndexedDbCharacter<T>(key: string, initialValue: T): Promise<T> {
  try {
    const stored = await readIndexedDbValue(key);
    return stored === null ? initialValue : (stored as T);
  } catch {
    return (readJsonLocalStorage(key) ?? initialValue) as T;
  }
}

export { createIndexedDbCharacterStorage, readIndexedDbCharacter, readJsonLocalStorage };
export { removeIndexedDbValue, writeIndexedDbValue };
