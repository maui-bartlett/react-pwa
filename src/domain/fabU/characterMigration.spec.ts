import { expect, test } from 'vitest';

import { createDefaultCharacter } from './characterDefaults';
import {
  deserializeCharacterFromBackend,
  migrateCharacter,
  serializeCharacterForBackend,
} from './characterMigration';

test('createDefaultCharacter includes notes, backstory prompts, status effects, and zenit', () => {
  const character = createDefaultCharacter();

  expect(character.notes).toContain('Rad idolizes');
  expect(character.backstoryPrompts).toHaveLength(3);
  expect(character.statusEffects).toEqual({
    slow: false,
    dazed: false,
    weak: false,
    shaken: false,
    enraged: false,
    poisoned: false,
  });
  expect(character.zenit).toBe(30);
});

test('migrateCharacter normalizes current localStorage character shape', () => {
  const migrated = migrateCharacter({
    ...createDefaultCharacter(),
    notes: 'Session notes',
    backstoryPrompts: [{ prompt: 'Origin?', response: 'A long road.' }],
    statusEffects: { slow: true, dazed: 'invalid', poisoned: true },
    traits: { identity: 'Wanderer', theme: 'Discovery', origin: 'Efowyn' },
    totalHP: 60,
    totalMP: 55,
    hpBonus: undefined,
    zenit: 99,
  });

  expect(migrated.schemaVersion).toBe(1);
  expect(migrated.character.notes).toBe('Session notes');
  expect(migrated.character.backstoryPrompts[0]).toEqual({
    prompt: 'Origin?',
    response: 'A long road.',
  });
  expect(migrated.character.statusEffects.slow).toBe(true);
  expect(migrated.character.statusEffects.dazed).toBe(false);
  expect(migrated.character.statusEffects.poisoned).toBe(true);
  expect(migrated.character.traits.identity).toEqual(['Wanderer']);
  expect(migrated.character.hpBonus).toBe(7);
  expect(migrated.character.mpBonus).toBe(2);
  expect(migrated.character.zenit).toBe(99);
});

test('migrateCharacter imports older split localStorage values into character state', () => {
  const legacyCurrencyKey = `ze${'nn'}it`;
  const migrated = migrateCharacter(
    {
      [legacyCurrencyKey]: 250,
    },
    {
      oldBackstoryAnswers: ['Inherited answer'],
      oldStatusEffects: { weak: true },
    },
  );

  expect(migrated.character.zenit).toBe(250);
  expect(migrated.character.backstoryPrompts[0]?.response).toBe('Inherited answer');
  expect(migrated.character.statusEffects.weak).toBe(true);
  expect(migrated.character.notes).toBe(createDefaultCharacter().notes);
});

test('backend serialization keeps status effects inside the character shape', () => {
  const character = {
    ...createDefaultCharacter(),
    statusEffects: { ...createDefaultCharacter().statusEffects, shaken: true },
  };

  const serialized = serializeCharacterForBackend(character);
  const deserialized = deserializeCharacterFromBackend(serialized);

  expect(serialized.character.statusEffects.shaken).toBe(true);
  expect(serialized.statusEffects.shaken).toBe(true);
  expect(deserialized.statusEffects.shaken).toBe(true);
});
