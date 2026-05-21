import { atomWithStorage } from 'jotai/utils';

import type { CombatSubTab, FabUTab } from '@/components/fab-u';
import { createDefaultCharacter } from '@/domain/fabU/characterDefaults';
import { normalizeCharacter } from '@/domain/fabU/characterMigration';
import type {
  BackpackItem,
  BackstoryPrompt,
  Character,
  ClassEntry,
  StatusEffects,
} from '@/domain/fabU/characterTypes';

function readJsonLocalStorage(key: string): unknown {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return null;
  }
}

const migratingCharacterStorage = {
  getItem(key: string, initialValue: Character): Character {
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
  },
  setItem(key: string, value: Character): void {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.removeItem('fab-u-status-effects');
  },
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
};

/** Maximum character level in Fabula Ultima. Not displayed in the UI. */
const MAX_CHARACTER_LEVEL = 50;

const characterState = atomWithStorage<Character>(
  'fab-u-character',
  createDefaultCharacter(),
  migratingCharacterStorage,
);

/** Last active main tab — persisted so the app reopens on the same screen. */
const activeTabState = atomWithStorage<FabUTab>('fab-u-active-tab', 'overview');

/** Last active combat sub-tab — persisted alongside the main tab. */
const activeCombatTabState = atomWithStorage<CombatSubTab>('fab-u-active-combat-tab', 'bonds');

export { activeTabState, activeCombatTabState, characterState, MAX_CHARACTER_LEVEL };
export type { BackpackItem, BackstoryPrompt, Character, ClassEntry, StatusEffects };
