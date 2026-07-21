import { describe, expect, test } from 'vitest';

import {
  calculateFabUClassResourceBonuses,
  calculateFabUFixedClassIPBonus,
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
