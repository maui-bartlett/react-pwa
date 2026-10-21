import { describe, expect, it } from 'vitest';

import { getClassMoveKey, normalizeClassMoveSelections } from './classMoveSelection';

describe('Class Move selections', () => {
  it('opens legacy characters without choosing moves for them', () => {
    expect(normalizeClassMoveSelections(undefined)).toEqual({});
    expect(normalizeClassMoveSelections(null)).toEqual({});
    expect(normalizeClassMoveSelections([])).toEqual({});
  });

  it('keeps each playbook separate and caps unique valid selections at two', () => {
    expect(
      normalizeClassMoveSelections({
        'The Successor': ['one', 'one', 42, 'two', 'three'],
        'The Bold': ['four'],
        invalid: true,
      }),
    ).toEqual({ 'The Successor': ['one', 'two'], 'The Bold': ['four'] });
  });

  it('keeps custom move selections stable when their titles change', () => {
    expect(getClassMoveKey({ id: 'custom-1', title: 'Renamed Move' })).toBe('custom-1');
    expect(getClassMoveKey({ title: '  Canon Move  ' })).toBe('canon move');
  });
});
