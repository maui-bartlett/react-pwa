import { alpha } from '@mui/material/styles';

import { Tone } from './types';

const fabUTokens = {
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
    hp: '#c06355',
    mp: '#547bcb',
    warning: '#d19842',
    success: '#6d946a',
    danger: '#9f5450',
    neutral: '#888f88',
  },
  radius: {
    pill: 999,
    sm: 9,
    md: 13,
    lg: 16,
  },
  shadow: {
    soft: '0 4px 14px rgba(31, 42, 38, 0.045)',
  },
};

function getToneStyles(tone: Tone = 'neutral') {
  const styles = {
    neutral: fabUTokens.color.neutral,
    accent: fabUTokens.color.brand,
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

export { fabUTokens, getToneStyles };
