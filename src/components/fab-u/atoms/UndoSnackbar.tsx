import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';

import { Undo2 } from 'lucide-react';

type UndoSnackbarColors = {
  bg: string;
  fg: string;
  border: string;
  shadow: string;
  /** Hover/active background. Defaults to `bg`. */
  bgStrong?: string;
};

type UndoSnackbarProps = {
  open: boolean;
  onUndo: () => void;
  /** Theme colors, supplied by each app (FabU / Avatar Legends). */
  colors: UndoSnackbarColors;
};

/**
 * Circular floating Undo button. Sits in the gap directly beneath the dice
 * FAB (horizontally centered under it, vertically between the dice button and
 * the app footer). Visible whenever an undo is available; click → `onUndo`.
 */
function UndoSnackbar({ open, onUndo, colors }: UndoSnackbarProps) {
  const bgStrong = colors.bgStrong ?? colors.bg;
  return (
    <Fade in={open} timeout={200} unmountOnExit>
      <IconButton
        data-pw="undo-snackbar"
        onClick={onUndo}
        aria-label="Undo last action"
        sx={{
          position: 'fixed',
          // Centered horizontally under the dice FAB (right: {xs:15, sm:34},
          // width 72), in the gap between the dice button and the footer.
          right: { xs: 27, sm: 46 },
          bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 72px)', sm: 90 },
          width: 44,
          height: 44,
          bgcolor: colors.bg,
          color: colors.fg,
          boxShadow: colors.shadow,
          // zIndex above MUI Dialog/Popover (1300), below tooltip (1500).
          zIndex: 1400,
          border: `1px solid ${colors.border}`,
          transition: 'transform 150ms ease, background-color 150ms ease',
          '&:hover': {
            bgcolor: bgStrong,
            transform: 'scale(1.04)',
          },
          '&:active': {
            transform: 'scale(0.96)',
          },
        }}
      >
        <Undo2 size={21} strokeWidth={2.25} />
      </IconButton>
    </Fade>
  );
}

export default UndoSnackbar;
