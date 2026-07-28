import { describe, expect, test } from 'vitest';

import {
  calculateFabUClassResourceBonuses,
  calculateFabUFixedClassIPBonus,
  calculateFabUSkillResourceBonuses,
  listFabUSkillResourceModifierSources,
  parseFabUClassResourceBonuses,
} from './resourceBonuses';

describe('FabU class resource bonuses', () => {
  test('parses fixed permanent HP, MP, and IP increases', () => {
    expect(
      parseFabUClassResourceBonuses([
        'Permanently increase your maximum Hit Points by 5.',
        'Permanently increase your maximum Mind Points by 5.',
        'Permanently increase your maximum Inventory Points by 2.',
      ]),
    ).toEqual({ hp: 5, mp: 5, ip: 2 });
  });

  test('does not auto-apply player choice increases', () => {
    expect(
      parseFabUClassResourceBonuses([
        'Permanently increase your maximum Hit Points or Mind Points by 5.',
      ]),
    ).toEqual({ hp: 0, mp: 0, ip: 0 });
  });

  test('totals selected class bonuses', () => {
    expect(
      calculateFabUClassResourceBonuses(
        ['Guardian', 'Tinkerer'],
        new Map([
          ['Guardian', ['Permanently increase your maximum Hit Points by 5.']],
          ['Tinkerer', ['Permanently increase your maximum Inventory Points by 2.']],
        ]),
      ),
    ).toEqual({ hp: 5, mp: 0, ip: 2 });
  });

  test('provides fixed IP benefits when class catalog data is unavailable', () => {
    expect(calculateFabUFixedClassIPBonus(['Entropist', 'Tinkerer'])).toBe(2);
    expect(calculateFabUFixedClassIPBonus(['Gourmet', 'Merchant', 'Symbolist'])).toBe(6);
  });
});

describe('FabU skill resource bonuses', () => {
  test('grants Loremaster Focused max MP equal to 3 × skill level', () => {
    expect(
      calculateFabUSkillResourceBonuses(
        ['Loremaster'],
        [
          {
            className: 'Loremaster',
            skills: [{ name: 'Focused', level: '4' }],
          },
        ],
      ),
    ).toEqual({ hp: 0, mp: 12, ip: 0 });
  });

  test('ignores Focused when the character lacks the Loremaster class', () => {
    expect(
      calculateFabUSkillResourceBonuses(
        ['Entropist'],
        [
          {
            className: 'Loremaster',
            skills: [{ name: 'Focused', level: '3' }],
          },
        ],
      ),
    ).toEqual({ hp: 0, mp: 0, ip: 0 });
  });

  test('lists Focused as an MP modifier source for the management UI', () => {
    expect(
      listFabUSkillResourceModifierSources(
        ['Loremaster'],
        [
          {
            className: 'Loremaster',
            skills: [{ name: 'Focused', level: '2' }],
          },
        ],
      ),
    ).toEqual([
      {
        id: 'skill-mp-Loremaster-Focused',
        label: 'Focused',
        source: 'Loremaster · Permanently increase your maximum Mind Points by 【SL × 3】.',
        value: 6,
        resource: 'mp',
      },
    ]);
  });

  test('applies Extra HP, Extra MP, and Extra IP Heroic Skill bonuses', () => {
    expect(
      calculateFabUSkillResourceBonuses(
        ['Guardian'],
        [
          {
            className: 'Guardian',
            skills: [
              { name: 'Extra HP', level: 'M' },
              { name: 'Extra MP', level: 'M' },
              { name: 'Extra IP', level: 'M' },
            ],
          },
        ],
        20,
      ),
    ).toEqual({ hp: 10, mp: 10, ip: 4 });

    expect(
      calculateFabUSkillResourceBonuses(
        ['Guardian'],
        [{ className: 'Guardian', skills: [{ name: 'Extra HP', level: 'M' }] }],
        40,
      ),
    ).toEqual({ hp: 20, mp: 0, ip: 0 });
  });
});
