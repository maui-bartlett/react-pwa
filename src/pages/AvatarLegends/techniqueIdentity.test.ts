import { describe, expect, it } from 'vitest';

import {
  dedupeTechniques,
  getTechniqueIdentityKey,
  getTechniquePersistenceKey,
} from './techniqueIdentity';

describe('Avatar Legends technique identity', () => {
  it('treats casing and surrounding whitespace as the same technique', () => {
    expect(getTechniqueIdentityKey({ name: '  Refresh  ' })).toBe('refresh');
    expect(
      getTechniquePersistenceKey({
        type: ' Waterbending ',
        approach: 'Evade & Observe',
        name: '  Refresh  ',
      }),
    ).toBe('waterbending:evade & observe:refresh');
  });

  it('keeps one technique per identity and preserves the latest data', () => {
    const techniques = dedupeTechniques([
      {
        type: 'waterbending',
        approach: 'Evade & Observe',
        name: 'Refresh',
        level: 'learned',
      },
      {
        type: 'firebending',
        approach: 'Advance & Attack',
        name: 'Blazing Arc',
        level: 'learned',
      },
      {
        type: 'firebending',
        approach: 'Advance & Attack',
        name: 'Refresh',
        level: 'mastered',
      },
    ]);

    expect(techniques).toHaveLength(2);
    expect(techniques[0]).toMatchObject({ name: 'Refresh', level: 'mastered' });
    expect(techniques[1]).toMatchObject({ name: 'Blazing Arc' });
  });
});
