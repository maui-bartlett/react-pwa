import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAtom } from 'jotai';
import type { PrimitiveAtom } from 'jotai';

import {
  readIndexedDbValue,
  readJsonLocalStorage,
  writeIndexedDbValue,
} from './indexedDbCharacterStorage';

const LOCAL_CHARACTER_LIMIT = 3;

type LocalCharacterSlot<T> = {
  id: string;
  name: string;
  character: T;
};

type LocalCharacterSummary = {
  id: string;
  name: string;
  active: boolean;
};

type UseLocalCharacterSlotsOptions<T> = {
  atom: PrimitiveAtom<T>;
  gameSystem: string;
  legacyKey: string;
  initialValue: T;
  createCharacter: () => T;
  describeCharacter: (character: T) => string;
  migrate?: (key: string, initialValue: T) => T;
};

type UseLocalCharacterSlotsResult = {
  characters: LocalCharacterSummary[];
  activeId: string | null;
  hydrated: boolean;
  limit: number;
  canAdd: boolean;
  addCharacter: () => void;
  selectCharacter: (id: string) => void;
  deleteCharacter: (id: string) => void;
};

function createLocalCharacterId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function slotsKey(gameSystem: string): string {
  return `local-characters:${gameSystem}`;
}

function activeKey(gameSystem: string): string {
  return `local-characters:${gameSystem}:active`;
}

function isLocalCharacterSlot<T>(value: unknown): value is LocalCharacterSlot<T> {
  return Boolean(
    value && typeof value === 'object' && 'id' in value && 'name' in value && 'character' in value,
  );
}

async function readSlots<T>(key: string): Promise<Array<LocalCharacterSlot<T>>> {
  const stored = await readIndexedDbValue(key);
  return Array.isArray(stored) ? stored.filter(isLocalCharacterSlot<T>) : [];
}

async function readActiveId(key: string): Promise<string | null> {
  const stored = await readIndexedDbValue(key);
  return typeof stored === 'string' ? stored : null;
}

function useLocalCharacterSlots<T>({
  atom,
  gameSystem,
  legacyKey,
  initialValue,
  createCharacter,
  describeCharacter,
  migrate,
}: UseLocalCharacterSlotsOptions<T>): UseLocalCharacterSlotsResult {
  const [character, setCharacter] = useAtom(atom);
  const [slots, setSlots] = useState<Array<LocalCharacterSlot<T>>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const slotsRef = useRef<Array<LocalCharacterSlot<T>>>([]);
  const activeIdRef = useRef<string | null>(null);
  const writeJsonRef = useRef<string | null>(null);
  const storageSlotsKey = useMemo(() => slotsKey(gameSystem), [gameSystem]);
  const storageActiveKey = useMemo(() => activeKey(gameSystem), [gameSystem]);

  const persistSlots = useCallback(
    (nextSlots: Array<LocalCharacterSlot<T>>, nextActiveId: string | null) => {
      slotsRef.current = nextSlots;
      activeIdRef.current = nextActiveId;
      setSlots(nextSlots);
      setActiveId(nextActiveId);
      void writeIndexedDbValue(storageSlotsKey, nextSlots);
      void writeIndexedDbValue(storageActiveKey, nextActiveId);
    },
    [storageActiveKey, storageSlotsKey],
  );

  useEffect(() => {
    let cancelled = false;
    hydratedRef.current = false;
    setHydrated(false);
    writeJsonRef.current = null;

    async function hydrate() {
      const [storedSlots, storedActiveId] = await Promise.all([
        readSlots<T>(storageSlotsKey).catch(() => []),
        readActiveId(storageActiveKey).catch(() => null),
      ]);
      if (cancelled) return;

      let nextSlots = storedSlots.slice(0, LOCAL_CHARACTER_LIMIT);
      if (nextSlots.length === 0) {
        const indexedLegacy = await readIndexedDbValue(legacyKey).catch(() => null);
        const migrated =
          indexedLegacy !== null
            ? (indexedLegacy as T)
            : migrate
              ? migrate(legacyKey, initialValue)
              : ((readJsonLocalStorage(legacyKey) ?? initialValue) as T);
        nextSlots = [
          {
            id: createLocalCharacterId(),
            name: describeCharacter(migrated),
            character: migrated,
          },
        ];
      }

      const nextActiveId =
        storedActiveId && nextSlots.some((slot) => slot.id === storedActiveId)
          ? storedActiveId
          : nextSlots[0]?.id || null;
      const activeSlot = nextSlots.find((slot) => slot.id === nextActiveId) ?? nextSlots[0];

      hydratedRef.current = true;
      setHydrated(true);
      writeJsonRef.current = activeSlot ? JSON.stringify(activeSlot.character) : null;
      persistSlots(nextSlots, nextActiveId);
      if (activeSlot) setCharacter(activeSlot.character);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [
    describeCharacter,
    initialValue,
    legacyKey,
    migrate,
    persistSlots,
    setCharacter,
    storageActiveKey,
    storageSlotsKey,
  ]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!activeIdRef.current) return;

    const nextJson = JSON.stringify(character);
    if (nextJson === writeJsonRef.current) return;
    writeJsonRef.current = nextJson;

    const nextSlots = slotsRef.current.map((slot) =>
      slot.id === activeIdRef.current
        ? { ...slot, name: describeCharacter(character), character }
        : slot,
    );
    persistSlots(nextSlots, activeIdRef.current);
  }, [character, describeCharacter, persistSlots]);

  const addCharacter = useCallback(() => {
    if (slotsRef.current.length >= LOCAL_CHARACTER_LIMIT) return;
    const nextCharacter = createCharacter();
    const nextSlot = {
      id: createLocalCharacterId(),
      name: describeCharacter(nextCharacter),
      character: nextCharacter,
    };
    const nextSlots = [...slotsRef.current, nextSlot];
    writeJsonRef.current = JSON.stringify(nextCharacter);
    hydratedRef.current = true;
    persistSlots(nextSlots, nextSlot.id);
    setCharacter(nextCharacter);
  }, [createCharacter, describeCharacter, persistSlots, setCharacter]);

  const selectCharacter = useCallback(
    (id: string) => {
      const nextSlot = slotsRef.current.find((slot) => slot.id === id);
      if (!nextSlot) return;
      writeJsonRef.current = JSON.stringify(nextSlot.character);
      persistSlots(slotsRef.current, id);
      setCharacter(nextSlot.character);
    },
    [persistSlots, setCharacter],
  );

  const deleteCharacter = useCallback(
    (id: string) => {
      const nextSlots = slotsRef.current.filter((slot) => slot.id !== id);
      if (nextSlots.length === 0) {
        const nextCharacter = createCharacter();
        nextSlots.push({
          id: createLocalCharacterId(),
          name: describeCharacter(nextCharacter),
          character: nextCharacter,
        });
      }
      const nextActiveId =
        activeIdRef.current === id ? nextSlots[0]?.id || null : activeIdRef.current;
      const activeSlot = nextSlots.find((slot) => slot.id === nextActiveId) ?? nextSlots[0];
      writeJsonRef.current = activeSlot ? JSON.stringify(activeSlot.character) : null;
      persistSlots(nextSlots, activeSlot?.id || null);
      if (activeSlot) setCharacter(activeSlot.character);
    },
    [createCharacter, describeCharacter, persistSlots, setCharacter],
  );

  return {
    characters: slots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      active: slot.id === activeId,
    })),
    activeId,
    hydrated,
    limit: LOCAL_CHARACTER_LIMIT,
    canAdd: slots.length < LOCAL_CHARACTER_LIMIT,
    addCharacter,
    selectCharacter,
    deleteCharacter,
  };
}

export type { LocalCharacterSummary, UseLocalCharacterSlotsResult };
export { LOCAL_CHARACTER_LIMIT, useLocalCharacterSlots };
