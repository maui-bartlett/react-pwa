import { describe, expect, it } from 'vitest';

import { canSpendGears, getAvatarGears, normalizeGears } from './gears';

describe('Technology Gears', () => {
  it('initializes Tom once without refilling saved or depleted Gears', () => {
    const tom = { name: 'Tom Dorito', primaryTraining: 'Technology' };
    expect(getAvatarGears(tom)).toBe(3);
    expect(getAvatarGears({ ...tom, gears: 0 })).toBe(0);
    expect(getAvatarGears({ ...tom, gears: 1 })).toBe(1);
    expect(getAvatarGears({ ...tom, name: 'Another Hero' })).toBe(0);
    expect(getAvatarGears({ ...tom, primaryTraining: 'Weapons' })).toBe(0);
  });

  it.each([undefined, null, NaN, Infinity, -1, -100])(
    'normalizes invalid count %s to zero',
    (value) => {
      expect(normalizeGears(value)).toBe(0);
    },
  );

  it('keeps counts as whole nonnegative numbers without imposing a game limit', () => {
    expect(normalizeGears(4.9)).toBe(4);
    expect(normalizeGears(30)).toBe(30);
  });

  it('allows Gears only for Technology characters using Technology or Basic techniques', () => {
    expect(canSpendGears('Technology', 'technology')).toBe(true);
    expect(canSpendGears('Technology', 'basic')).toBe(true);
    expect(canSpendGears('Technology', 'firebending')).toBe(false);
    expect(canSpendGears('Waterbending', 'basic')).toBe(false);
  });
});
