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
  }>;

function SurfaceCard({
  label,
  title,
  subtitle,
  actions,
  children,
  sx,
  ...props
}: SurfaceCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        border: `1px solid ${fabUTokens.color.border}`,
        borderRadius: `${fabUTokens.radius.md}px`,
        bgcolor: fabUTokens.color.surface,
        boxShadow: fabUTokens.shadow.soft,
        p: 1.75,
        pt: label ? 2.4 : 1.75,
        backgroundImage: `linear-gradient(180deg, ${alpha(fabUTokens.color.surfaceMuted, 0.55)} 0%, ${fabUTokens.color.surface} 22%)`,
        ...sx,
      }}
      {...props}
    >
      {label ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 14,
            transform: 'translateY(-50%)',
            px: 0.35,
            bgcolor: fabUTokens.color.canvas,
          }}
        >
          <SectionLabel label={label} />
        </Box>
      ) : null}
      <Stack spacing={1.25}>
        {(label || title || subtitle || actions) && (
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
            <Stack spacing={0.75}>
              {title ? (
                <Typography
                  variant="h6"
                  sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '1.05rem' }}
                >
                  {title}
                </Typography>
              ) : null}
              {subtitle ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: fabUTokens.color.textSecondary,
                    fontSize: '0.84rem',
                    lineHeight: 1.5,
                  }}
                >
                  {subtitle}
                </Typography>
              ) : null}
            </Stack>
            {actions ? <Box>{actions}</Box> : null}
          </Stack>
        )}
        {children}
      </Stack>
    </Paper>
  );
}

export default SurfaceCard;
