import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fabUTokens } from '../tokens';

type StatusPillNode = {
  id: string;
  label: string;
  color: string;
  result?: boolean;
  selected?: boolean;
};

type StatusPillGroupProps = {
  topLeft: StatusPillNode;
  topRight: StatusPillNode;
  result: StatusPillNode;
  onToggle: (id: string) => void;
};

const LINE_COLOR = '#d7ddd6';
// Measured rendered pill height: 35.906px (border 1×2 + py 4.96×2 + caption lineHeight).
// Using 36 gives a ~0.09px gap (sub-pixel, imperceptible) — drop flush with pill border.
const PILL_H = 36;
// Visible stem height below each upper pill before reaching the horizontal bar
const DROP_H = 10;
const H_TOP = PILL_H + DROP_H; // y of horizontal bar = 46
// Container height 94, lower pill top = 94 - PILL_H = 58. Stem: H_TOP(46) → 58 = 12px.
const STEM_H = 12;

// Blend a hex color with white at the given alpha (0–1) to produce a solid fill color.
function blendWithWhite(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * alpha + 255 * (1 - alpha))}, ${Math.round(g * alpha + 255 * (1 - alpha))}, ${Math.round(b * alpha + 255 * (1 - alpha))})`;
}

function StatusPill({
  id,
  label,
  color,
  result = false,
  selected = false,
  onToggle,
}: StatusPillNode & { onToggle: (id: string) => void }) {
  return (
    <Box
      data-pw={`status-pill-${id}`}
      onClick={() => onToggle(id)}
      sx={{
        minWidth: result ? 84 : 72,
        border: `1px solid ${color}`,
        borderRadius: '8px',
        bgcolor: selected ? blendWithWhite(color, 0.2) : fabUTokens.color.surface,
        px: 1.05,
        py: 0.62,
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(31, 42, 38, 0.04)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 150ms ease',
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

function StatusPillGroup({ topLeft, topRight, result, onToggle }: StatusPillGroupProps) {
  return (
    <Box sx={{ position: 'relative', width: 164, height: 94, flexShrink: 0 }}>
      {/* Upper pills */}
      <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
        <StatusPill {...topLeft} onToggle={onToggle} />
      </Box>
      <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
        <StatusPill {...topRight} onToggle={onToggle} />
      </Box>

      {/* Result pill */}
      <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
        <StatusPill {...result} result onToggle={onToggle} />
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
          height: STEM_H,
          bgcolor: LINE_COLOR,
        }}
      />
    </Box>
  );
}

export type { StatusPillGroupProps };
export default StatusPillGroup;
