import type { EquipmentItem } from '@/components/fab-u';
import { selectableClasses } from '@/pages/FabU/selectableClasses';
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

const RANDOM_FIRST_NAMES = [
  'Alba',
  'Bram',
  'Ciela',
  'Dario',
  'Emina',
  'Fenn',
  'Ilyra',
  'Juno',
  'Kael',
  'Liora',
  'Mira',
  'Nico',
  'Orin',
  'Rhea',
  'Sable',
  'Tavi',
];

const RANDOM_LAST_NAMES = [
  'Ashvale',
  'Brightwater',
  'Duskfall',
  'Emberlain',
  'Frostmere',
  'Goldleaf',
  'Holloway',
  'Ironbell',
  'Moonridge',
  'Starling',
  'Stormward',
  'Vesper',
];

const RANDOM_NICKNAMES = [
  'Ace',
  'Bloom',
  'Cinder',
  'Echo',
  'Lucky',
  'Nova',
  'Patch',
  'Quill',
  'Scout',
  'Spark',
  'Wisp',
];

const RANDOM_IDENTITIES = [
  'Airship runaway',
  'Apprentice cartographer',
  'Clocktower duelist',
  'Exiled noble',
  'Festival prodigy',
  'Reluctant bodyguard',
  'Ruin-delving scholar',
  'Sky-port courier',
  'Village oathkeeper',
  'Wandering medic',
];

const RANDOM_THEMES = [
  'Ambition',
  'Belonging',
  'Discovery',
  'Duty',
  'Freedom',
  'Justice',
  'Legacy',
  'Redemption',
];

const RANDOM_ORIGINS = [
  'Ad Astya',
  'Aurelian Coast',
  'Brasswood',
  'Cloudbreak Isles',
  'Efowyn',
  'Infinita',
  'Moonlit Principality',
  'Old Meridian',
];

const RANDOM_BACKPACK_ITEMS: BackpackItem[] = [
  { id: 'lucky-charm', title: 'Lucky Charm', subtitle: 'warm to the touch before trouble.' },
  {
    id: 'folded-map',
    title: 'Folded Map',
    subtitle: 'full of annotations no one remembers adding.',
  },
  {
    id: 'signal-flare',
    title: 'Signal Flare',
    subtitle: 'bright enough to be seen through stormclouds.',
  },
  {
    id: 'travel-kettle',
    title: 'Travel Kettle',
    subtitle: 'a tiny comfort that has survived every road.',
  },
  {
    id: 'sealed-letter',
    title: 'Sealed Letter',
    subtitle: 'addressed in a hand you almost recognize.',
  },
];

const RANDOM_WEAPONS: EquipmentItem[] = [
  { name: 'Traveling Blade', slot: 'Main Hand', description: 'Melee weapon · DEX + MIG · HR + 6' },
  { name: 'Runic Staff', slot: 'Main Hand', description: 'Arcane weapon · INS + WLP · HR + 6' },
  { name: 'Clockwork Bow', slot: 'Main Hand', description: 'Ranged weapon · DEX + INS · HR + 6' },
  {
    name: 'Brass Knuckles',
    slot: 'Main Hand',
    description: 'Brawling weapon · MIG + MIG · HR + 6',
  },
];

const RANDOM_OFF_HANDS: EquipmentItem[] = [
  { name: 'Buckler', slot: 'Off Hand', description: '+1 Defense while raised.' },
  {
    name: 'Charm Focus',
    slot: 'Off Hand',
    description: 'A small focus for rituals and spellwork.',
  },
  {
    name: 'Utility Knife',
    slot: 'Off Hand',
    description: 'Useful for camp chores and desperate plans.',
  },
  { name: 'Lantern', slot: 'Off Hand', description: 'Its flame burns blue near magic.' },
];

const DIE_VALUES = { d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 } as const;
const ATTRIBUTE_DICE = ['d6', 'd8', 'd10', 'd12'] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: readonly T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickTwoDistinct<T>(items: readonly T[]): [T, T] {
  const [first, second] = shuffle(items);
  return [first, second];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createRandomClassEntries(): ClassEntry[] {
  const selected = shuffle(selectableClasses).slice(0, randomInt(2, 3));
  return selected.map((entry, index) => ({
    name: entry.name,
    level: index === 0 ? randomInt(2, 5) : randomInt(1, 3),
    subtitle:
      defaultSkillGroups
        .find((group) => group.className === entry.name)
        ?.skills.map((skill) => skill.name)
        .slice(0, 3)
        .join(' · ') || 'New talents waiting to be recorded',
  }));
}

function createRandomAttributes(): Character['attributes'] {
  const dice = shuffle(ATTRIBUTE_DICE);
  return {
    dex: { die: dice[0], modifier: randomInt(0, 1) },
    insight: { die: dice[1], modifier: randomInt(0, 1) },
    might: { die: dice[2], modifier: randomInt(0, 1) },
    willpower: { die: dice[3], modifier: randomInt(0, 1) },
  };
}

function createRandomBackstoryPrompts({
  classes,
  equipment,
  identity,
  name,
  origin,
  theme,
}: {
  classes: ClassEntry[];
  equipment: EquipmentItem[];
  identity: string[];
  name: Character['name'];
  origin: string;
  theme: string;
}): BackstoryPrompt[] {
  const firstName = name.firstName || name.nickName || 'this hero';
  const classNames = classes.map((entry) => entry.name);
  const signatureClass = classNames[0] ?? 'their calling';
  const secondClass = classNames[1] ?? signatureClass;
  const signatureItem = equipment[0]?.name ?? 'their trusted gear';
  const secondIdentity = identity[1] ?? identity[0] ?? 'wanderer';
  const candidates = [
    `What did ${firstName} leave unresolved in ${origin} when they became known as a ${identity[0]}?`,
    `How does ${firstName}'s drive for ${theme} complicate their training as a ${signatureClass}?`,
    `Who first trusted ${firstName} with the ${signatureItem}, and what promise came with it?`,
    `Why does ${firstName} hide their past as a ${secondIdentity} from their companions?`,
    `What lesson from ${secondClass} keeps pulling ${firstName} away from the easier path?`,
    `Which rumor about ${name.nickName || firstName} followed them out of ${origin}?`,
  ];

  return shuffle(candidates)
    .slice(0, 3)
    .map((prompt) => ({ prompt, response: '' }));
}

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

function createRandomFabUCharacter(): Character {
  const classes = createRandomClassEntries();
  const classNames = new Set(classes.map((entry) => entry.name));
  const attributes = createRandomAttributes();
  const level = classes.reduce((sum, entry) => sum + entry.level, 0);
  const hpBonus = randomInt(0, 6);
  const mpBonus = randomInt(0, 6);
  const maxHP = DIE_VALUES[attributes.might.die] * 5 + level + hpBonus;
  const maxMP = DIE_VALUES[attributes.willpower.die] * 5 + level + mpBonus;
  const identity = pickTwoDistinct(RANDOM_IDENTITIES);
  const name = {
    firstName: pickRandom(RANDOM_FIRST_NAMES),
    lastName: pickRandom(RANDOM_LAST_NAMES),
    nickName: Math.random() < 0.5 ? pickRandom(RANDOM_NICKNAMES) : undefined,
  };
  const theme = pickRandom(RANDOM_THEMES);
  const origin = pickRandom(RANDOM_ORIGINS);
  const equipment = [pickRandom(RANDOM_WEAPONS), pickRandom(RANDOM_OFF_HANDS)].map((item) => ({
    ...item,
  }));

  return {
    ...createDefaultCharacter(),
    name,
    initiative: randomInt(0, 2),
    defense: randomInt(8, 10),
    defenseTemp: null,
    magicDefense: randomInt(8, 10),
    magicDefenseTemp: null,
    fabulaPoints: randomInt(3, 5),
    inventoryPoints: randomInt(6, 10),
    currentHP: maxHP,
    hpBonus,
    currentMP: maxMP,
    mpBonus,
    currentXP: randomInt(0, 8),
    totalXP: 10,
    level,
    zenit: randomInt(20, 120),
    attributes,
    bonds: [],
    backstoryPrompts: createRandomBackstoryPrompts({
      classes,
      equipment,
      identity,
      name,
      origin,
      theme,
    }),
    notes: 'A new hero steps onto the road. Their story is ready to be discovered.',
    classes,
    skillGroups: clone(defaultSkillGroups).filter((group) => classNames.has(group.className)),
    spellGroups: clone(defaultSpellGroups).filter((group) => classNames.has(group.className)),
    equipment,
    backpack: shuffle(RANDOM_BACKPACK_ITEMS)
      .slice(0, 2)
      .map((item) => ({ ...item })),
    statusEffects: { ...STATUS_EFFECT_DEFAULTS },
    traits: {
      identity,
      theme,
      origin,
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
  createRandomFabUCharacter,
};
