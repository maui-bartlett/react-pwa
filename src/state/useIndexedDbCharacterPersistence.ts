import { useEffect, useRef } from 'react';

import { useAtom } from 'jotai';
import type { PrimitiveAtom } from 'jotai';

import { readIndexedDbCharacter, writeIndexedDbValue } from './indexedDbCharacterStorage';

type UseIndexedDbCharacterPersistenceOptions<T> = {
  atom: PrimitiveAtom<T>;
  key: string;
  initialValue: T;
  migrate?: (key: string, initialValue: T) => T;
  afterWrite?: (key: string, value: T) => void;
};

function writeLegacyFallback(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // If all browser persistence is unavailable, keep the in-memory atom alive.
  }
}

function removeLegacyKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // IndexedDB is canonical; legacy cleanup is best effort.
  }
}

function useIndexedDbCharacterPersistence<T>({
  atom,
  key,
  initialValue,
  migrate,
  afterWrite,
}: UseIndexedDbCharacterPersistenceOptions<T>): void {
  const [character, setCharacter] = useAtom(atom);
  const hydratedRef = useRef(false);
  const activeKeyRef = useRef<string | null>(null);
  const writeJsonRef = useRef<string | null>(null);
  const afterWriteRef = useRef(afterWrite);

  useEffect(() => {
    afterWriteRef.current = afterWrite;
  }, [afterWrite]);

  useEffect(() => {
    let cancelled = false;
    const fallbackCharacter = migrate ? migrate(key, initialValue) : initialValue;

    hydratedRef.current = false;
    activeKeyRef.current = key;
    writeJsonRef.current = null;

    const persistHydratedCharacter = (targetCharacter: T) => {
      void writeIndexedDbValue(key, targetCharacter)
        .then(() => removeLegacyKey(key))
        .catch(() => writeLegacyFallback(key, targetCharacter))
        .finally(() => afterWriteRef.current?.(key, targetCharacter));
    };

    void readIndexedDbCharacter(key, fallbackCharacter)
      .then((storedCharacter) => {
        if (cancelled) return;
        hydratedRef.current = true;
        writeJsonRef.current = JSON.stringify(storedCharacter);
        setCharacter(storedCharacter);
        persistHydratedCharacter(storedCharacter);
      })
      .catch(() => {
        if (cancelled) return;
        hydratedRef.current = true;
        writeJsonRef.current = JSON.stringify(fallbackCharacter);
        setCharacter(fallbackCharacter);
        persistHydratedCharacter(fallbackCharacter);
      });

    return () => {
      cancelled = true;
    };
  }, [initialValue, key, migrate, setCharacter]);

  useEffect(() => {
    if (activeKeyRef.current !== key) return;
    if (!hydratedRef.current) return;

    const nextJson = JSON.stringify(character);
    if (nextJson === writeJsonRef.current) return;
    writeJsonRef.current = nextJson;

    void writeIndexedDbValue(key, character)
      .then(() => removeLegacyKey(key))
      .catch(() => writeLegacyFallback(key, character))
      .finally(() => afterWriteRef.current?.(key, character));
  }, [character, key]);
}

export { useIndexedDbCharacterPersistence };
