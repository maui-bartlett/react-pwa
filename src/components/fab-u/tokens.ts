import { alpha } from '@mui/material/styles';

import { Tone } from './types';

const fabUTokens = {
  color: {
    canvas: '#f1ede4',
    surface: '#ffffff',
    surfaceMuted: '#f7f4ed',
    border: '#ccd4ca',
    textPrimary: '#1f2a26',
    textSecondary: '#51605a',
    brand: '#2b5747',
    brandStrong: '#23483b',
    brandSoft: '#dfe9e0',
    hp: '#c25d52',
    mp: '#4f7fd3',
    warning: '#d49037',
    success: '#6d9b6c',
    danger: '#9e4f4f',
    neutral: '#8d938d',
  },
  radius: {
    pill: 999,
    sm: 10,
    md: 14,
    lg: 18,
  },
  shadow: {
    soft: '0 6px 18px rgba(31, 42, 38, 0.05)',
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
