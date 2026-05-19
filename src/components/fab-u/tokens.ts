import { alpha } from '@mui/material/styles';

import { Tone } from './types';

type FabUColorTokens = {
  /** Full-page outer background — nearly white in light mode, deepest dark in dark mode. */
  page: string;
  canvas: string;
  surface: string;
  /** Light green-tinted background used for SurfaceCards (light mode only; same as surface in dark). */
  surfaceCard: string;
  /** Slightly darkened surface used for pills/cards (distinct from canvas in dark mode). */
  pillSurface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  brand: string;
  brandStrong: string;
  brandSoft: string;
  /** Text on regular (canvas/surface) backgrounds that uses brand-green hue — lightened in dark mode for AA contrast. */
  brandText: string;
  /** Foreground always rendered ON a brand-green background (always white). */
  brandFg: string;
  /** Background fill for SectionLabel header pills. */
  labelBg: string;
  /** Foreground text for SectionLabel header pills. */
  labelFg: string;
  highlight: string;
  highlightFg: string;
  /** Fabula Points accent color — cyan-teal. */
  fp: string;
  /** Foreground text rendered ON an fp-colored background. */
  fpFg: string;
  hp: string;
  mp: string;
  warning: string;
  success: string;
  danger: string;
  neutral: string;
};

type FabUTokens = {
  isDark: boolean;
  color: FabUColorTokens;
  radius: { pill: number; sm: number; md: number; lg: number };
  shadow: { soft: string; card: string };
};

/** Light-mode tokens (default). */
const fabUTokens: FabUTokens = {
  isDark: false,
  color: {
    page: '#ffffff', // pure white outer app wrapper
    canvas: '#f3f8f5', // scroll-content backdrop — slightly more green than page
    surface: '#ffffff',
    surfaceCard: '#ecf2ee', // soft light-green tint for SurfaceCards
    pillSurface: '#ffffff', // same as surface in light mode; pills look lifted via shadow.card
    surfaceMuted: '#edf2ef', // was '#f6f0e6' — cooler, less cream
    border: '#aec0b7', // was '#c9d0c3' — darker for more contrast
    textPrimary: '#111b18', // was '#1d2723' — deeper for higher contrast
    textSecondary: '#455550', // was '#56625d' — darker for better readability
    brand: '#315c4d',
    brandStrong: '#26493d',
    brandSoft: '#e0ebe5',
    brandText: '#7fae9a', // same as dark mode — distinctive green visible in both modes
    brandFg: '#ffffff', // text ON brand-green bg
    labelBg: '#315c4d', // section header pill fill — same green as top header bar
    labelFg: '#ffffff', // white text on green pill
    highlight: '#E08920', // vivid bronze-amber — brighter/more saturated than previous
    highlightFg: '#1a2e26', // dark text on amber
    fp: '#1A8F8A', // blue-green teal for Fabula Points
    fpFg: '#021e22', // dark text on cyan
    hp: '#c06355',
    mp: '#547bcb',
    warning: '#d19842',
    success: '#6d946a',
    danger: '#9f5450',
    neutral: '#888f88',
  },
  radius: { pill: 999, sm: 9, md: 13, lg: 16 },
  shadow: {
    soft: '0 4px 14px rgba(31, 42, 38, 0.09)', // was 0.045 — stronger card shadow
    card: '0 4px 14px rgba(31, 42, 38, 0.15)', // pills & non-SurfaceCard elements in light mode
  },
};

/** Dark-mode tokens. */
const darkFabUTokens: FabUTokens = {
  isDark: true,
  color: {
    page: '#090c09', // deepest dark — slightly deeper than canvas for the outer wrapper
    canvas: '#0e110e',
    surface: '#131613',
    surfaceCard: '#131613', // same as surface in dark mode — no separate tinting needed
    pillSurface: '#111311', // slightly darker than surface — subtle dark fill for pills/cards
    surfaceMuted: '#1a1e18',
    border: '#263530',
    textPrimary: '#e8e4d8',
    textSecondary: '#94908a',
    brand: '#315c4d',
    brandStrong: '#26493d',
    brandSoft: '#1a2e26',
    brandText: '#7fae9a', // lightened for AA contrast on dark bg (#7fae9a on #131613 ≈ 7.9:1)
    brandFg: '#ffffff', // text ON brand-green bg
    labelBg: '#315c4d', // same as brand — matches the top header bar green
    labelFg: '#ffffff', // white text on dark-green pill
    highlight: '#CE7C1C', // vivid dark bronze for dark bg
    highlightFg: '#1a2e26',
    fp: '#22AEAC', // blue-green teal for dark bg
    fpFg: '#021e22',
    hp: '#c06355',
    mp: '#547bcb',
    warning: '#d19842',
    success: '#6d946a',
    danger: '#9f5450',
    neutral: '#888f88',
  },
  radius: { pill: 999, sm: 9, md: 13, lg: 16 },
  shadow: {
    soft: '0 4px 14px rgba(0, 0, 0, 0.5)',
    card: '0 4px 14px rgba(0, 0, 0, 0.5)', // same as soft in dark mode
  },
};

function getToneStyles(tone: Tone = 'neutral') {
  const styles = {
    neutral: fabUTokens.color.neutral,
    accent: '#7292d4',
    success: fabUTokens.color.success,
    warning: fabUTokens.color.warning,
    danger: fabUTokens.color.danger,
  }[tone];

  return {
    borderColor: alpha(styles, 0.5),
    backgroundColor: alpha(styles, 0.08),
    color: styles,
  };
}

export type { FabUTokens };
export { fabUTokens, darkFabUTokens, getToneStyles };
