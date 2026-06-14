import {
  type AvatarTraining,
  avatarTrainingChrome,
  toAvatarTraining,
} from './avatarTrainingChrome';

type AppChromeDocument = {
  body: { style: { background: string; backgroundColor: string } };
  documentElement: {
    style: {
      background: string;
      backgroundColor: string;
      setProperty: (name: string, value: string) => unknown;
    };
  };
  head: { appendChild: (element: HTMLMetaElement) => unknown };
  createElement: (tagName: 'meta') => HTMLMetaElement;
  querySelector: (selector: string) => HTMLElement | HTMLMetaElement | null;
};

function appChromeColorForRoute(
  pathname: string,
  avatarTraining: AvatarTraining = 'Waterbending',
): string {
  if (pathname === '/fab-u' || pathname.startsWith('/fab-u/')) {
    return '#315c4d';
  }
  if (pathname === '/avatar-legends' || pathname.startsWith('/avatar-legends/')) {
    return avatarTrainingChrome[avatarTraining];
  }
  return '#182237';
}

function applyAppChromeColor(
  color: string,
  targetDocument: AppChromeDocument | undefined = globalThis.document,
) {
  if (!targetDocument) return color;

  targetDocument.documentElement.style.setProperty('--app-chrome-color', color);
  targetDocument.documentElement.style.background = color;
  targetDocument.documentElement.style.backgroundColor = color;
  targetDocument.body.style.background = color;
  targetDocument.body.style.backgroundColor = color;
  const root = targetDocument.querySelector('#root') as HTMLElement | null;
  if (root) {
    root.style.background = color;
    root.style.backgroundColor = color;
  }

  let themeMeta = targetDocument.querySelector(
    'meta[name="theme-color"]',
  ) as HTMLMetaElement | null;
  if (!themeMeta) {
    themeMeta = targetDocument.createElement('meta');
    themeMeta.name = 'theme-color';
    targetDocument.head.appendChild(themeMeta);
  }
  themeMeta.setAttribute('content', color);

  return color;
}

function applyRouteChrome(
  pathname: string,
  avatarTraining: unknown = 'Waterbending',
  targetDocument: AppChromeDocument | undefined = globalThis.document,
) {
  return applyAppChromeColor(
    appChromeColorForRoute(pathname, toAvatarTraining(avatarTraining)),
    targetDocument,
  );
}

export { applyAppChromeColor, applyRouteChrome, appChromeColorForRoute };
export type { AppChromeDocument };
