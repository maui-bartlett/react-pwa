import { describe, expect, test } from 'vitest';

import { cleanFabUSkillText } from './skillText';

describe('cleanFabUSkillText', () => {
  test('removes trailing O. and circle-rank OCR artifacts', () => {
    expect(cleanFabUSkillText('Recover MP when magic is turned aside. O.')).toBe(
      'Recover MP when magic is turned aside.',
    );
    expect(cleanFabUSkillText('Create an opening with ranged attacks.○.')).toBe(
      'Create an opening with ranged attacks.',
    );
    expect(cleanFabUSkillText('Improve attacks and damage.○○○')).toBe(
      'Improve attacks and damage.',
    );
  });

  test('preserves legitimate endings', () => {
    expect(cleanFabUSkillText('Permanently increase your maximum Hit Points by 10.')).toBe(
      'Permanently increase your maximum Hit Points by 10.',
    );
    expect(cleanFabUSkillText('HR treated as zero.')).toBe('HR treated as zero.');
    expect(cleanFabUSkillText(undefined)).toBe('');
  });
});
