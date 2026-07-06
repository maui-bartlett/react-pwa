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
        classFeatures: [
          {
            name: 'Sneak Attack',
            level: 1,
            summary: 'Deal extra damage once per turn when you have advantage.',
          },
          {
            name: 'Elusive',
            level: 18,
            summary: 'Attack rolls cannot have advantage against you.',
          },
        ],
        subclasses: [
          {
            name: 'Swashbuckler',
            features: [
              {
                name: 'Fancy Footwork',
                level: 3,
                summary: 'A creature you attack cannot make opportunity attacks against you.',
              },
              {
                name: 'Master Duelist',
                level: 17,
                summary: 'Reroll a missed attack once per rest.',
              },
            ],
          },
        ],
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
        subclasses: [
          {
            name: 'Bladesinging',
            subclassFeatures: [
              {
                title: 'Training in War and Song',
                level: 2,
                description: 'Gain proficiency with light armor and one one-handed weapon.',
              },
              {
                title: 'Extra Attack',
                level: 6,
                description: 'Attack twice when taking the Attack action.',
              },
            ],
          },
        ],
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

  it('merges multiclass hit dice that use the same die type', () => {
    const derived = deriveDndClassFields({
      classes: [
        { name: 'Rogue', level: 3 },
        { name: 'Bard', level: 2 },
      ],
      catalogByName: new Map([
        ['Rogue', { className: 'Rogue', hitDie: 'd8', savingThrows: ['Dexterity'] }],
        ['Bard', { className: 'Bard', hitDie: 'd8', savingThrows: ['Dexterity'] }],
      ]),
      currentHitDicePools: [{ die: 'd8', max: 4, used: 2 }],
    });

    expect(derived.hitDice).toBe('5d8');
    expect(derived.hitDicePools).toEqual([{ die: 'd8', max: 5, used: 2 }]);
  });

  it('reports when primary class saving throw catalog data is missing', () => {
    const derived = deriveDndClassFields({
      classes: [{ name: 'Mystery Class', level: 1 }],
      catalogByName: new Map([['Mystery Class', { className: 'Mystery Class', hitDie: 'd10' }]]),
      currentHitDicePools: [],
    });

    expect(derived.hasSavingThrowData).toBe(false);
    expect(derived.savingThrowKeys).toEqual([]);
  });

  it('derives primary saves, proficiencies, spellcasting ability, and class summary features', () => {
    const derived = deriveDndClassFields({
      classes: [
        { name: 'Rogue', level: 10 },
        { name: 'Wizard', level: 2 },
      ],
      catalogByName: catalog,
      currentHitDicePools: [],
      existingFeatureIds: new Set(['class-summary-Rogue', 'class-feature-rogue-sneak-attack']),
    });

    expect(derived.savingThrowKeys).toEqual(['dex', 'int']);
    expect(derived.hasSavingThrowData).toBe(true);
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

  it('derives class and selected subclass features up to the character class level', () => {
    const derived = deriveDndClassFields({
      classes: [
        { name: 'Rogue', level: 10, subclass: 'Swashbuckler' },
        { name: 'Wizard', level: 2, subclass: 'Bladesinging' },
      ],
      catalogByName: catalog,
      currentHitDicePools: [],
      existingFeatureIds: new Set(['class-feature-rogue-sneak-attack']),
    });

    expect(derived.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'subclass-feature-rogue-swashbuckler-fancy-footwork',
          name: 'Fancy Footwork',
          source: 'Swashbuckler',
        }),
        expect.objectContaining({
          id: 'subclass-feature-wizard-bladesinging-training-in-war-and-song',
          name: 'Training in War and Song',
          source: 'Bladesinging',
        }),
      ]),
    );
    expect(derived.features).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Sneak Attack' }),
        expect.objectContaining({ name: 'Elusive' }),
        expect.objectContaining({ name: 'Master Duelist' }),
        expect.objectContaining({ name: 'Extra Attack' }),
      ]),
    );
  });
});
