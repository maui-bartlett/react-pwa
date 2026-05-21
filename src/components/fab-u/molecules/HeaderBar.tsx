import { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useFabUTokens } from '../ThemeContext';

type HeaderBarProps = {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  action?: ReactNode;
  variant?: 'compact' | 'hero';
};

function HeaderBar({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  action,
  variant = 'hero',
}: HeaderBarProps) {
  const fabUTokens = useFabUTokens();
  const compact = variant === 'compact';

  return (
    <Stack
      data-pw="header-bar"
      direction="row"
      alignItems={compact ? 'center' : 'flex-start'}
      justifyContent="space-between"
      spacing={compact ? 2 : 1}
      sx={{
        position: 'relative',
        bgcolor: fabUTokens.color.brand,
        borderColor: alpha('#ffffff', 0.12),
        borderStyle: 'solid',
        borderWidth: compact ? 1 : { xs: '0 0 1px', md: 1 },
        borderRadius: compact ? '9px' : 0,
        color: '#fff',
        px: compact ? 1.6 : 1.95,
        pt: compact ? 1.15 : 'max(22px, calc(env(safe-area-inset-top) + 10px))',
        pb: compact ? 1.15 : 2.25,
        minHeight: compact ? undefined : 101,
        boxSizing: 'border-box',
        boxShadow: '0 6px 14px rgba(30, 49, 40, 0.08)',
      }}
    >
      <Stack
        spacing={compact ? 0.16 : 0.3}
        sx={{
          flex: 1,
          minWidth: 0,
          pr: action || actionLabel ? (compact ? 9 : 11) : 0,
        }}
      >
        {eyebrow ? (
          <Typography
            data-pw="header-eyebrow"
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.78)',
              fontWeight: 700,
              fontSize: compact ? '0.62rem' : '0.67rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          data-pw="header-title"
          variant={compact ? 'h6' : 'h5'}
          sx={{
            fontWeight: 700,
            lineHeight: 1.1,
            fontSize: compact ? '1.05rem' : '1.36rem',
            letterSpacing: compact ? '0.07em' : '0.005em',
            textTransform: compact ? 'uppercase' : 'none',
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              maxWidth: compact ? 140 : 'none',
              fontSize: compact ? '0.73rem' : '0.83rem',
              lineHeight: 1.32,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      {action ? (
        <Box
          data-pw="header-settings-action"
          sx={{
            position: 'absolute',
            top: compact ? 9 : 'max(12px, calc(env(safe-area-inset-top) + 8px))',
            right: compact ? 10 : 12,
            zIndex: 1,
          }}
        >
          {action}
        </Box>
      ) : null}
      {actionLabel ? (
        <Box
          data-pw="header-action"
          sx={{
            position: 'absolute',
            top: compact ? '50%' : 'max(13px, calc(env(safe-area-inset-top) + 9px))',
            bottom: 'auto',
            right: compact ? 10 : 58,
            transform: compact ? 'translateY(-50%)' : 'none',
            minWidth: compact ? 78 : 72,
            minHeight: compact ? 30 : 32,
            borderRadius: '7px',
            bgcolor: fabUTokens.isDark ? fabUTokens.color.brandSoft : alpha('#ffffff', 0.96),
            color: fabUTokens.isDark ? '#ffffff' : fabUTokens.color.brandStrong,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1.15,
            boxShadow: 'none',
            cursor: 'default',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: compact ? '0.72rem' : '0.74rem',
          }}
        >
          {actionLabel}
        </Box>
      ) : null}
    </Stack>
  );
}

export default HeaderBar;
