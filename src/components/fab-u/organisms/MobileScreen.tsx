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
        <Box sx={{ px: 1, pt: 1, pb: 0.75 }}>{header}</Box>
        <Stack spacing={1.1} sx={{ px: 1, pb: 0.9, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {children}
        </Stack>
        <Box
          sx={{
            px: 1,
            py: 0.85,
            borderTop: `1px solid ${fabUTokens.color.border}`,
            bgcolor: alpha(fabUTokens.color.surface, 0.94),
          }}
        >
          {footer}
        </Box>
      </Stack>
    </Box>
  );
}

export default MobileScreen;
