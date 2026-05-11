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
        width: '100%',
        maxWidth: 390,
        minHeight: 780,
        borderRadius: '18px',
        border: `1px solid ${fabUTokens.color.border}`,
        bgcolor: fabUTokens.color.canvas,
        boxShadow: '0 10px 28px rgba(31, 42, 38, 0.08)',
        overflow: 'hidden',
      }}
    >
      <Stack
        sx={{
          height: '100%',
          bgcolor: fabUTokens.color.canvas,
        }}
      >
        <Box sx={{ px: 1.1, pt: 1.1, pb: 0.9 }}>{header}</Box>
        <Stack spacing={1.25} sx={{ px: 1.1, pb: 1, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {children}
        </Stack>
        <Box
          sx={{
            px: 1.1,
            py: 1,
            borderTop: `1px solid ${fabUTokens.color.border}`,
            bgcolor: alpha(fabUTokens.color.surface, 0.9),
          }}
        >
          {footer}
        </Box>
      </Stack>
    </Box>
  );
}

export default MobileScreen;
