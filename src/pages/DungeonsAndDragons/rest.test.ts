import { describe, expect, it } from 'vitest';

import { initialDndCharacter } from './atoms';
import { applyDndRest, spendDndHitDie } from './rest';

describe('Dungeons & Dragons rest recovery', () => {
  it('fully restores hit points and spell slots on long rest', () => {
    const character = {
      ...initialDndCharacter,
      hitPoints: {
        ...initialDndCharacter.hitPoints,
        current: 12,
        temp: 5,
        deathSaves: { successes: 2, failures: 1 },
        hitDicePools: [
          { die: 'd8', max: 10, used: 6 },
          { die: 'd6', max: 2, used: 2 },
        ],
      },
      spellcasting: {
        ...initialDndCharacter.spellcasting,
        slots: initialDndCharacter.spellcasting.slots.map((slot) => ({ ...slot, used: slot.max })),
      },
    };

    const rested = applyDndRest(character, 'long');

    expect(rested.hitPoints.current).toBe(rested.hitPoints.max);
    expect(rested.hitPoints.temp).toBe(0);
    expect(rested.hitPoints.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(rested.hitPoints.hitDicePools).toEqual([
      { die: 'd8', max: 10, used: 0 },
      { die: 'd6', max: 2, used: 2 },
    ]);
    expect(rested.spellcasting.slots.every((slot) => slot.used === 0)).toBe(true);
  });

  it('spends available hit dice to recover hit points on short rest', () => {
    const character = {
      ...initialDndCharacter,
      hitPoints: {
        ...initialDndCharacter.hitPoints,
        current: 80,
        max: 101,
        hitDicePools: [
          { die: 'd8', max: 10, used: 8 },
          { die: 'd6', max: 2, used: 1 },
        ],
      },
    };

    const rested = applyDndRest(character, 'short');

    expect(rested.hitPoints.current).toBe(101);
    expect(rested.hitPoints.hitDicePools).toEqual([
      { die: 'd8', max: 10, used: 10 },
      { die: 'd6', max: 2, used: 2 },
    ]);
  });

  it('spends one selected hit die for manual rest recovery', () => {
    const character = {
      ...initialDndCharacter,
      hitPoints: {
        ...initialDndCharacter.hitPoints,
        current: 84,
        max: 101,
        hitDicePools: [{ die: 'd8', max: 10, used: 0 }],
      },
    };

    const result = spendDndHitDie(character, 'd8');

    expect(result.didSpend).toBe(true);
    expect(result.character.hitPoints.current).toBe(93);
    expect(result.character.hitPoints.hitDicePools).toEqual([{ die: 'd8', max: 10, used: 1 }]);
  });
});
