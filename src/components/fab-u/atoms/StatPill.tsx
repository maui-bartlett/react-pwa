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
        borderRadius: '10px',
        background: `linear-gradient(180deg, ${alpha(toneStyles.color, 0.11)} 0%, rgba(255,255,255,0.98) 45%)`,
        boxShadow: `inset 0 2px 0 ${alpha(toneStyles.color, 0.7)}`,
        px: 1.1,
        py: 0.95,
        minWidth: 0,
      }}
    >
      <Stack spacing={0.22}>
        <Typography
          variant="caption"
          sx={{
            color: toneStyles.color,
            fontWeight: 700,
            fontSize: '0.6rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: '#1f2a26', fontWeight: 700, fontSize: '1.08rem', lineHeight: 1.08 }}
        >
          {value}
        </Typography>
        {helperText ? (
          <Typography
            variant="caption"
            sx={{ color: '#51605a', fontSize: '0.64rem', lineHeight: 1.25 }}
          >
            {helperText}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

export default StatPill;
