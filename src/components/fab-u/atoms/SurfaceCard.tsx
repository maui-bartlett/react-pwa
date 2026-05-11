import { PropsWithChildren, ReactNode } from 'react';

import Box from '@mui/material/Box';
import Paper, { PaperProps } from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

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
        border: `1px solid ${fabUTokens.color.border}`,
        borderRadius: `${fabUTokens.radius.md}px`,
        bgcolor: fabUTokens.color.surface,
        boxShadow: fabUTokens.shadow.soft,
        p: 2,
        ...sx,
      }}
      {...props}
    >
      <Stack spacing={1.5}>
        {(label || title || subtitle || actions) && (
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
            <Stack spacing={0.75}>
              {label ? <SectionLabel label={label} /> : null}
              {title ? (
                <Typography
                  variant="h6"
                  sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700 }}
                >
                  {title}
                </Typography>
              ) : null}
              {subtitle ? (
                <Typography variant="body2" sx={{ color: fabUTokens.color.textSecondary }}>
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
