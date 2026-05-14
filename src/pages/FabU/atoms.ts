import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import type { Attribute, Bond } from '@/components/fab-u';

type Character = {
  fabulaPoints: number;
  inventoryPoints: number;
  currentHP: number;
  totalHP: number;
  currentMP: number;
  totalMP: number;
  currentXP: number;
  totalXP: number;
  level: number;
  zennit: number;
  attributes: {
    dex: Attribute;
    insight: Attribute;
    might: Attribute;
    willpower: Attribute;
  };
  bonds: Bond[];
  notes: string;
};

const CHARACTER_DEFAULTS: Character = {
  fabulaPoints: 4,
  inventoryPoints: 8,
  currentHP: 58,
  totalHP: 58,
  currentMP: 58,
  totalMP: 58,
  currentXP: 7,
  totalXP: 10,
  level: 13,
  zennit: 30,
  attributes: {
    dex: { die: 'd8', modifier: 0 },
    insight: { die: 'd10', modifier: 0 },
    might: { die: 'd8', modifier: 0 },
    willpower: { die: 'd8', modifier: 1 },
  },
  bonds: [
    { id: 'jelena', characterName: 'Jelena', types: ['Loyalty', 'Affection'] },
    { id: 'yoru', characterName: 'Yoru', types: ['Affection'] },
    { id: 'granada', characterName: 'Granada', types: ['Admiration'] },
    { id: 'juice', characterName: 'Juice', types: ['Loyalty'] },
  ],
  notes:
    'Rad idolizes Chuck Norris, and draws upon his spirit for strength and inspiration as a hero of his homeland, Infinita.',
};

// Custom storage: migrates notes from the old 'fab-u-character-notes' key on first load.
const migratingCharacterStorage = {
  getItem(key: string, initialValue: Character): Character {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return { ...initialValue, ...JSON.parse(stored) };
    } catch {
      /* ignore */
    }
    try {
      const oldNotes = localStorage.getItem('fab-u-character-notes');
      if (oldNotes !== null) {
        return { ...initialValue, notes: JSON.parse(oldNotes) };
      }
    } catch {
      /* ignore */
    }
    return initialValue;
  },
  setItem(key: string, value: Character): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
};

const characterState = atomWithStorage<Character>(
  'fab-u-character',
  CHARACTER_DEFAULTS,
  migratingCharacterStorage,
);

const backstoryAnswersState = atomWithStorage<string[]>('fab-u-backstory-answers', [
  'Me and my family are political refugees. My parents were studying a pure form of magic, research not looked upon kindly by the government.',
  'I feel out of place culturally, but I have a friendly and optimistic personality, and am trying my best to fit in and make friends.',
  "The capital city, Ad Astya, is the seat of the government that persecuted my family. I'm not a fan.",
]);

// Only user-toggleable effects are stored; enraged/poisoned are derived.
const statusEffectsState = atomWithStorage<Record<string, boolean>>('fab-u-status-effects', {
  slow: false,
  dazed: false,
  weak: false,
  shaken: false,
});

const derivedStatusEffectsState = atom((get) => {
  const e = get(statusEffectsState);
  return {
    ...e,
    enraged: !!(e.slow && e.dazed),
    poisoned: !!(e.weak && e.shaken),
  };
});

export { backstoryAnswersState, characterState, derivedStatusEffectsState, statusEffectsState };
export type { Character };
