import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link } from 'react-router';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Dialog from '@mui/material/Dialog';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useQuery } from 'convex/react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Backpack, ChevronRight, HandFist, House, Info, Pencil, Trash2 } from 'lucide-react';

import { SwipeableCard } from '@/components/SwipeableCard';
import UndoSnackbar from '@/components/fab-u/atoms/UndoSnackbar';
import { avatarDarkTokens, avatarLightTokens } from '@/components/fab-u/tokens';
import type { FabUTokens } from '@/components/fab-u/tokens';
import AccountSettings from '@/sections/AccountSettings';
import { createCharacterHistory } from '@/state/createCharacterHistory';
import { readJsonLocalStorage } from '@/state/indexedDbCharacterStorage';
import { persistAppView, readPersistentAppView } from '@/state/persistentAppLocation';
import { useLocalCharacterSlots } from '@/state/useLocalCharacterSlots';
import { useConvexCharacterSync } from '@/sync/useConvexCharacterSync';
import { useThemeMode } from '@/theme/hooks';

import { api } from '../../../convex/_generated/api';
// White training symbols extracted from the Avatar Legends training reference pages.
// They are transparent PNGs and rely on the deep-ink filter band for contrast.
import elementAir from './assets/airbending-symbol.png';
import elementEarth from './assets/earthbending-symbol.png';
import elementMartial from './assets/element-martial.svg';
import fireBorderMask from './assets/fire-border-mask.png';
import elementFire from './assets/firebending-symbol.png';
import principleBg from './assets/principle-bg.png';
import principleFg from './assets/principle-fg.png';
import elementTech from './assets/technology-symbol.png';
import elementWater from './assets/waterbending-symbol.png';
import elementWeapons from './assets/weapons-symbol.png';
import {
  type TechniqueFatigue,
  deriveTechniqueFatigue,
  withTechniqueFatigue,
} from './techniqueFatigue';
import {
  dedupeTechniques,
  getTechniqueIdentityKey,
  getTechniquePersistenceKey,
} from './techniqueIdentity';

type AvatarTab = 'character' | 'moves' | 'combat' | 'backpack';

type TabConfig = {
  label: string;
  value: AvatarTab;
  // Either provide an image icon (iconSrc) or a custom inline icon (renderIcon).
  // The Moves tab uses the signature diamond-in-diamond glyph rendered inline.
  iconSrc?: string;
  renderIcon?: (props: { color: string; size: number }) => React.ReactNode;
};

type PrimaryTraining =
  | 'Waterbending'
  | 'Earthbending'
  | 'Firebending'
  | 'Airbending'
  | 'Weapons'
  | 'Technology';

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

function blendHex(hex: string, target: string, amount: number) {
  const normalize = (value: string) => value.replace('#', '');
  const sourceHex = normalize(hex);
  const targetHex = normalize(target);
  const source = [0, 2, 4].map((index) => parseInt(sourceHex.slice(index, index + 2), 16));
  const destination = [0, 2, 4].map((index) => parseInt(targetHex.slice(index, index + 2), 16));
  const blended = source.map((channel, index) =>
    Math.round(channel + (destination[index] - channel) * amount),
  );
  return `#${blended.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function createAvatarAccountTokens(
  isDarkMode: boolean,
  trainingTheme: { chromeColor: string },
): FabUTokens {
  const base = isDarkMode ? avatarDarkTokens : avatarLightTokens;
  const chromeColor = trainingTheme.chromeColor;
  const modalSurface = isDarkMode
    ? blendHex(chromeColor, '#000000', 0.42)
    : blendHex(chromeColor, '#ffffff', 0.88);
  const liftedSurface = isDarkMode
    ? blendHex(chromeColor, '#000000', 0.28)
    : blendHex(chromeColor, '#ffffff', 0.94);
  const borderColor = isDarkMode
    ? blendHex(chromeColor, '#ffffff', 0.26)
    : blendHex(chromeColor, '#ffffff', 0.62);
  const actionHover = isDarkMode
    ? blendHex(chromeColor, '#ffffff', 0.13)
    : blendHex(chromeColor, '#000000', 0.12);

  return {
    ...base,
    color: {
      ...base.color,
      page: chromeColor,
      canvas: chromeColor,
      surface: modalSurface,
      surfaceCard: liftedSurface,
      pillSurface: liftedSurface,
      surfaceMuted: isDarkMode
        ? blendHex(chromeColor, '#000000', 0.18)
        : blendHex(chromeColor, '#ffffff', 0.82),
      border: borderColor,
      brand: chromeColor,
      brandStrong: actionHover,
      brandSoft: isDarkMode
        ? blendHex(chromeColor, '#000000', 0.22)
        : blendHex(chromeColor, '#ffffff', 0.78),
      labelBg: chromeColor,
      fp: isDarkMode ? uiPrimaryDark : uiPrimary,
      mp: isDarkMode ? uiPrimaryDark : uiPrimary,
    },
    shadow: {
      soft: isDarkMode ? '0 4px 14px rgba(0, 0, 0, 0.55)' : base.shadow.soft,
      card: isDarkMode ? '0 4px 14px rgba(0, 0, 0, 0.5)' : base.shadow.card,
    },
  };
}

// Mutable swappable colors — re-assigned by AvatarLegends before its
// children render. Components keep referencing these as if they were
// module-level constants.
let parchment = lightAvPalette.parchment;
let parchmentLight = lightAvPalette.parchmentLight;
let parchmentDeep = lightAvPalette.parchmentDeep;
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
let uiPrimary = '#4a7fa8';
let uiPrimaryDark = '#6fa9d6';

type TrainingPaletteOverrides = {
  dark: Partial<AvPaletteShape>;
  light: Partial<AvPaletteShape>;
};

const trainingPaletteOverrides: Record<PrimaryTraining, TrainingPaletteOverrides> = {
  Waterbending: { dark: {}, light: {} },
  Earthbending: {
    light: {
      parchment: '#e6efe1',
      parchmentLight: '#f4f8f1',
      parchmentDeep: '#ceddc6',
      washDeep: '#7ca05e',
      ink: '#2f5a34',
      deepInk: '#132016',
      brown: '#3f5c3f',
      brownSoft: '#5d7759',
      border: '#b5c9ab',
      accent: '#a9c894',
    },
    dark: {
      parchment: '#0d160e',
      parchmentLight: '#172317',
      parchmentDeep: '#071008',
      washDeep: '#8ea279',
      ink: '#f0f5eb',
      deepInk: '#132016',
      brown: '#e8f0df',
      brownSoft: '#c8d4bf',
      border: '#31432f',
      accent: '#93ac7d',
    },
  },
  Firebending: {
    light: {
      parchment: '#f0e3df',
      parchmentLight: '#fbf3f0',
      parchmentDeep: '#dfcbc5',
      washDeep: '#b76a5e',
      ink: '#69332e',
      deepInk: '#241312',
      brown: '#6c4640',
      brownSoft: '#895f58',
      border: '#cfb1aa',
      accent: '#d4988f',
    },
    dark: {
      parchment: '#190d0c',
      parchmentLight: '#261714',
      parchmentDeep: '#100706',
      washDeep: '#aa7168',
      ink: '#f8eeec',
      deepInk: '#241312',
      brown: '#f0dfdc',
      brownSoft: '#d8c0bb',
      border: '#4b2f2b',
      accent: '#bf756c',
    },
  },
  Airbending: {
    light: {
      parchment: '#efeada',
      parchmentLight: '#fbf8ed',
      parchmentDeep: '#ded5b7',
      washDeep: '#c5aa4f',
      ink: '#5f5329',
      deepInk: '#211c10',
      brown: '#62583a',
      brownSoft: '#7d714d',
      border: '#cec39b',
      accent: '#d5bd60',
    },
    dark: {
      parchment: '#171309',
      parchmentLight: '#241e10',
      parchmentDeep: '#0e0b05',
      washDeep: '#b9a25a',
      ink: '#f7f1df',
      deepInk: '#211c10',
      brown: '#eee6cd',
      brownSoft: '#d3c8a7',
      border: '#443b20',
      accent: '#d0b85b',
    },
  },
  Weapons: {
    light: {
      parchment: '#e3e8ee',
      parchmentLight: '#f3f6f9',
      parchmentDeep: '#cbd3dc',
      washDeep: '#66717d',
      ink: '#28313d',
      deepInk: '#0b1018',
      brown: '#3f4b58',
      brownSoft: '#606b78',
      border: '#b2bdc8',
      accent: '#a4afbb',
    },
    dark: {
      parchment: '#0b0f14',
      parchmentLight: '#151a21',
      parchmentDeep: '#05080c',
      washDeep: '#7e8791',
      ink: '#f0f3f6',
      deepInk: '#0b1018',
      brown: '#e2e7ed',
      brownSoft: '#c4ccd5',
      border: '#2e3640',
      accent: '#8d98a5',
    },
  },
  Technology: {
    light: {
      parchment: '#ebe3f0',
      parchmentLight: '#f8f3fb',
      parchmentDeep: '#d8cbe0',
      washDeep: '#8c6aa0',
      ink: '#563565',
      deepInk: '#201327',
      brown: '#5c4766',
      brownSoft: '#785f84',
      border: '#c5b2cf',
      accent: '#b793c8',
    },
    dark: {
      parchment: '#150d1a',
      parchmentLight: '#211528',
      parchmentDeep: '#0d0710',
      washDeep: '#9b81aa',
      ink: '#f4edf7',
      deepInk: '#201327',
      brown: '#eadff0',
      brownSoft: '#d0c0d9',
      border: '#3f2d49',
      accent: '#a888bb',
    },
  },
};

function applyAvatarPalette(isDarkMode: boolean, primaryTraining: PrimaryTraining) {
  const base = isDarkMode ? darkAvPalette : lightAvPalette;
  const overrides =
    trainingPaletteOverrides[primaryTraining]?.[isDarkMode ? 'dark' : 'light'] ?? {};
  const next = { ...base, ...overrides };
  parchment = next.parchment;
  parchmentLight = next.parchmentLight;
  parchmentDeep = next.parchmentDeep;
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
  uiPrimary =
    primaryTraining === 'Earthbending'
      ? elementFilterFrames.earthbending
      : primaryTraining === 'Firebending'
        ? fire
        : primaryTraining === 'Airbending'
          ? elementFilterFrames.airbending
          : primaryTraining === 'Weapons'
            ? '#4a5563'
            : primaryTraining === 'Technology'
              ? tech
              : water;
  uiPrimaryDark =
    primaryTraining === 'Earthbending'
      ? darkStatEarth
      : primaryTraining === 'Firebending'
        ? darkAvPalette.passionRed
        : primaryTraining === 'Airbending'
          ? '#d0b85b'
          : primaryTraining === 'Weapons'
            ? '#8d98a5'
            : primaryTraining === 'Technology'
              ? '#a888bb'
              : darkStatWater;
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
const weapons = '#3d3d4a';
const tech = '#7a5d8a';
const martial = '#8b5e3c';
const darkStatWater = '#6fa9d6';
const darkStatEarth = '#a3ba72';
const elementFilterFrames: Record<Exclude<TechniqueElementFilter, 'all' | 'basic'>, string> = {
  waterbending: water,
  earthbending: '#6f8f4e',
  firebending: fire,
  airbending: '#d4b74b',
  weapons: '#0b1018',
  technology: tech,
  universal: '#173755',
  group: '#5b5368',
  martial: '#4a2c12',
  // Class (playbook) techniques share the muted-gold "C" frame.
  class: '#4a3c12',
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
    chromeColor: string;
    chromeFill: string;
    headerBorder: string;
    footerBorder: string;
    pageBg: { dark: string; light: string };
    brushBorder?: 'dry' | 'wavy' | 'flame' | 'wind' | 'blade' | 'gear';
  }
> = {
  Waterbending: {
    bodyWash: `
      radial-gradient(circle at 30% 25%, ${alpha(water, 0.42)} 0%, transparent 70%),
      radial-gradient(circle at 75% 70%, ${alpha('#8bb8d4', 0.38)} 0%, transparent 65%),
      radial-gradient(circle at 50% 50%, ${alpha('#9fc2d7', 0.25)} 0%, transparent 50%),
      linear-gradient(135deg, rgba(230, 236, 245, 0.45), rgba(220, 227, 238, 0.4))
    `,
    chromeColor: '#173755',
    chromeFill: 'linear-gradient(180deg, #173755 0%, #10283e 100%)',
    headerBorder: water,
    footerBorder: water,
    pageBg: { dark: '#173755', light: '#173755' },
    brushBorder: 'wavy',
  },
  Earthbending: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha(elementFilterFrames.earthbending, 0.38)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#9cab70', 0.32)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(232, 238, 225, 0.46), rgba(218, 229, 211, 0.4))
    `,
    chromeColor: '#24351f',
    chromeFill: 'linear-gradient(180deg, #24351f 0%, #182615 100%)',
    headerBorder: '#182615',
    footerBorder: '#182615',
    pageBg: { dark: '#24351f', light: '#24351f' },
    brushBorder: 'dry',
  },
  Firebending: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha(fire, 0.32)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#d07a42', 0.26)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(241, 228, 221, 0.48), rgba(232, 217, 211, 0.38))
    `,
    chromeColor: '#4a1f1b',
    chromeFill: 'linear-gradient(180deg, #4a1f1b 0%, #c35a42 58%, #c35a42 100%)',
    headerBorder: fire,
    footerBorder: '#c35a42',
    pageBg: { dark: '#4a1f1b', light: '#4a1f1b' },
    brushBorder: 'flame',
  },
  Airbending: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha(elementFilterFrames.airbending, 0.42)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#e2cc68', 0.28)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(243, 239, 220, 0.5), rgba(231, 232, 213, 0.4))
    `,
    chromeColor: '#544821',
    chromeFill: 'linear-gradient(180deg, #544821 0%, #332b13 100%)',
    headerBorder: elementFilterFrames.airbending,
    footerBorder: '#e0c75f',
    pageBg: { dark: '#544821', light: '#544821' },
    brushBorder: 'wind',
  },
  Weapons: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha('#2a3542', 0.36)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#515c69', 0.3)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(224, 229, 234, 0.42), rgba(210, 217, 224, 0.36))
    `,
    chromeColor: elementFilterFrames.weapons,
    chromeFill: `linear-gradient(180deg, ${elementFilterFrames.weapons} 0%, #030507 100%)`,
    headerBorder: '#4a5563',
    footerBorder: '#5c6674',
    pageBg: { dark: elementFilterFrames.weapons, light: elementFilterFrames.weapons },
    brushBorder: 'blade',
  },
  Technology: {
    bodyWash: `
      radial-gradient(circle at 28% 20%, ${alpha(tech, 0.36)} 0%, transparent 68%),
      radial-gradient(circle at 78% 72%, ${alpha('#9a79ad', 0.28)} 0%, transparent 64%),
      linear-gradient(135deg, rgba(235, 225, 240, 0.44), rgba(222, 215, 232, 0.38))
    `,
    chromeColor: '#3c294c',
    chromeFill: 'linear-gradient(180deg, #3c294c 0%, #24172f 100%)',
    headerBorder: tech,
    footerBorder: '#9977aa',
    pageBg: { dark: '#3c294c', light: '#3c294c' },
    brushBorder: 'gear',
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
const avatarTabValues = tabs.map(({ value }) => value);

// Technique vocabulary (rulebook-wide). Used by the technique list on
// characterStateAtom + by the element/level filter atoms below.
type TechniqueElement =
  | 'waterbending'
  | 'earthbending'
  | 'firebending'
  | 'airbending'
  | 'weapons'
  | 'technology'
  | 'universal'
  | 'group'
  | 'martial'
  | 'basic';
type TechniqueCategory = 'Advance & Attack' | 'Defend & Maneuver' | 'Evade & Observe';
type TechniqueLevel = 'learned' | 'practiced' | 'mastered';
type StatusDescription = {
  category: 'Positive Status' | 'Negative Status';
  description: string;
};
type ConditionDescription = {
  penalty: string;
  clear: string;
};
// Proficiency levels in mastery order; used for both the edit-mode selector
// and the at-a-glance level pill on each technique card.
const techniqueLevelOptions = ['learned', 'practiced', 'mastered'] as const;
const techniqueLevelLabels: Record<TechniqueLevel, string> = {
  learned: 'Learned',
  practiced: 'Practiced',
  mastered: 'Mastered',
};
const statusDescriptions: Record<string, StatusDescription> = {
  Doomed: {
    category: 'Negative Status',
    description: 'Suffer 1-fatigue periodically until you escape.',
  },
  Impaired: {
    category: 'Negative Status',
    description:
      'Take a -2 penalty to physical actions or mark 1-fatigue (NPCs choose one fewer technique).',
  },
  Stunned: {
    category: 'Negative Status',
    description: 'Cannot act or respond until you recover.',
  },
  Trapped: {
    category: 'Negative Status',
    description: 'Helpless, requiring you to mark three conditions or fatigue to break free.',
  },
  Empowered: {
    category: 'Positive Status',
    description: 'Clear 1-fatigue at the end of each exchange.',
  },
  Favored: {
    category: 'Positive Status',
    description: 'Select an extra technique during your next exchange.',
  },
  Inspired: {
    category: 'Positive Status',
    description: 'Shift your balance track by spending the status.',
  },
  Prepared: {
    category: 'Positive Status',
    description: 'Use to gain +1 to a roll or avoid marking a condition.',
  },
};
const conditionDescriptions: Record<string, ConditionDescription> = {
  Afraid: {
    penalty: '-2 to Intimidate and Call Someone Out.',
    clear: 'Running from danger or difficulty.',
  },
  Angry: {
    penalty: '-2 to Guide and Comfort and Assess the Situation.',
    clear: 'Breaking something important or lashing out at a friend.',
  },
  Insecure: {
    penalty: '-2 to Trick and Resist Shifting Balance.',
    clear: 'Taking foolhardy action without talking to your companions.',
  },
  Guilty: {
    penalty: '-2 to Push Your Luck and Deny a Call Out.',
    clear: 'Making a personal sacrifice to absolve your guilt.',
  },
  Troubled: {
    penalty: '-2 to Plead and Rely on Your Skills and Training.',
    clear: 'Seeking guidance from a mentor or powerful figure.',
  },
};

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
// 'class' is a cross-cutting filter (any element) for playbook/class
// techniques, which carry the `classTechnique` flag rather than a distinct
// element type.
type TechniqueElementFilter = TechniqueElement | 'all' | 'class';
const techniqueElementAtom = atom<TechniqueElementFilter>('all');

// ---------- Character data shapes ----------
type Connection = { id?: string; name: string; role: string; note: string };
type JournalEntry = { type: string; name: string; description: string };
/** Class-trait state for one playbook: checkbox selections and write-in
 *  fields, each keyed by a stable position id within the trait content. */
type ClassTraitData = { checks: Record<string, boolean>; writeIns: Record<string, string> };
type Technique = {
  /** Elemental category (waterbending / earthbending / firebending /
   *  airbending / weapons / technology / universal / group /
   *  basic). Renamed from `element` -> `type` to keep the AL technique
   *  vocabulary aligned with the rulebook layout. */
  type: TechniqueElement;
  approach: TechniqueCategory;
  level: TechniqueLevel;
  name: string;
  summary: string;
  description: string;
  fatigue: TechniqueFatigue;
  id?: string;
  custom?: boolean;
  classTechnique?: boolean;
};
type CanonTechnique = Omit<Technique, 'level' | 'id' | 'custom' | 'classTechnique'> & {
  rare?: boolean;
  tags?: string[];
};
type BalanceState = {
  left: Record<string, number>;
  right: Record<string, number>;
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
  /** Two-principle balance track. One side rises while the other falls. */
  balance: BalanceState;
  conditions: Record<string, boolean>;
  statuses: Record<string, boolean>;
  fatigue: boolean[];
  tempFatigue: boolean[];
  backgrounds: Record<string, boolean>;
  historyAnswers: Record<string, string>;
  /** Per-playbook class-trait state — checkbox selections and write-in field
   *  values — keyed by class name so each playbook's data is kept separate. */
  classTrait: Record<string, ClassTraitData>;
  connections: Connection[];
  classMoves: MoveEntry[];
  techniques: Technique[];
  deletedTechniqueKeys: string[];
  inventory: JournalEntry[];
  notes: JournalEntry[];
};

type AvatarClassData = {
  className?: unknown;
  classTrait?: { name?: unknown; text?: unknown };
  classMoves?: unknown;
  opposingPrinciples?: unknown;
  startingStats?: unknown;
  advancedTechnique?: unknown;
  growthQuestion?: unknown;
  historyQuestions?: unknown;
  momentOfBalance?: unknown;
};

const defaultBasicTechniques: Technique[] = [
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
].map((technique) => withTechniqueFatigue(technique) as Technique);
const defaultBalancePrinciples = ['Tradition', 'Progress'] as const;

function normalizeTechniqueType(value: unknown): TechniqueElement {
  if (value === 'water' || value === 'waterbending') return 'waterbending';
  if (value === 'earth' || value === 'earthbending') return 'earthbending';
  if (value === 'fire' || value === 'firebending') return 'firebending';
  if (value === 'air' || value === 'airbending') return 'airbending';
  if (value === 'weapons') return 'weapons';
  if (value === 'martial' || value === 'martial arts') return 'martial';
  if (value === 'tech' || value === 'technology') return 'technology';
  if (value === 'universal') return 'universal';
  if (value === 'group') return 'group';
  return 'basic';
}

function coerceCanonTechnique(value: unknown): CanonTechnique | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.approach !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.summary !== 'string' ||
    typeof candidate.description !== 'string'
  ) {
    return null;
  }

  return withTechniqueFatigue({
    type: normalizeTechniqueType(candidate.type),
    approach: coerceApproach(candidate.approach),
    name: candidate.name,
    summary: candidate.summary,
    description: candidate.description,
    rare: typeof candidate.rare === 'boolean' ? candidate.rare : undefined,
    tags: Array.isArray(candidate.tags)
      ? candidate.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
  }) as CanonTechnique;
}

function createBalanceState(
  leftPrinciple: string = defaultBalancePrinciples[0],
  rightPrinciple: string = defaultBalancePrinciples[1],
  position = 0,
): BalanceState {
  const clamped = Math.max(-3, Math.min(3, Math.round(position)));
  return {
    left: { [leftPrinciple]: -clamped },
    right: { [rightPrinciple]: clamped },
  };
}

/** Starter values for an empty local sheet. Signed-in "new character" flows
 *  use `createRandomAvatarLegendsCharacter` below so they do not clone Qi
 *  Gong's specific biography into new Convex rows. */
const defaultCharacter: CharacterState = {
  name: 'New Hero',
  className: 'The Successor',
  primaryTraining: 'Waterbending',
  pronouns: 'They / Them',
  age: 16,
  origin: 'Republic City',
  stats: { Creativity: 1, Focus: 1, Harmony: -1, Passion: 0 },
  balance: createBalanceState(),
  conditions: {},
  statuses: {},
  fatigue: [false, false, false, false, false],
  tempFatigue: [],
  backgrounds: { Urban: true, Privileged: true },
  historyAnswers: {},
  classTrait: {},
  connections: [],
  classMoves: [],
  techniques: defaultBasicTechniques,
  deletedTechniqueKeys: [],
  inventory: [
    {
      type: 'Item',
      name: 'Travel Pack',
      description: 'A practical pack with a few personal keepsakes and room for supplies.',
    },
  ],
  notes: [
    {
      type: 'Note',
      name: 'First Session Notes',
      description: 'Add campaign notes, important people, and discoveries here.',
    },
  ],
};

const defaultClassTrait = {
  title: 'A Tainted Past',
  body: 'You carry a heavy legacy — a name, a debt, or a deed that shadows your every step. Once per session, when your past complicates the situation, the GM may offer you an opportunity to mark fatigue and either reveal a useful connection from your old life or learn a fragment of hidden lore that bears on the current scene.',
};

const defaultHistoryQuestions = [
  'Where did you grow up, and who raised you?',
  'What event most shaped who you are today?',
  'Who do you owe something to — and what is it?',
  'What did you leave behind when you took up this calling?',
  'What lesson from your past still guides you?',
];

const randomNames = ['Ren', 'Mira', 'Tao', 'Sena', 'Kori', 'Jun', 'Anika', 'Bo', 'Lian', 'Mei'];
const randomOrigins = [
  'Republic City',
  'Whale Tail Island',
  'Gaoling',
  'The Southern Water Tribe',
  'Ba Sing Se',
  'A small Earth Kingdom village',
  'A Fire Nation harbor town',
  'An Air Nomad sanctuary',
];
const randomPronouns = ['They / Them', 'She / Her', 'He / Him', 'She / They', 'He / They'];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

function coerceClassName(
  classData: AvatarClassData | null | undefined,
  fallback = 'The Successor',
) {
  return typeof classData?.className === 'string' && classData.className.trim()
    ? classData.className
    : fallback;
}

function resolveAvatarPrinciples(classData: AvatarClassData | null | undefined): [string, string] {
  if (Array.isArray(classData?.opposingPrinciples)) {
    const principles = classData.opposingPrinciples
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
    if (principles.length >= 2) return [principles[0], principles[1]];
  }
  return [defaultBalancePrinciples[0], defaultBalancePrinciples[1]];
}

function getBalanceValue(side: Record<string, number>, fallbackPrinciple: string) {
  const exact = side[fallbackPrinciple];
  if (typeof exact === 'number' && Number.isFinite(exact)) return exact;
  const first = Object.values(side).find(
    (value) => typeof value === 'number' && Number.isFinite(value),
  );
  return first ?? 0;
}

function getBalancePosition(balance: BalanceState, leftPrinciple: string, rightPrinciple: string) {
  const rightValue = getBalanceValue(balance.right, rightPrinciple);
  const leftValue = getBalanceValue(balance.left, leftPrinciple);
  const position = rightValue || -leftValue;
  return Math.max(-3, Math.min(3, Math.round(position)));
}

function normalizeBalanceState(
  rawBalance: unknown,
  leftPrinciple: string = defaultBalancePrinciples[0],
  rightPrinciple: string = defaultBalancePrinciples[1],
): BalanceState {
  if (typeof rawBalance === 'number' && Number.isFinite(rawBalance)) {
    return createBalanceState(leftPrinciple, rightPrinciple, rawBalance);
  }
  if (rawBalance && typeof rawBalance === 'object') {
    const candidate = rawBalance as { left?: unknown; right?: unknown };
    const left =
      candidate.left && typeof candidate.left === 'object'
        ? (candidate.left as Record<string, number>)
        : {};
    const right =
      candidate.right && typeof candidate.right === 'object'
        ? (candidate.right as Record<string, number>)
        : {};
    return createBalanceState(
      leftPrinciple,
      rightPrinciple,
      getBalancePosition({ left, right }, leftPrinciple, rightPrinciple),
    );
  }
  return createBalanceState(leftPrinciple, rightPrinciple);
}

function coerceStartingStats(classData: AvatarClassData | null | undefined) {
  const raw =
    classData?.startingStats && typeof classData.startingStats === 'object'
      ? (classData.startingStats as Record<string, unknown>)
      : {};
  return {
    Creativity:
      typeof raw.Creativity === 'number' ? raw.Creativity : defaultCharacter.stats.Creativity,
    Focus: typeof raw.Focus === 'number' ? raw.Focus : defaultCharacter.stats.Focus,
    Harmony: typeof raw.Harmony === 'number' ? raw.Harmony : defaultCharacter.stats.Harmony,
    Passion: typeof raw.Passion === 'number' ? raw.Passion : defaultCharacter.stats.Passion,
  };
}

function coerceClassMoves(classData: AvatarClassData | null | undefined): MoveEntry[] {
  return Array.isArray(classData?.classMoves)
    ? classData.classMoves
        .map((move) => {
          if (!move || typeof move !== 'object' || Array.isArray(move)) return null;
          const entry = move as Record<string, unknown>;
          const title = typeof entry.name === 'string' ? entry.name : '';
          const body = typeof entry.text === 'string' ? entry.text : '';
          if (!title || !body) return null;
          return { title, body };
        })
        .filter((move): move is MoveEntry => Boolean(move))
    : [];
}

function trainingToTechniqueType(training: PrimaryTraining): TechniqueElement {
  if (training === 'Earthbending') return 'earthbending';
  if (training === 'Firebending') return 'firebending';
  if (training === 'Airbending') return 'airbending';
  if (training === 'Weapons') return 'weapons';
  if (training === 'Technology') return 'technology';
  return 'waterbending';
}

function coerceApproach(value: unknown): TechniqueCategory {
  return value === 'Defend & Maneuver' ||
    value === 'Evade & Observe' ||
    value === 'Advance & Attack'
    ? value
    : 'Advance & Attack';
}

function summarizeTechnique(text: string) {
  const firstSentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return firstSentence && firstSentence.length <= 150
    ? firstSentence
    : `${text.slice(0, 118).trim()}${text.length > 118 ? '...' : ''}`;
}

function coerceAdvancedTechnique(
  classData: AvatarClassData | null | undefined,
  primaryTraining: PrimaryTraining,
): Technique | null {
  const raw =
    classData?.advancedTechnique && typeof classData.advancedTechnique === 'object'
      ? (classData.advancedTechnique as Record<string, unknown>)
      : null;
  if (!raw) return null;
  const name = typeof raw.techniqueName === 'string' ? raw.techniqueName : '';
  const description = typeof raw.text === 'string' ? raw.text : '';
  if (!name || !description) return null;
  return withTechniqueFatigue({
    type: trainingToTechniqueType(primaryTraining),
    approach: coerceApproach(raw.approach),
    level: 'learned',
    name,
    // Prefer the hand-authored two-line summary stored on the class data;
    // fall back to a first-sentence summary for any class not yet updated.
    summary:
      typeof raw.summary === 'string' && raw.summary.trim()
        ? raw.summary
        : summarizeTechnique(description),
    description,
    classTechnique: true,
  }) as Technique;
}

function applyClassDataToCharacter(
  character: CharacterState,
  classData: AvatarClassData | null | undefined,
) {
  const className = coerceClassName(classData, character.className);
  const classMoves = coerceClassMoves(classData);
  const customMoves = character.classMoves.filter((move) => move.custom);
  const customOrBasicTechniques = character.techniques.filter(
    (technique) => technique.custom || technique.type === 'basic' || !technique.classTechnique,
  );
  const advancedTechnique = coerceAdvancedTechnique(classData, character.primaryTraining);
  const advancedTechniqueDeleted =
    advancedTechnique !== null &&
    (character.deletedTechniqueKeys ?? []).includes(getTechniquePersistenceKey(advancedTechnique));
  const [leftPrinciple, rightPrinciple] = resolveAvatarPrinciples(classData);
  return {
    ...character,
    className,
    balance: normalizeBalanceState(character.balance, leftPrinciple, rightPrinciple),
    stats: coerceStartingStats(classData),
    classMoves: [...classMoves, ...customMoves],
    techniques: dedupeTechniques(
      advancedTechnique && !advancedTechniqueDeleted
        ? [
            ...customOrBasicTechniques.filter(
              (technique) => technique.name !== advancedTechnique.name || technique.custom,
            ),
            advancedTechnique,
          ]
        : customOrBasicTechniques,
    ),
  };
}

function createRandomAvatarLegendsCharacter(classData?: AvatarClassData | null): CharacterState {
  const primaryTraining = pickRandom(primaryTrainingOptions);
  const generic: CharacterState = {
    ...defaultCharacter,
    name: pickRandom(randomNames),
    pronouns: pickRandom(randomPronouns),
    age: 14 + Math.floor(Math.random() * 8),
    origin: pickRandom(randomOrigins),
    primaryTraining,
    backgrounds: {
      [pickRandom(['Urban', 'Privileged', 'Monastic', 'Outlaw', 'Military', 'Wilderness'])]: true,
      [pickRandom(['Urban', 'Privileged', 'Monastic', 'Outlaw', 'Military', 'Wilderness'])]: true,
    },
    conditions: {},
    statuses: {},
    fatigue: [false, false, false, false, false],
    tempFatigue: [],
    historyAnswers: {},
    connections: [],
    techniques: defaultBasicTechniques,
    deletedTechniqueKeys: [],
    inventory: defaultCharacter.inventory,
    notes: defaultCharacter.notes,
  };
  return applyClassDataToCharacter(generic, classData);
}

function createRandomAvatarLegendsBackendPayload(classData?: AvatarClassData | null) {
  const character = createRandomAvatarLegendsCharacter(classData);
  return {
    schemaVersion: AVATAR_LEGENDS_SCHEMA_VERSION,
    characterState: serializeAvatarLegendsCharacter(character),
  };
}

/** Single source of truth for the active character. Every editable
 *  surface reads from / writes to this atom (often via a derived slice). */
const characterStateAtom = atom<CharacterState>(defaultCharacter);

// Bumped after a destructive action to briefly reveal the Undo button (mirrors
// FabU's after-delete undo). The value is just a change signal.
const undoSignalAtom = atom(0);
function useRequestUndoButton() {
  const bump = useSetAtom(undoSignalAtom);
  return () => bump((n) => n + 1);
}

/** Per-app persisted-state schema version. Bump whenever the on-the-wire
 *  shape of the AL `CharacterState` changes in a breaking way.
 *  v2: `age` is `number`, technique key is `type` (was `element`).
 *  v3: Technique.category renamed to approach, title→name, body→description.
 *      JournalEntry title→name, body→description.
 *  v4: add primaryTraining for training-themed app chrome.
 *  v5: class trait display data comes from the classes table;
 *      history answers are stored on the character by prompt text.
 *  v6: balance stores two principle objects instead of a single signed number.
 *  v7: every technique stores structured self/target fatigue data.
 *  v8 (current): deleted technique keys prevent class hydration from
 *      restoring intentionally removed techniques. */
const AVATAR_LEGENDS_SCHEMA_VERSION = 8;
const AVATAR_LEGENDS_GAME_SYSTEM = 'avatar-legends';
const AVATAR_LEGENDS_PENDING_SYNC_KEY = 'avatar-legends-convex-pending-character';
const AVATAR_LEGENDS_SELECT_CHARACTER_EVENT = 'avatar-legends-select-character';

/** Convert the AL `CharacterState` to the backend payload. Mirrors the
 *  FabU convention of wrapping the character under a `character` field
 *  so the persisted blob has room to grow with shape-level metadata
 *  (schema version, etc) without colliding with the character fields. */
function serializeAvatarLegendsCharacter(state: CharacterState) {
  const legacy = state as CharacterState & {
    classTraitBody?: unknown;
    classTraitTitle?: unknown;
  };
  const character = {
    ...legacy,
    techniques: dedupeTechniques(
      legacy.techniques.map((technique) => withTechniqueFatigue(technique) as Technique),
    ),
  };
  delete character.classTraitBody;
  delete character.classTraitTitle;
  return { schemaVersion: AVATAR_LEGENDS_SCHEMA_VERSION, character };
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
    ? dedupeTechniques(
        rawTechniques.flatMap((value) => {
          if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
          const tech = value as Record<string, unknown>;
          const legacyElement = (tech as { element?: unknown }).element;
          const nextType =
            typeof tech.type === 'string'
              ? normalizeTechniqueType(tech.type)
              : typeof legacyElement === 'string'
                ? normalizeTechniqueType(legacyElement)
                : 'basic';
          // Migrate v2→v3: rename category→approach, title→name, body→description
          const nextName = [tech.name, (tech as { title?: unknown }).title]
            .find(
              (candidate): candidate is string =>
                typeof candidate === 'string' && candidate.trim().length > 0,
            )
            ?.trim();
          const nextApproach = [tech.approach, (tech as { category?: unknown }).category].find(
            (candidate): candidate is TechniqueCategory => coerceApproach(candidate) === candidate,
          );
          const description =
            [tech.description, (tech as { body?: unknown }).body].find(
              (candidate): candidate is string =>
                typeof candidate === 'string' && candidate.trim().length > 0,
            ) ?? '';
          if (!nextName) return [];
          const summary =
            typeof tech.summary === 'string' && tech.summary.trim()
              ? tech.summary
              : summarizeTechnique(description);
          // Strip legacy keys
          const rest: Record<string, unknown> = { ...tech };
          delete rest.element;
          delete rest.title;
          delete rest.body;
          delete rest.category;
          return [
            withTechniqueFatigue({
              ...rest,
              type: nextType,
              name: nextName,
              approach: coerceApproach(nextApproach),
              level: techniqueLevelOptions.includes(rest.level as TechniqueLevel)
                ? (rest.level as TechniqueLevel)
                : 'learned',
              summary,
              description,
            }) as Technique,
          ];
        }),
      )
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
  const deletedTechniqueKeys = Array.isArray(innerCandidate.deletedTechniqueKeys)
    ? innerCandidate.deletedTechniqueKeys.filter(
        (value): value is string => typeof value === 'string',
      )
    : defaultCharacter.deletedTechniqueKeys;
  const rawHistoryAnswers = innerCandidate.historyAnswers;
  const historyAnswers =
    rawHistoryAnswers && typeof rawHistoryAnswers === 'object'
      ? Object.fromEntries(
          Object.entries(rawHistoryAnswers as Record<string, unknown>)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
            .map(([key, value]) => [key, value]),
        )
      : defaultCharacter.historyAnswers;
  const rawClassTrait = innerCandidate.classTrait;
  const classTrait =
    rawClassTrait && typeof rawClassTrait === 'object' && !Array.isArray(rawClassTrait)
      ? Object.fromEntries(
          Object.entries(rawClassTrait as Record<string, unknown>)
            .filter(
              (entry): entry is [string, Record<string, unknown>] =>
                Boolean(entry[1]) && typeof entry[1] === 'object' && !Array.isArray(entry[1]),
            )
            .map(([className, value]) => {
              const checksRaw = (value as { checks?: unknown }).checks;
              const writeInsRaw = (value as { writeIns?: unknown }).writeIns;
              const checks =
                checksRaw && typeof checksRaw === 'object'
                  ? Object.fromEntries(
                      Object.entries(checksRaw as Record<string, unknown>).filter(
                        (e): e is [string, boolean] => typeof e[1] === 'boolean',
                      ),
                    )
                  : {};
              const writeIns =
                writeInsRaw && typeof writeInsRaw === 'object'
                  ? Object.fromEntries(
                      Object.entries(writeInsRaw as Record<string, unknown>).filter(
                        (e): e is [string, string] => typeof e[1] === 'string',
                      ),
                    )
                  : {};
              return [className, { checks, writeIns } satisfies ClassTraitData];
            }),
        )
      : defaultCharacter.classTrait;
  const rest = { ...innerCandidate } as Partial<CharacterState> & {
    classTraitBody?: unknown;
    classTraitTitle?: unknown;
    classTraitChecks?: unknown;
  };
  delete rest.classTraitBody;
  delete rest.classTraitTitle;
  // Drop the superseded flat checkbox map so old saves don't linger as a
  // stale property (state now lives under classTrait, keyed by class).
  delete rest.classTraitChecks;
  delete rest.balance;

  return {
    ...defaultCharacter,
    ...rest,
    age,
    primaryTraining,
    balance: normalizeBalanceState(innerCandidate.balance),
    historyAnswers,
    classTrait,
    techniques,
    deletedTechniqueKeys,
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

function migrateAvatarLegendsLocalCharacter(
  key: string,
  initialValue: CharacterState,
): CharacterState {
  const stored = readJsonLocalStorage(key);
  return stored === null ? initialValue : deserializeAvatarLegendsCharacter(stored);
}

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

  // Floating Undo button shown briefly after a destructive action (matches
  // FabU), sitting in the gap beneath the dice FAB. Styled with AL's gold.
  const undoSignal = useAtomValue(undoSignalAtom);
  const [undoVisible, setUndoVisible] = useState(false);
  // Only reveal for *new* bumps — a remount after a prior delete must not
  // reopen a stale Undo (undoSignalAtom is never reset).
  const lastUndoSignal = useRef(undoSignal);
  useEffect(() => {
    if (undoSignal === lastUndoSignal.current) return;
    lastUndoSignal.current = undoSignal;
    setUndoVisible(true);
  }, [undoSignal]);

  return (
    <UndoSnackbar
      open={undoVisible}
      onUndo={() => {
        historyControls.undo();
        setUndoVisible(false);
      }}
      onClose={() => setUndoVisible(false)}
      colors={{
        bg: bookAccent,
        fg: deepInk,
        border: alpha(deepInk, 0.4),
        shadow: `0 8px 20px ${alpha(deepInk, 0.35)}`,
      }}
    />
  );
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
const classTraitAtom = sliceAtom('classTrait');
const notesAtom = sliceAtom('notes');
const inventoryAtom = sliceAtom('inventory');

// Each move card carries its title and the full body text shown when
// the accordion expands. Some moves also have a bulleted list of
// options. Basic + Balance bodies are drawn from the rulebook layout.
type MoveEntry = {
  id?: string;
  title: string;
  body: string;
  bullets?: string[];
  /** Optional trailing paragraph that follows the bullet list. */
  trailing?: string;
  custom?: boolean;
};

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

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
// evade. These are semantic labels, so they intentionally stay pinned to
// the Waterbending palette instead of following primaryTraining chrome.
function techniqueCategoryColor(category: TechniqueCategory, isDarkMode: boolean): string {
  if (category === 'Advance & Attack') return isDarkMode ? passionRed : attackRed;
  if (category === 'Defend & Maneuver') return isDarkMode ? darkStatEarth : earth;
  return isDarkMode ? darkStatWater : water;
}

function techniqueElementVisual(type: TechniqueElement): {
  color: string;
  frameColor?: string;
  src?: string;
  label?: string;
} {
  if (type === 'earthbending')
    return { color: earth, frameColor: elementFilterFrames.earthbending, src: elementEarth };
  if (type === 'firebending')
    return { color: fire, frameColor: elementFilterFrames.firebending, src: elementFire };
  if (type === 'airbending')
    return { color: air, frameColor: elementFilterFrames.airbending, src: elementAir };
  if (type === 'weapons')
    return { color: weapons, frameColor: elementFilterFrames.weapons, src: elementWeapons };
  if (type === 'technology')
    return { color: tech, frameColor: elementFilterFrames.technology, src: elementTech };
  if (type === 'martial')
    return { color: martial, frameColor: elementFilterFrames.martial, src: elementMartial };
  if (type === 'universal')
    return { color: ink, frameColor: elementFilterFrames.universal, label: 'U' };
  if (type === 'group') return { color: brown, frameColor: elementFilterFrames.group, label: 'G' };
  return { color: water, frameColor: elementFilterFrames.waterbending, src: elementWater };
}

// Class (playbook) techniques show a lettered "C" badge — styled like the U /
// G badges for Universal / Group — instead of their bending element icon.
const classTechniqueVisual: {
  color: string;
  frameColor?: string;
  src?: string;
  label?: string;
} = { color: bookAccent, frameColor: '#4a3c12', label: 'C' };

/**
 * Painted chrome band. Trainings can opt into themed SVG border motifs
 * at the inner edge while sharing the same header/footer layout.
 */
function WatercolorBand({
  bottom = false,
  height = 96,
  fill,
  borderColor,
  brushBorder = false,
  borderOffsetY = 0,
  extendFillToEdge = false,
  mirrorX = false,
  overflowVisible = false,
  showEdgeLine = true,
  zIndex = 2,
  topOffset = 0,
}: {
  bottom?: boolean;
  height?: number;
  /** CSS background string. Defaults to the solid deep-navy `deepInk`
   *  fill used for the bottom nav and the dark-mode top band; the
   *  light-mode top header passes a whiter gradient. */
  fill?: string;
  borderColor?: string;
  brushBorder?: 'dry' | 'wavy' | 'flame' | 'wind' | 'blade' | 'gear' | false;
  borderOffsetY?: number;
  extendFillToEdge?: boolean;
  mirrorX?: boolean;
  overflowVisible?: boolean;
  showEdgeLine?: boolean;
  zIndex?: number;
  topOffset?: number | string;
}) {
  const solidEdge = height - 18;
  const bandFill = fill ?? deepInk;
  const edgePosition = bottom ? { top: 0 } : { bottom: 0 };
  const brushColor = borderColor ?? deepInk;
  const gearOutlineColor =
    brushBorder === 'gear' && brushColor === '#3f214d' ? '#4b2b5a' : brushColor;
  const brushHighlight = borderColor ? alpha(borderColor, 0.55) : alpha(deepInk, 0.55);
  const isWaterWave = brushBorder === 'wavy' && brushColor === water;
  const waveFillId = bottom ? 'water-wave-fill-bottom' : 'water-wave-fill-top';
  const waveLightFillId = bottom ? 'water-wave-light-fill-bottom' : 'water-wave-light-fill-top';
  const technologyRightGearStrokeId = bottom
    ? 'technology-right-gear-stroke-bottom'
    : 'technology-right-gear-stroke-top';
  const technologyLargeGearStrokeId = bottom
    ? 'technology-large-gear-stroke-bottom'
    : 'technology-large-gear-stroke-top';
  const waveFill = isWaterWave ? `url(#${waveFillId})` : alpha(brushColor, 0.82);
  const waveLightFill = isWaterWave ? `url(#${waveLightFillId})` : alpha(brushColor, 0.36);
  const wavyPath = bottom
    ? `M0,${height} L430,${height} L430,28 Q400,8 360,18 Q320,30 280,14 Q240,0 200,18 Q160,34 120,16 Q80,0 40,22 Q15,32 0,18 Z`
    : `M0,0 L430,0 L430,${height - 30} Q400,${height - 8} 360,${height - 18} Q320,${height - 30} 280,${height - 12} Q240,${height + 4} 200,${height - 18} Q160,${height - 34} 120,${height - 14} Q80,${height + 2} 40,${height - 22} Q15,${height - 32} 0,${height - 16} Z`;
  const wavyPathLight = bottom
    ? `M0,${height} L430,${height} L430,42 Q395,22 355,30 Q315,42 275,28 Q235,16 195,32 Q155,46 115,30 Q75,16 35,34 Q12,42 0,32 Z`
    : `M0,0 L430,0 L430,${height - 42} Q395,${height - 22} 355,${height - 30} Q315,${height - 42} 275,${height - 28} Q235,${height - 16} 195,${height - 32} Q155,${height - 46} 115,${height - 30} Q75,${height - 16} 35,${height - 34} Q12,${height - 42} 0,${height - 32} Z`;
  const windY = bottom ? height - solidEdge - 6 : solidEdge + 2;
  const windDirection = bottom ? -1 : 1;
  const windSwirlOffsetX = bottom ? 0 : mirrorX ? -60 : 60;
  const windMiddleSwirlOffsetX = bottom ? 0 : mirrorX ? -10 : 10;
  const windLowerSwirl = bottom
    ? { cx: 353 + windSwirlOffsetX, cy: windY + 18 * windDirection, r: 18, clockwise: false }
    : { cx: 384, cy: windY - 2, r: 18, clockwise: false };
  const windSwirl = (cx: number, cy: number, r: number, clockwise = true) =>
    clockwise
      ? `M${cx + r},${cy} C${cx + r},${cy - r * 0.95} ${cx - r * 0.86},${cy - r * 1.05} ${cx - r},${cy} C${cx - r * 1.1},${cy + r * 0.9} ${cx + r * 0.62},${cy + r * 0.92} ${cx + r * 0.46},${cy + r * 0.1} C${cx + r * 0.36},${cy - r * 0.4} ${cx - r * 0.34},${cy - r * 0.3} ${cx - r * 0.22},${cy + r * 0.08}`
      : `M${cx - r},${cy} C${cx - r},${cy - r * 0.95} ${cx + r * 0.86},${cy - r * 1.05} ${cx + r},${cy} C${cx + r * 1.1},${cy + r * 0.9} ${cx - r * 0.62},${cy + r * 0.92} ${cx - r * 0.46},${cy + r * 0.1} C${cx - r * 0.36},${cy - r * 0.4} ${cx + r * 0.34},${cy - r * 0.3} ${cx + r * 0.22},${cy + r * 0.08}`;
  const bladeY = bottom ? height - solidEdge - 12 : solidEdge + 8;
  const gearY = bottom ? height - solidEdge - 8 : solidEdge + 6;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        [bottom ? 'bottom' : 'top']: bottom ? 0 : topOffset,
        height,
        overflow: overflowVisible ? 'visible' : 'hidden',
        pointerEvents: 'none',
        zIndex,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          [bottom ? 'bottom' : 'top']: 0,
          height: extendFillToEdge ? height : solidEdge,
          background: bandFill,
        }}
      />
      <Box
        component="svg"
        viewBox={`0 0 430 ${height}`}
        preserveAspectRatio="none"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          overflow: overflowVisible ? 'visible' : 'hidden',
          transform: `${mirrorX ? 'scaleX(-1)' : ''} ${
            borderOffsetY ? `translateY(${borderOffsetY}px)` : ''
          }`.trim(),
          transformOrigin: 'center',
        }}
      >
        {isWaterWave ? (
          <defs>
            <linearGradient
              id={waveFillId}
              x1="0"
              y1={bottom ? 0 : height - 46}
              x2="0"
              y2={bottom ? 46 : height}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={bottom ? brushColor : '#173755'} stopOpacity={0.82} />
              <stop offset="100%" stopColor={bottom ? '#173755' : brushColor} stopOpacity={0.82} />
            </linearGradient>
            <linearGradient
              id={waveLightFillId}
              x1="0"
              y1={bottom ? 0 : height - 46}
              x2="0"
              y2={bottom ? 46 : height}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={bottom ? brushColor : '#173755'} stopOpacity={0.36} />
              <stop offset="100%" stopColor={bottom ? '#173755' : brushColor} stopOpacity={0.36} />
            </linearGradient>
          </defs>
        ) : null}
        {brushBorder === 'gear' ? (
          <defs>
            <linearGradient id={technologyRightGearStrokeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brushColor === '#3f214d' ? '#ffffff' : '#16091f'} />
              {brushColor === '#3f214d' ? <stop offset="52%" stopColor="#24102f" /> : null}
              <stop offset="100%" stopColor={brushColor === '#3f214d' ? '#18151b' : '#ffffff'} />
            </linearGradient>
            <linearGradient id={technologyLargeGearStrokeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="52%" stopColor="#3c294c" />
              <stop offset="100%" stopColor="#21072e" />
            </linearGradient>
          </defs>
        ) : null}
        {brushBorder === 'dry' ? (
          <>
            <rect
              x={0}
              y={bottom ? height - solidEdge - 3 : solidEdge}
              width={430}
              height={3}
              fill={brushHighlight}
            />
            {!bottom ? (
              <>
                <rect
                  x={18}
                  y={solidEdge - 11}
                  width={132}
                  height={1.4}
                  fill={alpha(brushColor, 0.46)}
                />
                <rect
                  x={170}
                  y={solidEdge - 15}
                  width={82}
                  height={1.1}
                  fill={alpha(brushColor, 0.34)}
                />
                <rect
                  x={268}
                  y={solidEdge - 10}
                  width={118}
                  height={1.3}
                  fill={alpha(brushColor, 0.42)}
                />
              </>
            ) : null}
            {[
              { x: 14, w: 70, opacity: 0.55 },
              { x: 96, w: 50, opacity: 0.4 },
              { x: 156, w: 90, opacity: 0.6 },
              { x: 256, w: 60, opacity: 0.35 },
              { x: 324, w: 78, opacity: 0.5 },
            ].map((streak, index) => (
              <rect
                key={`streak-${index}`}
                x={streak.x}
                y={bottom ? height - solidEdge - 9 : solidEdge + 6}
                width={streak.w}
                height={1.5}
                fill={alpha(brushColor, streak.opacity)}
              />
            ))}
            {[
              { x: 40, w: 36, opacity: 0.22 },
              { x: 130, w: 50, opacity: 0.18 },
              { x: 220, w: 30, opacity: 0.24 },
              { x: 290, w: 44, opacity: 0.18 },
              { x: 360, w: 30, opacity: 0.22 },
            ].map((streak, index) => (
              <rect
                key={`far-streak-${index}`}
                x={streak.x}
                y={bottom ? height - solidEdge - 14 : solidEdge + 11}
                width={streak.w}
                height={1}
                fill={alpha(brushColor, streak.opacity)}
              />
            ))}
          </>
        ) : null}
        {brushBorder === 'wavy' ? (
          <>
            <path d={wavyPath} fill={waveFill} />
            <path d={wavyPathLight} fill={waveLightFill} />
          </>
        ) : null}
        {brushBorder === 'wind' ? (
          <>
            {[-7, -1, 5].map((offset, index) => (
              <path
                key={`wind-stream-${index}`}
                d={`M-8,${windY + offset * windDirection} C54,${windY - (8 - offset) * windDirection} 96,${windY + (8 + offset) * windDirection} 152,${windY + (2 + offset) * windDirection} C214,${windY - (7 - offset) * windDirection} 254,${windY - (24 - offset) * windDirection} 320,${windY - (19 - offset) * windDirection} C362,${windY - (16 - offset) * windDirection} 398,${windY - (8 - offset) * windDirection} 438,${windY - (4 - offset) * windDirection}`}
                fill="none"
                stroke={alpha(brushColor, index === 1 ? 0.76 : 0.52)}
                strokeWidth={index === 1 ? 2 : 1.45}
                strokeLinecap="round"
              />
            ))}
            <path
              d={windSwirl(
                182 + windSwirlOffsetX,
                windY - 18 * windDirection + (bottom ? 0 : 20),
                23,
                true,
              )}
              fill="none"
              stroke={alpha(brushColor, 0.62)}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            <path
              d={windSwirl(
                windLowerSwirl.cx,
                windLowerSwirl.cy,
                windLowerSwirl.r,
                windLowerSwirl.clockwise,
              )}
              fill="none"
              stroke={alpha(brushColor, 0.58)}
              strokeWidth={1.75}
              strokeLinecap="round"
            />
            <path
              d={windSwirl(
                307 + windSwirlOffsetX + windMiddleSwirlOffsetX,
                windY - 26 * windDirection,
                12,
                true,
              )}
              fill="none"
              stroke={alpha(brushColor, 0.5)}
              strokeWidth={1.45}
              strokeLinecap="round"
            />
          </>
        ) : null}
        {brushBorder === 'blade' ? (
          <>
            {Array.from({ length: 9 }).map((_, index) => {
              const x = index * 54 - 18;
              return (
                <path
                  key={`blade-${index}`}
                  d={
                    bottom
                      ? `M${x},${bladeY + 12} L${x + 48},${bladeY - 2} L${x + 76},${bladeY + 9} L${x + 22},${bladeY + 19} Z`
                      : `M${x},${bladeY - 12} L${x + 48},${bladeY + 2} L${x + 76},${bladeY - 9} L${x + 22},${bladeY - 19} Z`
                  }
                  fill={alpha(brushColor, index % 2 === 0 ? 0.68 : 0.42)}
                />
              );
            })}
            <rect
              x={0}
              y={bottom ? bladeY + 10 : bladeY - 12}
              width={430}
              height={2}
              fill={alpha('#ffffff', 0.18)}
            />
          </>
        ) : null}
        {brushBorder === 'gear' ? (
          <>
            {bottom ? (
              <rect x={0} y={gearY + 6} width={430} height={2.5} fill={alpha(brushColor, 0.58)} />
            ) : null}
            {[
              {
                x: 28,
                y: bottom ? gearY - 2 : gearY + 2,
                scale: 1.22,
                opacity: 0.48,
                rotation: 10,
              },
              {
                x: 82,
                y: bottom ? gearY + 8 : gearY - 4,
                scale: 1.08,
                opacity: 0.42,
                rotation: 34,
              },
              {
                x: 256,
                y: bottom ? gearY - 8 : gearY + 6,
                scale: 2.15,
                opacity: 0.56,
                rotation: 18,
              },
              {
                x: 218,
                y: bottom ? gearY + 33 : gearY - 25,
                scale: 1.18,
                opacity: 0.5,
                rotation: 42,
              },
              {
                x: 311,
                y: bottom ? gearY + 15 : gearY - 3,
                scale: 1.61,
                opacity: 0.62,
                rotation: -5,
              },
              {
                x: 358,
                y: bottom ? gearY - 3 : gearY + 5,
                scale: 0.88,
                opacity: 0.52,
                rotation: 28,
              },
              {
                x: 406,
                y: bottom ? gearY + 8 : gearY - 2,
                scale: 0.6,
                opacity: 0.44,
                rotation: 46,
              },
            ].map((gear, index) => {
              return (
                <Box
                  key={`gear-${index}`}
                  component="g"
                  transform={`translate(${gear.x} ${gear.y}) scale(${gear.scale * 0.5}) rotate(${gear.rotation})`}
                >
                  <Box component="g" transform="translate(0 -10)">
                    <path
                      d="M-4.8,-19.2 C-7.1,-19.2 -8.8,-17.6 -8.8,-15.5 L-8.8,-12.9 C-11.1,-12.2 -13.1,-11.3 -15.1,-10 L-17.1,-11.9 C-18.7,-13.4 -21.1,-13.3 -22.6,-11.8 L-25.6,-8.8 C-27.1,-7.2 -27.1,-4.7 -25.5,-3.2 L-23.7,-1.4 C-24.5,0.8 -24.9,3 -25.1,5.4 L-27.8,5.4 C-30,5.4 -31.6,7 -31.6,9.2 L-31.6,13.5 C-31.6,15.6 -30,17.2 -27.8,17.2 L-25,17.2 C-24.3,19.4 -23.3,21.5 -22,23.3 L-23.9,25.3 C-25.4,26.9 -25.4,29.3 -23.8,30.9 L-20.7,33.8 C-19.2,35.3 -16.8,35.2 -15.2,33.7 L-13.3,31.7 C-11.3,32.6 -9.2,33.2 -6.9,33.5 L-6.9,36.2 C-6.9,38.4 -5.2,40 -3.1,40 L1.2,40 C3.3,40 5,38.4 5,36.2 L5,33.4 C7.2,32.8 9.3,31.9 11.3,30.6 L13.3,32.5 C14.9,34 17.3,33.9 18.8,32.4 L21.8,29.3 C23.3,27.8 23.3,25.4 21.7,23.8 L19.8,21.9 C20.7,19.9 21.3,17.8 21.6,15.5 L24.3,15.5 C26.5,15.5 28.1,13.9 28.1,11.7 L28.1,7.4 C28.1,5.3 26.5,3.7 24.3,3.7 L21.6,3.7 C21.1,1.4 20.3,-0.8 19.1,-2.8 L21.1,-4.8 C22.6,-6.3 22.6,-8.8 21.1,-10.3 L18,-13.3 C16.5,-14.8 14.1,-14.8 12.5,-13.2 L10.5,-11.2 C8.5,-12.2 6.3,-12.9 4,-13.2 L4,-15.5 C4,-17.6 2.3,-19.2 0.2,-19.2 Z"
                      fill="none"
                      stroke={
                        index === 4
                          ? brushColor === '#3f214d'
                            ? `url(#${technologyRightGearStrokeId})`
                            : '#ffffff'
                          : brushColor === '#3f214d' && index === 2
                            ? `url(#${technologyLargeGearStrokeId})`
                            : alpha(
                                brushColor === '#3f214d' && index === 2
                                  ? '#24102f'
                                  : brushColor === '#3f214d' && index === 3
                                    ? '#ffffff'
                                    : brushColor !== '#3f214d' && index === 2
                                      ? '#c79aee'
                                      : gearOutlineColor,
                                gear.opacity + 0.08,
                              )
                      }
                      strokeOpacity={index === 4 ? gear.opacity + 0.08 : undefined}
                      strokeWidth={1.55}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {index === 2 ? (
                      <path
                        d="M1.8,10 C2,10.7 1.9,11.4 1.5,12.2 C0.8,12.8 -0.1,13.3 -1.2,13.3 C-2.4,13 -3.5,12.2 -4.3,11.1 C-4.7,9.7 -4.6,8.1 -4,6.5 C-2.8,5.2 -1.2,4.3 0.7,3.9 C2.7,4.2 4.6,5.1 6.2,6.7 C7.2,8.8 7.5,11.1 7,13.6 C5.7,15.8 3.7,17.6 1.2,18.7 C-1.7,18.9 -4.5,18.2 -7.1,16.5 C-9.1,14 -10.2,11 -10.2,7.7 C-9.2,4.4 -7.2,1.6 -4.2,-0.5 C-0.7,-1.6 3.1,-1.5 6.7,-0.2 C9.8,2.3 12.1,5.7 13.1,9.7 C12.8,13.9 11.1,18 8.2,21.3"
                        fill="none"
                        stroke={
                          brushColor === '#3f214d' ? alpha('#16091f', 0.96) : alpha('#d8a6ff', 0.96)
                        }
                        strokeWidth={2.15}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        transform="translate(-2.2 -0.8) translate(1.5 0) scale(-1.08 1.08) translate(-1.5 0)"
                      />
                    ) : (
                      <path
                        d="M1.8,10 C2,10.7 1.9,11.4 1.5,12.2 C0.8,12.8 -0.1,13.3 -1.2,13.3 C-2.4,13 -3.5,12.2 -4.3,11.1 C-4.7,9.7 -4.6,8.1 -4,6.5 C-2.8,5.2 -1.2,4.3 0.7,3.9 C2.7,4.2 4.6,5.1 6.2,6.7 C7.2,8.8 7.5,11.1 7,13.6 C5.7,15.8 3.7,17.6 1.2,18.7 C-1.7,18.9 -4.5,18.2 -7.1,16.5 C-9.1,14 -10.2,11 -10.2,7.7 C-9.2,4.4 -7.2,1.6 -4.2,-0.5 C-0.7,-1.6 3.1,-1.5 6.7,-0.2 C9.8,2.3 12.1,5.7 13.1,9.7 C12.8,13.9 11.1,18 8.2,21.3"
                        fill="none"
                        stroke={
                          index === 3
                            ? alpha('#f0edf2', 0.92)
                            : index === 4
                              ? brushColor === '#3f214d'
                                ? '#ffffff'
                                : '#ddd5e4'
                              : alpha(brushColor, gear.opacity)
                        }
                        strokeOpacity={index === 4 ? gear.opacity : undefined}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        transform={
                          index === 3 ? 'translate(-0.4 -1) rotate(90 0 10)' : 'translate(-1.4 0)'
                        }
                      />
                    )}
                  </Box>
                </Box>
              );
            })}
          </>
        ) : null}
      </Box>
      {brushBorder === 'flame' ? (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            ...edgePosition,
            height: 48,
            background: bottom
              ? `linear-gradient(180deg, ${alpha('#f4b45f', 0.92)} 0%, ${alpha(
                  brushColor,
                  0.95,
                )} 78%)`
              : `linear-gradient(180deg, ${brushColor} 0%, ${alpha('#f4b45f', 0.92)} 100%)`,
            transform: bottom ? 'scaleY(-1)' : 'none',
            transformOrigin: 'center',
            translate: borderOffsetY ? `0 ${borderOffsetY}px` : undefined,
            WebkitMaskImage: `url(${fireBorderMask})`,
            maskImage: `url(${fireBorderMask})`,
            WebkitMaskRepeat: 'repeat-x',
            maskRepeat: 'repeat-x',
            WebkitMaskSize: 'auto 100%',
            maskSize: 'auto 100%',
            WebkitMaskPosition: bottom ? 'center bottom' : 'center top',
            maskPosition: bottom ? 'center bottom' : 'center top',
          }}
        />
      ) : null}
      {borderColor && showEdgeLine ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            ...edgePosition,
            height: brushBorder ? 18 : 2,
            background: brushBorder ? 'transparent' : borderColor,
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

function BalanceTrack({ classData }: { classData: AvatarClassData | null | undefined }) {
  const [balance, setBalance] = useAtom(balancePositionAtom);
  const { isDarkMode } = useThemeMode();
  const [leftPrinciple, rightPrinciple] = resolveAvatarPrinciples(classData);
  const normalizedBalance = useMemo(
    () => normalizeBalanceState(balance, leftPrinciple, rightPrinciple),
    [balance, leftPrinciple, rightPrinciple],
  );
  const selectedPosition = getBalancePosition(normalizedBalance, leftPrinciple, rightPrinciple);
  const positions = [-3, -2, -1, 0, 1, 2, 3];
  const diamondLeftByPosition: Record<number, number> = {
    [-3]: 25.5,
    [-2]: 33.9,
    [-1]: 42.5,
    0: 50.7,
    1: 59.1,
    2: 67.7,
    3: 76,
  };

  function setPosition(position: number) {
    setBalance(createBalanceState(leftPrinciple, rightPrinciple, position));
  }

  useEffect(() => {
    if (JSON.stringify(balance) !== JSON.stringify(normalizedBalance)) {
      setBalance(normalizedBalance);
    }
  }, [balance, normalizedBalance, setBalance]);

  return (
    <Box
      sx={{
        position: 'relative',
        mx: -0.2,
        mt: 0.8,
        mb: 0.2,
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: `0 1px 4px ${alpha(deepInk, 0.16)}`,
      }}
    >
      <Box
        component="img"
        src={principleBg}
        alt=""
        sx={{
          display: 'block',
          width: '100%',
          aspectRatio: '1290 / 907',
          objectFit: 'cover',
          opacity: isDarkMode ? 0.2 : 1,
        }}
      />
      <Box
        component="img"
        src={principleFg}
        alt=""
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 1,
          filter: isDarkMode ? 'brightness(0.86) contrast(1.08)' : 'none',
          pointerEvents: 'none',
        }}
      />
      <Typography
        sx={{
          position: 'absolute',
          left: '12.6%',
          top: '50%',
          transform: 'translate(-50%, -50%) rotate(-90deg)',
          transformOrigin: 'center',
          color: '#ffffff',
          backgroundColor: 'transparent',
          fontFamily:
            '"Bebas Neue Balance", "Bebas Neue", "Arial Rounded MT Bold", "Avenir Next Condensed Heavy", "Arial Black", system-ui, sans-serif',
          fontSize: 'clamp(1.3rem, 8vw, 2.1rem)',
          fontWeight: 900,
          letterSpacing: '0.02em',
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '110px',
          minHeight: '0.74em',
          p: 0,
          textShadow: '0 1px 1px rgba(0,0,0,0.65)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {leftPrinciple}
      </Typography>
      <Typography
        sx={{
          position: 'absolute',
          right: '13.1%',
          top: '50%',
          transform: 'translate(50%, -50%) rotate(90deg)',
          transformOrigin: 'center',
          color: '#000000',
          backgroundColor: 'transparent',
          fontFamily:
            '"Bebas Neue Balance", "Bebas Neue", "Arial Rounded MT Bold", "Avenir Next Condensed Heavy", "Arial Black", system-ui, sans-serif',
          fontSize: 'clamp(1.3rem, 8vw, 2.1rem)',
          fontWeight: 900,
          letterSpacing: '0.02em',
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '110px',
          minHeight: '0.74em',
          p: 0,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {rightPrinciple}
      </Typography>
      {positions.map((position) => {
        const selected = position === selectedPosition;
        return (
          <Box
            key={position}
            component="button"
            type="button"
            aria-label={`Set balance to ${position}`}
            aria-pressed={selected}
            onClick={() => setPosition(position)}
            sx={{
              position: 'absolute',
              left: `${diamondLeftByPosition[position]}%`,
              top: '51.2%',
              width: '5.2%',
              aspectRatio: '1 / 1',
              p: 0,
              border: 'none',
              background: 'transparent',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              '&:focus-visible': {
                outline: `2px solid ${alpha(deepInk, 0.75)}`,
                outlineOffset: 4,
              },
              '&::before': {
                content: '""',
                width: '66%',
                height: '66%',
                border: `2.4px solid ${selected ? '#ffffff' : '#000000'}`,
                background: selected ? deepInk : '#ffffff',
                boxShadow: selected
                  ? `0 0 0 2px ${alpha('#000000', 0.92)}, 0 0 10px ${alpha('#000000', 0.6)}`
                  : '0 0 2px rgba(255,255,255,0.5)',
                transform: 'rotate(45deg)',
                transition: 'background 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
              },
            }}
          />
        );
      })}
    </Box>
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
function StatsPanel({ sticky = false }: { sticky?: boolean } = {}) {
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
    // When sticky, pin to the top of the scrolling tab body so the stats stay
    // visible while scrolling Moves / Combat. Must be a direct child of the
    // scroll body's Stack — wrapping it in a tightly-fitting element gives the
    // sticky box no scroll range, so it stops sticking. zIndex keeps it above
    // the cards that scroll underneath; the negative top margin trims the gap
    // above the panel.
    <Box
      sx={
        sticky
          ? {
              position: 'sticky',
              top: 0,
              zIndex: 4,
              mt: '-15px',
            }
          : undefined
      }
    >
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
                  className="ios-zoom-keep"
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
                    color: isDarkMode ? deepInk : ink,
                    // Handwritten font where the "1" is clearly distinct
                    // from "I" — the IM Fell serif previously used had a
                    // capital-I-shaped 1. Larger size to read clearly in
                    // the 44x44 circle.
                    fontFamily: '"Caveat", "Patrick Hand", "Bradley Hand", "Marker Felt", cursive',
                    fontSize: '1.95rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    p: 0,
                    pr: '5px',
                    boxSizing: 'border-box',
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
    </Box>
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
  const { isDarkMode } = useThemeMode();
  const currentTraining = primaryTrainingOptions.includes(character.primaryTraining)
    ? character.primaryTraining
    : defaultCharacter.primaryTraining;
  const arrowColor = encodeURIComponent(isDarkMode ? '#ffffff' : ink);
  return (
    <Stack spacing={0.45} sx={{ width: 'min(100%, 220px)', pt: '5px' }}>
      <Typography
        sx={{
          color: alpha(brown, 0.76),
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.72rem',
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
        className="ios-zoom-center"
        value={currentTraining}
        aria-label="Primary training"
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
          const next = event.target.value as PrimaryTraining;
          setCharacter((prev) => ({
            ...prev,
            primaryTraining: next,
            techniques: dedupeTechniques(
              prev.techniques.map((technique) =>
                technique.classTechnique
                  ? { ...technique, type: trainingToTechniqueType(next) }
                  : technique,
              ),
            ),
          }));
        }}
        sx={{
          width: '100%',
          minHeight: 36,
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
          pl: 1,
          pr: 3,
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5' stroke='${arrowColor}' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          backgroundSize: '14px 14px',
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

function CharacterEditField({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string | number;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Stack spacing={0.4}>
      <Typography
        sx={{
          color: alpha(brown, 0.76),
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.72rem',
          fontWeight: 900,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <InputBase
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        // 16px keeps mobile Safari from auto-zooming on focus; `ios-zoom-keep`
        // on the input opts it out of the global scale-down so it renders at a
        // true 16px (also the larger size requested for these fields).
        inputProps={{ className: 'ios-zoom-keep' }}
        sx={{
          minHeight: 42,
          borderRadius: '4px',
          border: `1px solid ${alpha(accent, 0.72)}`,
          bgcolor: alpha(parchmentLight, 0.72),
          color: ink,
          px: 1,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '1rem',
          '& input': { p: 0 },
        }}
      />
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
  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);
  const activeColor = isDarkMode ? darkConditionGold : bookAccent;
  return (
    <>
      <StatusButton
        label={label}
        active={Boolean(active[label])}
        // Conditions use a rulebook-gold fill; dark mode deepens it so
        // active chips feel less bright against the slate surface.
        activeColor={activeColor}
        // Unselected label reads in black in light mode (per spec); dark
        // mode keeps the StatusButton default of white text at all times.
        inactiveTextColor="#000000"
        hexagonal
        onToggle={() => setActive((prev) => ({ ...prev, [label]: !prev[label] }))}
        onInfoClick={(event) => setInfoAnchorEl(event.currentTarget)}
      />
      <ConditionDescriptionPopper
        label={label}
        anchorEl={infoAnchorEl}
        color={activeColor}
        onClose={() => setInfoAnchorEl(null)}
      />
    </>
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
  hexagonal = false,
  onToggle,
  onInfoClick,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  /** Optional override for the unselected label color in light mode.
   *  Defaults to `activeColor` (the legacy color-coded look the
   *  positive / negative Statuses buttons use). Conditions pass black
   *  here so unselected condition labels stay readable on parchment. */
  inactiveTextColor?: string;
  hexagonal?: boolean;
  onToggle: () => void;
  onInfoClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
  const hexClipPath = 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)';
  if (hexagonal) {
    return (
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Box
          component="button"
          type="button"
          onClick={onToggle}
          aria-pressed={active}
          sx={{
            width: '100%',
            p: '1.5px',
            border: 'none',
            background: activeColor,
            clipPath: hexClipPath,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'block',
              width: '100%',
              py: '14px',
              px: 2.2,
              boxSizing: 'border-box',
              clipPath: hexClipPath,
              background: active ? activeColor : parchmentLight,
              color: textColor,
              textAlign: 'center',
              fontFamily: 'Georgia, serif',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </Box>
        </Box>
        {onInfoClick ? (
          <StatusInfoButton
            label={label}
            color={textColor}
            onClick={onInfoClick}
            sx={{ top: '50%', right: 10, transform: 'translateY(-50%)' }}
          />
        ) : null}
      </Box>
    );
  }
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
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
      {onInfoClick ? (
        <StatusInfoButton label={label} color={textColor} onClick={onInfoClick} />
      ) : null}
    </Box>
  );
}

function StatusInfoButton({
  label,
  color,
  onClick,
  sx,
}: {
  label: string;
  color: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  sx?: Record<string, unknown>;
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={`About ${label}`}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onClick(event);
      }}
      sx={{
        display: 'grid',
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        placeItems: 'center',
        border: 'none',
        borderRadius: 0,
        bgcolor: 'transparent',
        color,
        cursor: 'pointer',
        p: 0,
        '&:hover': {
          color: activeInfoHoverColor(color),
        },
        ...sx,
      }}
    >
      <Info size={16} strokeWidth={2.1} />
    </Box>
  );
}

function activeInfoHoverColor(color: string) {
  return color === '#ffffff' ? alpha('#ffffff', 0.72) : alpha(color, 0.68);
}

function StatusDescriptionPopper({
  label,
  anchorEl,
  positiveColor,
  onClose,
}: {
  label: string | null;
  anchorEl: HTMLElement | null;
  positiveColor: string;
  onClose: () => void;
}) {
  const status = label ? statusDescriptions[label] : undefined;
  return (
    <Popper
      open={Boolean(label && status && anchorEl)}
      anchorEl={anchorEl}
      placement="bottom-end"
      modifiers={[
        { name: 'offset', options: { offset: [0, 6] } },
        { name: 'flip', options: { padding: 12 } },
        { name: 'preventOverflow', options: { padding: 12 } },
      ]}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={0}
          sx={{
            width: 'min(280px, calc(100vw - 24px))',
            bgcolor: parchment,
            backgroundImage: 'none',
            border: `1px solid ${border}`,
            borderRadius: '8px',
            boxShadow: `0 12px 30px ${alpha(deepInk, 0.34)}`,
            p: 1.7,
          }}
        >
          {label && status ? (
            <Stack spacing={0.9}>
              <Typography
                sx={{
                  color: status.category === 'Positive Status' ? positiveColor : passionRed,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {status.category}
              </Typography>
              <Typography
                sx={{
                  color: ink,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.96rem',
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Typography>
              <Typography
                sx={{
                  color: brown,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                }}
              >
                {status.description}
              </Typography>
            </Stack>
          ) : null}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

function ConditionDescriptionPopper({
  label,
  anchorEl,
  color,
  onClose,
}: {
  label: string;
  anchorEl: HTMLElement | null;
  color: string;
  onClose: () => void;
}) {
  const condition = conditionDescriptions[label];
  return (
    <Popper
      open={Boolean(condition && anchorEl)}
      anchorEl={anchorEl}
      placement="bottom-end"
      modifiers={[
        { name: 'offset', options: { offset: [0, 6] } },
        { name: 'flip', options: { padding: 12 } },
        { name: 'preventOverflow', options: { padding: 12 } },
      ]}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={0}
          sx={{
            width: 'min(290px, calc(100vw - 24px))',
            bgcolor: parchment,
            backgroundImage: 'none',
            border: `1px solid ${border}`,
            borderRadius: '8px',
            boxShadow: `0 12px 30px ${alpha(deepInk, 0.34)}`,
            p: 1.7,
          }}
        >
          <Stack spacing={1.1}>
            <Typography
              sx={{
                color,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.96rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.88rem',
                lineHeight: 1.5,
              }}
            >
              {condition?.penalty}
            </Typography>
            <Box>
              <Typography
                sx={{
                  color,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  mb: 0.35,
                }}
              >
                Clear by
              </Typography>
              <Typography
                sx={{
                  color: brown,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                }}
              >
                {condition?.clear}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </ClickAwayListener>
    </Popper>
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
    <Stack
      spacing={0.6}
      sx={{
        py: 0.65,
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        sx={{
          // Fixed-height heading row so the title doesn't shift on toggle.
          display: 'flex',
          alignItems: 'center',
          minHeight: 30,
          width: '100%',
          gap: 0.7,
          py: 0,
          px: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: ink,
          textAlign: 'left',
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
        }}
      >
        <MoveDiamond color={accent} size={9} />
        <Typography
          component="span"
          sx={{
            color: ink,
            fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
            fontSize: '0.82rem',
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          History
        </Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: alpha(accent, 0.55) }} />
        <Box
          component={ChevronRight}
          size={18}
          sx={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: alpha(ink, 0.8),
            flex: '0 0 auto',
          }}
        />
      </Box>
      {open ? (
        <Stack spacing={1} sx={{ mt: 0.8, px: 1.25, pt: 0.6, pb: 0.45 }}>
          {questions.map((question, index) => (
            <Stack key={question} spacing={0.4}>
              <Typography
                sx={{
                  color: ink,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  lineHeight: 1.45,
                }}
              >
                {question}
              </Typography>
              <Box
                component="textarea"
                rows={2}
                value={answers[question] ?? answers[index] ?? ''}
                onClick={(event: React.MouseEvent<HTMLTextAreaElement>) => event.stopPropagation()}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAnswers((prev) => ({ ...prev, [question]: e.target.value }))
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

// ---------- Class-trait rich-text parsing ----------
// Class-trait text arrives as one long run-on string with inline markers:
//   □ … markable boxes (drives, destiny details, condition penalties)
//   • … bulleted choices
//   ____ … fill-in blanks
// We parse it into structured blocks so the card can render real paragraphs,
// section headers, bullet lists, and a checkbox grid instead of a wall of text.
type ClassTraitBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'header'; text: string }
  | { kind: 'checkboxes'; items: string[] }
  | { kind: 'bullets'; items: string[] }
  // A heading with a row of bare (unlabelled) checkboxes beside it — e.g. a
  // progress track. Encoded in the source as "Heading □ □ □ □ □".
  | { kind: 'trackHeader'; text: string; count: number };

const CHECKBOX_MARKERS = /[□▢☐]/;
const CLASS_TRAIT_MARKER = /[□▢☐]|[•◦‣]/g;
const TITLE_MINOR_WORDS = new Set(['of', 'the', 'and', 'to', 'a', 'an', 'for', 'in']);
// Status / condition names. Class-trait text extracted from the rulebook PDFs
// often carries a stray sidebar of these as □ boxes; they aren't real trait
// checkboxes, so we drop any checkbox whose label begins with one of them.
const AVATAR_STATUS_CONDITION_NAMES = new Set([
  'doomed',
  'impaired',
  'trapped',
  'stunned',
  'empowered',
  'favored',
  'inspired',
  'prepared',
  'afraid',
  'angry',
  'guilty',
  'insecure',
  'troubled',
]);
function isStatusOrConditionCheckbox(label: string): boolean {
  const firstWord = label
    .trim()
    .toLowerCase()
    .match(/^[a-z]+/);
  return firstWord ? AVATAR_STATUS_CONDITION_NAMES.has(firstWord[0]) : false;
}

/**
 * Split a run of plain (non-marker) text into header + paragraph blocks.
 * Best-effort header detection: a short standalone Title-Case phrase, or a
 * 2–3 word Title-Case run at the start of a sentence that precedes the real
 * sentence (e.g. "Destiny Details Fill these in…" → header "Destiny Details").
 */
function splitClassTraitPlainText(text: string, allowLabelHeaders: boolean): ClassTraitBlock[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // In line-structured (cleaned) text, a short standalone line ending in a
  // colon or ellipsis is a list label / section heading ("Choose where your
  // team is without you:", "Earn 1-Team when…"). The word cap keeps a long
  // colon-ending lead-in sentence (e.g. "…to the following questions:") a
  // paragraph rather than a giant uppercase header.
  if (
    allowLabelHeaders &&
    /(:|…|\.\.\.)$/.test(trimmed) &&
    /^[A-Z(]/.test(trimmed) &&
    trimmed.split(/\s+/).length <= 14
  ) {
    return [{ kind: 'header', text: trimmed }];
  }

  const words = trimmed.split(/\s+/);
  const isTitleWord = (word: string) =>
    /^[A-Z][A-Za-z'’-]*$/.test(word) || TITLE_MINOR_WORDS.has(word.toLowerCase());
  // Whole segment is a short Title-Case phrase (e.g. "Destiny Signs",
  // "Live Up to Your Role").
  if (
    words.length <= 5 &&
    !/[.!?:]$/.test(trimmed) &&
    /^[A-Z(]/.test(trimmed) &&
    words.every(isTitleWord)
  ) {
    return [{ kind: 'header', text: trimmed }];
  }

  const blocks: ClassTraitBlock[] = [];
  const sentences = trimmed.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/);
    let capsRun = 0;
    while (capsRun < sentenceWords.length && /^[A-Z][A-Za-z'’-]*$/.test(sentenceWords[capsRun])) {
      capsRun += 1;
    }
    // 3+ leading capitalized words ⇒ the first ones read as a heading and the
    // last one begins the actual sentence.
    if (capsRun >= 3) {
      blocks.push({ kind: 'header', text: sentenceWords.slice(0, capsRun - 1).join(' ') });
      const rest = sentenceWords
        .slice(capsRun - 1)
        .join(' ')
        .trim();
      if (rest) blocks.push({ kind: 'paragraph', text: rest });
      continue;
    }
    const previous = blocks[blocks.length - 1];
    if (previous && previous.kind === 'paragraph') previous.text += ` ${sentence}`;
    else blocks.push({ kind: 'paragraph', text: sentence });
  }
  return blocks;
}

// Avatar Legends moves end with a "On a miss …" result; the rulebook prints it
// on its own line, so split it off into a fresh paragraph wherever it trails a
// paragraph or the last item of a list.
function splitOffOnAMiss(text: string): [string, string | null] {
  const match = /\bOn a miss\b/i.exec(text);
  if (!match || match.index === 0) return [text, null];
  const before = text.slice(0, match.index).trim();
  const miss = text.slice(match.index).trim();
  if (!before || !miss) return [text, null];
  return [before, miss];
}

function applyOnAMissBreaks(blocks: ClassTraitBlock[]): ClassTraitBlock[] {
  const result: ClassTraitBlock[] = [];
  for (const block of blocks) {
    if (block.kind === 'paragraph') {
      const [before, miss] = splitOffOnAMiss(block.text);
      result.push({ kind: 'paragraph', text: before });
      if (miss) result.push({ kind: 'paragraph', text: miss });
      continue;
    }
    if (block.kind === 'checkboxes' || block.kind === 'bullets') {
      const items = [...block.items];
      const lastIndex = items.length - 1;
      let trailing: string | null = null;
      if (lastIndex >= 0) {
        const [before, miss] = splitOffOnAMiss(items[lastIndex]);
        if (miss) {
          items[lastIndex] = before;
          trailing = miss;
        }
      }
      result.push({ ...block, items });
      if (trailing) result.push({ kind: 'paragraph', text: trailing });
      continue;
    }
    result.push(block);
  }
  return result;
}

function parseClassTraitContent(rawText: string): ClassTraitBlock[] {
  // Keep newlines as hard block boundaries (collapse only spaces/tabs and
  // runs of blank lines). Cleaned trait text uses line breaks to separate
  // headers, paragraphs, and lists so prose can't bleed into a checkbox label.
  const normalized = rawText
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    // Drop the dash right after "earn 1" / "spend 1" (e.g. "Earn 1-Team" →
    // "Earn 1 Team") across all class traits.
    .replace(/\b(earn 1|spend 1)-/gi, '$1 ')
    .trim();
  if (!normalized) return [];
  // Line-structured (cleaned) text enables label/section-heading detection.
  const structured = normalized.includes('\n');

  const blocks: ClassTraitBlock[] = [];
  const pushListItem = (kind: 'checkboxes' | 'bullets', item: string) => {
    if (kind === 'checkboxes' && isStatusOrConditionCheckbox(item)) return;
    const previous = blocks[blocks.length - 1];
    if (previous && previous.kind === kind) previous.items.push(item);
    else blocks.push({ kind, items: [item] });
  };

  for (const line of normalized.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    let lastIndex = 0;
    let pendingMarker: 'check' | 'bullet' | null = null;
    CLASS_TRAIT_MARKER.lastIndex = 0;
    let match: RegExpExecArray | null;
    const lineParts: Array<{ marker: 'check' | 'bullet' | null; text: string }> = [];
    while ((match = CLASS_TRAIT_MARKER.exec(trimmedLine))) {
      lineParts.push({
        marker: pendingMarker,
        text: trimmedLine.slice(lastIndex, match.index).trim(),
      });
      pendingMarker = CHECKBOX_MARKERS.test(match[0]) ? 'check' : 'bullet';
      lastIndex = match.index + match[0].length;
    }
    lineParts.push({ marker: pendingMarker, text: trimmedLine.slice(lastIndex).trim() });

    // "Heading □ □ □ □ □" — a header followed only by bare checkboxes is a
    // progress track: a heading with that many empty boxes beside it.
    const [head, ...tail] = lineParts;
    if (
      head.marker === null &&
      head.text &&
      tail.length > 0 &&
      tail.every((part) => part.marker === 'check' && part.text === '')
    ) {
      blocks.push({ kind: 'trackHeader', text: head.text, count: tail.length });
      continue;
    }

    for (const part of lineParts) {
      if (part.marker === null) {
        for (const block of splitClassTraitPlainText(part.text, structured)) blocks.push(block);
        continue;
      }
      if (!part.text) continue;
      pushListItem(part.marker === 'check' ? 'checkboxes' : 'bullets', part.text);
    }
  }
  // Break "On a miss …" onto its own paragraph, then drop any checkbox block
  // left empty after filtering out status boxes.
  return applyOnAMissBreaks(blocks).filter(
    (block) => block.kind !== 'checkboxes' || block.items.length > 0,
  );
}

type ClassTraitWriteIn = {
  keyPrefix: string;
  getValue: (id: string) => string;
  setValue: (id: string, value: string) => void;
};

/**
 * Render text, turning each `____` fill-in run into a functional, persisted
 * text input styled to look like a single underline you can write on. Without
 * a `writeIn` context (fallback render) the blanks stay static underlines.
 */
function renderClassTraitText(text: string, writeIn?: ClassTraitWriteIn): React.ReactNode {
  const segments = text.split(/(_{3,})/);
  let blankIndex = 0;
  return segments.map((segment, index) => {
    if (!/^_{3,}$/.test(segment)) return <Fragment key={index}>{segment}</Fragment>;
    if (!writeIn) {
      return (
        <Box
          key={index}
          component="span"
          sx={{
            display: 'inline-block',
            minWidth: 64,
            mx: 0.4,
            borderBottom: `1px solid ${alpha(brown, 0.55)}`,
            transform: 'translateY(2px)',
          }}
        />
      );
    }
    const id = `${writeIn.keyPrefix}-wi${blankIndex}`;
    blankIndex += 1;
    // Width tracks the original blank length so the line keeps its proportions.
    const widthCh = Math.min(Math.max(segment.length, 8), 36);
    return (
      <Box
        key={index}
        component="input"
        type="text"
        // ios-zoom-keep + 16px keeps mobile Safari from zooming on focus.
        className="ios-zoom-keep"
        value={writeIn.getValue(id)}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          writeIn.setValue(id, event.target.value)
        }
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
        sx={{
          display: 'inline-block',
          width: `${widthCh}ch`,
          maxWidth: '100%',
          mx: 0.4,
          mt: 0.6,
          p: 0,
          border: 'none',
          borderBottom: `1px solid ${alpha(brown, 0.55)}`,
          background: 'transparent',
          color: ink,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '1rem',
          lineHeight: 1.4,
          outline: 'none',
          '&:focus': { borderBottomColor: deepInk },
        }}
      />
    );
  });
}

/**
 * Stable id derived from a field's text so persisted checkbox / write-in
 * answers follow their item across reorders or parser tweaks (positional ids
 * would remap saves onto the wrong field).
 */
function classTraitFieldId(text: string): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33 + normalized.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/** Break heading text onto a new line per sentence (rendered with pre-line). */
function splitHeadingSentences(text: string): string {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Renders parsed class-trait content: paragraphs, section headers, bullet
 * lists, write-in fields, and grids of markable checkboxes. All checkbox and
 * write-in state persists on the character under `classTrait`, keyed by class.
 */
function ClassTraitContent({ text, className }: { text: string; className: string }) {
  const blocks = useMemo(() => parseClassTraitContent(text), [text]);
  const [classTraitState, setClassTraitState] = useAtom(classTraitAtom);
  // All checkbox + write-in state for this playbook lives under classTrait,
  // keyed by class name, and each value is keyed by its position in the parsed
  // content (so same-labelled fields don't collide and nothing bleeds across a
  // class switch). cb-v3 reflects the current parser block/item positions.
  const entry = classTraitState[className] ?? { checks: {}, writeIns: {} };
  const setEntry = (next: ClassTraitData) =>
    setClassTraitState((prev) => ({ ...prev, [className]: next }));
  // Text-derived (not positional) ids so reordering items doesn't remap saves.
  const checkKey = (item: string) => `cb-${classTraitFieldId(item)}`;
  const toggle = (key: string) =>
    setEntry({ ...entry, checks: { ...entry.checks, [key]: !entry.checks[key] } });
  const writeInFor = (keyPrefix: string): ClassTraitWriteIn => ({
    keyPrefix,
    getValue: (id) => entry.writeIns[id] ?? '',
    setValue: (id, value) => setEntry({ ...entry, writeIns: { ...entry.writeIns, [id]: value } }),
  });
  const checks = entry.checks;

  if (blocks.length === 0) {
    return (
      <Typography
        sx={{
          color: brown,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '0.96rem',
          lineHeight: 1.5,
          pt: 1.05,
          px: 2,
          pb: 2,
        }}
      >
        {renderClassTraitText(text, writeInFor(`wi-${classTraitFieldId(text)}`))}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.1} sx={{ pt: 1.05, px: 2, pb: 2 }}>
      {blocks.map((block, index) => {
        if (block.kind === 'header') {
          return (
            <Typography
              key={index}
              sx={{
                color: ink,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.84rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1.3,
                // Heading text breaks onto a new line per sentence.
                whiteSpace: 'pre-line',
                mt: index === 0 ? 1.2 : 2.8,
              }}
            >
              {splitHeadingSentences(block.text)}
            </Typography>
          );
        }
        if (block.kind === 'paragraph') {
          return (
            <Typography
              key={index}
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.96rem',
                lineHeight: 1.5,
              }}
            >
              {renderClassTraitText(block.text, writeInFor(`wi-${classTraitFieldId(block.text)}`))}
            </Typography>
          );
        }
        if (block.kind === 'bullets') {
          return (
            <Stack key={index} spacing={0.5}>
              {block.items.map((item, itemIndex) => (
                <Stack
                  key={`${item}-${itemIndex}`}
                  direction="row"
                  gap={0.7}
                  alignItems="flex-start"
                >
                  <Box
                    sx={{
                      mt: '8px',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      flex: '0 0 auto',
                      bgcolor: alpha(brown, 0.7),
                    }}
                  />
                  <Typography
                    sx={{
                      color: brown,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '0.96rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {renderClassTraitText(item, writeInFor(`wi-${classTraitFieldId(item)}`))}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          );
        }
        if (block.kind === 'trackHeader') {
          return (
            <Stack
              key={index}
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ flexWrap: 'wrap', rowGap: 0.5, mt: index === 0 ? 1.2 : 2.8 }}
            >
              <Typography
                sx={{
                  color: ink,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.84rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {block.text}
              </Typography>
              <Stack direction="row" gap={0.6} alignItems="center">
                {Array.from({ length: block.count }).map((_, boxIndex) => {
                  const key = `track-${classTraitFieldId(block.text)}-${boxIndex}`;
                  const checked = Boolean(checks[key]);
                  return (
                    <Box
                      key={boxIndex}
                      component="button"
                      type="button"
                      aria-pressed={checked}
                      aria-label={`${block.text} ${boxIndex + 1}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggle(key);
                      }}
                      sx={{
                        p: 0,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        lineHeight: 0,
                      }}
                    >
                      <Checkbox checked={checked} size={18} />
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          );
        }
        // Checkboxes: short lists sit in a 2-col grid; long descriptive lists
        // flow into two columns (CSS multicol) so there's no row-height empty
        // space between mismatched items. Force the column break at the
        // midpoint so the split is deterministic column-major (source order
        // fills the left column top-to-bottom, then the right column).
        const longItems = block.items.some((item) => item.length > 60);
        const columnBreakIndex = Math.ceil(block.items.length / 2) - 1;
        return (
          <Box
            key={index}
            sx={
              longItems
                ? { columnCount: 2, columnGap: 2 }
                : { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 1.4, rowGap: 0.75 }
            }
          >
            {block.items.map((item, itemIndex) => {
              const key = checkKey(item);
              const checked = Boolean(checks[key]);
              return (
                <Box
                  key={`${item}-${itemIndex}`}
                  component="button"
                  type="button"
                  aria-pressed={checked}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(key);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0.7,
                    p: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    ...(longItems
                      ? {
                          breakInside: 'avoid',
                          WebkitColumnBreakInside: 'avoid',
                          mb: 0.85,
                          ...(itemIndex === columnBreakIndex
                            ? { breakAfter: 'column', WebkitColumnBreakAfter: 'always' }
                            : {}),
                        }
                      : {}),
                  }}
                >
                  <Box sx={{ mt: '1px', flex: '0 0 auto' }}>
                    <Checkbox checked={checked} size={16} />
                  </Box>
                  <Typography
                    sx={{
                      color: brown,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '0.94rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {renderClassTraitText(item, writeInFor(`wi-${classTraitFieldId(item)}`))}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        );
      })}
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
  className = '',
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  /** Playbook name used to namespace persisted checkbox state. */
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Stack spacing={0.6} onClick={() => setOpen((value) => !value)} sx={{ cursor: 'pointer' }}>
      <SectionTitle>Class Trait</SectionTitle>
      <Box
        component="button"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        sx={{
          mt: 0.7,
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
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '0.92rem',
          fontWeight: 700,
          fontStyle: 'italic',
          letterSpacing: '0.015em',
        }}
      >
        <Box sx={{ flex: 1, pl: 2.2 }}>{title}</Box>
        <Box
          component={ChevronRight}
          size={18}
          sx={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: alpha(ink, 0.8),
            flex: '0 0 auto',
          }}
        />
      </Box>
      {open ? (
        typeof children === 'string' ? (
          <ClassTraitContent text={children} className={className} />
        ) : (
          <Typography
            sx={{
              color: brown,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '0.86rem',
              lineHeight: 1.5,
              pt: 1.05,
              px: 2,
              pb: 2,
            }}
          >
            {children}
          </Typography>
        )
      ) : null}
    </Stack>
  );
}

function CharacterInfoSection({
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
    <Stack
      spacing={open ? 0.6 : 0}
      onClick={() => setOpen((value) => !value)}
      sx={{
        cursor: 'pointer',
        py: 0.65,
      }}
    >
      {/* Fixed-height heading row so the title stays put when the body opens
          (vertically centering the whole Stack would shift it on toggle).
          flexDirection column keeps SectionTitle full-width so its cross-line
          still spans the row. */}
      <Box
        sx={{
          position: 'relative',
          pr: 2.2,
          minHeight: 30,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <SectionTitle>{title}</SectionTitle>
        <Box
          component={ChevronRight}
          size={18}
          sx={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: open ? 'translateY(-50%) rotate(90deg)' : 'translateY(-50%) rotate(0deg)',
            transformOrigin: 'center',
            transition: 'transform 0.2s ease',
            color: alpha(ink, 0.8),
          }}
        />
      </Box>
      {open ? (
        <Typography
          sx={{
            color: brown,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '0.94rem',
            lineHeight: 1.55,
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
        // U / G / C (and any first-letter fallback) sit on a dark element
        // frame, so render the letter in solid white for legibility — no
        // dimmed ink and no translucent overlay washing over the glyph.
        color: '#ffffff',
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

function getTechniqueElementFilters(options: { includeClass?: boolean } = {}): Array<{
  key: TechniqueElementFilter;
  label: string;
  color: string;
  src: string | null;
}> {
  const { includeClass = true } = options;
  return [
    { key: 'all', label: 'All', color: ink, src: null },
    { key: 'basic', label: 'Basic', color: ink, src: null },
    // Class is only meaningful for the character's own techniques, not the
    // canon picker (canon techniques never carry the class flag).
    ...(includeClass
      ? [{ key: 'class' as const, label: 'Class', color: bookAccent, src: null }]
      : []),
    { key: 'universal', label: 'Universal', color: ink, src: null },
    { key: 'group', label: 'Group', color: brown, src: null },
    { key: 'waterbending', label: 'Water', color: water, src: elementWater },
    { key: 'earthbending', label: 'Earth', color: earth, src: elementEarth },
    { key: 'firebending', label: 'Fire', color: fire, src: elementFire },
    { key: 'airbending', label: 'Air', color: air, src: elementAir },
    { key: 'weapons', label: 'Weapons', color: weapons, src: elementWeapons },
    { key: 'technology', label: 'Tech', color: tech, src: elementTech },
    { key: 'martial', label: 'Martial', color: martial, src: elementMartial },
  ];
}

function TechniqueElementFilterRow({
  value,
  onChange,
  includeClass = true,
}: {
  value: TechniqueElementFilter;
  onChange: (next: TechniqueElementFilter) => void;
  /** Show the cross-cutting "Class" chip. Off for the canon picker. */
  includeClass?: boolean;
}) {
  const { isDarkMode } = useThemeMode();
  return (
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
        {getTechniqueElementFilters({ includeClass }).map((entry) => {
          const isActive = value === entry.key;
          const frameColor =
            entry.key === 'all' || entry.key === 'basic' ? deepInk : elementFilterFrames[entry.key];
          return (
            <Stack
              key={entry.key}
              component="button"
              type="button"
              onClick={() => onChange(entry.key)}
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
                        fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
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
  onClick,
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
  onClick?: React.MouseEventHandler<HTMLDivElement>;
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
        onClick={onClick}
        sx={{
          position: 'relative',
          border: `1px solid ${border}`,
          borderRadius: '4px',
          // Flat solid card bg — no gradient.
          background: parchmentLight,
          boxShadow: cardBoxShadow,
          p: compact ? `${contentInset - 2}px` : `${contentInset}px`,
          cursor: onClick ? 'pointer' : undefined,
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
        onClick={onClick}
        sx={{
          position: 'relative',
          // Outer notched silhouette so the parchment bg ends at the notches.
          clipPath: panelOctagonClipPath,
          // Flat solid card bg — no gradient.
          background: parchmentLight,
          p: compact ? `${contentInset - 2}px` : `${contentInset}px`,
          cursor: onClick ? 'pointer' : undefined,
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

function AddListCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        width: '100%',
        p: 0,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        textAlign: 'inherit',
      }}
    >
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
            {label}
          </Typography>
        </Stack>
      </Panel>
    </Box>
  );
}

function TechniqueAddCard({
  selectedKind,
  canRestoreClassTechnique,
  onSelectKind,
  onCancel,
}: {
  selectedKind: 'custom' | 'canon' | 'class' | null;
  canRestoreClassTechnique: boolean;
  onSelectKind: (kind: 'custom' | 'canon' | 'class') => void;
  onCancel: () => void;
}) {
  const kinds = canRestoreClassTechnique
    ? (['custom', 'canon', 'class'] as const)
    : (['custom', 'canon'] as const);
  return (
    <Panel ornament={false}>
      <Stack spacing={1.2}>
        <Typography
          sx={{
            color: ink,
            fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
            fontSize: '0.82rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Add Technique
        </Typography>
        <Stack direction="row" gap={1}>
          {kinds.map((kind) => {
            const active = selectedKind === kind;
            return (
              <Button
                key={kind}
                onClick={() => onSelectKind(kind)}
                sx={{
                  flex: 1,
                  border: `1px solid ${active ? ink : alpha(accent, 0.62)}`,
                  bgcolor: active ? ink : alpha(parchmentLight, 0.46),
                  color: active ? parchment : ink,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  py: 1,
                  textTransform: 'uppercase',
                  '&:hover': {
                    bgcolor: active ? ink : alpha(accent, 0.16),
                  },
                }}
              >
                {kind === 'custom' ? 'Custom' : kind === 'canon' ? 'Canon' : 'Class'}
              </Button>
            );
          })}
        </Stack>
        <Button
          onClick={onCancel}
          sx={{
            alignSelf: 'stretch',
            border: `1px solid ${border}`,
            color: brown,
            fontWeight: 800,
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
      </Stack>
    </Panel>
  );
}

function CanonTechniquePickerDialog({
  open,
  filter,
  selectedTechniqueKeys,
  techniques,
  loading,
  onFilterChange,
  onToggleTechnique,
  onAdd,
  onClose,
}: {
  open: boolean;
  filter: TechniqueElementFilter;
  selectedTechniqueKeys: readonly string[];
  techniques: CanonTechnique[];
  loading: boolean;
  onFilterChange: (filter: TechniqueElementFilter) => void;
  onToggleTechnique: (technique: CanonTechnique) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  const filteredTechniques = useMemo(
    () => techniques.filter((technique) => filter === 'all' || technique.type === filter),
    [filter, techniques],
  );
  const selectedCount = selectedTechniqueKeys.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: parchment,
          color: ink,
          border: `1px solid ${border}`,
          borderRadius: '6px',
          boxShadow: `0 18px 42px ${alpha(deepInk, 0.42)}`,
          m: 1.5,
          overflow: 'hidden',
        },
      }}
    >
      <Stack sx={{ maxHeight: 'min(78vh, 720px)' }}>
        <Stack spacing={1.2} sx={{ p: 1.4, pb: 1 }}>
          <Typography
            sx={{
              color: ink,
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.9rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Choose Canon Technique
          </Typography>
          <TechniqueElementFilterRow
            value={filter}
            includeClass={false}
            onChange={onFilterChange}
          />
        </Stack>

        <Stack
          spacing={0.75}
          sx={{
            px: 1.4,
            pb: 1,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {loading ? (
            <Panel ornament={false}>
              <Typography
                sx={{
                  color: brownSoft,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                Loading canon techniques...
              </Typography>
            </Panel>
          ) : filteredTechniques.length === 0 ? (
            <Panel ornament={false}>
              <Typography
                sx={{
                  color: brownSoft,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                No available techniques of that type.
              </Typography>
            </Panel>
          ) : (
            filteredTechniques.map((technique) => {
              const selected = selectedTechniqueKeys.includes(getTechniqueIdentityKey(technique));
              const visual = techniqueElementVisual(technique.type);
              return (
                <Box
                  key={`${technique.type}-${technique.name}`}
                  component="button"
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggleTechnique(technique)}
                  sx={{
                    width: '100%',
                    p: 0,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Panel ornament={false}>
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <ElementMark
                        color={chromeText}
                        label={visual.label ?? technique.name.slice(0, 1)}
                        src={visual.src}
                        frameColor={visual.frameColor}
                        size={34}
                        height={32}
                      />
                      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
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
                          {technique.name}
                        </Typography>
                        <Typography
                          sx={{
                            color: techniqueCategoryColor(technique.approach, false),
                            fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                            fontSize: '0.62rem',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {technique.approach}
                        </Typography>
                        <Typography
                          sx={{
                            color: brown,
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            fontSize: '0.82rem',
                            lineHeight: 1.4,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {technique.summary}
                        </Typography>
                      </Stack>
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `2px solid ${selected ? ink : alpha(border, 0.8)}`,
                          bgcolor: selected ? ink : 'transparent',
                          boxShadow: selected ? `inset 0 0 0 4px ${parchmentLight}` : 'none',
                          flex: '0 0 auto',
                          mt: 0.2,
                        }}
                      />
                    </Stack>
                  </Panel>
                </Box>
              );
            })
          )}
        </Stack>

        <Stack
          direction="row"
          gap={1}
          sx={{
            p: 1.4,
            pt: 1,
            borderTop: `1px solid ${alpha(border, 0.72)}`,
            bgcolor: alpha(parchmentLight, 0.72),
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              flex: 1,
              border: `1px solid ${border}`,
              color: brown,
              fontWeight: 800,
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={selectedCount === 0}
            onClick={onAdd}
            sx={{
              flex: 1,
              bgcolor: ink,
              color: parchment,
              fontWeight: 900,
              textTransform: 'none',
              '&:disabled': {
                bgcolor: alpha(ink, 0.22),
                color: alpha(ink, 0.46),
              },
              '&:hover': { bgcolor: deepInk },
            }}
          >
            {selectedCount > 0 ? `Add ${selectedCount}` : 'Add'}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

function resolveAvatarClassTrait(classData: AvatarClassData | null | undefined) {
  const title =
    typeof classData?.classTrait?.name === 'string'
      ? classData.classTrait.name
      : defaultClassTrait.title;
  const body =
    typeof classData?.classTrait?.text === 'string'
      ? classData.classTrait.text
      : defaultClassTrait.body;
  return { title, body };
}

function resolveAvatarHistoryQuestions(classData: AvatarClassData | null | undefined) {
  return Array.isArray(classData?.historyQuestions)
    ? classData.historyQuestions.filter(
        (question): question is string =>
          typeof question === 'string' && question.trim().length > 0,
      )
    : defaultHistoryQuestions;
}

function CharacterPane() {
  const { isDarkMode } = useThemeMode();
  // White dropdown chevron in dark mode (native arrow stays dark and is hard
  // to see on the slate select); deep ink in light mode.
  const selectArrowColor = encodeURIComponent(isDarkMode ? '#ffffff' : ink);
  const [character, setCharacter] = useAtom(characterStateAtom);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identityDraft, setIdentityDraft] = useState({
    name: character.name,
    pronouns: character.pronouns,
    age: String(character.age),
    origin: character.origin,
    className: character.className,
  });
  const avatarClass = useQuery(api.classes.getAvatarLegendsClassByName, {
    className: character.className,
  }) as AvatarClassData | null | undefined;
  const avatarClasses = useQuery(api.classes.listAvatarLegendsClasses) as
    | Array<{ class?: AvatarClassData }>
    | undefined;
  const classTrait = resolveAvatarClassTrait(avatarClass);
  const historyQuestions = resolveAvatarHistoryQuestions(avatarClass);
  // Age is now a plain number on the character record; render as
  // "Age <n>" inline. Falsy guards keep blank/0 values out of the row.
  const ageLabel =
    typeof character.age === 'number' && Number.isFinite(character.age)
      ? `Age ${character.age}`
      : '';
  const facts = [character.pronouns, ageLabel, character.origin].filter(Boolean);
  const classOptions =
    avatarClasses
      ?.map((item) => item.class)
      .filter((item): item is AvatarClassData => Boolean(item))
      .filter((item) => typeof item.className === 'string')
      .sort((a, b) => String(a.className).localeCompare(String(b.className))) ?? [];

  useEffect(() => {
    if (!avatarClass) return;
    const hasClassMoves = character.classMoves.some((move) => !move.custom);
    const expectedClassTechnique = coerceAdvancedTechnique(avatarClass, character.primaryTraining);
    const expectedClassTechniqueKey = expectedClassTechnique
      ? getTechniquePersistenceKey(expectedClassTechnique)
      : null;
    const existingClassTechnique = expectedClassTechniqueKey
      ? character.techniques.find(
          (technique) =>
            technique.classTechnique &&
            getTechniquePersistenceKey(technique) === expectedClassTechniqueKey,
        )
      : undefined;
    const classTechniqueDeleted =
      expectedClassTechnique !== null &&
      (character.deletedTechniqueKeys ?? []).includes(
        getTechniquePersistenceKey(expectedClassTechnique),
      );
    // Refresh an already-present class technique when the class data's text has
    // drifted (e.g. the new two-line summary) so existing characters pick it up
    // without waiting on the server migration.
    const classTechniqueNeedsRefresh =
      expectedClassTechnique !== null &&
      existingClassTechnique !== undefined &&
      (existingClassTechnique.summary !== expectedClassTechnique.summary ||
        existingClassTechnique.description !== expectedClassTechnique.description ||
        existingClassTechnique.approach !== expectedClassTechnique.approach ||
        existingClassTechnique.type !== expectedClassTechnique.type);
    if (
      hasClassMoves &&
      (classTechniqueDeleted || (existingClassTechnique && !classTechniqueNeedsRefresh))
    )
      return;
    setCharacter((prev) => {
      const hydrated = applyClassDataToCharacter(prev, avatarClass);
      return {
        ...prev,
        classMoves: hasClassMoves ? prev.classMoves : hydrated.classMoves,
        techniques: dedupeTechniques(
          classTechniqueDeleted
            ? prev.techniques
            : existingClassTechnique && expectedClassTechnique && expectedClassTechniqueKey
              ? prev.techniques.map((technique) =>
                  technique.classTechnique &&
                  getTechniquePersistenceKey(technique) === expectedClassTechniqueKey
                    ? {
                        ...technique,
                        type: expectedClassTechnique.type,
                        approach: expectedClassTechnique.approach,
                        name: expectedClassTechnique.name,
                        summary: expectedClassTechnique.summary,
                        description: expectedClassTechnique.description,
                        fatigue: expectedClassTechnique.fatigue,
                        classTechnique: true,
                      }
                    : technique,
                )
              : hydrated.techniques,
        ),
      };
    });
  }, [
    avatarClass,
    character.classMoves,
    character.deletedTechniqueKeys,
    character.primaryTraining,
    character.techniques,
    setCharacter,
  ]);

  function beginIdentityEdit() {
    setIdentityDraft({
      name: character.name,
      pronouns: character.pronouns,
      age: String(character.age),
      origin: character.origin,
      className: character.className,
    });
    setEditingIdentity(true);
  }

  function saveIdentityEdit() {
    const selectedClass = classOptions.find((item) => item.className === identityDraft.className);
    const age = Number.parseInt(identityDraft.age, 10);
    setCharacter((prev) => {
      const next = {
        ...prev,
        name: identityDraft.name.trim() || prev.name,
        pronouns: identityDraft.pronouns.trim() || prev.pronouns,
        age: Number.isFinite(age) ? Math.max(1, Math.min(120, age)) : prev.age,
        origin: identityDraft.origin.trim() || prev.origin,
      };
      return selectedClass
        ? applyClassDataToCharacter(next, selectedClass)
        : { ...next, className: identityDraft.className };
    });
    setEditingIdentity(false);
  }

  return (
    <Stack spacing={1.1}>
      {/* The main Character card is the only `major` (double-line) panel
          on the page — every other card uses the single-line variant. */}
      <Panel variant="major">
        {/* Image-free header: large serif name centered, with a flourish
            underline of the playbook and the character's facts below. */}
        <Stack alignItems="center" spacing={0.55} sx={{ position: 'relative', py: 0.8, px: 0.6 }}>
          {editingIdentity ? (
            <Stack spacing={1.5} sx={{ width: '100%' }}>
              <CharacterEditField
                label="Name"
                value={identityDraft.name}
                onChange={(value) => setIdentityDraft((prev) => ({ ...prev, name: value }))}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 72px', gap: 0.8 }}>
                <CharacterEditField
                  label="Pronouns"
                  value={identityDraft.pronouns}
                  onChange={(value) => setIdentityDraft((prev) => ({ ...prev, pronouns: value }))}
                />
                <CharacterEditField
                  label="Age"
                  type="number"
                  value={identityDraft.age}
                  onChange={(value) => setIdentityDraft((prev) => ({ ...prev, age: value }))}
                />
              </Box>
              <CharacterEditField
                label="Origin"
                value={identityDraft.origin}
                onChange={(value) => setIdentityDraft((prev) => ({ ...prev, origin: value }))}
              />
              <Stack spacing={0.4} sx={{ mb: 0.8 }}>
                <Typography
                  sx={{
                    color: alpha(brown, 0.76),
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Class
                </Typography>
                <Box
                  component="select"
                  // True 16px (no scale-down) so it sits flush-left under its
                  // label and Safari doesn't zoom; see index.css ios-zoom-keep.
                  className="ios-zoom-keep"
                  value={identityDraft.className}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    setIdentityDraft((prev) => ({ ...prev, className: event.target.value }))
                  }
                  sx={{
                    width: '100%',
                    minHeight: 48,
                    borderRadius: '4px',
                    border: `1px solid ${alpha(accent, 0.72)}`,
                    bgcolor: alpha(parchmentLight, 0.72),
                    color: ink,
                    pl: 1.25,
                    pr: 3,
                    py: 1,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '1rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    // Custom chevron so we can colour it white in dark mode.
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5' stroke='${selectArrowColor}' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    backgroundSize: '14px 14px',
                  }}
                >
                  {classOptions.length === 0 ? (
                    <option value={identityDraft.className}>{identityDraft.className}</option>
                  ) : null}
                  {classOptions.map((item) => (
                    <option key={String(item.className)} value={String(item.className)}>
                      {String(item.className)}
                    </option>
                  ))}
                </Box>
              </Stack>
              <Stack direction="row" gap={1} sx={{ mt: 1.4 }}>
                <Button
                  onClick={() => setEditingIdentity(false)}
                  sx={{
                    flex: 1,
                    border: `1px solid ${border}`,
                    color: brown,
                    textTransform: 'none',
                    fontWeight: 800,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveIdentityEdit}
                  variant="contained"
                  sx={{
                    flex: 1,
                    bgcolor: deepInk,
                    color: chromeText,
                    textTransform: 'none',
                    fontWeight: 800,
                    '&:hover': { bgcolor: deepInk },
                  }}
                >
                  Save
                </Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <Button
                onClick={beginIdentityEdit}
                aria-label="Edit character details"
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: 0,
                  minWidth: 0,
                  minHeight: 30,
                  px: 0.85,
                  borderRadius: '4px',
                  color: brown,
                  border: `1px solid ${alpha(border, 0.75)}`,
                  textTransform: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                }}
              >
                <Pencil size={15} />
              </Button>
              <Typography
                sx={{
                  color: ink,
                  fontFamily: '"IM Fell English", Georgia, serif',
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  textAlign: 'center',
                  px: 4.2,
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
                    fontSize: '0.92rem',
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
                        fontSize: '0.86rem',
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
            </>
          )}
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
        <BalanceTrack classData={avatarClass} />
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
        <ClassTraitAccordion title={classTrait.title} className={character.className}>
          {classTrait.body}
        </ClassTraitAccordion>
      </Panel>

      <Panel>
        <CharacterInfoSection title="Moment of Balance">
          {typeof avatarClass?.momentOfBalance === 'string'
            ? avatarClass.momentOfBalance
            : 'Your moment of balance will appear here once class data is available.'}
        </CharacterInfoSection>
      </Panel>

      <Panel>
        <CharacterInfoSection title="Growth">
          {typeof avatarClass?.growthQuestion === 'string'
            ? avatarClass.growthQuestion
            : 'Your class growth question will appear here once class data is available.'}
        </CharacterInfoSection>
      </Panel>

      <Panel>
        <HistorySection questions={historyQuestions} />
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
function MoveAccordion({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: MoveEntry;
  onUpdate?: (entry: MoveEntry) => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(entry.title);
  const [draftBody, setDraftBody] = useState(entry.body);

  function saveEdit() {
    const title = draftTitle.trim();
    if (!title) return;
    onUpdate?.({ ...entry, title, body: draftBody.trim() || entry.body, custom: true });
    setEditing(false);
  }

  return (
    // Moves cards use the plain rectangular Panel variant — no notches.
    <Panel noNotch onClick={() => !editing && setOpen((value) => !value)}>
      <Stack spacing={0.6}>
        <Box
          component="button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
          aria-expanded={open}
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: 0.9,
            p: 0,
            // Give collapsed Moves cards a bit more vertical presence; when
            // open the body content sets the height so no min is needed.
            minHeight: open ? undefined : 34,
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
          {editing ? (
            <InputBase
              value={draftTitle}
              autoFocus
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setDraftTitle(event.target.value)}
              sx={{
                flex: 1,
                color: ink,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.92rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                '& input': { p: 0 },
              }}
            />
          ) : (
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
          )}
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
            {editing ? (
              <InputBase
                value={draftBody}
                multiline
                minRows={4}
                onChange={(event) => setDraftBody(event.target.value)}
                sx={{
                  color: brown,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  pt: 2,
                  px: 2,
                  pb: 2,
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
                {entry.body}
              </Typography>
            )}
            {entry.bullets ? (
              <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
                {entry.bullets.map((bullet) => (
                  <Typography
                    key={bullet}
                    component="li"
                    sx={{
                      color: brown,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '0.9rem',
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
                  fontSize: '0.9rem',
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
        {entry.custom ? (
          <Stack direction="row" gap={1} justifyContent="flex-end">
            {editing ? (
              <>
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditing(false);
                  }}
                  sx={{ color: brown, textTransform: 'none', fontWeight: 800 }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    saveEdit();
                  }}
                  sx={{ color: bookAccent, textTransform: 'none', fontWeight: 800 }}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    setDraftTitle(entry.title);
                    setDraftBody(entry.body);
                    setOpen(true);
                    setEditing(true);
                  }}
                  startIcon={<Pencil size={14} />}
                  sx={{ color: brown, textTransform: 'none', fontWeight: 800 }}
                >
                  Edit
                </Button>
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete?.();
                  }}
                  startIcon={<Trash2 size={14} />}
                  sx={{ color: passionRed, textTransform: 'none', fontWeight: 800 }}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        ) : null}
      </Stack>
    </Panel>
  );
}

function MovesPane() {
  const [subTab, setSubTab] = useAtom(movesSubTabAtom);
  const requestUndo = useRequestUndoButton();
  // Basic + Balance lists come from the rulebook constants; class
  // moves come from the active character record so each character
  // can carry their own class-specific moves.
  const [character, setCharacter] = useAtom(characterStateAtom);
  const visibleMoves: MoveEntry[] =
    subTab === 0
      ? movesByCategory.basic
      : subTab === 1
        ? movesByCategory.balance
        : character.classMoves;
  return (
    <Stack spacing={1}>
      {/* Stats stay pinned at the top of the Moves tab while the list scrolls. */}
      <StatsPanel sticky />
      <FilterTabs
        labels={['Basic', 'Balance', 'Class']}
        activeIndex={subTab}
        onChange={setSubTab}
      />
      {visibleMoves.map((entry, index) => (
        <MoveAccordion
          key={entry.id ?? `${subTab}-${entry.custom ? 'custom' : 'move'}-${entry.title}-${index}`}
          entry={entry}
          onUpdate={
            entry.custom
              ? (next) =>
                  setCharacter((prev) => ({
                    ...prev,
                    classMoves: prev.classMoves.map((move) => (move === entry ? next : move)),
                  }))
              : undefined
          }
          onDelete={
            entry.custom
              ? () => {
                  setCharacter((prev) => ({
                    ...prev,
                    classMoves: prev.classMoves.filter((move) => move !== entry),
                  }));
                  requestUndo();
                }
              : undefined
          }
        />
      ))}
      {subTab === 2 ? (
        <AddListCard
          label="Add custom move"
          onClick={() =>
            setCharacter((prev) => ({
              ...prev,
              classMoves: [
                ...prev.classMoves,
                {
                  id: createLocalId('move'),
                  title: 'Custom Move',
                  body: 'Describe this custom move.',
                  custom: true,
                },
              ],
            }))
          }
        />
      ) : null}
    </Stack>
  );
}

/**
 * Compact proficiency badge shown on the technique card header. Learned is
 * rendered muted (the default), while Practiced and Mastered escalate to the
 * gold book accent — Mastered filled — so advancement reads at a glance.
 */
function TechniqueLevelPill({ level }: { level: TechniqueLevel }) {
  const filled = level === 'mastered';
  const accentColor = level === 'learned' ? brownSoft : bookAccent;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 0.7,
        py: '4px',
        borderRadius: '2px',
        border: `1px solid ${alpha(accentColor, 0.7)}`,
        bgcolor: filled ? accentColor : 'transparent',
        color: filled ? parchmentLight : accentColor,
        fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
        fontSize: '0.52rem',
        fontWeight: 900,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {techniqueLevelLabels[level]}
    </Box>
  );
}

/**
 * Segmented Learned / Practiced / Mastered control used inside the technique
 * edit mode to set the character's proficiency level for a technique.
 */
function TechniqueLevelSelector({
  value,
  onChange,
}: {
  value: TechniqueLevel;
  onChange: (level: TechniqueLevel) => void;
}) {
  return (
    <Stack spacing={0.45}>
      <Typography
        sx={{
          // Indent to left-align with the card's description text (px: 2).
          pl: 2,
          color: brown,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.65rem',
          fontWeight: 900,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Proficiency
      </Typography>
      {/* Inset the pill group so there's breathing room on the left and right,
          and give the buttons a taller tap target. */}
      <Stack
        direction="row"
        gap={0.5}
        role="group"
        aria-label="Technique proficiency"
        sx={{ px: 3, mb: 0.5 }}
      >
        {techniqueLevelOptions.map((option) => {
          const active = value === option;
          return (
            <Box
              key={option}
              component="button"
              type="button"
              aria-pressed={active}
              aria-label={`Set proficiency to ${techniqueLevelLabels[option]}`}
              onClick={(event) => {
                event.stopPropagation();
                onChange(option);
              }}
              sx={{
                flex: 1,
                minHeight: 46,
                px: 0.5,
                borderRadius: '3px',
                border: `1px solid ${active ? bookAccent : alpha(border, 0.75)}`,
                bgcolor: active ? bookAccent : alpha(parchmentLight, 0.55),
                color: active ? parchmentLight : brown,
                cursor: 'pointer',
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.6rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {techniqueLevelLabels[option]}
            </Box>
          );
        })}
      </Stack>
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
  fatigue,
  level,
  src,
  elementLabel,
  techColor,
  frameColor,
  isBasic = false,
  editing = false,
  onUpdate,
  onLevelChange,
  onEndEditing,
}: {
  approach: TechniqueCategory;
  name: string;
  summary: string;
  description: string;
  fatigue: TechniqueFatigue;
  level: TechniqueLevel;
  src?: string;
  elementLabel?: string;
  techColor: string;
  frameColor?: string;
  /**
   * Basic techniques render the SquareInSquare icon (matching the Basic
   * filter selector) instead of the element image badge.
   */
  isBasic?: boolean;
  /** Controlled edit-mode flag. The Edit trigger lives in the parent's
   *  SwipeableCard channel; entering edit mode just flips this prop. */
  editing?: boolean;
  onUpdate?: (next: Pick<Technique, 'approach' | 'name' | 'summary' | 'description'>) => void;
  /** Set the character's proficiency level for this technique. Available
   *  on every technique (canon, class, and custom), not just custom ones. */
  onLevelChange?: (level: TechniqueLevel) => void;
  /** Called when the card leaves edit mode (Save or Cancel) so the parent
   *  can clear its "which card is editing" state. */
  onEndEditing?: () => void;
}) {
  const { isDarkMode } = useThemeMode();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ approach, name, summary, description, level });
  // Snapshot the latest displayed values so the effect below can seed the
  // draft when edit mode opens without re-running on every prop change.
  const latestValues = useRef({ approach, name, summary, description, level });
  latestValues.current = { approach, name, summary, description, level };
  // Edit mode is driven by the parent (the Edit button now lives in the
  // swipe channel). Seed the draft and expand the card whenever it opens.
  useEffect(() => {
    if (editing) {
      setDraft(latestValues.current);
      setOpen(true);
    }
  }, [editing]);
  const categoryColor = techniqueCategoryColor(approach, isDarkMode);
  const fatigueAccentColor = bookAccent;
  // Only custom techniques expose content editing (approach / name / summary /
  // description). Canon and class techniques are rulebook text, so in edit mode
  // they show the read-only display and only the proficiency level is editable.
  const canEditContent = Boolean(onUpdate);
  const displayedFatigue =
    editing && canEditContent ? deriveTechniqueFatigue(draft.description, draft.approach) : fatigue;
  const selfFatigueCount = displayedFatigue.self.mark + displayedFatigue.self.clear;
  function saveEdit() {
    const nextName = draft.name.trim();
    if (!nextName) return;
    onUpdate?.({
      approach: draft.approach,
      name: nextName,
      summary: draft.summary.trim(),
      description: draft.description.trim(),
    });
    if (draft.level !== level) onLevelChange?.(draft.level);
    onEndEditing?.();
  }
  return (
    <Panel>
      <Stack spacing={0.5}>
        <Box
          component="button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            // Keep the card expanded while editing so the form stays visible.
            if (editing) return;
            setOpen((value) => !value);
          }}
          aria-expanded={open}
          sx={{
            position: 'relative',
            display: 'flex',
            // Center vertically so the element badge aligns with the
            // middle of the title / summary text block.
            alignItems: 'center',
            width: '100%',
            // Taller collapsed card so the stacked proficiency pill + approach
            // eyebrow + title + summary all get vertical breathing room.
            height: open ? 'auto' : 126,
            minHeight: open ? 126 : undefined,
            gap: 0.9,
            pt: 0.75,
            pr: 3.2,
            pb: 0.5,
            pl: 0,
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
              label={elementLabel}
              frameColor={isDarkMode ? undefined : frameColor}
              src={src}
              size={36}
              height={34}
            />
          )}
          <Stack spacing={0.35} sx={{ flex: 1, minWidth: 0, pr: 1.25 }}>
            {/* Approach eyebrow — color keyed to the technique's approach.
                Only custom techniques edit their content; canon/class show the
                read-only display (the proficiency level stays editable below). */}
            {editing && canEditContent ? (
              <>
                <Box
                  component="select"
                  value={draft.approach}
                  onClick={(event: React.MouseEvent<HTMLSelectElement>) => event.stopPropagation()}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    setDraft((prev) => ({
                      ...prev,
                      approach: event.target.value as TechniqueCategory,
                    }))
                  }
                  sx={{
                    width: '100%',
                    minHeight: 26,
                    border: `1px solid ${alpha(border, 0.75)}`,
                    bgcolor: alpha(parchmentLight, 0.72),
                    color: categoryColor,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.58rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                  }}
                >
                  {(['Advance & Attack', 'Defend & Maneuver', 'Evade & Observe'] as const).map(
                    (option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ),
                  )}
                </Box>
                <InputBase
                  value={draft.name}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  sx={{
                    color: ink,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    '& input': { p: 0 },
                  }}
                />
                <InputBase
                  value={draft.summary}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, summary: event.target.value }))
                  }
                  sx={{
                    color: brown,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    '& input': { p: 0 },
                  }}
                />
              </>
            ) : (
              <>
                {/* Proficiency pill sits on its own line above the approach
                    text, with breathing room between the two and a little extra
                    space below the approach text. Basic techniques have no
                    mastery progression, so they skip the pill. */}
                <Stack alignItems="flex-start" spacing={0.85} sx={{ pb: 0.65 }}>
                  {isBasic ? null : <TechniqueLevelPill level={level} />}
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
                </Stack>
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
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    pb: 0.45,
                    // Summaries are written as a descriptive first line plus
                    // condensed mechanical line(s); render the newlines.
                    whiteSpace: 'pre-line',
                    ...(open
                      ? {}
                      : {
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 3,
                          overflow: 'hidden',
                        }),
                  }}
                >
                  {summary}
                </Typography>
              </>
            )}
          </Stack>
          {selfFatigueCount > 0 ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.45}
              sx={{
                position: 'absolute',
                top: 8,
                right: 4,
                px: 0.15,
              }}
            >
              <Stack direction="row" gap={0.25} alignItems="center">
                {Array.from({ length: displayedFatigue.self.mark }).map((_, i) => (
                  <FatigueDiamond key={`mark-${i}`} filled color={fatigueAccentColor} size={8} />
                ))}
                {Array.from({ length: displayedFatigue.self.clear }).map((_, i) => (
                  <FatigueDiamond
                    key={`clear-${i}`}
                    filled={false}
                    color={fatigueAccentColor}
                    size={8}
                  />
                ))}
              </Stack>
              <Typography
                sx={{
                  color: fatigueAccentColor,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.58rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                }}
              >
                FATIGUE
              </Typography>
            </Stack>
          ) : null}
          <Box
            component={ChevronRight}
            size={18}
            sx={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: open ? 'translateY(-50%) rotate(90deg)' : 'translateY(-50%) rotate(0deg)',
              transformOrigin: 'center',
              transition: 'transform 0.2s ease',
              color: alpha(ink, 0.8),
              flex: '0 0 auto',
            }}
          />
        </Box>
        {open ? (
          <>
            <Box
              sx={{
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(accent, 0.6)} 12%, ${alpha(accent, 0.6)} 88%, transparent 100%)`,
              }}
            />
            {editing && canEditContent ? (
              <InputBase
                value={draft.description}
                multiline
                minRows={4}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                sx={{
                  color: brown,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  pt: 2,
                  px: 2,
                  pb: 2,
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
                {description}
              </Typography>
            )}
          </>
        ) : null}
        {editing ? (
          <Stack spacing={0.75} sx={{ pt: 0.25 }}>
            {onLevelChange ? (
              <TechniqueLevelSelector
                value={draft.level}
                onChange={(nextLevel) => setDraft((prev) => ({ ...prev, level: nextLevel }))}
              />
            ) : null}
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  onEndEditing?.();
                }}
                sx={{ color: brown, textTransform: 'none', fontWeight: 800 }}
              >
                Cancel
              </Button>
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  saveEdit();
                }}
                sx={{ color: bookAccent, textTransform: 'none', fontWeight: 800 }}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </Panel>
  );
}

function CombatPane() {
  const { isDarkMode } = useThemeMode();
  const positiveStatuses = ['Empowered', 'Favored', 'Inspired', 'Prepared'];
  const negativeStatuses = ['Doomed', 'Impaired', 'Trapped', 'Stunned'];
  const conditions = ['Afraid', 'Angry', 'Guilty', 'Insecure', 'Troubled'];
  // All UI state lives in jotai atoms so it persists when switching between
  // the Character / Moves / Combat / Backpack main tabs.
  const [subTab, setSubTab] = useAtom(combatSubTabAtom);
  const [techFilter, setTechFilter] = useAtom(techniqueFilterAtom);
  const [elementFilter, setElementFilter] = useAtom(techniqueElementAtom);
  const [addTechniqueOpen, setAddTechniqueOpen] = useState(false);
  const [addTechniqueKind, setAddTechniqueKind] = useState<'custom' | 'canon' | 'class' | null>(
    null,
  );
  const [canonTechniqueType, setCanonTechniqueType] = useState<TechniqueElementFilter>('all');
  const [selectedCanonTechniqueKeys, setSelectedCanonTechniqueKeys] = useState<readonly string[]>(
    [],
  );
  const [pendingTechniqueDelete, setPendingTechniqueDelete] = useState<number | null>(null);
  // Which technique cards are currently in edit mode (by index into the full
  // techniques array). The Edit trigger lives in each card's swipe channel;
  // cards edit independently so opening one never discards another's draft.
  const [editingTechniqueIndices, setEditingTechniqueIndices] = useState<readonly number[]>([]);
  const startEditingTechnique = (index: number) =>
    setEditingTechniqueIndices((prev) => (prev.includes(index) ? prev : [...prev, index]));
  const stopEditingTechnique = (index: number) =>
    setEditingTechniqueIndices((prev) => prev.filter((value) => value !== index));
  // Techniques live on the character record (characterStateAtom) so
  // each character carries their own set of known techniques.
  const character = useAtomValue(characterStateAtom);
  const techniques = character.techniques;
  const canonGameSystem = useQuery(
    api.gameSystems.getById,
    addTechniqueOpen ? { id: 'avatar-legends' } : 'skip',
  );
  const avatarClass = useQuery(api.classes.getAvatarLegendsClassByName, {
    className: character.className,
  }) as AvatarClassData | null | undefined;
  // Filter by both element and proficiency level. techFilter 0 = All
  // (no level filter); 1..3 map to learned / practiced / mastered.
  const visibleTechniques = useMemo(() => {
    const targetLevel: TechniqueLevel | null =
      techFilter === 0 ? null : (['learned', 'practiced', 'mastered'] as const)[techFilter - 1];
    return techniques.filter((tech) => {
      const elementOk =
        elementFilter === 'all'
          ? true
          : elementFilter === 'class'
            ? Boolean(tech.classTechnique)
            : tech.type === elementFilter;
      const levelOk = targetLevel === null || tech.level === targetLevel;
      return elementOk && levelOk;
    });
  }, [techniques, elementFilter, techFilter]);
  const fatigue = useAtomValue(fatigueAtom);
  const tempFatigue = useAtomValue(tempFatigueAtom);
  const [, setCharacterState] = useAtom(characterStateAtom);
  const canonTechniques = useMemo<CanonTechnique[]>(() => {
    const rawTechniques =
      canonGameSystem && Array.isArray((canonGameSystem as { techniques?: unknown }).techniques)
        ? ((canonGameSystem as unknown as { techniques: unknown[] }).techniques ?? [])
        : [];
    return rawTechniques
      .map(coerceCanonTechnique)
      .filter((technique): technique is CanonTechnique => Boolean(technique))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [canonGameSystem]);
  const existingTechniqueKeys = useMemo(
    () => new Set(character.techniques.map(getTechniqueIdentityKey)),
    [character.techniques],
  );
  const availableCanonTechniques = useMemo(
    () =>
      canonTechniques.filter(
        (technique) => !existingTechniqueKeys.has(getTechniqueIdentityKey(technique)),
      ),
    [canonTechniques, existingTechniqueKeys],
  );
  const deletedClassTechnique = useMemo(() => {
    const technique = coerceAdvancedTechnique(avatarClass, character.primaryTraining);
    if (!technique) return null;
    const key = getTechniquePersistenceKey(technique);
    const deleted = (character.deletedTechniqueKeys ?? []).includes(key);
    const alreadyPresent = character.techniques.some(
      (existing) => existing.classTechnique && getTechniquePersistenceKey(existing) === key,
    );
    return deleted && !alreadyPresent ? technique : null;
  }, [
    avatarClass,
    character.deletedTechniqueKeys,
    character.primaryTraining,
    character.techniques,
  ]);
  const resetAddTechniqueFlow = () => {
    setAddTechniqueOpen(false);
    setAddTechniqueKind(null);
    setCanonTechniqueType('all');
    setSelectedCanonTechniqueKeys([]);
  };
  const addCustomTechnique = () => {
    setCharacterState((prev) => {
      const nextType =
        elementFilter !== 'all' && elementFilter !== 'basic' && elementFilter !== 'class'
          ? elementFilter
          : trainingToTechniqueType(prev.primaryTraining);
      const existingNames = new Set(
        prev.techniques.map((technique) => technique.name.trim().toLowerCase()),
      );
      let customName = 'Custom Technique';
      let suffix = 2;
      while (existingNames.has(customName.toLowerCase())) {
        customName = `Custom Technique ${suffix}`;
        suffix += 1;
      }
      return {
        ...prev,
        techniques: dedupeTechniques([
          ...prev.techniques,
          withTechniqueFatigue({
            id: createLocalId('technique'),
            type: nextType,
            approach: 'Advance & Attack',
            level: 'learned',
            name: customName,
            summary: 'Add a short technique summary.',
            description: 'Describe how this custom technique works.',
            custom: true,
          }) as Technique,
        ]),
      };
    });
    resetAddTechniqueFlow();
  };
  const addCanonTechnique = () => {
    const selectedKeys = new Set(selectedCanonTechniqueKeys);
    const selectedTechniques = availableCanonTechniques.filter((technique) =>
      selectedKeys.has(getTechniqueIdentityKey(technique)),
    );
    if (selectedTechniques.length === 0) return;
    setCharacterState((prev) => {
      const currentKeys = new Set(prev.techniques.map(getTechniqueIdentityKey));
      const additions = selectedTechniques
        .filter((technique) => !currentKeys.has(getTechniqueIdentityKey(technique)))
        .map(
          (technique) =>
            ({
              ...technique,
              id: createLocalId('technique'),
              level: 'learned',
            }) as Technique,
        );
      return {
        ...prev,
        techniques: dedupeTechniques([...prev.techniques, ...additions]),
      };
    });
    resetAddTechniqueFlow();
  };
  const toggleCanonTechnique = (technique: CanonTechnique) => {
    const key = getTechniqueIdentityKey(technique);
    setSelectedCanonTechniqueKeys((current) =>
      current.includes(key) ? current.filter((value) => value !== key) : [...current, key],
    );
  };
  const restoreClassTechnique = () => {
    if (!deletedClassTechnique) return;
    const key = getTechniquePersistenceKey(deletedClassTechnique);
    setCharacterState((prev) => ({
      ...prev,
      techniques: dedupeTechniques([...prev.techniques, deletedClassTechnique]),
      deletedTechniqueKeys: (prev.deletedTechniqueKeys ?? []).filter(
        (deletedKey) => deletedKey !== key,
      ),
    }));
    resetAddTechniqueFlow();
  };
  const updateFatigueCapacity = (base: boolean[], temp: boolean[]) => {
    setCharacterState((prev) => ({ ...prev, fatigue: base, tempFatigue: temp }));
  };
  const requestUndo = useRequestUndoButton();
  const confirmTechniqueDelete = () => {
    if (pendingTechniqueDelete === null) return;
    setCharacterState((prev) => {
      const technique = prev.techniques[pendingTechniqueDelete];
      if (!technique) return prev;
      const deletedTechniqueKey = technique.classTechnique
        ? getTechniquePersistenceKey(technique)
        : null;
      const currentDeletedTechniqueKeys = prev.deletedTechniqueKeys ?? [];
      return {
        ...prev,
        techniques: prev.techniques.filter((_, index) => index !== pendingTechniqueDelete),
        deletedTechniqueKeys:
          deletedTechniqueKey === null || currentDeletedTechniqueKeys.includes(deletedTechniqueKey)
            ? currentDeletedTechniqueKeys
            : [...currentDeletedTechniqueKeys, deletedTechniqueKey],
      };
    });
    // Deleting shifts list indices, so drop the removed card's edit state and
    // shift any higher indices down by one to keep other drafts pointed right.
    setEditingTechniqueIndices((prev) =>
      prev
        .filter((value) => value !== pendingTechniqueDelete)
        .map((value) => (value > pendingTechniqueDelete ? value - 1 : value)),
    );
    setPendingTechniqueDelete(null);
    requestUndo();
  };
  const [activeStatuses, setActiveStatuses] = useAtom(activeStatusesAtom);
  const [statusInfoLabel, setStatusInfoLabel] = useState<string | null>(null);
  const [statusInfoAnchorEl, setStatusInfoAnchorEl] = useState<HTMLElement | null>(null);
  const openStatusInfo = (label: string, anchorEl: HTMLElement) => {
    setStatusInfoLabel(label);
    setStatusInfoAnchorEl(anchorEl);
  };
  const closeStatusInfo = () => {
    setStatusInfoLabel(null);
    setStatusInfoAnchorEl(null);
  };
  const toggleStatus = (label: string) =>
    setActiveStatuses((prev) => ({ ...prev, [label]: !prev[label] }));
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
    requestUndo();
  }
  // Conditions sub-tab mirrors Character tab conditions, with dark mode
  // using a deeper gold fill for a quieter active state.
  const negativeStatusColor = isDarkMode ? darkNegativeRed : passionRed;
  const positiveStatusColor =
    character.primaryTraining === 'Firebending'
      ? '#f4b45f'
      : isDarkMode
        ? uiPrimaryDark
        : uiPrimary;

  return (
    <>
      <Stack spacing={1}>
        {/* Combat tab opens with the same Stats panel that lives on Character,
          for at-a-glance reference during combat rolls. Sticky so it stays
          visible while scrolling through techniques. */}
        <StatsPanel sticky />
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
            <TechniqueElementFilterRow value={elementFilter} onChange={setElementFilter} />
            {/* Secondary filter row — proficiency level for the techniques list. */}
            <FilterTabs
              labels={['All', 'Learned', 'Practiced', 'Mastered']}
              activeIndex={techFilter}
              onChange={setTechFilter}
            />
            {visibleTechniques.map((tech, index) => {
              const isBasic = tech.type === 'basic';
              const visual = tech.classTechnique
                ? classTechniqueVisual
                : techniqueElementVisual(tech.type);
              const techniqueIndex = techniques.indexOf(tech);
              const requestDelete = () => setPendingTechniqueDelete(techniqueIndex);
              // Editable when content (custom) or proficiency level (all
              // non-basic techniques) can change. Drives the channel Edit button.
              const editable = tech.custom || !isBasic;
              return (
                <SwipeableCard
                  key={
                    tech.id ??
                    `${tech.custom ? 'custom' : tech.classTechnique ? 'class' : 'tech'}-${tech.type}-${tech.level}-${tech.name}-${index}`
                  }
                  actions={[
                    // Edit sits to the left of Delete in the revealed channel,
                    // styled like the other channel Edit buttons (gold pencil).
                    editable
                      ? {
                          icon: <Pencil size={18} />,
                          color: bookAccent,
                          ariaLabel: `Edit ${tech.name}`,
                          onClick: () => startEditingTechnique(techniqueIndex),
                        }
                      : null,
                    {
                      icon: <Trash2 size={18} />,
                      color: passionRed,
                      ariaLabel: `Delete ${tech.name}`,
                      onClick: requestDelete,
                      closeOnClick: false,
                    },
                  ]}
                  borderRadius="4px"
                >
                  <TechniqueAccordion
                    approach={tech.approach}
                    name={tech.name}
                    summary={tech.summary}
                    description={tech.description}
                    fatigue={tech.fatigue}
                    level={tech.level}
                    editing={editingTechniqueIndices.includes(techniqueIndex)}
                    onUpdate={
                      tech.custom
                        ? (next) =>
                            setCharacterState((prev) => ({
                              ...prev,
                              techniques: dedupeTechniques(
                                prev.techniques.map((item) =>
                                  item === tech
                                    ? (withTechniqueFatigue({
                                        ...item,
                                        ...next,
                                        custom: true,
                                      }) as Technique)
                                    : item,
                                ),
                              ),
                            }))
                        : undefined
                    }
                    onLevelChange={
                      isBasic
                        ? undefined
                        : (nextLevel) =>
                            setCharacterState((prev) => ({
                              ...prev,
                              techniques: prev.techniques.map((item) =>
                                item === tech ? { ...item, level: nextLevel } : item,
                              ),
                            }))
                    }
                    onEndEditing={() => stopEditingTechnique(techniqueIndex)}
                    isBasic={isBasic}
                    // src is only used when isBasic=false (image badge path).
                    src={visual.src}
                    elementLabel={visual.label}
                    techColor={isBasic ? ink : visual.color}
                    frameColor={visual.frameColor}
                  />
                </SwipeableCard>
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
            {addTechniqueOpen ? (
              <TechniqueAddCard
                selectedKind={addTechniqueKind}
                canRestoreClassTechnique={deletedClassTechnique !== null}
                onSelectKind={(kind) => {
                  setAddTechniqueKind(kind);
                  setCanonTechniqueType('all');
                  setSelectedCanonTechniqueKeys([]);
                  if (kind === 'custom') addCustomTechnique();
                  if (kind === 'class') restoreClassTechnique();
                }}
                onCancel={resetAddTechniqueFlow}
              />
            ) : (
              <AddListCard label="Technique" onClick={() => setAddTechniqueOpen(true)} />
            )}
            <CanonTechniquePickerDialog
              open={addTechniqueOpen && addTechniqueKind === 'canon'}
              filter={canonTechniqueType}
              selectedTechniqueKeys={selectedCanonTechniqueKeys}
              techniques={availableCanonTechniques}
              loading={addTechniqueOpen && !canonGameSystem}
              onFilterChange={setCanonTechniqueType}
              onToggleTechnique={toggleCanonTechnique}
              onAdd={addCanonTechnique}
              onClose={resetAddTechniqueFlow}
            />
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
                    color: positiveStatusColor,
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
                    activeColor={positiveStatusColor}
                    onToggle={() => toggleStatus(label)}
                    onInfoClick={(event) => openStatusInfo(label, event.currentTarget)}
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
                    onInfoClick={(event) => openStatusInfo(label, event.currentTarget)}
                  />
                ))}
              </Stack>
            </Box>
            <StatusDescriptionPopper
              label={statusInfoLabel}
              anchorEl={statusInfoAnchorEl}
              positiveColor={positiveStatusColor}
              onClose={closeStatusInfo}
            />
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
                    <ConditionButtonShared label={label} />
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
      <AvatarLegendsConfirmDialog
        open={pendingTechniqueDelete !== null}
        onCancel={() => setPendingTechniqueDelete(null)}
        onConfirm={confirmTechniqueDelete}
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
  const [character, setCharacter] = useAtom(characterStateAtom);
  const [pendingConnectionDelete, setPendingConnectionDelete] = useState<number | null>(null);
  const requestUndo = useRequestUndoButton();
  const connections = character.connections;
  const addConnection = () =>
    setCharacter((prev) => ({
      ...prev,
      connections: [
        ...prev.connections,
        {
          id: createLocalId('connection'),
          name: 'New Connection',
          role: 'Role',
          note: 'Add connection notes.',
        },
      ],
    }));
  return (
    <Stack spacing={1}>
      <SectionTitle>Connections</SectionTitle>
      {connections.map(({ id, name, role, note }, index) => (
        <ConnectionAccordion
          key={id ?? `${name}-${role}-${index}`}
          name={name}
          role={role}
          note={note}
          influence={4 - index}
          influenceLabelColor={influenceLabelColor}
          influenceDotsColor={influenceDotsColor}
          onUpdate={(next) =>
            setCharacter((prev) => ({
              ...prev,
              connections: prev.connections.map((connection, i) =>
                i === index ? { ...connection, ...next } : connection,
              ),
            }))
          }
          onRequestDelete={() => setPendingConnectionDelete(index)}
        />
      ))}
      <AddListCard label="Add Connection" onClick={addConnection} />
      <AvatarLegendsConfirmDialog
        open={pendingConnectionDelete !== null}
        onCancel={() => setPendingConnectionDelete(null)}
        onConfirm={() => {
          if (pendingConnectionDelete === null) return;
          setCharacter((prev) => ({
            ...prev,
            connections: prev.connections.filter((_, index) => index !== pendingConnectionDelete),
          }));
          setPendingConnectionDelete(null);
          requestUndo();
        }}
      />
    </Stack>
  );
}

function ConnectionAccordion({
  name,
  role,
  note,
  influence,
  influenceLabelColor,
  influenceDotsColor,
  onUpdate,
  onRequestDelete,
}: {
  name: string;
  role: string;
  note: string;
  influence: number;
  influenceLabelColor: string;
  influenceDotsColor: string;
  onUpdate: (next: { name?: string; role?: string; note?: string }) => void;
  onRequestDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingField, setEditingField] = useState<'main' | 'note' | null>(null);
  const [draftName, setDraftName] = useState(name);
  const [draftRole, setDraftRole] = useState(role);
  const [draftNote, setDraftNote] = useState(note);

  function commitEdit() {
    if (editingField === 'main') {
      const nextName = draftName.trim();
      const nextRole = draftRole.trim();
      if (nextName || nextRole) {
        onUpdate({
          name: nextName || name,
          role: nextRole || role,
        });
      }
    } else if (editingField === 'note') {
      onUpdate({ note: draftNote.trim() });
    }
    setEditingField(null);
  }

  function cancelEdit() {
    if (editingField === 'main') {
      setDraftName(name);
      setDraftRole(role);
    } else if (editingField === 'note') {
      setDraftNote(note);
    }
    setEditingField(null);
  }

  const mainSwipeActions = [
    {
      icon: <Trash2 size={18} />,
      color: '#7a2424',
      ariaLabel: 'Delete connection',
      closeOnClick: false,
      onClick: onRequestDelete,
    },
    {
      icon: <Pencil size={18} />,
      color: bookAccent,
      ariaLabel: 'Edit connection',
      onClick: () => {
        setDraftName(name);
        setDraftRole(role);
        setEditingField('main');
      },
    },
  ];
  const noteSwipeActions = [
    {
      icon: <Pencil size={18} />,
      color: bookAccent,
      ariaLabel: 'Edit connection description',
      onClick: () => {
        setDraftNote(note);
        setEditingField('note');
      },
    },
  ];

  return (
    <SwipeableCard actions={mainSwipeActions}>
      <Panel>
        <Stack spacing={0.7} sx={{ px: 0.45, py: 0.35 }}>
          <Box
            component="button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (editingField) return;
              setOpen((value) => !value);
            }}
            aria-expanded={open}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              alignItems: 'center',
              width: '100%',
              columnGap: 0.8,
              py: 0.25,
              px: 0.2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Stack spacing={0.2} sx={{ minWidth: 0 }}>
              {editingField === 'main' ? (
                <Box
                  onBlur={(event) => {
                    const nextFocus = event.relatedTarget;
                    if (nextFocus instanceof Node && event.currentTarget.contains(nextFocus))
                      return;
                    commitEdit();
                  }}
                >
                  <InputBase
                    value={draftName}
                    autoFocus
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitEdit();
                      if (event.key === 'Escape') cancelEdit();
                    }}
                    sx={{
                      width: '100%',
                      color: ink,
                      fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                      fontSize: '1rem',
                      fontWeight: 900,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      lineHeight: 1.05,
                      '& input': { p: 0 },
                    }}
                  />
                  <InputBase
                    value={draftRole}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setDraftRole(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitEdit();
                      if (event.key === 'Escape') cancelEdit();
                    }}
                    sx={{
                      width: '100%',
                      color: brownSoft,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      fontStyle: 'italic',
                      '& input': { p: 0 },
                    }}
                  />
                </Box>
              ) : (
                <>
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
                </>
              )}
            </Stack>
            <Stack alignItems="flex-end" spacing={0.2} sx={{ pr: 1.1 }}>
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
              <StatDots value={influence} color={influenceDotsColor} />
            </Stack>
            <Box
              component={ChevronRight}
              size={18}
              sx={{
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: alpha(ink, 0.8),
                display: 'flex',
                alignItems: 'center',
                flex: '0 0 auto',
              }}
            />
          </Box>
          {open ? (
            <>
              <Box
                sx={{
                  height: '1px',
                  background: `linear-gradient(90deg, transparent 0%, ${alpha(accent, 0.65)} 12%, ${alpha(accent, 0.65)} 88%, transparent 100%)`,
                }}
              />
              <SwipeableCard actions={noteSwipeActions} borderRadius="4px">
                <Box
                  sx={{
                    border: `1px solid ${alpha(border, 0.6)}`,
                    borderRadius: '4px',
                    bgcolor: alpha(parchmentLight, 0.72),
                  }}
                >
                  {editingField === 'note' ? (
                    <InputBase
                      value={draftNote}
                      autoFocus
                      multiline
                      maxRows={6}
                      onChange={(event) => setDraftNote(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && event.ctrlKey) commitEdit();
                        if (event.key === 'Escape') cancelEdit();
                      }}
                      onBlur={commitEdit}
                      sx={{
                        width: '100%',
                        color: brown,
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        pt: 2.2,
                        px: 2.3,
                        pb: 2.2,
                        boxSizing: 'border-box',
                        '& textarea': { p: 0 },
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        color: brown,
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        pt: 2.2,
                        px: 2.3,
                        pb: 2.2,
                      }}
                    >
                      {note}
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
      <Panel
        noNotch
        onClick={() => {
          if (editingField) return;
          setOpen((value) => !value);
        }}
      >
        <Stack spacing={0.5}>
          <Box
            component="button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
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
                  onClick={(event) => event.stopPropagation()}
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
                    mt: 0.75,
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
                        fontSize: '0.9rem',
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
                        fontSize: '0.9rem',
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
 * boxes from conditions or abilities.
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
  const baseFatigueColor = bookAccent;
  const tempFatigueColor = accent;

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
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
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
              {/* Base diamonds first (left), then temp diamonds expand to the
                  right, so the bar grows rightward as temporary capacity is
                  added. */}
              <Stack direction="row" flexWrap="wrap" gap={0.7}>
                {Array.from({ length: baseFatigue.length }).map((_, index) => (
                  <FatigueDiamond
                    key={`base-${index}`}
                    filled={baseFatigue[index]}
                    color={baseFatigueColor}
                    size={28}
                    ariaLabel={`Toggle base fatigue ${index + 1}`}
                    onToggle={() => toggleBaseFatigue(index)}
                  />
                ))}
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
  const requestUndo = useRequestUndoButton();

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
    requestUndo();
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
  const [activeTab, setActiveTab] = useState<AvatarTab>(() =>
    readPersistentAppView('avatar-legends', 'tab', avatarTabValues, 'character'),
  );
  const activeConfig = useMemo(
    () => tabs.find((tab) => tab.value === activeTab) ?? tabs[0],
    [activeTab],
  );

  useEffect(() => {
    persistAppView('avatar-legends', 'tab', activeTab);
  }, [activeTab]);

  // Dark mode for the avatar-legends UI. applyAvatarPalette mutates the
  // module-level color `let`s so every helper component picks up the
  // correct theme palette on its next render. Done at the start of
  // render, before children read those colors during their own render.
  const { isDarkMode } = useThemeMode();
  const [character, setCharacter] = useAtom(characterStateAtom);
  const selectRemoteCharacter = useCallback(
    (characterState: unknown) => {
      setCharacter(deserializeAvatarLegendsCharacter(characterState));
    },
    [setCharacter],
  );
  const localCharacters = useLocalCharacterSlots({
    atom: characterStateAtom,
    gameSystem: AVATAR_LEGENDS_GAME_SYSTEM,
    legacyKey: 'avatar-legends-character',
    initialValue: defaultCharacter,
    createCharacter: createRandomAvatarLegendsCharacter,
    describeCharacter: describeAvatarLegendsCharacter,
    migrate: migrateAvatarLegendsLocalCharacter,
  });
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('avatar-legends-primary-training-change', {
        detail: character.primaryTraining,
      }),
    );
  }, [character.primaryTraining]);
  const trainingTheme =
    primaryTrainingThemes[character.primaryTraining] ??
    primaryTrainingThemes[defaultCharacter.primaryTraining];
  applyAvatarPalette(isDarkMode, character.primaryTraining);
  const accountTokens = useMemo(
    () => createAvatarAccountTokens(isDarkMode, trainingTheme),
    [isDarkMode, trainingTheme],
  );
  const trainingHeaderBorder =
    character.primaryTraining === 'Earthbending'
      ? '#9a7a2f'
      : character.primaryTraining === 'Technology' && !isDarkMode
        ? '#3f214d'
        : trainingTheme.headerBorder;
  const trainingFooterBorder =
    character.primaryTraining === 'Earthbending'
      ? '#9a7a2f'
      : character.primaryTraining === 'Technology' && !isDarkMode
        ? '#3f214d'
        : trainingTheme.footerBorder;
  const trainingHeaderFill =
    character.primaryTraining === 'Firebending'
      ? `linear-gradient(180deg, ${trainingTheme.pageBg.dark} 0%, #6f2a24 34%, #a53f38 60%, #a53f38 68%, ${parchment} 100%)`
      : character.primaryTraining === 'Waterbending'
        ? `linear-gradient(180deg, ${trainingTheme.pageBg.dark} 0%, ${parchment} 100%)`
        : character.primaryTraining === 'Technology'
          ? `linear-gradient(180deg, #3c294c 0%, #3c294c 36%, ${parchment} 100%)`
          : trainingTheme.chromeFill;
  const trainingFooterFill =
    character.primaryTraining === 'Firebending'
      ? 'linear-gradient(180deg, #9f372f 0%, #6f2a24 52%, #2a100e 100%)'
      : trainingTheme.chromeFill;
  const shouldMirrorHeader =
    character.primaryTraining === 'Waterbending' || character.primaryTraining === 'Airbending';
  const shouldHideHeaderEdgeLine = (
    ['Waterbending', 'Firebending', 'Weapons', 'Technology'] as PrimaryTraining[]
  ).includes(character.primaryTraining);
  const shouldExtendHeaderFill =
    shouldHideHeaderEdgeLine && character.primaryTraining !== 'Firebending';
  const trainingBandZIndex =
    character.primaryTraining === 'Weapons'
      ? 0
      : character.primaryTraining === 'Airbending'
        ? 3
        : 2;
  const headerBorderOffsetY = character.primaryTraining === 'Technology' ? -10 : 0;
  const footerBorderOffsetY = character.primaryTraining === 'Technology' ? 15 : 0;
  const pageBg = isDarkMode ? trainingTheme.pageBg.dark : trainingTheme.pageBg.light;
  // Light-mode active-tab title bar keeps the earlier white wash, flipped
  // so the top meets the header-bottom color and the white settles below.
  const titleBarGradient = `linear-gradient(180deg, ${parchment} 0%, ${parchment} 18%, #ffffff 100%)`;
  const tabTitleBg = isDarkMode ? 'transparent' : titleBarGradient;
  const tabTitleColor = isDarkMode ? ink : '#000000';
  const bottomSafeAreaPadding = 'max(20px, env(safe-area-inset-bottom, 0px))';
  const firefoxBottomNavInset = '48px';
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
        {localCharacters.hydrated ? <ConvexCharacterSyncMount /> : null}
      </ErrorBoundary>
      <Box
        sx={{
          // Use the full viewport so the outer mat extends through safe areas
          // instead of exposing the page background below the app card.
          minHeight: '100vh',
          '@supports (-webkit-touch-callout: none)': {
            '@media (display-mode: standalone)': {
              minHeight: '100lvh',
            },
          },
          // Outer mat around the parchment card — gradient switches with mode.
          background: pageBg,
          display: 'grid',
          placeItems: 'center',
          p: { xs: 0, sm: 2 },
        }}
      >
        <Box
          data-dice-tray-root
          sx={{
            width: 'min(100vw, 430px)',
            // Use the full viewport on mobile so installed PWAs keep the footer
            // anchored consistently across browsers.
            height: { xs: '100vh', sm: 'min(860px, calc(100vh - 32px))' },
            '@supports (-webkit-touch-callout: none)': {
              '@media (display-mode: standalone) and (max-width: 599.95px)': {
                height: '100lvh',
              },
            },
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
            // Note: iOS focus-zoom prevention is handled globally in index.css
            // (font-size 16px + transform scale, which keeps the CSS font-size
            // at 16px). A `zoom: 0.875` here used to shrink the rendered size
            // below 16px, which actually re-triggered the zoom and overrode the
            // `.ios-zoom-keep` opt-out — so it was removed.
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 'env(safe-area-inset-top, 0px)',
              background: `var(--app-chrome-color, ${trainingTheme.chromeColor})`,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
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
            fill={trainingHeaderFill}
            borderColor={trainingHeaderBorder}
            brushBorder={trainingTheme.brushBorder}
            borderOffsetY={headerBorderOffsetY}
            topOffset="env(safe-area-inset-top, 0px)"
            extendFillToEdge={shouldExtendHeaderFill}
            mirrorX={shouldMirrorHeader}
            overflowVisible={
              character.primaryTraining === 'Airbending' ||
              character.primaryTraining === 'Technology'
            }
            showEdgeLine={!shouldHideHeaderEdgeLine}
            zIndex={trainingBandZIndex}
          />
          <WatercolorBand
            bottom
            height={86}
            fill={trainingFooterFill}
            borderColor={trainingFooterBorder}
            brushBorder={trainingTheme.brushBorder}
            borderOffsetY={footerBorderOffsetY}
            zIndex={trainingBandZIndex}
          />

          {/* Page corner ornaments — near-white in both modes, sitting on
            the deep-navy header. */}
          <Box
            sx={{
              position: 'absolute',
              top: 'env(safe-area-inset-top, 0px)',
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            <CornerOrnament position="tl" color={chromeText} size={18} />
            <CornerOrnament position="tr" color={chromeText} size={18} />
          </Box>

          <Stack
            sx={{
              position: 'relative',
              height: '100%',
              boxSizing: 'border-box',
              pt: 'env(safe-area-inset-top, 0px)',
            }}
          >
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
                zIndex: 4,
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
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Button
                  component={Link}
                  to="/"
                  aria-label="Back to Table Top home"
                  sx={{
                    minWidth: 34,
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    bgcolor: alpha('#ffffff', 0.16),
                    color: chromeText,
                    p: 0,
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.22),
                    },
                  }}
                >
                  <House size={18} strokeWidth={2} />
                </Button>
                <AccountSettings
                  gameSystem="avatar-legends"
                  localCharacterName={character.name}
                  localCharacters={localCharacters}
                  tokensOverride={accountTokens}
                  createCharacterPayload={({ avatarClass }) =>
                    createRandomAvatarLegendsBackendPayload(avatarClass as AvatarClassData | null)
                  }
                  onSelectCharacterState={selectRemoteCharacter}
                  selectCharacterEventName={AVATAR_LEGENDS_SELECT_CHARACTER_EVENT}
                />
              </Stack>
            </Box>

            {/* Active-tab title bar. In light mode this band carries the
              whiter cornflower gradient + black title text (transferred
              from the app header per the user spec). In dark mode it
              stays on the parchment surface. */}
            <Box
              sx={{
                mt: '-2px',
                px: 1.4,
                pt: 2.55,
                pb: 0,
                minHeight: 58,
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
              data-dice-tray-scroll-root
              sx={{
                flex: 1,
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                  width: 0,
                  height: 0,
                },
                px: 1.25,
                pt: 2.5,
                // Reserve room at the bottom so the last bit of content
                // scrolls up clear of the absolutely-positioned nav. Now
                // tight to the actual nav height (no bristle band sits
                // behind it) so there's no dark strip for content to
                // scroll over.
                // Footer pb dropped by 8px (see below) — content reserve
                // shrinks to match so the last row sits flush against the
                // nav top. The +150px also clears the floating dice-roller FAB
                // (which sits ~128px above the nav) so the last content isn't
                // hidden under it.
                pb: `calc(226px + ${bottomSafeAreaPadding})`,
                '@supports (-moz-appearance: none)': {
                  pb: `calc(226px + ${bottomSafeAreaPadding} + ${firefoxBottomNavInset})`,
                },
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
                pb: bottomSafeAreaPadding,
                '@supports (-moz-appearance: none)': {
                  // Firefox installed PWAs need an extra bottom lift; Safari keeps using env().
                  pb: `calc(${bottomSafeAreaPadding} + ${firefoxBottomNavInset})`,
                },
                pt: 0.3,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                // Solid backdrop matching the active training chrome so body
                // content scrolling behind the nav is fully occluded.
                background: trainingFooterFill,
                borderTop: `2px solid ${trainingFooterBorder}`,
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
