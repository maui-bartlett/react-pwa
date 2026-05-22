import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useMutation, useQuery } from 'convex/react';

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

function readPendingSync(key: string): PendingCharacterSync | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCharacterSync>;
    if (!parsed.character || typeof parsed.savedAt !== 'number') return null;
    return { character: parsed.character, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

function writePendingSync(key: string, character: Character) {
  localStorage.setItem(
    key,
    JSON.stringify({
      character,
      savedAt: Date.now(),
    } satisfies PendingCharacterSync),
  );
}

function clearPendingSync(key: string) {
  localStorage.removeItem(key);
}

function useConvexCharacterSync(character: Character, history: CharacterHistoryControls) {
  const { data: session } = authClient.useSession();
  const { replace } = history;
  const [characterId, setCharacterId] = useState<Id<'characters'> | null>(null);
  const [syncRetryToken, setSyncRetryToken] = useState(0);
  const createFromLocalImport = useMutation(api.characters.createFromLocalImport);
  const updateState = useMutation(api.characters.updateState);
  const characters = useQuery(
    api.characters.listMine,
    session?.user ? { includeArchived: false } : 'skip',
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
      if (!characterId) return;
      await updateState({
        characterId,
        schemaVersion: CHARACTER_SCHEMA_VERSION,
        characterState: serializeCharacterForBackend(targetCharacter),
        statusEffects: targetCharacter.statusEffects,
      });
    },
    [characterId, updateState],
  );

  useEffect(() => {
    if (!session?.user) {
      setCharacterId(null);
      readyToPersistRef.current = false;
      lastSyncedJsonRef.current = null;
      lastRemoteUpdatedAtRef.current = null;
    }
  }, [session?.user]);

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
    if (!session?.user || characters === undefined || creatingRef.current) return;

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
        .finally(() => {
          creatingRef.current = false;
        });
      return;
    }

    if (!characterId) {
      setCharacterId(characters[0]._id);
    }
  }, [character, characterId, characters, createFromLocalImport, session?.user, syncRetryToken]);

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
    if (!navigator.onLine) return;

    void persistCharacter(pending.character)
      .then(() => {
        lastSyncedJsonRef.current = JSON.stringify(pending.character);
        clearPendingSync(pendingSyncKey);
      })
      .catch(() => {});
  }, [pendingSyncKey, persistCharacter, syncRetryToken]);

  useEffect(() => {
    if (!session?.user || !characterId || !readyToPersistRef.current) return undefined;

    const nextJson = JSON.stringify(character);
    if (nextJson === lastSyncedJsonRef.current) return undefined;

    if (!pendingSyncKey) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (!navigator.onLine) {
        writePendingSync(pendingSyncKey, character);
        return;
      }

      void persistCharacter(character)
        .then(() => {
          lastSyncedJsonRef.current = nextJson;
          clearPendingSync(pendingSyncKey);
        })
        .catch(() => {
          writePendingSync(pendingSyncKey, character);
        });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [character, characterId, pendingSyncKey, persistCharacter, session?.user]);

  return {
    characterId,
    isSignedIn: Boolean(session?.user),
    isLoading: Boolean(session?.user) && characters === undefined,
  };
}

export { useConvexCharacterSync };
