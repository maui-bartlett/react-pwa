import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';

type ObjectiveClockProps = {
  segments: number;
  filled: number;
  size?: number;
  label?: string;
};

function clampInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function ObjectiveClock({ segments, filled, size = 132, label }: ObjectiveClockProps) {
  const fabUTokens = useFabUTokens();
  const safeSegments = clampInteger(segments, 2, 12);
  const safeFilled = clampInteger(filled, 0, safeSegments);
  const filledAngle = (safeFilled / safeSegments) * 360;
  const separatorAngle = Math.min(2.4, 12 / safeSegments);
  const segmentAngle = 360 / safeSegments;
  const separatorStart = segmentAngle - separatorAngle;

  return (
    <Box
      role="img"
      aria-label={
        label
          ? `${label}: ${safeFilled} of ${safeSegments} clock sections filled`
          : `${safeFilled} of ${safeSegments} clock sections filled`
      }
      sx={{
        position: 'relative',
        width: size,
        height: size + 28,
        flexShrink: 0,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${fabUTokens.color.brand}`,
          background: `
            repeating-conic-gradient(
              from -90deg,
              transparent 0deg ${separatorStart}deg,
              ${fabUTokens.color.surface} ${separatorStart}deg ${segmentAngle}deg
            ),
            conic-gradient(
              from -90deg,
              ${fabUTokens.color.highlight} 0deg ${filledAngle}deg,
              ${fabUTokens.color.surfaceMuted} ${filledAngle}deg 360deg
            )
          `,
          boxShadow: fabUTokens.shadow.card,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '44%',
            borderRadius: '50%',
            bgcolor: fabUTokens.color.brand,
          },
        }}
      />
      <Typography
        component="span"
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          transform: 'translateX(-50%)',
          color: fabUTokens.color.textSecondary,
          fontSize: '0.72rem',
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}
      >
        {safeFilled} / {safeSegments}
      </Typography>
    </Box>
  );
}

export default ObjectiveClock;
