import { expect, test } from 'vitest';

import { createDefaultCharacter } from './characterDefaults';
import {
  deserializeCharacterFromBackend,
  migrateCharacter,
  repairFabUCharacterResourceFields,
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

test('createDefaultCharacter starts without custom max resource modifiers', () => {
  const character = createDefaultCharacter();

  expect(character.hpBonus).toBe(0);
  expect(character.mpBonus).toBe(0);
  expect(character.ipBonus).toBe(0);
  expect(character.customResourceModifiers).toEqual([]);
});

test('migrateCharacter does not add max resource modifiers to a fresh character', () => {
  const migrated = migrateCharacter(null);

  expect(migrated.character.hpBonus).toBe(0);
  expect(migrated.character.mpBonus).toBe(0);
  expect(migrated.character.ipBonus).toBe(0);
  expect(migrated.character.customResourceModifiers).toEqual([]);
});

test('migrateCharacter repairs missing IP values from existing characters', () => {
  const migrated = migrateCharacter({
    ...createDefaultCharacter(),
    currentIP: undefined,
    inventoryPoints: undefined,
    maxIP: undefined,
  });

  expect(migrated.character.currentIP).toBe(6);
  expect(migrated.character.inventoryPoints).toBe(6);
  expect(migrated.character.maxIP).toBe(6);
});

test('repairFabUCharacterResourceFields repairs NaN IP values on existing local slots', () => {
  const repaired = repairFabUCharacterResourceFields({
    ...createDefaultCharacter(),
    currentIP: Number.NaN,
    inventoryPoints: Number.NaN,
    maxIP: Number.NaN,
    ipBonus: Number.NaN,
  });

  expect(repaired.currentIP).toBe(6);
  expect(repaired.inventoryPoints).toBe(6);
  expect(repaired.maxIP).toBe(6);
  expect(repaired.ipBonus).toBe(0);
});

test('repairFabUCharacterResourceFields clamps current IP to max IP', () => {
  const repaired = repairFabUCharacterResourceFields({
    ...createDefaultCharacter(),
    currentIP: 12,
    inventoryPoints: 12,
    maxIP: 6,
    ipBonus: 1,
    classes: [],
  });

  expect(repaired.currentIP).toBe(7);
  expect(repaired.inventoryPoints).toBe(7);
  expect(repaired.maxIP).toBe(6);
  expect(repaired.ipBonus).toBe(1);
});

test('repairFabUCharacterResourceFields preserves IP granted by Tinkerer', () => {
  const repaired = repairFabUCharacterResourceFields({
    ...createDefaultCharacter(),
    currentIP: 8,
    inventoryPoints: 8,
    maxIP: 6,
    ipBonus: 0,
  });

  expect(repaired.currentIP).toBe(8);
  expect(repaired.inventoryPoints).toBe(8);
});

test('migrateCharacter adds Comet to Entropist spells when the skill already exists', () => {
  const character = createDefaultCharacter();
  const migrated = migrateCharacter({
    ...character,
    skillGroups: character.skillGroups.map((group) =>
      group.className === 'Entropist'
        ? {
            ...group,
            skills: [
              ...group.skills,
              { name: 'Comet', level: 'M', maxLevel: 1, mastered: true, effect: 'Learn Comet.' },
            ],
          }
        : group,
    ),
    spellGroups: character.spellGroups.map((group) =>
      group.className === 'Entropist' ? { ...group, spells: [] } : group,
    ),
  });

  expect(
    migrated.character.spellGroups
      .find((group) => group.className === 'Entropist')
      ?.spells.map((spell) => spell.name),
  ).toContain('Comet');
});

test('migrateCharacter removes legacy starter max resource bonuses', () => {
  const migrated = migrateCharacter({
    ...createDefaultCharacter(),
    currentHP: 58,
    hpBonus: 5,
    currentMP: 58,
    mpBonus: 5,
    customResourceModifiers: [],
  });

  expect(migrated.character.hpBonus).toBe(0);
  expect(migrated.character.mpBonus).toBe(0);
  expect(migrated.character.currentHP).toBe(53);
  expect(migrated.character.currentMP).toBe(53);
  expect(migrated.character.customResourceModifiers).toEqual([]);
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

test('migrateCharacter preserves an absent or blank nickname', () => {
  const withoutNickname = migrateCharacter({
    ...createDefaultCharacter(),
    name: { firstName: 'Mira', lastName: 'Vale' },
  });
  const blankNickname = migrateCharacter({
    ...createDefaultCharacter(),
    name: { firstName: 'Mira', lastName: 'Vale', nickName: '   ' },
  });

  expect(withoutNickname.character.name.nickName).toBeUndefined();
  expect(blankNickname.character.name.nickName).toBeUndefined();
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

  // Canonical statusEffects live inside `character`; there should no
  // longer be a redundant top-level `statusEffects` on the persisted
  // payload (that field was removed from the backend shape).
  expect(serialized.character.statusEffects.shaken).toBe(true);
  expect((serialized as { statusEffects?: unknown }).statusEffects).toBeUndefined();
  expect(deserialized.statusEffects.shaken).toBe(true);
});

test('backend deserialization repairs malformed authenticated character data', () => {
  const character = deserializeCharacterFromBackend({
    schemaVersion: 1,
    character: {
      name: null,
      initiative: 'fast',
      defense: null,
      attributes: {
        dex: null,
        insight: { die: 'd100', modifier: 'high' },
        might: { die: 'd10', modifier: 2 },
      },
      bonds: null,
      classes: null,
      skillGroups: { Entropist: [] },
      spellGroups: 'none',
      backstoryPrompts: null,
      equipment: null,
      backpack: null,
      statusEffects: null,
      traits: null,
      notes: null,
    },
  });

  expect(character.name.firstName).toBe(createDefaultCharacter().name.firstName);
  expect(character.name.lastName).toBe(createDefaultCharacter().name.lastName);
  expect(character.initiative).toBe(createDefaultCharacter().initiative);
  expect(character.attributes.dex).toEqual(createDefaultCharacter().attributes.dex);
  expect(character.attributes.insight).toEqual(createDefaultCharacter().attributes.insight);
  expect(character.attributes.might).toEqual({ die: 'd10', modifier: 2 });
  expect(character.attributes.willpower).toEqual(createDefaultCharacter().attributes.willpower);
  expect(character.classes.map((entry) => entry.name)).toEqual(
    createDefaultCharacter().classes.map((entry) => entry.name),
  );
  expect(
    character.skillGroups.reduce((count, group) => count + group.skills.length, 0),
  ).toBeGreaterThan(0);
  expect(character.spellGroups).toEqual(createDefaultCharacter().spellGroups);
  expect(character.bonds).toEqual(createDefaultCharacter().bonds);
  expect(character.notes).toBe(createDefaultCharacter().notes);
});
