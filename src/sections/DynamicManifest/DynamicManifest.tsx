import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

/**
 * Mirrors the static `manifest.json` at the project root. Kept inline so
 * the runtime override can read from it without a JSON import (the
 * project's tsconfig.app only includes `src/`). Keep these fields in
 * sync with the on-disk `manifest.json` — every field except
 * `background_color` is copied verbatim; `background_color` is set
 * dynamically per route below.
 */
const manifestBase = {
  name: 'React PWA',
  short_name: 'reactpwa',
  description: 'Starter kit for modern web applications',
  theme_color: '#111a24',
  background_color: '#111a24',
  display: 'standalone',
  orientation: 'portrait',
  pwa_version: '2026.05.29.06',
  icons: [
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    {
      src: 'pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
  ],
};

type AvatarTraining =
  | 'Waterbending'
  | 'Earthbending'
  | 'Firebending'
  | 'Airbending'
  | 'Weapons'
  | 'Technology';

const avatarTrainingChrome: Record<AvatarTraining, string> = {
  Waterbending: '#173755',
  Earthbending: '#24351f',
  Firebending: '#4a1f1b',
  Airbending: '#544821',
  Weapons: '#0b1018',
  Technology: '#3c294c',
};

function getStoredAvatarTraining(): AvatarTraining {
  try {
    const raw = window.localStorage.getItem('avatar-legends-character');
    if (!raw) return 'Waterbending';
    const parsed = JSON.parse(raw) as { primaryTraining?: unknown };
    const candidate = parsed.primaryTraining;
    return typeof candidate === 'string' && candidate in avatarTrainingChrome
      ? (candidate as AvatarTraining)
      : 'Waterbending';
  } catch {
    return 'Waterbending';
  }
}

/**
 * Map a pathname to the background color the PWA manifest should
 * advertise while the user is on that route. The home route (`/`) sits
 * on the Avatar Legends page, so it gets the AL header chrome too.
 */
function backgroundColorForRoute(
  pathname: string,
  avatarTraining = getStoredAvatarTraining(),
): string {
  if (pathname === '/fab-u' || pathname.startsWith('/fab-u/')) {
    // FabU page header / brand green.
    return '#315c4d';
  }
  if (
    pathname === '/' ||
    pathname === '/avatar-legends' ||
    pathname.startsWith('/avatar-legends/')
  ) {
    return avatarTrainingChrome[avatarTraining];
  }
  return manifestBase.background_color;
}

/**
 * Runtime PWA manifest override. Serializes the manifest object to a
 * Blob URL on every route change and points the `<link rel="manifest">`
 * tag at it. Lets the installable PWA's `background_color` track the
 * active route's header chrome instead of a single static value.
 *
 * Mounted inside the router so `useLocation` resolves correctly.
 * Renders nothing — purely side-effectful.
 */
function DynamicManifest() {
  const { pathname } = useLocation();
  const previousUrlRef = useRef<string | null>(null);
  const [avatarTraining, setAvatarTraining] = useState<AvatarTraining>(() =>
    getStoredAvatarTraining(),
  );

  useEffect(() => {
    const background = backgroundColorForRoute(pathname, avatarTraining);
    const next = { ...manifestBase, background_color: background, theme_color: background };
    const blob = new Blob([JSON.stringify(next)], {
      type: 'application/manifest+json',
    });
    const url = URL.createObjectURL(blob);

    // VitePWA's build pipeline injects a `<link rel="manifest">` tag at
    // build time; in dev mode (sw disabled) there's no such tag. Find
    // or create the link, then point it at the freshly generated URL.
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);

    // Also track the body background and the <meta name="theme-color">
    // tag in lockstep — the manifest `background_color` is mostly used
    // by the installed-PWA splash screen (and even there iOS often
    // caches it at install time). The body bg + theme-color update
    // immediately and cover the visible chrome surfaces (safe-area
    // tint, mobile address-bar tint, the strip outside the app card).
    document.body.style.background = background;
    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', background);

    // Revoke the previous URL after the new one is wired up so the
    // manifest link never points at a freed object.
    const previousUrl = previousUrlRef.current;
    previousUrlRef.current = url;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
  }, [pathname, avatarTraining]);

  useEffect(() => {
    const refresh = (event?: Event) => {
      const candidate = (event as CustomEvent<unknown> | undefined)?.detail;
      setAvatarTraining(
        typeof candidate === 'string' && candidate in avatarTrainingChrome
          ? (candidate as AvatarTraining)
          : getStoredAvatarTraining(),
      );
    };
    window.addEventListener('avatar-legends-primary-training-change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('avatar-legends-primary-training-change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Revoke the final blob URL on unmount.
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
        previousUrlRef.current = null;
      }
    };
  }, []);

  return null;
}

export default DynamicManifest;
