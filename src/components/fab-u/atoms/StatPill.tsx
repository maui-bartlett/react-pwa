import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getToneStyles } from '../tokens';
import { StatPillData } from '../types';

function StatPill({
  label,
  value,
  helperText,
  tone = 'neutral',
  layout = 'stacked',
  minHeight,
}: StatPillData) {
  const toneStyles = getToneStyles(tone);
  const inline = layout === 'inline';

  return (
    <Box
      sx={{
        border: `1px solid ${toneStyles.borderColor}`,
        borderRadius: '10px',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        px: 1.1,
        py: inline ? 0.75 : 0.6,
        minWidth: 0,
        minHeight,
      }}
    >
      <Stack spacing={inline ? 0.18 : 0.08} sx={{ width: '100%', justifyContent: 'center' }}>
        <Stack
          direction={inline ? 'row' : 'column'}
          justifyContent="space-between"
          alignItems={inline ? 'center' : 'flex-start'}
          gap={inline ? 1 : 0.12}
        >
          <Typography
            variant="caption"
            sx={{
              color: toneStyles.color,
              fontWeight: 700,
              fontSize: '0.6rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#1f2a26',
              fontWeight: 700,
              fontSize: inline ? '0.96rem' : '0.98rem',
              lineHeight: 1.04,
              whiteSpace: 'nowrap',
              textAlign: inline ? 'right' : 'left',
            }}
          >
            {value}
          </Typography>
        </Stack>
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
