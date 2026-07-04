import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import { appChromeColorForRoute } from '@/theme/appChrome';

type AppBannerPalette = {
  background: string;
  border: string;
  buttonBackground: string;
  buttonHoverBackground: string;
  buttonText: string;
  shadow: string;
  text: string;
};

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => character + character)
          .join('')
      : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  if ([red, green, blue].some(Number.isNaN)) return `rgba(255, 255, 255, ${alpha})`;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function currentChromeColor(pathname: string) {
  if (typeof window === 'undefined') return appChromeColorForRoute(pathname);
  const chromeColor = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--app-chrome-color')
    .trim();
  return chromeColor || appChromeColorForRoute(pathname);
}

function appBannerPaletteForRoute(
  pathname: string,
  chromeColor = appChromeColorForRoute(pathname),
) {
  if (pathname === '/dungeons-and-dragons' || pathname.startsWith('/dungeons-and-dragons/')) {
    return {
      background: '#11191e',
      border: 'rgba(228, 7, 18, 0.6)',
      buttonBackground: '#e40712',
      buttonHoverBackground: '#b7070f',
      buttonText: '#ffffff',
      shadow: '0 3px 14px rgba(0, 0, 0, 0.36)',
      text: '#f2f5f6',
    };
  }

  if (pathname === '/fab-u' || pathname.startsWith('/fab-u/')) {
    return {
      background: '#315c4d',
      border: 'rgba(231, 207, 136, 0.45)',
      buttonBackground: '#e7cf88',
      buttonHoverBackground: '#dac179',
      buttonText: '#173327',
      shadow: '0 3px 12px rgba(16, 43, 34, 0.28)',
      text: '#fffaf0',
    };
  }

  if (pathname === '/avatar-legends' || pathname.startsWith('/avatar-legends/')) {
    return {
      background: chromeColor,
      border: withAlpha('#ffffff', 0.28),
      buttonBackground: '#f6fbff',
      buttonHoverBackground: '#e7f0f7',
      buttonText: chromeColor,
      shadow: `0 3px 12px ${withAlpha('#000000', 0.28)}`,
      text: '#ffffff',
    };
  }

  return {
    background: '#182237',
    border: 'rgba(245, 200, 91, 0.4)',
    buttonBackground: '#f5c85b',
    buttonHoverBackground: '#f0bd3f',
    buttonText: '#17283a',
    shadow: '0 3px 12px rgba(0, 0, 0, 0.26)',
    text: '#ffffff',
  };
}

function useAppBannerPalette() {
  const { pathname } = useLocation();
  const [chromeColor, setChromeColor] = useState(() => currentChromeColor(pathname));

  useEffect(() => {
    const updateChromeColor = () => setChromeColor(currentChromeColor(pathname));
    updateChromeColor();

    if (typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(updateChromeColor);
    observer.observe(document.documentElement, {
      attributeFilter: ['style'],
      attributes: true,
    });
    return () => observer.disconnect();
  }, [pathname]);

  return appBannerPaletteForRoute(pathname, chromeColor);
}

export { appBannerPaletteForRoute, useAppBannerPalette };
export type { AppBannerPalette };
