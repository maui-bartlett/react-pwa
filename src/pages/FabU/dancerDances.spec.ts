import { expect, test } from 'vitest';

import { createDefaultCharacter } from '@/domain/fabU/characterDefaults';

import {
  DANCER_DANCES,
  getDancerDanceSkillLevel,
  getSelectedDancerDances,
  hasDancerDanceSkill,
} from './dancerDances';

test('Dancer dances are available when a Dancer has the Dance skill', () => {
  const character = {
    ...createDefaultCharacter(),
    classes: [{ name: 'Dancer', level: 1, subtitle: '' }],
    skillGroups: [
      {
        className: 'Dancer',
        skills: [{ name: 'Dance', level: '1', maxLevel: 10, effect: '' }],
      },
    ],
  };

  expect(hasDancerDanceSkill(character)).toBe(true);
  expect(DANCER_DANCES).toHaveLength(17);
  expect(DANCER_DANCES.find((dance) => dance.name === 'Angel Dance')).toMatchObject({
    cost: '10 MP',
    duration: 'Until next turn',
  });
  expect(DANCER_DANCES.find((dance) => dance.name === 'Unicorn Dance')?.effect).toContain(
    'level 40 or higher',
  );
  expect(getDancerDanceSkillLevel(character)).toBe(1);
});

test('Dancer dances stay hidden until the Dance skill is present', () => {
  const character = {
    ...createDefaultCharacter(),
    classes: [{ name: 'Dancer', level: 1, subtitle: '' }],
    skillGroups: [{ className: 'Dancer', skills: [] }],
  };

  expect(hasDancerDanceSkill(character)).toBe(false);
});

test('selected Dancer dances are capped by Dance skill level', () => {
  const character = {
    ...createDefaultCharacter(),
    classes: [{ name: 'Dancer', level: 2, subtitle: '' }],
    skillGroups: [
      {
        className: 'Dancer',
        skills: [{ name: 'Dance', level: '2', maxLevel: 10, effect: '' }],
      },
    ],
    spellGroups: [
      {
        className: 'Dancer',
        spells: DANCER_DANCES.slice(0, 3),
      },
    ],
  };

  expect(getSelectedDancerDances(character).map((dance) => dance.name)).toEqual([
    'Angel Dance',
    'Banshee Dance',
  ]);
});
