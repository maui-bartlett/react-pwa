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
        border: `1px solid ${alpha('#ffffff', 0.14)}`,
        borderRadius: compact ? '10px' : '12px',
        color: '#fff',
        px: compact ? 1.75 : 2,
        py: compact ? 1.25 : 1.8,
      }}
    >
      <Stack spacing={compact ? 0.2 : 0.35}>
        {eyebrow ? (
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.82)',
              fontWeight: 700,
              fontSize: compact ? '0.62rem' : '0.66rem',
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
            fontSize: compact ? '1.02rem' : '1.35rem',
            letterSpacing: compact ? '0.08em' : '0.01em',
            textTransform: compact ? 'uppercase' : 'none',
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.84)',
              maxWidth: 240,
              fontSize: compact ? '0.72rem' : '0.82rem',
              lineHeight: 1.35,
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
            minWidth: compact ? 86 : 92,
            borderRadius: '8px',
            bgcolor: alpha('#ffffff', 0.95),
            color: fabUTokens.color.brandStrong,
            px: 1.25,
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.75rem',
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
