import { useCallback } from 'react';

import { CHARACTER_SCHEMA_VERSION } from '@/domain/fabU/characterDefaults';
import {
  deserializeCharacterFromBackend,
  serializeCharacterForBackend,
} from '@/domain/fabU/characterMigration';
import { useConvexCharacterSync as useGenericConvexCharacterSync } from '@/sync/useConvexCharacterSync';

import type { Character } from './atoms';
import type { CharacterHistoryControls } from './useCharacterHistory';

const PENDING_SYNC_KEY_PREFIX = 'fab-u-convex-pending-character';
const FAB_U_SELECT_CHARACTER_EVENT = 'fab-u-select-character';
const FAB_U_GAME_SYSTEM = 'fabula-ultima';

function getCharacterName(character: Character) {
  const fullName = [character.name.firstName, character.name.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || character.name.nickName || 'Fab U Character';
}

function useConvexCharacterSync(character: Character, history: CharacterHistoryControls) {
  const { replace } = history;
  const applyRemote = useCallback(
    (remote: Character) => {
      replace(remote);
    },
    [replace],
  );
  return useGenericConvexCharacterSync<Character>({
    character,
    applyRemote,
    serialize: serializeCharacterForBackend,
    deserialize: deserializeCharacterFromBackend,
    gameSystem: FAB_U_GAME_SYSTEM,
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    pendingSyncKeyPrefix: PENDING_SYNC_KEY_PREFIX,
    selectCharacterEventName: FAB_U_SELECT_CHARACTER_EVENT,
    describeCharacter: getCharacterName,
  });
}

export { FAB_U_SELECT_CHARACTER_EVENT, useConvexCharacterSync };
