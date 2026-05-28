import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';

type ConfirmDeleteModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Centered modal asking "Are you sure you want to delete?" with Cancel + Delete buttons.
 * Floats above all other UI via the MUI Dialog backdrop.
 */
function ConfirmDeleteModal({ open, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const fabUTokens = useFabUTokens();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      data-pw="confirm-delete-modal"
      PaperProps={{
        sx: {
          bgcolor: fabUTokens.color.surface,
          backgroundImage: 'none',
          border: `1px solid ${fabUTokens.isDark ? '#ffffff' : '#000000'}`,
          borderRadius: '14px',
          boxShadow: fabUTokens.shadow.soft,
          p: 2.25,
          m: 2,
        },
      }}
      // Tint the backdrop with the active palette's brand color so the
      // top-of-viewport color stays steady on iOS standalone PWA (the
      // status bar reads the top pixel and shifts in two steps if the
      // backdrop fades in from black).
      slotProps={{
        backdrop: {
          sx: { backgroundColor: fabUTokens.color.brand, opacity: 0.92 },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
        <Typography
          variant="h6"
          sx={{
            color: fabUTokens.color.textPrimary,
            fontWeight: 700,
            fontSize: '1.05rem',
            lineHeight: 1.25,
            textAlign: 'center',
          }}
        >
          Are you sure you want to delete?
        </Typography>
        <Stack direction="row" spacing={1.25} sx={{ width: '100%' }}>
          <Button
            data-pw="confirm-delete-cancel"
            onClick={onCancel}
            fullWidth
            variant="outlined"
            sx={{
              borderColor: fabUTokens.color.border,
              color: fabUTokens.color.textPrimary,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              py: 0.85,
              '&:hover': {
                borderColor: fabUTokens.color.textSecondary,
                bgcolor: 'transparent',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            data-pw="confirm-delete-confirm"
            onClick={onConfirm}
            fullWidth
            variant="contained"
            sx={{
              bgcolor: fabUTokens.color.danger,
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              py: 0.85,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: fabUTokens.color.danger,
                boxShadow: 'none',
                filter: 'brightness(0.92)',
              },
            }}
          >
            Delete
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}

export default ConfirmDeleteModal;
