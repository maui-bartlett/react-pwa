import { alpha } from '@mui/material/styles';

import { Tone } from './types';

type FabUColorTokens = {
  canvas: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  brand: string;
  brandStrong: string;
  brandSoft: string;
  highlight: string;
  highlightFg: string;
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
  shadow: { soft: string };
};

/** Light-mode tokens (default). */
const fabUTokens: FabUTokens = {
  isDark: false,
  color: {
    canvas: '#efe8dc',
    surface: '#ffffff',
    surfaceMuted: '#f6f0e6',
    border: '#c9d0c3',
    textPrimary: '#1d2723',
    textSecondary: '#56625d',
    brand: '#315c4d',
    brandStrong: '#26493d',
    brandSoft: '#e3ebe2',
    highlight: '#315c4d', // = brand in light mode
    highlightFg: '#ffffff',
    hp: '#c06355',
    mp: '#547bcb',
    warning: '#d19842',
    success: '#6d946a',
    danger: '#9f5450',
    neutral: '#888f88',
  },
  radius: { pill: 999, sm: 9, md: 13, lg: 16 },
  shadow: { soft: '0 4px 14px rgba(31, 42, 38, 0.045)' },
};

/** Dark-mode tokens. */
const darkFabUTokens: FabUTokens = {
  isDark: true,
  color: {
    canvas: '#0e110e',
    surface: '#131613',
    surfaceMuted: '#1a1e18',
    border: '#263530',
    textPrimary: '#e8e4d8',
    textSecondary: '#94908a',
    brand: '#315c4d',
    brandStrong: '#26493d',
    brandSoft: '#1a2e26',
    highlight: '#c5a557', // yellow accent in dark mode
    highlightFg: '#1a2e26',
    hp: '#c06355',
    mp: '#547bcb',
    warning: '#d19842',
    success: '#6d946a',
    danger: '#9f5450',
    neutral: '#888f88',
  },
  radius: { pill: 999, sm: 9, md: 13, lg: 16 },
  shadow: { soft: '0 4px 14px rgba(0, 0, 0, 0.5)' },
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
