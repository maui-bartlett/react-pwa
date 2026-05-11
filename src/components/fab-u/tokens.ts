import { alpha } from '@mui/material/styles';

import { Tone } from './types';

const fabUTokens = {
  color: {
    canvas: '#f4f1ea',
    surface: '#ffffff',
    surfaceMuted: '#f8f7f3',
    border: '#d7ddd5',
    textPrimary: '#1f2a26',
    textSecondary: '#51605a',
    brand: '#285346',
    brandStrong: '#1f4338',
    brandSoft: '#e5efe9',
    hp: '#c25d52',
    mp: '#4f7fd3',
    warning: '#d49037',
    success: '#6d9b6c',
    danger: '#9e4f4f',
    neutral: '#8d938d',
  },
  radius: {
    pill: 999,
    sm: 12,
    md: 18,
    lg: 24,
  },
  shadow: {
    soft: '0 10px 30px rgba(31, 42, 38, 0.08)',
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
