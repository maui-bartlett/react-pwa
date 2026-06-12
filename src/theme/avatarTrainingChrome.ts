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

type AvatarChromeDocument = {
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

function toAvatarTraining(candidate: unknown): AvatarTraining {
  return typeof candidate === 'string' && candidate in avatarTrainingChrome
    ? (candidate as AvatarTraining)
    : 'Waterbending';
}

function getAvatarTrainingChrome(candidate: unknown) {
  return avatarTrainingChrome[toAvatarTraining(candidate)];
}

function applyAvatarTrainingChrome(
  candidate: unknown,
  targetDocument: AvatarChromeDocument | undefined = globalThis.document,
) {
  const color = getAvatarTrainingChrome(candidate);
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

export {
  applyAvatarTrainingChrome,
  avatarTrainingChrome,
  getAvatarTrainingChrome,
  toAvatarTraining,
};
export type { AvatarTraining };
