import { PropsWithChildren, ReactNode } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';

import { fabUTokens } from '../tokens';

type MobileScreenProps = PropsWithChildren<{
  header: ReactNode;
  footer: ReactNode;
}>;

function MobileScreen({ header, footer, children }: MobileScreenProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 390,
        minHeight: 780,
        height: {
          xs: 'calc(100dvh - 32px)',
          md: 'calc(100dvh - 48px)',
        },
        maxHeight: 900,
        borderRadius: '14px',
        border: `1px solid ${fabUTokens.color.border}`,
        bgcolor: fabUTokens.color.canvas,
        boxShadow: '0 5px 18px rgba(31, 42, 38, 0.05)',
        overflow: 'hidden',
      }}
    >
      <Stack
        sx={{
          height: '100%',
          bgcolor: fabUTokens.color.canvas,
        }}
      >
        <Box sx={{ px: 1, pt: 1, pb: 0.75, flexShrink: 0 }}>{header}</Box>
        <Stack
          spacing={2.15}
          sx={{
            px: 1,
            pb: 10,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          {children}
        </Stack>
      </Stack>
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          px: 1,
          py: 0.85,
          borderTop: `1px solid ${fabUTokens.color.border}`,
          bgcolor: alpha(fabUTokens.color.surface, 0.94),
          backdropFilter: 'blur(8px)',
        }}
      >
        {footer}
      </Box>
    </Box>
  );
}

export default MobileScreen;
