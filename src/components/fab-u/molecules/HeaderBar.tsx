import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { fabUTokens } from '../tokens';

type HeaderBarProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  variant?: 'compact' | 'hero';
};

function HeaderBar({ eyebrow, title, subtitle, actionLabel, variant = 'hero' }: HeaderBarProps) {
  const compact = variant === 'compact';

  return (
    <Stack
      direction="row"
      alignItems={compact ? 'center' : 'flex-start'}
      justifyContent="space-between"
      spacing={2}
      sx={{
        bgcolor: fabUTokens.color.brand,
        border: `1px solid ${alpha('#ffffff', 0.12)}`,
        borderRadius: compact ? '9px' : '11px',
        color: '#fff',
        px: compact ? 1.6 : 1.95,
        py: compact ? 1.15 : 2.05,
        boxShadow: '0 6px 14px rgba(30, 49, 40, 0.08)',
      }}
    >
      <Stack spacing={compact ? 0.16 : 0.3}>
        {eyebrow ? (
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.78)',
              fontWeight: 700,
              fontSize: compact ? '0.58rem' : '0.63rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          variant={compact ? 'h6' : 'h5'}
          sx={{
            fontWeight: 700,
            lineHeight: 1.1,
            fontSize: compact ? '0.98rem' : '1.28rem',
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
              maxWidth: compact ? 140 : 230,
              fontSize: compact ? '0.69rem' : '0.78rem',
              lineHeight: 1.32,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      {actionLabel ? (
        <Button
          variant="contained"
          size="small"
          sx={{
            alignSelf: compact ? 'center' : 'flex-start',
            minWidth: compact ? 78 : 88,
            minHeight: compact ? 30 : 32,
            borderRadius: '7px',
            bgcolor: alpha('#ffffff', 0.96),
            color: fabUTokens.color.brandStrong,
            px: 1.15,
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: compact ? '0.72rem' : '0.74rem',
            '&:hover': {
              bgcolor: '#fff',
              boxShadow: 'none',
            },
          }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  );
}

export default HeaderBar;
