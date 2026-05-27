import type { EquipmentItem } from '@/components/fab-u';
import { skillGroups as defaultSkillGroups } from '@/pages/FabU/skills';
import { spellGroups as defaultSpellGroups } from '@/pages/FabU/spells';

import type {
  BackpackItem,
  BackstoryPrompt,
  Character,
  ClassEntry,
  StatusEffects,
} from './characterTypes';

const CHARACTER_SCHEMA_VERSION = 1;

const STATUS_EFFECT_DEFAULTS: StatusEffects = {
  slow: false,
  dazed: false,
  weak: false,
  shaken: false,
  enraged: false,
  poisoned: false,
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

function createDefaultCharacter(): Character {
  return {
    name: {
      firstName: 'Radovan',
      lastName: 'Milincic',
      nickName: 'Rad',
    },
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
    zenit: 30,
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
    statusEffects: STATUS_EFFECT_DEFAULTS,
    traits: {
      identity: ['Transfer Student to UoE', 'Political refugee'],
      theme: 'Belonging',
      origin: 'Infinita',
    },
  };
}

export {
  BACKPACK_DEFAULTS,
  BACKSTORY_PROMPT_DEFAULTS,
  CHARACTER_SCHEMA_VERSION,
  CLASS_DEFAULTS,
  EQUIPMENT_DEFAULTS,
  STATUS_EFFECT_DEFAULTS,
  createDefaultCharacter,
};
