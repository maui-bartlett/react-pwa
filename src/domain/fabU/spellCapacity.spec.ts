import { expect, test } from 'vitest';

import { createDefaultCharacter } from './characterDefaults';
import { getFabUClassSpellCapacity } from './spellCapacity';

test('Chimerist Spell Mimic allows skill level plus two spells', () => {
  const character = {
    ...createDefaultCharacter(),
    skillGroups: [
      {
        className: 'Chimerist',
        skills: [
          {
            name: 'Spell Mimic',
            level: '1',
            maxLevel: 5,
            effect: '',
          },
        ],
      },
    ],
  };

  expect(getFabUClassSpellCapacity(character, 'Chimerist', 0)).toBe(3);

  character.skillGroups[0].skills[0].level = '5';
  expect(getFabUClassSpellCapacity(character, 'Chimerist', 0)).toBe(7);
});

test('non-Chimerist classes use their default spell capacity', () => {
  expect(getFabUClassSpellCapacity(createDefaultCharacter(), 'Spiritist', 4)).toBe(4);
});
