import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';

import { CHARACTER_SCHEMA_VERSION } from '@/domain/fabU/characterDefaults';
import {
  deserializeCharacterFromBackend,
  serializeCharacterForBackend,
} from '@/domain/fabU/characterMigration';
import { authClient } from '@/lib/auth-client';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { Character } from './atoms';
import type { CharacterHistoryControls } from './useCharacterHistory';

const PENDING_SYNC_KEY_PREFIX = 'fab-u-convex-pending-character';

type PendingCharacterSync = {
  character: Character;
  savedAt: number;
};

function getCharacterName(character: Character) {
  const name = [character.firstName, character.lastName].filter(Boolean).join(' ').trim();
  return name || character.nickName || 'Fab U Character';
}

function getPendingSyncKey(userId: string, characterId: Id<'characters'>) {
  return `${PENDING_SYNC_KEY_PREFIX}:${userId}:${characterId}`;
}

function getLocalStorage() {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
}

function readPendingSync(key: string): PendingCharacterSync | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCharacterSync>;
    if (!parsed.character || typeof parsed.savedAt !== 'number') return null;
    return { character: parsed.character, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

function writePendingSync(key: string, character: Character) {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.setItem(
      key,
      JSON.stringify({
        character,
        savedAt: Date.now(),
      } satisfies PendingCharacterSync),
    );
  } catch {
    // Offline sync is best effort when browser storage is unavailable or full.
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

function useConvexCharacterSync(character: Character, history: CharacterHistoryControls) {
  const { data: session } = authClient.useSession();
  const convexAuth = useConvexAuth();
  const { replace } = history;
  const [characterId, setCharacterId] = useState<Id<'characters'> | null>(null);
  const [syncRetryToken, setSyncRetryToken] = useState(0);
  const createFromLocalImport = useMutation(api.characters.createFromLocalImport);
  const updateState = useMutation(api.characters.updateState);
  const canSync = Boolean(session?.user) && !convexAuth.isLoading && convexAuth.isAuthenticated;
  const characters = useQuery(
    api.characters.listMine,
    canSync ? { includeArchived: false } : 'skip',
  );
  const activeRemoteCharacter = useMemo(
    () => characters?.find((item) => item._id === characterId) ?? characters?.[0] ?? null,
    [characterId, characters],
  );

  const creatingRef = useRef(false);
  const readyToPersistRef = useRef(false);
  const lastSyncedJsonRef = useRef<string | null>(null);
  const lastRemoteUpdatedAtRef = useRef<number | null>(null);
  const pendingSyncKey =
    session?.user && characterId ? getPendingSyncKey(session.user.id, characterId) : null;

  const persistCharacter = useCallback(
    async (targetCharacter: Character) => {
      if (!characterId || !canSync) return;
      await updateState({
        characterId,
        schemaVersion: CHARACTER_SCHEMA_VERSION,
        characterState: serializeCharacterForBackend(targetCharacter),
        statusEffects: targetCharacter.statusEffects,
      });
    },
    [canSync, characterId, updateState],
  );

  useEffect(() => {
    if (!session?.user || (!convexAuth.isLoading && !convexAuth.isAuthenticated)) {
      setCharacterId(null);
      readyToPersistRef.current = false;
      lastSyncedJsonRef.current = null;
      lastRemoteUpdatedAtRef.current = null;
    }
  }, [convexAuth.isAuthenticated, convexAuth.isLoading, session?.user]);

  useEffect(() => {
    const retry = () => setSyncRetryToken((token) => token + 1);
    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);
    document.addEventListener('visibilitychange', retry);

    return () => {
      window.removeEventListener('online', retry);
      window.removeEventListener('focus', retry);
      document.removeEventListener('visibilitychange', retry);
    };
  }, []);

  useEffect(() => {
    if (!canSync || characters === undefined || creatingRef.current) return;

    if (characters.length === 0) {
      creatingRef.current = true;
      void createFromLocalImport({
        name: getCharacterName(character),
        schemaVersion: CHARACTER_SCHEMA_VERSION,
        characterState: serializeCharacterForBackend(character),
        statusEffects: character.statusEffects,
      })
        .then((createdId) => {
          setCharacterId(createdId);
          lastSyncedJsonRef.current = JSON.stringify(character);
          readyToPersistRef.current = true;
        })
        .catch((error) => {
          console.error('[sync] failed to create Convex character from local state', {
            error,
            characterName: getCharacterName(character),
            canSync,
          });
        })
        .finally(() => {
          creatingRef.current = false;
        });
      return;
    }

    if (!characterId) {
      setCharacterId(characters[0]._id);
    }
  }, [canSync, character, characterId, characters, createFromLocalImport, syncRetryToken]);

  useEffect(() => {
    if (!activeRemoteCharacter) return;
    if (lastRemoteUpdatedAtRef.current === activeRemoteCharacter.updatedAt) return;

    if (pendingSyncKey && readPendingSync(pendingSyncKey)) {
      readyToPersistRef.current = true;
      return;
    }

    const remoteCharacter = deserializeCharacterFromBackend(activeRemoteCharacter.characterState);
    const remoteJson = JSON.stringify(remoteCharacter);
    lastRemoteUpdatedAtRef.current = activeRemoteCharacter.updatedAt;

    if (remoteJson !== lastSyncedJsonRef.current) {
      replace(remoteCharacter);
      lastSyncedJsonRef.current = remoteJson;
    }

    readyToPersistRef.current = true;
  }, [activeRemoteCharacter, pendingSyncKey, replace]);

  useEffect(() => {
    if (!pendingSyncKey || !readyToPersistRef.current) return;
    const pending = readPendingSync(pendingSyncKey);
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
          characterName: getCharacterName(pending.character),
        });
      });
  }, [characterId, pendingSyncKey, persistCharacter, syncRetryToken]);

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
            characterName: getCharacterName(character),
          });
          writePendingSync(pendingSyncKey, character);
        });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [canSync, character, characterId, pendingSyncKey, persistCharacter]);

  return {
    characterId,
    isSignedIn: Boolean(session?.user),
    isLoading:
      Boolean(session?.user) && (convexAuth.isLoading || (canSync && characters === undefined)),
  };
}

export { useConvexCharacterSync };
