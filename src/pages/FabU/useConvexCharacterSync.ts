import { useEffect, useMemo, useRef, useState } from 'react';

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

function getCharacterName(character: Character) {
  const name = [character.firstName, character.lastName].filter(Boolean).join(' ').trim();
  return name || character.nickName || 'Fab U Character';
}

function useConvexCharacterSync(character: Character, history: CharacterHistoryControls) {
  const { data: session } = authClient.useSession();
  const { replace } = history;
  const [characterId, setCharacterId] = useState<Id<'characters'> | null>(null);
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

  useEffect(() => {
    if (!session?.user) {
      setCharacterId(null);
      readyToPersistRef.current = false;
      lastSyncedJsonRef.current = null;
      lastRemoteUpdatedAtRef.current = null;
    }
  }, [session?.user]);

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
  }, [character, characterId, characters, createFromLocalImport, session?.user]);

  useEffect(() => {
    if (!activeRemoteCharacter) return;
    if (lastRemoteUpdatedAtRef.current === activeRemoteCharacter.updatedAt) return;

    const remoteCharacter = deserializeCharacterFromBackend(activeRemoteCharacter.characterState);
    const remoteJson = JSON.stringify(remoteCharacter);
    lastRemoteUpdatedAtRef.current = activeRemoteCharacter.updatedAt;

    if (remoteJson !== lastSyncedJsonRef.current) {
      replace(remoteCharacter);
      lastSyncedJsonRef.current = remoteJson;
    }

    readyToPersistRef.current = true;
  }, [activeRemoteCharacter, replace]);

  useEffect(() => {
    if (!session?.user || !characterId || !readyToPersistRef.current) return undefined;

    const nextJson = JSON.stringify(character);
    if (nextJson === lastSyncedJsonRef.current) return undefined;

    const timeoutId = window.setTimeout(() => {
      void updateState({
        characterId,
        schemaVersion: CHARACTER_SCHEMA_VERSION,
        characterState: serializeCharacterForBackend(character),
        statusEffects: character.statusEffects,
      }).then(() => {
        lastSyncedJsonRef.current = nextJson;
      });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [character, characterId, session?.user, updateState]);

  return {
    characterId,
    isSignedIn: Boolean(session?.user),
    isLoading: Boolean(session?.user) && characters === undefined,
  };
}

export { useConvexCharacterSync };
