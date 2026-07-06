import {
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link } from 'react-router';

import AddIcon from '@mui/icons-material/Add';
import AppsIcon from '@mui/icons-material/Apps';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, keyframes } from '@mui/material/styles';

import { useQuery } from 'convex/react';
import { atom, useAtom } from 'jotai';
import { Backpack, ChevronDown, Grid3X3, House, Lightbulb, Search, Sword, X } from 'lucide-react';

import type { DieSize } from '@/components/DiceRoller/diceRollResults';
import { dispatchTabletopDiceRoll } from '@/components/DiceRoller/rollEvents';
import { SwipeableAction, SwipeableCard } from '@/components/SwipeableCard';
import AccountSettings from '@/sections/AccountSettings';
import { persistAppView } from '@/state/persistentAppLocation';
import { useLocalCharacterSlots } from '@/state/useLocalCharacterSlots';
import type { LocalCharacterSummary } from '@/state/useLocalCharacterSlots';
import { useConvexCharacterSync } from '@/sync/useConvexCharacterSync';
import { useThemeMode } from '@/theme/hooks';
import { ThemeMode } from '@/theme/types';

import { api } from '../../../convex/_generated/api';
import { DUNGEONS_AND_DRAGONS_FEATS } from '../../../convex/data/dungeonsAndDragonsFeats';
import { DUNGEONS_AND_DRAGONS_FEATURES } from '../../../convex/data/dungeonsAndDragonsFeatures';
import type {
  AbilityKey,
  AbilityScore,
  Attack,
  DndCharacter,
  DndTab,
  Feat,
  Feature,
  HitDicePool,
  InventoryItem,
  Money,
  Skill,
  Spell,
} from './atoms';
import {
  dndCharacterState,
  initialDndCharacter,
  initialDndTab,
  normalizeDndCharacter,
} from './atoms';
import { deriveDndClassFields, formatSpellcasting } from './classDerivation';
import { DND_SCHEMA_VERSION, deserializeDndCharacter, serializeDndCharacter } from './persistence';
import { applyDndRest, hitDieAverageHeal, spendDndHitDie } from './rest';
import type { DndRestType } from './rest';
import { standardDndSpellCatalog } from './standardDndSpellCatalog';
import { useDndCharacterHistory } from './useCharacterHistory';

const activeDndTabState = atom<DndTab>(initialDndTab);
const DND_GAME_SYSTEM = 'dungeons-and-dragons';
const DND_PENDING_SYNC_KEY = 'dnd-convex-pending-character';
const DND_SELECT_CHARACTER_EVENT = 'dnd-select-character';
const DND_OPEN_TAB_MENU_EVENT = 'dnd-open-tab-menu';
type RestType = DndRestType;

const darkDndColors = {
  page: '#10181d',
  chrome: '#22313a',
  panel: '#11191e',
  panelSoft: '#1c2a32',
  panelStrong: '#0b1114',
  border: '#334957',
  borderSoft: '#263844',
  text: '#f2f5f6',
  muted: '#9aa9b4',
  red: '#e40712',
  redDark: '#b7070f',
  blue: '#1ea7ff',
  green: '#57bc45',
  gold: '#f0b948',
};

const lightDndColors: typeof darkDndColors = {
  page: '#f5f7f9',
  chrome: '#ffffff',
  panel: '#ffffff',
  panelSoft: '#f0f3f6',
  panelStrong: '#fbfcfd',
  border: '#c8d1d9',
  borderSoft: '#dde4ea',
  text: '#10181d',
  muted: '#5e6f7c',
  red: '#e40712',
  redDark: '#b7070f',
  blue: '#0876bd',
  green: '#348a2c',
  gold: '#b97904',
};

const dndColors = { ...darkDndColors };

const inspirationPullOn = keyframes`
  0% { transform: translate(-50%, 0); }
  46% { transform: translate(-50%, 11px); }
  72% { transform: translate(-50%, 5px); }
  100% { transform: translate(-50%, 7px); }
`;

const inspirationPullOff = keyframes`
  0% { transform: translate(-50%, 7px); }
  34% { transform: translate(-50%, 11px); }
  100% { transform: translate(-50%, 0); }
`;

const campfireFlicker = keyframes`
  0%, 100% { transform: translateY(0) scaleX(1) scaleY(1); opacity: 0.95; }
  24% { transform: translateY(-1px) scaleX(0.92) scaleY(1.12); opacity: 1; }
  55% { transform: translateY(0.5px) scaleX(1.08) scaleY(0.96); opacity: 0.9; }
  78% { transform: translateY(-0.5px) scaleX(0.98) scaleY(1.06); opacity: 1; }
`;

const initiativePulse = keyframes`
  0% { transform: translateX(-50%) scale(1); opacity: 0.88; }
  58% { opacity: 0.34; }
  100% { transform: translateX(-50%) scale(2.16); opacity: 0; }
`;

const dndSwipeEditColor = '#687782';

const diceRollBoxGlowSx = {
  borderColor: alpha('#ffffff', 0.62),
  boxShadow: `0 0 9px ${alpha('#ffffff', 0.24)}, inset 0 0 7px ${alpha('#ffffff', 0.08)}`,
};

const abilityKeys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const dndSkillDescriptions: Record<string, string> = {
  acrobatics: 'Keep your balance, tumble, slip free, or perform agile maneuvers.',
  'animal handling': 'Calm, control, intuit, or guide domesticated or wild animals.',
  arcana: 'Recall lore about spells, magic items, planes, symbols, and magical traditions.',
  athletics: 'Climb, jump, swim, grapple, shove, or apply physical force.',
  deception: 'Hide the truth, mislead others, disguise intentions, or pass off a lie.',
  history: 'Recall lore about historical events, peoples, kingdoms, wars, and legends.',
  insight: 'Read motives, moods, lies, or intent through behavior and speech.',
  intimidation: 'Influence through threats, pressure, forceful presence, or hostile action.',
  investigation: 'Search for clues, infer meaning, and deduce how something works.',
  medicine: 'Stabilize the dying, diagnose illness, identify wounds, or provide care.',
  nature: 'Recall lore about terrain, plants, animals, weather, and natural cycles.',
  perception: 'Notice hidden creatures, sounds, details, danger, or anything sensed directly.',
  performance: 'Entertain or impress through music, acting, storytelling, dance, or showmanship.',
  persuasion: 'Influence with tact, diplomacy, etiquette, honest argument, or good faith.',
  religion: 'Recall lore about deities, rites, prayers, holy symbols, cults, and planes.',
  'sleight of hand': 'Pick pockets, palm objects, plant items, or perform fine manual tricks.',
  stealth: 'Hide, move quietly, avoid notice, or slip past observers.',
  survival: 'Track, navigate, forage, predict hazards, follow signs, and endure wilderness travel.',
};

function getDndSkillDescription(skill: Skill) {
  return (
    dndSkillDescriptions[skill.name.toLowerCase()] ??
    `Use ${skill.name} when the table calls for a ${skill.ability.toUpperCase()} based check.`
  );
}

const dndSubclassOptionsByClass: Record<string, string[]> = {
  artificer: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith'],
  barbarian: [
    'Path of the Ancestral Guardian',
    'Path of the Battlerager',
    'Path of the Beast',
    'Path of the Berserker',
    'Path of the Giant',
    'Path of the Storm Herald',
    'Path of the Totem Warrior',
    'Path of Wild Magic',
    'Path of the World Tree',
    'Path of the Zealot',
  ],
  bard: [
    'College of Creation',
    'College of Dance',
    'College of Eloquence',
    'College of Glamour',
    'College of Lore',
    'College of Spirits',
    'College of Swords',
    'College of Valor',
    'College of Whispers',
  ],
  'blood hunter': [
    'Order of the Ghostslayer',
    'Order of the Lycan',
    'Order of the Mutant',
    'Order of the Profane Soul',
  ],
  cleric: [
    'Arcana Domain',
    'Death Domain',
    'Forge Domain',
    'Grave Domain',
    'Knowledge Domain',
    'Life Domain',
    'Light Domain',
    'Nature Domain',
    'Order Domain',
    'Peace Domain',
    'Tempest Domain',
    'Trickery Domain',
    'Twilight Domain',
    'War Domain',
  ],
  druid: [
    'Circle of Dreams',
    'Circle of the Land',
    'Circle of the Moon',
    'Circle of the Sea',
    'Circle of the Shepherd',
    'Circle of Spores',
    'Circle of Stars',
    'Circle of Wildfire',
  ],
  fighter: [
    'Arcane Archer',
    'Battle Master',
    'Cavalier',
    'Champion',
    'Echo Knight',
    'Eldritch Knight',
    'Psi Warrior',
    'Purple Dragon Knight',
    'Rune Knight',
    'Samurai',
  ],
  monk: [
    'Way of the Ascendant Dragon',
    'Way of the Astral Self',
    'Way of the Cobalt Soul',
    'Way of the Drunken Master',
    'Way of the Four Elements',
    'Way of the Kensei',
    'Way of the Long Death',
    'Way of Mercy',
    'Way of the Open Hand',
    'Way of Shadow',
    'Way of the Sun Soul',
  ],
  mystic: ['Order of the Awakened', 'Order of the Immortal', 'Order of the Nomad'],
  paladin: [
    'Oath of the Ancients',
    'Oath of Conquest',
    'Oath of the Crown',
    'Oath of Devotion',
    'Oath of Glory',
    'Oathbreaker',
    'Oath of Redemption',
    'Oath of the Watchers',
    'Oath of Vengeance',
  ],
  pugilist: [
    'Arena Royale',
    'Bloodhound Bruisers',
    'Dog & Hound',
    'Hand of Dread',
    'Lead Eaters',
    'Piss & Vinegar',
    'Pledges of the Goodmother',
    'The Squared Circle',
    'The Sweet Science',
  ],
  ranger: [
    'Beast Master',
    'Drakewarden',
    'Fey Wanderer',
    'Gloom Stalker',
    'Horizon Walker',
    'Hunter',
    'Monster Slayer',
    'Swarmkeeper',
  ],
  rogue: [
    'Arcane Trickster',
    'Assassin',
    'Inquisitive',
    'Mastermind',
    'Phantom',
    'Scout',
    'Soulknife',
    'Swashbuckler',
    'Thief',
  ],
  sorcerer: [
    'Aberrant Mind',
    'Clockwork Soul',
    'Divine Soul',
    'Draconic Sorcery',
    'Lunar Sorcery',
    'Shadow Magic',
    'Storm Sorcery',
    'Wild Magic',
  ],
  warlock: [
    'The Archfey',
    'The Celestial',
    'The Fathomless',
    'The Fiend',
    'The Genie',
    'The Great Old One',
    'The Hexblade',
    'The Undead',
    'The Undying',
  ],
  wizard: [
    'Abjuration',
    'Bladesinging',
    'Chronurgy Magic',
    'Conjuration',
    'Divination',
    'Enchantment',
    'Evocation',
    'Graviturgy Magic',
    'Illusion',
    'Necromancy',
    'Order of Scribes',
    'Transmutation',
    'War Magic',
  ],
};

const dndDamageTypeLabels: Record<string, string> = {
  a: 'Acid',
  acid: 'Acid',
  b: 'Bludgeoning',
  bludgeoning: 'Bludgeoning',
  c: 'Cold',
  cold: 'Cold',
  f: 'Fire',
  fire: 'Fire',
  force: 'Force',
  l: 'Lightning',
  lightning: 'Lightning',
  n: 'Necrotic',
  necrotic: 'Necrotic',
  p: 'Piercing',
  piercing: 'Piercing',
  po: 'Poison',
  poison: 'Poison',
  ps: 'Psychic',
  psychic: 'Psychic',
  r: 'Radiant',
  radiant: 'Radiant',
  s: 'Slashing',
  slashing: 'Slashing',
  t: 'Thunder',
  thunder: 'Thunder',
};

function getDndConditionActiveColor(condition: string) {
  return condition === 'Invisible' ? dndColors.blue : dndColors.red;
}

function formatDamageTypeLabel(value: string) {
  const trimmed = value.trim();
  return dndDamageTypeLabels[trimmed.toLowerCase()] ?? trimmed;
}

const dndConditions = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
];

const dndConditionDescriptions: Record<string, string> = {
  Blinded:
    'Cannot see; automatically fails sight checks. Attacks against you have advantage, and your attacks have disadvantage.',
  Charmed:
    'Cannot attack the charmer or target them with harmful abilities. The charmer has advantage on social checks against you.',
  Deafened: 'Cannot hear and automatically fails checks that require hearing.',
  Frightened:
    'Disadvantage on checks and attacks while the source is in sight, and you cannot willingly move closer to it.',
  Grappled: 'Speed becomes 0. Ends if the grappler is incapacitated or you are moved out of reach.',
  Incapacitated: 'Cannot take actions or reactions.',
  Invisible:
    'Cannot be seen without special senses. Your attacks have advantage, and attacks against you have disadvantage.',
  Paralyzed:
    'Incapacitated, cannot move or speak, fails Strength/Dex saves, attacks against you have advantage, and nearby hits crit.',
  Petrified:
    'Transformed into inert stone-like material, incapacitated, unaware, resistant to damage, and immune to poison/disease.',
  Poisoned: 'Disadvantage on attack rolls and ability checks.',
  Prone:
    'Only crawl unless you stand. Your attacks have disadvantage; nearby attacks against you have advantage.',
  Restrained:
    'Speed becomes 0, attacks against you have advantage, your attacks have disadvantage, and Dex saves have disadvantage.',
  Stunned:
    'Incapacitated, cannot move, can speak falteringly, fails Strength/Dex saves, and attacks against you have advantage.',
  Unconscious:
    'Incapacitated, cannot move or speak, unaware, drops held items, falls prone, fails Strength/Dex saves, and nearby hits crit.',
};

const exhaustionEffects = [
  'No exhaustion.',
  'Level 1: disadvantage on ability checks.',
  'Level 2: speed halved.',
  'Level 3: disadvantage on attack rolls and saving throws.',
  'Level 4: hit point maximum halved.',
  'Level 5: speed reduced to 0.',
  'Level 6: death.',
];

const dndItemCatalog: Array<Omit<InventoryItem, 'id' | 'equipped'>> = [
  {
    name: 'Leather Armor',
    category: 'Light Armor',
    weight: '10 lb.',
    quantity: '1',
    cost: '10',
    armorClassModifier: 1,
  },
  {
    name: 'Studded Leather Armor',
    category: 'Light Armor',
    weight: '13 lb.',
    quantity: '1',
    cost: '45',
    armorClassModifier: 2,
  },
  {
    name: 'Shield',
    category: 'Shield',
    weight: '6 lb.',
    quantity: '1',
    cost: '10',
    armorClassModifier: 2,
  },
  { name: 'Dagger', category: 'Melee Weapon', weight: '1 lb.', quantity: '1', cost: '2' },
  { name: 'Rapier', category: 'Melee Weapon', weight: '2 lb.', quantity: '1', cost: '25' },
  { name: 'Shortsword', category: 'Melee Weapon', weight: '2 lb.', quantity: '1', cost: '10' },
  { name: 'Crossbow, Hand', category: 'Ranged Weapon', weight: '3 lb.', quantity: '1', cost: '75' },
  { name: "Thieves' Tools", category: 'Tools', weight: '1 lb.', quantity: '1', cost: '25' },
  {
    name: "Explorer's Pack",
    category: 'Adventuring Gear',
    weight: '59 lb.',
    quantity: '1',
    cost: '10',
  },
  { name: 'Potion of Healing', category: 'Potion', weight: '0.5 lb.', quantity: '1', cost: '50' },
];

const MAX_ROLL_DICE = 20;

type SpellCatalogEntry = Omit<Spell, 'id' | 'prepared'> & {
  classes?: string[];
  category?: string;
  metadata?: {
    gameSystem?: string;
    type?: string;
  };
  meta?: {
    gameSystem?: string;
  };
  type?: string;
};

type ItemCatalogEntry = Omit<InventoryItem, 'id' | 'equipped'> & {
  metadata?: {
    gameSystem?: string;
    type?: string;
    sourceType?: string;
    index?: string;
  };
  meta?: {
    gameSystem?: string;
  };
  type?: string;
};

type FeatCatalogEntry = Omit<Feat, 'id'> & {
  category?: string;
  prerequisite?: string;
  source?: string;
  sourceUrl?: string;
  licenseUrl?: string;
  metadata?: {
    gameSystem?: string;
    type?: string;
    sourceType?: string;
    index?: string;
  };
  meta?: {
    gameSystem?: string;
  };
  type?: string;
};

type FeatureCatalogEntry = Omit<Feature, 'id' | 'uses'> & {
  category?: string;
  level?: number;
  className?: string;
  subclassName?: string;
  prerequisites?: string[];
  sourceUrl?: string;
  licenseUrl?: string;
  metadata?: {
    gameSystem?: string;
    type?: string;
    sourceType?: string;
    index?: string;
  };
  meta?: {
    gameSystem?: string;
  };
  type?: string;
};

type WizardClassFeature = {
  id: string;
  name: string;
  source: string;
  summary: string;
  level: number | null;
  available: boolean;
  category?: string;
};

function catalogItemToInventoryItem(item: ItemCatalogEntry): InventoryItem {
  return {
    id: createEntryId('item'),
    name: item.name,
    category: item.category,
    weight: item.weight,
    quantity: item.quantity,
    cost: item.cost,
    equipped: false,
    ...(typeof item.armorClassModifier === 'number'
      ? { armorClassModifier: item.armorClassModifier }
      : {}),
    ...(item.description ? { description: item.description } : {}),
    ...(item.rarity ? { rarity: item.rarity } : {}),
    ...(item.source ? { source: item.source } : {}),
    ...(item.sourceUrl ? { sourceUrl: item.sourceUrl } : {}),
    ...(item.licenseUrl ? { licenseUrl: item.licenseUrl } : {}),
    ...(item.properties ? { properties: item.properties } : {}),
    ...(item.damage ? { damage: item.damage } : {}),
    ...(item.damageType ? { damageType: item.damageType } : {}),
  };
}

function catalogFeatToFeat(feat: FeatCatalogEntry): Feat {
  return {
    id: createEntryId('feat'),
    name: feat.name,
    summary: feat.summary,
  };
}

function catalogFeatureToFeature(feature: FeatureCatalogEntry): Feature {
  return {
    id: createEntryId('feature'),
    name: feature.name,
    source: feature.source,
    summary: feature.summary,
  };
}

const dndSpellDescriptionsByName: Record<string, string> = {
  'fire bolt':
    'Make a ranged spell attack against one creature or object in range. On a hit, the target takes fire damage. Flammable unattended objects can ignite.',
  'ray of frost':
    'Make a ranged spell attack against one creature. On a hit, the target takes cold damage and its speed is reduced by 10 feet until the start of your next turn.',
  'mage hand':
    'Create a spectral hand at a point within range. You can use it to manipulate objects, open unlocked doors or containers, stow or retrieve items, or pour contents from a vial. It cannot attack, activate magic items, or carry more than 10 pounds.',
  'booming blade':
    'Make a melee weapon attack against one creature within 5 feet. On a hit, the attack lands normally and the target is wrapped in unstable thunder magic. If it willingly moves before your next turn, it takes thunder damage.',
  'green-flame blade':
    'Make a melee weapon attack against one creature within 5 feet. On a hit, the attack lands normally and green fire can jump to a second creature near the target, dealing fire damage based on your spellcasting ability.',
  shield:
    'When you are hit by an attack or targeted by magic missile, use your reaction to gain +5 AC until the start of your next turn, including against the triggering attack, and take no damage from magic missile.',
  'absorb elements':
    'When you take acid, cold, fire, lightning, or thunder damage, use your reaction to gain resistance to that damage type for the triggering damage. The first melee attack you hit with on your next turn deals extra damage of that type.',
  'silvery barbs':
    'When a creature you can see succeeds on an attack roll, ability check, or saving throw, force it to reroll and use the lower result, then grant advantage to another creature you can see on its next attack roll, ability check, or saving throw within the spell duration.',
  'magic missile':
    'Create three darts of magical force. Each dart hits a creature of your choice that you can see within range and deals force damage. The darts strike simultaneously and can target one creature or several.',
  'detect magic':
    'For the duration, sense the presence of magic nearby. You can use your action to see a faint aura around visible magical creatures or objects and learn the school of magic, if any.',
  'misty step':
    'Briefly vanish in silvery mist and teleport up to 30 feet to an unoccupied space you can see.',
  invisibility:
    'A creature you touch becomes invisible until the spell ends. The spell ends early for a target that attacks or casts a spell.',
};

const dndSpellEffectsByName: Record<string, string> = {
  'absorb elements': '1d6',
  'booming blade': 'Thunder',
  'detect magic': 'Utility',
  'fire bolt': '1d10',
  'green-flame blade': 'Fire',
  invisibility: 'Buff',
  'mage hand': 'Utility',
  'magic missile': '3d4+3',
  'misty step': 'Utility',
  'ray of frost': '1d8',
  shield: '+5 AC',
  'silvery barbs': 'Reroll',
};

const dndSpellCatalog: SpellCatalogEntry[] = [
  {
    name: 'Fire Bolt',
    level: 'Cantrip',
    school: 'Evocation',
    castingTime: '1 Action',
    range: '120 ft.',
    hitDc: '+8',
    damage: '1d10',
    effect: dndSpellEffectsByName['fire bolt'],
    description: dndSpellDescriptionsByName['fire bolt'],
    classes: ['Wizard'],
  },
  {
    name: 'Ray of Frost',
    level: 'Cantrip',
    school: 'Evocation',
    castingTime: '1 Action',
    range: '60 ft.',
    hitDc: '+8',
    damage: '1d8',
    effect: dndSpellEffectsByName['ray of frost'],
    description: dndSpellDescriptionsByName['ray of frost'],
    classes: ['Wizard'],
  },
  {
    name: 'Mage Hand',
    level: 'Cantrip',
    school: 'Conjuration',
    castingTime: '1 Action',
    range: '30 ft.',
    hitDc: 'Utility',
    effect: dndSpellEffectsByName['mage hand'],
    description: dndSpellDescriptionsByName['mage hand'],
    classes: ['Wizard'],
  },
  {
    name: 'Booming Blade',
    level: 'Cantrip',
    school: 'Evocation',
    castingTime: '1 Action',
    range: 'Self (5-foot radius)',
    hitDc: 'Weapon',
    damage: '1d8',
    effect: dndSpellEffectsByName['booming blade'],
    description: dndSpellDescriptionsByName['booming blade'],
    higherLevel:
      'At 5th level, the melee attack deals extra thunder damage and the movement rider increases. Both damage amounts increase again at 11th and 17th level.',
    components: 'S, M',
    material: 'A melee weapon worth at least 1 sp',
    duration: '1 round',
    source: "Tasha's Cauldron of Everything",
    sourceUrl: 'https://dnd5e.wikidot.com/spell:booming-blade',
    classes: ['Artificer', 'Sorcerer', 'Warlock', 'Wizard'],
  },
  {
    name: 'Green-Flame Blade',
    level: 'Cantrip',
    school: 'Evocation',
    castingTime: '1 Action',
    range: 'Self (5-foot radius)',
    hitDc: 'Weapon',
    damage: '1d8',
    effect: dndSpellEffectsByName['green-flame blade'],
    description: dndSpellDescriptionsByName['green-flame blade'],
    higherLevel:
      'At 5th level, the melee attack deals extra fire damage and the leaping flame damage increases. Both damage amounts increase again at 11th and 17th level.',
    components: 'S, M',
    material: 'A melee weapon worth at least 1 sp',
    duration: 'Instantaneous',
    source: "Tasha's Cauldron of Everything",
    sourceUrl: 'https://dnd5e.wikidot.com/spell:green-flame-blade',
    classes: ['Artificer', 'Sorcerer', 'Warlock', 'Wizard'],
  },
  {
    name: 'Shield',
    level: '1st Level',
    school: 'Abjuration',
    castingTime: '1 Reaction',
    range: 'Self',
    hitDc: '+5 AC',
    effect: dndSpellEffectsByName.shield,
    description: dndSpellDescriptionsByName.shield,
    classes: ['Wizard'],
  },
  {
    name: 'Absorb Elements',
    level: '1st Level',
    school: 'Abjuration',
    castingTime: '1 Reaction',
    range: 'Self',
    hitDc: 'Resistance',
    effect: dndSpellEffectsByName['absorb elements'],
    description: dndSpellDescriptionsByName['absorb elements'],
    classes: ['Wizard'],
  },
  {
    name: 'Silvery Barbs',
    level: '1st Level',
    school: 'Enchantment',
    castingTime: '1 Reaction',
    range: '60 ft.',
    hitDc: 'Reroll',
    effect: dndSpellEffectsByName['silvery barbs'],
    description: dndSpellDescriptionsByName['silvery barbs'],
    classes: ['Wizard'],
  },
  {
    name: 'Magic Missile',
    level: '1st Level',
    school: 'Evocation',
    castingTime: '1 Action',
    range: '120 ft.',
    hitDc: 'Auto',
    damage: '3d4+3',
    effect: dndSpellEffectsByName['magic missile'],
    description: dndSpellDescriptionsByName['magic missile'],
    classes: ['Wizard'],
  },
  {
    name: 'Detect Magic',
    level: '1st Level',
    school: 'Divination',
    castingTime: '1 Action',
    range: 'Self',
    hitDc: 'Utility',
    effect: dndSpellEffectsByName['detect magic'],
    description: dndSpellDescriptionsByName['detect magic'],
    classes: ['Wizard'],
  },
  {
    name: 'Misty Step',
    level: '2nd Level',
    school: 'Conjuration',
    castingTime: '1 Bonus Action',
    range: 'Self',
    hitDc: 'Utility',
    effect: dndSpellEffectsByName['misty step'],
    description: dndSpellDescriptionsByName['misty step'],
    classes: ['Wizard'],
  },
  {
    name: 'Invisibility',
    level: '2nd Level',
    school: 'Illusion',
    castingTime: '1 Action',
    range: 'Touch',
    hitDc: 'Utility',
    effect: dndSpellEffectsByName.invisibility,
    description: dndSpellDescriptionsByName.invisibility,
    classes: ['Wizard'],
  },
];

const standardDndSpellCatalogEntries: SpellCatalogEntry[] = standardDndSpellCatalog.map(
  (spell) => ({
    ...spell,
    classes: [...spell.classes],
  }),
);

function mergeSpellCatalogs(...catalogs: SpellCatalogEntry[][]) {
  const byName = new Map<string, SpellCatalogEntry>();
  catalogs.flat().forEach((spell) => {
    const name = asNonEmptyString(spell.name);
    if (!name) return;
    byName.set(name.toLowerCase(), {
      ...byName.get(name.toLowerCase()),
      ...spell,
      classes: Array.isArray(spell.classes)
        ? [...spell.classes]
        : byName.get(name.toLowerCase())?.classes,
    });
  });
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

type DndClassDoc = {
  class?: {
    className?: string;
    subclasses?: unknown[];
    hitDie?: string;
    primaryAbilities?: string[];
    savingThrows?: string[];
    armorProficiencies?: string[];
    weaponProficiencies?: string[];
    toolProficiencies?: string[];
    skillChoices?: {
      choose?: number;
      from?: string[] | string;
    };
    spellcasting?: {
      type?: string;
      ability?: string;
      ritualCasting?: boolean;
      preparation?: string;
    } | null;
    classResource?: {
      name?: string;
      ability?: string;
      resource?: string;
    };
    sourceType?: string;
  };
};

type DndClassInfo = NonNullable<DndClassDoc['class']>;
function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeClassCatalogKey(value: string) {
  return value.trim().toLowerCase();
}

function getCatalogSubclassName(value: unknown): string | null {
  if (typeof value === 'string') return asNonEmptyString(value);
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { name?: unknown; subclassName?: unknown; title?: unknown };
  return (
    asNonEmptyString(candidate.name) ??
    asNonEmptyString(candidate.subclassName) ??
    asNonEmptyString(candidate.title)
  );
}

function getCatalogSubclassOptions(classInfo?: DndClassInfo) {
  return Array.isArray(classInfo?.subclasses)
    ? classInfo.subclasses
        .map(getCatalogSubclassName)
        .filter((subclass): subclass is string => subclass !== null)
    : [];
}

function getSubclassOptionsForClass(
  className: string,
  currentValue: string,
  subclassOptionsByClassName: Map<string, string[]>,
) {
  const options = subclassOptionsByClassName.get(normalizeClassCatalogKey(className)) ?? [];
  return [
    '',
    ...new Set([currentValue, ...options].map((value) => value.trim()).filter(Boolean)),
  ].sort((a, b) => {
    if (!a) return -1;
    if (!b) return 1;
    return a.localeCompare(b);
  });
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function isAbilityKey(value: string): value is AbilityKey {
  return abilityKeys.includes(value as AbilityKey);
}

function skillBonusFor(options: {
  abilityScore: number;
  proficiencyBonus: number;
  proficient: boolean;
  expertise: boolean;
}) {
  const proficiencyMultiplier = options.proficient ? (options.expertise ? 2 : 1) : 0;
  return abilityModifier(options.abilityScore) + options.proficiencyBonus * proficiencyMultiplier;
}

function createEntryId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDndCharacter() {
  return {
    ...initialDndCharacter,
    id: createEntryId('dnd-character'),
    name: 'New Adventurer',
    hitPoints: {
      ...initialDndCharacter.hitPoints,
      hitDicePools: initialDndCharacter.hitPoints.hitDicePools.map((entry) => ({ ...entry })),
      deathSaves: { ...initialDndCharacter.hitPoints.deathSaves },
    },
    classes: initialDndCharacter.classes.map((entry) => ({ ...entry })),
    abilities: initialDndCharacter.abilities.map((entry) => ({ ...entry })),
    skills: initialDndCharacter.skills.map((entry) => ({ ...entry })),
    attacks: initialDndCharacter.attacks.map((entry) => ({
      ...entry,
      id: createEntryId('attack'),
    })),
    spells: initialDndCharacter.spells.map((entry) => ({ ...entry, id: createEntryId('spell') })),
    spellcasting: {
      ...initialDndCharacter.spellcasting,
      slots: initialDndCharacter.spellcasting.slots.map((entry) => ({ ...entry })),
    },
    inventory: initialDndCharacter.inventory.map((entry) => ({
      ...entry,
      id: createEntryId('item'),
    })),
    money: { ...initialDndCharacter.money },
    features: initialDndCharacter.features.map((entry) => ({
      ...entry,
      uses: entry.uses ? { ...entry.uses } : undefined,
    })),
    feats: initialDndCharacter.feats.map((entry) => ({ ...entry })),
    proficiencies: [...initialDndCharacter.proficiencies],
    languages: [...initialDndCharacter.languages],
    personality: { ...initialDndCharacter.personality },
    notes: initialDndCharacter.notes.map((entry) => ({ ...entry, id: createEntryId('note') })),
  };
}

function migrateDndLocalCharacter(_key: string, initialValue: DndCharacter) {
  return normalizeDndCharacter(initialValue);
}

function describeDndCharacter(character: DndCharacter) {
  return character.name.trim() || 'Unnamed Character';
}

function parseIntOrFallback(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseHitDicePools(value: string, fallback: HitDicePool[]) {
  const pools = new Map<string, number>();
  const matches = value.matchAll(/(\d+)\s*d\s*(\d+)/giu);
  for (const match of matches) {
    const count = Number.parseInt(match[1] ?? '', 10);
    const sides = Number.parseInt(match[2] ?? '', 10);
    if (!Number.isFinite(count) || !Number.isFinite(sides) || count <= 0 || sides <= 0) continue;
    const die = `d${sides}`;
    pools.set(die, (pools.get(die) ?? 0) + count);
  }
  if (pools.size === 0) return fallback.map((pool) => ({ ...pool }));
  const parsedPools = Array.from(pools.entries()).map(([die, max]) => {
    const existing = fallback.find((pool) => pool.die === die);
    return { die, max, used: Math.min(max, Math.max(0, existing?.used ?? 0)) };
  });
  const parsedDice = new Set(parsedPools.map((pool) => pool.die));
  return [
    ...parsedPools,
    ...fallback.filter((pool) => !parsedDice.has(pool.die)).map((pool) => ({ ...pool })),
  ];
}

function formatHitDicePools(pools: HitDicePool[]) {
  if (pools.length === 0) return 'No hit dice';
  return pools.map((pool) => `${pool.max - pool.used}/${pool.max}${pool.die}`).join(' + ');
}

function parseSignedModifier(value: string | number) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const match = value.match(/[+-]?\d+/u);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function parseDiceExpression(value: string): { dice: DieSize[]; modifier: number } | null {
  const dice: DieSize[] = [];
  let modifier = 0;
  const diceMatches = value.matchAll(/(\d*)d(4|6|8|10|12|20|100)/giu);
  for (const match of diceMatches) {
    const count = Number.parseInt(match[1] || '1', 10);
    const sides = Number.parseInt(match[2] ?? '', 10) as DieSize;
    if (!Number.isFinite(count) || count <= 0) continue;
    for (let index = 0; index < count && dice.length < MAX_ROLL_DICE; index += 1) {
      dice.push(sides);
    }
  }
  const withoutDice = value.replace(/\d*d(?:4|6|8|10|12|20|100)/giu, '');
  for (const match of withoutDice.matchAll(/[+-]\s*\d+/gu)) {
    modifier += Number.parseInt(match[0].replace(/\s/g, ''), 10);
  }
  return dice.length > 0 ? { dice, modifier } : null;
}

function rollD20(label: string, modifier: string | number) {
  dispatchTabletopDiceRoll({ label, dice: [20], modifier: parseSignedModifier(modifier) });
}

function rollDiceExpression(label: string, expression: string) {
  const parsed = parseDiceExpression(expression);
  if (!parsed) return;
  dispatchTabletopDiceRoll({ label, dice: parsed.dice, modifier: parsed.modifier });
}

function equippedArmorClassModifier(character: DndCharacter) {
  return character.inventory.reduce(
    (sum, item) => sum + (item.equipped ? (item.armorClassModifier ?? 0) : 0),
    0,
  );
}

function effectiveArmorClass(character: DndCharacter) {
  return character.armorClass + equippedArmorClassModifier(character);
}

function strengthScore(character: DndCharacter) {
  return character.abilities.find((ability) => ability.key === 'str')?.score ?? 10;
}

function encumbranceLabel(totalWeight: number, character: DndCharacter) {
  const strength = strengthScore(character);
  if (totalWeight > strength * 10) return 'HEAVILY ENCUMBERED';
  if (totalWeight > strength * 5) return 'ENCUMBERED';
  return 'UNENCUMBERED';
}

function ClassLine({ character }: { character: DndCharacter }) {
  return (
    <>
      {character.classes.map((entry, index) => (
        <Box component="span" key={`${entry.name}-${index}`}>
          {index > 0 ? (
            <Box component="span" sx={{ color: dndColors.red, mx: 0.45 }}>
              •
            </Box>
          ) : null}
          {entry.name} {entry.level}
        </Box>
      ))}
    </>
  );
}

function DndCard({
  children,
  sx,
  title,
}: {
  children: ReactNode;
  sx?: Record<string, unknown>;
  title?: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: dndColors.panel,
        border: `1px solid ${dndColors.borderSoft}`,
        borderRadius: '7px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {title ? (
        <Typography
          sx={{
            px: 2,
            pt: 1.6,
            pb: 0.4,
            color: dndColors.text,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 0,
          }}
        >
          {title}
        </Typography>
      ) : null}
      {children}
    </Box>
  );
}

function SectionHeader({
  icon,
  title,
  mode = 'grid',
}: {
  icon: ReactNode;
  title: string;
  mode?: 'grid' | 'list';
}) {
  return (
    <Stack
      component="button"
      type="button"
      aria-label="Open Dungeons & Dragons tab menu"
      onClick={() => window.dispatchEvent(new CustomEvent(DND_OPEN_TAB_MENU_EVENT))}
      direction="row"
      alignItems="center"
      sx={{
        mx: 'auto',
        mt: 1.6,
        mb: 1.6,
        width: '95%',
        minHeight: 48,
        bgcolor: dndColors.chrome,
        borderRadius: '6px',
        border: 0,
        overflow: 'hidden',
        p: 0,
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        '&:hover .dnd-section-header-menu-slot': {
          bgcolor: alpha('#000000', 0.22),
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flex: 1, px: 1.5 }}>
        <Box sx={{ color: dndColors.text, display: 'grid', placeItems: 'center' }}>{icon}</Box>
        <Typography sx={{ color: dndColors.text, fontSize: 20, fontWeight: 900 }}>
          {title}
        </Typography>
      </Stack>
      <Box
        className="dnd-section-header-menu-slot"
        sx={{
          alignSelf: 'stretch',
          width: 70,
          minWidth: 70,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha('#000000', mode === 'grid' ? 0.08 : 0.18),
          color: dndColors.red,
          transition: 'background-color 160ms ease',
        }}
      >
        <AppsIcon sx={{ fontSize: 28 }} />
      </Box>
    </Stack>
  );
}

function HeroHeader({
  character,
  onEditCharacter,
  onEditHitPoints,
  onOpenRest,
  restOpen,
  onToggleInspiration,
  homeAction,
  accountAction,
}: {
  character: DndCharacter;
  onEditCharacter: () => void;
  onEditHitPoints: () => void;
  onOpenRest: () => void;
  restOpen: boolean;
  onToggleInspiration: () => void;
  homeAction: ReactNode;
  accountAction: ReactNode;
}) {
  const { themeMode } = useThemeMode();
  const isLightMode = themeMode !== ThemeMode.DARK;
  const hpPercent = Math.max(
    0,
    Math.min(100, (character.hitPoints.current / character.hitPoints.max) * 100),
  );

  const [, setActiveTabRaw] = useAtom(activeDndTabState);

  const setActiveTab = (tab: DndTab) => {
    setActiveTabRaw(tab);
    persistAppView('dungeons-and-dragons', 'tab', tab);
  };

  return (
    <Box
      sx={{
        bgcolor: isLightMode ? alpha('#000000', 0.08) : dndColors.chrome,
        px: { xs: 1.35, sm: 1.8 },
        pt: 2.4,
        pb: 2,
      }}
    >
      <Box
        sx={{
          mt: 5.4,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Stack
          alignItems="flex-start"
          spacing={0.2}
          sx={{ minWidth: 0, pl: { xs: 0.45, sm: 0.6 } }}
        >
          <Stack direction="row" alignItems="center" spacing={0.65} sx={{ maxWidth: '100%' }}>
            <Typography
              sx={{
                color: dndColors.text,
                fontSize: 21,
                fontWeight: 800,
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {character.name}
            </Typography>
            <IconButton
              aria-label="Edit character"
              onClick={onEditCharacter}
              sx={{
                width: 26,
                height: 26,
                flex: '0 0 auto',
                borderRadius: '7px',
                color: dndColors.text,
                bgcolor: alpha('#ffffff', 0.1),
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.16),
                },
              }}
            >
              <EditIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Stack>
          <Box
            sx={{
              color: dndColors.muted,
              fontSize: 12,
              fontWeight: 800,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            <Box component="span" sx={{ fontSize: 14 }}>
              {character.species}
            </Box>
            <Box component="span" sx={{ color: dndColors.red, mx: 0.55 }}>
              •
            </Box>
            <ClassLine character={character} />
          </Box>
        </Stack>
        <Stack
          direction="row"
          spacing={1.35}
          justifyContent="flex-end"
          sx={{ mt: '-12px', transform: 'translateX(-10px)' }}
        >
          {homeAction}
          {accountAction}
        </Stack>
      </Box>
      <Box
        sx={{
          mt: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: { xs: 0.35, sm: 0.8 },
          alignItems: 'center',
        }}
      >
        <Stack direction="row" spacing={{ xs: 0.45, sm: 0.7 }} alignItems="center">
          <ConditionsButton onChange={setActiveTab} />
          <HitPointsButton
            current={character.hitPoints.current}
            max={character.hitPoints.max}
            percent={hpPercent}
            onClick={onEditHitPoints}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-start"
          sx={{
            flex: '0 0 auto',
            mr: { xs: 0, sm: 0.45 },
            justifyContent: 'space-between',
            width: { xs: 220, sm: 294 },
          }}
        >
          <HeaderIconControl
            icon={<CampfireIcon active={restOpen} />}
            label="Rest"
            onClick={onOpenRest}
          />
          <InspirationToggle active={character.inspiration} onToggle={onToggleInspiration} />
          <DefenseBadge
            compact
            label="Armor Class"
            value={effectiveArmorClass(character)}
            shape="shield"
          />
          <Box sx={{ transform: { xs: 'translateX(-6px)', sm: 'translateX(-8px)' } }}>
            <DefenseBadge
              compact
              label="Initiative"
              value={formatModifier(character.initiative)}
              shape="hex"
              onRoll={() => rollD20('Initiative', character.initiative)}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

function ConditionsButton({ onChange }: { onChange: (tab: DndTab) => void }) {
  return (
    <Button
      onClick={() => onChange('conditions')}
      sx={{
        width: { xs: 81, sm: 113 },
        minWidth: 0,
        height: 48,
        px: { xs: 0.65, sm: 1.1 },
        bgcolor: dndColors.panelStrong,
        color: dndColors.text,
        borderRadius: '6px',
        fontSize: { xs: 10, sm: 13 },
        fontWeight: 900,
        textTransform: 'uppercase',
        WebkitTapHighlightColor: 'transparent',
        '&:hover, &:active, &.Mui-focusVisible': { bgcolor: dndColors.panelSoft },
      }}
    >
      Conditions
    </Button>
  );
}

function InspirationToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const [hasToggled, setHasToggled] = useState(false);

  return (
    <Button
      aria-label={active ? 'Clear inspiration' : 'Mark inspiration'}
      aria-pressed={active}
      onClick={() => {
        setHasToggled(true);
        onToggle();
      }}
      sx={{
        minWidth: 0,
        width: { xs: 52, sm: 58 },
        height: 60,
        borderRadius: '8px',
        color: dndColors.text,
        p: 0,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        overflow: 'visible',
      }}
    >
      <Box
        sx={{
          width: { xs: 44, sm: 50 },
          height: { xs: 44, sm: 50 },
          transform: 'translateY(-4px)',
          borderRadius: '8px',
          bgcolor: dndColors.panelStrong,
          border: `1px solid ${active ? alpha(dndColors.gold, 0.72) : dndColors.border}`,
          color: active ? dndColors.gold : dndColors.text,
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          '&:hover': {
            bgcolor: dndColors.panelSoft,
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: active ? { xs: -3, sm: 0 } : { xs: -1, sm: 2 },
            left: '50%',
            width: 28,
            height: 34,
            color: active ? dndColors.gold : dndColors.text,
            transform: active ? 'translate(-50%, 7px)' : 'translate(-50%, 0)',
            animation: hasToggled
              ? `${active ? inspirationPullOn : inspirationPullOff} 520ms cubic-bezier(0.22, 1, 0.36, 1) both`
              : 'none',
            transformOrigin: '50% 100%',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 5,
              left: 4,
              width: 5,
              height: 2,
              borderRadius: '999px',
              bgcolor: dndColors.gold,
              opacity: active ? 1 : 0,
              transform: 'rotate(42deg)',
              transformOrigin: 'right center',
              transition: active ? 'opacity 120ms ease 150ms' : 'opacity 120ms ease',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: 2,
              height: 5,
              borderRadius: '999px',
              bgcolor: dndColors.gold,
              opacity: active ? 1 : 0,
              transform: 'translateX(-50%)',
              transition: active ? 'opacity 120ms ease 150ms' : 'opacity 120ms ease',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 5,
              right: 4,
              width: 5,
              height: 2,
              borderRadius: '999px',
              bgcolor: dndColors.gold,
              opacity: active ? 1 : 0,
              transform: 'rotate(-42deg)',
              transformOrigin: 'left center',
              transition: active ? 'opacity 120ms ease 150ms' : 'opacity 120ms ease',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              display: 'grid',
              placeItems: 'center',
              transform: 'translateX(-50%)',
            }}
          >
            <Lightbulb size={24} strokeWidth={2.3} />
          </Box>
        </Box>
      </Box>
      <Typography
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          color: dndColors.text,
          fontSize: { xs: 8.5, sm: 10.5 },
          fontWeight: 900,
          lineHeight: 1,
          textTransform: 'uppercase',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        Inspiration
      </Typography>
    </Button>
  );
}

function HeaderIconControl({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      aria-label={label}
      onClick={onClick}
      sx={{
        minWidth: 0,
        width: { xs: 50, sm: 58 },
        height: 60,
        borderRadius: '8px',
        color: dndColors.text,
        p: 0,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        overflow: 'visible',
      }}
    >
      <Box
        sx={{
          width: { xs: 44, sm: 50 },
          height: { xs: 44, sm: 50 },
          transform: 'translateY(-4px)',
          borderRadius: '8px',
          bgcolor: dndColors.panelStrong,
          border: `1px solid ${dndColors.border}`,
          color: dndColors.text,
          display: 'grid',
          placeItems: 'center',
          '&:hover': {
            bgcolor: dndColors.panelSoft,
          },
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          color: dndColors.text,
          fontSize: { xs: 8.5, sm: 10.5 },
          fontWeight: 900,
          lineHeight: 1,
          textTransform: 'uppercase',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
    </Button>
  );
}

function CampfireIcon({ active }: { active: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        width: 26,
        height: 26,
        display: 'inline-grid',
        placeItems: 'center',
        color: dndColors.text,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        aria-hidden="true"
        focusable="false"
        fill="none"
      >
        <Box
          component="g"
          sx={{
            transformBox: 'fill-box',
            transformOrigin: '50% 82%',
            animation: active ? `${campfireFlicker} 760ms ease-in-out infinite` : 'none',
          }}
        >
          <path
            d="M12.2 3.2c2.8 2.3 4.3 4.8 4.3 7.3 0 3-1.9 5.2-4.5 5.2s-4.5-2.2-4.5-5.1c0-1.7.8-3.2 2.1-4.7.3 1 .9 1.7 1.7 2.1.1-1.9.4-3.5.9-4.8Z"
            fill={active ? '#f66d19' : 'none'}
            stroke={active ? '#ff8a1c' : 'currentColor'}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          <path
            d="M12 8.2c1.3 1.3 2 2.6 2 4 0 1.5-.8 2.6-2 2.6s-2-1.1-2-2.6c0-1.1.6-2 1.4-2.8.1.6.3 1.1.6 1.5.1-1.1.1-1.9 0-2.7Z"
            fill={active ? dndColors.gold : 'none'}
            stroke={active ? '#ffd36b' : 'currentColor'}
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
        </Box>
        <path
          d="m5.2 17.1 13.6 3.6M18.8 17.1 5.2 20.7"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    </Box>
  );
}

function HitPointsButton({
  current,
  max,
  percent,
  onClick,
}: {
  current: number;
  max: number;
  percent: number;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-label="Edit hit points"
      onClick={onClick}
      sx={{
        width: { xs: 104, sm: 124 },
        minWidth: 0,
        height: 48,
        bgcolor: dndColors.panelStrong,
        border: 0,
        borderRadius: '6px',
        color: dndColors.text,
        cursor: 'pointer',
        font: 'inherit',
        px: { xs: 0.6, sm: 1 },
        py: 0.55,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        WebkitTapHighlightColor: 'transparent',
        '&:hover, &:active, &:focus-visible': { bgcolor: dndColors.panelSoft },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.15 }}>
        <Typography
          sx={{
            color: dndColors.text,
            fontSize: { xs: 12, sm: 13 },
            fontWeight: 900,
            lineHeight: 1,
            textAlign: 'left',
          }}
        >
          HP
        </Typography>
        <Typography
          sx={{
            color: dndColors.text,
            fontSize: { xs: 14, sm: 16 },
            fontWeight: 900,
            lineHeight: 1,
            textAlign: 'right',
          }}
        >
          {current}/{max}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 3,
          mt: 'auto',
          mb: 0.35,
          bgcolor: dndColors.border,
          '& .MuiLinearProgress-bar': { bgcolor: dndColors.blue },
        }}
      />
    </Box>
  );
}

function DefenseBadge({
  label,
  value,
  shape,
  compact = false,
  onRoll,
}: {
  label: string;
  value: string | number;
  shape: 'shield' | 'hex';
  compact?: boolean;
  onRoll?: () => void;
}) {
  const isArmorClass = label === 'Armor Class';
  const { themeMode } = useThemeMode();
  const initiativeHighlight = themeMode === ThemeMode.DARK ? dndColors.red : '#e40712';
  const initiativeHighlightDark = themeMode === ThemeMode.DARK ? dndColors.redDark : '#e40712';
  const badgeSize = compact ? { xs: 48, sm: 62 } : 68;
  const [rollFlashing, setRollFlashing] = useState(false);
  const rollFlashTimeout = useRef<number | null>(null);
  const triggerRoll = () => {
    onRoll?.();
    if (!onRoll) {
      return;
    }
    setRollFlashing(true);
    if (rollFlashTimeout.current) {
      window.clearTimeout(rollFlashTimeout.current);
    }
    rollFlashTimeout.current = window.setTimeout(() => {
      setRollFlashing(false);
      rollFlashTimeout.current = null;
    }, 900);
  };

  useEffect(
    () => () => {
      if (rollFlashTimeout.current) {
        window.clearTimeout(rollFlashTimeout.current);
      }
    },
    [],
  );

  const interactiveProps = onRoll
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': `Roll ${label}`,
        onClick: triggerRoll,
        onKeyDown: (event: ReactKeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            triggerRoll();
          }
        },
      }
    : {};

  return (
    <Stack
      alignItems="center"
      spacing={0.1}
      {...interactiveProps}
      sx={{
        position: 'relative',
        width: compact ? { xs: isArmorClass ? 50 : 54, sm: isArmorClass ? 66 : 68 } : 84,
        pt: 0.25,
        pb: 1.15,
        cursor: onRoll ? 'pointer' : 'default',
        outline: 'none',
        '&:focus-visible > .dnd-defense-badge-box': {
          boxShadow: `0 0 0 3px ${alpha(dndColors.red, 0.45)}`,
        },
        ...(onRoll && rollFlashing
          ? {
              '&::after': {
                content: '""',
                position: 'absolute',
                top: compact ? { xs: 2, sm: 3 } : 4,
                left: '50%',
                width: badgeSize,
                height: badgeSize,
                clipPath:
                  shape === 'shield'
                    ? 'polygon(14% 18%, 50% 7%, 86% 18%, 80% 74%, 50% 95%, 20% 74%)'
                    : 'polygon(50% 5%, 92% 28%, 92% 72%, 50% 95%, 8% 72%, 8% 28%)',
                bgcolor: alpha(initiativeHighlight, 0.72),
                boxShadow: `0 0 18px ${alpha(initiativeHighlight, 0.78)}, 0 0 34px ${alpha(initiativeHighlight, 0.5)}`,
                animation: `${initiativePulse} 980ms ease-out forwards`,
                pointerEvents: 'none',
                zIndex: 0,
              },
            }
          : {}),
      }}
    >
      {isArmorClass ? (
        <Typography
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            zIndex: 2,
            color: dndColors.text,
            fontSize: compact ? { xs: 9, sm: 12 } : 14,
            fontWeight: 900,
            lineHeight: 1,
            textTransform: 'uppercase',
            transform: 'translate(-50%, 0)',
            whiteSpace: 'nowrap',
          }}
        >
          Armor
        </Typography>
      ) : null}
      <Box
        className="dnd-defense-badge-box"
        sx={{
          width: badgeSize,
          height: badgeSize,
          clipPath:
            shape === 'shield'
              ? 'polygon(14% 18%, 50% 7%, 86% 18%, 80% 74%, 50% 95%, 20% 74%)'
              : 'polygon(50% 5%, 92% 28%, 92% 72%, 50% 95%, 8% 72%, 8% 28%)',
          border: `2px solid ${dndColors.border}`,
          bgcolor: dndColors.panelStrong,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          transition: 'border-color 160ms ease, filter 160ms ease, box-shadow 160ms ease',
          zIndex: 1,
          ...(onRoll
            ? {
                borderColor: 'transparent',
                bgcolor: 'transparent',
                filter: rollFlashing
                  ? `drop-shadow(0 0 6px ${alpha(initiativeHighlight, 0.95)}) drop-shadow(0 0 18px ${alpha(initiativeHighlight, 0.58)})`
                  : `drop-shadow(0 0 5px ${alpha('#ffffff', 0.82)}) drop-shadow(0 0 14px ${alpha('#ffffff', 0.42)})`,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  clipPath:
                    shape === 'shield'
                      ? 'polygon(14% 18%, 50% 7%, 86% 18%, 80% 74%, 50% 95%, 20% 74%)'
                      : 'polygon(50% 5%, 92% 28%, 92% 72%, 50% 95%, 8% 72%, 8% 28%)',
                  bgcolor: rollFlashing ? alpha(initiativeHighlight, 0.96) : alpha('#ffffff', 0.98),
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 2,
                  clipPath:
                    shape === 'shield'
                      ? 'polygon(14% 18%, 50% 7%, 86% 18%, 80% 74%, 50% 95%, 20% 74%)'
                      : 'polygon(50% 5%, 92% 28%, 92% 72%, 50% 95%, 8% 72%, 8% 28%)',
                  bgcolor: rollFlashing ? initiativeHighlightDark : dndColors.panelStrong,
                },
                '&:hover': {
                  filter: `brightness(1.1) drop-shadow(0 0 5px ${alpha('#ffffff', 0.74)}) drop-shadow(0 0 11px ${alpha('#ffffff', 0.38)})`,
                },
              }
            : {}),
        }}
      >
        <Typography
          sx={{
            color: dndColors.text,
            fontSize: compact ? { xs: 20, sm: 24 } : 27,
            fontWeight: 900,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {value}
        </Typography>
      </Box>
      <Typography
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          zIndex: 2,
          color: dndColors.text,
          fontSize: compact ? { xs: 9, sm: 12 } : 14,
          fontWeight: 900,
          lineHeight: 1,
          textAlign: 'center',
          textTransform: 'uppercase',
          transform: 'translate(-50%, 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {isArmorClass ? 'Class' : label}
      </Typography>
    </Stack>
  );
}

const tabOptions: Array<{ value: DndTab; label: string; icon: ReactNode }> = [
  { value: 'abilities', label: 'Stats', icon: <ShieldIcon /> },
  { value: 'skills', label: 'Skills', icon: <AutoAwesomeIcon /> },
  { value: 'actions', label: 'Actions', icon: <Sword /> },
  { value: 'spells', label: 'Spells', icon: <LocalFireDepartmentIcon /> },
  { value: 'inventory', label: 'Inventory', icon: <Backpack /> },
  { value: 'features', label: 'More', icon: <MenuBookIcon /> },
];
const swipeNavigationTabs: DndTab[] = [
  'abilities',
  'conditions',
  'skills',
  'actions',
  'spells',
  'inventory',
  'features',
  'background',
  'notes',
];

function navigationTabFor(activeTab: DndTab) {
  return swipeNavigationTabs.includes(activeTab) ? activeTab : 'features';
}

function adjacentSwipeTab(activeTab: DndTab, direction: 1 | -1) {
  const currentTab = navigationTabFor(activeTab);
  const currentIndex = swipeNavigationTabs.indexOf(currentTab);
  const nextIndex =
    (currentIndex + direction + swipeNavigationTabs.length) % swipeNavigationTabs.length;
  return swipeNavigationTabs[nextIndex];
}

function blurDndBottomNavFocus() {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return;
  if (activeElement.dataset.dndBottomNavButton !== 'true') return;
  activeElement.blur();
}

function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: DndTab;
  onChange: (tab: DndTab) => void;
}) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 12,
        zIndex: 10,
        borderRadius: '42px',
        bgcolor: alpha(dndColors.panelSoft, 0.92),
        border: `1px solid ${dndColors.border}`,
        boxShadow: '0 -8px 30px rgba(0,0,0,0.28)',
        display: 'grid',
        gridTemplateColumns: `repeat(${tabOptions.length}, 1fr)`,
        p: 0.5,
      }}
    >
      {tabOptions.map((tab) => {
        const selected =
          activeTab === tab.value ||
          (tab.value === 'features' && ['background', 'notes'].includes(activeTab));
        return (
          <Button
            key={tab.value}
            data-dnd-bottom-nav-button="true"
            disableRipple
            onClick={(event) => {
              onChange(tab.value);
              event.currentTarget.blur();
            }}
            sx={{
              minWidth: 0,
              minHeight: 54,
              borderRadius: '34px',
              color: selected ? dndColors.red : dndColors.text,
              bgcolor: selected ? alpha('#ffffff', 0.13) : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.2,
              textTransform: 'none',
              fontSize: 10,
              fontWeight: 800,
              '& svg': { fontSize: 21 },
              '&:hover': { bgcolor: alpha('#ffffff', 0.1) },
              '&:focus, &:focus-visible': {
                outline: 'none',
                bgcolor: selected ? alpha('#ffffff', 0.13) : 'transparent',
              },
            }}
          >
            {tab.icon}
            {tab.label}
          </Button>
        );
      })}
    </Box>
  );
}

function AbilityTile({ ability, onRoll }: { ability: AbilityScore; onRoll: () => void }) {
  const modifier = abilityModifier(ability.score);
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Roll ${ability.label} check`}
      onClick={onRoll}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onRoll();
        }
      }}
      sx={{
        minHeight: 122,
        px: 1,
        py: 1.2,
        position: 'relative',
        clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 92% 86%, 50% 100%, 8% 86%, 0 10%)',
        bgcolor: dndColors.panelSoft,
        border: `1px solid ${dndColors.border}`,
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      <Typography sx={{ color: dndColors.text, fontSize: 13, fontWeight: 900 }}>
        {ability.label.toUpperCase()}
      </Typography>
      <Box
        sx={{
          mt: 1,
          mx: 'auto',
          width: 76,
          py: 0.5,
          borderRadius: '5px',
          border: `1px solid ${dndColors.border}`,
          bgcolor: alpha('#000000', 0.12),
          ...diceRollBoxGlowSx,
        }}
      >
        <Typography sx={{ color: dndColors.text, fontSize: 31, fontWeight: 900 }}>
          {formatModifier(modifier)}
        </Typography>
      </Box>
      <Box
        sx={{
          mx: 'auto',
          mt: 0.9,
          width: 50,
          height: 34,
          borderRadius: '50%',
          bgcolor: dndColors.panelStrong,
          display: 'grid',
          placeItems: 'center',
          border: `2px solid ${dndColors.border}`,
        }}
      >
        <Typography sx={{ color: dndColors.text, fontSize: 23, fontWeight: 900 }}>
          {ability.score}
        </Typography>
      </Box>
    </Box>
  );
}

function SavePill({ ability, onRoll }: { ability: AbilityScore; onRoll: () => void }) {
  return (
    <Stack
      role="button"
      tabIndex={0}
      aria-label={`Roll ${ability.label} saving throw`}
      onClick={onRoll}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onRoll();
        }
      }}
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 48,
        border: `2px solid ${dndColors.border}`,
        borderRadius: '28px 8px 8px 28px',
        overflow: 'hidden',
        bgcolor: dndColors.panelSoft,
        cursor: 'pointer',
      }}
    >
      <Box
        sx={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          ml: 1,
          bgcolor: ability.proficientSave ? dndColors.text : 'transparent',
          border: `2px ${ability.proficientSave ? 'solid' : 'dashed'} ${dndColors.text}`,
        }}
      />
      <Typography
        sx={{
          flex: 1,
          color: dndColors.text,
          fontWeight: 900,
          fontSize: 13,
          textAlign: 'left',
          textTransform: 'uppercase',
          ml: 1,
        }}
      >
        {ability.label}
      </Typography>
      <Box
        sx={{
          width: 58,
          alignSelf: 'stretch',
          display: 'grid',
          placeItems: 'center',
          border: `2px solid ${dndColors.border}`,
          borderRadius: '8px 6px 6px 8px',
          bgcolor: alpha('#000000', 0.12),
          ...diceRollBoxGlowSx,
        }}
      >
        <Typography sx={{ color: dndColors.text, fontSize: 20, fontWeight: 900 }}>
          {formatModifier(ability.saveBonus)}
        </Typography>
      </Box>
    </Stack>
  );
}

function AbilitiesScreen({
  character,
  onEditStats,
}: {
  character: DndCharacter;
  onEditStats: () => void;
}) {
  return (
    <>
      <SectionHeader icon={<ShieldIcon />} title="Abilities, Saves, Senses" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Button startIcon={<EditIcon />} onClick={onEditStats} sx={inlineEditButtonSx}>
            Edit Stats
          </Button>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.2 }}>
          {character.abilities.map((ability) => (
            <AbilityTile
              key={ability.key}
              ability={ability}
              onRoll={() => rollD20(`${ability.label} Check`, abilityModifier(ability.score))}
            />
          ))}
        </Box>

        <DividerLabel title="Saving Throws" />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.1 }}>
          {character.abilities.map((ability) => (
            <SavePill
              key={ability.key}
              ability={ability}
              onRoll={() => rollD20(`${ability.label} Save`, ability.saveBonus)}
            />
          ))}
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 1.4 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '5px',
              bgcolor: dndColors.green,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
            }}
          >
            +
          </Box>
          <Typography sx={{ color: dndColors.text, fontSize: 16 }}>
            1 on saves{' '}
            <Box component="span" sx={{ color: dndColors.green, fontStyle: 'italic' }}>
              (Cloak of Protection)
            </Box>
          </Typography>
        </Stack>
        <DividerLabel title="Senses" />
        <SenseRow label="Passive Perception" value={character.passivePerception} />
        <SenseRow label="Passive Investigation" value={character.passiveInvestigation} />
        <SenseRow label="Passive Insight" value={character.passiveInsight} />
      </Box>
    </>
  );
}

function DividerLabel({ title }: { title: string }) {
  return (
    <Typography
      sx={{
        mt: 2.2,
        mb: 1.2,
        color: dndColors.text,
        fontSize: 23,
        fontWeight: 900,
      }}
    >
      {title}
    </Typography>
  );
}

function SenseRow({ label, value }: { label: string; value: number }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 48,
        mb: 1,
        border: `2px solid ${dndColors.border}`,
        borderRadius: '12px',
        bgcolor: dndColors.panelSoft,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 40,
          ml: 0.45,
          alignSelf: 'center',
          display: 'grid',
          placeItems: 'center',
          border: `2px solid ${dndColors.border}`,
          borderRadius: '999px',
          bgcolor: dndColors.panelStrong,
        }}
      >
        <Typography sx={{ color: dndColors.text, fontWeight: 900, fontSize: 19 }}>
          {value}
        </Typography>
      </Box>
      <Typography sx={{ color: dndColors.text, fontSize: 13, fontWeight: 900, pl: 1.4 }}>
        {label.toUpperCase()}
      </Typography>
    </Stack>
  );
}

function ConditionsScreen({
  character,
  onToggleCondition,
  onSetExhaustion,
}: {
  character: DndCharacter;
  onToggleCondition: (condition: string) => void;
  onSetExhaustion: (level: number) => void;
}) {
  return (
    <>
      <SectionHeader icon={<AutoAwesomeIcon />} title="Conditions" mode="list" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <DndCard sx={{ p: 1.4, mt: 1.2, mb: 1.4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack>
              <Typography sx={{ color: dndColors.text, fontSize: 19, fontWeight: 900 }}>
                Exhaustion
              </Typography>
              <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 800 }}>
                {exhaustionEffects[character.exhaustion]}
              </Typography>
            </Stack>
            <Typography sx={{ color: dndColors.blue, fontSize: 28, fontWeight: 900 }}>
              {character.exhaustion}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.8}>
            {exhaustionEffects.map((_, level) => (
              <Button
                key={level}
                aria-label={`Set exhaustion level ${level}`}
                aria-pressed={character.exhaustion === level}
                onClick={() => onSetExhaustion(level)}
                sx={{
                  minWidth: 0,
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: `1px solid ${character.exhaustion === level ? dndColors.red : dndColors.border}`,
                  bgcolor:
                    character.exhaustion === level
                      ? alpha(dndColors.red, 0.22)
                      : dndColors.panelStrong,
                  color: character.exhaustion === level ? '#ffffff' : dndColors.muted,
                  fontWeight: 900,
                  '&:hover': {
                    bgcolor:
                      character.exhaustion === level
                        ? alpha(dndColors.red, 0.3)
                        : alpha('#ffffff', 0.08),
                  },
                }}
              >
                {level}
              </Button>
            ))}
          </Stack>
        </DndCard>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.9 }}>
          {dndConditions.map((condition) => {
            const active = character.conditions.includes(condition);
            const activeColor = getDndConditionActiveColor(condition);
            return (
              <Box
                key={condition}
                sx={{
                  border: `1px solid ${active ? activeColor : dndColors.border}`,
                  borderRadius: '8px',
                  bgcolor: active ? alpha(activeColor, 0.12) : dndColors.panelSoft,
                  p: 1.2,
                }}
              >
                <Button
                  fullWidth
                  aria-pressed={active}
                  onClick={() => onToggleCondition(condition)}
                  sx={{
                    ...toggleButtonSx(active),
                    minHeight: 38,
                    borderColor: active ? activeColor : dndColors.border,
                    bgcolor: active ? alpha(activeColor, 0.24) : dndColors.panelStrong,
                    fontSize: 13,
                    justifyContent: 'space-between',
                    px: 1.2,
                    '&:hover': {
                      bgcolor: active ? alpha(activeColor, 0.32) : alpha('#ffffff', 0.08),
                    },
                  }}
                >
                  <Box component="span">{condition}</Box>
                  <Box component="span">{active ? 'Marked' : 'Clear'}</Box>
                </Button>
                <Typography
                  sx={{
                    color: dndColors.muted,
                    fontSize: 12,
                    fontWeight: 700,
                    mt: 0.8,
                    lineHeight: 1.35,
                  }}
                >
                  {dndConditionDescriptions[condition]}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </>
  );
}

function SkillsScreen({
  character,
  onEditSkills,
  embedded = false,
}: {
  character: DndCharacter;
  onEditSkills: () => void;
  embedded?: boolean;
}) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  return (
    <>
      {embedded ? null : <SectionHeader icon={<AutoAwesomeIcon />} title="Skills" mode="list" />}
      <Box sx={{ px: embedded ? 0 : 1.6, pb: embedded ? 0 : 12 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Button startIcon={<EditIcon />} onClick={onEditSkills} sx={inlineEditButtonSx}>
            Edit Skills
          </Button>
        </Stack>
        {character.skills.map((skill) => (
          <SkillRowView
            key={skill.name}
            skill={skill}
            onOpenDetails={() => setSelectedSkill(skill)}
            onRoll={() => rollD20(`${skill.name} Check`, skill.bonus)}
          />
        ))}
      </Box>
      <SkillDetailsDialog skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </>
  );
}

function SkillRowView({
  skill,
  onOpenDetails,
  onRoll,
}: {
  skill: Skill;
  onOpenDetails: () => void;
  onRoll: () => void;
}) {
  return (
    <Stack
      role="button"
      tabIndex={0}
      aria-label={`View ${skill.name} skill details`}
      onClick={onOpenDetails}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails();
        }
      }}
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 50,
        borderBottom: `1px solid ${dndColors.borderSoft}`,
        cursor: 'pointer',
      }}
    >
      <Box
        sx={{
          width: 17,
          height: 17,
          borderRadius: '50%',
          mr: 1,
          bgcolor: skill.proficient ? dndColors.text : 'transparent',
          border: `2px ${skill.proficient ? 'solid' : 'dashed'} ${dndColors.text}`,
          boxShadow: skill.expertise ? `0 0 0 3px ${alpha(dndColors.text, 0.22)}` : 'none',
        }}
      />
      <Typography sx={{ color: dndColors.text, fontWeight: 800, flex: 1 }}>{skill.name}</Typography>
      <Typography sx={{ color: dndColors.muted, fontWeight: 900, mr: 1.5 }}>
        {skill.ability.toUpperCase()}
      </Typography>
      <Box
        component="button"
        type="button"
        aria-label={`Roll ${skill.name} check`}
        onClick={(event) => {
          event.stopPropagation();
          onRoll();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
        sx={{
          width: 58,
          minHeight: 38,
          display: 'grid',
          placeItems: 'center',
          border: `2px solid ${dndColors.border}`,
          borderRadius: '8px',
          bgcolor: alpha('#000000', 0.12),
          color: dndColors.text,
          font: 'inherit',
          p: 0,
          cursor: 'pointer',
          ...diceRollBoxGlowSx,
          '&:hover': {
            borderColor: dndColors.blue,
            color: dndColors.blue,
          },
        }}
      >
        <Typography sx={{ color: 'inherit', fontSize: 22, fontWeight: 900, lineHeight: 1 }}>
          {formatModifier(skill.bonus)}
        </Typography>
      </Box>
    </Stack>
  );
}

function SkillDetailsDialog({ skill, onClose }: { skill: Skill | null; onClose: () => void }) {
  if (!skill) {
    return null;
  }

  const tags = [
    skill.proficient ? 'Proficient' : null,
    skill.expertise ? 'Expertise' : null,
  ].filter(Boolean);

  return (
    <Dialog
      open={Boolean(skill)}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: dndColors.panelSoft,
          color: dndColors.text,
          border: `1px solid ${dndColors.border}`,
          borderRadius: '16px',
        },
      }}
    >
      <DialogTitle sx={{ position: 'relative', pr: 6 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 950, lineHeight: 1.05 }}>
          {skill.name}
        </Typography>
        <Typography sx={{ color: dndColors.muted, fontSize: 13, fontWeight: 900, mt: 0.6 }}>
          {skill.ability.toUpperCase()} • {formatModifier(skill.bonus)}
        </Typography>
        <IconButton
          aria-label="Close skill details"
          onClick={onClose}
          sx={{ position: 'absolute', right: 10, top: 10, color: dndColors.text }}
        >
          <X size={22} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.55 }}>
          {getDndSkillDescription(skill)}
        </Typography>
        {tags.length ? (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {tags.map((tag) => (
              <Box
                key={tag}
                sx={{
                  border: `1px solid ${dndColors.border}`,
                  borderRadius: '999px',
                  bgcolor: alpha(dndColors.red, 0.12),
                  color: dndColors.text,
                  fontSize: 12,
                  fontWeight: 900,
                  px: 1.2,
                  py: 0.45,
                }}
              >
                {tag}
              </Box>
            ))}
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ActionsScreen({
  character,
  onDeleteAttack,
  onAddAttack,
  onEditAttack,
  onViewAttack,
  onToggleAttackEquipped,
}: {
  character: DndCharacter;
  onDeleteAttack: (id: string) => void;
  onAddAttack: () => void;
  onEditAttack: (attack: Attack) => void;
  onViewAttack: (attack: Attack) => void;
  onToggleAttackEquipped: (id: string) => void;
}) {
  return (
    <>
      <SectionHeader icon={<Sword />} title="Actions" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ color: dndColors.text, fontSize: 20, fontWeight: 900 }}>
            <Box component="span" sx={{ color: dndColors.blue }}>
              ACTIONS
            </Box>{' '}
            • Attacks per Action: 1
          </Typography>
          <IconButton aria-label="Add attack" onClick={onAddAttack} sx={{ color: dndColors.blue }}>
            <AddIcon />
          </IconButton>
        </Stack>
        <GridHeader columns="1fr 1fr 0.8fr" labels={['Range', 'Hit/DC', 'Damage']} />
        {character.attacks.map((attack) => (
          <SwipeRow
            key={attack.id}
            onDelete={() => onDeleteAttack(attack.id)}
            onEdit={() => onEditAttack(attack)}
          >
            <AttackRow
              attack={attack}
              onToggleEquipped={() => onToggleAttackEquipped(attack.id)}
              onView={() => onViewAttack(attack)}
            />
          </SwipeRow>
        ))}
      </Box>
    </>
  );
}

function AttackRow({
  attack,
  onToggleEquipped,
  onView,
}: {
  attack: Attack;
  onToggleEquipped: () => void;
  onView: () => void;
}) {
  const equipped = Boolean(attack.equipped);
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`View ${attack.name} details`}
      onClick={onView}
      onKeyDown={(event: ReactKeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView();
        }
      }}
      sx={{
        display: 'grid',
        gridTemplateColumns: '34px 1fr 1fr 0.8fr',
        gap: 1,
        alignItems: 'center',
        py: 1.4,
        borderBottom: `1px solid ${dndColors.borderSoft}`,
        bgcolor: dndColors.page,
        cursor: 'pointer',
        outline: 'none',
        '&:hover': { bgcolor: alpha(dndColors.panelSoft, 0.58) },
        '&:focus-visible': {
          boxShadow: `inset 0 0 0 2px ${alpha(dndColors.blue, 0.64)}`,
        },
      }}
    >
      <IconButton
        aria-label={`${equipped ? 'Unequip' : 'Equip'} ${attack.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleEquipped();
        }}
        sx={{
          width: 34,
          height: 34,
          borderRadius: '6px',
          border: `1px solid ${equipped ? dndColors.green : dndColors.border}`,
          bgcolor: equipped ? alpha(dndColors.green, 0.16) : dndColors.panelStrong,
          color: equipped ? dndColors.green : dndColors.text,
          '&:hover': {
            bgcolor: equipped ? alpha(dndColors.green, 0.24) : alpha('#ffffff', 0.08),
          },
        }}
      >
        {attack.kind.toLowerCase().includes('cantrip') ? <LocalFireDepartmentIcon /> : <Sword />}
      </IconButton>
      <Stack>
        <Typography
          sx={{
            color: equipped ? dndColors.green : dndColors.text,
            fontSize: 18,
            fontWeight: 800,
            fontStyle: equipped ? 'italic' : 'normal',
          }}
        >
          {attack.name}
        </Typography>
        <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>
          {attack.kind.toUpperCase()}
        </Typography>
        <Typography sx={{ color: dndColors.text, fontSize: 17, fontWeight: 900, mt: 0.8 }}>
          {attack.range}
        </Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.35}>
        <RollBox
          ariaLabel={`Roll ${attack.name} attack`}
          onRoll={() => rollD20(`${attack.name} Attack`, attack.hitDc)}
        >
          {attack.hitDc}
        </RollBox>
        <Typography
          aria-hidden="true"
          sx={{ color: 'transparent', fontSize: 11, fontWeight: 900, lineHeight: 1 }}
        >
          spacer
        </Typography>
      </Stack>
      <Stack alignItems="center" spacing={0}>
        <Box sx={{ width: '100%', mb: '5px' }}>
          <RollBox
            ariaLabel={`Roll ${attack.name} damage`}
            onRoll={() => rollDiceExpression(`${attack.name} Damage`, attack.damage)}
          >
            {attack.damage}
          </RollBox>
        </Box>
        <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900, lineHeight: 1 }}>
          {formatDamageTypeLabel(attack.damageType)}
        </Typography>
      </Stack>
    </Box>
  );
}

function GridHeader({ columns, labels }: { columns: string; labels: string[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 1, pl: 5.2, py: 0.8 }}>
      {labels.map((label) => (
        <Typography
          key={label}
          sx={{ color: dndColors.muted, fontSize: 14, fontWeight: 900, textTransform: 'uppercase' }}
        >
          {label}
        </Typography>
      ))}
    </Box>
  );
}

function RollBox({
  children,
  onRoll,
  ariaLabel,
}: {
  children: ReactNode;
  onRoll?: () => void;
  ariaLabel?: string;
}) {
  return (
    <Box
      role={onRoll ? 'button' : undefined}
      tabIndex={onRoll ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={
        onRoll
          ? (event) => {
              event.stopPropagation();
              onRoll();
            }
          : undefined
      }
      onKeyDown={
        onRoll
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onRoll();
              }
            }
          : undefined
      }
      sx={{
        minHeight: 37,
        width: '100%',
        border: `1px solid ${dndColors.border}`,
        borderRadius: '5px',
        display: 'grid',
        placeItems: 'center',
        color: dndColors.text,
        fontSize: 18,
        fontWeight: 900,
        bgcolor: alpha('#000000', 0.08),
        padding: '4px 8px',
        cursor: onRoll ? 'pointer' : 'default',
        ...diceRollBoxGlowSx,
        '&:hover': onRoll ? { borderColor: dndColors.blue, color: dndColors.blue } : undefined,
      }}
    >
      {children}
    </Box>
  );
}

function SpellsScreen({
  character,
  onDeleteSpell,
  onAddSpell,
  onEditSpell,
  onEditSpellcasting,
  onTogglePrepared,
  onUpdateSpellSlot,
  onCastSpell,
}: {
  character: DndCharacter;
  onDeleteSpell: (id: string) => void;
  onAddSpell: () => void;
  onEditSpell: (spell: Spell) => void;
  onEditSpellcasting: () => void;
  onTogglePrepared: (id: string) => void;
  onUpdateSpellSlot: (level: string, used: number) => void;
  onCastSpell: (spell: Spell) => boolean;
}) {
  const spellSections = createSpellSections(character.spells, character.spellcasting.slots);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  return (
    <>
      <SectionHeader icon={<LocalFireDepartmentIcon />} title="Spells" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <DndCard sx={{ p: 1.4, mb: 1.4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Metric label="Spell Save DC" value={character.spellcasting.saveDc} />
            <Metric
              label="Spell Attack"
              value={formatModifier(character.spellcasting.attackBonus)}
            />
            <Metric label="Ability" value={character.spellcasting.ability.toUpperCase()} />
            <IconButton
              aria-label="Edit spellcasting"
              onClick={onEditSpellcasting}
              sx={{ color: dndColors.blue, mt: -0.7, mr: -0.7 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DndCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ color: dndColors.text, fontSize: 21, fontWeight: 900 }}>
            Spellbook
          </Typography>
          <IconButton aria-label="Add spell" onClick={onAddSpell} sx={{ color: dndColors.blue }}>
            <AddIcon />
          </IconButton>
        </Stack>
        {spellSections.map((section) => {
          const slot = section.slotLevel
            ? character.spellcasting.slots.find((entry) => entry.level === section.slotLevel)
            : undefined;
          return (
            <Box key={section.key} sx={{ mt: 1.25 }}>
              <SpellSectionHeader
                label={section.label}
                slot={slot}
                onUpdateSlot={slot ? (used) => onUpdateSpellSlot(slot.level, used) : undefined}
              />
              {section.spells.map((spell) => (
                <SpellRow
                  key={spell.id}
                  spell={spell}
                  spellSlots={character.spellcasting.slots}
                  onOpenDetails={() => setSelectedSpell(spell)}
                  onTogglePrepared={() => onTogglePrepared(spell.id)}
                  onCast={() => onCastSpell(spell)}
                />
              ))}
            </Box>
          );
        })}
      </Box>
      <SpellDetailsDialog
        spell={selectedSpell}
        onClose={() => setSelectedSpell(null)}
        onEdit={() => {
          if (!selectedSpell) return;
          onEditSpell(selectedSpell);
          setSelectedSpell(null);
        }}
        onDelete={() => {
          if (!selectedSpell) return;
          onDeleteSpell(selectedSpell.id);
          setSelectedSpell(null);
        }}
      />
    </>
  );
}

function SpellSectionHeader({
  label,
  slot,
  onUpdateSlot,
}: {
  label: string;
  slot?: { level: string; used: number; max: number };
  onUpdateSlot?: (used: number) => void;
}) {
  return (
    <Box
      sx={{
        borderTop: `1px solid ${dndColors.borderSoft}`,
        borderBottom: `1px solid ${dndColors.borderSoft}`,
        bgcolor: alpha(dndColors.panelStrong, 0.78),
        px: 1,
        py: 0.85,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.2,
        }}
      >
        <Typography
          sx={{ color: dndColors.text, fontSize: 15, fontWeight: 900, textTransform: 'uppercase' }}
        >
          {label}
        </Typography>
        {slot && onUpdateSlot ? <SlotTracker slot={slot} onUpdate={onUpdateSlot} /> : null}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '76px 48px minmax(58px, 0.82fr) minmax(62px, 0.9fr) minmax(78px, 1fr)',
            sm: '96px 56px minmax(70px, 0.8fr) minmax(76px, 0.9fr) minmax(96px, 1fr)',
          },
          columnGap: { xs: 0.75, sm: 1.15 },
          alignItems: 'end',
          mt: 1.2,
        }}
      >
        <Box aria-hidden="true" />
        <SpellColumnHeaderCell>Time</SpellColumnHeaderCell>
        <SpellColumnHeaderCell>Range</SpellColumnHeaderCell>
        <SpellColumnHeaderCell align="center">Hit/DC</SpellColumnHeaderCell>
        <SpellColumnHeaderCell align="right">Effect</SpellColumnHeaderCell>
      </Box>
    </Box>
  );
}

function SpellColumnHeaderCell({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <Typography
      sx={{
        color: dndColors.muted,
        fontSize: { xs: 11, sm: 12 },
        fontWeight: 950,
        textAlign: align,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Typography>
  );
}

function SlotTracker({
  slot,
  onUpdate,
}: {
  slot: { level: string; used: number; max: number };
  onUpdate: (used: number) => void;
}) {
  return (
    <Box>
      <Stack direction="row" spacing={0.55}>
        {Array.from({ length: slot.max }).map((_, index) => (
          <Box
            component="button"
            key={index}
            type="button"
            aria-label={`${slot.level} spell slot ${index + 1}`}
            onClick={() => onUpdate(index + 1 === slot.used ? index : index + 1)}
            sx={{
              width: { xs: 24, sm: 28 },
              height: { xs: 24, sm: 28 },
              borderRadius: '6px',
              border: `2px solid ${dndColors.red}`,
              bgcolor: index < slot.used ? dndColors.red : 'transparent',
              cursor: 'pointer',
              p: 0,
              transition: 'background-color 140ms ease, border-color 140ms ease',
              '&:hover': {
                borderColor: alpha(dndColors.red, 0.72),
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function createSpellSections(spells: Spell[], slots: DndCharacter['spellcasting']['slots']) {
  const grouped = new Map<
    string,
    { key: string; label: string; rank: number; slotLevel: string | null; spells: Spell[] }
  >();

  slots
    .filter((slot) => slot.max > 0)
    .forEach((slot) => {
      const rank = getSpellSlotRank(slot.level) ?? 99;
      const key = slot.level;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          label: `${slot.level} Level Spells`,
          rank,
          slotLevel: slot.level,
          spells: [],
        });
      }
    });

  spells.forEach((spell) => {
    const slotLevel = getSpellSlotLevel(spell.level);
    const rank = slotLevel ? (getSpellSlotRank(slotLevel) ?? 99) : 0;
    const key = slotLevel ?? 'cantrip';
    const label = slotLevel ? `${slotLevel} Level Spells` : 'Cantrips';
    const section = grouped.get(key) ?? { key, label, rank, slotLevel, spells: [] };
    section.spells.push(spell);
    grouped.set(key, section);
  });

  return Array.from(grouped.values())
    .sort((left, right) => left.rank - right.rank)
    .map((section) => ({
      ...section,
      spells: [...section.spells].sort((left, right) => left.name.localeCompare(right.name)),
    }));
}

function SpellRow({
  spell,
  spellSlots,
  onOpenDetails,
  onTogglePrepared,
  onCast,
}: {
  spell: Spell;
  spellSlots: DndCharacter['spellcasting']['slots'];
  onOpenDetails: () => void;
  onTogglePrepared: () => void;
  onCast: () => boolean;
}) {
  const prepared = Boolean(spell.prepared);
  const slotLevel = getSpellSlotLevel(spell.level);
  const slot = slotLevel ? findUsableSpellSlot(spellSlots, slotLevel) : undefined;
  const canCast = !slotLevel || Boolean(slot);
  const hitDcValue = getSpellHitDcDisplay(spell);
  const effectValue = getSpellEffectDisplay(spell);
  const rollableEffect = spell.damage && parseDiceExpression(effectValue) !== null;
  const castAndMaybeRoll = () => {
    if (!onCast()) return;
    if (rollableEffect) {
      rollDiceExpression(`${spell.name} Damage`, effectValue);
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails();
        }
      }}
      sx={{
        py: 1.25,
        borderBottom: `1px solid ${dndColors.borderSoft}`,
        bgcolor: dndColors.page,
        cursor: 'pointer',
        outline: 'none',
        transition: 'background-color 140ms ease',
        '&:hover, &:focus-visible': {
          bgcolor: alpha(dndColors.panelStrong, 0.72),
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Stack sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              color: dndColors.text,
              fontSize: { xs: 17, sm: 18 },
              fontWeight: 900,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {spell.name}
          </Typography>
          <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>
            {spell.level.toUpperCase()} • {spell.school.toUpperCase()}
          </Typography>
        </Stack>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '76px 48px minmax(58px, 0.82fr) minmax(62px, 0.9fr) minmax(78px, 1fr)',
            sm: '96px 56px minmax(70px, 0.8fr) minmax(76px, 0.9fr) minmax(96px, 1fr)',
          },
          columnGap: { xs: 0.75, sm: 1.15 },
          alignItems: 'end',
          mt: 1,
          pr: { xs: 0.2, sm: 0.8 },
        }}
      >
        <SpellPreparedCell
          isCantrip={!slotLevel}
          prepared={prepared}
          onTogglePrepared={onTogglePrepared}
        />
        <SpellValueCell>{formatSpellTime(spell.castingTime)}</SpellValueCell>
        <SpellValueCell>{spell.range}</SpellValueCell>
        <SpellHitDcCell spell={spell} value={hitDcValue} />
        <SpellEffectCell
          spell={spell}
          value={effectValue}
          canCast={canCast}
          onCast={castAndMaybeRoll}
        />
      </Box>
    </Box>
  );
}

function SpellValueCell({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <Typography
      sx={{
        color: dndColors.text,
        fontSize: { xs: 14, sm: 16 },
        fontWeight: 900,
        lineHeight: 1.25,
        textAlign: align,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Typography>
  );
}

function SpellPreparedCell({
  isCantrip,
  prepared,
  onTogglePrepared,
}: {
  isCantrip: boolean;
  prepared: boolean;
  onTogglePrepared: () => void;
}) {
  if (isCantrip) {
    return (
      <Typography
        sx={{
          color: dndColors.muted,
          fontSize: { xs: 14, sm: 16 },
          fontWeight: 900,
          lineHeight: 1.25,
        }}
      >
        At Will
      </Typography>
    );
  }

  return (
    <Button
      aria-pressed={prepared}
      onClick={(event) => {
        event.stopPropagation();
        onTogglePrepared();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      sx={{
        minWidth: 0,
        width: '100%',
        minHeight: 36,
        px: 0.75,
        borderRadius: '5px',
        border: `1px solid ${prepared ? dndColors.blue : dndColors.border}`,
        bgcolor: alpha(dndColors.panelStrong, 0.86),
        color: prepared ? dndColors.blue : dndColors.muted,
        fontSize: { xs: 12, sm: 14 },
        fontWeight: 950,
        textTransform: 'uppercase',
        '&:hover': {
          borderColor: prepared ? dndColors.blue : alpha(dndColors.blue, 0.72),
          bgcolor: alpha(dndColors.blue, 0.1),
        },
      }}
    >
      {prepared ? 'Prep' : 'Book'}
    </Button>
  );
}

function SpellHitDcCell({ spell, value }: { spell: Spell; value: string }) {
  const canRollSpellAttack = /^\+\d+$/u.test(value);
  if (canRollSpellAttack) {
    return (
      <Box
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        sx={{ width: '100%' }}
      >
        <RollBox
          ariaLabel={`Roll ${spell.name} spell attack`}
          onRoll={() => rollD20(`${spell.name} Spell Attack`, value)}
        >
          {value}
        </RollBox>
      </Box>
    );
  }

  return (
    <Typography
      sx={{
        color: value === '--' ? dndColors.muted : dndColors.text,
        fontSize: { xs: 14, sm: 16 },
        fontWeight: 900,
        textAlign: 'center',
        lineHeight: 1.25,
      }}
    >
      {value}
    </Typography>
  );
}

function SpellEffectCell({
  spell,
  value,
  canCast,
  onCast,
}: {
  spell: Spell;
  value: string;
  canCast: boolean;
  onCast: () => void;
}) {
  const isRollable = spell.damage && parseDiceExpression(value) !== null;

  if (isRollable) {
    return (
      <Box
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        sx={{ width: '100%' }}
      >
        <RollBox ariaLabel={`Cast ${spell.name}`} onRoll={canCast ? onCast : undefined}>
          {value}
        </RollBox>
      </Box>
    );
  }

  return (
    <Button
      disabled={!canCast}
      onClick={(event) => {
        event.stopPropagation();
        onCast();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      sx={{
        minWidth: 0,
        width: '100%',
        minHeight: 37,
        px: 0.75,
        borderRadius: '5px',
        border: `1px solid ${dndColors.border}`,
        bgcolor: alpha('#000000', 0.08),
        color: dndColors.text,
        fontSize: { xs: 14, sm: 16 },
        fontWeight: 900,
        textAlign: 'right',
        lineHeight: 1.25,
        textTransform: 'none',
        overflowWrap: 'anywhere',
        '&:hover': { borderColor: dndColors.blue, color: dndColors.blue },
        '&.Mui-disabled': {
          borderColor: alpha(dndColors.border, 0.52),
          color: alpha(dndColors.muted, 0.62),
        },
      }}
    >
      {value}
    </Button>
  );
}

function getSpellHitDcDisplay(spell: Spell) {
  const rawValue = spell.hitDc.trim();
  const normalized = rawValue.toLowerCase();
  if (!rawValue || ['auto', 'utility', 'resistance', 'reroll', '+5 ac'].includes(normalized)) {
    return '--';
  }
  return rawValue;
}

function getSpellEffectDisplay(spell: Spell) {
  const storedEffect = spell.effect?.trim();
  if (storedEffect) return storedEffect;
  const catalogEffect = dndSpellEffectsByName[spell.name.trim().toLowerCase()];
  if (catalogEffect) return catalogEffect;
  if (spell.damage?.trim()) return spell.damage.trim();
  const hitDc = spell.hitDc.trim();
  if (hitDc && getSpellHitDcDisplay(spell) === '--' && hitDc !== '--') return hitDc;
  return 'Utility';
}

function formatSpellTime(value: string) {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(
    /^(\d+)\s*(action|bonus action|reaction|minute|minutes|hour|hours)$/u,
  );
  if (!match) return value;
  const amount = match[1];
  const unit = match[2];
  if (unit === 'action') return `${amount}A`;
  if (unit === 'bonus action') return `${amount}BA`;
  if (unit === 'reaction') return `${amount}R`;
  if (unit === 'minute' || unit === 'minutes') return `${amount}m`;
  return `${amount}h`;
}

function SpellDetailsDialog({
  spell,
  onClose,
  onEdit,
  onDelete,
  onSelect,
  selectDisabledLabel,
}: {
  spell: Spell | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
  selectDisabledLabel?: string;
}) {
  if (!spell) return null;
  const catalogSpell = getKnownSpellData(spell.name);
  const displaySpell = {
    ...catalogSpell,
    ...spell,
    classes: spell.classes ?? catalogSpell?.classes,
  };
  const description = getSpellDescription(displaySpell);
  const higherLevel = displaySpell.higherLevel?.trim();
  const effect = getSpellEffectDisplay(displaySpell);
  const isCantrip = getSpellSlotLevel(displaySpell.level) === null;
  const detailRows = [
    { label: 'Casting Time', value: displaySpell.castingTime },
    { label: 'Range/Area', value: displaySpell.range },
    { label: 'Components', value: displaySpell.components ?? '--' },
    ...(displaySpell.material ? [{ label: 'Material', value: displaySpell.material }] : []),
    {
      label: 'Duration',
      value: displaySpell.duration ?? (displaySpell.concentration ? 'Concentration' : '--'),
    },
    ...(getSpellHitDcDisplay(displaySpell) !== '--'
      ? [{ label: 'Attack/Save', value: getSpellHitDcDisplay(displaySpell) }]
      : []),
    ...(displaySpell.source ? [{ label: 'Source', value: displaySpell.source }] : []),
  ];

  return (
    <Dialog
      open={Boolean(spell)}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{
        zIndex: 1900,
        '& .MuiDialog-container': {
          alignItems: { xs: 'flex-start', sm: 'center' },
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 430 },
          height: { xs: 'calc(100dvh - 82px)', sm: 'min(760px, calc(100dvh - 40px))' },
          mt: { xs: 'calc(env(safe-area-inset-top, 0px) + 78px)', sm: 0 },
          mx: { xs: 0, sm: 2 },
          borderRadius: { xs: '26px 26px 0 0', sm: '18px' },
          border: `1px solid ${dndColors.border}`,
          bgcolor: dndColors.panelSoft,
          color: dndColors.text,
          boxShadow: `0 18px 50px ${alpha('#000000', 0.46)}`,
          overflow: 'hidden',
        },
      }}
    >
      <IconButton
        aria-label="Close spell details"
        onClick={onClose}
        sx={{
          position: 'absolute',
          left: 16,
          top: 16,
          zIndex: 2,
          width: 48,
          height: 48,
          borderRadius: '999px',
          bgcolor: alpha('#000000', 0.28),
          color: dndColors.text,
          '&:hover': { bgcolor: alpha('#000000', 0.38) },
        }}
      >
        <X size={30} />
      </IconButton>
      {!onSelect && !selectDisabledLabel && (onEdit || onDelete) ? (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 2,
          }}
        >
          {onEdit ? (
            <IconButton
              aria-label="Edit spell"
              onClick={onEdit}
              sx={{
                width: 42,
                height: 42,
                borderRadius: '999px',
                bgcolor: alpha('#000000', 0.28),
                color: dndSwipeEditColor,
                '&:hover': { bgcolor: alpha('#000000', 0.38) },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          ) : null}
          {onDelete ? (
            <IconButton
              aria-label="Delete spell"
              onClick={onDelete}
              sx={{
                width: 42,
                height: 42,
                borderRadius: '999px',
                bgcolor: alpha('#000000', 0.28),
                color: dndColors.red,
                '&:hover': { bgcolor: alpha('#000000', 0.38) },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Stack>
      ) : null}
      <DialogContent
        sx={{
          px: 2.2,
          pt: 4.2,
          pb: 3,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Box sx={{ minHeight: 78, textAlign: 'center', px: 7 }}>
          <Typography
            sx={{ color: dndColors.text, fontSize: 19, fontWeight: 950, lineHeight: 1.1 }}
          >
            {displaySpell.name}
          </Typography>
          <Typography sx={{ color: dndColors.muted, fontSize: 13, fontWeight: 850 }}>
            {(displaySpell.classes ?? []).slice(0, 3).join(' • ') || 'Spell'}
          </Typography>
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1.5}
          sx={{ mt: 2.3 }}
        >
          <Typography sx={{ color: dndColors.text, fontSize: 16, minWidth: 0 }}>
            {formatSpellSubtitle(displaySpell)}
          </Typography>
          {onSelect ? (
            <Button
              onClick={onSelect}
              sx={{
                minHeight: 32,
                borderRadius: '999px',
                px: 1.6,
                flex: '0 0 auto',
                bgcolor: dndColors.red,
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 950,
                textTransform: 'none',
                '&:hover': { bgcolor: dndColors.redDark },
              }}
            >
              Select
            </Button>
          ) : null}
          {!onSelect && selectDisabledLabel ? (
            <Box
              sx={{
                minHeight: 32,
                borderRadius: '999px',
                px: 1.3,
                flex: '0 0 auto',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(dndColors.muted, 0.18),
                color: dndColors.muted,
                border: `1px solid ${alpha(dndColors.muted, 0.42)}`,
                fontSize: 12,
                fontWeight: 950,
                whiteSpace: 'nowrap',
              }}
            >
              {selectDisabledLabel}
            </Box>
          ) : null}
        </Stack>
        <DividerLine />
        <Typography sx={{ color: dndColors.text, fontSize: 15, fontWeight: 950, mb: 1.2 }}>
          CAST{' '}
          {isCantrip ? (
            <Box component="span" sx={{ fontWeight: 700 }}>
              At Will
            </Box>
          ) : null}
        </Typography>
        {!isCantrip ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.35 }}
          >
            <Stack direction="row" alignItems="center" spacing={0.8}>
              <Typography sx={{ color: dndColors.text, fontSize: 14, fontWeight: 900 }}>
                Lvl
              </Typography>
              <Box sx={spellLevelStepperSx}>-</Box>
              <Typography sx={{ color: dndColors.text, fontSize: 16, fontWeight: 950 }}>
                {getSpellSlotLevel(displaySpell.level) ?? displaySpell.level}
              </Typography>
              <Box sx={{ ...spellLevelStepperSx, bgcolor: dndColors.red }}>+</Box>
            </Stack>
            <Button
              sx={{
                minHeight: 32,
                border: `1px solid ${dndColors.blue}`,
                color: dndColors.blue,
                fontSize: 13,
                fontWeight: 900,
                textTransform: 'none',
              }}
            >
              Spell Slot
            </Button>
          </Stack>
        ) : null}
        <Typography sx={{ color: dndColors.text, fontSize: 16, fontWeight: 850, mb: 1.4 }}>
          <Box component="span" sx={{ fontWeight: 950 }}>
            {effect}
          </Box>{' '}
          {effect !== 'Utility' ? 'Effect' : ''}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 46,
            px: 1.2,
            mb: 1.3,
            bgcolor: alpha('#000000', 0.16),
            color: dndColors.text,
            fontWeight: 950,
          }}
        >
          Slots
          <Typography sx={{ color: dndColors.red, fontSize: 24, lineHeight: 1 }}>⌄</Typography>
        </Box>
        <DividerLine />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
            color: dndColors.text,
            fontWeight: 950,
          }}
        >
          Customize
          <Typography sx={{ fontSize: 30, lineHeight: 1 }}>›</Typography>
        </Box>
        <DividerLine />
        <Stack spacing={0.75}>
          {detailRows.map((detail) => (
            <Typography
              key={detail.label}
              sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.45 }}
            >
              <Box component="span" sx={{ fontWeight: 950 }}>
                {detail.label}:
              </Box>{' '}
              {detail.value}
            </Typography>
          ))}
          {displaySpell.ritual ? (
            <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.45 }}>
              <Box component="span" sx={{ fontWeight: 950 }}>
                Ritual:
              </Box>{' '}
              Yes
            </Typography>
          ) : null}
        </Stack>
        <DividerLine />
        <Typography
          sx={{ color: dndColors.text, fontSize: 16, lineHeight: 1.65, whiteSpace: 'pre-line' }}
        >
          {description}
        </Typography>
        {higherLevel ? (
          <Typography
            sx={{
              color: dndColors.text,
              fontSize: 16,
              lineHeight: 1.65,
              whiteSpace: 'pre-line',
              mt: 1.8,
            }}
          >
            <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 950 }}>
              At Higher Levels.
            </Box>{' '}
            {higherLevel.replace(/^At Higher Levels\.\s*/i, '')}
          </Typography>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

const spellLevelStepperSx = {
  display: 'grid',
  placeItems: 'center',
  width: 29,
  height: 29,
  bgcolor: alpha(dndColors.red, 0.58),
  color: '#ffffff',
  fontSize: 18,
  fontWeight: 950,
  lineHeight: 1,
};

function DividerLine() {
  return <Box sx={{ height: '1px', bgcolor: alpha(dndColors.border, 0.45), my: 1.35 }} />;
}

function formatSpellSubtitle(spell: Spell) {
  const level = getSpellSlotLevel(spell.level) ? spell.level : `${spell.school} Cantrip`;
  return getSpellSlotLevel(spell.level) ? `${spell.level} ${spell.school}` : level;
}

function getKnownSpellData(name: string) {
  const normalized = normalizeDndLookupName(name);
  return dndSpellCatalog.find((spell) => normalizeDndLookupName(spell.name) === normalized);
}

function normalizeDndLookupName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s*\+\d+\s*$/u, '')
    .replace(/[^\w\s'-]/gu, '')
    .replace(/\s+/gu, ' ');
}

function getSpellDescription(spell: Spell) {
  const storedDescription = spell.description?.trim();
  if (storedDescription) return storedDescription;
  const catalogDescription = dndSpellDescriptionsByName[spell.name.trim().toLowerCase()];
  if (catalogDescription) return catalogDescription;
  return (
    getKnownSpellData(spell.name)?.description ??
    'No description has been recorded for this spell yet.'
  );
}

function getSpellSlotLevel(level: string) {
  const normalized = level.trim().toLowerCase();
  if (!normalized || normalized.includes('cantrip') || normalized === '0') return null;
  const match = normalized.match(/^(\d+)(?:st|nd|rd|th)?/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value === 1) return '1st';
  if (value === 2) return '2nd';
  if (value === 3) return '3rd';
  return `${value}th`;
}

function getSpellSlotRank(level: string) {
  const normalized = level.trim().toLowerCase();
  const match = normalized.match(/^(\d+)(?:st|nd|rd|th)?/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function findUsableSpellSlot(slots: DndCharacter['spellcasting']['slots'], spellLevel: string) {
  const minimumRank = getSpellSlotRank(spellLevel);
  if (!minimumRank) return null;
  return (
    slots
      .map((slot) => ({ slot, rank: getSpellSlotRank(slot.level) }))
      .filter(
        (entry): entry is { slot: DndCharacter['spellcasting']['slots'][number]; rank: number } =>
          entry.rank !== null && entry.rank >= minimumRank && entry.slot.used < entry.slot.max,
      )
      .sort((left, right) => left.rank - right.rank)[0]?.slot ?? null
  );
}

function getHighestAvailableSpellSlotRank(slots: DndCharacter['spellcasting']['slots']) {
  return slots
    .map((slot) => ({ rank: getSpellSlotRank(slot.level), max: slot.max }))
    .filter((entry): entry is { rank: number; max: number } => entry.rank !== null && entry.max > 0)
    .reduce((highest, entry) => Math.max(highest, entry.rank), 0);
}

function characterCanAddSpellForSlots(
  spell: Pick<Spell, 'level'>,
  slots: DndCharacter['spellcasting']['slots'],
) {
  const spellLevel = getSpellSlotLevel(spell.level);
  if (!spellLevel) return true;
  const spellRank = getSpellSlotRank(spellLevel);
  if (!spellRank) return true;
  return spellRank <= getHighestAvailableSpellSlotRank(slots);
}

function InventoryScreen({
  character,
  onDeleteItem,
  onAddItem,
  onEditItem,
  onViewItem,
  onEditMoney,
  onToggleItemEquipped,
}: {
  character: DndCharacter;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onViewItem: (item: InventoryItem) => void;
  onEditMoney: () => void;
  onToggleItemEquipped: (id: string) => void;
}) {
  const totalWeight = character.inventory.reduce((sum, item) => {
    const numeric = Number.parseFloat(item.weight);
    const quantity = Number.parseFloat(item.quantity);
    return Number.isFinite(numeric)
      ? sum + numeric * (Number.isFinite(quantity) ? quantity : 1)
      : sum;
  }, 0);
  const encumbrance = encumbranceLabel(totalWeight, character);
  const acModifier = equippedArmorClassModifier(character);

  return (
    <>
      <SectionHeader icon={<Backpack />} title="Inventory" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <DndCard sx={{ mb: 1.5 }}>
          <Box
            sx={{
              minHeight: 132,
              p: 1.6,
              background:
                'linear-gradient(110deg, rgba(30,167,255,0.15), rgba(87,188,69,0.16)), radial-gradient(circle at 80% 40%, rgba(240,185,72,0.24), transparent 35%), #17232a',
            }}
          >
            <Stack direction="row" justifyContent="space-between">
              <Stack>
                <Typography sx={{ color: dndColors.muted, fontWeight: 900 }}>
                  WEIGHT CARRIED
                </Typography>
                <Typography sx={{ color: dndColors.text, fontSize: 25, fontWeight: 900 }}>
                  {totalWeight} lb.
                </Typography>
                <Typography sx={{ color: dndColors.muted, fontWeight: 800 }}>
                  {encumbrance}
                </Typography>
                <Typography sx={{ color: dndColors.blue, fontSize: 12, fontWeight: 900, mt: 0.5 }}>
                  AC {character.armorClass}
                  {acModifier ? ` + ${acModifier} equipped` : ''}
                </Typography>
              </Stack>
              <Stack alignItems="flex-end">
                <Typography sx={{ color: dndColors.muted, fontWeight: 900 }}>
                  TOTAL CURRENCY
                </Typography>
                <Typography sx={{ color: dndColors.text, fontSize: 21, fontWeight: 900 }}>
                  {character.money.gp} gp
                </Typography>
                <Button onClick={onEditMoney} sx={{ ...inlineEditButtonSx, mt: 1 }}>
                  Edit Money
                </Button>
              </Stack>
            </Stack>
            <Button
              onClick={onAddItem}
              sx={{
                mt: 2.5,
                mx: 'auto',
                display: 'flex',
                border: `1px solid ${dndColors.blue}`,
                color: dndColors.blue,
                fontWeight: 900,
                textTransform: 'none',
              }}
            >
              Add Item
            </Button>
          </Box>
          <Box sx={{ p: 1.6 }}>
            <Typography sx={{ color: dndColors.text, fontSize: 23, fontWeight: 900 }}>
              EQUIPMENT ({character.inventory.length})
            </Typography>
            <Typography sx={{ color: dndColors.text }}>{totalWeight} lb.</Typography>
          </Box>
        </DndCard>
        <GridHeader columns="1fr 1fr 1fr" labels={['Weight', 'Qty', 'Cost (gp)']} />
        {character.inventory.map((item) => (
          <SwipeRow
            key={item.id}
            onDelete={() => onDeleteItem(item.id)}
            onEdit={() => onEditItem(item)}
          >
            <InventoryRow
              item={item}
              onView={() => onViewItem(item)}
              onToggleEquipped={() => onToggleItemEquipped(item.id)}
            />
          </SwipeRow>
        ))}
      </Box>
    </>
  );
}

function InventoryRow({
  item,
  onView,
  onToggleEquipped,
}: {
  item: InventoryItem;
  onView: () => void;
  onToggleEquipped: () => void;
}) {
  const equipped = Boolean(item.equipped);
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView();
        }
      }}
      sx={{
        display: 'grid',
        gridTemplateColumns: '42px 1fr 1fr 1fr',
        gap: 1,
        py: 1.35,
        alignItems: 'center',
        borderBottom: `1px solid ${dndColors.borderSoft}`,
        bgcolor: dndColors.page,
        cursor: 'pointer',
      }}
    >
      <IconButton
        aria-label={`${equipped ? 'Unequip' : 'Equip'} ${item.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleEquipped();
        }}
        sx={{
          width: 32,
          height: 32,
          bgcolor: equipped ? alpha(dndColors.green, 0.16) : dndColors.redDark,
          border: `1px solid ${equipped ? dndColors.green : 'transparent'}`,
          borderRadius: '5px',
          display: 'grid',
          placeItems: 'center',
          color: equipped ? dndColors.green : '#ffffff',
          '&:hover': {
            bgcolor: equipped ? alpha(dndColors.green, 0.24) : dndColors.red,
          },
        }}
      >
        <Box sx={{ width: 12, height: 12, bgcolor: '#ffffff' }} />
      </IconButton>
      <Stack>
        <Typography
          sx={{
            color: equipped ? dndColors.green : dndColors.text,
            fontSize: 18,
            fontWeight: 900,
            fontStyle: equipped ? 'italic' : 'normal',
          }}
        >
          {item.name}
        </Typography>
        <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>
          {item.category.toUpperCase()}
        </Typography>
        <Typography sx={{ color: dndColors.text, fontWeight: 900, mt: 0.7 }}>
          {item.weight}
        </Typography>
      </Stack>
      <Typography sx={{ color: dndColors.muted, fontWeight: 900, textAlign: 'center' }}>
        {item.quantity}
      </Typography>
      <Typography sx={{ color: dndColors.muted, fontWeight: 900, textAlign: 'right' }}>
        {item.cost}
      </Typography>
    </Box>
  );
}

function FeaturesScreen({
  character,
  classCatalogByName,
  onAddFeature,
  onEditFeature,
  onAddFeat,
  onEditFeat,
  onDeleteFeat,
  onEditProficiencies,
  onDeleteFeature,
  onUpdateFeatureUses,
  embedded = false,
}: {
  character: DndCharacter;
  classCatalogByName: Map<string, DndClassInfo>;
  onAddFeature: () => void;
  onEditFeature: (feature: Feature) => void;
  onAddFeat: () => void;
  onEditFeat: (feat: Feat) => void;
  onDeleteFeat: (id: string) => void;
  onEditProficiencies: () => void;
  onDeleteFeature: (id: string) => void;
  onUpdateFeatureUses: (id: string, used: number) => void;
  embedded?: boolean;
}) {
  const activeClassNames = new Set(
    character.classes.map((entry) => normalizeClassCatalogKey(entry.name)).filter(Boolean),
  );
  const derivedClassFeatures = deriveDndClassFields({
    classes: character.classes,
    catalogByName: classCatalogByName,
    currentHitDicePools: character.hitPoints.hitDicePools,
  }).features;
  const persistedClassFeatures = character.features.filter(
    (feature) =>
      activeClassNames.has(normalizeClassCatalogKey(feature.source)) &&
      !feature.id.startsWith('class-summary-'),
  );
  const otherFeatures = character.features.filter(
    (feature) =>
      !feature.id.startsWith('class-summary-') &&
      !activeClassNames.has(normalizeClassCatalogKey(feature.source)),
  );

  return (
    <>
      {embedded ? null : <SectionHeader icon={<PersonIcon />} title="Features & Traits" />}
      <Box sx={{ px: embedded ? 0 : 1.6, pb: embedded ? 0 : 12 }}>
        <Typography sx={subSectionSx}>Class Attributes</Typography>
        {character.classes.map((entry) => (
          <ClassAttributeBlock
            key={`${entry.name}-${entry.level}`}
            entry={entry}
            classInfo={classCatalogByName.get(entry.name)}
          />
        ))}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 2, mb: 1 }}
        >
          <Typography sx={{ ...subSectionSx, mt: 0, mb: 0 }}>Class Features</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={onAddFeature}
            sx={{ ...inlineEditButtonSx, minHeight: 36 }}
          >
            Add Feature
          </Button>
        </Stack>
        {derivedClassFeatures.map((feature) => (
          <FeatureBlock key={feature.id} feature={feature} />
        ))}
        {persistedClassFeatures.map((feature) => (
          <SwipeRow key={feature.id} onDelete={() => onDeleteFeature(feature.id)}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => onEditFeature(feature)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onEditFeature(feature);
                }
              }}
              sx={{ cursor: 'pointer' }}
            >
              <FeatureBlock
                feature={feature}
                onUpdateUses={
                  feature.uses ? (used) => onUpdateFeatureUses(feature.id, used) : undefined
                }
              />
            </Box>
          </SwipeRow>
        ))}
        {otherFeatures.length ? (
          <Typography sx={{ ...subSectionSx, mt: 2.4, mb: 1 }}>Other Features</Typography>
        ) : null}
        {otherFeatures.map((feature) => (
          <SwipeRow key={feature.id} onDelete={() => onDeleteFeature(feature.id)}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => onEditFeature(feature)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onEditFeature(feature);
                }
              }}
              sx={{ cursor: 'pointer' }}
            >
              <FeatureBlock
                feature={feature}
                onUpdateUses={
                  feature.uses ? (used) => onUpdateFeatureUses(feature.id, used) : undefined
                }
              />
            </Box>
          </SwipeRow>
        ))}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 2, mb: 1 }}
        >
          <Typography sx={{ ...subSectionSx, mt: 0, mb: 0 }}>Feats</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={onAddFeat}
            sx={{ ...inlineEditButtonSx, minHeight: 36 }}
          >
            Add Feat
          </Button>
        </Stack>
        {character.feats.map((feat) => (
          <SwipeRow key={feat.id} onDelete={() => onDeleteFeat(feat.id)}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => onEditFeat(feat)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onEditFeat(feat);
                }
              }}
              sx={{ cursor: 'pointer' }}
            >
              <FeatureBlock
                feature={{ id: feat.id, name: feat.name, source: 'Feat', summary: feat.summary }}
              />
            </Box>
          </SwipeRow>
        ))}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 2, mb: 1 }}
        >
          <Typography sx={{ ...subSectionSx, mt: 0, mb: 0 }}>Proficiencies & Training</Typography>
          <Button
            startIcon={<EditIcon />}
            onClick={onEditProficiencies}
            sx={{ ...inlineEditButtonSx, minHeight: 36 }}
          >
            Edit
          </Button>
        </Stack>
        <Stack spacing={1.25}>
          <TagGroup label="Proficiencies" values={character.proficiencies} />
          <TagGroup label="Languages" values={character.languages} />
        </Stack>
      </Box>
    </>
  );
}

function formatClassList(values: string[] | string | undefined) {
  if (Array.isArray(values)) return values.length > 0 ? values.join(', ') : 'None';
  if (typeof values === 'string' && values.trim()) return values;
  return 'None';
}

function ClassAttributeBlock({
  entry,
  classInfo,
}: {
  entry: DndCharacter['classes'][number];
  classInfo?: DndClassInfo;
}) {
  const skillChoices = classInfo?.skillChoices
    ? `Choose ${classInfo.skillChoices.choose ?? '?'} from ${formatClassList(classInfo.skillChoices.from)}`
    : 'None';
  const resource = classInfo?.classResource
    ? [
        classInfo.classResource.name,
        classInfo.classResource.ability,
        classInfo.classResource.resource,
      ]
        .filter(Boolean)
        .join(' • ')
    : null;

  return (
    <Box
      sx={{
        border: `1px solid ${dndColors.borderSoft}`,
        borderRadius: '8px',
        bgcolor: dndColors.panel,
        p: 1.2,
        mb: 1,
      }}
    >
      <Typography sx={{ color: dndColors.text, fontSize: 18, fontWeight: 900 }}>
        {entry.name}{' '}
        <Box component="span" sx={{ color: dndColors.muted, fontSize: 13 }}>
          Level {entry.level}
          {entry.subclass ? ` • ${entry.subclass}` : ''}
        </Box>
      </Typography>
      {classInfo ? (
        <Box sx={{ display: 'grid', gap: 0.75, mt: 1 }}>
          <ClassAttributeLine label="Hit Die" value={classInfo.hitDie ?? 'Unknown'} />
          <ClassAttributeLine label="Primary" value={formatClassList(classInfo.primaryAbilities)} />
          <ClassAttributeLine label="Saves" value={formatClassList(classInfo.savingThrows)} />
          <ClassAttributeLine label="Armor" value={formatClassList(classInfo.armorProficiencies)} />
          <ClassAttributeLine
            label="Weapons"
            value={formatClassList(classInfo.weaponProficiencies)}
          />
          <ClassAttributeLine label="Tools" value={formatClassList(classInfo.toolProficiencies)} />
          <ClassAttributeLine label="Skills" value={skillChoices} />
          <ClassAttributeLine label="Magic" value={formatSpellcasting(classInfo.spellcasting)} />
          {resource ? <ClassAttributeLine label="Resource" value={resource} /> : null}
        </Box>
      ) : (
        <Typography sx={{ color: dndColors.muted, fontSize: 14, mt: 0.8 }}>
          Class catalog details are not available for this class yet.
        </Typography>
      )}
    </Box>
  );
}

function ClassAttributeLine({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '82px 1fr',
        gap: 1,
        alignItems: 'baseline',
      }}
    >
      <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900 }}>
        {label.toUpperCase()}
      </Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 13.5, lineHeight: 1.35 }}>
        {value}
      </Typography>
    </Box>
  );
}

const subSectionSx = {
  color: dndColors.blue,
  fontSize: 18,
  fontWeight: 900,
  mt: 2,
  mb: 1,
  textTransform: 'uppercase',
};

const moreButtonSx = {
  flex: 1,
  border: `1px solid ${dndColors.border}`,
  color: dndColors.text,
  bgcolor: dndColors.panelSoft,
  textTransform: 'none',
  fontWeight: 800,
};

type MoreDetailTab = Extract<DndTab, 'features' | 'background' | 'notes'>;

const moreDetailTabs: Array<{ tab: MoreDetailTab; label: string }> = [
  { tab: 'features', label: 'Features' },
  { tab: 'background', label: 'Background' },
  { tab: 'notes', label: 'Notes' },
];

function moreScreenTitle(tab: DndTab) {
  switch (tab) {
    case 'background':
      return 'Background';
    case 'notes':
      return 'Notes';
    case 'features':
    default:
      return 'Features & Traits';
  }
}

function moreScreenIcon(tab: DndTab) {
  switch (tab) {
    case 'background':
      return <PersonIcon />;
    case 'notes':
      return <MenuBookIcon />;
    case 'features':
    default:
      return <PersonIcon />;
  }
}

function moreTabButtonSx(selected: boolean) {
  return {
    ...moreButtonSx,
    minHeight: 42,
    borderColor: selected ? dndColors.red : dndColors.border,
    bgcolor: selected ? alpha(dndColors.red, 0.24) : dndColors.panelSoft,
    color: selected ? '#ffffff' : dndColors.text,
    boxShadow: selected ? `0 0 0 1px ${alpha(dndColors.red, 0.35)}` : 'none',
    '&:hover': { bgcolor: selected ? alpha(dndColors.red, 0.32) : '#243640' },
  };
}

function MoreScreen({
  activeTab,
  onSelectTab,
  children,
}: {
  activeTab: DndTab;
  onSelectTab: (tab: DndTab) => void;
  children: ReactNode;
}) {
  return (
    <>
      <SectionHeader icon={moreScreenIcon(activeTab)} title={moreScreenTitle(activeTab)} />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Stack direction="row" spacing={1} sx={{ mt: 1.4, mb: 1.4, flexWrap: 'wrap' }}>
          {moreDetailTabs.map((tab) => (
            <Button
              key={tab.tab}
              onClick={() => onSelectTab(tab.tab)}
              aria-pressed={activeTab === tab.tab}
              sx={moreTabButtonSx(activeTab === tab.tab)}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>
        {children}
      </Box>
    </>
  );
}

const inlineEditButtonSx = {
  color: dndColors.blue,
  border: `1px solid ${dndColors.border}`,
  bgcolor: dndColors.panel,
  borderRadius: '6px',
  textTransform: 'none',
  fontWeight: 900,
  '&:hover': { bgcolor: dndColors.panelSoft },
};

function FeatureBlock({
  feature,
  onUpdateUses,
}: {
  feature: Feature;
  onUpdateUses?: (used: number) => void;
}) {
  return (
    <Box
      sx={{ py: 1.2, borderBottom: `1px solid ${dndColors.borderSoft}`, bgcolor: dndColors.page }}
    >
      <Typography sx={{ color: dndColors.text, fontSize: 19, fontWeight: 900 }}>
        {feature.name}{' '}
        <Box component="span" sx={{ color: dndColors.red }}>
          •
        </Box>{' '}
        <Box component="span" sx={{ color: dndColors.muted }}>
          {feature.source}
        </Box>
      </Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.55, mt: 0.7 }}>
        {feature.summary}
      </Typography>
      {feature.uses ? (
        <Box sx={{ mt: 1.2, pl: 1.2, borderLeft: `2px solid ${dndColors.muted}` }}>
          <Typography sx={{ color: dndColors.text, fontWeight: 900 }}>
            {feature.uses.label}{' '}
            <Box component="span" sx={{ color: dndColors.muted, fontWeight: 500 }}>
              ({feature.uses.reset})
            </Box>
          </Typography>
          <Stack direction="row" spacing={0.7} sx={{ mt: 0.8 }}>
            {Array.from({ length: feature.uses.max }).map((_, index) => (
              <Box
                component="button"
                key={index}
                type="button"
                disabled={!onUpdateUses}
                aria-label={`${feature.name}: set ${feature.uses!.label} used to ${index + 1} of ${feature.uses!.max}`}
                aria-pressed={index < feature.uses!.used}
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdateUses?.(index + 1 === feature.uses!.used ? index : index + 1);
                }}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '4px',
                  border: `2px solid ${dndColors.muted}`,
                  bgcolor: index < feature.uses!.used ? dndColors.muted : 'transparent',
                  cursor: onUpdateUses ? 'pointer' : 'default',
                  p: 0,
                  '&:focus-visible': { outline: `2px solid ${dndColors.blue}`, outlineOffset: 2 },
                }}
              />
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}

function TagCloud({ values }: { values: string[] }) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.8}>
      {values.map((value) => (
        <Box
          key={value}
          sx={{
            px: 1.1,
            py: 0.65,
            bgcolor: dndColors.panelSoft,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '999px',
            color: dndColors.text,
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          {value}
        </Box>
      ))}
    </Stack>
  );
}

function TagGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <Box>
      <Typography
        sx={{
          color: dndColors.muted,
          fontSize: 12,
          fontWeight: 950,
          letterSpacing: 0.4,
          mb: 0.65,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      {values.length > 0 ? (
        <TagCloud values={values} />
      ) : (
        <Typography sx={{ color: dndColors.muted, fontSize: 13, fontWeight: 750 }}>
          None recorded
        </Typography>
      )}
    </Box>
  );
}

function BackgroundScreen({
  character,
  onEditBackground,
  embedded = false,
}: {
  character: DndCharacter;
  onEditBackground: () => void;
  embedded?: boolean;
}) {
  return (
    <>
      {embedded ? null : <SectionHeader icon={<PersonIcon />} title="Background" mode="list" />}
      <Box sx={{ px: embedded ? 0 : 1.6, pb: embedded ? 0 : 12 }}>
        <DndCard title={character.background} sx={{ p: 1.6 }}>
          <Button onClick={onEditBackground} sx={{ ...inlineEditButtonSx, mb: 1 }}>
            Edit Background
          </Button>
          <Detail title="Alignment" value={character.alignment} />
          <Detail title="Personality Traits" value={character.personality.traits} />
          <Detail title="Ideals" value={character.personality.ideals} />
          <Detail title="Bonds" value={character.personality.bonds} />
          <Detail title="Flaws" value={character.personality.flaws} />
          <Detail title="Backstory" value={character.personality.backstory} />
        </DndCard>
      </Box>
    </>
  );
}

function NotesScreen({
  character,
  onAddNote,
  onEditNote,
  onDeleteNote,
  embedded = false,
}: {
  character: DndCharacter;
  onAddNote: () => void;
  onEditNote: (note: DndCharacter['notes'][number]) => void;
  onDeleteNote: (id: string) => void;
  embedded?: boolean;
}) {
  return (
    <>
      {embedded ? null : <SectionHeader icon={<MenuBookIcon />} title="Notes" mode="list" />}
      <Box sx={{ px: embedded ? 0 : 1.6, pb: embedded ? 0 : 12 }}>
        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={onAddNote}
          sx={{ ...inlineEditButtonSx, mb: 1.2, minHeight: 44 }}
        >
          Add Note
        </Button>
        {character.notes.map((note) => (
          <SwipeRow
            key={note.id}
            onDelete={() => onDeleteNote(note.id)}
            onEdit={() => onEditNote(note)}
          >
            <DndCard sx={{ p: 1.6, mb: 1.2 }}>
              <Typography sx={{ color: dndColors.text, fontSize: 19, fontWeight: 900 }}>
                {note.title}
              </Typography>
              <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.55, mt: 0.8 }}>
                {note.body}
              </Typography>
            </DndCard>
          </SwipeRow>
        ))}
      </Box>
    </>
  );
}

function Detail({ title, value }: { title: string; value: string }) {
  return (
    <Box sx={{ mt: 1.2 }}>
      <Typography
        sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}
      >
        {title}
      </Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.5 }}>{value}</Typography>
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack alignItems="center">
      <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 22, fontWeight: 900 }}>{value}</Typography>
    </Stack>
  );
}

function SwipeRow({
  children,
  onDelete,
  onEdit,
}: {
  children: ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
}) {
  const actions: Array<SwipeableAction | null> = [
    {
      icon: <DeleteIcon />,
      color: dndColors.redDark,
      ariaLabel: 'Delete',
      onClick: onDelete,
    },
    onEdit
      ? {
          icon: <EditIcon />,
          color: dndSwipeEditColor,
          ariaLabel: 'Edit',
          onClick: onEdit,
        }
      : null,
  ];

  return (
    <SwipeableCard actions={actions} borderRadius="0">
      {children}
    </SwipeableCard>
  );
}

function ConfirmDeleteDialog({
  open,
  onCancel,
  onConfirm,
  title = 'Delete this entry?',
  body,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  body: string;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent sx={{ color: dndColors.muted }}>{body}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: dndColors.text }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{ bgcolor: dndColors.red, '&:hover': { bgcolor: dndColors.redDark } }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CharacterSwitcherDialog({
  open,
  characters,
  canAdd,
  limit,
  onAdd,
  onSelect,
  onDelete,
  onClose,
}: {
  open: boolean;
  characters: LocalCharacterSummary[];
  canAdd: boolean;
  limit: number;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>Characters</DialogTitle>
      <DialogContent>
        <Button
          fullWidth
          disabled={!canAdd}
          startIcon={<AddIcon />}
          onClick={() => {
            onAdd();
            onClose();
          }}
          sx={{
            minHeight: 50,
            mb: 1.4,
            border: `1px dashed ${dndColors.border}`,
            color: canAdd ? dndColors.text : dndColors.muted,
            bgcolor: dndColors.panel,
            textTransform: 'none',
            fontWeight: 900,
            '&:hover': { bgcolor: dndColors.panelStrong },
          }}
        >
          Add character ({characters.length}/{limit})
        </Button>
        <Stack spacing={1}>
          {characters.map((character) => (
            <Stack
              key={character.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                minHeight: 52,
                px: 1.2,
                borderRadius: '7px',
                border: `1px solid ${character.active ? dndColors.red : dndColors.border}`,
                bgcolor: character.active ? alpha(dndColors.red, 0.16) : dndColors.panel,
              }}
            >
              <Button
                onClick={() => {
                  onSelect(character.id);
                  onClose();
                }}
                sx={{
                  flex: 1,
                  justifyContent: 'flex-start',
                  color: dndColors.text,
                  textTransform: 'none',
                  fontWeight: 900,
                }}
              >
                {character.name}
              </Button>
              <IconButton
                aria-label={`Delete ${character.name}`}
                onClick={() => onDelete(character.id)}
                sx={{ color: dndColors.red }}
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: dndColors.text }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UndoToast({
  open,
  onUndo,
  onClose,
}: {
  open: boolean;
  onUndo: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeout);
  }, [onClose, open]);

  return (
    <Fade in={open}>
      <Button
        onClick={onUndo}
        sx={{
          position: 'absolute',
          right: 18,
          bottom: 94,
          zIndex: 20,
          minWidth: 0,
          width: 58,
          height: 58,
          borderRadius: '50%',
          bgcolor: dndColors.red,
          color: '#ffffff',
          boxShadow: '0 12px 28px rgba(0,0,0,0.38)',
          '&:hover': { bgcolor: dndColors.redDark },
        }}
      >
        Undo
      </Button>
    </Fade>
  );
}

function ItemAddedToast({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(onClose, 2400);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  return (
    <Fade in={Boolean(message)}>
      <Box
        role="status"
        sx={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 94px)',
          zIndex: 2200,
          width: 'min(330px, calc(100vw - 36px))',
          transform: 'translateX(-50%)',
          borderRadius: '10px',
          bgcolor: alpha(dndColors.panelStrong, 0.96),
          border: `1px solid ${dndColors.borderSoft}`,
          boxShadow: `0 18px 44px ${alpha('#000000', 0.42)}`,
          px: 2,
          py: 1.25,
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: dndColors.text, fontSize: 14, fontWeight: 950 }}>
          Item Added
        </Typography>
        <Typography sx={{ mt: 0.25, color: dndColors.muted, fontSize: 13, fontWeight: 750 }}>
          {message}
        </Typography>
      </Box>
    </Fade>
  );
}

function AppMenu({ activeTab, onChange }: { activeTab: DndTab; onChange: (tab: DndTab) => void }) {
  const menuItems: Array<{ tab: DndTab; label: string; icon: ReactNode }> = [
    { tab: 'abilities', label: 'Abilities, Saves, Senses', icon: <ShieldIcon /> },
    { tab: 'skills', label: 'Skills', icon: <AutoAwesomeIcon /> },
    { tab: 'actions', label: 'Actions', icon: <Sword /> },
    { tab: 'spells', label: 'Spells', icon: <LocalFireDepartmentIcon /> },
    { tab: 'inventory', label: 'Inventory', icon: <Backpack /> },
    { tab: 'features', label: 'Features & Traits', icon: <PersonIcon /> },
    { tab: 'background', label: 'Background', icon: <MenuBookIcon /> },
    { tab: 'notes', label: 'Notes', icon: <MenuBookIcon /> },
  ];

  return (
    <Box sx={{ px: 1.6, pb: 12 }}>
      {menuItems.map((item) => {
        const selected = activeTab === item.tab;
        return (
          <Button
            key={item.tab}
            fullWidth
            onClick={() => onChange(item.tab)}
            startIcon={item.icon}
            sx={{
              minHeight: 58,
              mb: 1.1,
              px: 2,
              justifyContent: 'flex-start',
              bgcolor: dndColors.panelSoft,
              color: dndColors.text,
              border: selected ? `1px solid ${dndColors.red}` : `1px solid transparent`,
              borderRadius: '5px',
              textTransform: 'none',
              fontSize: 18,
              fontWeight: 900,
              '& .MuiButton-startIcon': { color: selected ? dndColors.red : dndColors.muted },
              '&:hover': { bgcolor: '#243640' },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
}

const dndTabMenuItems: Array<{ tab: DndTab; label: string; icon: ReactNode }> = [
  { tab: 'abilities', label: 'Abilities, Saves, Senses', icon: <ShieldIcon /> },
  { tab: 'skills', label: 'Skills', icon: <AutoAwesomeIcon /> },
  { tab: 'actions', label: 'Actions', icon: <Sword /> },
  { tab: 'spells', label: 'Spells', icon: <LocalFireDepartmentIcon /> },
  { tab: 'inventory', label: 'Inventory', icon: <Backpack /> },
  { tab: 'features', label: 'Features & Traits', icon: <PersonIcon /> },
  { tab: 'background', label: 'Background', icon: <MenuBookIcon /> },
  { tab: 'notes', label: 'Notes', icon: <MenuBookIcon /> },
];

function TabMenuDialog({
  open,
  activeTab,
  onClose,
  onSelectTab,
}: {
  open: boolean;
  activeTab: DndTab;
  onClose: () => void;
  onSelectTab: (tab: DndTab) => void;
}) {
  const { themeMode } = useThemeMode();
  const isLightMode = themeMode !== ThemeMode.DARK;
  const selectTab = (tab: DndTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          m: 1.2,
          borderRadius: '28px',
          bgcolor: dndColors.chrome,
          color: dndColors.text,
          minHeight: 'min(760px, calc(100vh - 24px))',
          boxShadow: '0 26px 60px rgba(0,0,0,0.48)',
        },
      }}
    >
      <Box sx={{ px: 2.4, pt: 2.2, pb: 3 }}>
        <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{ mb: 2.4 }}>
          <IconButton
            aria-label="Close Dungeons & Dragons tab menu"
            onClick={onClose}
            sx={{
              width: 54,
              height: 54,
              bgcolor: dndColors.panelStrong,
              color: isLightMode ? '#303a40' : '#ffffff',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
              '&:hover': { bgcolor: isLightMode ? dndColors.panelSoft : '#05090b' },
            }}
          >
            <X size={31} />
          </IconButton>
        </Stack>

        <Stack spacing={1.15}>
          {dndTabMenuItems.map((item) => {
            const selected = item.tab === activeTab;
            return (
              <Button
                key={item.tab}
                fullWidth
                onClick={() => selectTab(item.tab)}
                startIcon={item.icon}
                sx={{
                  minHeight: 55,
                  justifyContent: 'flex-start',
                  px: 2,
                  borderRadius: '4px',
                  border: `1px solid ${selected ? dndColors.red : 'transparent'}`,
                  bgcolor: dndColors.panelSoft,
                  color: dndColors.text,
                  textTransform: 'none',
                  fontSize: 18,
                  fontWeight: 900,
                  '& .MuiButton-startIcon': {
                    color: selected ? dndColors.red : dndColors.muted,
                    mr: 1.5,
                    '& svg': { fontSize: 23 },
                  },
                  '&:hover': { bgcolor: '#243640' },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>
      </Box>
    </Dialog>
  );
}

function FormField({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <Box>
      <Typography
        sx={{
          color: dndColors.muted,
          fontSize: 11,
          fontWeight: 900,
          mb: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <InputBase
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputProps={{ inputMode }}
        sx={{
          width: '100%',
          minHeight: 42,
          px: 1.1,
          borderRadius: '6px',
          bgcolor: dndColors.panelStrong,
          border: `1px solid ${dndColors.border}`,
          color: dndColors.text,
          fontSize: 16,
          fontWeight: 700,
        }}
      />
    </Box>
  );
}

function MultilineFormField({
  label,
  value,
  onChange,
  minRows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
}) {
  return (
    <Box>
      <Typography
        sx={{
          color: dndColors.muted,
          fontSize: 11,
          fontWeight: 900,
          mb: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <InputBase
        value={value}
        multiline
        minRows={minRows}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          width: '100%',
          px: 1.1,
          py: 0.8,
          borderRadius: '6px',
          bgcolor: dndColors.panelStrong,
          border: `1px solid ${dndColors.border}`,
          color: dndColors.text,
          fontSize: 16,
          fontWeight: 700,
          alignItems: 'flex-start',
        }}
      />
    </Box>
  );
}

function DndEditDialog({
  title,
  open,
  children,
  onCancel,
  onSave,
  titleAction,
  hideTitle = false,
  saveDisabled = false,
}: {
  title: string;
  open: boolean;
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
  titleAction?: ReactNode;
  hideTitle?: boolean;
  saveDisabled?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}
    >
      {hideTitle ? null : (
        <DialogTitle
          sx={{
            pr: titleAction ? 2 : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            fontWeight: 900,
          }}
        >
          <Box component="span" sx={{ minWidth: 0 }}>
            {title}
          </Box>
          {titleAction}
        </DialogTitle>
      )}
      <DialogContent sx={{ pt: hideTitle ? 2.5 : undefined }}>
        <Stack spacing={1.2} sx={{ pt: 0.5 }}>
          {children}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: dndColors.text }}>
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={saveDisabled}
          variant="contained"
          sx={{
            bgcolor: dndColors.red,
            '&:hover': { bgcolor: dndColors.redDark },
            '&.Mui-disabled': {
              bgcolor: alpha(dndColors.red, 0.28),
              color: alpha('#ffffff', 0.42),
            },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RestDialog({
  open,
  character,
  onClose,
  onApplyRest,
  onSpendHitDie,
}: {
  open: boolean;
  character: DndCharacter;
  onClose: () => void;
  onApplyRest: (restType: RestType) => void;
  onSpendHitDie: (die: string) => void;
}) {
  const constitutionScore =
    character.abilities.find((ability) => ability.key === 'con')?.score ?? 10;
  const constitutionModifier = abilityModifier(constitutionScore);
  const hitDicePools = character.hitPoints.hitDicePools;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>Take a Rest</DialogTitle>
      <DialogContent>
        <Stack spacing={1.2} sx={{ pt: 0.5 }}>
          <Box
            sx={{
              border: `1px solid ${dndColors.border}`,
              borderRadius: '8px',
              bgcolor: dndColors.panelStrong,
              p: 1.4,
            }}
          >
            <Typography sx={{ color: dndColors.text, fontWeight: 900 }}>Hit Dice</Typography>
            <Typography sx={{ color: dndColors.muted, fontSize: 13, fontWeight: 800, mt: 0.3 }}>
              {formatHitDicePools(hitDicePools)}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {hitDicePools.map((pool) => {
                const available = pool.max - pool.used;
                const healAmount = hitDieAverageHeal(pool.die, constitutionModifier);
                return (
                  <Button
                    key={pool.die}
                    disabled={
                      available <= 0 || character.hitPoints.current >= character.hitPoints.max
                    }
                    onClick={() => onSpendHitDie(pool.die)}
                    sx={{
                      border: `1px solid ${available > 0 ? dndColors.blue : dndColors.border}`,
                      color: dndColors.text,
                      fontWeight: 900,
                      textTransform: 'none',
                      '&.Mui-disabled': {
                        color: alpha('#ffffff', 0.46),
                      },
                    }}
                  >
                    Spend {pool.die} (+{healAmount})
                  </Button>
                );
              })}
            </Stack>
          </Box>
          <Button
            onClick={() => onApplyRest('short')}
            sx={{
              justifyContent: 'flex-start',
              border: `1px solid ${dndColors.border}`,
              bgcolor: dndColors.panelStrong,
              color: dndColors.text,
              borderRadius: '8px',
              p: 1.4,
              textTransform: 'none',
              '&:hover': { bgcolor: alpha('#ffffff', 0.08) },
            }}
          >
            <Stack alignItems="flex-start" spacing={0.3}>
              <Typography sx={{ fontWeight: 900 }}>Short Rest</Typography>
              <Typography sx={{ color: dndColors.muted, fontSize: 13, textAlign: 'left' }}>
                Spend available hit dice to recover HP and reset short-rest features.
              </Typography>
            </Stack>
          </Button>
          <Button
            onClick={() => onApplyRest('long')}
            sx={{
              justifyContent: 'flex-start',
              border: `1px solid ${dndColors.border}`,
              bgcolor: dndColors.panelStrong,
              color: dndColors.text,
              borderRadius: '8px',
              p: 1.4,
              textTransform: 'none',
              '&:hover': { bgcolor: alpha('#ffffff', 0.08) },
            }}
          >
            <Stack alignItems="flex-start" spacing={0.3}>
              <Typography sx={{ fontWeight: 900 }}>Long Rest</Typography>
              <Typography sx={{ color: dndColors.muted, fontSize: 13, textAlign: 'left' }}>
                Restore hit points, clear temporary HP and death saves, refresh spell slots, and
                reset rest features.
              </Typography>
            </Stack>
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: dndColors.text }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type CharacterClassForm = {
  name: string;
  subclass: string;
  level: string;
};

type CharacterForm = {
  name: string;
  species: string;
  background: string;
  alignment: string;
  classes: CharacterClassForm[];
  abilityScores: Record<AbilityKey, number>;
  spells: Spell[];
  armorClass: string;
  initiative: string;
  speed: string;
  proficiencyBonus: string;
};

type CharacterBuilderForm = {
  name: string;
  species: string;
  className: string;
  background: string;
  alignment: string;
  str: string;
  dex: string;
  con: string;
  int: string;
  wis: string;
  cha: string;
  proficiencies: string;
  equipment: string;
  spells: string;
};

function buildCharacterFromGuide(form: CharacterBuilderForm): DndCharacter {
  const base = createDndCharacter();
  const abilityScores: Record<AbilityKey, number> = {
    str: parseIntOrFallback(form.str, 10),
    dex: parseIntOrFallback(form.dex, 10),
    con: parseIntOrFallback(form.con, 10),
    int: parseIntOrFallback(form.int, 10),
    wis: parseIntOrFallback(form.wis, 10),
    cha: parseIntOrFallback(form.cha, 10),
  };
  const proficiencies = parseEditableList(form.proficiencies);
  const inventoryNames = parseEditableList(form.equipment);
  const spellNames = parseEditableList(form.spells);
  const inventory = inventoryNames.map((name) => {
    const catalogItem = dndItemCatalog.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    return {
      id: createEntryId('item'),
      ...(catalogItem ?? {
        name,
        category: 'Adventuring Gear',
        weight: '--',
        quantity: '1',
        cost: '--',
      }),
      equipped: false,
    };
  });
  const spells = spellNames.map((name) => {
    const catalogSpell = getKnownSpellData(name);
    return {
      id: createEntryId('spell'),
      ...(catalogSpell ?? {
        name,
        level: '1st Level',
        school: 'Arcane',
        castingTime: '1 Action',
        range: '60 ft.',
        hitDc: formatModifier(base.spellcasting.attackBonus),
      }),
      prepared: false,
    };
  });

  return {
    ...base,
    name: form.name.trim() || base.name,
    species: form.species.trim() || base.species,
    classes: [{ name: form.className.trim() || 'Fighter', level: 1 }],
    level: 1,
    background: form.background.trim() || base.background,
    alignment: form.alignment.trim() || base.alignment,
    abilities: base.abilities.map((ability) => ({
      ...ability,
      score: abilityScores[ability.key],
      saveBonus:
        abilityModifier(abilityScores[ability.key]) +
        (ability.proficientSave ? base.proficiencyBonus : 0),
    })),
    skills: base.skills.map((skill) => ({
      ...skill,
      bonus:
        abilityModifier(abilityScores[skill.ability]) +
        (skill.proficient ? base.proficiencyBonus : 0),
    })),
    proficiencies,
    inventory,
    spells,
  };
}

function createCharacterForm(character: DndCharacter): CharacterForm {
  return {
    name: character.name,
    species: character.species,
    background: character.background,
    alignment: character.alignment,
    classes:
      character.classes.length > 0
        ? character.classes.map((entry) => ({
            name: entry.name,
            subclass: entry.subclass ?? '',
            level: String(entry.level),
          }))
        : [{ name: 'Fighter', subclass: '', level: '1' }],
    abilityScores: Object.fromEntries(
      character.abilities.map((ability) => [ability.key, ability.score]),
    ) as Record<AbilityKey, number>,
    spells: character.spells.map((spell) => ({ ...spell })),
    armorClass: String(character.armorClass),
    initiative: String(character.initiative),
    speed: String(character.speed),
    proficiencyBonus: String(character.proficiencyBonus),
  };
}

const dndMulticlassRequirements: Record<
  string,
  Array<{ abilities: AbilityKey[]; score: number; mode?: 'any' | 'all' }>
> = {
  artificer: [{ abilities: ['int'], score: 13 }],
  barbarian: [{ abilities: ['str'], score: 13 }],
  bard: [{ abilities: ['cha'], score: 13 }],
  cleric: [{ abilities: ['wis'], score: 13 }],
  druid: [{ abilities: ['wis'], score: 13 }],
  fighter: [{ abilities: ['str', 'dex'], score: 13, mode: 'any' }],
  monk: [{ abilities: ['dex', 'wis'], score: 13, mode: 'all' }],
  paladin: [{ abilities: ['str', 'cha'], score: 13, mode: 'all' }],
  pugilist: [{ abilities: ['str', 'con'], score: 13, mode: 'all' }],
  ranger: [{ abilities: ['dex', 'wis'], score: 13, mode: 'all' }],
  rogue: [{ abilities: ['dex'], score: 13 }],
  sorcerer: [{ abilities: ['cha'], score: 13 }],
  warlock: [{ abilities: ['cha'], score: 13 }],
  wizard: [{ abilities: ['int'], score: 13 }],
};

const abilityLabels: Record<AbilityKey, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};

function formatClassRequirement(className: string) {
  const requirements = dndMulticlassRequirements[normalizeClassCatalogKey(className)];
  if (!requirements) return null;
  return requirements
    .map((requirement) => {
      const joiner = requirement.mode === 'any' ? ' or ' : ' and ';
      return `${requirement.abilities.map((ability) => abilityLabels[ability]).join(joiner)} ${requirement.score}`;
    })
    .join(', ');
}

function meetsClassRequirement(className: string, abilityScores: Record<AbilityKey, number>) {
  const requirements = dndMulticlassRequirements[normalizeClassCatalogKey(className)];
  if (!requirements) return true;
  return requirements.every((requirement) => {
    const scores = requirement.abilities.map((ability) => abilityScores[ability] ?? 0);
    return requirement.mode === 'any'
      ? scores.some((score) => score >= requirement.score)
      : scores.every((score) => score >= requirement.score);
  });
}

function formatWizardList(values: string[] | undefined) {
  return values && values.length > 0 ? values.join(', ') : 'None listed';
}

function formatWizardSkillChoices(skillChoices: DndClassInfo['skillChoices']) {
  if (!skillChoices) return 'No skill choice data is listed for this class.';
  const choices = Array.isArray(skillChoices.from)
    ? skillChoices.from.join(', ')
    : skillChoices.from;
  return `Choose ${skillChoices.choose ?? '?'} from ${choices ?? 'the listed class skills'}.`;
}

function getFeatureCatalogKey(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function getWizardClassFeatureSchedule({
  classEntry,
  classIndex,
  classInfo,
  featureCatalog,
}: {
  classEntry: CharacterClassForm;
  classIndex: number;
  classInfo?: DndClassInfo;
  featureCatalog: FeatureCatalogEntry[];
}): WizardClassFeature[] {
  const className = asNonEmptyString(classEntry.name) ?? 'Class';
  const selectedSubclass = asNonEmptyString(classEntry.subclass);
  const currentLevel = Math.max(1, parseIntOrFallback(classEntry.level, 1));
  const normalizedClassName = getFeatureCatalogKey(className);
  const normalizedSubclass = getFeatureCatalogKey(selectedSubclass ?? '');
  const baseFeatures: WizardClassFeature[] = [];

  if (classInfo?.hitDie) {
    baseFeatures.push({
      id: `wizard-${classIndex}-hit-points`,
      name: 'Hit Points',
      source: classInfo.className ?? className,
      level: 1,
      available: currentLevel >= 1,
      category: 'Class Setup',
      summary: `Hit Die: ${classInfo.hitDie}. At 1st level, your maximum hit points are based on this class hit die and your Constitution modifier. Later levels add this hit die to your hit dice pool.`,
    });
  }

  if (classInfo) {
    baseFeatures.push({
      id: `wizard-${classIndex}-proficiencies`,
      name: 'Proficiencies',
      source: classInfo.className ?? className,
      level: 1,
      available: currentLevel >= 1,
      category: 'Class Setup',
      summary: [
        `Saving throws: ${formatWizardList(classInfo.savingThrows)}.`,
        `Armor: ${formatWizardList(classInfo.armorProficiencies)}.`,
        `Weapons: ${formatWizardList(classInfo.weaponProficiencies)}.`,
        `Tools: ${formatWizardList(classInfo.toolProficiencies)}.`,
        `Skills: ${formatWizardSkillChoices(classInfo.skillChoices)}`,
      ].join('\n'),
    });
  }

  if (classInfo?.spellcasting) {
    baseFeatures.push({
      id: `wizard-${classIndex}-spellcasting`,
      name: 'Spellcasting',
      source: classInfo.className ?? className,
      level: 1,
      available: currentLevel >= 1,
      category: 'Class Setup',
      summary: formatSpellcasting(classInfo.spellcasting),
    });
  }

  if (classInfo?.classResource) {
    baseFeatures.push({
      id: `wizard-${classIndex}-resource`,
      name: classInfo.classResource.name ?? 'Class Resource',
      source: classInfo.className ?? className,
      level: 1,
      available: currentLevel >= 1,
      category: 'Class Setup',
      summary: [
        classInfo.classResource.ability ? `Ability: ${classInfo.classResource.ability}.` : null,
        classInfo.classResource.resource ? `Resource: ${classInfo.classResource.resource}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  const catalogFeatures = featureCatalog
    .filter((feature) => {
      const featureClassName = getFeatureCatalogKey(feature.className ?? feature.source);
      if (featureClassName !== normalizedClassName) return false;
      const featureSubclass = getFeatureCatalogKey(feature.subclassName);
      if (!featureSubclass) return true;
      return Boolean(normalizedSubclass) && featureSubclass === normalizedSubclass;
    })
    .map((feature) => {
      const level =
        typeof feature.level === 'number' && Number.isFinite(feature.level) ? feature.level : null;
      return {
        id: `wizard-${classIndex}-${feature.metadata?.index ?? normalizeClassCatalogKey(feature.name)}`,
        name: feature.name,
        source: feature.subclassName ?? feature.className ?? feature.source ?? className,
        summary: feature.summary,
        level,
        available: level === null || level <= currentLevel,
        category: feature.category,
      };
    });

  return [...baseFeatures, ...catalogFeatures].sort((a, b) => {
    const levelA = a.level ?? 0;
    const levelB = b.level ?? 0;
    if (levelA !== levelB) return levelA - levelB;
    if (a.available !== b.available) return a.available ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function getCharacterClassFormErrors(form: CharacterForm) {
  const classes = form.classes.map((entry) => ({
    ...entry,
    name: entry.name.trim(),
    level: entry.level.trim(),
  }));
  const errors: string[] = [];
  const namedClasses = classes.filter((entry) => entry.name.length > 0);
  if (namedClasses.length === 0) errors.push('At least one class is required.');

  const levels = namedClasses.map((entry) => parseIntOrFallback(entry.level, 0));
  if (levels.some((level) => level < 1)) errors.push('Every class needs at least 1 level.');
  const totalLevel = levels.reduce((sum, level) => sum + level, 0);
  if (totalLevel > 20) errors.push('Total character level cannot exceed 20.');

  if (namedClasses.length > 1) {
    namedClasses.forEach((entry) => {
      if (!meetsClassRequirement(entry.name, form.abilityScores)) {
        const requirement = formatClassRequirement(entry.name);
        if (requirement) errors.push(`${entry.name} requires ${requirement} to multiclass.`);
      }
    });
  }

  return errors;
}

function CharacterEditDialog({
  open,
  form,
  classOptions,
  classCatalogByName,
  featureCatalog,
  subclassOptionsByClassName,
  spellCatalog,
  availableSpellSlots,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: CharacterForm | null;
  classOptions: string[];
  classCatalogByName: Map<string, DndClassInfo>;
  featureCatalog: FeatureCatalogEntry[];
  subclassOptionsByClassName: Map<string, string[]>;
  spellCatalog: SpellCatalogEntry[];
  availableSpellSlots: DndCharacter['spellcasting']['slots'];
  onChange: (form: CharacterForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [expandedClassIndex, setExpandedClassIndex] = useState(0);
  const [classPanel, setClassPanel] = useState<'features' | 'spells'>('features');
  if (!form) return null;
  const setField = (key: keyof CharacterForm, value: string) => {
    onChange({ ...form, [key]: value });
  };
  const setAbilityScore = (key: AbilityKey, value: string) => {
    onChange({
      ...form,
      abilityScores: {
        ...form.abilityScores,
        [key]: Math.max(1, Math.min(30, parseIntOrFallback(value, form.abilityScores[key]))),
      },
    });
  };
  const updateClass = (index: number, patch: Partial<CharacterClassForm>) => {
    onChange({
      ...form,
      classes: form.classes.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              ...patch,
              ...(patch.name !== undefined ? { subclass: '' } : null),
            }
          : entry,
      ),
    });
  };
  const removeClass = (index: number) => {
    if (form.classes.length <= 1) return;
    onChange({ ...form, classes: form.classes.filter((_, entryIndex) => entryIndex !== index) });
  };
  const addClass = () => {
    const selectedClassNames = new Set(
      form.classes.map((entry) => normalizeClassCatalogKey(entry.name)).filter(Boolean),
    );
    const nextName =
      classOptions.find(
        (className) => !selectedClassNames.has(normalizeClassCatalogKey(className)),
      ) ??
      classOptions[0] ??
      'Fighter';
    onChange({
      ...form,
      classes: [...form.classes, { name: nextName, subclass: '', level: '1' }],
    });
  };
  const addCatalogSpell = (spell: SpellCatalogEntry) => {
    if (!characterCanAddSpellForSlots(spell, availableSpellSlots)) {
      setCatalogOpen(false);
      return;
    }
    const existingNames = new Set(form.spells.map((entry) => entry.name.toLowerCase()));
    if (existingNames.has(spell.name.toLowerCase())) {
      setCatalogOpen(false);
      return;
    }
    onChange({
      ...form,
      spells: [
        ...form.spells,
        {
          id: createEntryId('spell'),
          ...spell,
          prepared: false,
        },
      ],
    });
    setCatalogOpen(false);
  };
  const removeSpellFromWizard = (id: string) => {
    onChange({ ...form, spells: form.spells.filter((spell) => spell.id !== id) });
  };
  const toggleWizardSpellPrepared = (id: string) => {
    onChange({
      ...form,
      spells: form.spells.map((spell) =>
        spell.id === id ? { ...spell, prepared: !spell.prepared } : spell,
      ),
    });
  };
  const resolvedClassOptions = [
    ...new Set(
      [...form.classes.map((entry) => entry.name), ...classOptions].filter(
        (value) => value.trim().length > 0,
      ),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const classErrors = getCharacterClassFormErrors(form);
  const totalLevel = form.classes.reduce(
    (sum, entry) => sum + Math.max(0, parseIntOrFallback(entry.level, 0)),
    0,
  );
  const wizardClassNames = new Set(
    form.classes
      .map((entry) => asNonEmptyString(entry.name)?.toLowerCase() ?? null)
      .filter((name): name is string => name !== null),
  );
  const wizardClassSpellCatalog = spellCatalog.filter((spell) =>
    (Array.isArray(spell.classes) ? spell.classes : [])
      .map((className) => asNonEmptyString(className)?.toLowerCase() ?? null)
      .filter((className): className is string => className !== null)
      .some((className) => wizardClassNames.has(className)),
  );
  const wizardSpellCatalog =
    wizardClassSpellCatalog.length > 0 ? wizardClassSpellCatalog : spellCatalog;
  const wizardSteps = ['Class', 'Background', 'Species', 'Abilities', 'Details', 'Spells'];
  const goPrevious = () => setActiveStep((step) => Math.max(0, step - 1));
  const goNext = () => setActiveStep((step) => Math.min(wizardSteps.length - 1, step + 1));

  return (
    <>
      <Dialog
        fullScreen
        open={open}
        onClose={onCancel}
        PaperProps={{
          sx: {
            bgcolor: dndColors.page,
            color: dndColors.text,
            maxWidth: '100vw',
            overflowX: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            minHeight: '100dvh',
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            bgcolor: dndColors.page,
            maxWidth: '100vw',
            overflowX: 'hidden',
          }}
        >
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              gap={2}
              sx={{
                px: 2.6,
                pt: 'max(22px, env(safe-area-inset-top))',
                pb: 2,
                bgcolor: dndColors.chrome,
                borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
              }}
            >
              <IconButton
                aria-label="Cancel character wizard"
                onClick={onCancel}
                sx={{
                  width: 54,
                  height: 54,
                  bgcolor: '#dce4eb',
                  color: dndColors.page,
                  '&:hover': { bgcolor: '#eef3f7' },
                }}
              >
                <X size={30} />
              </IconButton>
              <Typography sx={{ color: dndColors.text, fontSize: 24, fontWeight: 900 }}>
                Character Builder
              </Typography>
            </Stack>
            <Stack
              direction="row"
              alignItems="stretch"
              sx={{
                bgcolor: '#2f2f2f',
                backgroundImage:
                  'linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.04), rgba(0,0,0,0.35))',
                overflowX: 'auto',
                maxWidth: '100vw',
                minWidth: 0,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {wizardSteps.map((step, index) => (
                <Box
                  key={step}
                  component="button"
                  type="button"
                  onClick={() => setActiveStep(index)}
                  sx={{
                    minWidth: { xs: 136, sm: 160 },
                    px: 1.4,
                    py: 1.6,
                    border: 0,
                    bgcolor: 'transparent',
                    color: index === activeStep ? '#ffffff' : alpha('#ffffff', 0.76),
                    font: 'inherit',
                    fontSize: 18,
                    fontWeight: 850,
                    textTransform: 'uppercase',
                    position: 'relative',
                    cursor: 'pointer',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '30%',
                      right: '30%',
                      bottom: 8,
                      height: 4,
                      bgcolor: index === activeStep ? dndColors.red : 'transparent',
                    },
                  }}
                >
                  {index + 1}. {step}
                </Box>
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              overflowY: 'auto',
              overflowX: 'hidden',
              pb: 12,
              bgcolor: '#f4f4f2',
              color: '#080b0e',
            }}
          >
            <Box sx={{ px: { xs: 2.4, sm: 4 }, py: 2.7 }}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: '#080b0e', fontSize: 22, fontWeight: 950, mb: 0.8 }}>
                  Character Name
                </Typography>
                <Box
                  component="input"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  sx={wizardInputSx}
                />
                <Typography sx={{ mt: 1.2, color: '#212529', fontSize: 15, fontWeight: 850 }}>
                  SHOW SUGGESTIONS
                </Typography>
              </Box>

              {activeStep === 0 ? (
                <Stack spacing={2.3}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1.2}
                    sx={{
                      borderBottom: `1px solid ${alpha('#000000', 0.12)}`,
                      pb: 2,
                      alignItems: { xs: 'flex-start', sm: 'center' },
                    }}
                  >
                    <Typography sx={{ color: '#050607', fontSize: 27, fontWeight: 950 }}>
                      Character Level: {totalLevel}
                    </Typography>
                    <Typography sx={{ color: '#111', fontSize: 21, fontWeight: 500 }}>
                      Milestone Advancement
                    </Typography>
                  </Stack>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    gap={1.4}
                  >
                    <Box>
                      <Typography sx={{ color: '#050607', fontSize: 20, fontWeight: 950 }}>
                        Max Hit Points:{' '}
                        <Box component="span" sx={{ fontWeight: 500 }}>
                          {form.abilityScores.con + totalLevel * 6}
                        </Box>
                      </Typography>
                      <Typography sx={{ color: '#050607', fontSize: 20, fontWeight: 950 }}>
                        Hit Dice:{' '}
                        <Box component="span" sx={{ fontWeight: 500 }}>
                          {form.classes
                            .map((entry) => `${entry.level} ${entry.name || 'class'}`)
                            .join(' + ')}
                        </Box>
                      </Typography>
                    </Box>
                    <Button
                      disabled
                      sx={{
                        minHeight: 46,
                        px: 2.4,
                        bgcolor: dndColors.red,
                        color: '#ffffff',
                        borderRadius: '3px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        alignSelf: { xs: 'flex-start', sm: 'center' },
                      }}
                    >
                      Manage HP
                    </Button>
                  </Stack>
                  {form.classes.map((entry, index) => {
                    const classInfo = classCatalogByName.get(entry.name);
                    const wizardClassFeatures = getWizardClassFeatureSchedule({
                      classEntry: entry,
                      classIndex: index,
                      classInfo,
                      featureCatalog,
                    });
                    const subclassOptions = getSubclassOptionsForClass(
                      entry.name,
                      entry.subclass,
                      subclassOptionsByClassName,
                    );
                    const requirement = formatClassRequirement(entry.name);
                    const requirementMet =
                      form.classes.length <= 1 ||
                      meetsClassRequirement(entry.name, form.abilityScores);
                    return (
                      <Box
                        key={`${index}-${entry.name}`}
                        sx={{
                          borderTop: `1px solid ${alpha('#000000', 0.11)}`,
                          pt: 2,
                        }}
                      >
                        <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 58,
                              height: 58,
                              borderRadius: '4px',
                              bgcolor: dndColors.chrome,
                              display: 'grid',
                              placeItems: 'center',
                              color: '#ffffff',
                              fontSize: 26,
                              fontWeight: 950,
                            }}
                          >
                            {entry.name.slice(0, 1) || '?'}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <ClassSelectField
                              label={index === 0 ? 'Starting Class' : 'Class'}
                              value={entry.name}
                              options={resolvedClassOptions}
                              onChange={(value) => updateClass(index, { name: value })}
                              mode="wizard"
                            />
                            <ClassSelectField
                              label="Subclass"
                              value={entry.subclass}
                              options={subclassOptions}
                              onChange={(value) => updateClass(index, { subclass: value })}
                              mode="wizard"
                            />
                          </Box>
                          <Box sx={{ width: { xs: 72, sm: 92 }, flex: '0 0 auto' }}>
                            <FormField
                              label="Level"
                              value={entry.level}
                              inputMode="numeric"
                              onChange={(value) => updateClass(index, { level: value })}
                            />
                          </Box>
                          <IconButton
                            aria-label={`Remove class ${index + 1}`}
                            disabled={form.classes.length <= 1}
                            onClick={() => removeClass(index)}
                            sx={{
                              color: form.classes.length <= 1 ? '#a8b0b7' : dndColors.red,
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                        {requirement ? (
                          <Typography
                            sx={{
                              color: requirementMet ? '#6d7780' : dndColors.red,
                              fontSize: 12,
                              fontWeight: 850,
                              mt: 1,
                            }}
                          >
                            Multiclass requirement: {requirement}
                          </Typography>
                        ) : null}
                        <Stack direction="row" gap={2} sx={{ mt: 1.6 }}>
                          <Button
                            onClick={() => {
                              setExpandedClassIndex(index);
                              setClassPanel('features');
                            }}
                            sx={wizardSubtabSx(
                              expandedClassIndex === index && classPanel === 'features',
                            )}
                          >
                            Class Features
                          </Button>
                          <Button
                            onClick={() => {
                              setExpandedClassIndex(index);
                              setClassPanel('spells');
                            }}
                            sx={wizardSubtabSx(
                              expandedClassIndex === index && classPanel === 'spells',
                            )}
                          >
                            Spells
                          </Button>
                        </Stack>
                        {expandedClassIndex === index ? (
                          <Stack spacing={1.2} sx={{ mt: 1.4 }}>
                            {classPanel === 'features' ? (
                              <>
                                {wizardClassFeatures.length > 0 ? (
                                  wizardClassFeatures.map((feature) => (
                                    <WizardFeatureCard
                                      key={feature.id}
                                      title={feature.name}
                                      subtitle={[
                                        feature.level ? `Level ${feature.level}` : 'Level varies',
                                        feature.category,
                                        feature.source,
                                      ]
                                        .filter(Boolean)
                                        .join(' • ')}
                                      body={feature.summary}
                                      available={feature.available}
                                    />
                                  ))
                                ) : (
                                  <WizardFeatureCard
                                    title="No class features found"
                                    subtitle={entry.name || 'Class'}
                                    body="No class feature catalog entries are available for this class yet. You can still save the character and add custom features from the Features tab."
                                  />
                                )}
                                {!entry.subclass ? (
                                  <WizardFeatureCard
                                    title="Subclass Features"
                                    subtitle="Choose a subclass to preview subclass features"
                                    body="Once a subclass is selected, matching subclass features from the catalog will appear here alongside the class feature schedule."
                                  />
                                ) : null}
                              </>
                            ) : (
                              <>
                                {form.spells.slice(0, 4).map((spell) => (
                                  <WizardSpellRow
                                    key={spell.id}
                                    spell={spell}
                                    onTogglePrepared={() => toggleWizardSpellPrepared(spell.id)}
                                    onRemove={() => removeSpellFromWizard(spell.id)}
                                  />
                                ))}
                                <Button
                                  startIcon={<AddIcon />}
                                  onClick={() => setCatalogOpen(true)}
                                  sx={wizardLinkButtonSx}
                                >
                                  Add Spells from Catalog
                                </Button>
                              </>
                            )}
                          </Stack>
                        ) : null}
                      </Box>
                    );
                  })}
                  <Button
                    startIcon={<AddIcon />}
                    disabled={totalLevel >= 20}
                    onClick={addClass}
                    sx={wizardLinkButtonSx}
                  >
                    Add Another Class
                  </Button>
                </Stack>
              ) : null}

              {activeStep === 1 ? (
                <WizardTextPane
                  title="Choose Origin: Background"
                  intro="Check your source settings if you can't find the background you want. Expand your library in the Marketplace for more Background options."
                >
                  <FormField
                    label="Background"
                    value={form.background}
                    onChange={(value) => setField('background', value)}
                  />
                  <WizardFeatureCard
                    title="Skill Proficiencies"
                    body="Insight, Religion, or the proficiencies already tracked on your sheet."
                  />
                  <WizardFeatureCard title="Languages" subtitle="Background Language" />
                  <WizardFeatureCard title="Feature" subtitle={form.background || 'Background'} />
                </WizardTextPane>
              ) : null}

              {activeStep === 2 ? (
                <WizardTextPane
                  title={form.species || 'Species'}
                  intro={`${form.species || 'Your species'} traits and story details are tracked here.`}
                >
                  <FormField
                    label="Species"
                    value={form.species}
                    onChange={(value) => setField('species', value)}
                  />
                  <WizardFeatureCard
                    title="Species Traits"
                    body="Ability score increases, movement, senses, and ancestry traits are reflected in the character sheet."
                  />
                  <WizardFeatureCard title="Draconic Ancestry" subtitle="1 Choice" />
                  <WizardFeatureCard title="Breath Weapon" />
                </WizardTextPane>
              ) : null}

              {activeStep === 3 ? (
                <WizardTextPane
                  title="Set Ability Scores"
                  intro="Adjust each score directly. Saving throws and skills recalculate from class data elsewhere on the sheet."
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                      gap: 1.3,
                    }}
                  >
                    {(Object.keys(abilityLabels) as AbilityKey[]).map((key) => (
                      <Box
                        key={key}
                        sx={{
                          border: `1px solid ${alpha('#000000', 0.16)}`,
                          bgcolor: '#ffffff',
                          p: 1.3,
                          boxShadow: `0 2px 8px ${alpha('#000000', 0.08)}`,
                        }}
                      >
                        <Typography sx={{ color: '#6d7780', fontWeight: 950, fontSize: 13 }}>
                          {abilityLabels[key]}
                        </Typography>
                        <Box
                          component="input"
                          value={form.abilityScores[key]}
                          inputMode="numeric"
                          onChange={(event) => setAbilityScore(key, event.target.value)}
                          sx={{ ...wizardInputSx, mt: 0.6, textAlign: 'center', fontWeight: 950 }}
                        />
                      </Box>
                    ))}
                  </Box>
                </WizardTextPane>
              ) : null}

              {activeStep === 4 ? (
                <WizardTextPane
                  title="Character Details"
                  intro="Fine tune combat basics and identity."
                >
                  <FormField
                    label="Alignment"
                    value={form.alignment}
                    onChange={(value) => setField('alignment', value)}
                  />
                  <Stack direction="row" spacing={1}>
                    <FormField
                      label="AC"
                      value={form.armorClass}
                      inputMode="numeric"
                      onChange={(value) => setField('armorClass', value)}
                    />
                    <FormField
                      label="Init"
                      value={form.initiative}
                      inputMode="numeric"
                      onChange={(value) => setField('initiative', value)}
                    />
                    <FormField
                      label="Speed"
                      value={form.speed}
                      inputMode="numeric"
                      onChange={(value) => setField('speed', value)}
                    />
                  </Stack>
                  <FormField
                    label="Proficiency Bonus"
                    value={form.proficiencyBonus}
                    inputMode="numeric"
                    onChange={(value) => setField('proficiencyBonus', value)}
                  />
                </WizardTextPane>
              ) : null}

              {activeStep === 5 ? (
                <WizardTextPane
                  title="Add Spells"
                  intro="Choose spells from the catalog, then mark whether each spell is prepared or in the book."
                >
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => setCatalogOpen(true)}
                    sx={{ ...wizardLinkButtonSx, alignSelf: 'flex-start' }}
                  >
                    Add Spells from Catalog
                  </Button>
                  <Stack spacing={1.2}>
                    {form.spells.map((spell) => (
                      <WizardSpellRow
                        key={spell.id}
                        spell={spell}
                        onTogglePrepared={() => toggleWizardSpellPrepared(spell.id)}
                        onRemove={() => removeSpellFromWizard(spell.id)}
                      />
                    ))}
                  </Stack>
                </WizardTextPane>
              ) : null}

              {classErrors.length > 0 ? (
                <Stack spacing={0.35} sx={{ mt: 2 }}>
                  {classErrors.map((error) => (
                    <Typography
                      key={error}
                      sx={{ color: dndColors.red, fontSize: 13, fontWeight: 900 }}
                    >
                      {error}
                    </Typography>
                  ))}
                </Stack>
              ) : null}
            </Box>
          </Box>

          <Stack
            direction="row"
            sx={{
              position: 'sticky',
              bottom: 0,
              height: 78,
              bgcolor: '#2e2e2e',
              borderTop: `1px solid ${alpha('#ffffff', 0.12)}`,
              zIndex: 2,
              pb: 'env(safe-area-inset-bottom)',
            }}
          >
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', pl: 2.7 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: dndColors.redDark,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ffffff',
                  fontSize: 26,
                  fontWeight: 950,
                }}
              >
                {activeStep + 1}
              </Box>
            </Box>
            <Button onClick={goPrevious} disabled={activeStep === 0} sx={wizardFooterButtonSx}>
              &lt; Prev
            </Button>
            {activeStep === wizardSteps.length - 1 ? (
              <Button onClick={onSave} disabled={classErrors.length > 0} sx={wizardFooterButtonSx}>
                Save
              </Button>
            ) : (
              <Button onClick={goNext} sx={wizardFooterButtonSx}>
                Next &gt;
              </Button>
            )}
          </Stack>
        </Box>
      </Dialog>
      <SpellCatalogDialog
        open={catalogOpen}
        spells={wizardSpellCatalog}
        selectedName=""
        onSelect={addCatalogSpell}
        canSelectSpell={(spell) => characterCanAddSpellForSlots(spell, availableSpellSlots)}
        onClose={() => setCatalogOpen(false)}
      />
    </>
  );
}

const wizardInputSx = {
  width: '100%',
  minHeight: 54,
  border: `1px solid ${alpha('#000000', 0.16)}`,
  borderRadius: '3px',
  bgcolor: '#ffffff',
  color: '#050607',
  px: 1.4,
  font: 'inherit',
  fontSize: 22,
  outline: 'none',
  boxShadow: `inset 0 1px 4px ${alpha('#000000', 0.09)}`,
  '&:focus': {
    borderColor: dndColors.red,
    boxShadow: `0 0 0 2px ${alpha(dndColors.red, 0.18)}`,
  },
};

const wizardLinkButtonSx = {
  color: dndColors.red,
  fontSize: 18,
  fontWeight: 850,
  justifyContent: 'flex-start',
  textTransform: 'none',
  '&:hover': { bgcolor: alpha(dndColors.red, 0.08) },
};

const wizardFooterButtonSx = {
  minWidth: 128,
  height: '100%',
  borderLeft: `1px solid ${alpha('#ffffff', 0.14)}`,
  borderRadius: 0,
  color: '#ffffff',
  fontSize: 19,
  fontWeight: 950,
  textTransform: 'uppercase',
  '&.Mui-disabled': { color: alpha('#ffffff', 0.32) },
};

function wizardSubtabSx(active: boolean) {
  return {
    color: active ? '#050607' : '#7b858e',
    borderRadius: 0,
    borderBottom: `4px solid ${active ? dndColors.green : 'transparent'}`,
    fontSize: 18,
    fontWeight: 950,
    textTransform: 'uppercase',
    px: 0,
    '&:hover': { bgcolor: 'transparent', color: '#050607' },
  };
}

function WizardTextPane({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <Stack spacing={2.2}>
      <Box sx={{ textAlign: 'center', py: 1.8 }}>
        <Typography sx={{ color: '#050607', fontSize: 32, fontWeight: 500 }}>{title}</Typography>
      </Box>
      <Typography sx={{ color: '#111', fontSize: 22, lineHeight: 1.45 }}>{intro}</Typography>
      {children}
    </Stack>
  );
}

function WizardFeatureCard({
  title,
  subtitle,
  body,
  available = true,
}: {
  title: string;
  subtitle?: string;
  body?: string;
  available?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        color: '#050607',
        border: `1px solid ${alpha('#000000', 0.13)}`,
        boxShadow: `0 2px 10px ${alpha('#000000', 0.1)}`,
        opacity: available ? 1 : 0.54,
      }}
    >
      <Stack
        component="button"
        type="button"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        sx={{
          width: '100%',
          p: 1.8,
          border: 0,
          bgcolor: 'transparent',
          color: 'inherit',
          font: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
          '&:focus-visible': {
            outline: `2px solid ${dndColors.red}`,
            outlineOffset: -2,
          },
        }}
      >
        <Box>
          <Typography sx={{ color: '#050607', fontSize: 22, fontWeight: 850 }}>{title}</Typography>
          {subtitle ? (
            <Typography sx={{ color: '#7b858e', fontSize: 17, fontWeight: 650 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Typography
          sx={{
            color: '#9aa3aa',
            fontSize: 34,
            lineHeight: 1,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 160ms ease',
          }}
        >
          ⌄
        </Typography>
      </Stack>
      {expanded ? (
        <Typography
          sx={{
            px: 1.8,
            pb: 1.8,
            color: '#111',
            fontSize: 17,
            lineHeight: 1.45,
            whiteSpace: 'pre-line',
          }}
        >
          {body || 'No additional details have been recorded for this feature yet.'}
        </Typography>
      ) : null}
    </Box>
  );
}

function WizardSpellRow({
  spell,
  onTogglePrepared,
  onRemove,
}: {
  spell: Spell;
  onTogglePrepared: () => void;
  onRemove: () => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.4}
      sx={{
        bgcolor: '#ffffff',
        color: '#050607',
        border: `1px solid ${alpha('#000000', 0.13)}`,
        boxShadow: `0 2px 10px ${alpha('#000000', 0.1)}`,
        p: 1.3,
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
    >
      <SpellSchoolIcon school={spell.school} size={52} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color: '#050607',
            fontSize: 21,
            fontStyle: 'italic',
            fontWeight: 850,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {spell.name}
        </Typography>
        <Typography sx={{ color: '#7b858e', fontSize: 16, fontWeight: 650 }}>
          {getSpellCatalogSubtitle(spell)}
        </Typography>
      </Box>
      <Button
        onClick={onTogglePrepared}
        sx={{ ...toggleButtonSx(Boolean(spell.prepared)), minWidth: 70 }}
      >
        {spell.prepared ? 'Prep' : 'Book'}
      </Button>
      <IconButton
        aria-label={`Remove ${spell.name}`}
        onClick={onRemove}
        sx={{ color: dndColors.red }}
      >
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
}

function ClassSelectField({
  label,
  value,
  options,
  onChange,
  mode = 'default',
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  mode?: 'default' | 'wizard';
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          color: mode === 'wizard' ? '#7b858e' : dndColors.muted,
          fontSize: mode === 'wizard' ? 13 : 12,
          fontWeight: 900,
          mb: 0.5,
          textTransform: mode === 'wizard' ? 'uppercase' : 'none',
        }}
      >
        {label}
      </Typography>
      <Box
        component="select"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          width: '100%',
          minHeight: mode === 'wizard' ? 46 : 40,
          border: `1px solid ${mode === 'wizard' ? alpha('#000000', 0.16) : dndColors.border}`,
          borderRadius: mode === 'wizard' ? '3px' : '8px',
          bgcolor: mode === 'wizard' ? '#ffffff' : dndColors.panelStrong,
          color: mode === 'wizard' ? '#050607' : dndColors.text,
          px: 1,
          font: 'inherit',
          fontSize: mode === 'wizard' ? 20 : undefined,
          fontWeight: 800,
          outline: 'none',
          boxShadow: mode === 'wizard' ? `inset 0 1px 4px ${alpha('#000000', 0.09)}` : 'none',
          '&:focus-visible': {
            borderColor: mode === 'wizard' ? dndColors.red : dndColors.blue,
            boxShadow: `0 0 0 2px ${alpha(mode === 'wizard' ? dndColors.red : dndColors.blue, 0.22)}`,
          },
          '& option': {
            color: '#11191e',
            backgroundColor: '#ffffff',
          },
        }}
      >
        {options.map((option) => (
          <option key={option || 'none'} value={option}>
            {option || 'None'}
          </option>
        ))}
      </Box>
    </Box>
  );
}

function CharacterBuilderDialog({
  open,
  form,
  classOptions,
  onChange,
  onCancel,
  onCreate,
}: {
  open: boolean;
  form: CharacterBuilderForm | null;
  classOptions: string[];
  onChange: (form: CharacterBuilderForm) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof CharacterBuilderForm, value: string) =>
    onChange({ ...form, [key]: value });
  const resolvedClassOptions =
    classOptions.length > 0 ? classOptions : [form.className || 'Fighter'];
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>Guided Character Creation</DialogTitle>
      <DialogContent>
        <Stack spacing={1.2} sx={{ pt: 0.5 }}>
          <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
          <Stack direction="row" spacing={1}>
            <FormField
              label="Species"
              value={form.species}
              onChange={(value) => setField('species', value)}
            />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900, mb: 0.4 }}>
                CLASS
              </Typography>
              <Box
                component="select"
                value={form.className}
                onChange={(event) => setField('className', event.target.value)}
                sx={{
                  width: '100%',
                  minHeight: 42,
                  border: `1px solid ${dndColors.border}`,
                  borderRadius: '6px',
                  bgcolor: dndColors.panelStrong,
                  color: dndColors.text,
                  px: 1,
                  font: 'inherit',
                  fontWeight: 800,
                }}
              >
                {resolvedClassOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </Box>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <FormField
              label="Background"
              value={form.background}
              onChange={(value) => setField('background', value)}
            />
            <FormField
              label="Alignment"
              value={form.alignment}
              onChange={(value) => setField('alignment', value)}
            />
          </Stack>
          <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>
            Ability Scores
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {abilityKeys.map((ability) => (
              <FormField
                key={ability}
                label={ability.toUpperCase()}
                value={form[ability]}
                inputMode="numeric"
                onChange={(value) => setField(ability, value)}
              />
            ))}
          </Box>
          <MultilineFormField
            label="Proficiencies"
            value={form.proficiencies}
            minRows={3}
            onChange={(value) => setField('proficiencies', value)}
          />
          <MultilineFormField
            label="Equipment"
            value={form.equipment}
            minRows={3}
            onChange={(value) => setField('equipment', value)}
          />
          <MultilineFormField
            label="Spells"
            value={form.spells}
            minRows={3}
            onChange={(value) => setField('spells', value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: dndColors.text }}>
          Cancel
        </Button>
        <Button
          onClick={onCreate}
          variant="contained"
          sx={{ bgcolor: dndColors.red, '&:hover': { bgcolor: dndColors.redDark } }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type HitPointForm = {
  current: string;
  max: string;
  temp: string;
  hitDice: string;
  deathSuccesses: string;
  deathFailures: string;
};

function createHitPointForm(character: DndCharacter): HitPointForm {
  return {
    current: String(character.hitPoints.current),
    max: String(character.hitPoints.max),
    temp: String(character.hitPoints.temp),
    hitDice: character.hitPoints.hitDice,
    deathSuccesses: String(character.hitPoints.deathSaves.successes),
    deathFailures: String(character.hitPoints.deathSaves.failures),
  };
}

function HitPointEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: HitPointForm | null;
  onChange: (form: HitPointForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [amount, setAmount] = useState(0);
  useEffect(() => {
    if (open) setAmount(0);
  }, [open]);
  if (!form) return null;
  const setField = (key: keyof HitPointForm, value: string) => onChange({ ...form, [key]: value });
  const current = Math.max(0, parseIntOrFallback(form.current, 0));
  const max = Math.max(1, parseIntOrFallback(form.max, 1));
  const temp = Math.max(0, parseIntOrFallback(form.temp, 0));
  const setAmountFromText = (value: string) => {
    const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
    setAmount(Number.isNaN(parsed) ? 0 : Math.min(Math.max(max, 30), parsed));
  };
  const applyDelta = (direction: 1 | -1) => {
    if (direction === 1) {
      const next = Math.max(0, Math.min(max, current + amount));
      setField('current', String(next));
      return;
    }
    const absorbedByTemp = Math.min(temp, amount);
    const remainingDamage = amount - absorbedByTemp;
    onChange({
      ...form,
      temp: String(temp - absorbedByTemp),
      current: String(Math.max(0, current - remainingDamage)),
    });
  };
  const setDeathSave = (key: 'deathSuccesses' | 'deathFailures', next: number) => {
    setField(key, String(Math.max(0, Math.min(3, next))));
  };
  const wheelMax = Math.max(max, 30);
  const pickerTopOffset = 18;
  const pickerHeight = 174;
  return (
    <DndEditDialog
      title="Edit Hit Points"
      open={open}
      onCancel={onCancel}
      onSave={onSave}
      hideTitle
    >
      <Stack alignItems="center" sx={{ mb: 1 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: dndColors.muted,
          }}
        >
          Hit Points
        </Typography>
        <Typography sx={{ fontSize: 34, fontWeight: 900, color: dndColors.blue, lineHeight: 1.1 }}>
          {current}
          <Typography
            component="span"
            sx={{ color: dndColors.muted, fontSize: 19, fontWeight: 800 }}
          >
            {' / '}
            {max}
          </Typography>
        </Typography>
        <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 800 }}>
          {temp} temporary
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 108px',
          gap: 1,
          alignItems: 'stretch',
        }}
      >
        <Stack spacing={0.8}>
          <Stack direction="row" spacing={1}>
            <FormField
              label="Max"
              value={form.max}
              inputMode="numeric"
              onChange={(value) => setField('max', value)}
            />
            <FormField
              label="Temp"
              value={form.temp}
              inputMode="numeric"
              onChange={(value) => setField('temp', value)}
            />
          </Stack>
          <Button
            onClick={() => applyDelta(1)}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: dndColors.green,
              color: '#ffffff',
              fontWeight: 900,
              textTransform: 'none',
              '&:hover': { bgcolor: dndColors.green },
            }}
          >
            Heal
          </Button>
          <InputBase
            value={String(amount)}
            inputProps={{
              inputMode: 'numeric',
              style: { textAlign: 'center', fontWeight: 900, fontSize: 18, padding: 0 },
            }}
            onChange={(event) => setAmountFromText(event.target.value)}
            sx={{
              border: `1px solid ${dndColors.border}`,
              borderRadius: '8px',
              bgcolor: dndColors.panelStrong,
              height: 40,
              color: dndColors.text,
            }}
          />
          <Button
            onClick={() => applyDelta(-1)}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: dndColors.red,
              color: '#ffffff',
              fontWeight: 900,
              textTransform: 'none',
              '&:hover': { bgcolor: dndColors.redDark },
            }}
          >
            Damage
          </Button>
        </Stack>

        <Box
          sx={{
            mt: `${pickerTopOffset}px`,
            height: pickerHeight,
            maxHeight: pickerHeight,
            overflowY: 'auto',
            border: `1px solid ${dndColors.border}`,
            borderRadius: '12px',
            bgcolor: dndColors.panelStrong,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {Array.from({ length: wheelMax + 1 }, (_, value) => (
            <Button
              key={value}
              onClick={() => setAmount(value)}
              fullWidth
              sx={{
                minHeight: 32,
                color: value === amount ? dndColors.blue : dndColors.muted,
                bgcolor: value === amount ? alpha(dndColors.blue, 0.14) : 'transparent',
                fontWeight: value === amount ? 900 : 700,
                borderRadius: 0,
                '&:hover': { bgcolor: alpha(dndColors.blue, 0.18) },
              }}
            >
              {value}
            </Button>
          ))}
        </Box>
      </Box>

      <FormField
        label="Current"
        value={form.current}
        inputMode="numeric"
        onChange={(value) => setField('current', value)}
      />
      <FormField
        label="Hit Dice"
        value={form.hitDice}
        onChange={(value) => setField('hitDice', value)}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 0.4 }}>
        <DeathSaveTrack
          label="Successes"
          value={parseIntOrFallback(form.deathSuccesses, 0)}
          color={dndColors.green}
          onChange={(next) => setDeathSave('deathSuccesses', next)}
        />
        <DeathSaveTrack
          label="Failures"
          value={parseIntOrFallback(form.deathFailures, 0)}
          color={dndColors.red}
          onChange={(next) => setDeathSave('deathFailures', next)}
        />
      </Stack>
    </DndEditDialog>
  );
}

function DeathSaveTrack({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (next: number) => void;
}) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900, mb: 0.6 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.7}>
        {[1, 2, 3].map((mark) => {
          const active = mark <= value;
          return (
            <Box
              key={mark}
              component="button"
              type="button"
              aria-label={`${label} ${mark}`}
              aria-pressed={active}
              onClick={() => onChange(value === mark ? mark - 1 : mark)}
              style={{ appearance: 'none' }}
              sx={{
                width: 31,
                height: 31,
                borderRadius: '50%',
                border: `2px solid ${active ? color : dndColors.border}`,
                bgcolor: active ? color : 'transparent',
                cursor: 'pointer',
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

type AbilityForm = {
  abilities: Array<{
    key: AbilityScore['key'];
    label: string;
    score: string;
    saveBonus: string;
    proficientSave: boolean;
  }>;
  passivePerception: string;
  passiveInvestigation: string;
  passiveInsight: string;
};

function createAbilityForm(character: DndCharacter): AbilityForm {
  return {
    abilities: character.abilities.map((ability) => ({
      key: ability.key,
      label: ability.label,
      score: String(ability.score),
      saveBonus: String(ability.saveBonus),
      proficientSave: ability.proficientSave,
    })),
    passivePerception: String(character.passivePerception),
    passiveInvestigation: String(character.passiveInvestigation),
    passiveInsight: String(character.passiveInsight),
  };
}

function AbilityEditDialog({
  open,
  form,
  skills,
  proficiencyBonus,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: AbilityForm | null;
  skills: Skill[];
  proficiencyBonus: number;
  onChange: (form: AbilityForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const updateAbility = (index: number, next: Partial<AbilityForm['abilities'][number]>) => {
    onChange({
      ...form,
      abilities: form.abilities.map((ability, abilityIndex) =>
        abilityIndex === index ? { ...ability, ...next } : ability,
      ),
    });
  };
  const abilityScoreByKey = new Map(
    form.abilities.map((ability) => [ability.key, parseIntOrFallback(ability.score, 10)]),
  );
  const derivedSkillBonus = (name: string) => {
    const skill = skills.find((entry) => entry.name === name);
    if (!skill) return 10;
    return (
      10 +
      skillBonusFor({
        abilityScore: abilityScoreByKey.get(skill.ability) ?? 10,
        proficiencyBonus,
        proficient: skill.proficient,
        expertise: Boolean(skill.expertise),
      })
    );
  };
  const recalculate = () => {
    onChange({
      ...form,
      abilities: form.abilities.map((ability) => ({
        ...ability,
        saveBonus: String(
          abilityModifier(parseIntOrFallback(ability.score, 10)) +
            (ability.proficientSave ? proficiencyBonus : 0),
        ),
      })),
      passivePerception: String(derivedSkillBonus('Perception')),
      passiveInvestigation: String(derivedSkillBonus('Investigation')),
      passiveInsight: String(derivedSkillBonus('Insight')),
    });
  };

  return (
    <DndEditDialog title="Edit Abilities" open={open} onCancel={onCancel} onSave={onSave}>
      <Button onClick={recalculate} sx={{ ...inlineEditButtonSx, alignSelf: 'flex-start' }}>
        Recalculate Saves & Passives
      </Button>
      {form.abilities.map((ability, index) => (
        <Box
          key={ability.key}
          sx={{
            p: 1,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '7px',
            bgcolor: dndColors.panel,
          }}
        >
          <Typography sx={{ color: dndColors.text, fontWeight: 900, mb: 0.8 }}>
            {ability.label}
          </Typography>
          <Stack direction="row" spacing={1}>
            <FormField
              label="Score"
              value={ability.score}
              inputMode="numeric"
              onChange={(value) => updateAbility(index, { score: value })}
            />
            <FormField
              label="Save"
              value={ability.saveBonus}
              inputMode="numeric"
              onChange={(value) => updateAbility(index, { saveBonus: value })}
            />
          </Stack>
          <Button
            onClick={() => updateAbility(index, { proficientSave: !ability.proficientSave })}
            sx={{ ...toggleButtonSx(ability.proficientSave), mt: 1 }}
          >
            {ability.proficientSave ? 'Save Proficient' : 'Save Not Proficient'}
          </Button>
        </Box>
      ))}
      <Stack direction="row" spacing={1}>
        <FormField
          label="Passive Perception"
          value={form.passivePerception}
          inputMode="numeric"
          onChange={(value) => onChange({ ...form, passivePerception: value })}
        />
        <FormField
          label="Passive Investigation"
          value={form.passiveInvestigation}
          inputMode="numeric"
          onChange={(value) => onChange({ ...form, passiveInvestigation: value })}
        />
      </Stack>
      <FormField
        label="Passive Insight"
        value={form.passiveInsight}
        inputMode="numeric"
        onChange={(value) => onChange({ ...form, passiveInsight: value })}
      />
    </DndEditDialog>
  );
}

type SkillForm = Array<{
  name: string;
  ability: Skill['ability'];
  bonus: string;
  proficient: boolean;
  expertise: boolean;
}>;

function createSkillForm(character: DndCharacter): SkillForm {
  return character.skills.map((skill) => ({
    name: skill.name,
    ability: skill.ability,
    bonus: String(skill.bonus),
    proficient: skill.proficient,
    expertise: Boolean(skill.expertise),
  }));
}

function SkillEditDialog({
  open,
  form,
  abilities,
  proficiencyBonus,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: SkillForm | null;
  abilities: AbilityScore[];
  proficiencyBonus: number;
  onChange: (form: SkillForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const updateSkill = (index: number, next: Partial<SkillForm[number]>) => {
    onChange(
      form.map((skill, skillIndex) => (skillIndex === index ? { ...skill, ...next } : skill)),
    );
  };
  const abilityScoreByKey = new Map(abilities.map((ability) => [ability.key, ability.score]));
  const recalculate = () => {
    onChange(
      form.map((skill) => ({
        ...skill,
        bonus: String(
          skillBonusFor({
            abilityScore: abilityScoreByKey.get(skill.ability) ?? 10,
            proficiencyBonus,
            proficient: skill.proficient,
            expertise: skill.expertise,
          }),
        ),
      })),
    );
  };

  return (
    <DndEditDialog title="Edit Skills" open={open} onCancel={onCancel} onSave={onSave}>
      <Button onClick={recalculate} sx={{ ...inlineEditButtonSx, alignSelf: 'flex-start' }}>
        Recalculate Skill Bonuses
      </Button>
      {form.map((skill, index) => (
        <Box
          key={skill.name}
          sx={{
            p: 1,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '7px',
            bgcolor: dndColors.panel,
          }}
        >
          <Typography sx={{ color: dndColors.text, fontWeight: 900, mb: 0.8 }}>
            {skill.name}
          </Typography>
          <Stack spacing={1}>
            <Box>
              <Typography
                sx={{
                  color: dndColors.muted,
                  fontSize: 11,
                  fontWeight: 900,
                  mb: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                Ability
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.6}>
                {abilityKeys.map((ability) => (
                  <Button
                    key={ability}
                    onClick={() => updateSkill(index, { ability })}
                    sx={{
                      ...toggleButtonSx(skill.ability === ability),
                      minWidth: 48,
                      minHeight: 34,
                      fontSize: 12,
                    }}
                  >
                    {ability.toUpperCase()}
                  </Button>
                ))}
              </Stack>
            </Box>
            <FormField
              label="Bonus"
              value={skill.bonus}
              inputMode="numeric"
              onChange={(value) => updateSkill(index, { bonus: value })}
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              onClick={() => updateSkill(index, { proficient: !skill.proficient })}
              sx={toggleButtonSx(skill.proficient)}
            >
              {skill.proficient ? 'Proficient' : 'Not Proficient'}
            </Button>
            <Button
              onClick={() => updateSkill(index, { expertise: !skill.expertise })}
              sx={toggleButtonSx(skill.expertise)}
            >
              {skill.expertise ? 'Expertise' : 'No Expertise'}
            </Button>
          </Stack>
        </Box>
      ))}
    </DndEditDialog>
  );
}

type BackgroundForm = {
  background: string;
  alignment: string;
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
};

type ProficiencyForm = {
  proficiencies: string;
  languages: string;
};

function joinListForEditing(values: string[]) {
  return values.join('\n');
}

function parseEditableList(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry || seen.has(entry.toLowerCase())) return false;
      seen.add(entry.toLowerCase());
      return true;
    });
}

function createProficiencyForm(character: DndCharacter): ProficiencyForm {
  return {
    proficiencies: joinListForEditing(character.proficiencies),
    languages: joinListForEditing(character.languages),
  };
}

function createBackgroundForm(character: DndCharacter): BackgroundForm {
  return {
    background: character.background,
    alignment: character.alignment,
    traits: character.personality.traits,
    ideals: character.personality.ideals,
    bonds: character.personality.bonds,
    flaws: character.personality.flaws,
    backstory: character.personality.backstory,
  };
}

function ProficiencyEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: ProficiencyForm | null;
  onChange: (form: ProficiencyForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof ProficiencyForm, value: string) =>
    onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Proficiencies" open={open} onCancel={onCancel} onSave={onSave}>
      <MultilineFormField
        label="Proficiencies"
        value={form.proficiencies}
        minRows={6}
        onChange={(value) => setField('proficiencies', value)}
      />
      <MultilineFormField
        label="Languages"
        value={form.languages}
        minRows={4}
        onChange={(value) => setField('languages', value)}
      />
      <Typography sx={{ color: dndColors.muted, fontSize: 12, lineHeight: 1.4 }}>
        Enter one item per line, or separate entries with commas.
      </Typography>
    </DndEditDialog>
  );
}

function BackgroundEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: BackgroundForm | null;
  onChange: (form: BackgroundForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof BackgroundForm, value: string) =>
    onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Background" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField
        label="Background"
        value={form.background}
        onChange={(value) => setField('background', value)}
      />
      <FormField
        label="Alignment"
        value={form.alignment}
        onChange={(value) => setField('alignment', value)}
      />
      <MultilineFormField
        label="Personality Traits"
        value={form.traits}
        onChange={(value) => setField('traits', value)}
      />
      <MultilineFormField
        label="Ideals"
        value={form.ideals}
        onChange={(value) => setField('ideals', value)}
      />
      <MultilineFormField
        label="Bonds"
        value={form.bonds}
        onChange={(value) => setField('bonds', value)}
      />
      <MultilineFormField
        label="Flaws"
        value={form.flaws}
        onChange={(value) => setField('flaws', value)}
      />
      <MultilineFormField
        label="Backstory"
        value={form.backstory}
        minRows={4}
        onChange={(value) => setField('backstory', value)}
      />
    </DndEditDialog>
  );
}

type NoteForm = DndCharacter['notes'][number];

function NoteEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: NoteForm | null;
  onChange: (form: NoteForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  return (
    <DndEditDialog title="Edit Note" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField
        label="Title"
        value={form.title}
        onChange={(title) => onChange({ ...form, title })}
      />
      <MultilineFormField
        label="Body"
        value={form.body}
        minRows={6}
        onChange={(body) => onChange({ ...form, body })}
      />
    </DndEditDialog>
  );
}

type MoneyForm = Record<keyof Money, string>;

function createMoneyForm(money: Money): MoneyForm {
  return {
    cp: String(money.cp),
    sp: String(money.sp),
    ep: String(money.ep),
    gp: String(money.gp),
    pp: String(money.pp),
  };
}

function MoneyEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: MoneyForm | null;
  onChange: (form: MoneyForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof MoneyForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Money" open={open} onCancel={onCancel} onSave={onSave}>
      <Stack direction="row" spacing={1}>
        <FormField
          label="CP"
          value={form.cp}
          inputMode="numeric"
          onChange={(value) => setField('cp', value)}
        />
        <FormField
          label="SP"
          value={form.sp}
          inputMode="numeric"
          onChange={(value) => setField('sp', value)}
        />
        <FormField
          label="EP"
          value={form.ep}
          inputMode="numeric"
          onChange={(value) => setField('ep', value)}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        <FormField
          label="GP"
          value={form.gp}
          inputMode="numeric"
          onChange={(value) => setField('gp', value)}
        />
        <FormField
          label="PP"
          value={form.pp}
          inputMode="numeric"
          onChange={(value) => setField('pp', value)}
        />
      </Stack>
    </DndEditDialog>
  );
}

type AttackForm = Attack;
type SpellForm = Spell;
type ItemForm = InventoryItem;
type FeatureForm = Feature;
type FeatForm = Feat;
type SpellcastingForm = {
  ability: string;
  saveDc: string;
  attackBonus: string;
  slots: string;
};

const MAX_SPELL_SLOTS_PER_LEVEL = 20;

const spellSchoolStyles: Record<string, { bg: string; fg: string; stroke: string; glow: string }> =
  {
    abjuration: { bg: '#d7f2ff', fg: '#132835', stroke: '#264657', glow: '#8edaff' },
    conjuration: { bg: '#ffd774', fg: '#2c1c08', stroke: '#463313', glow: '#ffbd3d' },
    divination: { bg: '#dff4ff', fg: '#26313d', stroke: '#384757', glow: '#aae4ff' },
    enchantment: { bg: '#f4a4e9', fg: '#241326', stroke: '#482446', glow: '#f9b7ff' },
    evocation: { bg: '#f27d6f', fg: '#201211', stroke: '#3e1713', glow: '#ff9c8d' },
    illusion: { bg: '#c29aff', fg: '#1f1233', stroke: '#3b2460', glow: '#d7b6ff' },
    necromancy: { bg: '#bcf279', fg: '#13210c', stroke: '#274314', glow: '#d9ff9d' },
    transmutation: { bg: '#f2b36f', fg: '#241408', stroke: '#4a2a12', glow: '#ffd092' },
    arcane: { bg: '#c7d6e8', fg: '#1b2432', stroke: '#33465c', glow: '#9fbde0' },
  };

function getSpellSchoolStyle(school?: string) {
  return spellSchoolStyles[(school ?? '').trim().toLowerCase()] ?? spellSchoolStyles.abjuration;
}

function SpellSchoolIcon({ school, size = 70 }: { school?: string; size?: number }) {
  const style = getSpellSchoolStyle(school);
  const normalized = (school ?? '').trim().toLowerCase();
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: '7px',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: style.bg,
        border: `1px solid ${alpha('#ffffff', 0.38)}`,
        boxShadow: `inset 0 0 0 1px ${alpha('#000000', 0.12)}, 0 0 16px ${alpha(style.glow, 0.34)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 26% 18%, rgba(255,255,255,0.9), transparent 18%), radial-gradient(circle at 76% 76%, rgba(255,255,255,0.34), transparent 25%), linear-gradient(135deg, rgba(255,255,255,0.24), rgba(0,0,0,0.12))',
        },
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 64 64"
        aria-hidden
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'block',
          width: '100%',
          height: '100%',
          p: 1,
          color: style.fg,
          stroke: style.stroke,
          fill: 'none',
          strokeWidth: 4.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          filter: `drop-shadow(0 1px 0 ${alpha('#ffffff', 0.28)})`,
        }}
      >
        {normalized === 'necromancy' ? (
          <>
            <path d="M12 36c8 12 16 12 24 0s16-12 20 0" />
            <path d="M12 36c8-12 16-12 24 0s16 12 20 0" />
          </>
        ) : normalized === 'abjuration' ? (
          <>
            <path d="M20 12c7 11 7 29 0 40" />
            <path d="M32 9c-2 11-2 35 0 46" />
            <path d="M44 12c-7 11-7 29 0 40" />
          </>
        ) : normalized === 'transmutation' ? (
          <>
            <path d="M13 18h36" />
            <path d="M21 18v30" />
            <path d="M43 18v30" />
            <path d="M30 48c6-7 11-13 18-15" />
          </>
        ) : normalized === 'evocation' ? (
          <>
            <circle cx="32" cy="32" r="16" />
            <path d="M32 10v10M32 44v10M10 32h10M44 32h10M16 16l8 8M40 40l8 8M48 16l-8 8M24 40l-8 8" />
          </>
        ) : normalized === 'conjuration' ? (
          <>
            <path d="M32 10l16 43-16-12-16 12 16-43z" />
            <path d="M22 38h20" />
          </>
        ) : normalized === 'illusion' ? (
          <>
            <path d="M10 32c9-12 35-12 44 0-9 12-35 12-44 0z" />
            <circle cx="32" cy="32" r="7" fill="currentColor" stroke="none" />
            <path d="M17 20c4-5 10-8 17-8" />
          </>
        ) : normalized === 'enchantment' ? (
          <>
            <path d="M21 12c8 13 8 27 0 40" />
            <path d="M41 12c-8 13-8 27 0 40" />
            <path d="M16 25c10-5 22-5 32 0" />
            <path d="M16 39c10 5 22 5 32 0" />
          </>
        ) : (
          <>
            <path d="M32 10v44" />
            <path d="M20 18c8 5 16 5 24 0" />
            <path d="M18 46c9-8 19-8 28 0" />
          </>
        )}
      </Box>
    </Box>
  );
}

function getSpellCatalogSubtitle(spell: SpellCatalogEntry) {
  const level = getSpellSlotLevel(spell.level) ? spell.level : `${spell.school} Cantrip`;
  return getSpellSlotLevel(spell.level) ? `${level} ${spell.school}` : level;
}

function isLegacySpell(spell: SpellCatalogEntry) {
  return /2014|legacy/iu.test(`${spell.source ?? ''} ${spell.category ?? ''}`);
}

function createSpellcastingForm(character: DndCharacter): SpellcastingForm {
  return {
    ability: character.spellcasting.ability,
    saveDc: String(character.spellcasting.saveDc),
    attackBonus: String(character.spellcasting.attackBonus),
    slots: character.spellcasting.slots.map((slot) => `${slot.level}: ${slot.max}`).join('\n'),
  };
}

function parseSpellSlots(value: string, currentSlots: DndCharacter['spellcasting']['slots']) {
  const currentByLevel = new Map(currentSlots.map((slot) => [slot.level.toLowerCase(), slot]));
  const seen = new Set<string>();
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawLevel, rawMax] = line.split(/[:,-]/, 2);
      const level = rawLevel?.trim();
      const normalizedLevel = level?.toLowerCase();
      const max = Number.parseInt(rawMax?.replace(/[^0-9]/g, '') ?? '', 10);
      if (!level || !normalizedLevel || seen.has(normalizedLevel) || Number.isNaN(max) || max < 0)
        return null;
      seen.add(normalizedLevel);
      const clampedMax = Math.min(max, MAX_SPELL_SLOTS_PER_LEVEL);
      const current = currentByLevel.get(normalizedLevel);
      return {
        level,
        max: clampedMax,
        used: Math.min(clampedMax, Math.max(0, current?.used ?? 0)),
      };
    })
    .filter((slot): slot is DndCharacter['spellcasting']['slots'][number] => Boolean(slot));
}

function AttackEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: AttackForm | null;
  onChange: (form: AttackForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof AttackForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Attack" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <FormField label="Kind" value={form.kind} onChange={(value) => setField('kind', value)} />
      <Stack direction="row" spacing={1}>
        <FormField
          label="Range"
          value={form.range}
          onChange={(value) => setField('range', value)}
        />
        <FormField
          label="Hit/DC"
          value={form.hitDc}
          onChange={(value) => setField('hitDc', value)}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        <FormField
          label="Damage"
          value={form.damage}
          onChange={(value) => setField('damage', value)}
        />
        <FormField
          label="Type"
          value={form.damageType}
          onChange={(value) => setField('damageType', value)}
        />
      </Stack>
      <Button
        onClick={() => onChange({ ...form, equipped: !form.equipped })}
        sx={toggleButtonSx(Boolean(form.equipped))}
      >
        {form.equipped ? 'Equipped' : 'Not Equipped'}
      </Button>
    </DndEditDialog>
  );
}

function SpellCatalogFilterGroup({
  title,
  options,
  selected,
  allLabel,
  onClear,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  allLabel: string;
  onClear: () => void;
  onToggle: (option: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedLabel = selected.length === 0 ? allLabel : `${selected.length} selected`;

  return (
    <Box
      sx={{
        mt: 1.25,
        border: `1px solid ${dndColors.borderSoft}`,
        borderRadius: '10px',
        bgcolor: alpha(dndColors.panel, 0.4),
        overflow: 'hidden',
      }}
    >
      <Button
        fullWidth
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        sx={{
          minHeight: 48,
          justifyContent: 'space-between',
          px: 1.2,
          py: 0.9,
          color: dndColors.text,
          textAlign: 'left',
          textTransform: 'none',
          '&:hover': { bgcolor: alpha('#9a6cff', 0.12) },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: dndColors.text,
              fontSize: 14,
              fontWeight: 950,
              lineHeight: 1.1,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              mt: 0.25,
              color: selected.length === 0 ? dndColors.muted : '#9a6cff',
              fontSize: 12,
              fontWeight: 850,
              lineHeight: 1.1,
            }}
          >
            {selectedLabel}
          </Typography>
        </Box>
        <ChevronDown
          size={20}
          style={{
            flex: '0 0 auto',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 160ms ease',
          }}
        />
      </Button>
      <Box
        sx={{
          display: expanded ? 'grid' : 'none',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 0.65,
          px: 1,
          pb: 1,
        }}
      >
        <Button
          role="checkbox"
          aria-checked={selected.length === 0}
          onClick={onClear}
          sx={{
            minHeight: 42,
            justifyContent: 'space-between',
            gap: 1,
            color: dndColors.text,
            bgcolor: selected.length === 0 ? alpha('#9a6cff', 0.16) : alpha(dndColors.panel, 0.55),
            border: `1px solid ${selected.length === 0 ? alpha('#9a6cff', 0.54) : dndColors.borderSoft}`,
            borderRadius: '8px',
            fontWeight: 850,
            textTransform: 'none',
            textAlign: 'left',
            px: 1.1,
            '&:hover': { bgcolor: alpha('#9a6cff', 0.2) },
          }}
        >
          <Box component="span" sx={{ minWidth: 0 }}>
            {allLabel}
          </Box>
          <Checkbox
            checked={selected.length === 0}
            onClick={(event) => event.stopPropagation()}
            onChange={onClear}
            sx={{
              p: 0,
              color: alpha(dndColors.text, 0.42),
              '&.Mui-checked': { color: '#9a6cff' },
            }}
          />
        </Button>
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <Button
              key={option}
              role="checkbox"
              aria-checked={checked}
              onClick={() => onToggle(option)}
              sx={{
                minHeight: 42,
                justifyContent: 'space-between',
                gap: 1,
                color: dndColors.text,
                bgcolor: checked ? alpha('#9a6cff', 0.16) : alpha(dndColors.panel, 0.55),
                border: `1px solid ${checked ? alpha('#9a6cff', 0.54) : dndColors.borderSoft}`,
                borderRadius: '8px',
                fontWeight: 850,
                textTransform: 'none',
                textAlign: 'left',
                px: 1.1,
                '&:hover': { bgcolor: alpha('#9a6cff', 0.2) },
              }}
            >
              <Box
                component="span"
                sx={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {option}
              </Box>
              <Checkbox
                checked={checked}
                onClick={(event) => event.stopPropagation()}
                onChange={() => onToggle(option)}
                sx={{
                  p: 0,
                  color: alpha(dndColors.text, 0.42),
                  '&.Mui-checked': { color: '#9a6cff' },
                }}
              />
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

function CatalogHeaderLogo() {
  return (
    <Box
      sx={{
        width: 58,
        height: 58,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        bgcolor: dndColors.red,
        border: `1px solid ${dndColors.redDark}`,
        boxShadow: `0 0 0 1px ${alpha(dndColors.red, 0.24)}, inset 0 0 18px ${alpha(
          '#000000',
          0.16,
        )}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        component="img"
        src="/dnd-dragon-ampersand-white.png"
        alt=""
        sx={{
          width: 45,
          height: 45,
          display: 'block',
          objectFit: 'contain',
          bgcolor: 'transparent',
          border: 0,
        }}
      />
    </Box>
  );
}

function CatalogHeaderTitle({
  sortAscending,
  onToggleSort,
}: {
  sortAscending: boolean;
  onToggleSort: () => void;
}) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography sx={{ fontSize: 21, fontWeight: 850, lineHeight: 1.05 }}>Catalog</Typography>
      <Button
        onClick={onToggleSort}
        sx={{
          mt: 0.35,
          minWidth: 0,
          p: 0,
          color: '#9a6cff',
          fontSize: 15,
          fontWeight: 850,
          lineHeight: 1.2,
          textTransform: 'none',
          '&:hover': { bgcolor: 'transparent', color: '#b48cff' },
        }}
      >
        Sort: {sortAscending ? 'A - Z' : 'Z - A'} ^
      </Button>
    </Box>
  );
}

function CatalogDialog<TEntry>({
  open,
  title,
  searchPlaceholder,
  entries,
  emptyLabel,
  customLabel,
  toolbarAction,
  titleIcon,
  getEntryKey,
  getSearchText,
  getSortLabel,
  renderEntry,
  details,
  onCreateCustom,
  onClose,
}: {
  open: boolean;
  title: string;
  searchPlaceholder: string;
  entries: TEntry[];
  emptyLabel: string;
  customLabel?: string;
  toolbarAction?: ReactNode;
  titleIcon: ReactNode;
  getEntryKey: (entry: TEntry) => string;
  getSearchText: (entry: TEntry) => string[];
  getSortLabel: (entry: TEntry) => string;
  renderEntry: (entry: TEntry) => ReactNode;
  details?: ReactNode;
  onCreateCustom?: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const visibleEntries = entries
    .filter((entry) => {
      if (!normalizedQuery) return true;
      return getSearchText(entry).filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    })
    .sort((a, b) => {
      const left = getSortLabel(a);
      const right = getSortLabel(b);
      return sortAscending ? left.localeCompare(right) : right.localeCompare(left);
    });

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: dndColors.page,
          color: dndColors.text,
          backgroundImage: `linear-gradient(180deg, ${alpha(dndColors.page, 0.98)}, ${alpha(
            dndColors.panelStrong,
            0.99,
          )})`,
        },
      }}
      sx={{ zIndex: 1800 }}
    >
      <Box sx={{ minHeight: '100dvh', pb: 11, pt: 'max(20px, env(safe-area-inset-top))' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 3.2, pt: 1.1, pb: 2.2 }}
        >
          <CatalogHeaderLogo />
          <CatalogHeaderTitle
            sortAscending={sortAscending}
            onToggleSort={() => setSortAscending((current) => !current)}
          />
          <IconButton
            aria-label={`Close ${title} catalog`}
            onClick={onClose}
            sx={{
              width: 58,
              height: 58,
              color: dndColors.text,
              bgcolor: alpha(dndColors.panelSoft, 0.86),
              border: `1px solid ${dndColors.borderSoft}`,
              boxShadow: `inset 0 0 20px ${alpha('#000000', 0.34)}`,
              '&:hover': { bgcolor: dndColors.panelSoft },
            }}
          >
            <X size={26} />
          </IconButton>
        </Stack>

        <Box sx={{ px: 3.2 }}>
          <Box
            sx={{
              height: 55,
              borderRadius: '4px',
              bgcolor: dndColors.chrome,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 1.4,
              px: 1.7,
              color: dndColors.text,
              boxShadow: `inset 0 0 0 1px ${dndColors.borderSoft}`,
            }}
          >
            <Box sx={{ color: '#9a6cff', display: 'grid', placeItems: 'center' }}>{titleIcon}</Box>
            <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{title}</Typography>
            <Grid3X3 size={28} color={dndColors.red} strokeWidth={3} />
          </Box>
          <Stack direction="row" alignItems="center" gap={1.2} sx={{ mt: 2.1, mb: 1.9 }}>
            <Box
              sx={{
                minWidth: 0,
                flex: 1,
                height: 55,
                bgcolor: dndColors.panelSoft,
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                px: 1.7,
                gap: 1.2,
                color: dndColors.muted,
              }}
            >
              <Search size={27} />
              <InputBase
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                inputProps={{ 'aria-label': searchPlaceholder }}
                sx={{
                  flex: 1,
                  color: dndColors.text,
                  fontSize: 19,
                  fontWeight: 650,
                  '& input::placeholder': {
                    color: dndColors.muted,
                    opacity: 1,
                  },
                }}
              />
              {query ? (
                <IconButton
                  aria-label={`Clear ${title} search`}
                  onClick={() => setQuery('')}
                  sx={{
                    width: 32,
                    height: 32,
                    color: dndColors.muted,
                    '&:hover': {
                      color: dndColors.text,
                      bgcolor: alpha(dndColors.text, 0.08),
                    },
                  }}
                >
                  <X size={18} />
                </IconButton>
              ) : null}
            </Box>
            {toolbarAction}
          </Stack>
        </Box>

        <Box
          sx={{
            borderTop: `1px solid ${dndColors.borderSoft}`,
            borderBottom: `1px solid ${dndColors.borderSoft}`,
          }}
        >
          {onCreateCustom && customLabel ? (
            <Box sx={{ bgcolor: dndColors.panel, px: 3.2, py: 1.4 }}>
              <Button
                fullWidth
                startIcon={<AddIcon />}
                onClick={onCreateCustom}
                sx={{
                  minHeight: 54,
                  borderRadius: '4px',
                  bgcolor: dndColors.red,
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 950,
                  textTransform: 'none',
                  '&:hover': { bgcolor: dndColors.redDark },
                }}
              >
                {customLabel}
              </Button>
            </Box>
          ) : null}
          {visibleEntries.length === 0 ? (
            <Typography
              sx={{
                color: dndColors.muted,
                fontSize: 16,
                fontWeight: 750,
                py: 4,
                textAlign: 'center',
              }}
            >
              {emptyLabel}
            </Typography>
          ) : null}
          {visibleEntries.map((entry) => (
            <Box key={getEntryKey(entry)}>{renderEntry(entry)}</Box>
          ))}
        </Box>
      </Box>
      {details}
    </Dialog>
  );
}

function SpellCatalogDialog({
  open,
  spells,
  selectedName,
  onCreateCustom,
  onSelect,
  canSelectSpell,
  onClose,
}: {
  open: boolean;
  spells: SpellCatalogEntry[];
  selectedName?: string;
  onCreateCustom?: () => void;
  onSelect: (spell: SpellCatalogEntry) => void;
  canSelectSpell?: (spell: SpellCatalogEntry) => boolean;
  onClose: () => void;
}) {
  const [schoolFilters, setSchoolFilters] = useState<string[]>([]);
  const [levelFilters, setLevelFilters] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [previewSpell, setPreviewSpell] = useState<SpellCatalogEntry | null>(null);
  useEffect(() => {
    if (!open) {
      setPreviewSpell(null);
      setFilterOpen(false);
    }
  }, [open]);
  const schoolOptions = Array.from(
    new Set(spells.map((spell) => spell.school.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const levelOptions = Array.from(
    new Set(spells.map((spell) => spell.level.trim()).filter(Boolean)),
  ).sort((a, b) => {
    const rankA = getSpellSlotRank(a) ?? (/\bcantrip\b/iu.test(a) ? 0 : 99);
    const rankB = getSpellSlotRank(b) ?? (/\bcantrip\b/iu.test(b) ? 0 : 99);
    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b);
  });
  const toggleSchoolFilter = (school: string) => {
    setSchoolFilters((current) =>
      current.includes(school) ? current.filter((entry) => entry !== school) : [...current, school],
    );
  };
  const toggleLevelFilter = (level: string) => {
    setLevelFilters((current) =>
      current.includes(level) ? current.filter((entry) => entry !== level) : [...current, level],
    );
  };
  const activeFilterCount = schoolFilters.length + levelFilters.length;
  const filterMatchedSpells = spells.filter((spell) => {
    if (schoolFilters.length > 0 && !schoolFilters.includes(spell.school)) return false;
    if (levelFilters.length > 0 && !levelFilters.includes(spell.level)) return false;
    return true;
  });
  const previewSpellDetails: Spell | null = previewSpell
    ? {
        id: 'catalog-preview',
        ...previewSpell,
        prepared: false,
      }
    : null;
  const previewCanSelect = previewSpell ? (canSelectSpell?.(previewSpell) ?? true) : false;

  return (
    <CatalogDialog
      open={open}
      title="Spells"
      searchPlaceholder="Search spells"
      entries={filterMatchedSpells}
      emptyLabel="No spells match your search."
      customLabel={onCreateCustom ? 'Custom Spell' : undefined}
      titleIcon={<AutoAwesomeIcon sx={{ color: '#9a6cff', fontSize: 28 }} />}
      getEntryKey={(spell) => `${spell.level}-${spell.school}-${spell.name}-${spell.source ?? ''}`}
      getSearchText={(spell) => [spell.name, spell.level, spell.school, spell.source ?? '']}
      getSortLabel={(spell) => spell.name}
      onCreateCustom={onCreateCustom}
      onClose={onClose}
      toolbarAction={
        <Box
          sx={{
            flex: '0 0 auto',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <Button
            aria-expanded={filterOpen}
            aria-haspopup="dialog"
            onClick={() => setFilterOpen((current) => !current)}
            sx={{
              minWidth: 88,
              height: 55,
              borderRadius: '14px',
              bgcolor: '#3a2564',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 950,
              px: 1.35,
              gap: 0.65,
              textTransform: 'none',
              '&:hover': { bgcolor: '#4b3180' },
            }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-grid',
                placeItems: 'center',
                width: 23,
                height: 23,
                position: 'relative',
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  left: 3,
                  right: 3,
                  height: 2,
                  borderRadius: '999px',
                  bgcolor: '#ffffff',
                },
                '&::before': { top: 6 },
                '&::after': { bottom: 6 },
              }}
            >
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  left: 3,
                  right: 3,
                  top: '50%',
                  height: 2,
                  borderRadius: '999px',
                  bgcolor: '#ffffff',
                  transform: 'translateY(-50%)',
                }}
              />
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  top: 3,
                  left: 13,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                }}
              />
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  top: 9,
                  left: 5,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                }}
              />
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 3,
                  left: 15,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                }}
              />
            </Box>
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
          {filterOpen ? (
            <Box
              role="dialog"
              aria-label="Filter spells"
              sx={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 5,
                width: { xs: 'min(326px, calc(100vw - 38px))', sm: 360 },
                maxHeight: 'calc(100dvh - 238px)',
                overflowY: 'auto',
                bgcolor: dndColors.panelSoft,
                color: dndColors.text,
                border: `1px solid ${dndColors.borderSoft}`,
                borderRadius: '12px',
                boxShadow: `0 18px 34px ${alpha('#000000', 0.45)}`,
                p: 1.4,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 18, fontWeight: 950 }}>Filters</Typography>
                <Button
                  disabled={activeFilterCount === 0}
                  onClick={() => {
                    setSchoolFilters([]);
                    setLevelFilters([]);
                  }}
                  sx={{
                    minWidth: 0,
                    color: activeFilterCount === 0 ? dndColors.muted : '#9a6cff',
                    fontWeight: 900,
                    textTransform: 'none',
                    '&.Mui-disabled': { color: alpha(dndColors.muted, 0.58) },
                  }}
                >
                  Clear
                </Button>
              </Stack>
              <SpellCatalogFilterGroup
                title="School of Magic"
                options={schoolOptions}
                selected={schoolFilters}
                allLabel="All Schools"
                onClear={() => setSchoolFilters([])}
                onToggle={toggleSchoolFilter}
              />
              <SpellCatalogFilterGroup
                title="Spell Level"
                options={levelOptions}
                selected={levelFilters}
                allLabel="All Levels"
                onClear={() => setLevelFilters([])}
                onToggle={toggleLevelFilter}
              />
            </Box>
          ) : null}
        </Box>
      }
      renderEntry={(spell) => {
        const selected = selectedName === spell.name;
        const canSelect = canSelectSpell?.(spell) ?? true;
        return (
          <Box
            component="button"
            type="button"
            onClick={() => setPreviewSpell(spell)}
            sx={{
              width: '100%',
              minHeight: 106,
              bgcolor: selected ? alpha(dndColors.red, 0.12) : dndColors.panel,
              color: dndColors.text,
              border: 0,
              borderBottom: `1px solid ${dndColors.borderSoft}`,
              display: 'grid',
              gridTemplateColumns: '70px minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 1.7,
              px: 3.2,
              py: 1.4,
              textAlign: 'left',
              font: 'inherit',
              cursor: 'pointer',
              opacity: canSelect ? 1 : 0.46,
              filter: canSelect ? 'none' : 'grayscale(0.75)',
              '&:hover': { bgcolor: dndColors.panelSoft },
            }}
          >
            <SpellSchoolIcon school={spell.school} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: dndColors.text,
                  fontSize: 22,
                  fontWeight: 950,
                  lineHeight: 1.05,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {spell.name}
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: dndColors.muted,
                  fontSize: 16,
                  fontWeight: 850,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {getSpellCatalogSubtitle(spell)}
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: alpha(dndColors.muted, 0.88),
                  fontSize: 15,
                  fontWeight: 650,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {spell.source ?? 'D&D Spell Catalog'}
              </Typography>
            </Box>
            {isLegacySpell(spell) ? (
              <Box
                sx={{
                  alignSelf: 'center',
                  px: 1.6,
                  py: 0.55,
                  borderRadius: '3px',
                  bgcolor: dndColors.border,
                  color: dndColors.text,
                  fontSize: 15,
                  fontWeight: 950,
                }}
              >
                Legacy
              </Box>
            ) : null}
          </Box>
        );
      }}
      details={
        <SpellDetailsDialog
          spell={previewSpellDetails}
          onClose={() => setPreviewSpell(null)}
          onSelect={
            previewSpell && previewCanSelect
              ? () => {
                  onSelect(previewSpell);
                  setPreviewSpell(null);
                }
              : undefined
          }
          selectDisabledLabel={previewSpell && !previewCanSelect ? 'Need Higher LVL' : undefined}
        />
      }
    />
  );
}

function ItemCatalogDialog({
  open,
  items,
  onCreateCustom,
  onSelect,
  onQuickAdd,
  onClose,
}: {
  open: boolean;
  items: ItemCatalogEntry[];
  onCreateCustom: () => void;
  onSelect: (item: ItemCatalogEntry) => void;
  onQuickAdd: (item: ItemCatalogEntry) => void;
  onClose: () => void;
}) {
  const [previewItem, setPreviewItem] = useState<ItemCatalogEntry | null>(null);
  useEffect(() => {
    if (!open) {
      setPreviewItem(null);
    }
  }, [open]);

  return (
    <CatalogDialog
      open={open}
      title="Items & Equipment"
      searchPlaceholder="Search items"
      entries={items}
      emptyLabel="No items match your search."
      customLabel="Custom Item"
      titleIcon={<Backpack size={28} color="#9a6cff" strokeWidth={2.5} />}
      getEntryKey={(item) => `${item.category}-${item.name}-${item.source ?? ''}`}
      getSearchText={(item) => [
        item.name,
        item.category,
        item.rarity ?? '',
        item.source ?? '',
        item.description ?? '',
      ]}
      getSortLabel={(item) => item.name}
      onCreateCustom={onCreateCustom}
      onClose={onClose}
      renderEntry={(item) => (
        <Box
          component="button"
          type="button"
          onClick={() => setPreviewItem(item)}
          sx={{
            width: '100%',
            minHeight: 94,
            bgcolor: dndColors.panel,
            color: dndColors.text,
            border: 0,
            borderBottom: `1px solid ${dndColors.borderSoft}`,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            alignItems: 'center',
            gap: 1.4,
            px: 3.2,
            py: 1.3,
            textAlign: 'left',
            font: 'inherit',
            cursor: 'pointer',
            '&:hover': { bgcolor: dndColors.panelSoft },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: dndColors.text,
                fontSize: 22,
                fontWeight: 950,
                lineHeight: 1.05,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.name}
            </Typography>
            <Typography
              sx={{
                mt: 0.35,
                color: dndColors.muted,
                fontSize: 16,
                fontWeight: 850,
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.category}
              {item.rarity ? ` • ${item.rarity}` : ''}
            </Typography>
            <Typography
              sx={{
                mt: 0.35,
                color: alpha(dndColors.muted, 0.88),
                fontSize: 15,
                fontWeight: 650,
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.weight} • {item.cost}
            </Typography>
          </Box>
          <IconButton
            aria-label={`Add ${item.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onQuickAdd(item);
            }}
            sx={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              bgcolor: dndColors.red,
              color: '#ffffff',
              '&:hover': { bgcolor: dndColors.redDark },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      details={
        <ItemDetailsDialog
          item={previewItem ? catalogItemToInventoryItem(previewItem) : null}
          onClose={() => setPreviewItem(null)}
          onAdd={
            previewItem
              ? () => {
                  onSelect(previewItem);
                  setPreviewItem(null);
                }
              : undefined
          }
        />
      }
    />
  );
}

function TextCatalogDialog<TEntry extends { name: string; summary: string }>({
  open,
  title,
  searchPlaceholder,
  customLabel,
  emptyLabel,
  entries,
  getMeta,
  icon,
  onCreateCustom,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  searchPlaceholder: string;
  customLabel: string;
  emptyLabel: string;
  entries: TEntry[];
  getMeta: (entry: TEntry) => string[];
  icon: ReactNode;
  onCreateCustom: () => void;
  onSelect: (entry: TEntry) => void;
  onClose: () => void;
}) {
  return (
    <CatalogDialog
      open={open}
      title={title}
      searchPlaceholder={searchPlaceholder}
      entries={entries}
      emptyLabel={emptyLabel}
      customLabel={customLabel}
      titleIcon={icon}
      getEntryKey={(entry) => `${entry.name}-${getMeta(entry).filter(Boolean).join('-')}`}
      getSearchText={(entry) => [entry.name, entry.summary, ...getMeta(entry)]}
      getSortLabel={(entry) => entry.name}
      onCreateCustom={onCreateCustom}
      onClose={onClose}
      renderEntry={(entry) => {
        const meta = getMeta(entry).filter(Boolean);
        return (
          <Box
            component="button"
            type="button"
            onClick={() => onSelect(entry)}
            sx={{
              width: '100%',
              minHeight: 98,
              bgcolor: dndColors.panel,
              color: dndColors.text,
              border: 0,
              borderBottom: `1px solid ${dndColors.borderSoft}`,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 1.4,
              px: 3.2,
              py: 1.3,
              textAlign: 'left',
              font: 'inherit',
              cursor: 'pointer',
              '&:hover': { bgcolor: dndColors.panelSoft },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: dndColors.text,
                  fontSize: 22,
                  fontWeight: 950,
                  lineHeight: 1.05,
                }}
              >
                {entry.name}
              </Typography>
              {meta.length > 0 ? (
                <Typography
                  sx={{
                    mt: 0.4,
                    color: dndColors.muted,
                    fontSize: 15,
                    fontWeight: 850,
                    lineHeight: 1.2,
                  }}
                >
                  {meta.join(' • ')}
                </Typography>
              ) : null}
              <Typography
                sx={{
                  mt: 0.55,
                  color: alpha(dndColors.muted, 0.9),
                  fontSize: 14,
                  lineHeight: 1.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {entry.summary}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: dndColors.red,
                color: '#ffffff',
              }}
            >
              <AddIcon fontSize="small" />
            </Box>
          </Box>
        );
      }}
    />
  );
}

function ItemDetailsDialog({
  item,
  onClose,
  onAdd,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onAdd?: () => void;
}) {
  if (!item) return null;
  const detailRows = [
    { label: 'Category', value: item.category },
    { label: 'Weight', value: item.weight },
    { label: 'Quantity', value: item.quantity },
    { label: 'Cost', value: item.cost },
    ...(item.rarity ? [{ label: 'Rarity', value: item.rarity }] : []),
    ...(typeof item.armorClassModifier === 'number'
      ? [{ label: 'AC Modifier', value: formatModifier(item.armorClassModifier) }]
      : []),
    ...(item.damage ? [{ label: 'Damage', value: `${item.damage} ${item.damageType ?? ''}` }] : []),
    ...(item.properties?.length
      ? [{ label: 'Properties', value: item.properties.join(', ') }]
      : []),
    ...(item.source ? [{ label: 'Source', value: item.source }] : []),
  ];

  return (
    <Dialog
      open={Boolean(item)}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{
        zIndex: 1900,
        '& .MuiDialog-container': {
          alignItems: { xs: 'flex-start', sm: 'center' },
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 430 },
          height: { xs: 'calc(100dvh - 82px)', sm: 'min(760px, calc(100dvh - 40px))' },
          mt: { xs: 'calc(env(safe-area-inset-top, 0px) + 78px)', sm: 0 },
          mx: { xs: 0, sm: 2 },
          borderRadius: { xs: '26px 26px 0 0', sm: '18px' },
          border: `1px solid ${dndColors.border}`,
          bgcolor: dndColors.panelSoft,
          color: dndColors.text,
          boxShadow: `0 18px 50px ${alpha('#000000', 0.46)}`,
          overflow: 'hidden',
        },
      }}
    >
      <IconButton
        aria-label="Close item details"
        onClick={onClose}
        sx={{
          position: 'absolute',
          left: 16,
          top: 16,
          zIndex: 2,
          width: 48,
          height: 48,
          borderRadius: '999px',
          bgcolor: alpha('#000000', 0.28),
          color: dndColors.text,
          '&:hover': { bgcolor: alpha('#000000', 0.38) },
        }}
      >
        <X size={30} />
      </IconButton>
      <DialogContent
        sx={{
          px: 2.2,
          pt: 4.2,
          pb: 3,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Box sx={{ minHeight: 78, textAlign: 'center', px: 7 }}>
          <Typography
            sx={{ color: dndColors.text, fontSize: 19, fontWeight: 950, lineHeight: 1.1 }}
          >
            {item.name}
          </Typography>
          <Typography sx={{ color: dndColors.muted, fontSize: 13, fontWeight: 850 }}>
            {item.equipped ? 'Equipped' : 'Inventory Item'}
          </Typography>
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1.5}
          sx={{ mt: 2.3 }}
        >
          <Typography sx={{ color: dndColors.text, fontSize: 16, minWidth: 0 }}>
            {item.category}
            {item.rarity ? ` • ${item.rarity}` : ''}
          </Typography>
          {onAdd ? (
            <Button
              onClick={onAdd}
              sx={{
                minHeight: 32,
                borderRadius: '999px',
                px: 1.6,
                flex: '0 0 auto',
                bgcolor: dndColors.red,
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 950,
                textTransform: 'none',
                '&:hover': { bgcolor: dndColors.redDark },
              }}
            >
              Add
            </Button>
          ) : null}
        </Stack>
        <DividerLine />
        <Stack spacing={0.75}>
          {detailRows.map((detail) => (
            <Typography
              key={detail.label}
              sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.45 }}
            >
              <Box component="span" sx={{ fontWeight: 950 }}>
                {detail.label}:
              </Box>{' '}
              {detail.value}
            </Typography>
          ))}
        </Stack>
        {item.description ? (
          <>
            <DividerLine />
            <Typography
              sx={{
                color: dndColors.text,
                fontSize: 16,
                lineHeight: 1.65,
                whiteSpace: 'pre-line',
              }}
            >
              {item.description}
            </Typography>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SpellEditDialog({
  open,
  form,
  spellCatalog,
  canSelectCatalogSpell,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: SpellForm | null;
  spellCatalog: SpellCatalogEntry[];
  canSelectCatalogSpell?: (spell: SpellCatalogEntry) => boolean;
  onChange: (form: SpellForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  if (!form) return null;
  const setField = (key: keyof SpellForm, value: string) => onChange({ ...form, [key]: value });
  const applyCatalogSpell = (spell: SpellCatalogEntry) => {
    if (canSelectCatalogSpell && !canSelectCatalogSpell(spell)) {
      setCatalogOpen(false);
      return;
    }
    onChange({
      ...form,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      castingTime: spell.castingTime,
      range: spell.range,
      hitDc: spell.hitDc,
      damage: spell.damage,
      effect: spell.effect,
      description: spell.description,
      higherLevel: spell.higherLevel,
      components: spell.components,
      material: spell.material,
      duration: spell.duration,
      ritual: spell.ritual,
      concentration: spell.concentration,
      source: spell.source,
      sourceUrl: spell.sourceUrl,
      licenseUrl: spell.licenseUrl,
    });
    setCatalogOpen(false);
  };
  return (
    <>
      <DndEditDialog title="Edit Spell" open={open} onCancel={onCancel} onSave={onSave}>
        <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>
          Spell Catalog
        </Typography>
        <Button
          type="button"
          onClick={() => setCatalogOpen(true)}
          sx={{
            width: '100%',
            minHeight: 42,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '6px',
            bgcolor: dndColors.panelStrong,
            color: dndColors.text,
            px: 1.4,
            justifyContent: 'space-between',
            fontWeight: 900,
            textTransform: 'none',
            '&:hover': { bgcolor: alpha(dndColors.panelStrong, 0.84) },
          }}
        >
          <span>
            {spellCatalog.find((spell) => spell.name === form.name)?.name ??
              `Choose from ${spellCatalog.length} catalog spells`}
          </span>
          <Search size={18} />
        </Button>
        <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
        <Stack direction="row" spacing={1}>
          <FormField
            label="Level"
            value={form.level}
            onChange={(value) => setField('level', value)}
          />
          <FormField
            label="School"
            value={form.school}
            onChange={(value) => setField('school', value)}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <FormField
            label="Time"
            value={form.castingTime}
            onChange={(value) => setField('castingTime', value)}
          />
          <FormField
            label="Range"
            value={form.range}
            onChange={(value) => setField('range', value)}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <FormField
            label="Hit/DC"
            value={form.hitDc}
            onChange={(value) => setField('hitDc', value)}
          />
          <FormField
            label="Damage"
            value={form.damage ?? ''}
            onChange={(value) => onChange({ ...form, damage: value })}
          />
        </Stack>
        <FormField
          label="Effect"
          value={form.effect ?? ''}
          onChange={(value) => onChange({ ...form, effect: value })}
        />
        <Stack direction="row" spacing={1}>
          <FormField
            label="Components"
            value={form.components ?? ''}
            onChange={(value) => onChange({ ...form, components: value })}
          />
          <FormField
            label="Duration"
            value={form.duration ?? ''}
            onChange={(value) => onChange({ ...form, duration: value })}
          />
        </Stack>
        <MultilineFormField
          label="Description"
          value={form.description ?? ''}
          onChange={(value) => onChange({ ...form, description: value })}
          minRows={4}
        />
        <MultilineFormField
          label="At Higher Levels"
          value={form.higherLevel ?? ''}
          onChange={(value) => onChange({ ...form, higherLevel: value })}
          minRows={2}
        />
        <Button
          onClick={() => onChange({ ...form, prepared: !form.prepared })}
          sx={toggleButtonSx(Boolean(form.prepared))}
        >
          {form.prepared ? 'Prepared' : 'Not Prepared'}
        </Button>
      </DndEditDialog>
      <SpellCatalogDialog
        open={catalogOpen}
        spells={spellCatalog}
        selectedName={form.name}
        onSelect={applyCatalogSpell}
        canSelectSpell={canSelectCatalogSpell}
        onClose={() => setCatalogOpen(false)}
      />
    </>
  );
}

function SpellcastingEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: SpellcastingForm | null;
  onChange: (form: SpellcastingForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof SpellcastingForm, value: string) =>
    onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Spellcasting" open={open} onCancel={onCancel} onSave={onSave}>
      <Box>
        <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900, mb: 0.4 }}>
          ABILITY
        </Typography>
        <Box
          component="select"
          aria-label="Spellcasting ability"
          value={form.ability}
          onChange={(event) => setField('ability', event.target.value)}
          sx={{
            width: '100%',
            minHeight: 42,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '6px',
            bgcolor: dndColors.panelStrong,
            color: dndColors.text,
            px: 1,
            font: 'inherit',
            fontWeight: 800,
            outline: 'none',
            '& option': { color: '#11191e', backgroundColor: '#ffffff' },
          }}
        >
          {abilityKeys.map((ability) => (
            <option key={ability} value={ability}>
              {ability.toUpperCase()}
            </option>
          ))}
        </Box>
      </Box>
      <Stack direction="row" spacing={1}>
        <FormField
          label="Save DC"
          value={form.saveDc}
          inputMode="numeric"
          onChange={(value) => setField('saveDc', value)}
        />
        <FormField
          label="Attack Bonus"
          value={form.attackBonus}
          inputMode="numeric"
          onChange={(value) => setField('attackBonus', value)}
        />
      </Stack>
      <MultilineFormField
        label="Slots"
        value={form.slots}
        minRows={4}
        onChange={(value) => setField('slots', value)}
      />
      <Typography sx={{ color: dndColors.muted, fontSize: 12, lineHeight: 1.4 }}>
        Enter one slot level per line, like “1st: 4” or “2nd: 3”.
      </Typography>
    </DndEditDialog>
  );
}

function ItemEditDialog({
  open,
  form,
  title = 'Edit Item',
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: ItemForm | null;
  title?: string;
  onChange: (form: ItemForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: 'name' | 'category' | 'weight' | 'quantity' | 'cost', value: string) =>
    onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title={title} open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <FormField
        label="Category"
        value={form.category}
        onChange={(value) => setField('category', value)}
      />
      <Stack direction="row" spacing={1}>
        <FormField
          label="Weight"
          value={form.weight}
          onChange={(value) => setField('weight', value)}
        />
        <FormField
          label="Qty"
          value={form.quantity}
          onChange={(value) => setField('quantity', value)}
        />
        <FormField label="Cost" value={form.cost} onChange={(value) => setField('cost', value)} />
      </Stack>
      <FormField
        label="AC Modifier"
        value={String(form.armorClassModifier ?? 0)}
        inputMode="numeric"
        onChange={(value) =>
          onChange({ ...form, armorClassModifier: parseIntOrFallback(value, 0) })
        }
      />
      <Button
        onClick={() => onChange({ ...form, equipped: !form.equipped })}
        sx={toggleButtonSx(Boolean(form.equipped))}
      >
        {form.equipped ? 'Equipped' : 'Not Equipped'}
      </Button>
    </DndEditDialog>
  );
}

function FeatureEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
  onDelete,
}: {
  open: boolean;
  form: FeatureForm | null;
  onChange: (form: FeatureForm) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}) {
  if (!form) return null;
  const setField = (key: 'name' | 'source' | 'summary', value: string) =>
    onChange({ ...form, [key]: value });
  const uses = form.uses;
  const updateUses = (next: Partial<NonNullable<Feature['uses']>>) =>
    onChange({
      ...form,
      uses: {
        label: uses?.label ?? form.name,
        used: uses?.used ?? 0,
        max: uses?.max ?? 1,
        reset: uses?.reset ?? 'Long Rest',
        ...next,
      },
    });

  return (
    <DndEditDialog
      title="Edit Feature"
      open={open}
      onCancel={onCancel}
      onSave={onSave}
      titleAction={
        <IconButton
          aria-label="Delete feature"
          onClick={() => onDelete(form.id)}
          sx={{
            color: dndColors.red,
            bgcolor: alpha(dndColors.red, 0.12),
            '&:hover': { bgcolor: alpha(dndColors.red, 0.2) },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      }
    >
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <FormField
        label="Source"
        value={form.source}
        onChange={(value) => setField('source', value)}
      />
      <MultilineFormField
        label="Summary"
        value={form.summary}
        minRows={5}
        onChange={(value) => setField('summary', value)}
      />
      <Button
        onClick={() =>
          onChange({
            ...form,
            uses: uses ? undefined : { label: form.name, used: 0, max: 1, reset: 'Long Rest' },
          })
        }
        sx={toggleButtonSx(Boolean(uses))}
      >
        {uses ? 'Tracks Uses' : 'No Use Tracking'}
      </Button>
      {uses ? (
        <>
          <FormField
            label="Use Label"
            value={uses.label}
            onChange={(value) => updateUses({ label: value })}
          />
          <Stack direction="row" spacing={1}>
            <FormField
              label="Used"
              value={String(uses.used)}
              inputMode="numeric"
              onChange={(value) => updateUses({ used: parseIntOrFallback(value, uses.used) })}
            />
            <FormField
              label="Max"
              value={String(uses.max)}
              inputMode="numeric"
              onChange={(value) =>
                updateUses({ max: Math.max(1, parseIntOrFallback(value, uses.max)) })
              }
            />
          </Stack>
          <FormField
            label="Reset"
            value={uses.reset}
            onChange={(value) => updateUses({ reset: value })}
          />
        </>
      ) : null}
    </DndEditDialog>
  );
}

function FeatEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: FeatForm | null;
  onChange: (form: FeatForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof FeatForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Feat" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <MultilineFormField
        label="Summary"
        value={form.summary}
        minRows={5}
        onChange={(value) => setField('summary', value)}
      />
    </DndEditDialog>
  );
}

function toggleButtonSx(active: boolean) {
  return {
    minHeight: 42,
    border: `1px solid ${active ? dndColors.green : dndColors.border}`,
    color: active ? '#ffffff' : dndColors.text,
    bgcolor: active ? alpha(dndColors.green, 0.24) : dndColors.panelStrong,
    boxShadow: active ? `inset 0 0 0 1px ${alpha(dndColors.green, 0.22)}` : 'none',
    fontWeight: 900,
    textTransform: 'none',
    '&:hover': { bgcolor: active ? alpha(dndColors.green, 0.32) : alpha('#ffffff', 0.08) },
  };
}

function ConvexCharacterSyncMount() {
  const [character, , history] = useDndCharacterHistory();
  const applyRemote = useCallback(
    (remote: DndCharacter) => {
      history.replace(remote);
    },
    [history],
  );

  useConvexCharacterSync<DndCharacter>({
    character,
    applyRemote,
    serialize: serializeDndCharacter,
    deserialize: deserializeDndCharacter,
    gameSystem: DND_GAME_SYSTEM,
    schemaVersion: DND_SCHEMA_VERSION,
    pendingSyncKeyPrefix: DND_PENDING_SYNC_KEY,
    selectCharacterEventName: DND_SELECT_CHARACTER_EVENT,
    describeCharacter: describeDndCharacter,
  });

  return null;
}

function DungeonsAndDragons() {
  const { themeMode } = useThemeMode();
  Object.assign(dndColors, themeMode === ThemeMode.DARK ? darkDndColors : lightDndColors);
  const [character, setCharacter, history] = useDndCharacterHistory();
  const [activeTab, setActiveTabRaw] = useAtom(activeDndTabState);
  const bodySwipeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    tab: DndTab;
    direction: 1 | -1 | null;
  } | null>(null);
  const dndClassDocs = useQuery(api.classes.listDungeonsAndDragonsClasses) as
    | DndClassDoc[]
    | undefined;
  const dndClassOptions = (dndClassDocs ?? [])
    .map((doc) => asNonEmptyString(doc.class?.className))
    .filter((className): className is string => className !== null)
    .sort((a, b) => a.localeCompare(b));
  const dndClassCatalogByName = new Map(
    (dndClassDocs ?? [])
      .map((doc) => doc.class)
      .filter(
        (classInfo): classInfo is DndClassInfo => asNonEmptyString(classInfo?.className) !== null,
      )
      .map((classInfo) => [classInfo.className!, classInfo] as const),
  );
  const dndSubclassOptionsByClassName = new Map(
    [
      ...Object.keys(dndSubclassOptionsByClass),
      ...(dndClassDocs ?? [])
        .map((doc) => asNonEmptyString(doc.class?.className))
        .filter((className): className is string => className !== null),
    ].map((className) => {
      const key = normalizeClassCatalogKey(className);
      const catalogInfo = Array.from(dndClassCatalogByName.values()).find(
        (classInfo) => normalizeClassCatalogKey(classInfo.className ?? '') === key,
      );
      const options = [
        ...getCatalogSubclassOptions(catalogInfo),
        ...(dndSubclassOptionsByClass[key] ?? []),
      ].sort((a, b) => a.localeCompare(b));
      return [key, Array.from(new Set(options))] as [string, string[]];
    }),
  );
  const dndCatalogItems = useQuery(api.catalog.listByGameSystem, {
    gameSystem: DND_GAME_SYSTEM,
  }) as
    | Array<SpellCatalogEntry | ItemCatalogEntry | FeatCatalogEntry | FeatureCatalogEntry>
    | undefined;
  const dndSpellOptions = (dndCatalogItems ?? [])
    .filter(
      (entry) =>
        entry.metadata?.type === 'spell' || entry.type === 'spell' || entry.category === 'Spell',
    )
    .filter((entry): entry is SpellCatalogEntry => asNonEmptyString(entry.name) !== null);
  const dndItemOptions = (dndCatalogItems ?? [])
    .filter(
      (entry) =>
        entry.metadata?.type === 'item' ||
        entry.type === 'item' ||
        (!entry.metadata?.type &&
          entry.category !== 'Spell' &&
          entry.type !== 'spell' &&
          entry.type !== 'feat' &&
          entry.type !== 'feature'),
    )
    .filter((entry): entry is ItemCatalogEntry => asNonEmptyString(entry.name) !== null);
  const dndFeatRows = (dndCatalogItems ?? [])
    .filter((entry) => entry.metadata?.type === 'feat' || entry.type === 'feat')
    .filter((entry): entry is FeatCatalogEntry => asNonEmptyString(entry.name) !== null);
  const dndFeatOptions = Array.from(
    [...dndFeatRows, ...(DUNGEONS_AND_DRAGONS_FEATS as unknown as FeatCatalogEntry[])]
      .reduce((entriesByName, feat) => {
        const key = feat.name.trim().toLowerCase();
        if (!entriesByName.has(key)) entriesByName.set(key, feat);
        return entriesByName;
      }, new Map<string, FeatCatalogEntry>())
      .values(),
  ).sort((a, b) => a.name.localeCompare(b.name));
  const dndFeatureRows = (dndCatalogItems ?? [])
    .filter((entry) => entry.metadata?.type === 'feature' || entry.type === 'feature')
    .filter((entry): entry is FeatureCatalogEntry => asNonEmptyString(entry.name) !== null);
  const dndFeatureOptions = [
    ...(dndFeatureRows.length > 0
      ? dndFeatureRows
      : (DUNGEONS_AND_DRAGONS_FEATURES as unknown as FeatureCatalogEntry[])),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const spellCatalogSource = mergeSpellCatalogs(
    standardDndSpellCatalogEntries,
    dndSpellCatalog,
    dndSpellOptions,
  );
  const itemCatalogOptions = (dndItemOptions.length > 0 ? dndItemOptions : dndItemCatalog).sort(
    (a, b) => a.name.localeCompare(b.name),
  );
  const characterClassNames = new Set(
    character.classes
      .map((entry) => asNonEmptyString(entry.name)?.toLowerCase() ?? null)
      .filter((name): name is string => name !== null),
  );
  const classSpellCatalog = spellCatalogSource.filter((spell) =>
    (Array.isArray(spell.classes) ? spell.classes : [])
      .map((className) => asNonEmptyString(className)?.toLowerCase() ?? null)
      .filter((className): className is string => className !== null)
      .some((className) => characterClassNames.has(className)),
  );
  const spellCatalogOptions = classSpellCatalog.length > 0 ? classSpellCatalog : spellCatalogSource;
  const [pendingDelete, setPendingDelete] = useState<null | {
    confirm: () => void;
    title?: string;
    body: string;
  }>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [builderForm, setBuilderForm] = useState<CharacterBuilderForm | null>(null);
  const [characterForm, setCharacterForm] = useState<CharacterForm | null>(null);
  const [pendingLocalCharacterEditId, setPendingLocalCharacterEditId] = useState<string | null>(
    null,
  );
  const [hitPointForm, setHitPointForm] = useState<HitPointForm | null>(null);
  const [attackForm, setAttackForm] = useState<AttackForm | null>(null);
  const [spellForm, setSpellForm] = useState<SpellForm | null>(null);
  const [spellCatalogOpen, setSpellCatalogOpen] = useState(false);
  const [itemCatalogOpen, setItemCatalogOpen] = useState(false);
  const [featureCatalogOpen, setFeatureCatalogOpen] = useState(false);
  const [featCatalogOpen, setFeatCatalogOpen] = useState(false);
  const [spellcastingForm, setSpellcastingForm] = useState<SpellcastingForm | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);
  const [spellDetails, setSpellDetails] = useState<Spell | null>(null);
  const [itemDetails, setItemDetails] = useState<InventoryItem | null>(null);
  const [itemAddedToastMessage, setItemAddedToastMessage] = useState<string | null>(null);
  const [featureForm, setFeatureForm] = useState<FeatureForm | null>(null);
  const [featForm, setFeatForm] = useState<FeatForm | null>(null);
  const [abilityForm, setAbilityForm] = useState<AbilityForm | null>(null);
  const [skillForm, setSkillForm] = useState<SkillForm | null>(null);
  const [proficiencyForm, setProficiencyForm] = useState<ProficiencyForm | null>(null);
  const [backgroundForm, setBackgroundForm] = useState<BackgroundForm | null>(null);
  const [noteForm, setNoteForm] = useState<NoteForm | null>(null);
  const [moneyForm, setMoneyForm] = useState<MoneyForm | null>(null);
  const [charactersOpen, setCharactersOpen] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [tabSlide, setTabSlide] = useState<null | {
    from: DndTab;
    to: DndTab;
    direction: 1 | -1;
    offset: number;
    width: number;
    phase: 'dragging' | 'settling' | 'canceling';
  }>(null);

  const localCharacters = useLocalCharacterSlots({
    atom: dndCharacterState,
    gameSystem: DND_GAME_SYSTEM,
    legacyKey: 'dnd-character-state',
    initialValue: initialDndCharacter,
    createCharacter: createDndCharacter,
    describeCharacter: describeDndCharacter,
    migrate: migrateDndLocalCharacter,
  });
  const selectRemoteCharacter = useCallback(
    (characterState: unknown) => {
      history.replace(deserializeDndCharacter(characterState));
    },
    [history],
  );

  useEffect(() => {
    if (!pendingLocalCharacterEditId) return;
    if (localCharacters.activeId !== pendingLocalCharacterEditId) return;
    setCharacterForm(createCharacterForm(character));
    setPendingLocalCharacterEditId(null);
  }, [character, localCharacters.activeId, pendingLocalCharacterEditId]);

  const editLocalCharacter = (id: string) => {
    setPendingLocalCharacterEditId(id);
    localCharacters.selectCharacter(id);
  };

  const setActiveTab = (tab: DndTab) => {
    setTabSlide(null);
    setActiveTabRaw(tab);
    persistAppView('dungeons-and-dragons', 'tab', tab);
  };

  useEffect(() => {
    if (!tabSlide || tabSlide.phase === 'dragging') return undefined;
    const timeout = window.setTimeout(() => {
      if (tabSlide.phase === 'settling') {
        setActiveTabRaw(tabSlide.to);
        persistAppView('dungeons-and-dragons', 'tab', tabSlide.to);
      }
      setTabSlide(null);
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [setActiveTabRaw, tabSlide]);

  const navigateSwipeTab = (direction: 1 | -1) => {
    setActiveTab(adjacentSwipeTab(activeTab, direction));
  };

  const startBodySwipe = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const width = event.currentTarget.getBoundingClientRect().width;
    bodySwipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width,
      tab: activeTab,
      direction: null,
    };
  };

  const moveBodySwipe = (event: ReactPointerEvent<HTMLElement>) => {
    const start = bodySwipeStartRef.current;
    if (!start || !event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.buttons !== 1) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!start.direction) {
      if (absX < 12) return;
      if (absX < absY * 1.25) {
        bodySwipeStartRef.current = null;
        return;
      }
      start.direction = deltaX < 0 ? 1 : -1;
    }

    const direction = start.direction;
    const clampedDistance = Math.min(absX, start.width);
    const offset = -direction * clampedDistance;
    setTabSlide({
      from: start.tab,
      to: adjacentSwipeTab(start.tab, direction),
      direction,
      offset,
      width: start.width,
      phase: 'dragging',
    });
  };

  const endBodySwipe = (event: ReactPointerEvent<HTMLElement>) => {
    const start = bodySwipeStartRef.current;
    bodySwipeStartRef.current = null;
    if (!start || !event.isPrimary) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const direction = start.direction ?? (deltaX < 0 ? 1 : -1);
    const shouldNavigate =
      Math.abs(deltaX) >= Math.max(72, start.width * 0.22) &&
      Math.abs(deltaX) >= Math.abs(deltaY) * 1.25;

    if (!tabSlide) {
      if (shouldNavigate) navigateSwipeTab(direction);
      return;
    }

    setTabSlide((current) => {
      if (!current || current.from !== start.tab) return current;
      return {
        ...current,
        offset: shouldNavigate ? -current.direction * current.width : 0,
        phase: shouldNavigate ? 'settling' : 'canceling',
      };
    });
  };

  const createGuidedCharacter = () => {
    if (!builderForm) return;
    localCharacters.addCharacter(buildCharacterFromGuide(builderForm));
    setBuilderForm(null);
    setUndoOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) history.redo();
      else history.undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history]);

  useEffect(() => {
    const openTabMenu = () => setTabMenuOpen(true);
    window.addEventListener(DND_OPEN_TAB_MENU_EVENT, openTabMenu);
    return () => window.removeEventListener(DND_OPEN_TAB_MENU_EVENT, openTabMenu);
  }, []);

  useEffect(() => {
    const clearRestoredNavFocus = () => {
      blurDndBottomNavFocus();
      window.requestAnimationFrame(blurDndBottomNavFocus);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') clearRestoredNavFocus();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', clearRestoredNavFocus);
    window.addEventListener('pageshow', clearRestoredNavFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', clearRestoredNavFocus);
      window.removeEventListener('pageshow', clearRestoredNavFocus);
    };
  }, []);

  const confirmDelete = (mutation: () => void, options?: { title?: string; body?: string }) =>
    setPendingDelete({
      confirm: mutation,
      title: options?.title,
      body:
        options?.body ??
        `This removes it from ${character.name}. You can undo immediately after deleting.`,
    });
  const deleteById = <K extends 'attacks' | 'spells' | 'inventory' | 'features'>(
    key: K,
    id: string,
  ) => {
    confirmDelete(() => {
      setCharacter((current) => ({
        ...current,
        [key]: current[key].filter((entry) => entry.id !== id),
      }));
      setUndoOpen(true);
    });
  };

  const deleteFeat = (id: string) => {
    confirmDelete(() => {
      setCharacter((current) => ({
        ...current,
        feats: current.feats.filter((entry) => entry.id !== id),
      }));
      setUndoOpen(true);
    });
  };

  const deleteNote = (id: string) => {
    confirmDelete(() => {
      setCharacter((current) => ({
        ...current,
        notes: current.notes.filter((entry) => entry.id !== id),
      }));
      setUndoOpen(true);
    });
  };

  const addAttack = () => {
    setAttackForm({
      id: createEntryId('attack'),
      name: 'New Attack',
      kind: 'Weapon',
      range: '5 ft.',
      hitDc: formatModifier(character.proficiencyBonus + character.initiative),
      damage: '1d8',
      damageType: 'Damage',
      equipped: true,
    });
  };

  const saveAttack = () => {
    if (!attackForm) return;
    setCharacter((current) => ({
      ...current,
      attacks: current.attacks.some((attack) => attack.id === attackForm.id)
        ? current.attacks.map((attack) => (attack.id === attackForm.id ? attackForm : attack))
        : [...current.attacks, attackForm],
    }));
    setAttackForm(null);
  };

  const toggleAttackEquipped = (id: string) => {
    setCharacter((current) => ({
      ...current,
      attacks: current.attacks.map((attack) =>
        attack.id === id ? { ...attack, equipped: !attack.equipped } : attack,
      ),
    }));
    setUndoOpen(true);
  };

  const openCustomSpellForm = () => {
    setSpellForm({
      id: createEntryId('spell'),
      name: 'New Spell',
      level: '1st Level',
      school: 'Arcane',
      castingTime: '1 Action',
      range: '60 ft.',
      hitDc: formatModifier(character.spellcasting.attackBonus),
      effect: 'Utility',
      components: 'V, S',
      duration: 'Instantaneous',
      source: 'Custom',
      prepared: false,
    });
  };

  const addCatalogSpellToCharacter = (spell: SpellCatalogEntry) => {
    if (!characterCanAddSpellForSlots(spell, character.spellcasting.slots)) return;
    setCharacter((current) => ({
      ...current,
      spells: [
        ...current.spells,
        {
          id: createEntryId('spell'),
          ...spell,
          prepared: false,
        },
      ],
    }));
    setSpellCatalogOpen(false);
    setUndoOpen(true);
  };

  const openCustomSpellFromCatalog = () => {
    setSpellCatalogOpen(false);
    openCustomSpellForm();
  };

  const saveSpell = () => {
    if (!spellForm) return;
    const isExistingSpell = character.spells.some((spell) => spell.id === spellForm.id);
    if (!isExistingSpell && !characterCanAddSpellForSlots(spellForm, character.spellcasting.slots))
      return;
    setCharacter((current) => ({
      ...current,
      spells: current.spells.some((spell) => spell.id === spellForm.id)
        ? current.spells.map((spell) => (spell.id === spellForm.id ? spellForm : spell))
        : [...current.spells, spellForm],
    }));
    setSpellForm(null);
  };

  const toggleSpellPrepared = (id: string) => {
    setCharacter((current) => ({
      ...current,
      spells: current.spells.map((spell) =>
        spell.id === id ? { ...spell, prepared: !spell.prepared } : spell,
      ),
    }));
  };

  const saveSpellcasting = () => {
    if (!spellcastingForm) return;
    setCharacter((current) => ({
      ...current,
      spellcasting: {
        ...current.spellcasting,
        ability: isAbilityKey(spellcastingForm.ability)
          ? spellcastingForm.ability
          : current.spellcasting.ability,
        saveDc: parseIntOrFallback(spellcastingForm.saveDc, current.spellcasting.saveDc),
        attackBonus: parseIntOrFallback(
          spellcastingForm.attackBonus,
          current.spellcasting.attackBonus,
        ),
        slots: parseSpellSlots(spellcastingForm.slots, current.spellcasting.slots),
      },
    }));
    setSpellcastingForm(null);
  };

  const openCustomItemFromCatalog = () => {
    setItemCatalogOpen(false);
    setItemForm({
      id: createEntryId('item'),
      name: 'New Item',
      category: 'Adventuring Gear',
      weight: '--',
      quantity: '1',
      cost: '--',
      equipped: false,
    });
  };

  const addItem = () => {
    setItemCatalogOpen(true);
  };

  const addCatalogItemToCharacter = (item: ItemCatalogEntry) => {
    setCharacter((current) => ({
      ...current,
      inventory: [...current.inventory, catalogItemToInventoryItem(item)],
    }));
    setItemCatalogOpen(false);
    setUndoOpen(true);
  };

  const quickAddCatalogItemToCharacter = (item: ItemCatalogEntry) => {
    setCharacter((current) => ({
      ...current,
      inventory: [...current.inventory, catalogItemToInventoryItem(item)],
    }));
    setItemAddedToastMessage(`${item.name} added`);
    setUndoOpen(true);
  };

  const saveItem = () => {
    if (!itemForm) return;
    setCharacter((current) => ({
      ...current,
      inventory: current.inventory.some((item) => item.id === itemForm.id)
        ? current.inventory.map((item) => (item.id === itemForm.id ? itemForm : item))
        : [...current.inventory, itemForm],
    }));
    setItemForm(null);
  };

  const toggleItemEquipped = (id: string) => {
    setCharacter((current) => ({
      ...current,
      inventory: current.inventory.map((item) =>
        item.id === id ? { ...item, equipped: !item.equipped } : item,
      ),
    }));
    setUndoOpen(true);
  };

  const addFeature = () => {
    setFeatureCatalogOpen(true);
  };

  const openCustomFeatureForm = () => {
    setFeatureCatalogOpen(false);
    setFeatureForm({
      id: createEntryId('feature'),
      name: 'New Feature',
      source: character.classes[0]?.name ?? 'Class',
      summary: 'Describe what this feature allows the character to do.',
    });
  };

  const addCatalogFeatureToCharacter = (feature: FeatureCatalogEntry) => {
    setCharacter((current) => ({
      ...current,
      features: [...current.features, catalogFeatureToFeature(feature)],
    }));
    setFeatureCatalogOpen(false);
    setUndoOpen(true);
  };

  const saveFeature = () => {
    if (!featureForm) return;
    const normalizedFeature = {
      ...featureForm,
      uses: featureForm.uses
        ? {
            ...featureForm.uses,
            used: Math.max(0, Math.min(featureForm.uses.max, featureForm.uses.used)),
            max: Math.max(1, featureForm.uses.max),
          }
        : undefined,
    };
    setCharacter((current) => ({
      ...current,
      features: current.features.some((feature) => feature.id === normalizedFeature.id)
        ? current.features.map((feature) =>
            feature.id === normalizedFeature.id ? normalizedFeature : feature,
          )
        : [...current.features, normalizedFeature],
    }));
    setFeatureForm(null);
  };

  const addFeat = () => {
    setFeatCatalogOpen(true);
  };

  const openCustomFeatForm = () => {
    setFeatCatalogOpen(false);
    setFeatForm({
      id: createEntryId('feat'),
      name: 'New Feat',
      summary: 'Describe what this feat changes for the character.',
    });
  };

  const addCatalogFeatToCharacter = (feat: FeatCatalogEntry) => {
    setCharacter((current) => ({
      ...current,
      feats: [...current.feats, catalogFeatToFeat(feat)],
    }));
    setFeatCatalogOpen(false);
    setUndoOpen(true);
  };

  const saveFeat = () => {
    if (!featForm) return;
    setCharacter((current) => ({
      ...current,
      feats: current.feats.some((feat) => feat.id === featForm.id)
        ? current.feats.map((feat) => (feat.id === featForm.id ? featForm : feat))
        : [...current.feats, featForm],
    }));
    setFeatForm(null);
  };

  const saveMoney = () => {
    if (!moneyForm) return;
    setCharacter((current) => ({
      ...current,
      money: {
        cp: parseIntOrFallback(moneyForm.cp, current.money.cp),
        sp: parseIntOrFallback(moneyForm.sp, current.money.sp),
        ep: parseIntOrFallback(moneyForm.ep, current.money.ep),
        gp: parseIntOrFallback(moneyForm.gp, current.money.gp),
        pp: parseIntOrFallback(moneyForm.pp, current.money.pp),
      },
    }));
    setMoneyForm(null);
  };

  const saveCharacter = () => {
    if (!characterForm) return;
    if (getCharacterClassFormErrors(characterForm).length > 0) return;
    const nextClasses = characterForm.classes
      .map((entry, index) => {
        const name = entry.name.trim() || (index === 0 ? 'Adventurer' : '');
        const subclass = entry.subclass.trim();
        return {
          name,
          level: Math.max(1, parseIntOrFallback(entry.level, character.classes[index]?.level ?? 1)),
          subclass: subclass || undefined,
        };
      })
      .filter((entry) => entry.name.length > 0);
    setCharacter((current) => {
      const derivedClassFields = deriveDndClassFields({
        classes: nextClasses,
        catalogByName: dndClassCatalogByName,
        currentHitDicePools: current.hitPoints.hitDicePools,
        existingFeatureIds: new Set(current.features.map((feature) => feature.id)),
      });
      const nextProficiencyBonus = parseIntOrFallback(
        characterForm.proficiencyBonus,
        current.proficiencyBonus,
      );

      return {
        ...current,
        name: characterForm.name.trim() || current.name,
        species: characterForm.species.trim() || current.species,
        background: characterForm.background.trim() || current.background,
        alignment: characterForm.alignment.trim() || current.alignment,
        classes: nextClasses,
        level: nextClasses.reduce((sum, entry) => sum + entry.level, 0),
        armorClass: parseIntOrFallback(characterForm.armorClass, current.armorClass),
        initiative: parseIntOrFallback(characterForm.initiative, current.initiative),
        speed: parseIntOrFallback(characterForm.speed, current.speed),
        proficiencyBonus: nextProficiencyBonus,
        abilities: current.abilities.map((ability) => ({
          ...ability,
          score: characterForm.abilityScores[ability.key] ?? ability.score,
          saveBonus:
            abilityModifier(characterForm.abilityScores[ability.key] ?? ability.score) +
            (ability.proficientSave ? nextProficiencyBonus : 0),
          proficientSave: derivedClassFields.hasSavingThrowData
            ? derivedClassFields.savingThrowKeys.includes(ability.key)
            : ability.proficientSave,
        })),
        skills: current.skills.map((skill) => ({
          ...skill,
          bonus:
            abilityModifier(characterForm.abilityScores[skill.ability] ?? 10) +
            (skill.proficient ? nextProficiencyBonus : 0) +
            (skill.expertise ? nextProficiencyBonus : 0),
        })),
        hitPoints: {
          ...current.hitPoints,
          hitDice: derivedClassFields.hitDice || current.hitPoints.hitDice,
          hitDicePools:
            derivedClassFields.hitDicePools.length > 0
              ? derivedClassFields.hitDicePools
              : current.hitPoints.hitDicePools,
        },
        spellcasting: derivedClassFields.spellcastingAbility
          ? { ...current.spellcasting, ability: derivedClassFields.spellcastingAbility }
          : current.spellcasting,
        proficiencies: [
          ...new Set(
            [...current.proficiencies, ...derivedClassFields.proficiencies].filter(Boolean),
          ),
        ],
        features: [...current.features, ...derivedClassFields.features],
        spells: characterForm.spells,
      };
    });
    setCharacterForm(null);
  };

  const saveHitPoints = () => {
    if (!hitPointForm) return;
    setCharacter((current) => ({
      ...current,
      hitPoints: {
        ...current.hitPoints,
        current: parseIntOrFallback(hitPointForm.current, current.hitPoints.current),
        max: parseIntOrFallback(hitPointForm.max, current.hitPoints.max),
        temp: parseIntOrFallback(hitPointForm.temp, current.hitPoints.temp),
        hitDice: hitPointForm.hitDice.trim() || current.hitPoints.hitDice,
        hitDicePools: parseHitDicePools(
          hitPointForm.hitDice.trim(),
          current.hitPoints.hitDicePools,
        ),
        deathSaves: {
          successes: parseIntOrFallback(
            hitPointForm.deathSuccesses,
            current.hitPoints.deathSaves.successes,
          ),
          failures: parseIntOrFallback(
            hitPointForm.deathFailures,
            current.hitPoints.deathSaves.failures,
          ),
        },
      },
    }));
    setHitPointForm(null);
  };

  const saveAbilities = () => {
    if (!abilityForm) return;
    setCharacter((current) => ({
      ...current,
      abilities: current.abilities.map((ability) => {
        const next = abilityForm.abilities.find((entry) => entry.key === ability.key);
        return next
          ? {
              ...ability,
              score: parseIntOrFallback(next.score, ability.score),
              saveBonus: parseIntOrFallback(next.saveBonus, ability.saveBonus),
              proficientSave: next.proficientSave,
            }
          : ability;
      }),
      passivePerception: parseIntOrFallback(
        abilityForm.passivePerception,
        current.passivePerception,
      ),
      passiveInvestigation: parseIntOrFallback(
        abilityForm.passiveInvestigation,
        current.passiveInvestigation,
      ),
      passiveInsight: parseIntOrFallback(abilityForm.passiveInsight, current.passiveInsight),
    }));
    setAbilityForm(null);
  };

  const saveSkills = () => {
    if (!skillForm) return;
    setCharacter((current) => ({
      ...current,
      skills: current.skills.map((skill) => {
        const next = skillForm.find((entry) => entry.name === skill.name);
        return next
          ? {
              ...skill,
              ability: isAbilityKey(next.ability) ? next.ability : skill.ability,
              bonus: parseIntOrFallback(next.bonus, skill.bonus),
              proficient: next.proficient,
              expertise: next.expertise,
            }
          : skill;
      }),
    }));
    setSkillForm(null);
  };

  const saveProficiencies = () => {
    if (!proficiencyForm) return;
    setCharacter((current) => ({
      ...current,
      proficiencies: parseEditableList(proficiencyForm.proficiencies),
      languages: parseEditableList(proficiencyForm.languages),
    }));
    setProficiencyForm(null);
  };

  const saveBackground = () => {
    if (!backgroundForm) return;
    setCharacter((current) => ({
      ...current,
      background: backgroundForm.background.trim() || current.background,
      alignment: backgroundForm.alignment.trim() || current.alignment,
      personality: {
        traits: backgroundForm.traits.trim(),
        ideals: backgroundForm.ideals.trim(),
        bonds: backgroundForm.bonds.trim(),
        flaws: backgroundForm.flaws.trim(),
        backstory: backgroundForm.backstory.trim(),
      },
    }));
    setBackgroundForm(null);
  };

  const saveNote = () => {
    if (!noteForm) return;
    setCharacter((current) => ({
      ...current,
      notes: current.notes.some((note) => note.id === noteForm.id)
        ? current.notes.map((note) => (note.id === noteForm.id ? noteForm : note))
        : [...current.notes, noteForm],
    }));
    setNoteForm(null);
  };

  const updateFeatureUses = (id: string, nextUsed: number) => {
    setCharacter((current) => ({
      ...current,
      features: current.features.map((feature) => {
        if (feature.id !== id || !feature.uses) return feature;
        return {
          ...feature,
          uses: {
            ...feature.uses,
            used: Math.min(feature.uses.max, Math.max(0, nextUsed)),
          },
        };
      }),
    }));
  };

  const applyRest = (restType: RestType) => {
    setCharacter(applyDndRest(character, restType));
    setRestOpen(false);
    setUndoOpen(true);
  };

  const spendHitDie = (die: string) => {
    const result = spendDndHitDie(character, die);
    if (!result.didSpend) return;
    setCharacter(result.character);
    setUndoOpen(true);
  };

  const toggleInspiration = () => {
    setCharacter((current) => ({ ...current, inspiration: !current.inspiration }));
  };

  const toggleCondition = (condition: string) => {
    setCharacter((current) => ({
      ...current,
      conditions: current.conditions.includes(condition)
        ? current.conditions.filter((entry) => entry !== condition)
        : [...current.conditions, condition],
    }));
    setUndoOpen(true);
  };

  const setExhaustion = (level: number) => {
    setCharacter((current) => ({
      ...current,
      exhaustion: Math.max(0, Math.min(6, level)),
    }));
    setUndoOpen(true);
  };

  const updateSpellSlot = (level: string, used: number) => {
    setCharacter((current) => ({
      ...current,
      spellcasting: {
        ...current.spellcasting,
        slots: current.spellcasting.slots.map((slot) =>
          slot.level === level ? { ...slot, used: Math.min(slot.max, Math.max(0, used)) } : slot,
        ),
      },
    }));
  };

  const castSpell = (spell: Spell) => {
    const slotLevel = getSpellSlotLevel(spell.level);
    if (!slotLevel) return true;

    const matchingSlot = findUsableSpellSlot(character.spellcasting.slots, slotLevel);
    if (!matchingSlot) return false;

    setCharacter((current) => {
      return {
        ...current,
        spellcasting: {
          ...current.spellcasting,
          slots: current.spellcasting.slots.map((slot) =>
            slot.level === matchingSlot.level
              ? { ...slot, used: Math.min(slot.max, slot.used + 1) }
              : slot,
          ),
        },
      };
    });
    setUndoOpen(true);
    return true;
  };

  const viewActionDetails = (attack: Attack) => {
    const normalizedAttackName = normalizeDndLookupName(attack.name);
    const matchingSpell =
      character.spells.find(
        (spell) => normalizeDndLookupName(spell.name) === normalizedAttackName,
      ) ?? getKnownSpellData(attack.name);
    const isSpellAction = /\b(cantrip|spell)\b/iu.test(attack.kind) || Boolean(matchingSpell);

    if (isSpellAction) {
      setSpellDetails(
        matchingSpell
          ? {
              ...matchingSpell,
              id: 'id' in matchingSpell ? matchingSpell.id : attack.id,
              prepared:
                'prepared' in matchingSpell && typeof matchingSpell.prepared === 'boolean'
                  ? matchingSpell.prepared
                  : false,
            }
          : {
              id: attack.id,
              name: attack.name,
              level: /\bcantrip\b/iu.test(attack.kind) ? 'Cantrip' : 'Spell',
              school: 'Unknown',
              castingTime: '1 action',
              range: attack.range,
              hitDc: attack.hitDc,
              damage: attack.damage,
              effect: `${attack.damage} ${formatDamageTypeLabel(attack.damageType)}`,
              description: 'No description has been recorded for this spell action yet.',
              source: attack.kind,
            },
      );
      return;
    }

    const matchingItemByExactName = character.inventory.find(
      (item) => normalizeDndLookupName(item.name) === normalizedAttackName,
    );
    const attackNameTokens = new Set(
      normalizedAttackName.split(' ').filter((token) => token.length > 2),
    );
    const matchingItemByTokens = character.inventory.find((item) => {
      const itemName = normalizeDndLookupName(item.name);
      const itemTokens = itemName.split(' ').filter((token) => token.length > 2);
      return itemTokens.length > 0 && itemTokens.every((token) => attackNameTokens.has(token));
    });
    const matchingItem = matchingItemByExactName ?? matchingItemByTokens;

    setItemDetails(
      matchingItem ?? {
        id: attack.id,
        name: attack.name,
        category: attack.kind || 'Action',
        weight: '--',
        quantity: '1',
        cost: '--',
        damage: attack.damage,
        damageType: formatDamageTypeLabel(attack.damageType),
        description: `Range: ${attack.range}. Hit/DC: ${attack.hitDc}. Damage: ${attack.damage} ${formatDamageTypeLabel(attack.damageType)}.`,
        equipped: attack.equipped,
      },
    );
  };

  const renderTabContent = (tab: DndTab) => {
    switch (tab) {
      case 'abilities':
        return (
          <AbilitiesScreen
            character={character}
            onEditStats={() => setAbilityForm(createAbilityForm(character))}
          />
        );
      case 'conditions':
        return (
          <ConditionsScreen
            character={character}
            onToggleCondition={toggleCondition}
            onSetExhaustion={setExhaustion}
          />
        );
      case 'skills':
        return (
          <SkillsScreen
            character={character}
            onEditSkills={() => setSkillForm(createSkillForm(character))}
          />
        );
      case 'actions':
        return (
          <ActionsScreen
            character={character}
            onAddAttack={addAttack}
            onEditAttack={(attack) => setAttackForm({ ...attack })}
            onViewAttack={viewActionDetails}
            onDeleteAttack={(id) => deleteById('attacks', id)}
            onToggleAttackEquipped={toggleAttackEquipped}
          />
        );
      case 'spells':
        return (
          <SpellsScreen
            character={character}
            onAddSpell={() => setSpellCatalogOpen(true)}
            onEditSpell={(spell) => setSpellForm({ ...spell })}
            onEditSpellcasting={() => setSpellcastingForm(createSpellcastingForm(character))}
            onDeleteSpell={(id) => deleteById('spells', id)}
            onTogglePrepared={toggleSpellPrepared}
            onUpdateSpellSlot={updateSpellSlot}
            onCastSpell={castSpell}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen
            character={character}
            onAddItem={addItem}
            onEditItem={(item) => setItemForm({ ...item })}
            onViewItem={(item) => setItemDetails(item)}
            onDeleteItem={(id) => deleteById('inventory', id)}
            onEditMoney={() => setMoneyForm(createMoneyForm(character.money))}
            onToggleItemEquipped={toggleItemEquipped}
          />
        );
      case 'features':
        return (
          <MoreScreen activeTab={tab} onSelectTab={setActiveTab}>
            <FeaturesScreen
              character={character}
              classCatalogByName={dndClassCatalogByName}
              onAddFeature={addFeature}
              onEditFeature={(feature) =>
                setFeatureForm({
                  ...feature,
                  uses: feature.uses ? { ...feature.uses } : undefined,
                })
              }
              onAddFeat={addFeat}
              onEditFeat={(feat) => setFeatForm({ ...feat })}
              onDeleteFeat={deleteFeat}
              onEditProficiencies={() => setProficiencyForm(createProficiencyForm(character))}
              onDeleteFeature={(id) => deleteById('features', id)}
              onUpdateFeatureUses={updateFeatureUses}
              embedded
            />
          </MoreScreen>
        );
      case 'background':
        return (
          <MoreScreen activeTab={tab} onSelectTab={setActiveTab}>
            <BackgroundScreen
              character={character}
              onEditBackground={() => setBackgroundForm(createBackgroundForm(character))}
              embedded
            />
          </MoreScreen>
        );
      case 'notes':
        return (
          <MoreScreen activeTab={tab} onSelectTab={setActiveTab}>
            <NotesScreen
              character={character}
              onAddNote={() =>
                setNoteForm({
                  id: createEntryId('note'),
                  title: 'New Note',
                  body: '',
                })
              }
              onEditNote={(note) => setNoteForm({ ...note })}
              onDeleteNote={deleteNote}
              embedded
            />
          </MoreScreen>
        );
      default:
        return <AppMenu activeTab={tab} onChange={setActiveTab} />;
    }
  };

  const content = renderTabContent(activeTab);

  return (
    <Box
      data-pw="dnd-app"
      sx={{
        height: '100vh',
        width: '100vw',
        bgcolor: dndColors.page,
        display: 'grid',
        placeItems: { xs: 'stretch', md: 'center' },
        overflow: 'hidden',
      }}
    >
      <ErrorBoundary
        fallbackRender={() => null}
        onError={(error) => {
          console.warn('Dungeons & Dragons Convex sync is unavailable; continuing locally.', error);
        }}
      >
        {localCharacters.hydrated ? <ConvexCharacterSyncMount /> : null}
      </ErrorBoundary>
      <Box
        sx={{
          position: 'relative',
          width: { xs: '100vw', md: 430 },
          height: { xs: '100vh', md: 'min(900px, 100vh)' },
          bgcolor: dndColors.page,
          color: dndColors.text,
          overflow: 'hidden',
          boxShadow: { xs: 'none', md: '0 0 60px rgba(0,0,0,0.5)' },
        }}
      >
        <Box sx={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <HeroHeader
            character={character}
            onEditCharacter={() => setCharacterForm(createCharacterForm(character))}
            onEditHitPoints={() => setHitPointForm(createHitPointForm(character))}
            onOpenRest={() => setRestOpen(true)}
            restOpen={restOpen}
            onToggleInspiration={toggleInspiration}
            homeAction={
              <IconButton
                component={Link}
                to="/"
                aria-label="Back to Table Top home"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '8px',
                  bgcolor: alpha(dndColors.panelSoft, 0.86),
                  color: dndColors.text,
                  '&:hover': {
                    bgcolor: dndColors.panelSoft,
                  },
                }}
              >
                <House size={22} strokeWidth={2} />
              </IconButton>
            }
            accountAction={
              <AccountSettings
                gameSystem={DND_GAME_SYSTEM}
                localCharacterName={character.name}
                localCharacters={localCharacters}
                createCharacterPayload={() => {
                  const nextCharacter = createDndCharacter();
                  return {
                    schemaVersion: DND_SCHEMA_VERSION,
                    characterState: serializeDndCharacter(nextCharacter),
                  };
                }}
                onSelectCharacterState={selectRemoteCharacter}
                onEditLocalCharacter={editLocalCharacter}
                selectCharacterEventName={DND_SELECT_CHARACTER_EVENT}
                triggerSx={{
                  bgcolor: alpha(dndColors.panelSoft, 0.86),
                  border: `1px solid ${dndColors.borderSoft}`,
                  color: dndColors.text,
                  boxShadow: `inset 0 0 18px ${alpha('#000000', 0.12)}`,
                  '&:hover': {
                    bgcolor: dndColors.panelSoft,
                  },
                  '& .MuiAvatar-root': {
                    bgcolor: dndColors.panelStrong,
                    color: dndColors.text,
                  },
                }}
              />
            }
          />
          <Box
            onPointerDown={startBodySwipe}
            onPointerMove={moveBodySwipe}
            onPointerUp={endBodySwipe}
            onPointerCancel={() => {
              bodySwipeStartRef.current = null;
              setTabSlide((current) =>
                current && current.phase === 'dragging'
                  ? { ...current, offset: 0, phase: 'canceling' }
                  : current,
              );
            }}
            sx={{ overflow: 'hidden', touchAction: 'pan-y' }}
          >
            {tabSlide ? (
              <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ pointerEvents: 'none', visibility: 'hidden' }}>
                  {renderTabContent(tabSlide.phase === 'settling' ? tabSlide.to : tabSlide.from)}
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    transform: `translate3d(${tabSlide.offset}px, 0, 0)`,
                    transition: tabSlide.phase === 'dragging' ? 'none' : 'transform 220ms ease-out',
                    pointerEvents: 'none',
                    willChange: 'transform',
                  }}
                >
                  {renderTabContent(tabSlide.from)}
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    transform: `translate3d(${tabSlide.offset + tabSlide.direction * tabSlide.width}px, 0, 0)`,
                    transition: tabSlide.phase === 'dragging' ? 'none' : 'transform 220ms ease-out',
                    pointerEvents: 'none',
                    willChange: 'transform',
                  }}
                >
                  {renderTabContent(tabSlide.to)}
                </Box>
              </Box>
            ) : (
              content
            )}
          </Box>
        </Box>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        <UndoToast
          open={undoOpen}
          onUndo={() => {
            history.undo();
            setUndoOpen(false);
          }}
          onClose={() => setUndoOpen(false)}
        />
        <ItemAddedToast
          message={itemAddedToastMessage}
          onClose={() => setItemAddedToastMessage(null)}
        />
        <ConfirmDeleteDialog
          open={pendingDelete !== null}
          title={pendingDelete?.title}
          body={pendingDelete?.body ?? ''}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            pendingDelete?.confirm();
            setPendingDelete(null);
          }}
        />
        <CharacterSwitcherDialog
          open={charactersOpen}
          characters={localCharacters.characters}
          canAdd={localCharacters.canAdd}
          limit={localCharacters.limit}
          onAdd={localCharacters.addCharacter}
          onSelect={localCharacters.selectCharacter}
          onDelete={(id) => {
            const characterToDelete = localCharacters.characters.find((entry) => entry.id === id);
            setCharactersOpen(false);
            confirmDelete(
              () => {
                localCharacters.deleteCharacter(id);
                setUndoOpen(false);
              },
              {
                title: characterToDelete
                  ? `Delete ${characterToDelete.name}?`
                  : 'Delete this character?',
                body: characterToDelete
                  ? `This removes ${characterToDelete.name} from this device.`
                  : 'This removes the local DnD character slot from this device.',
              },
            );
          }}
          onClose={() => setCharactersOpen(false)}
        />
        <RestDialog
          open={restOpen}
          character={character}
          onClose={() => setRestOpen(false)}
          onApplyRest={applyRest}
          onSpendHitDie={spendHitDie}
        />
        <TabMenuDialog
          open={tabMenuOpen}
          activeTab={activeTab}
          onClose={() => setTabMenuOpen(false)}
          onSelectTab={setActiveTab}
        />
        <CharacterEditDialog
          open={characterForm !== null}
          form={characterForm}
          classOptions={dndClassOptions}
          classCatalogByName={dndClassCatalogByName}
          featureCatalog={dndFeatureOptions}
          subclassOptionsByClassName={dndSubclassOptionsByClassName}
          spellCatalog={spellCatalogSource}
          availableSpellSlots={character.spellcasting.slots}
          onChange={setCharacterForm}
          onCancel={() => setCharacterForm(null)}
          onSave={saveCharacter}
        />
        <CharacterBuilderDialog
          open={builderForm !== null}
          form={builderForm}
          classOptions={dndClassOptions}
          onChange={setBuilderForm}
          onCancel={() => setBuilderForm(null)}
          onCreate={createGuidedCharacter}
        />
        <HitPointEditDialog
          open={hitPointForm !== null}
          form={hitPointForm}
          onChange={setHitPointForm}
          onCancel={() => setHitPointForm(null)}
          onSave={saveHitPoints}
        />
        <AttackEditDialog
          open={attackForm !== null}
          form={attackForm}
          onChange={setAttackForm}
          onCancel={() => setAttackForm(null)}
          onSave={saveAttack}
        />
        <SpellEditDialog
          open={spellForm !== null}
          form={spellForm}
          spellCatalog={spellCatalogOptions}
          canSelectCatalogSpell={(spell) =>
            characterCanAddSpellForSlots(spell, character.spellcasting.slots)
          }
          onChange={setSpellForm}
          onCancel={() => setSpellForm(null)}
          onSave={saveSpell}
        />
        <SpellCatalogDialog
          open={spellCatalogOpen}
          spells={spellCatalogOptions}
          onCreateCustom={openCustomSpellFromCatalog}
          onSelect={addCatalogSpellToCharacter}
          canSelectSpell={(spell) =>
            characterCanAddSpellForSlots(spell, character.spellcasting.slots)
          }
          onClose={() => setSpellCatalogOpen(false)}
        />
        <SpellcastingEditDialog
          open={spellcastingForm !== null}
          form={spellcastingForm}
          onChange={setSpellcastingForm}
          onCancel={() => setSpellcastingForm(null)}
          onSave={saveSpellcasting}
        />
        <ItemCatalogDialog
          open={itemCatalogOpen}
          items={itemCatalogOptions}
          onCreateCustom={openCustomItemFromCatalog}
          onSelect={addCatalogItemToCharacter}
          onQuickAdd={quickAddCatalogItemToCharacter}
          onClose={() => setItemCatalogOpen(false)}
        />
        <TextCatalogDialog
          open={featureCatalogOpen}
          title="Features"
          searchPlaceholder="Search features"
          customLabel="Custom Feature"
          emptyLabel="No features match your search."
          entries={dndFeatureOptions}
          getMeta={(feature) =>
            [
              feature.category,
              feature.className ?? feature.source,
              feature.subclassName,
              typeof feature.level === 'number' ? `Level ${feature.level}` : null,
            ].filter((value): value is string => Boolean(value))
          }
          icon={<PersonIcon sx={{ fontSize: 30 }} />}
          onCreateCustom={openCustomFeatureForm}
          onSelect={addCatalogFeatureToCharacter}
          onClose={() => setFeatureCatalogOpen(false)}
        />
        <TextCatalogDialog
          open={featCatalogOpen}
          title="Feats"
          searchPlaceholder="Search feats"
          customLabel="Custom Feat"
          emptyLabel="No feats match your search."
          entries={dndFeatOptions}
          getMeta={(feat) =>
            [feat.category, feat.prerequisite ? `Prerequisite: ${feat.prerequisite}` : null].filter(
              (value): value is string => Boolean(value),
            )
          }
          icon={<AutoAwesomeIcon sx={{ fontSize: 30 }} />}
          onCreateCustom={openCustomFeatForm}
          onSelect={addCatalogFeatToCharacter}
          onClose={() => setFeatCatalogOpen(false)}
        />
        <SpellDetailsDialog spell={spellDetails} onClose={() => setSpellDetails(null)} />
        <ItemDetailsDialog item={itemDetails} onClose={() => setItemDetails(null)} />
        <ItemEditDialog
          open={itemForm !== null}
          form={itemForm}
          title={
            character.inventory.some((item) => item.id === itemForm?.id)
              ? 'Edit Item'
              : 'Create Item'
          }
          onChange={setItemForm}
          onCancel={() => setItemForm(null)}
          onSave={saveItem}
        />
        <FeatureEditDialog
          open={featureForm !== null}
          form={featureForm}
          onChange={setFeatureForm}
          onCancel={() => setFeatureForm(null)}
          onSave={saveFeature}
          onDelete={(id) => {
            setFeatureForm(null);
            deleteById('features', id);
          }}
        />
        <MoneyEditDialog
          open={moneyForm !== null}
          form={moneyForm}
          onChange={setMoneyForm}
          onCancel={() => setMoneyForm(null)}
          onSave={saveMoney}
        />
        <FeatEditDialog
          open={featForm !== null}
          form={featForm}
          onChange={setFeatForm}
          onCancel={() => setFeatForm(null)}
          onSave={saveFeat}
        />
        <ProficiencyEditDialog
          open={proficiencyForm !== null}
          form={proficiencyForm}
          onChange={setProficiencyForm}
          onCancel={() => setProficiencyForm(null)}
          onSave={saveProficiencies}
        />
        <AbilityEditDialog
          open={abilityForm !== null}
          form={abilityForm}
          skills={character.skills}
          proficiencyBonus={character.proficiencyBonus}
          onChange={setAbilityForm}
          onCancel={() => setAbilityForm(null)}
          onSave={saveAbilities}
        />
        <SkillEditDialog
          open={skillForm !== null}
          form={skillForm}
          abilities={character.abilities}
          proficiencyBonus={character.proficiencyBonus}
          onChange={setSkillForm}
          onCancel={() => setSkillForm(null)}
          onSave={saveSkills}
        />
        <BackgroundEditDialog
          open={backgroundForm !== null}
          form={backgroundForm}
          onChange={setBackgroundForm}
          onCancel={() => setBackgroundForm(null)}
          onSave={saveBackground}
        />
        <NoteEditDialog
          open={noteForm !== null}
          form={noteForm}
          onChange={setNoteForm}
          onCancel={() => setNoteForm(null)}
          onSave={saveNote}
        />
      </Box>
    </Box>
  );
}

export default DungeonsAndDragons;
