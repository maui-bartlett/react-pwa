import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import type { Attribute, Bond } from '@/components/fab-u';

import { skillGroups as defaultSkillGroups } from './skills';
import type { SkillGroup } from './skills';
import { spellGroups as defaultSpellGroups } from './spells';
import type { SpellGroup } from './spells';

type ClassEntry = {
  name: string;
  level: number;
  subtitle: string;
};

type Character = {
  initiative: number;
  defense: number;
  defenseTemp: number | null;
  magicDefense: number;
  magicDefenseTemp: number | null;
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
  backstoryPrompts: BackstoryPrompt[];
  notes: string;
  classes: ClassEntry[];
  skillGroups: SkillGroup[];
  spellGroups: SpellGroup[];
};

type BackstoryPrompt = {
  prompt: string;
  response: string;
};

const CLASS_DEFAULTS: ClassEntry[] = [
  { name: 'Entropist', level: 10, subtitle: 'Entropic Magic · Absorb MP · Stolen Time' },
  { name: 'Sharpshooter', level: 2, subtitle: 'Ranged Weapon Mastery · Crossfire · Speed MP' },
  { name: 'Tinkerer', level: 1, subtitle: 'Emergency Item · improvised gear in conflict' },
];

const BACKSTORY_PROMPT_DEFAULTS: BackstoryPrompt[] = [
  {
    prompt: 'What drove me and my parents out of Infinita?',
    response:
      'Me and my family are political refugees. My parents were studying a pure form of magic, research not looked upon kindly by the government.',
  },
  {
    prompt: 'How do I feel about being in Efowyn?',
    response:
      'I feel out of place culturally, but I have a friendly and optimistic personality, and am trying my best to fit in and make friends.',
  },
  {
    prompt: 'How do I feel about the castle in the sky?',
    response:
      "The capital city, Ad Astya, is the seat of the government that persecuted my family. I'm not a fan.",
  },
];

const CHARACTER_DEFAULTS: Character = {
  initiative: 0,
  defense: 8,
  defenseTemp: 12,
  magicDefense: 8,
  magicDefenseTemp: 12,
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
  backstoryPrompts: BACKSTORY_PROMPT_DEFAULTS,
  notes:
    'Rad idolizes Chuck Norris, and draws upon his spirit for strength and inspiration as a hero of his homeland, Infinita.',
  classes: CLASS_DEFAULTS,
  skillGroups: defaultSkillGroups,
  spellGroups: defaultSpellGroups,
};

function normalizeBackstoryPrompts(
  storedPrompts: unknown,
  storedAnswers: unknown = null,
): BackstoryPrompt[] {
  const answers = Array.isArray(storedAnswers) ? storedAnswers : [];

  return BACKSTORY_PROMPT_DEFAULTS.map((defaultPrompt, index) => {
    const storedPrompt = Array.isArray(storedPrompts) ? storedPrompts[index] : null;
    const answer = answers[index];

    if (storedPrompt && typeof storedPrompt === 'object') {
      const maybePrompt = storedPrompt as Partial<BackstoryPrompt>;
      return {
        prompt: typeof maybePrompt.prompt === 'string' ? maybePrompt.prompt : defaultPrompt.prompt,
        response:
          typeof maybePrompt.response === 'string'
            ? maybePrompt.response
            : typeof answer === 'string'
              ? answer
              : defaultPrompt.response,
      };
    }

    return {
      prompt: defaultPrompt.prompt,
      response: typeof answer === 'string' ? answer : defaultPrompt.response,
    };
  });
}

// Custom storage: migrates notes from the old 'fab-u-character-notes' key on first load.
const migratingCharacterStorage = {
  getItem(key: string, initialValue: Character): Character {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        let oldAnswers: unknown = null;
        try {
          const storedAnswers = localStorage.getItem('fab-u-backstory-answers');
          if (storedAnswers !== null) oldAnswers = JSON.parse(storedAnswers);
        } catch {
          /* ignore */
        }
        return {
          ...initialValue,
          ...parsed,
          backstoryPrompts: normalizeBackstoryPrompts(parsed.backstoryPrompts, oldAnswers),
        };
      }
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
    try {
      const storedAnswers = localStorage.getItem('fab-u-backstory-answers');
      if (storedAnswers !== null) {
        return {
          ...initialValue,
          backstoryPrompts: normalizeBackstoryPrompts(null, JSON.parse(storedAnswers)),
        };
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

export { characterState, derivedStatusEffectsState, statusEffectsState };
export type { BackstoryPrompt, Character, ClassEntry };
