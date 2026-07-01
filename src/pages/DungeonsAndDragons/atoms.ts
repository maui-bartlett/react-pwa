import { atom } from 'jotai';

import { readPersistentAppView } from '@/state/persistentAppLocation';

type DndTab =
  | 'abilities'
  | 'skills'
  | 'actions'
  | 'spells'
  | 'inventory'
  | 'features'
  | 'background'
  | 'notes';

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

type AbilityScore = {
  key: AbilityKey;
  label: string;
  score: number;
  saveBonus: number;
  proficientSave: boolean;
};

type Skill = {
  name: string;
  ability: AbilityKey;
  bonus: number;
  proficient: boolean;
  expertise?: boolean;
};

type Attack = {
  id: string;
  name: string;
  kind: string;
  range: string;
  hitDc: string;
  damage: string;
  damageType: string;
  equipped?: boolean;
};

type Spell = {
  id: string;
  name: string;
  level: string;
  school: string;
  castingTime: string;
  range: string;
  hitDc: string;
  damage?: string;
  prepared?: boolean;
};

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  weight: string;
  quantity: string;
  cost: string;
  equipped?: boolean;
};

type Feature = {
  id: string;
  name: string;
  source: string;
  summary: string;
  uses?: {
    label: string;
    used: number;
    max: number;
    reset: string;
  };
};

type Feat = {
  id: string;
  name: string;
  summary: string;
};

type Money = {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
};

type DndCharacter = {
  id: string;
  name: string;
  species: string;
  classes: Array<{ name: string; level: number; subclass?: string }>;
  level: number;
  background: string;
  alignment: string;
  experience: number;
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  hitPoints: {
    current: number;
    max: number;
    temp: number;
    hitDice: string;
    deathSaves: { successes: number; failures: number };
  };
  inspiration: boolean;
  conditions: string[];
  abilities: AbilityScore[];
  skills: Skill[];
  attacks: Attack[];
  spells: Spell[];
  spellcasting: {
    ability: AbilityKey;
    saveDc: number;
    attackBonus: number;
    slots: Array<{ level: string; used: number; max: number }>;
  };
  inventory: InventoryItem[];
  money: Money;
  features: Feature[];
  feats: Feat[];
  proficiencies: string[];
  languages: string[];
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    backstory: string;
  };
  notes: Array<{ id: string; title: string; body: string }>;
};

const dndTabs: readonly DndTab[] = [
  'abilities',
  'skills',
  'actions',
  'spells',
  'inventory',
  'features',
  'background',
  'notes',
];

const initialDndCharacter: DndCharacter = {
  id: 'gellin-mcfellon',
  name: 'Gellin McFellon',
  species: 'Dragonborn',
  classes: [
    { name: 'Rogue', level: 10, subclass: 'Swashbuckler' },
    { name: 'Wizard', level: 2, subclass: 'Bladesinging' },
  ],
  level: 12,
  background: 'Sage',
  alignment: 'Chaotic Good',
  experience: 100000,
  armorClass: 17,
  initiative: 4,
  speed: 30,
  proficiencyBonus: 4,
  passivePerception: 15,
  passiveInvestigation: 14,
  passiveInsight: 12,
  hitPoints: {
    current: 84,
    max: 101,
    temp: 0,
    hitDice: '10d8 + 2d6',
    deathSaves: { successes: 0, failures: 0 },
  },
  inspiration: true,
  conditions: [],
  abilities: [
    { key: 'str', label: 'Strength', score: 10, saveBonus: 1, proficientSave: false },
    { key: 'dex', label: 'Dexterity', score: 18, saveBonus: 9, proficientSave: true },
    { key: 'con', label: 'Constitution', score: 18, saveBonus: 5, proficientSave: false },
    { key: 'int', label: 'Intelligence', score: 19, saveBonus: 9, proficientSave: true },
    { key: 'wis', label: 'Wisdom', score: 12, saveBonus: 2, proficientSave: false },
    { key: 'cha', label: 'Charisma', score: 18, saveBonus: 5, proficientSave: false },
  ],
  skills: [
    { name: 'Acrobatics', ability: 'dex', bonus: 13, proficient: true, expertise: true },
    { name: 'Arcana', ability: 'int', bonus: 9, proficient: true },
    { name: 'Athletics', ability: 'str', bonus: 1, proficient: false },
    { name: 'Deception', ability: 'cha', bonus: 12, proficient: true, expertise: true },
    { name: 'History', ability: 'int', bonus: 9, proficient: true },
    { name: 'Insight', ability: 'wis', bonus: 2, proficient: false },
    { name: 'Investigation', ability: 'int', bonus: 14, proficient: true, expertise: true },
    { name: 'Perception', ability: 'wis', bonus: 5, proficient: true },
    { name: 'Persuasion', ability: 'cha', bonus: 12, proficient: true, expertise: true },
    { name: 'Sleight of Hand', ability: 'dex', bonus: 9, proficient: true },
    { name: 'Stealth', ability: 'dex', bonus: 13, proficient: true, expertise: true },
  ],
  attacks: [
    {
      id: 'crossbow-hand-1',
      name: 'Crossbow, Hand, +1',
      kind: 'Ranged Weapon',
      range: '30 (120)',
      hitDc: '+9',
      damage: '1d6+5',
      damageType: 'Piercing',
      equipped: true,
    },
    {
      id: 'dagger',
      name: 'Dagger',
      kind: 'Melee Weapon',
      range: '20 (60)',
      hitDc: '+8',
      damage: '1d4+4',
      damageType: 'Piercing',
      equipped: true,
    },
    {
      id: 'rapier',
      name: 'Rapier',
      kind: 'Melee Weapon',
      range: '5 ft. reach',
      hitDc: '+8',
      damage: '1d8+4',
      damageType: 'Piercing',
      equipped: true,
    },
    {
      id: 'shortsword-1',
      name: 'Shortsword, +1',
      kind: 'Melee Weapon',
      range: '5 ft. reach',
      hitDc: '+9',
      damage: '1d6+5',
      damageType: 'Piercing',
      equipped: true,
    },
    {
      id: 'fire-bolt',
      name: 'Fire Bolt',
      kind: 'Cantrip',
      range: '120 ft.',
      hitDc: '+8',
      damage: '3d10',
      damageType: 'Fire',
    },
    {
      id: 'ray-of-frost',
      name: 'Ray of Frost',
      kind: 'Cantrip',
      range: '60 ft.',
      hitDc: '+8',
      damage: '3d8',
      damageType: 'Cold',
    },
  ],
  spells: [
    {
      id: 'booming-blade',
      name: 'Booming Blade',
      level: 'Cantrip',
      school: 'Evocation',
      castingTime: '1 Action',
      range: 'Self (5 ft.)',
      hitDc: 'Weapon',
      damage: 'Weapon + thunder',
      prepared: true,
    },
    {
      id: 'green-flame-blade',
      name: 'Green-Flame Blade',
      level: 'Cantrip',
      school: 'Evocation',
      castingTime: '1 Action',
      range: 'Self (5 ft.)',
      hitDc: 'Weapon',
      damage: 'Weapon + fire',
      prepared: true,
    },
    {
      id: 'shield',
      name: 'Shield',
      level: '1st Level',
      school: 'Abjuration',
      castingTime: '1 Reaction',
      range: 'Self',
      hitDc: '+5 AC',
      prepared: true,
    },
    {
      id: 'absorb-elements',
      name: 'Absorb Elements',
      level: '1st Level',
      school: 'Abjuration',
      castingTime: '1 Reaction',
      range: 'Self',
      hitDc: 'Resistance',
      prepared: true,
    },
    {
      id: 'silvery-barbs',
      name: 'Silvery Barbs',
      level: '1st Level',
      school: 'Enchantment',
      castingTime: '1 Reaction',
      range: '60 ft.',
      hitDc: 'Reroll',
      prepared: true,
    },
  ],
  spellcasting: {
    ability: 'int',
    saveDc: 17,
    attackBonus: 8,
    slots: [
      { level: '1st', used: 1, max: 4 },
      { level: '2nd', used: 0, max: 3 },
    ],
  },
  inventory: [
    {
      id: 'cloak-protection',
      name: 'Cloak of Protection',
      category: 'Wondrous Item',
      weight: '--',
      quantity: '--',
      cost: '--',
      equipped: true,
    },
    {
      id: 'crossbow-hand-1-item',
      name: 'Crossbow, Hand, +1',
      category: 'Crossbow, Hand',
      weight: '3 lb.',
      quantity: '--',
      cost: '--',
      equipped: true,
    },
    {
      id: 'headband-intellect',
      name: 'Headband of Intellect',
      category: 'Wondrous Item',
      weight: '--',
      quantity: '--',
      cost: '--',
      equipped: true,
    },
    {
      id: 'shortsword-1-item',
      name: 'Shortsword, +1',
      category: 'Shortsword',
      weight: '2 lb.',
      quantity: '--',
      cost: '--',
      equipped: true,
    },
  ],
  money: { cp: 0, sp: 0, ep: 0, gp: 5, pp: 0 },
  features: [
    {
      id: 'sneak-attack',
      name: 'Sneak Attack',
      source: 'Rogue',
      summary:
        'Once per turn, deal extra damage when you hit with advantage or when an ally threatens the target.',
    },
    {
      id: 'cunning-action',
      name: 'Cunning Action',
      source: 'Rogue',
      summary: 'Take Dash, Disengage, or Hide as a bonus action.',
    },
    {
      id: 'uncanny-dodge',
      name: 'Uncanny Dodge',
      source: 'Rogue',
      summary: 'Use your reaction to halve damage from one attacker you can see.',
    },
    {
      id: 'bladesong',
      name: 'Bladesong',
      source: 'Wizard',
      summary:
        'Start a one-minute defensive battle focus. Track uses and reset them on a long rest.',
      uses: { label: 'Bladesong', used: 0, max: 4, reset: 'Long Rest' },
    },
    {
      id: 'breath-weapon',
      name: 'Breath Weapon',
      source: 'Dragonborn',
      summary: 'Exhale destructive energy. Save DC and damage are tracked with your species feature.',
      uses: { label: 'Breath Weapon', used: 0, max: 1, reset: 'Short or Long Rest' },
    },
  ],
  feats: [
    {
      id: 'war-caster',
      name: 'War Caster',
      summary: 'Improves spellcasting under pressure and supports opportunity spell reactions.',
    },
    {
      id: 'mobile',
      name: 'Mobile',
      summary: 'Increases movement and supports hit-and-run positioning.',
    },
  ],
  proficiencies: [
    'Light armor',
    'Simple weapons',
    'Hand crossbows',
    'Longswords',
    'Rapiers',
    'Shortswords',
    "Thieves' tools",
  ],
  languages: ['Common', 'Draconic', 'Elvish', 'Infernal'],
  personality: {
    traits: 'Careful in preparation, theatrical in execution.',
    ideals: 'Knowledge is most useful when it gets someone out alive.',
    bonds: 'Keeps old adventuring debts written in a private cipher.',
    flaws: 'Assumes he can talk his way out after making the dangerous choice.',
    backstory:
      'Gellin McFellon is a blue-scaled Dragonborn duelist-scholar who pairs rogue precision with wizard discipline.',
  },
  notes: [
    {
      id: 'campaign-notes',
      title: 'Campaign Notes',
      body: 'Track clues, NPC debts, prepared plans, and spell utility here.',
    },
  ],
};

function normalizeDndCharacter(value: unknown): DndCharacter {
  if (!value || typeof value !== 'object') return initialDndCharacter;
  const partial = value as Partial<DndCharacter>;
  return {
    ...initialDndCharacter,
    ...partial,
    hitPoints: {
      ...initialDndCharacter.hitPoints,
      ...partial.hitPoints,
      deathSaves: {
        ...initialDndCharacter.hitPoints.deathSaves,
        ...partial.hitPoints?.deathSaves,
      },
    },
    spellcasting: {
      ...initialDndCharacter.spellcasting,
      ...partial.spellcasting,
    },
    personality: {
      ...initialDndCharacter.personality,
      ...partial.personality,
    },
    money: {
      ...initialDndCharacter.money,
      ...partial.money,
    },
  };
}

const dndCharacterState = atom<DndCharacter>(initialDndCharacter);

const initialDndTab = readPersistentAppView('dungeons-and-dragons', 'tab', dndTabs, 'abilities');

export { dndCharacterState, dndTabs, initialDndCharacter, initialDndTab, normalizeDndCharacter };
export type {
  AbilityKey,
  AbilityScore,
  Attack,
  DndCharacter,
  DndTab,
  Feat,
  Feature,
  InventoryItem,
  Money,
  Skill,
  Spell,
};
