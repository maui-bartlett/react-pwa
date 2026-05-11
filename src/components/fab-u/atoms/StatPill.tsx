import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getToneStyles } from '../tokens';
import { StatPillData } from '../types';

function StatPill({ label, value, helperText, tone = 'neutral' }: StatPillData) {
  const toneStyles = getToneStyles(tone);

  return (
    <Box
      sx={{
        border: `1px solid ${toneStyles.borderColor}`,
        borderRadius: '16px',
        backgroundColor: toneStyles.backgroundColor,
        px: 1.5,
        py: 1.25,
        minWidth: 0,
      }}
    >
      <Stack spacing={0.35}>
        <Typography
          variant="caption"
          sx={{ color: toneStyles.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          {label}
        </Typography>
        <Typography variant="h6" sx={{ color: '#1f2a26', fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </Typography>
        {helperText ? (
          <Typography variant="caption" sx={{ color: '#51605a' }}>
            {helperText}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

export default StatPill;
