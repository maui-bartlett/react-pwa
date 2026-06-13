import { atom } from 'jotai';

import type { CombatSubTab, FabUTab } from '@/components/fab-u';
import { createRandomFabUCharacter } from '@/domain/fabU/characterDefaults';
import { normalizeCharacter } from '@/domain/fabU/characterMigration';
import type {
  BackpackItem,
  BackstoryPrompt,
  Character,
  ClassEntry,
  StatusEffects,
} from '@/domain/fabU/characterTypes';
import { readJsonLocalStorage } from '@/state/indexedDbCharacterStorage';
import { readPersistentAppView } from '@/state/persistentAppLocation';

function migrateFabULocalCharacter(key: string, initialValue: Character): Character {
  const oldBackstoryAnswers = readJsonLocalStorage('fab-u-backstory-answers');
  const oldStatusEffects = readJsonLocalStorage('fab-u-status-effects');
  const stored = readJsonLocalStorage(key);

  if (stored !== null) {
    return normalizeCharacter(stored, { oldBackstoryAnswers, oldStatusEffects });
  }

  const oldNotes = readJsonLocalStorage('fab-u-character-notes');
  if (typeof oldNotes === 'string') {
    return normalizeCharacter(
      { ...initialValue, notes: oldNotes },
      { oldBackstoryAnswers, oldStatusEffects },
    );
  }

  return normalizeCharacter(initialValue, { oldBackstoryAnswers, oldStatusEffects });
}

/** Maximum character level in Fabula Ultima. Not displayed in the UI. */
const MAX_CHARACTER_LEVEL = 50;

const initialFabUCharacter = createRandomFabUCharacter();
const characterState = atom<Character>(initialFabUCharacter);

const fabUTabs: readonly FabUTab[] = ['overview', 'combat', 'skills', 'spells', 'gear', 'notes'];
const combatSubTabs: readonly CombatSubTab[] = ['bonds', 'skills', 'spells', 'gear', 'traits'];

function readLegacyView<T extends string>(key: string, validValues: readonly T[], fallback: T): T {
  const value = readJsonLocalStorage(key);
  return validValues.includes(value as T) ? (value as T) : fallback;
}

const initialFabUTab = readPersistentAppView(
  'fab-u',
  'tab',
  fabUTabs,
  readLegacyView('fab-u-active-tab', fabUTabs, 'overview'),
);
const initialCombatSubTab = readPersistentAppView(
  'fab-u',
  'combat-tab',
  combatSubTabs,
  readLegacyView('fab-u-active-combat-tab', combatSubTabs, 'bonds'),
);

/** Last active main tab — persisted in the shared Table-Top location record. */
const activeTabState = atom<FabUTab>(initialFabUTab);

/** Last active combat sub-tab — persisted alongside the main tab. */
const activeCombatTabState = atom<CombatSubTab>(initialCombatSubTab);

export {
  activeTabState,
  activeCombatTabState,
  characterState,
  initialFabUCharacter,
  migrateFabULocalCharacter,
  MAX_CHARACTER_LEVEL,
};
export type { BackpackItem, BackstoryPrompt, Character, ClassEntry, StatusEffects };
