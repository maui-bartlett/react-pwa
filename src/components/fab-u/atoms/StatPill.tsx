import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { getToneStyles } from '../tokens';
import { StatPillData } from '../types';

function StatPill({ label, value, helperText, tone = 'neutral' }: StatPillData) {
  const toneStyles = getToneStyles(tone);

  return (
    <Box
      sx={{
        border: `1px solid ${toneStyles.borderColor}`,
        borderRadius: '12px',
        background: `linear-gradient(180deg, ${alpha(toneStyles.color, 0.12)} 0%, rgba(255,255,255,0.97) 42%)`,
        boxShadow: `inset 0 3px 0 ${alpha(toneStyles.color, 0.75)}`,
        px: 1.25,
        py: 1.05,
        minWidth: 0,
      }}
    >
      <Stack spacing={0.25}>
        <Typography
          variant="caption"
          sx={{
            color: toneStyles.color,
            fontWeight: 700,
            fontSize: '0.64rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: '#1f2a26', fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.1 }}
        >
          {value}
        </Typography>
        {helperText ? (
          <Typography variant="caption" sx={{ color: '#51605a', fontSize: '0.68rem' }}>
            {helperText}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

export default StatPill;
