import { describe, expect, it } from 'vitest';

import { initialDndCharacter, normalizeDndCharacter } from './atoms';
import { deserializeDndCharacter, serializeDndCharacter } from './persistence';

describe('Dungeons & Dragons character persistence', () => {
  it('wraps character state with the current DnD schema version', () => {
    const payload = serializeDndCharacter(initialDndCharacter);

    expect(payload).toMatchObject({
      schemaVersion: 1,
      character: {
        id: 'gellin-mcfellon',
        name: 'Gellin McFellon',
        classes: [
          { name: 'Rogue', level: 10, subclass: 'Swashbuckler' },
          { name: 'Wizard', level: 2, subclass: 'Bladesinging' },
        ],
      },
    });
  });

  it('deserializes wrapped Convex payloads and fills missing nested defaults', () => {
    const character = deserializeDndCharacter({
      schemaVersion: 1,
      character: {
        id: 'custom-dnd-character',
        name: 'Custom Adventurer',
        hitPoints: { current: 12 },
        spellcasting: { saveDc: 15 },
        personality: { backstory: 'A useful test backstory.' },
        money: { gp: 42 },
      },
    });

    expect(character.id).toBe('custom-dnd-character');
    expect(character.name).toBe('Custom Adventurer');
    expect(character.hitPoints).toMatchObject({
      current: 12,
      max: initialDndCharacter.hitPoints.max,
      deathSaves: { successes: 0, failures: 0 },
    });
    expect(character.spellcasting).toMatchObject({
      ability: initialDndCharacter.spellcasting.ability,
      saveDc: 15,
    });
    expect(character.personality).toMatchObject({
      traits: initialDndCharacter.personality.traits,
      backstory: 'A useful test backstory.',
    });
    expect(character.money).toMatchObject({
      cp: initialDndCharacter.money.cp,
      gp: 42,
    });
  });

  it('falls back to the default character for invalid persisted values', () => {
    expect(normalizeDndCharacter(null)).toBe(initialDndCharacter);
    expect(deserializeDndCharacter(undefined)).toBe(initialDndCharacter);
  });
});
