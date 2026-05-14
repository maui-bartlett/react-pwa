import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type Character = {
  fabulaPoints: number;
  inventoryPoints: number;
};

const characterState = atomWithStorage<Character>('fab-u-character', {
  fabulaPoints: 4,
  inventoryPoints: 8,
});

const backstoryAnswersState = atomWithStorage<string[]>('fab-u-backstory-answers', [
  'Me and my family are political refugees. My parents were studying a pure form of magic, research not looked upon kindly by the government.',
  'I feel out of place culturally, but I have a friendly and optimistic personality, and am trying my best to fit in and make friends.',
  "The capital city, Ad Astya, is the seat of the government that persecuted my family. I'm not a fan.",
]);

const characterNotesState = atomWithStorage<string>(
  'fab-u-character-notes',
  'Rad idolizes Chuck Norris, and draws upon his spirit for strength and inspiration as a hero of his homeland, Infinita.',
);

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

export {
  backstoryAnswersState,
  characterNotesState,
  characterState,
  derivedStatusEffectsState,
  statusEffectsState,
};
export type { Character };
