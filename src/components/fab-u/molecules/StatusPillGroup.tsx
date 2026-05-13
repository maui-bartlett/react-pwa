import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fabUTokens } from '../tokens';

type StatusPillNode = {
  label: string;
  color: string;
  result?: boolean;
};

type StatusPillGroupProps = {
  topLeft: StatusPillNode;
  topRight: StatusPillNode;
  result: StatusPillNode;
};

const LINE_COLOR = '#d7ddd6';
// Approximate rendered pill height (border 1×2 + py≈5×2 + caption 0.7rem×1.66≈18.6px)
const PILL_H = 29;
// Visible stem height below each upper pill before reaching the horizontal bar
const DROP_H = 10;
const H_TOP = PILL_H + DROP_H; // y of horizontal bar = 39

function StatusPill({ label, color, result = false }: StatusPillNode) {
  return (
    <Box
      sx={{
        minWidth: result ? 84 : 72,
        border: `1px solid ${color}`,
        borderRadius: '8px',
        bgcolor: '#fff',
        px: 1.05,
        py: 0.62,
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(31, 42, 38, 0.04)',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: result ? fabUTokens.color.textSecondary : fabUTokens.color.textPrimary,
          fontWeight: 500,
          fontSize: '0.7rem',
          letterSpacing: 0,
          textTransform: 'none',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function StatusPillGroup({ topLeft, topRight, result }: StatusPillGroupProps) {
  return (
    <Box sx={{ position: 'relative', width: 164, height: 94, flexShrink: 0 }}>
      {/* Upper pills */}
      <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
        <StatusPill {...topLeft} />
      </Box>
      <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
        <StatusPill {...topRight} />
      </Box>

      {/* Result pill */}
      <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
        <StatusPill {...result} result />
      </Box>

      {/* Left vertical drop — from bottom-center of topLeft pill down to horizontal */}
      <Box
        data-pw="left-drop"
        sx={{
          position: 'absolute',
          top: PILL_H,
          left: 35,
          width: 2,
          height: DROP_H,
          bgcolor: LINE_COLOR,
        }}
      />

      {/* Right vertical drop — from bottom-center of topRight pill down to horizontal */}
      <Box
        data-pw="right-drop"
        sx={{
          position: 'absolute',
          top: PILL_H,
          right: 35,
          width: 2,
          height: DROP_H,
          bgcolor: LINE_COLOR,
        }}
      />

      {/* Horizontal bar connecting both drops */}
      <Box
        sx={{
          position: 'absolute',
          top: H_TOP,
          left: 35,
          width: 94,
          height: 2,
          bgcolor: LINE_COLOR,
        }}
      />

      {/* Center stem from horizontal down to result pill */}
      <Box
        sx={{
          position: 'absolute',
          top: H_TOP,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 2,
          height: 25,
          bgcolor: LINE_COLOR,
        }}
      />
    </Box>
  );
}

export type { StatusPillGroupProps };
export default StatusPillGroup;
