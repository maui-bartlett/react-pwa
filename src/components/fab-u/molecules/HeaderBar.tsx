import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fabUTokens } from '../tokens';

type HeaderBarProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  variant?: 'compact' | 'hero';
};

function HeaderBar({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  variant = 'hero',
}: HeaderBarProps) {
  const compact = variant === 'compact';

  return (
    <Stack
      direction="row"
      alignItems={compact ? 'center' : 'flex-start'}
      justifyContent="space-between"
      spacing={2}
      sx={{
        bgcolor: fabUTokens.color.brand,
        borderRadius: compact ? `${fabUTokens.radius.md}px` : `${fabUTokens.radius.lg}px`,
        color: '#fff',
        px: compact ? 2 : 2.5,
        py: compact ? 1.5 : 2.25,
      }}
    >
      <Stack spacing={0.5}>
        {eyebrow ? (
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant={compact ? 'h6' : 'h5'} sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.84)', maxWidth: 240 }}>
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
            borderRadius: `${fabUTokens.radius.pill}px`,
            bgcolor: '#fff',
            color: fabUTokens.color.brandStrong,
            px: 1.75,
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 700,
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
