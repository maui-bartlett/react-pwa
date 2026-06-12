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
  body: { style: { background: string } };
  documentElement: { style: { backgroundColor: string } };
  head: { appendChild: (element: HTMLMetaElement) => unknown };
  createElement: (tagName: 'meta') => HTMLMetaElement;
  querySelector: (selector: string) => HTMLMetaElement | null;
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

  targetDocument.documentElement.style.backgroundColor = color;
  targetDocument.body.style.background = color;

  let themeMeta = targetDocument.querySelector('meta[name="theme-color"]');
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
