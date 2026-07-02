import { describe, expect, it } from 'vitest';

import { deriveDndClassFields } from './classDerivation';

describe('Dungeons & Dragons class catalog derivation', () => {
  const catalog = new Map([
    [
      'Rogue',
      {
        className: 'Rogue',
        hitDie: 'd8',
        primaryAbilities: ['Dexterity'],
        savingThrows: ['Dexterity', 'Intelligence'],
        armorProficiencies: ['Light Armor'],
        weaponProficiencies: ['Simple Weapons', 'Hand Crossbows'],
        toolProficiencies: ["Thieves' Tools"],
      },
    ],
    [
      'Wizard',
      {
        className: 'Wizard',
        hitDie: 'd6',
        primaryAbilities: ['Intelligence'],
        savingThrows: ['Intelligence', 'Wisdom'],
        weaponProficiencies: ['Daggers', 'Quarterstaffs'],
        spellcasting: {
          type: 'Prepared',
          ability: 'Intelligence',
          ritualCasting: true,
          preparation: 'prepare after a long rest',
        },
      },
    ],
  ]);

  it('derives multiclass hit dice while preserving spent dice by die type', () => {
    const derived = deriveDndClassFields({
      classes: [
        { name: 'Rogue', level: 10 },
        { name: 'Wizard', level: 2 },
      ],
      catalogByName: catalog,
      currentHitDicePools: [
        { die: 'd8', max: 9, used: 3 },
        { die: 'd6', max: 1, used: 1 },
      ],
    });

    expect(derived.hitDice).toBe('10d8 + 2d6');
    expect(derived.hitDicePools).toEqual([
      { die: 'd8', max: 10, used: 3 },
      { die: 'd6', max: 2, used: 1 },
    ]);
  });

  it('derives primary saves, proficiencies, spellcasting ability, and class summary features', () => {
    const derived = deriveDndClassFields({
      classes: [
        { name: 'Rogue', level: 10 },
        { name: 'Wizard', level: 2 },
      ],
      catalogByName: catalog,
      currentHitDicePools: [],
      existingFeatureIds: new Set(['class-summary-Rogue']),
    });

    expect(derived.savingThrowKeys).toEqual(['dex', 'int']);
    expect(derived.proficiencies).toEqual([
      'Light Armor',
      'Simple Weapons',
      'Hand Crossbows',
      "Thieves' Tools",
      'Daggers',
      'Quarterstaffs',
    ]);
    expect(derived.spellcastingAbility).toBe('int');
    expect(derived.features).toEqual([
      expect.objectContaining({
        id: 'class-summary-Wizard',
        name: 'Wizard Training',
        source: 'Wizard',
        summary: expect.stringContaining('Spellcasting: Prepared'),
      }),
    ]);
  });
});
