import { PropsWithChildren, ReactNode } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

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
        borderRadius: '28px',
        border: `1px solid ${fabUTokens.color.border}`,
        bgcolor: fabUTokens.color.canvas,
        boxShadow: '0 16px 42px rgba(31, 42, 38, 0.1)',
        p: 0.8,
      }}
    >
      <Stack
        spacing={1.5}
        sx={{
          height: '100%',
          borderRadius: '22px',
          overflow: 'hidden',
          bgcolor: fabUTokens.color.canvas,
        }}
      >
        <Box sx={{ px: 1.25, pt: 1.25 }}>{header}</Box>
        <Stack spacing={1.5} sx={{ px: 1.25, pb: 1, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {children}
        </Stack>
        <Box sx={{ px: 1.25, pb: 1.25 }}>{footer}</Box>
      </Stack>
    </Box>
  );
}

export default MobileScreen;
