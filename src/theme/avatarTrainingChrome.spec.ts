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
    const targetDocument = {
      body: { style: { background: '' } },
      documentElement: { style: { backgroundColor: '' } },
      head: { appendChild: () => undefined },
      createElement: () => meta,
      querySelector: () => null,
    };

    const color = applyAvatarTrainingChrome('Technology', targetDocument);

    expect(color).toBe('#3c294c');
    expect(targetDocument.documentElement.style.backgroundColor).toBe('#3c294c');
    expect(targetDocument.body.style.background).toBe('#3c294c');
    expect(meta.name).toBe('theme-color');
    expect(meta.content).toBe('#3c294c');
  });
});
