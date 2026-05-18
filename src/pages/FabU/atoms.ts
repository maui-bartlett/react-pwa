import { atomWithStorage } from 'jotai/utils';

import type { Attribute, Bond, CombatSubTab, EquipmentItem, FabUTab } from '@/components/fab-u';

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
  firstName: string;
  lastName: string;
  nickName: string;
  initiative: number;
  defense: number;
  defenseTemp: number | null;
  magicDefense: number;
  magicDefenseTemp: number | null;
  fabulaPoints: number;
  inventoryPoints: number;
  currentHP: number;
  /** Bonus added on top of (MIG die × 5 + level) to get max HP. */
  hpBonus: number;
  currentMP: number;
  /** Bonus added on top of (WLP die × 5 + level) to get max MP. */
  mpBonus: number;
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
  equipment: EquipmentItem[];
  backpack: BackpackItem[];
  traits: { identity: string[]; theme: string; origin: string };
};

type BackstoryPrompt = {
  prompt: string;
  response: string;
};

type BackpackItem = {
  id: string;
  title: string;
  subtitle: string;
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

const BACKPACK_DEFAULTS: BackpackItem[] = [
  {
    id: 'crystal',
    title: 'Green Crystal',
    subtitle: 'a crystal that acts as a compass, guiding us toward our goal.',
  },
  { id: 'grimoire', title: 'Grimoire', subtitle: 'a magical book named Noir. Origins unknown.' },
];

const EQUIPMENT_DEFAULTS: EquipmentItem[] = [
  {
    name: 'Pistol',
    slot: 'Main Hand',
    description: 'High quality ranged weapon · DEX + INS + 1 · HR + 8',
  },
  {
    name: 'Pistol',
    slot: 'Off Hand',
    description: 'High quality ranged weapon · DEX + INS + 1 · HR + 8',
  },
];

const CHARACTER_DEFAULTS: Character = {
  firstName: 'Radovan',
  lastName: 'Milincic',
  nickName: 'Rad',
  initiative: 0,
  defense: 8,
  defenseTemp: 12,
  magicDefense: 8,
  magicDefenseTemp: 12,
  fabulaPoints: 4,
  inventoryPoints: 8,
  currentHP: 58,
  hpBonus: 5,
  currentMP: 58,
  mpBonus: 5,
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
  equipment: EQUIPMENT_DEFAULTS,
  backpack: BACKPACK_DEFAULTS,
  traits: {
    identity: ['Transfer Student to UoE', 'Political refugee'],
    theme: 'Belonging',
    origin: 'Infinita',
  },
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

function normalizeBackpack(storedBackpack: unknown): BackpackItem[] {
  if (!Array.isArray(storedBackpack)) return BACKPACK_DEFAULTS;
  const valid = storedBackpack.filter(
    (item): item is BackpackItem =>
      item &&
      typeof item === 'object' &&
      typeof (item as Partial<BackpackItem>).title === 'string' &&
      typeof (item as Partial<BackpackItem>).subtitle === 'string',
  );
  return valid.length > 0
    ? valid.map((item) => ({
        id: item.id ?? String(Math.random()),
        title: item.title,
        subtitle: item.subtitle,
      }))
    : BACKPACK_DEFAULTS;
}

function normalizeEquipment(storedEquipment: unknown): EquipmentItem[] {
  if (!Array.isArray(storedEquipment)) return EQUIPMENT_DEFAULTS;

  return storedEquipment.filter(
    (item): item is EquipmentItem =>
      item &&
      typeof item === 'object' &&
      typeof (item as Partial<EquipmentItem>).name === 'string' &&
      typeof (item as Partial<EquipmentItem>).slot === 'string' &&
      typeof (item as Partial<EquipmentItem>).description === 'string',
  );
}

/** Migrate traits.identity from old string format → string[] */
function normalizeTraits(stored: unknown, defaults: Character['traits']): Character['traits'] {
  if (!stored || typeof stored !== 'object') return defaults;
  const t = stored as Record<string, unknown>;
  const rawIdentity = t.identity;
  const identity: string[] = Array.isArray(rawIdentity)
    ? rawIdentity.filter((x): x is string => typeof x === 'string')
    : typeof rawIdentity === 'string'
      ? [rawIdentity]
      : defaults.identity;
  return {
    identity: identity.length > 0 ? identity : defaults.identity,
    theme: typeof t.theme === 'string' ? t.theme : defaults.theme,
    origin: typeof t.origin === 'string' ? t.origin : defaults.origin,
  };
}

/** Migrate totalHP/totalMP → hpBonus/mpBonus, back-computing the bonus from the old values. */
const MIGRATION_DIE_VALUES: Record<string, number> = {
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

function normalizeHpMpBonus(
  parsed: Record<string, unknown>,
  initialValue: Character,
): { hpBonus: number; mpBonus: number } {
  // Already migrated
  if (typeof parsed.hpBonus === 'number') {
    return {
      hpBonus: parsed.hpBonus,
      mpBonus: typeof parsed.mpBonus === 'number' ? parsed.mpBonus : initialValue.mpBonus,
    };
  }
  // Attempt to derive from old totalHP/totalMP fields
  const attrs = parsed.attributes as Character['attributes'] | undefined;
  const level = typeof parsed.level === 'number' ? parsed.level : initialValue.level;
  if (typeof parsed.totalHP === 'number' && attrs?.might) {
    const hpBase = (MIGRATION_DIE_VALUES[attrs.might.die] ?? 8) * 5 + level;
    const mpBase = attrs?.willpower
      ? (MIGRATION_DIE_VALUES[attrs.willpower.die] ?? 8) * 5 + level
      : 8 * 5 + level;
    return {
      hpBonus: Math.max(0, parsed.totalHP - hpBase),
      mpBonus:
        typeof parsed.totalMP === 'number'
          ? Math.max(0, parsed.totalMP - mpBase)
          : initialValue.mpBonus,
    };
  }
  return { hpBonus: initialValue.hpBonus, mpBonus: initialValue.mpBonus };
}

// Custom storage: migrates notes from the old 'fab-u-character-notes' key on first load.
const migratingCharacterStorage = {
  getItem(key: string, initialValue: Character): Character {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        let oldAnswers: unknown = null;
        try {
          const storedAnswers = localStorage.getItem('fab-u-backstory-answers');
          if (storedAnswers !== null) oldAnswers = JSON.parse(storedAnswers);
        } catch {
          /* ignore */
        }
        // Merge maxLevel from defaults into stored skillGroups so upgrades (e.g. Entropic Magic → 10)
        // are picked up even when old localStorage data is missing the field.
        const mergedSkillGroups: SkillGroup[] = (
          (parsed.skillGroups as SkillGroup[] | undefined) ?? initialValue.skillGroups
        ).map((group: SkillGroup) => {
          const defaultGroup = defaultSkillGroups.find((dg) => dg.className === group.className);
          return {
            ...group,
            skills: group.skills.map((skill) => {
              const defaultSkill = defaultGroup?.skills.find((ds) => ds.name === skill.name);
              return defaultSkill?.maxLevel != null
                ? { ...skill, maxLevel: defaultSkill.maxLevel }
                : skill;
            }),
          };
        });
        return {
          ...initialValue,
          ...parsed,
          skillGroups: mergedSkillGroups,
          backstoryPrompts: normalizeBackstoryPrompts(parsed.backstoryPrompts, oldAnswers),
          equipment: normalizeEquipment(parsed.equipment),
          backpack: normalizeBackpack(parsed.backpack),
          traits: normalizeTraits(parsed.traits, initialValue.traits),
          ...normalizeHpMpBonus(parsed, initialValue),
        };
      }
    } catch {
      /* ignore */
    }
    try {
      const oldNotes = localStorage.getItem('fab-u-character-notes');
      if (oldNotes !== null) {
        return { ...initialValue, notes: JSON.parse(oldNotes) as string };
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

/** Maximum character level in Fabula Ultima. Not displayed in the UI. */
const MAX_CHARACTER_LEVEL = 50;

const characterState = atomWithStorage<Character>(
  'fab-u-character',
  CHARACTER_DEFAULTS,
  migratingCharacterStorage,
);

const statusEffectsState = atomWithStorage<Record<string, boolean>>('fab-u-status-effects', {
  slow: false,
  dazed: false,
  weak: false,
  shaken: false,
  enraged: false,
  poisoned: false,
});

/** Last active main tab — persisted so the app reopens on the same screen. */
const activeTabState = atomWithStorage<FabUTab>('fab-u-active-tab', 'overview');

/** Last active combat sub-tab — persisted alongside the main tab. */
const activeCombatTabState = atomWithStorage<CombatSubTab>('fab-u-active-combat-tab', 'bonds');

export {
  activeTabState,
  activeCombatTabState,
  characterState,
  statusEffectsState,
  MAX_CHARACTER_LEVEL,
};
export type { BackpackItem, BackstoryPrompt, Character, ClassEntry };
