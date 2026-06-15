import { useEffect, useState } from 'react';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, IconButton, Typography } from '@mui/material';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { api } from '../../../convex/_generated/api';

// How often a long-open client re-checks the service worker for a new build,
// as a fallback for when the real-time Convex signal is missed (e.g. the
// client was offline at the moment of the deploy).
const UPDATE_POLL_MS = 60_000;

// E2E kill-switch. The banner is a fixed top bar that overlays the header, so
// when a newer build is advertised (common in CI, where the test build trails
// the version real users have already published to Convex) it would intercept
// clicks on header controls. Tests seed this localStorage flag to suppress it.
const SUPPRESS_KEY = 'table-top-suppress-update-prompt';

function isSuppressed() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(SUPPRESS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Numeric-aware comparison of two `YYYY.MM.DD.N` build versions. Positive when
 * `a` is newer than `b`. Mirrors the server-side compare in convex/appVersion.
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const partsB = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);
  for (let index = 0; index < length; index += 1) {
    const valueA = partsA[index] ?? 0;
    const valueB = partsB[index] ?? 0;
    if (valueA !== valueB) return valueA - valueB;
  }
  return 0;
}

/**
 * Tap-to-update banner for the installed PWA.
 *
 * Two signals can reveal it:
 *  - **Convex (push):** every client publishes its build version on load and
 *    subscribes to the latest published version. When the server advertises a
 *    newer build than the one we're running, open clients learn within seconds
 *    of a deploy — no reopen required.
 *  - **Service worker (fallback):** the SW is registered in `prompt` mode and
 *    polled periodically; `needRefresh` flips true once a new SW is waiting.
 *
 * Either way the user stays in control: nothing reloads until they tap Update,
 * which skip-waits the new service worker and reloads onto the new bundle.
 */
function AppUpdatePrompt() {
  const { isAuthenticated } = useConvexAuth();
  const serverVersion = useQuery(api.appVersion.getCurrent);
  const publishVersion = useMutation(api.appVersion.publish);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | undefined>(
    undefined,
  );
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swScriptUrl, swRegistration) {
      setRegistration(swRegistration ?? undefined);
    },
  });

  // Periodically re-check the service worker for a new build, as a fallback
  // for clients that miss the real-time Convex signal (e.g. briefly offline).
  useEffect(() => {
    if (!registration) return;
    const intervalId = window.setInterval(() => {
      registration.update().catch(() => {});
    }, UPDATE_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [registration]);

  // Announce this client's build version so other open clients learn a newer
  // one exists. publish() requires auth and only advances the stored version
  // forward, so it waits until the Convex auth handshake completes.
  useEffect(() => {
    if (isAuthenticated) publishVersion({ version: __PWA_VERSION__ }).catch(() => {});
  }, [isAuthenticated, publishVersion]);

  const serverAhead =
    typeof serverVersion === 'string' && compareVersions(serverVersion, __PWA_VERSION__) > 0;

  // When the push signal says we're behind, eagerly fetch the new service
  // worker so it's already waiting (instant activation) when the user taps.
  useEffect(() => {
    if (serverAhead) registration?.update().catch(() => {});
  }, [serverAhead, registration]);

  // A newly advertised version re-opens the banner even if a prior one was
  // dismissed.
  useEffect(() => {
    setDismissed(false);
  }, [serverVersion]);

  if (isSuppressed() || (!serverAhead && !needRefresh) || dismissed) return null;

  async function applyUpdate() {
    try {
      const activeRegistration =
        registration ?? (await navigator.serviceWorker?.getRegistration()) ?? undefined;
      // Make sure the newest service worker has been fetched, then hand off to
      // vite-plugin-pwa's skip-waiting + controllerchange reload.
      await activeRegistration?.update().catch(() => {});
      await updateServiceWorker(true);
    } finally {
      // If there was no waiting worker (so no controllerchange reload fired),
      // reload anyway to load the freshly cached bundle. When the SW path did
      // reload, the page is already gone and this never runs.
      window.location.reload();
    }
  }

  return (
    <Box
      data-pw="app-update-prompt"
      role="status"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1700,
        minHeight: 'calc(42px + env(safe-area-inset-top))',
        pt: 'env(safe-area-inset-top)',
        px: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        bgcolor: '#17283a',
        color: '#f5c85b',
        borderBottom: '1px solid rgba(245, 200, 91, 0.4)',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.25)',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: 800,
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        Update available
      </Typography>

      <Button
        data-pw="app-update-prompt-apply"
        onClick={applyUpdate}
        startIcon={<RefreshRoundedIcon fontSize="small" />}
        size="small"
        sx={{
          bgcolor: '#f5c85b',
          color: '#17283a',
          textTransform: 'none',
          fontWeight: 800,
          px: 1.4,
          py: 0.3,
          '&:hover': { bgcolor: '#f0bd3f' },
        }}
      >
        Update
      </Button>

      <IconButton
        aria-label="Dismiss update banner"
        data-pw="app-update-prompt-close"
        onClick={() => setDismissed(true)}
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

export default AppUpdatePrompt;
