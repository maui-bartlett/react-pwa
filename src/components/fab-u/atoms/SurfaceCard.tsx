import { PropsWithChildren, ReactNode } from 'react';

import Box from '@mui/material/Box';
import Paper, { PaperProps } from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { fabUTokens } from '../tokens';
import SectionLabel from './SectionLabel';

type SurfaceCardProps = PaperProps &
  PropsWithChildren<{
    label?: string;
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
    actionsPosition?: 'inline' | 'absolute';
  }>;

function SurfaceCard({
  label,
  title,
  subtitle,
  actions,
  actionsPosition = 'inline',
  children,
  sx,
  ...props
}: SurfaceCardProps) {
  const hasInlineActions = actions && actionsPosition === 'inline';
  const hasHeaderContent = title || subtitle || hasInlineActions;

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        border: `1px solid ${fabUTokens.color.border}`,
        borderRadius: `${fabUTokens.radius.md}px`,
        bgcolor: fabUTokens.color.surface,
        boxShadow: fabUTokens.shadow.soft,
        p: 1.65,
        pt: label ? 2.3 : 1.65,
        backgroundImage: `linear-gradient(180deg, ${alpha(fabUTokens.color.surfaceMuted, 0.62)} 0%, ${fabUTokens.color.surface} 24%)`,
        ...sx,
      }}
      {...props}
    >
      {label ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 12,
            transform: 'translateY(-50%)',
            px: 0.28,
            bgcolor: fabUTokens.color.canvas,
          }}
        >
          <SectionLabel label={label} />
        </Box>
      ) : null}
      {actions && actionsPosition === 'absolute' ? (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: 12,
            zIndex: 1,
          }}
        >
          {actions}
        </Box>
      ) : null}
      <Stack spacing={1.15}>
        {hasHeaderContent && (
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
            <Stack spacing={0.55}>
              {title ? (
                <Typography
                  variant="h6"
                  sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '1rem' }}
                >
                  {title}
                </Typography>
              ) : null}
              {subtitle ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: fabUTokens.color.textSecondary,
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                  }}
                >
                  {subtitle}
                </Typography>
              ) : null}
            </Stack>
            {hasInlineActions ? <Box>{actions}</Box> : null}
          </Stack>
        )}
        {children}
      </Stack>
    </Paper>
  );
}

export default SurfaceCard;
