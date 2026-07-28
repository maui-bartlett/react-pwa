import { describe, expect, test } from 'vitest';

import {
  getFabUMasteredSkillMaxAcquisitions,
  getFabUMasteredSkillOptionsForClass,
} from './masteredSkills';

describe('FabU core Heroic Skills', () => {
  test('includes every Press Start Heroic Skill from the core book', () => {
    const names = new Set(
      getFabUMasteredSkillOptionsForClass(
        'Darkblade',
        [
          'Arcanist',
          'Chimerist',
          'Darkblade',
          'Elementalist',
          'Entropist',
          'Fury',
          'Guardian',
          'Loremaster',
          'Orator',
          'Rogue',
          'Sharpshooter',
          'Spiritist',
          'Tinkerer',
          'Wayfarer',
          'Weaponmaster',
        ],
        ['Faithful Companion', 'Warning Shot', 'Soul Steal'],
      ).map((skill) => skill.name),
    );

    for (const expected of [
      'Adversity',
      'Ambidextrous',
      'Arcane Echoes',
      'Chimeric Mastery',
      'Comet',
      'Deep Pockets',
      'Disarming Rhetoric',
      'Extra HP',
      'Extra IP',
      'Extra MP',
      'Extra Spells',
      'Heartbreaker',
      'Heroic Companion',
      'Hope',
      'Mathemagic',
      'Monkey Grip',
      'Perfect Aim',
      'Pillage',
      'Powerful Shot',
      'Powerful Spell',
      'Powerful Strike',
      'Predictable!',
      'Rampart',
      'Repetition',
      'Revelation',
      'Status Immunity',
      'Tempest Strike',
      'Unbreakable',
      'Upgrade',
      'Vanish',
      'Volcano',
    ]) {
      expect(names.has(expected)).toBe(true);
    }
  });

  test('hides Perfect Aim, Pillage, and Heroic Companion without skill prerequisites', () => {
    const names = new Set(
      getFabUMasteredSkillOptionsForClass(
        'Sharpshooter',
        ['Sharpshooter', 'Rogue', 'Wayfarer'],
        [],
      ).map((skill) => skill.name),
    );

    expect(names.has('Perfect Aim')).toBe(false);
    expect(names.has('Pillage')).toBe(false);
    expect(names.has('Heroic Companion')).toBe(false);
    expect(names.has('Powerful Shot')).toBe(true);
  });

  test('shows Perfect Aim only when Warning Shot is owned', () => {
    const names = new Set(
      getFabUMasteredSkillOptionsForClass('Sharpshooter', ['Sharpshooter'], ['Warning Shot']).map(
        (skill) => skill.name,
      ),
    );

    expect(names.has('Perfect Aim')).toBe(true);
  });

  test('shows Adversity for a later mastered class once Darkblade is mastered', () => {
    const names = new Set(
      getFabUMasteredSkillOptionsForClass('Orator', ['Darkblade', 'Orator'], []).map(
        (skill) => skill.name,
      ),
    );

    expect(names.has('Adversity')).toBe(true);
    expect(names.has('Disarming Rhetoric')).toBe(true);
    expect(names.has('Ambidextrous')).toBe(true);
  });

  test('allows Chimeric Mastery to be acquired twice', () => {
    expect(getFabUMasteredSkillMaxAcquisitions('Chimeric Mastery')).toBe(2);
  });
});
