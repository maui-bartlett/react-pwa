import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import { readIndexedDbCharacter } from '../../state/indexedDbCharacterStorage';
import { appChromeColorForRoute, applyRouteChrome } from '../../theme/appChrome';
import { type AvatarTraining, toAvatarTraining } from '../../theme/avatarTrainingChrome';

/**
 * Mirrors the static `manifest.json` at the project root. Kept inline so
 * the runtime override can read from it without a JSON import (the
 * project's tsconfig.app only includes `src/`). Keep these fields in
 * sync with the on-disk `manifest.json` — most fields are copied
 * verbatim; route-specific colors and icons are set dynamically below.
 */
const manifestBase = {
  name: 'Table Top',
  short_name: 'Table Top',
  description: 'Character tools for tabletop roleplaying games.',
  id: '/',
  start_url: '/',
  scope: '/',
  theme_color: '#182237',
  background_color: '#182237',
  display: 'standalone',
  orientation: 'portrait',
  pwa_version: __PWA_VERSION__,
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

async function getStoredAvatarTraining(): Promise<AvatarTraining> {
  const stored = await readIndexedDbCharacter<{ primaryTraining?: unknown }>(
    'avatar-legends-character',
    { primaryTraining: 'Waterbending' },
  );
  return toAvatarTraining(stored.primaryTraining);
}

function absoluteManifestUrl(src: string) {
  return new URL(src, window.location.origin).toString();
}

function siteIcons() {
  return manifestBase.icons.map((icon) => ({
    ...icon,
    src: absoluteManifestUrl(icon.src),
  }));
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
  const [avatarTraining, setAvatarTraining] = useState<AvatarTraining>('Waterbending');

  useLayoutEffect(() => {
    applyRouteChrome(pathname, avatarTraining);
  }, [pathname, avatarTraining]);

  useEffect(() => {
    const background = appChromeColorForRoute(pathname, avatarTraining);
    const next = {
      ...manifestBase,
      background_color: background,
      theme_color: background,
      icons: siteIcons(),
    };
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

    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('href', '/favicon.svg');
    favicon.setAttribute('type', 'image/svg+xml');

    let appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.setAttribute('href', '/apple-touch-icon.png');

    // Revoke the previous URL after the new one is wired up so the
    // manifest link never points at a freed object.
    const previousUrl = previousUrlRef.current;
    previousUrlRef.current = url;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
  }, [pathname, avatarTraining]);

  useEffect(() => {
    const refresh = (event?: Event) => {
      const candidate = (event as CustomEvent<unknown> | undefined)?.detail;
      if (typeof candidate === 'string') {
        setAvatarTraining(toAvatarTraining(candidate));
        return;
      }
      void getStoredAvatarTraining().then((training) => {
        setAvatarTraining(training);
      });
    };
    void getStoredAvatarTraining().then((training) => {
      setAvatarTraining(training);
    });
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
