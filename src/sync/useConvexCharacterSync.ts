import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';

import { authClient } from '@/lib/auth-client';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

/**
 * Generic character-sync hook shared across apps. Keeps the active
 * character document in Convex (`characters` table, scoped to a single
 * `gameSystem`) in lockstep with the in-memory local copy:
 *
 *   - On first load, either creates a Convex doc from the current
 *     local character (no prior remote rows) or pulls the remote
 *     character down and replaces the local copy.
 *   - On every local edit, debounces a `characters.updateState` call
 *     to push the new serialized state. If the network is offline the
 *     payload is queued in `localStorage` keyed by user + character so
 *     the next online window flushes it.
 *   - Listens for an app-specific "select character" custom event so
 *     other UI surfaces (e.g. the AccountMenu) can switch which Convex
 *     doc this hook tracks.
 *
 * Each app provides its own `serialize` / `deserialize` so the
 * `characterState` blob's shape can differ per app — Convex stores it
 * as `v.any()` so cross-shape coexistence is supported at the schema
 * level.
 */
type CharacterSyncOptions<TCharacter> = {
  /** The local source-of-truth character. */
  character: TCharacter;
  /** Apply a freshly-deserialized remote character to the local store. */
  applyRemote: (remote: TCharacter) => void;
  /** Convert local character to the persisted backend payload. */
  serialize: (character: TCharacter) => unknown;
  /** Convert persisted backend payload into the local character shape. */
  deserialize: (raw: unknown) => TCharacter;
  /** Game-system tag — scopes Convex character queries to a single app. */
  gameSystem: string;
  /** Per-app schema version of the persisted state. Stored on every write. */
  schemaVersion: number;
  /** Localstorage key prefix used for the offline-retry payload. */
  pendingSyncKeyPrefix: string;
  /** Custom DOM event the app dispatches to switch which character syncs. */
  selectCharacterEventName: string;
  /** Optional: human-readable label used in error logs. */
  describeCharacter?: (character: TCharacter) => string;
};

type PendingCharacterSync<TCharacter> = {
  character: TCharacter;
  savedAt: number;
};

function getLocalStorage() {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
}

function readPendingSync<TCharacter>(key: string): PendingCharacterSync<TCharacter> | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCharacterSync<TCharacter>>;
    if (!parsed.character || typeof parsed.savedAt !== 'number') return null;
    return { character: parsed.character, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

function writePendingSync<TCharacter>(key: string, character: TCharacter) {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(
      key,
      JSON.stringify({
        character,
        savedAt: Date.now(),
      } satisfies PendingCharacterSync<TCharacter>),
    );
  } catch {
    // Offline sync is best effort when browser storage is unavailable.
  }
}

function clearPendingSync(key: string) {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

function isBrowserOnline() {
  return globalThis.navigator?.onLine ?? true;
}

function useConvexCharacterSync<TCharacter>(options: CharacterSyncOptions<TCharacter>) {
  const {
    character,
    applyRemote,
    serialize,
    deserialize,
    gameSystem,
    schemaVersion,
    pendingSyncKeyPrefix,
    selectCharacterEventName,
    describeCharacter,
  } = options;

  const { data: session } = authClient.useSession();
  const convexAuth = useConvexAuth();
  const [characterId, setCharacterId] = useState<Id<'characters'> | null>(null);
  const [syncRetryToken, setSyncRetryToken] = useState(0);
  const createFromLocalImport = useMutation(api.characters.createFromLocalImport);
  const setActiveMine = useMutation(api.characters.setActiveMine);
  const updateState = useMutation(api.characters.updateState);
  const canSync = Boolean(session?.user) && !convexAuth.isLoading && convexAuth.isAuthenticated;
  const characters = useQuery(
    api.characters.listMine,
    canSync ? { gameSystem, includeArchived: false } : 'skip',
  );
  const creatingRef = useRef(false);
  const pendingCharacterIdRef = useRef<Id<'characters'> | null>(null);
  const readyToPersistRef = useRef(false);
  const lastSyncedJsonRef = useRef<string | null>(null);
  const lastRemoteUpdatedAtRef = useRef<number | null>(null);
  const currentCharacterJson = JSON.stringify(character);
  const currentCharacterJsonRef = useRef(currentCharacterJson);
  currentCharacterJsonRef.current = currentCharacterJson;
  const activeRemoteCharacter = useMemo(() => {
    if (!characters) return null;
    if (characterId) {
      const selectedCharacter = characters.find((item) => item._id === characterId);
      if (selectedCharacter) return selectedCharacter;
      if (pendingCharacterIdRef.current === characterId) return null;
      return characters.find((item) => item.meta?.activeForUserProfileId) ?? characters[0] ?? null;
    }
    return characters.find((item) => item.meta?.activeForUserProfileId) ?? characters[0] ?? null;
  }, [characterId, characters]);
  const pendingSyncKey =
    session?.user && characterId
      ? `${pendingSyncKeyPrefix}:${session.user.id}:${characterId}`
      : null;

  const describe = useCallback(
    (target: TCharacter) =>
      (describeCharacter ? describeCharacter(target) : 'character') || 'character',
    [describeCharacter],
  );

  const persistCharacter = useCallback(
    async (targetCharacter: TCharacter) => {
      if (!characterId || !canSync) return;
      await updateState({
        characterId,
        schemaVersion,
        characterState: serialize(targetCharacter),
      });
    },
    [canSync, characterId, schemaVersion, serialize, updateState],
  );

  useEffect(() => {
    if (!session?.user || (!convexAuth.isLoading && !convexAuth.isAuthenticated)) {
      setCharacterId(null);
      pendingCharacterIdRef.current = null;
      readyToPersistRef.current = false;
      lastSyncedJsonRef.current = null;
      lastRemoteUpdatedAtRef.current = null;
    }
  }, [convexAuth.isAuthenticated, convexAuth.isLoading, session?.user]);

  useEffect(() => {
    const selectCharacter = (event: Event) => {
      const detail = (event as CustomEvent<{ characterId?: Id<'characters'> }>).detail;
      if (!detail?.characterId) return;
      pendingCharacterIdRef.current = detail.characterId;
      setCharacterId(detail.characterId);
      readyToPersistRef.current = false;
      lastRemoteUpdatedAtRef.current = null;
      void setActiveMine({ characterId: detail.characterId }).catch((error) => {
        console.warn('[sync] failed to set active character', { error });
      });
    };
    const retry = () => setSyncRetryToken((token) => token + 1);
    window.addEventListener(selectCharacterEventName, selectCharacter);
    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);
    document.addEventListener('visibilitychange', retry);

    return () => {
      window.removeEventListener(selectCharacterEventName, selectCharacter);
      window.removeEventListener('online', retry);
      window.removeEventListener('focus', retry);
      document.removeEventListener('visibilitychange', retry);
    };
  }, [selectCharacterEventName, setActiveMine]);

  useEffect(() => {
    if (!characters || !characterId) return;
    const selectedCharacter = characters.find((item) => item._id === characterId);
    if (selectedCharacter) {
      if (pendingCharacterIdRef.current === characterId) pendingCharacterIdRef.current = null;
      return;
    }
    if (pendingCharacterIdRef.current === characterId) return;

    const fallbackCharacter =
      characters.find((item) => item.meta?.activeForUserProfileId) ?? characters[0] ?? null;
    setCharacterId(fallbackCharacter?._id ?? null);
    readyToPersistRef.current = false;
    lastRemoteUpdatedAtRef.current = null;
  }, [characterId, characters]);

  useEffect(() => {
    if (!canSync || characters === undefined || creatingRef.current) return;

    if (characters.length === 0) {
      const initialCharacter = character;
      creatingRef.current = true;
      void createFromLocalImport({
        gameSystem,
        schemaVersion,
        characterState: serialize(initialCharacter),
      })
        .then((createdId) => {
          pendingCharacterIdRef.current = createdId;
          setCharacterId(createdId);
          applyRemote(initialCharacter);
          lastSyncedJsonRef.current = JSON.stringify(initialCharacter);
          readyToPersistRef.current = true;
        })
        .catch((error) => {
          console.error('[sync] failed to create Convex character from local state', {
            error,
            gameSystem,
            characterName: describe(initialCharacter),
            canSync,
          });
        })
        .finally(() => {
          creatingRef.current = false;
        });
      return;
    }

    if (!characterId) {
      const activeCharacter =
        characters.find((item) => item.meta?.activeForUserProfileId) ?? characters[0];
      setCharacterId(activeCharacter._id);
    }
  }, [
    canSync,
    character,
    characterId,
    characters,
    createFromLocalImport,
    applyRemote,
    describe,
    gameSystem,
    schemaVersion,
    serialize,
    syncRetryToken,
  ]);

  useEffect(() => {
    if (!activeRemoteCharacter) return;
    if (lastRemoteUpdatedAtRef.current === activeRemoteCharacter.updatedAt) return;

    if (pendingSyncKey && readPendingSync<TCharacter>(pendingSyncKey)) {
      readyToPersistRef.current = true;
      return;
    }

    const remoteCharacter = deserialize(activeRemoteCharacter.characterState);
    const remoteJson = JSON.stringify(remoteCharacter);
    const localJson = currentCharacterJsonRef.current;
    lastRemoteUpdatedAtRef.current = activeRemoteCharacter.updatedAt;

    const hasUnsyncedLocalChanges =
      readyToPersistRef.current &&
      lastSyncedJsonRef.current !== null &&
      localJson !== lastSyncedJsonRef.current;

    if (hasUnsyncedLocalChanges && remoteJson !== localJson) {
      return;
    }

    if (remoteJson !== lastSyncedJsonRef.current) {
      applyRemote(remoteCharacter);
      lastSyncedJsonRef.current = remoteJson;
    }

    readyToPersistRef.current = true;
  }, [activeRemoteCharacter, applyRemote, deserialize, pendingSyncKey]);

  useEffect(() => {
    if (!pendingSyncKey || !readyToPersistRef.current) return;
    const pending = readPendingSync<TCharacter>(pendingSyncKey);
    if (!pending) return;
    if (!isBrowserOnline()) return;

    void persistCharacter(pending.character)
      .then(() => {
        lastSyncedJsonRef.current = JSON.stringify(pending.character);
        clearPendingSync(pendingSyncKey);
      })
      .catch((error) => {
        console.warn('[sync] pending character flush failed; keeping local retry payload', {
          error,
          pendingSyncKey,
          characterId,
          savedAt: pending.savedAt,
          characterName: describe(pending.character),
        });
      });
  }, [characterId, describe, pendingSyncKey, persistCharacter, syncRetryToken]);

  useEffect(() => {
    if (!canSync || !characterId || !readyToPersistRef.current) return undefined;

    const nextJson = JSON.stringify(character);
    if (nextJson === lastSyncedJsonRef.current) return undefined;

    if (!pendingSyncKey) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (!isBrowserOnline()) {
        writePendingSync(pendingSyncKey, character);
        return;
      }

      void persistCharacter(character)
        .then(() => {
          lastSyncedJsonRef.current = nextJson;
          clearPendingSync(pendingSyncKey);
        })
        .catch((error) => {
          console.warn('[sync] character update failed; queued local retry payload', {
            error,
            pendingSyncKey,
            characterId,
            characterName: describe(character),
          });
          writePendingSync(pendingSyncKey, character);
        });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [canSync, character, characterId, describe, pendingSyncKey, persistCharacter]);

  return {
    characterId,
    isSignedIn: Boolean(session?.user),
    isLoading:
      Boolean(session?.user) && (convexAuth.isLoading || (canSync && characters === undefined)),
  };
}

export type { CharacterSyncOptions };
export { useConvexCharacterSync };
