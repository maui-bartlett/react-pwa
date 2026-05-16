import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';
import { STATUS_PILL_BORDER_RADIUS } from './statusEffectsTokens';

type StatusPillNode = {
  id: string;
  label: string;
  color: string;
  selectedFill?: string;
  result?: boolean;
  selected?: boolean;
  viewTransitionName?: string;
};

type StatusPillGroupProps = {
  topLeft: StatusPillNode;
  topRight: StatusPillNode;
  result: StatusPillNode;
  onToggle: (id: string) => void;
};

// Rendered pill height with minHeight:41 border-box (border 1×2 + py 6.4×2 + caption).
// Using 41 keeps the drop flush with the pill's bottom edge.
const PILL_H = 41;
// Visible stem height below each upper pill before reaching the horizontal bar
const DROP_H = 10;
const H_TOP = PILL_H + DROP_H; // y of horizontal bar = 51
// Container height 104 = H_TOP(51) + STEM_H(12) + PILL_H(41).
// Lower pill top = 104 - PILL_H = 63. Stem: H_TOP(51) → 63 = 12px.
const STEM_H = 12;
// Darken a hex color by blending it toward black at the given alpha (0–1).
function blendWithBlack(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const scale = 1 - alpha;
  return `rgb(${Math.round(r * scale)}, ${Math.round(g * scale)}, ${Math.round(b * scale)})`;
}

function StatusPill({
  id,
  label,
  color,
  selectedFill,
  result = false,
  selected = false,
  viewTransitionName,
  onToggle,
}: StatusPillNode & { onToggle: (id: string) => void }) {
  const fabUTokens = useFabUTokens();
  return (
    <Box
      data-pw={`status-pill-${id}`}
      onClick={result ? undefined : () => onToggle(id)}
      sx={{
        minWidth: result ? 96 : 72,
        border: `1px solid ${color}`,
        borderRadius: STATUS_PILL_BORDER_RADIUS,
        bgcolor: selected
          ? (selectedFill ?? blendWithBlack(color, 0.25))
          : fabUTokens.color.surface,
        px: 1.25,
        py: 0.8,
        minHeight: 41,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(31, 42, 38, 0.04)',
        cursor: result ? 'default' : 'pointer',
        userSelect: 'none',
        transition: 'background-color 150ms ease, border-radius 180ms ease, transform 180ms ease',
        willChange: 'border-radius, transform',
        viewTransitionName,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: selected
            ? '#ffffff'
            : result
              ? fabUTokens.color.textSecondary
              : fabUTokens.color.textPrimary,
          fontWeight: 500,
          fontSize: '0.77rem',
          lineHeight: 1,
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
  const fabUTokens = useFabUTokens();
  const lineColor = fabUTokens.color.border;
  return (
    <Box sx={{ position: 'relative', width: 150, height: 104, flexShrink: 0 }}>
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
          left: 32,
          width: 2,
          height: DROP_H,
          bgcolor: lineColor,
        }}
      />

      {/* Right vertical drop — from bottom-center of topRight pill down to horizontal */}
      <Box
        data-pw="right-drop"
        sx={{
          position: 'absolute',
          top: PILL_H,
          right: 32,
          width: 2,
          height: DROP_H,
          bgcolor: lineColor,
        }}
      />

      {/* Horizontal bar connecting both drops */}
      <Box
        sx={{
          position: 'absolute',
          top: H_TOP,
          left: 32,
          width: 86,
          height: 2,
          bgcolor: lineColor,
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
          bgcolor: lineColor,
        }}
      />
    </Box>
  );
}

export type { StatusPillGroupProps };
export default StatusPillGroup;
