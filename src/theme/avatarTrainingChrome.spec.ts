import { describe, expect, it } from 'vitest';

import {
  applyAvatarTrainingChrome,
  getAvatarTrainingChrome,
  toAvatarTraining,
} from './avatarTrainingChrome';

describe('avatar training chrome', () => {
  it('normalizes training values and returns their chrome color', () => {
    expect(toAvatarTraining('Firebending')).toBe('Firebending');
    expect(getAvatarTrainingChrome('Firebending')).toBe('#4a1f1b');
    expect(toAvatarTraining('not-a-training')).toBe('Waterbending');
  });

  it('updates every mobile status-bar color surface synchronously', () => {
    const meta = {
      name: '',
      content: '',
      setAttribute(name: string, value: string) {
        if (name === 'content') this.content = value;
      },
    } as HTMLMetaElement;
    const root = { style: { background: '', backgroundColor: '' } };
    const properties = new Map<string, string>();
    const targetDocument = {
      body: { style: { background: '', backgroundColor: '' } },
      documentElement: {
        style: {
          background: '',
          backgroundColor: '',
          setProperty: (name: string, value: string) => properties.set(name, value),
        },
      },
      head: { appendChild: () => undefined },
      createElement: () => meta,
      querySelector: (selector: string) => (selector === '#root' ? root : null),
    } as unknown as NonNullable<Parameters<typeof applyAvatarTrainingChrome>[1]>;

    const color = applyAvatarTrainingChrome('Technology', targetDocument);

    expect(color).toBe('#3c294c');
    expect(properties.get('--app-chrome-color')).toBe('#3c294c');
    expect(targetDocument.documentElement.style.background).toBe('#3c294c');
    expect(targetDocument.documentElement.style.backgroundColor).toBe('#3c294c');
    expect(targetDocument.body.style.background).toBe('#3c294c');
    expect(targetDocument.body.style.backgroundColor).toBe('#3c294c');
    expect(root.style.background).toBe('#3c294c');
    expect(root.style.backgroundColor).toBe('#3c294c');
    expect(meta.name).toBe('theme-color');
    expect(meta.content).toBe('#3c294c');
  });
});
