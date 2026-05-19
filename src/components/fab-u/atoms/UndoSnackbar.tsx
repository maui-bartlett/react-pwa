import { useEffect } from 'react';

import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';

import { Undo2 } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';

type UndoSnackbarProps = {
  open: boolean;
  onUndo: () => void;
  onClose: () => void;
  /** Auto-dismiss after this many milliseconds. Defaults to 5000. */
  timeoutMs?: number;
};

/**
 * Circular floating Undo button that appears in the bottom-right corner of
 * the app for `timeoutMs` (default 5s) after a destructive action completes.
 * Click → triggers `onUndo`. Times out → triggers `onClose`.
 */
function UndoSnackbar({ open, onUndo, onClose, timeoutMs = 5000 }: UndoSnackbarProps) {
  const fabUTokens = useFabUTokens();

  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(onClose, timeoutMs);
    return () => window.clearTimeout(t);
  }, [open, onClose, timeoutMs]);

  return (
    <Fade in={open} timeout={200} unmountOnExit>
      <IconButton
        data-pw="undo-snackbar"
        onClick={onUndo}
        aria-label="Undo last action"
        sx={{
          position: 'fixed',
          right: 20,
          bottom: 24,
          width: 56,
          height: 56,
          bgcolor: fabUTokens.color.brand,
          color: fabUTokens.color.brandFg,
          boxShadow: fabUTokens.shadow.card,
          // zIndex above MUI Dialog (1300) and Popover (1300), below tooltip (1500)
          zIndex: 1400,
          border: `1px solid ${fabUTokens.color.brandStrong}`,
          transition: 'transform 150ms ease, background-color 150ms ease',
          '&:hover': {
            bgcolor: fabUTokens.color.brandStrong,
            transform: 'scale(1.04)',
          },
          '&:active': {
            transform: 'scale(0.96)',
          },
        }}
      >
        <Undo2 size={24} strokeWidth={2.25} />
      </IconButton>
    </Fade>
  );
}

export default UndoSnackbar;
