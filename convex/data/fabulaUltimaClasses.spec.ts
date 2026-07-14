import { describe, expect, test } from 'vitest';

import { FABULA_ULTIMA_MISSING_CLASSES } from './fabulaUltimaClasses';

describe('Fabula Ultima class seed data', () => {
  test('includes full Dancer skill descriptions and max levels', () => {
    const dancer = FABULA_ULTIMA_MISSING_CLASSES.find((entry) => entry.name === 'Dancer');
    expect(dancer).toBeDefined();

    const skillsByName = new Map(dancer?.skillsExpanded.map((skill) => [skill.name, skill]));

    expect(skillsByName.get('Dance')).toMatchObject({
      maxLevel: 10,
      summary: 'Learn dances and spend 10 MP to perform one before or after your action during conflict.',
    });
    expect(skillsByName.get('Dance')?.description).toContain(
      'If you already performed a different dance during your previous turn in this scene',
    );

    expect(skillsByName.get('Follow My Lead')).toMatchObject({
      maxLevel: 1,
      description:
        'When you perform a dance with a duration of "Until the start of your next turn", you may spend 10 additional Mind Points. If you do, choose one ally you can see towards whom you have a Bond of affection: apply the benefits of the dance to that ally as well as yourself (the benefits still last until the start of your next turn).',
    });
    expect(skillsByName.get('Frenetic Footwork')).toMatchObject({
      maxLevel: 2,
      description:
        'After you perform a dance with a duration of "Until the start of your next turn", you gain a bonus equal to (SL x 2) to all Opposed Checks that rely on acrobatics, coordination or speed until the start of your next turn.',
    });
    expect(skillsByName.get('Quick-Change')).toMatchObject({
      maxLevel: 1,
      description: 'After you perform a dance, you may perform the Equipment action for free.',
    });
    expect(skillsByName.get('Wardancer')).toMatchObject({
      maxLevel: 5,
      description:
        'After you perform a dance, your attacks with brawling, dagger, flail and thrown weapons deal (SL) extra damage until the start of your next turn. If you have an arcane weapon equipped, offensive spells you cast also deal (SL) extra damage until the start of your next turn.',
    });
  });
});
