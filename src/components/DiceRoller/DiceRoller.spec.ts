import { describe, expect, it } from 'vitest';

import { createRandomRollResult, isValidRollResult, toRollResult } from './diceRollResults';

describe('DiceRoller results', () => {
  it('accepts valid flat DiceBox results', () => {
    const result = toRollResult([
      { dieType: 'd6', sides: 6, value: 4 },
      { dieType: 'd20', sides: 20, value: 17 },
    ]);

    expect(result.rolls).toEqual([
      { sides: 6, value: 4 },
      { sides: 20, value: 17 },
    ]);
    expect(result.total).toBe(21);
    expect(
      isValidRollResult(result, [
        { id: 1, sides: 6 },
        { id: 2, sides: 20 },
      ]),
    ).toBe(true);
  });

  it('rejects impossible zero-value results from collider misses', () => {
    const result = toRollResult([{ dieType: 'd20', sides: 20, value: 0 }]);

    expect(isValidRollResult(result, [{ id: 1, sides: 20 }])).toBe(false);
  });

  it('rejects incomplete or mismatched result sets', () => {
    const result = toRollResult([{ dieType: 'd6', sides: 6, value: 5 }]);

    expect(
      isValidRollResult(result, [
        { id: 1, sides: 6 },
        { id: 2, sides: 6 },
      ]),
    ).toBe(false);
    expect(isValidRollResult(result, [{ id: 1, sides: 8 }])).toBe(false);
  });

  it('assigns unique IDs to results created in rapid succession', () => {
    const first = toRollResult([{ dieType: 'd6', sides: 6, value: 2 }]);
    const second = toRollResult([{ dieType: 'd6', sides: 6, value: 3 }]);

    expect(second.id).not.toBe(first.id);
  });

  it('creates a complete valid fallback result without rerolling physics', () => {
    const dice = [
      { id: 1, sides: 6 as const },
      { id: 2, sides: 20 as const },
    ];
    const values = [0, 0.999];
    const result = createRandomRollResult(dice, () => values.shift() ?? 0);

    expect(result.rolls).toEqual([
      { sides: 6, value: 1 },
      { sides: 20, value: 20 },
    ]);
    expect(result.total).toBe(21);
    expect(isValidRollResult(result, dice)).toBe(true);
  });
});
