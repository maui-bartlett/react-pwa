import type { DndCharacter } from './atoms';
import { normalizeDndCharacter } from './atoms';

const DND_SCHEMA_VERSION = 1;

function serializeDndCharacter(character: DndCharacter) {
  return {
    schemaVersion: DND_SCHEMA_VERSION,
    character,
  };
}

function deserializeDndCharacter(raw: unknown): DndCharacter {
  const maybeState =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as { character?: unknown }) : null;
  return normalizeDndCharacter(maybeState?.character ?? raw);
}

export { DND_SCHEMA_VERSION, deserializeDndCharacter, serializeDndCharacter };
