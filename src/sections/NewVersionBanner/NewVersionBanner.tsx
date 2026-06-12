import { useEffect, useState } from 'react';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, IconButton, Typography } from '@mui/material';

const STORAGE_KEY = 'table-top-last-seen-version';

function shouldShowVersionBanner() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== __PWA_VERSION__;
  } catch {
    return true;
  }
}

function NewVersionBanner() {
  const [open, setOpen] = useState(() => shouldShowVersionBanner());

  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, __PWA_VERSION__);
    } catch {
      // Storage can be unavailable in private browsing; the banner still works.
    }
  }, [open]);

  if (!open) return null;

  return (
    <Box
      data-pw="new-version-banner"
      role="status"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1600,
        minHeight: 'calc(42px + env(safe-area-inset-top))',
        pt: 'env(safe-area-inset-top)',
        px: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5c85b',
        color: '#17283a',
        borderBottom: '1px solid rgba(23, 40, 58, 0.3)',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Typography
        sx={{
          px: 5,
          fontSize: '0.9rem',
          fontWeight: 800,
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        New Version! 🎉 {__PWA_VERSION__}
      </Typography>

      <IconButton
        aria-label="Close new version banner"
        data-pw="new-version-banner-close"
        onClick={() => setOpen(false)}
        size="small"
        sx={{
          position: 'absolute',
          right: 8,
          top: 'calc(env(safe-area-inset-top) + 5px)',
          width: 32,
          height: 32,
          color: 'inherit',
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default NewVersionBanner;
