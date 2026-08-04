import { describe, expect, test } from 'vitest';

import { createDefaultCharacter } from './characterDefaults';
import {
  applyGadgetsUpgrade,
  getMagisphereCapacity,
  getPendingGadgetsSelections,
  getSpentGadgetsLevels,
  listAvailableGadgetsUpgrades,
  normalizeGadgetsState,
} from './tinkererGadgets';

describe('tinkererGadgets', () => {
  test('counts spent gadget levels from tier ranks', () => {
    expect(getSpentGadgetsLevels({})).toBe(0);
    expect(getSpentGadgetsLevels({ alchemy: 'basic' })).toBe(1);
    expect(getSpentGadgetsLevels({ alchemy: 'superior', magitech: 'advanced' })).toBe(5);
  });

  test('lists unlock and upgrade options based on current tiers', () => {
    const options = listAvailableGadgetsUpgrades({ alchemy: 'basic', infusions: 'advanced' });
    expect(options.map((option) => option.id)).toEqual([
      'alchemy-advanced',
      'infusions-superior',
      'magitech-basic',
    ]);
  });

  test('applies only valid one-step upgrades', () => {
    expect(applyGadgetsUpgrade({}, 'magitech', 'basic')).toEqual({ magitech: 'basic' });
    expect(applyGadgetsUpgrade({ magitech: 'basic' }, 'magitech', 'advanced')).toEqual({
      magitech: 'advanced',
    });
    expect(applyGadgetsUpgrade({ magitech: 'basic' }, 'magitech', 'superior')).toEqual({
      magitech: 'basic',
    });
  });

  test('tracks pending selections from Gadgets skill level', () => {
    const character = {
      ...createDefaultCharacter(),
      gadgets: { alchemy: 'basic' },
      skillGroups: [
        {
          className: 'Tinkerer',
          skills: [{ name: 'Gadgets', level: '3', maxLevel: 5, effect: '' }],
        },
      ],
    };
    expect(getPendingGadgetsSelections(character)).toBe(2);
  });

  test('magisphere capacity scales with character level once Magitech is Superior', () => {
    const base = {
      ...createDefaultCharacter(),
      gadgets: { magitech: 'superior' as const },
      skillGroups: [
        {
          className: 'Tinkerer',
          skills: [{ name: 'Gadgets', level: '3', maxLevel: 5, effect: '' }],
        },
      ],
    };
    expect(getMagisphereCapacity({ ...base, level: 5 })).toBe(3);
    expect(getMagisphereCapacity({ ...base, level: 20 })).toBe(5);
    expect(getMagisphereCapacity({ ...base, level: 40 })).toBe(7);
    expect(getMagisphereCapacity({ ...base, gadgets: { magitech: 'advanced' }, level: 40 })).toBe(
      0,
    );
  });

  test('normalizes stored gadgets state', () => {
    expect(
      normalizeGadgetsState({
        alchemy: 'superior',
        infusions: 'nope',
        magicannonDamageType: 'fire',
      }),
    ).toEqual({ alchemy: 'superior', magicannonDamageType: 'fire' });
  });
});
