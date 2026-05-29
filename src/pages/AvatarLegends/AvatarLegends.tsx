import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import InputBase from '@mui/material/InputBase';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { atom, useAtom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Backpack, HandFist, Pencil, Trash2 } from 'lucide-react';

import { SwipeableCard } from '@/components/SwipeableCard';
import AccountSettings from '@/sections/AccountSettings';
import { createCharacterHistory } from '@/state/createCharacterHistory';
import { useConvexCharacterSync } from '@/sync/useConvexCharacterSync';
import { useThemeMode } from '@/theme/hooks';

// White training symbols extracted from the Avatar Legends training reference pages.
// They are transparent PNGs and rely on the deep-ink filter band for contrast.
import elementAir from './assets/airbending-symbol.png';
import elementEarth from './assets/earthbending-symbol.png';
import elementFire from './assets/firebending-symbol.png';
import elementTech from './assets/technology-symbol.png';
import elementWater from './assets/waterbending-symbol.png';
import elementMartial from './assets/weapons-symbol.png';

// Outer-mat gradients used behind the parchment card. Theme-aware.
const lightPageBg = 'linear-gradient(140deg, #162a45 0%, #0e2e4a 50%, #162a45 100%)';
// Dark mode mat: slate-blue gradient — guided by the AL cover art's
// deep twilight, halfway between the prior gray mat and full navy.
const darkPageBg = 'linear-gradient(140deg, #060a11 0%, #0c131c 50%, #060a11 100%)';

type AvatarTab = 'character' | 'moves' | 'combat' | 'backpack';

type TabConfig = {
  label: string;
  value: AvatarTab;
  // Either provide an image icon (iconSrc) or a custom inline icon (renderIcon).
  // The Moves tab uses the signature diamond-in-diamond glyph rendered inline.
  iconSrc?: string;
  renderIcon?: (props: { color: string; size: number }) => React.ReactNode;
};

// Theme-aware palette. The values below are mutable `let`s; the
// AvatarLegends component reassigns them at the start of every render based
// on the global light/dark theme mode so every helper component picks up
// the active palette on its next render.
type AvPaletteShape = {
  parchment: string;
  parchmentLight: string;
  parchmentDeep: string;
  washDeep: string;
  ink: string;
  deepInk: string;
  brown: string;
  brownSoft: string;
  border: string;
  ember: string;
  /** Dark-red accent. Reserved for semantic-warning surfaces — Fatigue
   *  diamonds, Conditions, Negative Statuses. Used sparingly. */
  gold: string;
  // Red used for the Passion stat label and the Advance & Attack category
  // eyebrow. In light mode each keeps a distinct warm shade; in dark mode
  // both flip to the Fatigue-diamond accent (= `gold`) so the reds match.
  passionRed: string;
  attackRed: string;
  /** Main decorative accent. Light dusty-blue sampled from the heading
   *  divider line in the official rulebook layout. Replaces most of the
   *  decorative dark-red usage in light mode (dividers, ornaments,
   *  bullets, active-state pills). */
  accent: string;
  /** Warm "book" highlight used for the class-name eyebrow, the
   *  Influence label / dots, and the Conditions buttons. Light mode
   *  keeps the rulebook's warm red; dark mode flips to a muted gold
   *  sampled from the rulebook chapter headings ("The Trainings",
   *  "Waterbending", etc.). */
  bookAccent: string;
};

const lightAvPalette: AvPaletteShape = {
  // Watercolor-blue palette sampled from the brush-stroke wash on the
  // character sheet.
  parchment: '#e3ecf4',
  parchmentLight: '#f3f7fb',
  parchmentDeep: '#cdd9e5',
  washDeep: '#6f9bba',
  ink: '#23456b',
  // Header / footer brush-stroke band — pinned to the dark-mode
  // slate-blue chrome so the header reads identically across both
  // themes.
  deepInk: '#111a24',
  brown: '#3a4e63',
  brownSoft: '#5a6f86',
  border: '#b1c3d3',
  ember: '#a8413a',
  gold: '#7a2424',
  passionRed: '#bc5753',
  attackRed: '#a8413a',
  // Pale dusty-blue from the rulebook heading-divider line.
  accent: '#a8c5d4',
  // Muted gold from the rulebook chapter headings — used for the
  // class-name eyebrow, Influence label / dots, and Conditions buttons.
  // Light mode now uses the same gold as dark mode for a unified
  // book-style highlight across themes.
  bookAccent: '#c8a460',
};

const darkAvPalette: AvPaletteShape = {
  // Dark mode: slate-blue palette guided by the Avatar Legends cover
  // art's deep twilight sky. Sits roughly halfway between the prior
  // gray palette and the original cover-art navy — enough blue to read
  // as slate-blue, not enough to feel fully saturated navy.
  parchment: '#0c131c', // card / panel bg
  parchmentLight: '#161e29', // slightly lifted slate for elevated cards
  parchmentDeep: '#060a11', // recessed pocket
  washDeep: '#818e9c', // atmospheric mountain-haze slate
  ink: '#eff2f8', // near-white body / heading text
  // Chrome band — slate-blue chrome that still ties to the AL cover
  // navy but stays softer than full saturation.
  deepInk: '#111a24',
  brown: '#e4ebf5', // body text (slight blue lift)
  brownSoft: '#c3ccd9', // secondary text
  border: '#2d3947', // subtle slate-blue border
  ember: '#d56b5f', // muted brick-red accent (cover scrollwork warm tone)
  // `gold` is the dark-red accent used by Fatigue diamonds, Conditions,
  // and Negative Statuses. Pinned to the same value as light mode so the
  // dark-red reads identically in both modes.
  gold: '#7a2424',
  // Passion stat label + Advance & Attack eyebrow keep the brighter
  // cover-art red so they stay legible against the gray body.
  passionRed: '#e35f53',
  attackRed: '#c84a3e',
  // Pale slate-blue accent — divider / decorative tone that reads
  // against the deeper slate-blue surfaces.
  accent: '#859fb2',
  // Muted gold sampled from the rulebook chapter headings — used for
  // the class-name eyebrow, Influence label / dots, and the Conditions
  // buttons in dark mode (replaces the dark-red those surfaces show
  // in light mode).
  bookAccent: '#c8a460',
};

// Mutable swappable colors — re-assigned by AvatarLegends before its
// children render. Components keep referencing these as if they were
// module-level constants.
let parchment = lightAvPalette.parchment;
let parchmentLight = lightAvPalette.parchmentLight;
let parchmentDeep = lightAvPalette.parchmentDeep;
let washDeep = lightAvPalette.washDeep;
let ink = lightAvPalette.ink;
let deepInk = lightAvPalette.deepInk;
let brown = lightAvPalette.brown;
let brownSoft = lightAvPalette.brownSoft;
let border = lightAvPalette.border;
// `ember` is currently unreferenced (Backpack + class-name eyebrows
// were migrated to `bookAccent`), but the palette field stays around
// for future warm-accent surfaces. Suppress the unused-let warning by
// reading and re-applying it through the swap below.
let _ember = lightAvPalette.ember;
void _ember;
let passionRed = lightAvPalette.passionRed;
let attackRed = lightAvPalette.attackRed;
let accent = lightAvPalette.accent;
let bookAccent = lightAvPalette.bookAccent;

function applyAvatarPalette(isDarkMode: boolean) {
  const next = isDarkMode ? darkAvPalette : lightAvPalette;
  parchment = next.parchment;
  parchmentLight = next.parchmentLight;
  parchmentDeep = next.parchmentDeep;
  washDeep = next.washDeep;
  ink = next.ink;
  deepInk = next.deepInk;
  brown = next.brown;
  brownSoft = next.brownSoft;
  border = next.border;
  _ember = next.ember;
  passionRed = next.passionRed;
  attackRed = next.attackRed;
  accent = next.accent;
  bookAccent = next.bookAccent;
}

// Constant near-white used for chrome surfaces that always sit on a dark
// brush-stroke background — header text, footer nav text, FilterTabs active
// chip text, corner ornaments. These never flip with theme so they stay
// readable in both light and dark mode.
const chromeText = '#f3f7fb';

// Element-specific colors stay constant — they identify the element, not
// the theme. The dark-mode stat labels use slightly brighter variants
// so the small-caps labels keep their elemental identity on slate cards.
const water = '#4a7fa8';
const earth = '#7d8c5a';
const fire = '#a8413a';
const air = '#a3bbc4';
const martial = '#3d3d4a';
const tech = '#7a5d8a';
const darkStatWater = '#6fa9d6';
const darkStatEarth = '#a3ba72';
const elementFilterFrames: Record<Exclude<TechniqueElementFilter, 'all' | 'basic'>, string> = {
  water,
  earth: '#6f8f4e',
  fire,
  air: '#d4b74b',
  martial: '#0b1018',
  tech,
};
const primaryTrainingOptions: PrimaryTraining[] = [
  'Waterbending',
  'Earthbending',
  'Firebending',
  'Airbending',
  'Weapons',
  'Technology',
];
const primaryTrainingThemes: Record<
  PrimaryTraining,
  {
    bodyWash: string;
    chromeFill: string;
    headerBorder: string;
    footerBorder: string;
    brushBorder?: boolean;
  }
> = {
  Waterbending: {
    bodyWash: `
      radial-gradient(circle at 30% 25%, ${alpha(water, 0.42)} 0%, transparent 70%),
      radial-gradient(circle at 75% 70%, ${alpha('#8bb8d4', 0.38)} 0%, transparent 65%),
      radial-gradient(circle at 50% 50%, ${alpha('#9fc2d7', 0.25)} 0%, transparent 50%),
      linear-gradient(135deg, rgba(230, 236, 245, 0.45), rgba(220, 227, 238, 0.4))
    `,
    chromeFill: 'linear-gradient(180deg, #111a24 0%, #173755 100%)',
    headerBorder: water,
    footerBorder: water,
    brushBorder: true,
  },
  Earthbending: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha(elementFilterFrames.earth, 0.38)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#9cab70', 0.32)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(232, 238, 225, 0.46), rgba(218, 229, 211, 0.4))
    `,
    chromeFill: 'linear-gradient(180deg, #111a24 0%, #24351f 100%)',
    headerBorder: elementFilterFrames.earth,
    footerBorder: '#92a66a',
  },
  Firebending: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha(fire, 0.32)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#d07a42', 0.26)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(241, 228, 221, 0.48), rgba(232, 217, 211, 0.38))
    `,
    chromeFill: 'linear-gradient(180deg, #111a24 0%, #4a1f1b 100%)',
    headerBorder: fire,
    footerBorder: '#c35a42',
  },
  Airbending: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha(elementFilterFrames.air, 0.42)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#e2cc68', 0.28)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(243, 239, 220, 0.5), rgba(231, 232, 213, 0.4))
    `,
    chromeFill: 'linear-gradient(180deg, #111a24 0%, #544821 100%)',
    headerBorder: elementFilterFrames.air,
    footerBorder: '#e0c75f',
  },
  Weapons: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha('#2a3542', 0.36)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#515c69', 0.3)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(224, 229, 234, 0.42), rgba(210, 217, 224, 0.36))
    `,
    chromeFill: `linear-gradient(180deg, #111a24 0%, ${elementFilterFrames.martial} 100%)`,
    headerBorder: '#4a5563',
    footerBorder: '#5c6674',
  },
  Technology: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha(tech, 0.36)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#9a79ad', 0.28)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(235, 225, 240, 0.44), rgba(222, 215, 232, 0.38))
    `,
    chromeFill: 'linear-gradient(180deg, #111a24 0%, #3c294c 100%)',
    headerBorder: tech,
    footerBorder: '#9977aa',
  },
};
const darkConditionGold = '#b98535';
const darkNegativeRed = '#5f1717';

const tabs: TabConfig[] = [
  {
    label: 'Character',
    value: 'character',
    // Lucide has no yin-yang glyph, so we use a local SVG. We pass explicit
    // dark/light colors so the symbol stays legible on the dark navy nav
    // (dark dot visible inside the white section, light dot in the dark).
    renderIcon: ({ color, size }) => (
      <YinYangIcon darkColor={deepInk} lightColor={color} size={size} />
    ),
  },
  {
    label: 'Moves',
    value: 'moves',
    renderIcon: ({ color, size }) => <MoveDiamond color={color} size={size} />,
  },
  {
    label: 'Combat',
    value: 'combat',
    renderIcon: ({ color, size }) => <HandFist color={color} size={size} strokeWidth={1.75} />,
  },
  {
    label: 'Backpack',
    value: 'backpack',
    renderIcon: ({ color, size }) => <Backpack color={color} size={size} strokeWidth={1.75} />,
  },
];

// Technique vocabulary (rulebook-wide). Used by the technique list on
// characterStateAtom + by the element/level filter atoms below.
type TechniqueElement = 'water' | 'earth' | 'fire' | 'air' | 'martial' | 'tech' | 'basic';
type TechniqueCategory = 'Advance & Attack' | 'Defend & Maneuver' | 'Evade & Observe';
type TechniqueLevel = 'learned' | 'practiced' | 'mastered';
type PrimaryTraining =
  | 'Waterbending'
  | 'Earthbending'
  | 'Firebending'
  | 'Airbending'
  | 'Weapons'
  | 'Technology';

// UI-only atoms (no character data; just remember which sub-tab is
// active when the user navigates away and comes back).
const movesSubTabAtom = atom(0);
const combatSubTabAtom = atom(0);
const backpackSubTabAtom = atom(0);
// 0 = All, 1 = Learned, 2 = Practiced, 3 = Mastered. "All" shows every
// technique regardless of proficiency level.
const techniqueFilterAtom = atom(0);
// Element filter for the Techniques sub-tab. 'all' shows every card;
// otherwise only techniques whose `element` matches are visible.
type TechniqueElementFilter = TechniqueElement | 'all';
const techniqueElementAtom = atom<TechniqueElementFilter>('all');

// ---------- Character data shapes ----------
type Connection = { name: string; role: string; note: string };
type JournalEntry = { type: string; name: string; description: string };
type Technique = {
  /** Elemental category (water / earth / fire / air / martial / tech /
   *  basic). Renamed from `element` -> `type` to keep the AL technique
   *  vocabulary aligned with the rulebook layout. */
  type: TechniqueElement;
  approach: TechniqueCategory;
  level: TechniqueLevel;
  name: string;
  summary: string;
  description: string;
};

/**
 * Every piece of editable character data the sheet UI reads from. Lives
 * inside a single jotai atom (`characterStateAtom`) so the entire
 * character record is one cohesive source of truth, and each render
 * surface reads from it (often via a slice / derived atom).
 */
type CharacterState = {
  name: string;
  className: string; // e.g. "The Successor"; rendered uppercase in the sheet UI.
  primaryTraining: PrimaryTraining;
  pronouns: string;
  /** Plain numeric age stored on the character record. Rendered as
   *  "Age <number>" in the UI for readability. */
  age: number;
  origin: string;
  stats: Record<string, number>;
  /** -4..4 along the Tradition/Progress balance track. */
  balance: number;
  conditions: Record<string, boolean>;
  statuses: Record<string, boolean>;
  fatigue: boolean[];
  tempFatigue: boolean[];
  backgrounds: Record<string, boolean>;
  classTraitTitle: string;
  classTraitBody: string;
  historyAnswers: Record<number, string>;
  connections: Connection[];
  classMoves: MoveEntry[];
  techniques: Technique[];
  inventory: JournalEntry[];
  notes: JournalEntry[];
};

/** Starter values — match what the sheet previously rendered as static
 *  content so the UI shows the same data on first load while now reading
 *  from a single mutable source. */
const defaultCharacter: CharacterState = {
  name: 'Qi Gong',
  className: 'The Successor',
  primaryTraining: 'Waterbending',
  pronouns: 'He / Him',
  age: 32,
  origin: 'Jasmine Island',
  stats: { Creativity: 2, Focus: 2, Harmony: 1, Passion: 1 },
  balance: 0,
  conditions: {},
  statuses: {},
  // Fatigue marks fill from the right toward the left by default — two
  // marks pre-filled on the right side of the tracker on first load.
  fatigue: [false, false, false, true, true],
  tempFatigue: [],
  backgrounds: { Urban: true, Privileged: true },
  classTraitTitle: 'A Tainted Past',
  classTraitBody:
    'You carry a heavy legacy — a name, a debt, or a deed that shadows your every step. Once per session, when your past complicates the situation, the GM may offer you an opportunity to mark fatigue and either reveal a useful connection from your old life or learn a fragment of hidden lore that bears on the current scene.',
  historyAnswers: {},
  connections: [
    {
      name: 'Boink',
      role: 'Black wooly pig',
      note: 'My loyal companion and constant source of joy. He roots around for snacks and keeps me grounded.',
    },
    {
      name: 'Qi Wei',
      role: 'Female ancestor',
      note: 'A brilliant and respected leader in our lineage. I strive to carry on her wisdom and honor.',
    },
  ],
  classMoves: [
    { title: 'Way of the Future', body: 'Class move details TBD.' },
    { title: 'Black Koala-Sheep', body: 'Class move details TBD.' },
    { title: 'A Life of Regret', body: 'Class move details TBD.' },
    { title: 'Walk This Way', body: 'Class move details TBD.' },
    { title: 'Worldly Knowledge', body: 'Class move details TBD.' },
  ],
  techniques: [
    {
      type: 'water',
      approach: 'Advance & Attack',
      level: 'mastered',
      name: 'Stream the Water',
      summary: 'Push a jet stream from a significant source to inflict fatigue.',
      description:
        'Mark fatigue and push a jet of water from a significant source toward a foe within reach. Until they break free, the target is held in place by the stream and cannot disengage. Each exchange they remain in the stream, they suffer additional fatigue. The stream ends when you stop concentrating, when the foe overcomes it, or when the source runs dry.',
    },
    {
      type: 'water',
      approach: 'Defend & Maneuver',
      level: 'learned',
      name: 'Flow as Water',
      summary: 'Use a jet of water to move quickly and shift position.',
      description:
        'Mark fatigue and ride a jet of water to a new position within reach. If you are engaging with a foe, you may disengage from them, and they are Impaired until the end of the exchange. You may bring one willing ally with you if there is a clear path of water between you.',
    },
    {
      type: 'water',
      approach: 'Evade & Observe',
      level: 'mastered',
      name: 'Refresh',
      summary: 'Clear conditions and keep an ally steady under pressure.',
      description:
        'Mark fatigue and apply water to revitalize and close wounds on a willing ally in reach who is also evading or observing. Clear one condition from them, or clear 2 points of fatigue. You can also use this on yourself, but only once per exchange.',
    },
    {
      type: 'water',
      approach: 'Advance & Attack',
      level: 'learned',
      name: 'Water Jab',
      summary: 'Surround your fist in water and strike from unexpected angles.',
      description:
        'Mark fatigue and surround your fist in water, then use the force of the stream to enhance your punch. Inflict 3 fatigue on a foe within reach. Your foe may choose to become Impaired to reduce the fatigue they suffer by 2.',
    },
    {
      type: 'basic',
      approach: 'Advance & Attack',
      level: 'learned',
      name: 'Smash',
      summary: 'Drive a heavy blow through your target to bypass their guard.',
      description:
        'Mark fatigue and bring your full weight down on a foe within reach. Inflict 2 fatigue on the target. If the target is using a defensive stance or terrain advantage, ignore it for this strike.',
    },
    {
      type: 'basic',
      approach: 'Defend & Maneuver',
      level: 'learned',
      name: 'Pounce',
      summary: 'Close the gap on a target with sudden speed.',
      description:
        "Mark fatigue and close to a foe within sight as part of the same action. If you act before they do this exchange, you may engage them and shift the encounter's distance one step closer.",
    },
  ],
  inventory: [
    {
      type: 'Item',
      name: 'Messenger Bag',
      description: 'Carried since leaving home. Inside are notes, tools, and a few keepsakes.',
    },
  ],
  notes: [
    {
      type: 'Note',
      name: "Rad's Notebook",
      description: 'A worn notebook filled with themes about bending and identity.',
    },
    {
      type: 'Important NPC',
      name: 'Professor Zei',
      description: "Head of Bending Theory at UoE. Believes in Rad's potential.",
    },
    {
      type: 'Location',
      name: 'The University of Elements',
      description: 'A neutral sanctuary where benders from all nations study in peace.',
    },
  ],
};

/** Single source of truth for the active character. Every editable
 *  surface reads from / writes to this atom (often via a derived slice). */
const characterStateAtom = atomWithStorage<CharacterState>(
  'avatar-legends-character',
  defaultCharacter,
);

/** Per-app persisted-state schema version. Bump whenever the on-the-wire
 *  shape of the AL `CharacterState` changes in a breaking way.
 *  v2: `age` is `number`, technique key is `type` (was `element`).
 *  v3: Technique.category renamed to approach, title→name, body→description.
 *      JournalEntry title→name, body→description.
 *  v4 (current): add primaryTraining for training-themed app chrome. */
const AVATAR_LEGENDS_SCHEMA_VERSION = 4;
const AVATAR_LEGENDS_GAME_SYSTEM = 'avatar-legends';
const AVATAR_LEGENDS_PENDING_SYNC_KEY = 'avatar-legends-convex-pending-character';
const AVATAR_LEGENDS_SELECT_CHARACTER_EVENT = 'avatar-legends-select-character';

/** Convert the AL `CharacterState` to the backend payload. Mirrors the
 *  FabU convention of wrapping the character under a `character` field
 *  so the persisted blob has room to grow with shape-level metadata
 *  (schema version, etc) without colliding with the character fields. */
function serializeAvatarLegendsCharacter(state: CharacterState) {
  return { schemaVersion: AVATAR_LEGENDS_SCHEMA_VERSION, character: state };
}

/** Apply incoming backend payload back to the AL shape, with a defensive
 *  fall-through to the default so missing/legacy fields don't crash.
 *  Also handles the v1 -> v2 shape migration in-flight: `age` strings
 *  like "Age 32" parse to a number, and each technique's legacy
 *  `element` key is read into the new `type` key. */
function deserializeAvatarLegendsCharacter(raw: unknown): CharacterState {
  if (!raw || typeof raw !== 'object') return defaultCharacter;
  const wrapped = raw as { character?: unknown };
  const innerCandidate: Record<string, unknown> =
    wrapped.character && typeof wrapped.character === 'object'
      ? (wrapped.character as Record<string, unknown>)
      : (raw as Record<string, unknown>);

  const rawAge: unknown = innerCandidate.age;
  const age = (() => {
    if (typeof rawAge === 'number' && Number.isFinite(rawAge)) return rawAge;
    if (typeof rawAge === 'string') {
      const match = rawAge.match(/-?\d+/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return defaultCharacter.age;
  })();

  const rawTechniques: unknown = innerCandidate.techniques;
  const techniques = Array.isArray(rawTechniques)
    ? (rawTechniques as Array<Record<string, unknown>>).map((tech) => {
        const legacyElement = (tech as { element?: unknown }).element;
        const nextType =
          typeof tech.type === 'string'
            ? (tech.type as TechniqueElement)
            : typeof legacyElement === 'string'
              ? (legacyElement as TechniqueElement)
              : 'basic';
        // Migrate v2→v3: rename category→approach, title→name, body→description
        const nextName =
          typeof tech.name === 'string' ? tech.name : (tech as { title?: unknown }).title;
        const nextApproach =
          typeof tech.approach === 'string'
            ? tech.approach
            : (tech as { category?: unknown }).category;
        const nextDescription =
          typeof tech.description === 'string'
            ? tech.description
            : (tech as { body?: unknown }).body;
        // Strip legacy keys
        const rest: Record<string, unknown> = { ...tech };
        delete rest.element;
        delete rest.title;
        delete rest.body;
        delete rest.category;
        return {
          ...rest,
          type: nextType,
          name: nextName,
          approach: nextApproach,
          description: nextDescription,
        } as Technique;
      })
    : defaultCharacter.techniques;

  // Migrate v2→v3: rename inventory and notes items' title→name, body→description
  const migrateJournalEntries = (entries: unknown) => {
    if (!Array.isArray(entries)) return undefined;
    return (entries as Array<Record<string, unknown>>).map((entry) => {
      const nextName =
        typeof entry.name === 'string' ? entry.name : (entry as { title?: unknown }).title;
      const nextDescription =
        typeof entry.description === 'string'
          ? entry.description
          : (entry as { body?: unknown }).body;
      const rest: Record<string, unknown> = { ...entry };
      delete rest.title;
      delete rest.body;
      return { ...rest, name: nextName, description: nextDescription } as JournalEntry;
    });
  };

  const inventory = migrateJournalEntries(innerCandidate.inventory) ?? defaultCharacter.inventory;
  const notes = migrateJournalEntries(innerCandidate.notes) ?? defaultCharacter.notes;
  const primaryTraining =
    typeof innerCandidate.primaryTraining === 'string' &&
    primaryTrainingOptions.includes(innerCandidate.primaryTraining as PrimaryTraining)
      ? (innerCandidate.primaryTraining as PrimaryTraining)
      : defaultCharacter.primaryTraining;

  return {
    ...defaultCharacter,
    ...(innerCandidate as Partial<CharacterState>),
    age,
    primaryTraining,
    techniques,
    inventory,
    notes,
  };
}

function describeAvatarLegendsCharacter(state: CharacterState) {
  return state.name || 'Avatar Legends Character';
}

/** Shared undo/redo history hook for the AL character. Built on the
 *  reusable factory in `src/state/createCharacterHistory.ts` — same
 *  machinery FabU uses. Every change to `characterStateAtom` (whether
 *  via a slice atom or a direct write) is captured automatically. */
const useAvatarLegendsCharacterHistory = createCharacterHistory(characterStateAtom);

/** Mounts the generic Convex character sync hook against the AL
 *  `characterStateAtom`. Renders nothing — just keeps the local atom
 *  and the Convex `characters` table in lockstep while the user is
 *  signed in. The hook is a no-op for signed-out users. Also wires
 *  the Cmd/Ctrl+Z undo / Cmd+Shift+Z redo shortcuts. */
function ConvexCharacterSyncMount() {
  const [character, , historyControls] = useAvatarLegendsCharacterHistory();
  const applyRemote = useCallback(
    (remote: CharacterState) => {
      // history.replace swaps in the remote and clears the undo stack
      // so post-pull undos don't try to walk back into a stale local
      // history that never matched the remote anyway.
      historyControls.replace(remote);
    },
    [historyControls],
  );
  useConvexCharacterSync<CharacterState>({
    character,
    applyRemote,
    serialize: serializeAvatarLegendsCharacter,
    deserialize: deserializeAvatarLegendsCharacter,
    gameSystem: AVATAR_LEGENDS_GAME_SYSTEM,
    schemaVersion: AVATAR_LEGENDS_SCHEMA_VERSION,
    pendingSyncKeyPrefix: AVATAR_LEGENDS_PENDING_SYNC_KEY,
    selectCharacterEventName: AVATAR_LEGENDS_SELECT_CHARACTER_EVENT,
    describeCharacter: describeAvatarLegendsCharacter,
  });

  // Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z = redo. Skip if focus is in
  // a text input so native text-editor undo still works there.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() !== 'z') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || (target?.isContentEditable ?? false);
      if (isEditable) return;
      e.preventDefault();
      if (e.shiftKey) historyControls.redo();
      else historyControls.undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [historyControls]);

  return null;
}

// Helper: derive a get/set slice atom from a single field on
// characterStateAtom. The returned atom behaves exactly like a regular
// jotai atom (useAtom returns [value, setValue] including functional
// updates) but the state actually lives inside characterStateAtom.
function sliceAtom<K extends keyof CharacterState>(key: K) {
  return atom(
    (get) => get(characterStateAtom)[key],
    (get, set, update: CharacterState[K] | ((prev: CharacterState[K]) => CharacterState[K])) => {
      const current = get(characterStateAtom);
      const next =
        typeof update === 'function'
          ? (update as (prev: CharacterState[K]) => CharacterState[K])(current[key])
          : update;
      set(characterStateAtom, { ...current, [key]: next });
    },
  );
}

// Slice atoms — preserve the prior atom-level API so existing useAtom
// call sites keep working unchanged. State lives in characterStateAtom.
const statsAtom = sliceAtom('stats');
const balancePositionAtom = sliceAtom('balance');
const activeStatusesAtom = sliceAtom('statuses');
const activeConditionsAtom = sliceAtom('conditions');
const fatigueAtom = sliceAtom('fatigue');
const tempFatigueAtom = sliceAtom('tempFatigue');
const backgroundsAtom = sliceAtom('backgrounds');
const historyAnswersAtom = sliceAtom('historyAnswers');
const notesAtom = sliceAtom('notes');
const inventoryAtom = sliceAtom('inventory');

// Each move card carries its title and the full body text shown when
// the accordion expands. Some moves also have a bulleted list of
// options. Basic + Balance bodies are drawn from the rulebook layout.
type MoveEntry = {
  title: string;
  body: string;
  bullets?: string[];
  /** Optional trailing paragraph that follows the bullet list. */
  trailing?: string;
};

// Rulebook moves shared across every character — Basic + Balance are
// game-wide moves. Class-specific moves live on the character record
// (characterStateAtom.classMoves) so each character can carry their own.
const movesByCategory: Record<'basic' | 'balance', MoveEntry[]> = {
  basic: [
    {
      title: 'Plead',
      body: 'When you plead with an NPC who cares what you think for help, support, or action, roll with Harmony. On a 7-9, they need something more — evidence that this is the right course, guidance in making the right choices, or resources to aid them — before they act; the GM tells you what they need. On a 10+, they act now and do their best until the situation changes.',
    },
    {
      title: 'Push Your Luck',
      body: 'When you push your luck in a risky situation, say what you want to do and roll with Passion. On a hit, you do it, but it costs you to scrape by; the GM tells you what it costs you. On a 10+, your boldness pays off despite the cost; the GM tells you what other lucky opportunity falls in your lap.',
    },
    {
      title: 'Rely on Your Skills & Training',
      body: 'When you rely on your skills and training to overcome an obstacle, gain new insight, or perform a familiar custom, roll with Focus. On a hit, you do it. On a 7-9, you do it imperfectly — the GM tells you how your approach might lead to unexpected consequences; accept those consequences or mark 1-fatigue.',
    },
    {
      title: 'Assess a Situation',
      body: 'When you assess a situation, roll with Creativity. On a 7-9, ask 1 question. On a 10+, ask 2. Take +1 ongoing when acting on the answers.',
      bullets: [
        'What here can I use to ___?',
        'Who or what is the biggest threat?',
        'What should I be on the lookout for?',
        "What's my best way out / in / through?",
        'Who or what is in the greatest danger?',
      ],
    },
    {
      title: 'Intimidate',
      body: 'When you intimidate an NPC into backing off or giving in, roll with Passion. On a hit, they choose one. On a 10+, first, you pick one they cannot choose.',
      bullets: [
        'They run to escape or get backup',
        'They back down but keep watch',
        'They give in with a few stipulations',
        'They attack you, but off-balance; the GM marks a condition on them',
      ],
    },
    {
      title: 'Trick',
      body: 'When you trick an NPC, roll with Creativity. On a hit, they fall for it and do what you want for the moment. On a 7-9, pick 1. On a 10+, pick 2.',
      bullets: [
        'They stumble; take +1 forward to acting against them',
        'They act foolishly; the GM tells you what additional opportunity they give you',
        'They overcommit; they are deceived for some time',
      ],
    },
    {
      title: 'Comfort or Support',
      body: "When you comfort or support another person, roll with Harmony. On a hit, they must decide if they open up to you. If they don't, mark a condition and take +1 forward against them; if they do, ask them any question. On a 10+, they can ask a question of you as well. Anyone who answers a question honestly may choose to clear a condition or 2-fatigue.",
    },
    {
      title: 'Helping',
      body: 'When you take appropriate action to help a companion, mark 1-fatigue to give them a +1 to their roll (after the roll). You cannot help in a combat exchange in this way.',
    },
  ],
  balance: [
    {
      title: 'Live Up to Your Principle',
      body: 'When you take action in accordance with the values of a principle, mark fatigue to roll with that principle instead of whatever stat you would normally roll.',
    },
    {
      title: 'Call Someone Out',
      body: 'When you openly call on someone to live up to their principle, shift your balance away from center, then name and roll with their principle. On a hit, they are called to act as you say; they must either do it or mark a condition. On a 7-9, they challenge your view of the world in turn; mark a fatigue or they shift your balance as they choose. On a miss, they can demand you act in accordance with one of your principles instead; mark a condition or act as they request.',
    },
    {
      title: 'Deny a Callout',
      body: 'When you deny an NPC calling on you to live up to your principle, roll with that principle. On a hit, act as they say or mark 1-fatigue. On a 10+, their words hit hard; you must also shift your balance towards the called-on principle. On a miss, you stand strong; clear a condition, clear 1-fatigue, or shift your balance, your choice.',
    },
    {
      title: 'Resist Shifting Your Balance',
      body: 'When you resist an NPC shifting your balance, roll. On a hit, you maintain your current balance in spite of their words or deeds. On a 10+, choose two. On a 7-9, choose one.',
      bullets: [
        'Clear a condition or mark growth by immediately acting to prove them wrong',
        'Shift your balance towards the opposite principle',
        'Learn what their principle is (if they have one); if you already know, take +1 forward against them',
      ],
      trailing:
        'On a miss, they know just what to say to throw you off balance. Mark a condition, and the GM shifts your balance twice.',
    },
    {
      title: 'Lose Your Balance',
      body: "If your balance shifts past the end of the track, you lose your balance. You obsess over that principle to a degree that's not healthy for you or anyone around you. Choose one of the following:",
      bullets: [
        'Give in or submit to your opposition',
        'Lose control of yourself in a destructive and harmful way',
        'Take an extreme action in line with the principle, then flee',
      ],
      trailing:
        "Afterward, when you've had some time to recover and recenter yourself, shift your center one step towards the principle you exceeded and clear all your conditions and fatigue. Reset your balance to your new center.",
    },
  ],
};

// Eyebrow color per category: red for attack, green for defend, blue for
// evade. Returned at call time so the `attackRed` reference picks up the
// active theme (matches the Fatigue diamond color in dark mode).
function techniqueCategoryColor(category: TechniqueCategory, isDarkMode: boolean): string {
  if (category === 'Advance & Attack') return isDarkMode ? passionRed : attackRed;
  if (category === 'Defend & Maneuver') return isDarkMode ? darkStatEarth : earth;
  return isDarkMode ? darkStatWater : water;
}

function techniqueElementVisual(type: TechniqueElement): {
  color: string;
  frameColor?: string;
  src: string;
} {
  if (type === 'earth')
    return { color: earth, frameColor: elementFilterFrames.earth, src: elementEarth };
  if (type === 'fire')
    return { color: fire, frameColor: elementFilterFrames.fire, src: elementFire };
  if (type === 'air') return { color: air, frameColor: elementFilterFrames.air, src: elementAir };
  if (type === 'martial')
    return { color: martial, frameColor: elementFilterFrames.martial, src: elementMartial };
  if (type === 'tech')
    return { color: tech, frameColor: elementFilterFrames.tech, src: elementTech };
  return { color: water, frameColor: elementFilterFrames.water, src: elementWater };
}

/**
 * Painted brush-stroke band — a straight dark navy band with a painted
 * (not wavy) edge, suggesting a flat brush dragged across the page. The
 * far edge is built from a solid rectangle plus a few thin streaks that
 * fade out to mimic dry brush bristles.
 */
function WatercolorBand({
  bottom = false,
  height = 96,
  fill,
  borderColor,
  brushBorder = false,
}: {
  bottom?: boolean;
  height?: number;
  /** CSS background string. Defaults to the solid deep-navy `deepInk`
   *  fill used for the bottom nav and the dark-mode top band; the
   *  light-mode top header passes a whiter gradient. */
  fill?: string;
  borderColor?: string;
  brushBorder?: boolean;
}) {
  // Solid painted block only — no bristle streaks. `solidEdge` defines the
  // depth of the painted band; outside that, the parchment shows through.
  const solidEdge = height - 18;
  const bandFill = fill ?? deepInk;
  const edgePosition = bottom ? { top: 0 } : { bottom: 0 };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        [bottom ? 'bottom' : 'top']: 0,
        height,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Painted block — supports either a solid color or a CSS gradient
          via the `fill` prop. */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          [bottom ? 'bottom' : 'top']: 0,
          height: solidEdge,
          background: bandFill,
        }}
      />
      {borderColor ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            ...edgePosition,
            height: brushBorder ? 18 : 2,
            background: brushBorder
              ? `linear-gradient(90deg, transparent 0%, ${alpha(borderColor, 0.9)} 10%, ${alpha(borderColor, 0.72)} 42%, ${alpha('#ffffff', 0.2)} 50%, ${alpha(borderColor, 0.72)} 58%, ${alpha(borderColor, 0.9)} 90%, transparent 100%)`
              : borderColor,
            opacity: brushBorder ? 0.92 : 1,
            clipPath: brushBorder
              ? bottom
                ? 'polygon(0 42%, 8% 22%, 18% 48%, 31% 28%, 45% 52%, 58% 26%, 73% 45%, 88% 24%, 100% 46%, 100% 100%, 0 100%)'
                : 'polygon(0 0, 100% 0, 100% 54%, 89% 76%, 74% 55%, 58% 78%, 44% 51%, 30% 73%, 16% 47%, 7% 76%, 0 58%)'
              : 'none',
          }}
        />
      ) : null}
    </Box>
  );
}

/**
 * Square checkbox with optional white checkmark. When `checked` is true the
 * box fills with deep ink and a white check stroke is drawn inside.
 */
function Checkbox({
  checked,
  size = 18,
  onToggle,
}: {
  checked: boolean;
  size?: number;
  /**
   * Optional. When provided, the checkbox renders as a real button and
   * clicking it fires this callback. When omitted, the checkbox renders as
   * a static display element (legacy behavior).
   */
  onToggle?: () => void;
}) {
  const interactive = Boolean(onToggle);
  const checkmark = checked ? (
    <Box
      component="svg"
      viewBox="0 0 12 12"
      sx={{ width: size * 0.85, height: size * 0.85, display: 'block' }}
    >
      <path
        d="M2.5 6.3 L 5 8.6 L 9.5 3.4"
        fill="none"
        // chromeText (near-white) ensures the check stays visible against
        // the deepInk fill in both light and dark mode.
        stroke={chromeText}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  ) : null;
  return (
    <Box
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      // Stop propagation so a parent row click handler (e.g., the
      // Background row's wrapping Stack) doesn't fire a second toggle
      // when the user taps the checkbox directly. Clicking the
      // checkbox now reliably toggles its state exactly once.
      onClick={
        interactive
          ? (e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              onToggle?.();
            }
          : undefined
      }
      aria-pressed={interactive ? checked : undefined}
      sx={{
        width: size,
        height: size,
        border: `1.2px solid ${ink}`,
        bgcolor: checked ? deepInk : 'transparent',
        borderRadius: '1px',
        display: 'grid',
        placeItems: 'center',
        flex: '0 0 auto',
        p: 0,
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      {checkmark}
    </Box>
  );
}

/**
 * Balance section content. Renders the TRADITION / PROGRESS labels on
 * either side of a horizontal line; the line carries 8 evenly spaced
 * tick notches (4 left, 4 right of the center point) plus the draggable
 * yin-yang marker which snaps to whichever of the 9 stop positions
 * (index -4..4) the user releases nearest to.
 */
function BalanceTrack() {
  const [position, setPosition] = useAtom(balancePositionAtom);
  const { isDarkMode } = useThemeMode();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  // Map an index in [-4, 4] to a percentage left offset along the track.
  // -4 -> 0%, 0 -> 50%, 4 -> 100%.
  const toPercent = (idx: number) => ((idx + 4) / 8) * 100;

  // Convert a clientX during a drag into the nearest snap index.
  function pointerToIndex(clientX: number): number {
    const el = trackRef.current;
    if (!el) return position;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return position;
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    return Math.round(clamped * 8) - 4;
  }

  // 9 notches total — the leftmost (-4) and rightmost (4) stay unlabeled
  // per the spec; the inner 7 carry numbers above and below.
  const notchIndexes: number[] = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const numberedIndexes: number[] = [-3, -2, -1, 0, 1, 2, 3];
  // Top labels: at index -3 -> "+3", center 0 -> "0", index 3 -> "-3".
  // Bottom labels mirror that — left side is negative, right side is
  // positive, with 0 at center.
  const topLabel = (i: number) => (i === 0 ? '0' : i < 0 ? `+${-i}` : `${-i}`);
  const bottomLabel = (i: number) => (i === 0 ? '0' : i > 0 ? `+${i}` : `${i}`);
  // Notches are white in dark mode so they read against the deep-navy
  // surface; otherwise they fall back to the cover-art dark navy.
  const notchColor = isDarkMode ? '#ffffff' : deepInk;
  const numberStyle = {
    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
    fontSize: '0.55rem',
    fontWeight: 900,
    color: ink,
    letterSpacing: '0.02em',
    lineHeight: 1,
  } as const;

  return (
    <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 3.2, mb: 2.6 }}>
      <Typography
        sx={{
          color: ink,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.62rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
        }}
      >
        TRADITION
      </Typography>
      <Box
        ref={trackRef}
        sx={{
          flex: 1,
          height: 2,
          background: `linear-gradient(90deg, ${alpha(washDeep, 0.5)} 0%, ${alpha(deepInk, 0.7)} 50%, ${alpha(washDeep, 0.5)} 100%)`,
          position: 'relative',
          borderRadius: '1px',
        }}
      >
        {/* Top label row — sits above the notches, excludes the
            leftmost / rightmost tick. */}
        {numberedIndexes.map((idx) => (
          <Box
            key={`top-${idx}`}
            aria-hidden
            sx={{
              position: 'absolute',
              top: -22,
              left: `${toPercent(idx)}%`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              ...numberStyle,
            }}
          >
            {topLabel(idx)}
          </Box>
        ))}
        {/* Tick notches — 9 equally spaced marks along the track. */}
        {notchIndexes.map((idx) => (
          <Box
            key={idx}
            aria-hidden
            sx={{
              position: 'absolute',
              top: -5,
              left: `${toPercent(idx)}%`,
              width: 2,
              height: 12,
              background: notchColor,
              transform: 'translateX(-50%)',
              borderRadius: '1px',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Bottom label row — mirrors the top, with the sign flipped so
            +i on the right side corresponds to the Progress direction. */}
        {numberedIndexes.map((idx) => (
          <Box
            key={`bottom-${idx}`}
            aria-hidden
            sx={{
              position: 'absolute',
              top: 14,
              left: `${toPercent(idx)}%`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              ...numberStyle,
            }}
          >
            {bottomLabel(idx)}
          </Box>
        ))}
        {/* Draggable yin-yang marker. Pointer events live on the marker
            itself so the rest of the track stays scrollable on touch
            devices; setPointerCapture keeps the drag alive even if the
            finger slides off the small hit area. */}
        <Box
          role="slider"
          aria-label="Balance position"
          aria-valuemin={-4}
          aria-valuemax={4}
          aria-valuenow={position}
          tabIndex={0}
          onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
            draggingRef.current = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => {
            if (!draggingRef.current) return;
            const next = pointerToIndex(e.clientX);
            if (next !== position) setPosition(next);
          }}
          onPointerUp={(e: React.PointerEvent<HTMLDivElement>) => {
            draggingRef.current = false;
            e.currentTarget.releasePointerCapture?.(e.pointerId);
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setPosition(Math.max(-4, position - 1));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setPosition(Math.min(4, position + 1));
            }
          }}
          sx={{
            position: 'absolute',
            left: `${toPercent(position)}%`,
            top: -13,
            transform: 'translateX(-50%)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            // Solid white fill in both modes — matches the new Stats circles.
            background: '#ffffff',
            border: `2px solid ${deepInk}`,
            display: 'grid',
            placeItems: 'center',
            color: ink,
            boxShadow: `0 1px 3px ${alpha(deepInk, 0.25)}`,
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            transition: 'left 0.08s ease',
            '&:active': { cursor: 'grabbing' },
            '&:focus-visible': {
              outline: `2px solid ${alpha(deepInk, 0.6)}`,
              outlineOffset: 2,
            },
          }}
        >
          {/* Balance yin-yang uses fixed light-mode colors so the symbol
              looks identical in light and dark mode. */}
          <YinYangIcon
            darkColor={lightAvPalette.deepInk}
            lightColor={lightAvPalette.parchmentLight}
            size={20}
            strokeWidth={1.5}
          />
        </Box>
      </Box>
      <Typography
        sx={{
          color: ink,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.62rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
        }}
      >
        PROGRESS
      </Typography>
    </Stack>
  );
}

/**
 * Reusable Stats panel. Used on both the Character tab and the Combat tab
 * so the same data shows in both contexts. Colors per the user spec:
 *   - Creativity: blue (water)
 *   - Focus:      green (earth)
 *   - Harmony:    blue (water)
 *   - Passion:    a warm red (its own hue)
 */
function StatsPanel() {
  const { isDarkMode } = useThemeMode();
  const rows: Array<[string, string]> = [
    ['Creativity', isDarkMode ? darkStatWater : water],
    ['Focus', isDarkMode ? darkStatEarth : earth],
    ['Harmony', isDarkMode ? darkStatWater : water],
    ['Passion', passionRed],
  ];
  const [stats, setStats] = useAtom(statsAtom);
  function setValue(label: string, raw: string) {
    // The pick list only emits values in [-3, 3] so we trust the choice
    // and just persist it. Clamp defensively in case the source changes.
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(-3, Math.min(3, parsed));
    setStats((prev) => ({ ...prev, [label]: clamped }));
  }
  const statOptions = [-3, -2, -1, 0, 1, 2, 3];
  return (
    <Panel>
      <SectionTitle>Stats</SectionTitle>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.8, mt: 0.9 }}>
        {rows.map(([label, color]) => {
          // Clamp to the pick-list range in case persisted state holds a
          // legacy value outside [-3, 3].
          const value = Math.max(-3, Math.min(3, stats[label] ?? 0));
          return (
            <Stack key={label} spacing={0.45} alignItems="center">
              <Typography
                sx={{
                  color,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Typography>
              <Box
                component="select"
                value={value}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setValue(label, e.target.value)
                }
                aria-label={`${label} stat`}
                sx={{
                  width: 44,
                  height: 44,
                  textAlign: 'center',
                  textAlignLast: 'center',
                  // Solid white fill in both light and dark mode.
                  background: '#ffffff',
                  // Border matches the stat's text color (e.g., Creativity
                  // gets water-blue, Passion gets the warm red).
                  border: `1.5px solid ${color}`,
                  borderRadius: '50%',
                  // Deep blue ink reads on white in both themes.
                  color: lightAvPalette.ink,
                  // Handwritten font where the "1" is clearly distinct
                  // from "I" — the IM Fell serif previously used had a
                  // capital-I-shaped 1. Larger size to read clearly in
                  // the 44x44 circle.
                  fontFamily: '"Caveat", "Patrick Hand", "Bradley Hand", "Marker Felt", cursive',
                  fontSize: '1.95rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  p: 0,
                  outline: 'none',
                  cursor: 'pointer',
                  // Hide the native chevron — keep the field looking like
                  // the previous numeric circle.
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: 'none',
                  '&:focus': {
                    borderColor: color,
                    boxShadow: `0 0 0 2px ${alpha(color, 0.3)}`,
                  },
                }}
              >
                {statOptions.map((option) => (
                  <option key={option} value={option}>
                    {/* Positive stats display with an explicit plus
                        sign so the modifier reads correctly inside
                        the circle and in the picker. */}
                    {option > 0 ? `+${option}` : `${option}`}
                  </option>
                ))}
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Panel>
  );
}

/**
 * Background list row — a Checkbox + label bound to the shared
 * `backgroundsAtom`. Tapping either the checkbox or the label toggles the
 * value so the list is fully interactive.
 */
function BackgroundCheckRow({ label }: { label: string }) {
  const [backgrounds, setBackgrounds] = useAtom(backgroundsAtom);
  const checked = Boolean(backgrounds[label]);
  const toggle = () => setBackgrounds((prev) => ({ ...prev, [label]: !prev[label] }));
  return (
    <Stack
      key={label}
      direction="row"
      alignItems="center"
      gap={0.5}
      sx={{ cursor: 'pointer' }}
      onClick={toggle}
    >
      <Checkbox checked={checked} onToggle={toggle} />
      <Typography
        sx={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.74rem',
          color: brown,
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function PrimaryTrainingSelect() {
  const [character, setCharacter] = useAtom(characterStateAtom);
  const currentTraining = primaryTrainingOptions.includes(character.primaryTraining)
    ? character.primaryTraining
    : defaultCharacter.primaryTraining;
  return (
    <Stack spacing={0.45} sx={{ width: 'min(100%, 220px)', pt: 0.1 }}>
      <Typography
        sx={{
          color: alpha(brown, 0.76),
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.58rem',
          fontWeight: 900,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Primary Training
      </Typography>
      <Box
        component="select"
        value={currentTraining}
        aria-label="Primary training"
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
          const next = event.target.value as PrimaryTraining;
          setCharacter((prev) => ({ ...prev, primaryTraining: next }));
        }}
        sx={{
          width: '100%',
          minHeight: 34,
          borderRadius: '4px',
          border: `1px solid ${alpha(accent, 0.72)}`,
          bgcolor: alpha(parchmentLight, 0.72),
          color: ink,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.74rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textAlign: 'center',
          textAlignLast: 'center',
          px: 1,
          outline: 'none',
          cursor: 'pointer',
          '&:focus': {
            borderColor: accent,
            boxShadow: `0 0 0 2px ${alpha(accent, 0.25)}`,
          },
        }}
      >
        {primaryTrainingOptions.map((training) => (
          <option key={training} value={training}>
            {training}
          </option>
        ))}
      </Box>
    </Stack>
  );
}

/**
 * Toggleable condition button bound to the shared `activeConditionsAtom`.
 * Used on both the Character tab and the Combat > Conditions sub-tab so the
 * two surfaces stay in sync.
 */
function ConditionButtonShared({ label }: { label: string }) {
  const [active, setActive] = useAtom(activeConditionsAtom);
  const { isDarkMode } = useThemeMode();
  return (
    <StatusButton
      label={label}
      active={Boolean(active[label])}
      // Conditions use a rulebook-gold fill; dark mode deepens it so
      // active chips feel less bright against the slate surface.
      activeColor={isDarkMode ? darkConditionGold : bookAccent}
      // Unselected label reads in black in light mode (per spec); dark
      // mode keeps the StatusButton default of white text at all times.
      inactiveTextColor="#000000"
      onToggle={() => setActive((prev) => ({ ...prev, [label]: !prev[label] }))}
    />
  );
}

/**
 * Toggleable status pill. Unfilled by default (just an outline); when active
 * it fills with `activeColor` (blue for Positive statuses, dark red for
 * Negative). Tap to toggle.
 */
function StatusButton({
  label,
  active,
  activeColor,
  inactiveTextColor,
  onToggle,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  /** Optional override for the unselected label color in light mode.
   *  Defaults to `activeColor` (the legacy color-coded look the
   *  positive / negative Statuses buttons use). Conditions pass black
   *  here so unselected condition labels stay readable on parchment. */
  inactiveTextColor?: string;
  onToggle: () => void;
}) {
  // In dark mode the inactive text would otherwise sit at the activeColor
  // (e.g., the dark-red `gold`), which is hard to read against the slate
  // body. Force the label to white at all times in dark mode; light mode
  // uses `inactiveTextColor` (or falls back to the active border color
  // for the existing color-coded behaviour).
  const { isDarkMode } = useThemeMode();
  const textColor = isDarkMode
    ? '#ffffff'
    : active
      ? '#ffffff'
      : (inactiveTextColor ?? activeColor);
  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      sx={{
        // Doubled vertical padding so the button is twice as tall.
        py: '14px',
        px: 1,
        borderRadius: '4px',
        border: `1.5px solid ${activeColor}`,
        background: active ? activeColor : 'transparent',
        color: textColor,
        cursor: 'pointer',
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        width: '100%',
      }}
    >
      {label}
    </Box>
  );
}

/**
 * Toggleable diamond marker used in the Fatigue tracker (and any other
 * track of binary diamond pips). Filled when `filled` is true; otherwise
 * just a thin outline diamond.
 */
/**
 * Filled square inside an outline square — the icon for the "Basic"
 * technique type. Drawn at 24x24 viewBox to match the element badges.
 */
function SquareInSquare({ color = ink, size = 36 }: { color?: string; size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      <rect
        x={2.5}
        y={2.5}
        width={19}
        height={19}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <rect x={7.5} y={7.5} width={9} height={9} fill={color} />
    </Box>
  );
}

function FatigueDiamond({
  filled,
  size = 14,
  color = passionRed,
  onToggle,
  ariaLabel,
}: {
  filled: boolean;
  size?: number;
  color?: string;
  onToggle?: () => void;
  ariaLabel?: string;
}) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      onClick={onToggle}
      role={onToggle ? 'button' : undefined}
      tabIndex={onToggle ? 0 : undefined}
      aria-label={ariaLabel}
      aria-pressed={onToggle ? filled : undefined}
      onKeyDown={
        onToggle
          ? (event: React.KeyboardEvent<SVGSVGElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      sx={{
        width: size,
        height: size,
        flex: '0 0 auto',
        display: 'block',
        cursor: onToggle ? 'pointer' : 'default',
      }}
    >
      <polygon
        points="12,2 22,12 12,22 2,12"
        // Base fatigue uses passionRed; temporary fatigue passes the blue accent.
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Box>
  );
}

function CapacityPicker({
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
  const setClamped = (next: number) => onChange(Math.max(0, Math.min(10, next)));
  return (
    <Stack spacing={0.6}>
      <Typography
        sx={{
          fontSize: '0.74rem',
          fontWeight: 800,
          color: brownSoft,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          minHeight: 40,
          borderRadius: '8px',
          border: `1.5px solid ${color}`,
          bgcolor: parchmentLight,
          color: ink,
          overflow: 'hidden',
        }}
      >
        <Button
          onClick={() => setClamped(value - 1)}
          disabled={value <= 0}
          aria-label={`Decrease ${label.toLowerCase()}`}
          sx={{
            minWidth: 42,
            height: 40,
            borderRadius: 0,
            color,
            fontSize: '1.2rem',
            fontWeight: 900,
            '&:disabled': { color: alpha(color, 0.35) },
          }}
        >
          -
        </Button>
        <Typography
          aria-live="polite"
          sx={{
            flex: 1,
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: 900,
            color: ink,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {value}
        </Typography>
        <Button
          onClick={() => setClamped(value + 1)}
          disabled={value >= 10}
          aria-label={`Increase ${label.toLowerCase()}`}
          sx={{
            minWidth: 42,
            height: 40,
            borderRadius: 0,
            color,
            fontSize: '1.2rem',
            fontWeight: 900,
            '&:disabled': { color: alpha(color, 0.35) },
          }}
        >
          +
        </Button>
      </Stack>
    </Stack>
  );
}

/**
 * Collapsible History section — a heading row with a chevron + a list of
 * questions below. Each question is paired with a text box for the player's
 * answer. The set of questions is data-driven so the list can grow.
 */
function HistorySection({ questions }: { questions: string[] }) {
  const [open, setOpen] = useState(false);
  // History answers live on the character record so they persist across
  // tab navigation and (later) full character saves.
  const [answers, setAnswers] = useAtom(historyAnswersAtom);
  return (
    <Stack spacing={0.6}>
      <SectionTitle>History</SectionTitle>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        sx={{
          mt: 0.4,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 0.7,
          p: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: ink,
          textAlign: 'left',
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.82rem',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <Box sx={{ flex: 1 }}>
          {questions.length} question{questions.length === 1 ? '' : 's'}
        </Box>
        <Box
          sx={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: alpha(ink, 0.8),
            fontSize: '0.95rem',
            lineHeight: 1,
          }}
        >
          ›
        </Box>
      </Box>
      {open ? (
        <Stack spacing={1} sx={{ mt: 0.6 }}>
          {questions.map((question, index) => (
            <Stack key={question} spacing={0.4}>
              <Typography
                sx={{
                  color: ink,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.88rem',
                  fontStyle: 'italic',
                  lineHeight: 1.45,
                }}
              >
                {question}
              </Typography>
              <Box
                component="textarea"
                rows={2}
                value={answers[index] ?? ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAnswers((prev) => ({ ...prev, [index]: e.target.value }))
                }
                sx={{
                  width: '100%',
                  resize: 'vertical',
                  minHeight: 44,
                  borderRadius: '4px',
                  border: `1px solid ${border}`,
                  background: alpha(parchmentLight, 0.85),
                  color: brown,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.86rem',
                  lineHeight: 1.45,
                  p: 1,
                  boxSizing: 'border-box',
                  outline: 'none',
                  '&:focus': {
                    borderColor: deepInk,
                  },
                }}
              />
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

/**
 * Collapsible class-trait card. Renders a parchment heading row with a
 * disclosure chevron; clicking the heading toggles the body open/closed.
 * Title appears in the same small-caps serif as the SectionTitle component.
 */
function ClassTraitAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Stack spacing={0.6}>
      <SectionTitle>Class Trait</SectionTitle>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        sx={{
          mt: 0.4,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 0.7,
          p: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: ink,
          textAlign: 'left',
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.92rem',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <Box sx={{ flex: 1 }}>{title}</Box>
        <Box
          sx={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: alpha(ink, 0.8),
            fontSize: '0.95rem',
            lineHeight: 1,
          }}
        >
          ›
        </Box>
      </Box>
      {open ? (
        <Typography
          sx={{
            color: brown,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '0.86rem',
            lineHeight: 1.5,
            pt: 2,
            px: 2,
            pb: 2,
          }}
        >
          {children}
        </Typography>
      ) : null}
    </Stack>
  );
}

/**
 * Yin-yang SVG drawn in the lucide style (24x24 viewBox). Accepts an
 * explicit pair of colors so the symbol stays readable on either a light
 * or dark surface:
 *   - `darkColor` paints the outline, the filled teardrop, and the dark
 *     dot in the white section
 *   - `lightColor` paints the filled "white" section and the light dot in
 *     the dark section
 *
 * Defaults render correctly when used standalone — the Character
 * bottom-nav icon passes explicit colors so both halves are visible
 * against the dark navy header band.
 */
function YinYangIcon({
  size = 20,
  strokeWidth = 1.75,
  darkColor = 'currentColor',
  lightColor = '#ffffff',
}: {
  size?: number;
  strokeWidth?: number;
  darkColor?: string;
  lightColor?: string;
}) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      stroke={darkColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      sx={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      {/* Outer circle — filled with the light color so the "white section"
          reads as solid white against any backdrop. */}
      <circle cx={12} cy={12} r={10} fill={lightColor} />
      {/* S-curve dividing line */}
      <path d="M12 2 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 22" fill="none" />
      {/* Dark teardrop (top half) — covers the upper portion of the disc. */}
      <path
        d="M12 2 A 10 10 0 0 1 12 22 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 2 Z"
        fill={darkColor}
        stroke="none"
      />
      {/* Light dot in the dark half */}
      <circle cx={12} cy={17} r={1.6} fill={lightColor} stroke="none" />
      {/* Dark dot in the white section */}
      <circle cx={12} cy={7} r={1.6} fill={darkColor} stroke="none" />
    </Box>
  );
}

/**
 * Diamond-within-diamond bullet — the signature glyph for Moves in the
 * Avatar Legends character sheet. Outer outline + inner filled diamond.
 */
function MoveDiamond({ color = ink, size = 18 }: { color?: string; size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      <polygon
        points="12,2 22,12 12,22 2,12"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <polygon points="12,8.5 15.5,12 12,15.5 8.5,12" fill={color} />
    </Box>
  );
}

/**
 * Subtle corner ornament — a small flourish using paired diamond shapes.
 * Sits in the corners of containers and the page frame.
 */
function CornerOrnament({
  position,
  color = accent,
  size = 14,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  color?: string;
  size?: number;
}) {
  const rotation = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  const placement = {
    tl: { top: 4, left: 4 },
    tr: { top: 4, right: 4 },
    br: { bottom: 4, right: 4 },
    bl: { bottom: 4, left: 4 },
  }[position];
  return (
    <Box
      component="svg"
      viewBox="0 0 20 20"
      sx={{
        position: 'absolute',
        ...placement,
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        pointerEvents: 'none',
        opacity: 0.65,
      }}
    >
      <path
        d="M0 6 L0 0 L6 0 M2 4 L4 4 L4 2"
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <circle cx={1.5} cy={1.5} r={0.8} fill={color} />
    </Box>
  );
}

/**
 * Element badge — a square frame holding the cropped colored panel + symbol
 * from the character sheet. The source image is already a tight square of just
 * the colored panel, so we display it edge-to-edge with a subtle blue-grey
 * frame and a soft halo. Falls back to a watercolor wash + letter when src is
 * absent.
 */
function ElementMark({
  color,
  label,
  src,
  frameColor,
  size = 32,
  height,
}: {
  color: string;
  label?: string;
  src?: string | undefined;
  frameColor?: string;
  size?: number;
  /**
   * Optional explicit frame height. When supplied, the frame is `size` wide
   * but only `height` tall — the image inside anchors to the top so the
   * top of the glyph stays visible while the bottom gets cropped.
   */
  height?: number;
}) {
  const frameHeight = height ?? size;
  return (
    <Box
      sx={{
        width: size,
        height: frameHeight,
        borderRadius: '3px',
        border: `1px solid ${alpha(frameColor ?? deepInk, 0.62)}`,
        background:
          frameColor ??
          (src
            ? 'transparent'
            : `linear-gradient(180deg, ${alpha(color, 0.45)} 0%, ${alpha(color, 0.7)} 100%)`),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: ink,
        fontFamily: '"IM Fell English", Georgia, serif',
        fontWeight: 900,
        fontSize: size * 0.42,
        boxShadow: `0 0 0 2px ${alpha(parchmentLight, 0.75)}, 0 1px 3px ${alpha(deepInk, 0.2)}`,
        overflow: 'hidden',
        position: 'relative',
        flex: '0 0 auto',
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt=""
          sx={{
            width: '82%',
            height: '82%',
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      ) : (
        label
      )}
    </Box>
  );
}

// Octagonal "card with notched corners" shape — the body of every Panel
// has corners cut at this depth. Small enough that the notches feel
// like a subtle accent rather than a heavy frame.
const PANEL_CORNER = 5;
// Border-frame clip-path (after the user's spec): a 2px ring with 18px
// corner cuts. The ring is the difference between the outer notched
// rectangle and a 2px-inset inner notched rectangle.
const panelOctagonClipPath = `polygon(${PANEL_CORNER}px 0, calc(100% - ${PANEL_CORNER}px) 0, 100% ${PANEL_CORNER}px, 100% calc(100% - ${PANEL_CORNER}px), calc(100% - ${PANEL_CORNER}px) 100%, ${PANEL_CORNER}px 100%, 0 calc(100% - ${PANEL_CORNER}px), 0 ${PANEL_CORNER}px)`;
const panelBorderFrameClipPath = `polygon(0 ${PANEL_CORNER}px,${PANEL_CORNER}px ${PANEL_CORNER}px,${PANEL_CORNER}px 0,calc(100% - ${PANEL_CORNER}px) 0,calc(100% - ${PANEL_CORNER}px) ${PANEL_CORNER}px,100% ${PANEL_CORNER}px,100% calc(100% - ${PANEL_CORNER}px),calc(100% - ${PANEL_CORNER}px) calc(100% - ${PANEL_CORNER}px),calc(100% - ${PANEL_CORNER}px) 100%,${PANEL_CORNER}px 100%,${PANEL_CORNER}px calc(100% - ${PANEL_CORNER}px),0 calc(100% - ${PANEL_CORNER}px),0 ${PANEL_CORNER}px,2px calc(${PANEL_CORNER}px + 2px),2px calc(100% - ${PANEL_CORNER}px - 2px),calc(${PANEL_CORNER}px + 2px) calc(100% - ${PANEL_CORNER}px - 2px),calc(${PANEL_CORNER}px + 2px) calc(100% - 2px),calc(100% - ${PANEL_CORNER}px - 2px) calc(100% - 2px),calc(100% - ${PANEL_CORNER}px - 2px) calc(100% - ${PANEL_CORNER}px - 2px),calc(100% - 2px) calc(100% - ${PANEL_CORNER}px - 2px),calc(100% - 2px) calc(${PANEL_CORNER}px + 2px),calc(100% - ${PANEL_CORNER}px - 2px) calc(${PANEL_CORNER}px + 2px),calc(100% - ${PANEL_CORNER}px - 2px) 2px,calc(${PANEL_CORNER}px + 2px) 2px,calc(${PANEL_CORNER}px + 2px) calc(${PANEL_CORNER}px + 2px),2px calc(${PANEL_CORNER}px + 2px))`;

/**
 * Notched border ring — paints a single 2px line in the shape of a
 * rectangle with corners cut off. Stacking two of these (one inset) gives
 * the "double line" variant used on major cards.
 */
function PanelBorderRing({ inset = 0 }: { inset?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset,
        background: border,
        clipPath: panelBorderFrameClipPath,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Panel — content card with notched corners and a 1- or 2-line border.
 *   variant='major' → double line border (default)
 *   variant='minor' → single line border (used for small or inset cards)
 *
 * The container is clipped to an octagonal (corner-notched) shape so the
 * background doesn't show past the cut corners.
 */
function Panel({
  children,
  compact = false,
  variant = 'minor',
  ornament,
  noNotch = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
  variant?: 'major' | 'minor';
  /** Back-compat: kept for old callers; the underlying variant prop
   *  controls the line style now. */
  ornament?: boolean;
  /** When true, render a plain rectangular border (no corner notches and
   *  no border-ring overlay). Used by Moves and Backpack cards. */
  noNotch?: boolean;
}) {
  // Honor the legacy `ornament` prop only when it's explicitly set; the
  // new default is 'minor' so most cards render the single-line border.
  const resolvedVariant: 'major' | 'minor' =
    ornament === false ? 'minor' : ornament === true ? 'major' : variant;
  // Inner content padding (extra space at the top/bottom/sides so content
  // never falls under the notched corner cuts or the border ring(s)).
  // Major variant has a second inset ring, so its safe-zone is larger.
  // When noNotch is on, content can sit right against the border.
  const contentInset = noNotch ? 10 : resolvedVariant === 'major' ? 14 : 10;

  // Soft drop shadow applied to every card. The notched variant uses a
  // filter: drop-shadow() wrapper because box-shadow would be clipped by
  // the octagonal clip-path; the plain rectangle variant uses box-shadow
  // directly for a sharper-edged shadow that follows its straight border.
  const shadowColor = alpha(deepInk, 0.22);
  const cardBoxShadow = `0 3px 8px ${shadowColor}, 0 1px 2px ${alpha(deepInk, 0.12)}`;
  const cardDropShadowFilter = `drop-shadow(0 3px 6px ${shadowColor}) drop-shadow(0 1px 1px ${alpha(deepInk, 0.12)})`;

  if (noNotch) {
    // Plain rectangle — straight border, no clip-path, no notches.
    return (
      <Box
        sx={{
          position: 'relative',
          border: `1px solid ${border}`,
          borderRadius: '4px',
          // Flat solid card bg — no gradient.
          background: parchmentLight,
          boxShadow: cardBoxShadow,
          p: compact ? `${contentInset - 2}px` : `${contentInset}px`,
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    // Outer wrapper carries the drop-shadow filter so the cast shadow
    // follows the octagonal silhouette — a box-shadow would be cut off
    // by the inner element's clip-path.
    <Box sx={{ filter: cardDropShadowFilter }}>
      <Box
        sx={{
          position: 'relative',
          // Outer notched silhouette so the parchment bg ends at the notches.
          clipPath: panelOctagonClipPath,
          // Flat solid card bg — no gradient.
          background: parchmentLight,
          p: compact ? `${contentInset - 2}px` : `${contentInset}px`,
        }}
      >
        <PanelBorderRing />
        {resolvedVariant === 'major' ? <PanelBorderRing inset={5} /> : null}
        <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}

function StatDots({ value, color }: { value: number; color: string }) {
  return (
    <Stack direction="row" gap={0.35}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            border: `1px solid ${color}`,
            bgcolor: index < value ? color : 'transparent',
          }}
        />
      ))}
    </Stack>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  // Mimics the character-sheet section labels (e.g. STATS, CONDITIONS) — a
  // small caps serif with a hairline accent underline drawn via box-shadow.
  // Bullet + underline use the pale-blue `accent` so dark red is reserved
  // for semantic warnings.
  return (
    <Stack direction="row" alignItems="center" gap={0.6}>
      <MoveDiamond color={accent} size={9} />
      <Typography
        sx={{
          color: ink,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.82rem',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: alpha(accent, 0.55) }} />
    </Stack>
  );
}

function CharacterPane() {
  const character = useAtomValue(characterStateAtom);
  // Age is now a plain number on the character record; render as
  // "Age <n>" inline. Falsy guards keep blank/0 values out of the row.
  const ageLabel =
    typeof character.age === 'number' && Number.isFinite(character.age)
      ? `Age ${character.age}`
      : '';
  const facts = [character.pronouns, ageLabel, character.origin].filter(Boolean);
  return (
    <Stack spacing={1.1}>
      {/* The main Character card is the only `major` (double-line) panel
          on the page — every other card uses the single-line variant. */}
      <Panel variant="major">
        {/* Image-free header: large serif name centered, with a flourish
            underline of the playbook and the character's facts below. */}
        <Stack alignItems="center" spacing={0.55} sx={{ py: 0.8, px: 0.6 }}>
          <Typography
            sx={{
              color: ink,
              fontFamily: '"IM Fell English", Georgia, serif',
              fontSize: '1.85rem',
              fontWeight: 700,
              lineHeight: 1,
              textAlign: 'center',
            }}
          >
            {character.name}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.7}>
            <Box sx={{ width: 28, height: '1px', bgcolor: alpha(accent, 0.7) }} />
            <MoveDiamond color={accent} size={9} />
            <Typography
              sx={{
                // bookAccent is the muted-gold rulebook chapter color in
                // both themes.
                color: bookAccent,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.16em',
              }}
            >
              {character.className.toUpperCase()}
            </Typography>
            <MoveDiamond color={accent} size={9} />
            <Box sx={{ width: 28, height: '1px', bgcolor: alpha(accent, 0.7) }} />
          </Stack>
          <Stack direction="row" gap={0.6} flexWrap="wrap" justifyContent="center">
            {facts.map((item, i) => (
              <Stack key={item} direction="row" alignItems="center" gap={0.6}>
                {i > 0 ? (
                  <Box
                    sx={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      bgcolor: alpha(brown, 0.5),
                    }}
                  />
                ) : null}
                <Typography
                  sx={{
                    color: brown,
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <PrimaryTrainingSelect />
        </Stack>
      </Panel>

      <Panel>
        <SectionTitle>Background</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.7, mt: 0.9 }}>
          {['Urban', 'Privileged', 'Monastic', 'Outlaw', 'Military', 'Wilderness'].map((item) => (
            <BackgroundCheckRow key={item} label={item} />
          ))}
        </Box>
      </Panel>

      <StatsPanel />

      <Panel>
        <SectionTitle>Balance</SectionTitle>
        <BalanceTrack />
      </Panel>

      <Panel>
        <SectionTitle>Conditions</SectionTitle>
        {/* Selectable buttons (state shared with the Combat tab's Conditions
            sub-tab). Two-column grid so each button has room to breathe. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            rowGap: 1.2,
            mt: 0.9,
          }}
        >
          {['Afraid', 'Angry', 'Guilty', 'Insecure', 'Troubled'].map((label, index, all) => {
            // Last button on an odd-length list spans both columns and
            // centers itself so "Troubled" doesn't sit alone in the
            // left column. Width matches a single column so the button
            // size stays consistent with its siblings.
            const lastSolo = index === all.length - 1 && all.length % 2 === 1;
            return (
              <Box
                key={label}
                sx={
                  lastSolo
                    ? {
                        gridColumn: '1 / -1',
                        justifySelf: 'center',
                        width: 'calc(50% - 4px)',
                      }
                    : undefined
                }
              >
                <ConditionButtonShared label={label} />
              </Box>
            );
          })}
        </Box>
      </Panel>

      <Panel>
        <ClassTraitAccordion title={character.classTraitTitle}>
          {character.classTraitBody}
        </ClassTraitAccordion>
      </Panel>

      <Panel>
        <HistorySection
          questions={[
            'Where did you grow up, and who raised you?',
            'What event most shaped who you are today?',
            'Who do you owe something to — and what is it?',
            'What did you leave behind when you took up this calling?',
            'What lesson from your past still guides you?',
          ]}
        />
      </Panel>

      {/* Connections is a section on the Character tab (formerly the standalone Bonds tab) */}
      <ConnectionsSection />
    </Stack>
  );
}

/**
 * FilterTabs — segmented filter row styled as parchment chips on a deeper
 * parchment groove. The active chip uses a watercolor wash fill and a thin
 * gold underline, mirroring the way the character sheet highlights selected
 * items.
 */
function FilterTabs({
  labels,
  activeIndex,
  onChange,
  chipPy = '10px',
}: {
  labels: string[];
  activeIndex: number;
  /**
   * Optional change handler — when supplied, the chips become interactive
   * buttons; the parent owns the selected state. When omitted the row
   * renders as static visual chips (legacy behavior).
   */
  onChange?: (index: number) => void;
  /** Vertical padding per chip. Default matches every other usage; the
   *  Combat tab's main sub-tabs override to a taller value. */
  chipPy?: string;
}) {
  return (
    <Stack
      direction="row"
      gap={0.4}
      sx={{
        bgcolor: alpha(parchmentDeep, 0.55),
        borderRadius: '4px',
        border: `1px solid ${alpha(border, 0.6)}`,
        p: '3px',
        boxShadow: `inset 0 1px 2px ${alpha(deepInk, 0.08)}`,
      }}
    >
      {labels.map((label, index) => {
        const active = index === activeIndex;
        const interactive = Boolean(onChange);
        return (
          <Box
            key={label}
            component={interactive ? 'button' : 'div'}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onChange?.(index) : undefined}
            sx={{
              flex: 1,
              py: chipPy,
              borderRadius: '3px',
              // Solid deep-ink fill on the active chip (matches the dark
              // blue of the header/footer brush stroke).
              background: active ? deepInk : 'transparent',
              // Active chip bg is deep-ink in both modes, so its text stays
              // near-white regardless of theme.
              color: active ? chromeText : alpha(brown, 0.75),
              textAlign: 'center',
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.62rem',
              fontWeight: active ? 900 : 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              boxShadow: active
                ? `0 1px 2px ${alpha(deepInk, 0.28)}, inset 0 0 0 1px ${alpha(accent, 0.5)}`
                : 'none',
              transition: 'all 0.18s ease',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              fontFamilyDisplay: 'inherit',
            }}
          >
            {label}
          </Box>
        );
      })}
    </Stack>
  );
}

/**
 * Expandable Move card. Collapsed: signature MoveDiamond + uppercased
 * title + disclosure carat. Expanded: appends the full move body text,
 * optional bullets list, and optional trailing paragraph.
 */
function MoveAccordion({ entry }: { entry: MoveEntry }) {
  const [open, setOpen] = useState(false);
  return (
    // Moves cards use the plain rectangular Panel variant — no notches.
    <Panel noNotch>
      <Stack spacing={0.6}>
        <Box
          component="button"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: 0.9,
            p: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {/* `ink` resolves to near-white in dark mode so the diamond
              pops on the dark Moves card; in light mode it stays a
              deep dark-blue, visually identical to the prior shade. */}
          {/* Moves diamond uses the muted-gold bookAccent so it reads
              as the rulebook chapter-heading color in both themes. */}
          <MoveDiamond color={bookAccent} size={18} />
          <Typography
            sx={{
              flex: 1,
              color: ink,
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.92rem',
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}
          >
            {entry.title}
          </Typography>
          <Box
            sx={{
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: alpha(ink, 0.8),
              fontSize: '1rem',
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            ›
          </Box>
        </Box>
        {open ? (
          <>
            <Box
              sx={{
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(accent, 0.6)} 12%, ${alpha(accent, 0.6)} 88%, transparent 100%)`,
              }}
            />
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                pt: 2,
                px: 2,
                pb: 2,
              }}
            >
              {entry.body}
            </Typography>
            {entry.bullets ? (
              <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
                {entry.bullets.map((bullet) => (
                  <Typography
                    key={bullet}
                    component="li"
                    sx={{
                      color: brown,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '0.86rem',
                      lineHeight: 1.45,
                      pt: 0.5,
                      px: 2,
                      pb: 0.5,
                      mb: 0.3,
                    }}
                  >
                    {bullet}
                  </Typography>
                ))}
              </Box>
            ) : null}
            {entry.trailing ? (
              <Typography
                sx={{
                  color: brown,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                  pt: 2,
                  px: 2,
                  pb: 2,
                }}
              >
                {entry.trailing}
              </Typography>
            ) : null}
          </>
        ) : null}
      </Stack>
    </Panel>
  );
}

function MovesPane() {
  const [subTab, setSubTab] = useAtom(movesSubTabAtom);
  // Basic + Balance lists come from the rulebook constants; class
  // moves come from the active character record so each character
  // can carry their own class-specific moves.
  const character = useAtomValue(characterStateAtom);
  const visibleMoves: MoveEntry[] =
    subTab === 0
      ? movesByCategory.basic
      : subTab === 1
        ? movesByCategory.balance
        : character.classMoves;
  return (
    <Stack spacing={1}>
      <FilterTabs
        labels={['Basic', 'Balance', 'Class']}
        activeIndex={subTab}
        onChange={setSubTab}
      />
      {visibleMoves.map((entry) => (
        <MoveAccordion key={entry.title} entry={entry} />
      ))}
    </Stack>
  );
}

/**
 * Expandable Technique card. Collapsed: shows the element badge, name,
 * and summary line, with the fatigue indicator on the right. Expanded:
 * appends the full description text below the row.
 */
function TechniqueAccordion({
  approach,
  name,
  summary,
  description,
  src,
  techColor,
  frameColor,
  isBasic = false,
}: {
  approach: TechniqueCategory;
  name: string;
  summary: string;
  description: string;
  src: string;
  techColor: string;
  frameColor?: string;
  /**
   * Basic techniques render the SquareInSquare icon (matching the Basic
   * filter selector) instead of the element image badge.
   */
  isBasic?: boolean;
}) {
  const { isDarkMode } = useThemeMode();
  const [open, setOpen] = useState(false);
  const categoryColor = techniqueCategoryColor(approach, isDarkMode);
  return (
    <Panel>
      <Stack spacing={0.5}>
        <Box
          component="button"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          sx={{
            display: 'flex',
            // Center vertically so the element badge aligns with the
            // middle of the title / summary text block.
            alignItems: 'center',
            width: '100%',
            gap: 0.9,
            p: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {isBasic ? (
            // Basic technique badge — same frame as ElementMark but renders
            // the SquareInSquare icon centered inside.
            <Box
              sx={{
                width: 36,
                height: 34,
                borderRadius: '3px',
                border: `1px solid ${alpha(deepInk, 0.35)}`,
                background: alpha(parchmentLight, 0.4),
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 auto',
                boxShadow: `0 0 0 2px ${alpha(parchmentLight, 0.75)}, 0 1px 3px ${alpha(deepInk, 0.2)}`,
              }}
            >
              <SquareInSquare color={techColor} size={22} />
            </Box>
          ) : (
            <ElementMark
              color={techColor}
              frameColor={isDarkMode ? undefined : frameColor}
              src={src}
              size={36}
              height={34}
            />
          )}
          <Stack spacing={0.35} sx={{ flex: 1, minWidth: 0 }}>
            {/* Approach eyebrow — color keyed to the technique's approach. */}
            <Typography
              sx={{
                color: categoryColor,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {approach}
            </Typography>
            <Typography
              sx={{
                color: ink,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.92rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              {name}
            </Typography>
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.82rem',
                lineHeight: 1.5,
              }}
            >
              {summary}
            </Typography>
          </Stack>
          <Stack alignItems="center" spacing={0.25} sx={{ pt: '2px' }}>
            <Typography
              sx={{
                color: techColor,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              FATIGUE
            </Typography>
            <Stack direction="row" gap={0.3}>
              {[0, 1].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    border: `1px solid ${techColor}`,
                    bgcolor: i === 0 ? techColor : 'transparent',
                  }}
                />
              ))}
            </Stack>
            <Box
              sx={{
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: alpha(ink, 0.8),
                fontSize: '0.95rem',
                lineHeight: 1,
                mt: 0.3,
              }}
            >
              ›
            </Box>
          </Stack>
        </Box>
        {open ? (
          <>
            <Box
              sx={{
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(accent, 0.6)} 12%, ${alpha(accent, 0.6)} 88%, transparent 100%)`,
              }}
            />
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                pt: 2,
                px: 2,
                pb: 2,
              }}
            >
              {description}
            </Typography>
          </>
        ) : null}
      </Stack>
    </Panel>
  );
}

function CombatPane() {
  const { isDarkMode } = useThemeMode();
  // Element filter row entries: [filter key, label, color, image src or null].
  // 'All' is the leftmost selector and shows every technique card. 'Basic'
  // is rendered with the local SquareInSquare SVG (filled square inside a
  // square outline) since there's no asset image for it.
  const elementFilters: Array<{
    key: TechniqueElementFilter;
    label: string;
    color: string;
    src: string | null;
  }> = [
    { key: 'all', label: 'All', color: ink, src: null },
    { key: 'basic', label: 'Basic', color: ink, src: null },
    { key: 'water', label: 'Water', color: water, src: elementWater },
    { key: 'earth', label: 'Earth', color: earth, src: elementEarth },
    { key: 'fire', label: 'Fire', color: fire, src: elementFire },
    { key: 'air', label: 'Air', color: air, src: elementAir },
    { key: 'martial', label: 'Weapons', color: martial, src: elementMartial },
    { key: 'tech', label: 'Tech', color: tech, src: elementTech },
  ];
  const positiveStatuses = ['Empowered', 'Favored', 'Inspired', 'Prepared'];
  const negativeStatuses = ['Doomed', 'Impaired', 'Trapped', 'Stunned'];
  const conditions = ['Afraid', 'Angry', 'Guilty', 'Insecure', 'Troubled'];
  // All UI state lives in jotai atoms so it persists when switching between
  // the Character / Moves / Combat / Backpack main tabs.
  const [subTab, setSubTab] = useAtom(combatSubTabAtom);
  const [techFilter, setTechFilter] = useAtom(techniqueFilterAtom);
  const [elementFilter, setElementFilter] = useAtom(techniqueElementAtom);
  // Techniques live on the character record (characterStateAtom) so
  // each character carries their own set of known techniques.
  const techniques = useAtomValue(characterStateAtom).techniques;
  // Filter by both element and proficiency level. techFilter 0 = All
  // (no level filter); 1..3 map to learned / practiced / mastered.
  const visibleTechniques = useMemo(() => {
    const targetLevel: TechniqueLevel | null =
      techFilter === 0 ? null : (['learned', 'practiced', 'mastered'] as const)[techFilter - 1];
    return techniques.filter((tech) => {
      const elementOk = elementFilter === 'all' || tech.type === elementFilter;
      const levelOk = targetLevel === null || tech.level === targetLevel;
      return elementOk && levelOk;
    });
  }, [techniques, elementFilter, techFilter]);
  const fatigue = useAtomValue(fatigueAtom);
  const tempFatigue = useAtomValue(tempFatigueAtom);
  const [, setCharacterState] = useAtom(characterStateAtom);
  const updateFatigueCapacity = (base: boolean[], temp: boolean[]) => {
    setCharacterState((prev) => ({ ...prev, fatigue: base, tempFatigue: temp }));
  };
  const [activeStatuses, setActiveStatuses] = useAtom(activeStatusesAtom);
  const toggleStatus = (label: string) =>
    setActiveStatuses((prev) => ({ ...prev, [label]: !prev[label] }));
  const [activeConditions, setActiveConditions] = useAtom(activeConditionsAtom);
  const toggleCondition = (label: string) =>
    setActiveConditions((prev) => ({ ...prev, [label]: !prev[label] }));
  const [inventory, setInventory] = useAtom(inventoryAtom);
  const [pendingInventoryDelete, setPendingInventoryDelete] = useState<number | null>(null);
  function updateInventoryItem(
    index: number,
    next: { type: string; name: string; description: string },
  ) {
    setInventory((prev) =>
      prev.map((entry, currentIndex) => (currentIndex === index ? next : entry)),
    );
  }
  function deleteInventoryItem() {
    if (pendingInventoryDelete === null) return;
    setInventory((prev) => prev.filter((_, index) => index !== pendingInventoryDelete));
    setPendingInventoryDelete(null);
  }
  // Conditions sub-tab mirrors Character tab conditions, with dark mode
  // using a deeper gold fill for a quieter active state.
  const conditionColor = isDarkMode ? darkConditionGold : bookAccent;
  const negativeStatusColor = isDarkMode ? darkNegativeRed : passionRed;

  return (
    <>
      <Stack spacing={1}>
        {/* Combat tab opens with the same Stats panel that lives on Character,
          for at-a-glance reference during combat rolls. */}
        <StatsPanel />
        <FatigueCard
          baseFatigue={fatigue}
          tempFatigue={tempFatigue}
          onUpdate={updateFatigueCapacity}
        />

        {/* Interactive combat sub-tabs — taller chips than the rest of the
          app to give the four primary combat surfaces more tap area. */}
        <FilterTabs
          labels={['Techniques', 'Statuses', 'Conditions', 'Inventory']}
          activeIndex={subTab}
          onChange={setSubTab}
          chipPy="20px"
        />

        {/* Techniques sub-tab: element filter row + expandable technique cards */}
        {subTab === 0 ? (
          <>
            {/* Element filter row: element-coloured frames keep the extracted
              white symbols readable on a light card. */}
            <Box
              sx={{
                background: isDarkMode ? deepInk : '#ffffff',
                border: `1px solid ${alpha(accent, 0.42)}`,
                borderRadius: '4px',
                p: '8px 10px',
                boxShadow: `0 2px 6px ${alpha(deepInk, 0.24)}, inset 0 0 0 1px ${alpha(chromeText, 0.06)}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.6,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                {elementFilters.map((entry) => {
                  const isActive = elementFilter === entry.key;
                  const frameColor =
                    entry.key === 'all' || entry.key === 'basic'
                      ? deepInk
                      : elementFilterFrames[entry.key];
                  return (
                    <Stack
                      key={entry.key}
                      component="button"
                      type="button"
                      onClick={() => setElementFilter(entry.key)}
                      aria-pressed={isActive}
                      alignItems="center"
                      spacing={0.4}
                      sx={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        p: 0,
                        flex: '0 0 auto',
                        opacity: isActive ? 1 : 0.55,
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {entry.key === 'all' || entry.key === 'basic' ? (
                        <Box
                          sx={{
                            width: 34,
                            height: 32,
                            borderRadius: '3px',
                            border: `1px solid ${alpha(frameColor, 0.62)}`,
                            background: frameColor,
                            display: 'grid',
                            placeItems: 'center',
                            flex: '0 0 auto',
                            boxShadow: `0 0 0 2px ${alpha(isDarkMode ? parchmentLight : '#ffffff', 0.85)}, 0 1px 3px ${alpha(deepInk, 0.2)}`,
                          }}
                        >
                          {entry.key === 'all' ? (
                            <Typography
                              sx={{
                                color: chromeText,
                                fontFamily:
                                  '"IM Fell English SC", "IM Fell English", Georgia, serif',
                                fontSize: '0.62rem',
                                fontWeight: 900,
                                letterSpacing: '0.04em',
                                lineHeight: 1,
                              }}
                            >
                              ALL
                            </Typography>
                          ) : (
                            <SquareInSquare color={chromeText} size={20} />
                          )}
                        </Box>
                      ) : (
                        <ElementMark
                          color={chromeText}
                          label={entry.label.slice(0, 1)}
                          src={entry.src ?? undefined}
                          frameColor={frameColor}
                          size={34}
                          height={32}
                        />
                      )}
                      <Typography
                        sx={{
                          color: isDarkMode ? chromeText : deepInk,
                          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                          fontSize: '0.58rem',
                          fontWeight: 900,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {entry.label}
                      </Typography>
                    </Stack>
                  );
                })}
              </Box>
            </Box>
            {/* Secondary filter row — proficiency level for the techniques list. */}
            <FilterTabs
              labels={['All', 'Learned', 'Practiced', 'Mastered']}
              activeIndex={techFilter}
              onChange={setTechFilter}
            />
            {visibleTechniques.map((tech) => {
              const isBasic = tech.type === 'basic';
              const visual = techniqueElementVisual(tech.type);
              return (
                <TechniqueAccordion
                  key={tech.name}
                  approach={tech.approach}
                  name={tech.name}
                  summary={tech.summary}
                  description={tech.description}
                  isBasic={isBasic}
                  // src is only used when isBasic=false (image badge path).
                  src={visual.src}
                  techColor={isBasic ? ink : visual.color}
                  frameColor={visual.frameColor}
                />
              );
            })}
            {visibleTechniques.length === 0 ? (
              <Panel>
                <Typography
                  sx={{
                    color: brownSoft,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '0.86rem',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    pt: 2,
                    px: 2,
                    pb: 2,
                    textAlign: 'center',
                  }}
                >
                  No techniques of that type.
                </Typography>
              </Panel>
            ) : null}
          </>
        ) : null}

        {/* Statuses sub-tab: each status is a toggleable button — blue for
          Positive, dark red for Negative. Empty / outlined by default,
          filled when tapped. */}
        {subTab === 1 ? (
          <Panel>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.9 }}>
              <Stack spacing={1.2}>
                <Typography
                  sx={{
                    color: alpha(brown, 0.7),
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.56rem',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                  }}
                >
                  POSITIVE
                </Typography>
                {positiveStatuses.map((label) => (
                  <StatusButton
                    key={label}
                    label={label}
                    active={Boolean(activeStatuses[label])}
                    activeColor={water}
                    onToggle={() => toggleStatus(label)}
                  />
                ))}
              </Stack>
              <Stack spacing={1.2}>
                <Typography
                  sx={{
                    color: passionRed,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.56rem',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                  }}
                >
                  NEGATIVE
                </Typography>
                {negativeStatuses.map((label) => (
                  <StatusButton
                    key={label}
                    label={label}
                    active={Boolean(activeStatuses[label])}
                    activeColor={negativeStatusColor}
                    onToggle={() => toggleStatus(label)}
                  />
                ))}
              </Stack>
            </Box>
          </Panel>
        ) : null}

        {/* Conditions sub-tab — same toggleable button pattern as Statuses
          and the Character tab's Conditions panel. Shared state via atom
          means toggling here also reflects on the Character tab. */}
        {subTab === 2 ? (
          <Panel>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, rowGap: 1.2 }}
            >
              {conditions.map((label, index, all) => {
                const lastSolo = index === all.length - 1 && all.length % 2 === 1;
                return (
                  <Box
                    key={label}
                    sx={
                      lastSolo
                        ? {
                            gridColumn: '1 / -1',
                            justifySelf: 'center',
                            width: 'calc(50% - 4px)',
                          }
                        : undefined
                    }
                  >
                    <StatusButton
                      label={label}
                      active={Boolean(activeConditions[label])}
                      activeColor={conditionColor}
                      onToggle={() => toggleCondition(label)}
                    />
                  </Box>
                );
              })}
            </Box>
          </Panel>
        ) : null}

        {/* Inventory sub-tab — same live inventory list that appears in Backpack. */}
        {subTab === 3 ? (
          <>
            {inventory.map((entry, index) => (
              <BackpackCard
                key={index}
                entry={entry}
                onUpdate={(next) => updateInventoryItem(index, next)}
                onRequestDelete={() => setPendingInventoryDelete(index)}
              />
            ))}
            {inventory.length === 0 ? (
              <Panel noNotch>
                <Typography
                  sx={{
                    color: brownSoft,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                    pt: 2,
                    px: 2,
                    pb: 2,
                    textAlign: 'center',
                  }}
                >
                  No inventory yet.
                </Typography>
              </Panel>
            ) : null}
          </>
        ) : null}
      </Stack>
      <AvatarLegendsConfirmDialog
        open={pendingInventoryDelete !== null}
        onCancel={() => setPendingInventoryDelete(null)}
        onConfirm={deleteInventoryItem}
      />
    </>
  );
}

/**
 * Connections section — rendered inside the Character tab. A SectionTitle
 * header followed by one panel per connection + an "Add Connection" action.
 */
function ConnectionsSection() {
  // Influence label + dots use the muted-gold bookAccent in both
  // themes — matches the rulebook chapter-heading color.
  const influenceLabelColor = bookAccent;
  const influenceDotsColor = bookAccent;
  // Connections come from the active character record.
  const connections = useAtomValue(characterStateAtom).connections;
  return (
    <Stack spacing={1}>
      <SectionTitle>Connections</SectionTitle>
      {connections.map(({ name, role, note }, index) => (
        <Panel key={name}>
          <Stack spacing={0.45}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack spacing={0.2} sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    color: ink,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '1rem',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    lineHeight: 1.05,
                  }}
                >
                  {name}
                </Typography>
                <Typography
                  sx={{
                    color: brownSoft,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontStyle: 'italic',
                  }}
                >
                  {role}
                </Typography>
              </Stack>
              {/* No more heart icon — Influence label + dots stand on
                  their own. */}
              <Stack alignItems="flex-end" spacing={0.2}>
                <Typography
                  sx={{
                    color: influenceLabelColor,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.54rem',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                  }}
                >
                  INFLUENCE
                </Typography>
                <StatDots value={4 - index} color={influenceDotsColor} />
              </Stack>
            </Stack>
            <Box
              sx={{
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(accent, 0.65)} 12%, ${alpha(accent, 0.65)} 88%, transparent 100%)`,
              }}
            />
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                pt: 2,
                px: 2,
                pb: 2,
              }}
            >
              {note}
            </Typography>
          </Stack>
        </Panel>
      ))}
      <Panel ornament={false}>
        <Stack direction="row" justifyContent="center" alignItems="center" gap={0.6}>
          <Typography
            sx={{
              color: ink,
              fontSize: '0.95rem',
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
            }}
          >
            +
          </Typography>
          <Typography
            sx={{
              color: ink,
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.78rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Add Connection
          </Typography>
        </Stack>
      </Panel>
    </Stack>
  );
}

/**
 * Editable swipe-to-delete card for both the Backpack > Notes and the
 * Backpack > Inventory lists. Same FabU-style swipe gesture as the
 * AccountMenu rows: drag left to reveal Delete (red, left) and Edit
 * (muted-gold accent, right). Edit pencils in an inline name input;
 * Delete stages a confirm dialog. Tapping the card body still
 * expands the description like the original NoteAccordion did.
 */
function BackpackCard({
  entry,
  onUpdate,
  onRequestDelete,
}: {
  entry: { type: string; name: string; description: string };
  onUpdate: (next: { type: string; name: string; description: string }) => void;
  onRequestDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [draftName, setDraftName] = useState(entry.name);
  const [draftDescription, setDraftDescription] = useState(entry.description);

  function commitEdit() {
    if (editingField === 'name') {
      const trimmed = draftName.trim();
      if (trimmed && trimmed !== entry.name) onUpdate({ ...entry, name: trimmed });
    } else if (editingField === 'description') {
      const trimmed = draftDescription.trim();
      if (trimmed !== entry.description) onUpdate({ ...entry, description: trimmed });
    }
    setEditingField(null);
  }

  function cancelEdit() {
    if (editingField === 'name') setDraftName(entry.name);
    else if (editingField === 'description') setDraftDescription(entry.description);
    setEditingField(null);
  }

  const swipeActions = open
    ? []
    : [
        {
          icon: <Trash2 size={18} />,
          color: '#7a2424',
          ariaLabel: 'Delete card',
          closeOnClick: false,
          onClick: onRequestDelete,
        },
        {
          icon: <Pencil size={18} />,
          color: bookAccent,
          ariaLabel: 'Rename card',
          onClick: () => {
            setDraftName(entry.name);
            setEditingField('name');
          },
        },
      ];
  const descriptionSwipeActions = [
    {
      icon: <Pencil size={18} />,
      color: bookAccent,
      ariaLabel: 'Edit description',
      onClick: () => {
        setDraftDescription(entry.description);
        setEditingField('description');
      },
    },
  ];

  return (
    <SwipeableCard actions={swipeActions}>
      <Panel noNotch>
        <Stack spacing={0.5}>
          <Box
            component="button"
            type="button"
            onClick={() => {
              if (editingField) return;
              setOpen((value) => !value);
            }}
            aria-expanded={open}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              width: '100%',
              columnGap: 0.8,
              p: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Stack spacing={0.4} sx={{ minWidth: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  sx={{
                    color: bookAccent,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.58rem',
                    fontWeight: 900,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  {entry.type}
                </Typography>
              </Stack>
              {editingField === 'name' ? (
                <InputBase
                  value={draftName}
                  autoFocus
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  onBlur={commitEdit}
                  sx={{
                    width: '100%',
                    color: ink,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.98rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                    '& input': { p: 0 },
                  }}
                />
              ) : (
                <Typography
                  sx={{
                    color: ink,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.98rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                  }}
                >
                  {entry.name}
                </Typography>
              )}
            </Stack>
            <Box
              sx={{
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: alpha(ink, 0.8),
                fontSize: '1.4rem',
                lineHeight: 1,
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
            >
              ›
            </Box>
          </Box>
          {open ? (
            <>
              <SwipeableCard actions={descriptionSwipeActions} borderRadius="4px">
                <Box
                  sx={{
                    border: `1px solid ${alpha(border, 0.6)}`,
                    borderRadius: '4px',
                    bgcolor: alpha(parchmentLight, 0.72),
                  }}
                >
                  {editingField === 'description' ? (
                    <InputBase
                      value={draftDescription}
                      autoFocus
                      multiline
                      maxRows={6}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) commitEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={commitEdit}
                      sx={{
                        width: '100%',
                        color: brown,
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: '0.86rem',
                        lineHeight: 1.5,
                        pt: 2,
                        px: 2,
                        pb: 2,
                        boxSizing: 'border-box',
                        '& textarea': { p: 0 },
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        color: brown,
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: '0.86rem',
                        lineHeight: 1.5,
                        pt: 2,
                        px: 2,
                        pb: 2,
                      }}
                    >
                      {entry.description}
                    </Typography>
                  )}
                </Box>
              </SwipeableCard>
            </>
          ) : null}
        </Stack>
      </Panel>
    </SwipeableCard>
  );
}

/**
 * Swipeable fatigue card with modal editor for base and temp capacities.
 * Base fatigue tracks mandatory damage; temp fatigue tracks additional
 * boxes from conditions or abilities. Temp diamonds use the same diamond
 * shape as base fatigue and render in the Avatar accent blue.
 */
function FatigueCard({
  baseFatigue,
  tempFatigue,
  onUpdate,
}: {
  baseFatigue: boolean[];
  tempFatigue: boolean[];
  onUpdate: (base: boolean[], temp: boolean[]) => void;
}) {
  const { isDarkMode } = useThemeMode();
  const cardAnchorRef = useRef<HTMLDivElement | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [draftBaseCapacity, setDraftBaseCapacity] = useState(baseFatigue.length);
  const [draftTempCapacity, setDraftTempCapacity] = useState(tempFatigue.length);
  const tempFatigueColor = isDarkMode ? darkConditionGold : bookAccent;

  function openEditor() {
    setDraftBaseCapacity(baseFatigue.length);
    setDraftTempCapacity(tempFatigue.length);
    setPopoverOpen(true);
  }

  function confirmEdit() {
    const newBaseCapacity = Math.max(0, Math.min(10, Math.floor(draftBaseCapacity)));
    const newTempCapacity = Math.max(0, Math.min(10, Math.floor(draftTempCapacity)));
    const newBase = [
      ...baseFatigue.slice(0, newBaseCapacity),
      ...Array(Math.max(0, newBaseCapacity - baseFatigue.length)).fill(false),
    ];
    const newTemp = [
      ...tempFatigue.slice(0, newTempCapacity),
      ...Array(Math.max(0, newTempCapacity - tempFatigue.length)).fill(false),
    ];
    onUpdate(newBase, newTemp);
    setPopoverOpen(false);
  }

  function toggleBaseFatigue(index: number) {
    onUpdate(
      baseFatigue.map((filled, currentIndex) => (currentIndex === index ? !filled : filled)),
      tempFatigue,
    );
  }

  function toggleTempFatigue(index: number) {
    onUpdate(
      baseFatigue,
      tempFatigue.map((filled, currentIndex) => (currentIndex === index ? !filled : filled)),
    );
  }

  return (
    <>
      <Box ref={cardAnchorRef}>
        <SwipeableCard
          actions={[
            {
              icon: <Pencil size={18} />,
              color: bookAccent,
              ariaLabel: 'Edit fatigue capacity',
              onClick: openEditor,
            },
          ]}
        >
          <Panel noNotch>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Stack spacing={0.3}>
                <SectionTitle>Fatigue</SectionTitle>
                {tempFatigue.length > 0 ? (
                  <Typography
                    sx={{
                      color: alpha(brown, 0.7),
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    {baseFatigue.length} base + {tempFatigue.length} temp
                  </Typography>
                ) : null}
              </Stack>
              <Stack direction="row" gap={0.7}>
                {tempFatigue.map((filled, index) => (
                  <FatigueDiamond
                    key={`temp-${index}`}
                    filled={filled}
                    color={tempFatigueColor}
                    size={28}
                    ariaLabel={`Toggle temporary fatigue ${index + 1}`}
                    onToggle={() => toggleTempFatigue(index)}
                  />
                ))}
                {Array.from({ length: baseFatigue.length }).map((_, index) => (
                  <FatigueDiamond
                    key={`base-${index}`}
                    filled={baseFatigue[index]}
                    size={28}
                    ariaLabel={`Toggle base fatigue ${index + 1}`}
                    onToggle={() => toggleBaseFatigue(index)}
                  />
                ))}
              </Stack>
            </Stack>
          </Panel>
        </SwipeableCard>
      </Box>

      <Popover
        open={popoverOpen}
        anchorEl={cardAnchorRef.current}
        onClose={() => setPopoverOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            bgcolor: parchment,
            backgroundImage: 'none',
            border: `1px solid ${isDarkMode ? '#ffffff' : border}`,
            borderRadius: '10px',
            p: 2.25,
            mt: 0.75,
            width: cardAnchorRef.current?.getBoundingClientRect().width ?? 320,
            maxWidth: 'calc(100vw - 32px)',
            boxShadow: `0 8px 22px ${alpha(deepInk, 0.28)}`,
          },
        }}
      >
        <Stack spacing={1.8}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: ink }}>
            Edit Fatigue Capacity
          </Typography>

          <CapacityPicker
            label="Base Capacity"
            value={draftBaseCapacity}
            color={passionRed}
            onChange={setDraftBaseCapacity}
          />

          <CapacityPicker
            label="Temporary Capacity"
            value={draftTempCapacity}
            color={tempFatigueColor}
            onChange={setDraftTempCapacity}
          />

          <Stack direction="row" gap={1} sx={{ pt: 1.2 }}>
            <Button
              onClick={() => setPopoverOpen(false)}
              sx={{
                flex: 1,
                height: 40,
                borderRadius: '8px',
                border: `1px solid ${border}`,
                color: brown,
                textTransform: 'none',
                fontWeight: 800,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEdit}
              variant="contained"
              sx={{
                flex: 1,
                height: 40,
                borderRadius: '8px',
                bgcolor: bookAccent,
                color: '#000000',
                textTransform: 'none',
                fontWeight: 800,
                '&:hover': { bgcolor: bookAccent },
              }}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}

/**
 * Compact, theme-aware confirmation dialog used by the Backpack
 * Note / Item delete flow. Avoids importing the fab-u
 * ConfirmDeleteModal (which lives in a FabU tokens context the AL
 * page doesn't provide) by inlining a tiny MUI Dialog here.
 */
function AvatarLegendsConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: parchment,
          backgroundImage: 'none',
          border: `1px solid ${border}`,
          borderRadius: '14px',
          p: 2.25,
          m: 2,
        },
      }}
      // AL navy backdrop so iOS standalone PWA's status bar doesn't
      // pick up a different color while the dialog is animating in.
      slotProps={{
        backdrop: {
          sx: { backgroundColor: deepInk, opacity: 0.92 },
        },
      }}
    >
      <Stack spacing={2.25}>
        <Typography
          sx={{
            color: ink,
            fontWeight: 700,
            fontSize: '1.05rem',
            lineHeight: 1.25,
            textAlign: 'center',
          }}
        >
          Are you sure you want to delete?
        </Typography>
        <Stack direction="row" spacing={1.25}>
          <Button
            onClick={onCancel}
            fullWidth
            variant="outlined"
            sx={{
              borderColor: border,
              color: ink,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              py: 0.85,
              '&:hover': { borderColor: brownSoft, bgcolor: 'transparent' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            fullWidth
            variant="contained"
            sx={{
              bgcolor: '#7a2424',
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              py: 0.85,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#7a2424', filter: 'brightness(0.92)' },
            }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

function BackpackPane() {
  const [subTab, setSubTab] = useAtom(backpackSubTabAtom);
  const [notes, setNotes] = useAtom(notesAtom);
  const [inventory, setInventory] = useAtom(inventoryAtom);
  // Pending-delete state for the inline confirm dialog. Uniquely
  // identifies a card by sub-tab + index because the underlying
  // entries don't carry stable ids.
  const [pendingDelete, setPendingDelete] = useState<{
    list: 'notes' | 'inventory';
    index: number;
  } | null>(null);

  function addNote() {
    setNotes((prev) => [
      ...prev,
      { type: 'Note', name: 'New Note', description: 'Add a note here.' },
    ]);
  }

  function addItem() {
    setInventory((prev) => [
      ...prev,
      { type: 'Item', name: 'New Item', description: 'Add a description here.' },
    ]);
  }

  function addLore() {
    setNotes((prev) => [
      ...prev,
      { type: 'Lore', name: 'New Lore', description: 'Add lore here.' },
    ]);
  }

  function addSessionNote() {
    setNotes((prev) => [
      ...prev,
      { type: 'Session Note', name: 'New Session Note', description: 'Add session notes here.' },
    ]);
  }

  function updateNote(index: number, next: { type: string; name: string; description: string }) {
    setNotes((prev) => prev.map((entry, i) => (i === index ? next : entry)));
  }

  function updateItem(index: number, next: { type: string; name: string; description: string }) {
    setInventory((prev) => prev.map((entry, i) => (i === index ? next : entry)));
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const { list, index } = pendingDelete;
    setPendingDelete(null);
    if (list === 'notes') {
      setNotes((prev) => prev.filter((_, i) => i !== index));
    } else {
      setInventory((prev) => prev.filter((_, i) => i !== index));
    }
  }

  const visibleNoteEntries = notes
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.type !== 'Lore' && entry.type !== 'Session Note');
  const loreEntries = notes
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.type === 'Lore');
  const sessionEntries = notes
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.type === 'Session Note');

  // Shared style for the "+ X" add buttons at the bottom of each list.
  const addButtonContent = (label: string) => (
    <Stack direction="row" justifyContent="center" alignItems="center" gap={0.6}>
      <Typography
        sx={{
          color: ink,
          fontSize: '0.95rem',
          fontWeight: 900,
          fontFamily: 'Georgia, serif',
        }}
      >
        +
      </Typography>
      <Typography
        sx={{
          color: ink,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.78rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    </Stack>
  );

  return (
    <Stack spacing={1}>
      <FilterTabs
        labels={['Notes', 'Inventory', 'Lore', 'Sessions']}
        activeIndex={subTab}
        onChange={setSubTab}
      />

      {/* Notes sub-tab: editable + deletable accordion cards. */}
      {subTab === 0 ? (
        <>
          {visibleNoteEntries.map(({ entry, index }) => (
            <BackpackCard
              key={index}
              entry={entry}
              onUpdate={(next) => updateNote(index, next)}
              onRequestDelete={() => setPendingDelete({ list: 'notes', index })}
            />
          ))}
          <Box
            component="button"
            type="button"
            onClick={addNote}
            sx={{
              background: 'none',
              border: 'none',
              p: 0,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <Panel noNotch>{addButtonContent('New Note')}</Panel>
          </Box>
        </>
      ) : null}

      {/* Inventory sub-tab — same swipe/edit/delete pattern + + Item. */}
      {subTab === 1 ? (
        <>
          {inventory.map((entry, index) => (
            <BackpackCard
              key={index}
              entry={entry}
              onUpdate={(next) => updateItem(index, next)}
              onRequestDelete={() => setPendingDelete({ list: 'inventory', index })}
            />
          ))}
          <Box
            component="button"
            type="button"
            onClick={addItem}
            sx={{
              background: 'none',
              border: 'none',
              p: 0,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <Panel noNotch>{addButtonContent('Item')}</Panel>
          </Box>
        </>
      ) : null}

      {subTab === 2 ? (
        <>
          {loreEntries.map(({ entry, index }) => (
            <BackpackCard
              key={index}
              entry={entry}
              onUpdate={(next) => updateNote(index, next)}
              onRequestDelete={() => setPendingDelete({ list: 'notes', index })}
            />
          ))}
          <Box
            component="button"
            type="button"
            onClick={addLore}
            sx={{
              background: 'none',
              border: 'none',
              p: 0,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <Panel noNotch>{addButtonContent('Lore')}</Panel>
          </Box>
        </>
      ) : null}

      {subTab === 3 ? (
        <>
          {sessionEntries.map(({ entry, index }) => (
            <BackpackCard
              key={index}
              entry={entry}
              onUpdate={(next) => updateNote(index, next)}
              onRequestDelete={() => setPendingDelete({ list: 'notes', index })}
            />
          ))}
          <Box
            component="button"
            type="button"
            onClick={addSessionNote}
            sx={{
              background: 'none',
              border: 'none',
              p: 0,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <Panel noNotch>{addButtonContent('Session Note')}</Panel>
          </Box>
        </>
      ) : null}
      <AvatarLegendsConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  );
}

function AvatarLegends() {
  const [activeTab, setActiveTab] = useState<AvatarTab>('character');
  const activeConfig = useMemo(
    () => tabs.find((tab) => tab.value === activeTab) ?? tabs[0],
    [activeTab],
  );

  // Dark mode for the avatar-legends UI. applyAvatarPalette mutates the
  // module-level color `let`s so every helper component picks up the
  // correct theme palette on its next render. Done at the start of
  // render, before children read those colors during their own render.
  const { isDarkMode } = useThemeMode();
  applyAvatarPalette(isDarkMode);
  const pageBg = isDarkMode ? darkPageBg : lightPageBg;
  // White cornflower gradient applied to the active-tab title bar in
  // light mode (transferred from the app header per the user spec).
  // Black title text reads against that gradient. In dark mode the
  // title bar stays on the parchment with `ink` text.
  const whiteCornflowerGradient = `linear-gradient(180deg, #ffffff 0%, ${alpha('#dbe5f0', 0.9)} 100%)`;
  const tabTitleBg = isDarkMode ? 'transparent' : whiteCornflowerGradient;
  const tabTitleColor = isDarkMode ? ink : '#000000';
  // Read the active character so the brush-stroke header heading shows
  // their name on every non-Character tab.
  const character = useAtomValue(characterStateAtom);
  const trainingTheme =
    primaryTrainingThemes[character.primaryTraining] ??
    primaryTrainingThemes[defaultCharacter.primaryTraining];

  return (
    <>
      {/* Render-less mount that keeps the characterStateAtom in lockstep
          with the user's Convex character record while they're signed in. */}
      {/* Sync hook lives behind an error boundary so a transient
          Convex / auth failure doesn't crash the whole page — same
          pattern FabU's `ConvexCharacterSyncBoundary` uses. */}
      <ErrorBoundary
        fallbackRender={() => null}
        onError={(error) => {
          console.warn('Avatar Legends Convex sync is unavailable; continuing locally.', error);
        }}
      >
        <ConvexCharacterSyncMount />
      </ErrorBoundary>
      <Box
        sx={{
          // Use the *large* viewport unit so the outer mat extends through
          // iOS safe areas (home indicator strip) instead of stopping at
          // the small-viewport line and exposing the page background
          // colour below the app card.
          minHeight: '100vh',
          // Outer mat around the parchment card — gradient switches with mode.
          background: pageBg,
          display: 'grid',
          placeItems: 'center',
          p: { xs: 0, sm: 2 },
        }}
      >
        <Box
          sx={{
            width: 'min(100vw, 430px)',
            // 100vh on mobile so the card itself fills through the safe
            // area too; desktop keeps its capped card height.
            height: { xs: '100vh', sm: 'min(860px, calc(100vh - 32px))' },
            borderRadius: { xs: 0, sm: '12px' },
            // Flat solid card background. The cornflower watercolor wash
            // applied on top (see overlay layer below) handles the colour
            // depth; the underlying parchment stays uniformly tinted.
            background: parchment,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: {
              xs: 'none',
              sm: `0 26px 70px ${alpha(deepInk, 0.55)}, 0 0 0 1px ${alpha(border, 0.45)}`,
            },
          }}
        >
          {/* Paper grain via repeating radial noise */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              background: `repeating-radial-gradient(circle at 25% 25%, transparent 0, transparent 2px, ${alpha(brown, 0.025)} 3px, transparent 4px)`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {/* Faded, muted cornflower-blue watercolor wash. Sits over the
            parchment + paper-grain texture using multiply blend so the
            texture still shows through; the radial pools feather outward
            to give the parchment a soft hand-painted depth. */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              background: trainingTheme.bodyWash,
              mixBlendMode: 'multiply',
              filter: 'contrast(0.9) brightness(1.02)',
            }}
          />

          {/* Top header band — deep cover-art navy in both modes. */}
          <WatercolorBand
            height={92}
            fill={trainingTheme.chromeFill}
            borderColor={trainingTheme.headerBorder}
            brushBorder={trainingTheme.brushBorder}
          />
          <WatercolorBand
            bottom
            height={86}
            fill={trainingTheme.chromeFill}
            borderColor={trainingTheme.footerBorder}
            brushBorder={trainingTheme.brushBorder}
          />

          {/* Page corner ornaments — near-white in both modes, sitting on
            the deep-navy header. */}
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
            <CornerOrnament position="tl" color={chromeText} size={18} />
            <CornerOrnament position="tr" color={chromeText} size={18} />
          </Box>

          <Stack sx={{ position: 'relative', height: '100%', zIndex: 1 }}>
            {/* Top header — dark navy brush-stroke band. Heading text on the
              left, app-level settings button on the right, both centered
              vertically within the solid portion of the band. The heading
              shows "Avatar Legends" on the Character tab and the active
              character's name on the others. */}
            <Box
              sx={{
                height: 76,
                flex: '0 0 auto',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                px: 1.4,
                // Reserve room at the bottom for the part of the band that
                // sits OUTSIDE the painted area (none now that bristle streaks
                // are gone, but kept slightly inset so the content centers on
                // the solid block).
                pb: '14px',
              }}
            >
              {activeTab === 'character' ? (
                <Typography
                  sx={{
                    color: chromeText,
                    fontFamily: '"IM Fell English", Georgia, serif',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  Avatar Legends
                </Typography>
              ) : (
                // spacing=0.6 (~4.8px) gives ~4px more between the eyebrow and
                // the character name compared to the original tight 0.1.
                <Stack spacing={0.6}>
                  <Typography
                    sx={{
                      color: alpha(chromeText, 0.7),
                      fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    Avatar Legends
                  </Typography>
                  <Typography
                    sx={{
                      color: chromeText,
                      fontFamily: '"IM Fell English", Georgia, serif',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      letterSpacing: '0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {character.name}
                  </Typography>
                </Stack>
              )}
              <AccountSettings gameSystem="avatar-legends" />
            </Box>

            {/* Active-tab title bar. In light mode this band carries the
              whiter cornflower gradient + black title text (transferred
              from the app header per the user spec). In dark mode it
              stays on the parchment surface. */}
            <Box
              sx={{
                px: 1.4,
                pt: 1.1,
                pb: 0.5,
                background: tabTitleBg,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" gap={0.8}>
                  <MoveDiamond color={accent} size={11} />
                  <Typography
                    sx={{
                      color: tabTitleColor,
                      fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {activeConfig.label}
                  </Typography>
                </Stack>
              </Stack>
              <Box
                sx={{
                  mt: 0.7,
                  height: '1px',
                  // Divider line now uses the pale-blue accent (sampled
                  // from the rulebook heading-divider line) instead of the
                  // dark red — keeps dark red reserved for semantic
                  // warnings (Fatigue / Conditions / Negative Statuses).
                  background: `linear-gradient(90deg, transparent 0%, ${alpha(accent, 0.75)} 20%, ${alpha(accent, 0.75)} 80%, transparent 100%)`,
                }}
              />
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                px: 1.25,
                pt: 2.5,
                // Reserve room at the bottom so the last bit of content
                // scrolls up clear of the absolutely-positioned nav. Now
                // tight to the actual nav height (no bristle band sits
                // behind it) so there's no dark strip for content to
                // scroll over.
                // Footer pb dropped by 8px (see below) — content reserve
                // shrinks to match so the last row sits flush against the
                // nav top.
                pb: 'calc(76px + 20px)',
              }}
            >
              {activeTab === 'character' ? <CharacterPane /> : null}
              {activeTab === 'moves' ? <MovesPane /> : null}
              {activeTab === 'combat' ? <CombatPane /> : null}
              {activeTab === 'backpack' ? <BackpackPane /> : null}
            </Box>

            {/* Bottom nav floats over the bottom watercolor brush stroke and
              the page content scrolls UNDER it. Absolute positioning takes
              the nav out of the flex flow so the scrollable area above can
              extend full-height. A high zIndex makes sure the nav stays
              above any in-page content that scrolls past. */}
            <Box
              sx={{
                px: 0.5,
                // ~12px of bottom padding to clear the iOS home
                // indicator without making the footer feel oversized.
                // (Was 28px — shrunk by 8px per spec.)
                pb: '20px',
                pt: 0.3,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                // Solid backdrop matching the active training chrome so body
                // content scrolling behind the nav is fully occluded.
                background: trainingTheme.chromeFill,
                borderTop: `2px solid ${trainingTheme.footerBorder}`,
              }}
            >
              {/* 15px pull-in on each side (~30px total) trims the visible
                nav row while the dark backdrop stays full-width. `flex: 1`
                on each tab keeps everything on one row. */}
              <Stack direction="row" sx={{ mx: '15px' }}>
                {tabs.map((tab) => {
                  const selected = tab.value === activeTab;
                  return (
                    <ButtonBase
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      disableRipple
                      disableTouchRipple
                      focusRipple={false}
                      // Use a non-button wrapper to skip the browser's
                      // default tap behavior entirely (button elements
                      // get a brief active/pressed state in some
                      // engines that no amount of CSS overrides).
                      component="div"
                      role="button"
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        borderRadius: '10px',
                        pt: 0,
                        pb: 0.5,
                        color: selected ? chromeText : alpha(chromeText, 0.55),
                        position: 'relative',
                        overflow: 'visible',
                        // Suppress any active/focused/hover transform or
                        // background change so the icon doesn't appear
                        // to shift on tap. The opacity transition
                        // (selected vs unselected) is the only visual
                        // feedback we want here.
                        transition: 'none !important',
                        transform: 'none !important',
                        '&:hover': {
                          background: 'transparent',
                          transform: 'none',
                        },
                        '&:active': {
                          background: 'transparent',
                          transform: 'none',
                        },
                        '&:focus, &:focus-visible': {
                          outline: 'none',
                          background: 'transparent',
                          transform: 'none',
                        },
                        WebkitTapHighlightColor: 'transparent',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                      }}
                    >
                      {/* Active indicator — solid dark-red pill at the top edge.
                        Solid fill (was a gradient) so it matches the rest of
                        the app's now-flat button surfaces. */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -2,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 28,
                          height: 3,
                          borderRadius: '0 0 4px 4px',
                          // Active-tab pill now uses the pale-blue accent
                          // so dark red is reserved for semantic warnings.
                          background: selected ? accent : 'transparent',
                          boxShadow: selected ? `0 0 6px ${alpha(accent, 0.7)}` : 'none',
                          // No transition — colour + shadow flip
                          // instantly when selection changes, so the
                          // mobile PWA doesn't render an intermediate
                          // frame the user could read as movement.
                          transition: 'none',
                        }}
                      />
                      {/* spacing=1.05 (~8.4px) — was 0.3 (~2.4px); +6px
                        gap between the icon and the label per spec. */}
                      <Stack alignItems="center" spacing={1.05} sx={{ pt: '10px' }}>
                        {tab.renderIcon ? (
                          // Inline SVG icon (e.g. Moves diamond) — color comes from
                          // current selection so we don't need the brightness/invert
                          // filter that the PNG icons use.
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              display: 'grid',
                              placeItems: 'center',
                              opacity: selected ? 1 : 0.6,
                              transition: 'none',
                            }}
                          >
                            {tab.renderIcon({
                              color: chromeText,
                              size: 20,
                            })}
                          </Box>
                        ) : (
                          <Box
                            component="img"
                            src={tab.iconSrc}
                            alt=""
                            sx={{
                              width: 22,
                              height: 22,
                              objectFit: 'contain',
                              objectPosition: 'center',
                              opacity: selected ? 1 : 0.5,
                              filter: 'brightness(0) invert(1)',
                              transition: 'none',
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                            fontSize: '0.58rem',
                            // Keep weight constant so the label glyph
                            // bounds don't change between selected /
                            // unselected — the mobile PWA was reading
                            // the weight swap as a tiny icon shift.
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                          }}
                        >
                          {tab.label}
                        </Typography>
                      </Stack>
                    </ButtonBase>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>
    </>
  );
}

export default AvatarLegends;
