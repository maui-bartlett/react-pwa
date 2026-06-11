import type { Page } from '@playwright/test';

type StoredFabUCharacter = Record<string, unknown>;

async function readActiveFabUCharacter(page: Page): Promise<StoredFabUCharacter> {
  return page.evaluate(async () => {
    const openRequest = indexedDB.open('tabletop-games-local', 1);
    openRequest.onupgradeneeded = () => {
      if (!openRequest.result.objectStoreNames.contains('characters')) {
        openRequest.result.createObjectStore('characters');
      }
    };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error);
    });

    const readValue = (key: string) =>
      new Promise<unknown>((resolve, reject) => {
        const transaction = db.transaction('characters', 'readonly');
        const request = transaction.objectStore('characters').get(key);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });

    const [slotsValue, activeIdValue] = await Promise.all([
      readValue('local-characters:fabula-ultima'),
      readValue('local-characters:fabula-ultima:active'),
    ]);
    db.close();

    const slots = Array.isArray(slotsValue)
      ? (slotsValue as Array<{ id?: unknown; character?: unknown }>)
      : [];
    const activeId = typeof activeIdValue === 'string' ? activeIdValue : null;
    const activeSlot = slots.find((slot) => slot.id === activeId) ?? slots[0];
    return activeSlot?.character && typeof activeSlot.character === 'object'
      ? (activeSlot.character as StoredFabUCharacter)
      : {};
  });
}

async function clearFabUCharacterStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const openRequest = indexedDB.open('tabletop-games-local', 1);
    openRequest.onupgradeneeded = () => {
      if (!openRequest.result.objectStoreNames.contains('characters')) {
        openRequest.result.createObjectStore('characters');
      }
    };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error);
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('characters', 'readwrite');
      const store = transaction.objectStore('characters');
      [
        'fab-u-character',
        'local-characters:fabula-ultima',
        'local-characters:fabula-ultima:active',
      ].forEach((key) => store.delete(key));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });
}

async function activeFabUCharacterHasBond(page: Page, name: string): Promise<boolean> {
  const character = await readActiveFabUCharacter(page);
  if (!Array.isArray(character.bonds)) return false;

  return character.bonds.some(
    (bond) =>
      bond !== null &&
      typeof bond === 'object' &&
      'characterName' in bond &&
      (bond as { characterName?: unknown }).characterName === name,
  );
}

export { activeFabUCharacterHasBond, clearFabUCharacterStorage, readActiveFabUCharacter };
