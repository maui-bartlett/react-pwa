import { describe, expect, it } from 'vitest';

import { applyRouteChrome, appChromeColorForRoute } from './appChrome';

function createChromeDocument() {
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
  } as unknown as NonNullable<Parameters<typeof applyRouteChrome>[2]>;

  return { meta, properties, root, targetDocument };
}

describe('app chrome', () => {
  it('chooses chrome colors from the current route', () => {
    expect(appChromeColorForRoute('/fab-u')).toBe('#315c4d');
    expect(appChromeColorForRoute('/avatar-legends', 'Technology')).toBe('#3c294c');
    expect(appChromeColorForRoute('/')).toBe('#182237');
  });

  it('keeps non-Avatar routes on their own chrome when Avatar training refreshes', () => {
    const { meta, properties, targetDocument } = createChromeDocument();

    const color = applyRouteChrome('/fab-u', 'Technology', targetDocument);

    expect(color).toBe('#315c4d');
    expect(properties.get('--app-chrome-color')).toBe('#315c4d');
    expect(meta.content).toBe('#315c4d');
  });
});
