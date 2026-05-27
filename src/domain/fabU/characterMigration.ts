import type { EquipmentItem } from '@/components/fab-u';
import { skillGroups as defaultSkillGroups } from '@/pages/FabU/skills';
import type { SkillGroup } from '@/pages/FabU/skills';

import {
  BACKPACK_DEFAULTS,
  BACKSTORY_PROMPT_DEFAULTS,
  CHARACTER_SCHEMA_VERSION,
  EQUIPMENT_DEFAULTS,
  STATUS_EFFECT_DEFAULTS,
  createDefaultCharacter,
} from './characterDefaults';
import type {
  BackpackItem,
  BackstoryPrompt,
  Character,
  PersistedCharacterState,
  StatusEffects,
} from './characterTypes';

type CharacterMigrationOptions = {
  oldBackstoryAnswers?: unknown;
  oldStatusEffects?: unknown;
};

function normalizeBackstoryPrompts(
  storedPrompts: unknown,
  storedAnswers: unknown = null,
): BackstoryPrompt[] {
  const answers = Array.isArray(storedAnswers) ? storedAnswers : [];

  return BACKSTORY_PROMPT_DEFAULTS.map((defaultPrompt, index) => {
    const storedPrompt = Array.isArray(storedPrompts) ? storedPrompts[index] : null;
    const answer = answers[index];

    if (storedPrompt && typeof storedPrompt === 'object') {
      const maybePrompt = storedPrompt as Partial<BackstoryPrompt>;
      return {
        prompt: typeof maybePrompt.prompt === 'string' ? maybePrompt.prompt : defaultPrompt.prompt,
        response:
          typeof maybePrompt.response === 'string'
            ? maybePrompt.response
            : typeof answer === 'string'
              ? answer
              : defaultPrompt.response,
      };
    }

    return {
      prompt: defaultPrompt.prompt,
      response: typeof answer === 'string' ? answer : defaultPrompt.response,
    };
  });
}

function normalizeBackpack(storedBackpack: unknown): BackpackItem[] {
  if (!Array.isArray(storedBackpack)) return BACKPACK_DEFAULTS;
  const valid = storedBackpack.filter(
    (item): item is BackpackItem =>
      item &&
      typeof item === 'object' &&
      typeof (item as Partial<BackpackItem>).title === 'string' &&
      typeof (item as Partial<BackpackItem>).subtitle === 'string',
  );
  return valid.length > 0
    ? valid.map((item) => ({
        id: item.id ?? String(Math.random()),
        title: item.title,
        subtitle: item.subtitle,
      }))
    : BACKPACK_DEFAULTS;
}

function normalizeEquipment(storedEquipment: unknown): EquipmentItem[] {
  if (!Array.isArray(storedEquipment)) return EQUIPMENT_DEFAULTS;

  return storedEquipment.filter(
    (item): item is EquipmentItem =>
      item &&
      typeof item === 'object' &&
      typeof (item as Partial<EquipmentItem>).name === 'string' &&
      typeof (item as Partial<EquipmentItem>).slot === 'string' &&
      typeof (item as Partial<EquipmentItem>).description === 'string',
  );
}

function normalizeStatusEffects(storedStatusEffects: unknown): StatusEffects {
  if (!storedStatusEffects || typeof storedStatusEffects !== 'object')
    return STATUS_EFFECT_DEFAULTS;

  const stored = storedStatusEffects as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(STATUS_EFFECT_DEFAULTS).map(([key, defaultValue]) => [
      key,
      typeof stored[key] === 'boolean' ? stored[key] : defaultValue,
    ]),
  );
}

/** Migrate traits.identity from old string format to string[]. */
function normalizeTraits(stored: unknown, defaults: Character['traits']): Character['traits'] {
  if (!stored || typeof stored !== 'object') return defaults;
  const t = stored as Record<string, unknown>;
  const rawIdentity = t.identity;
  const identity: string[] = Array.isArray(rawIdentity)
    ? rawIdentity.filter((x): x is string => typeof x === 'string')
    : typeof rawIdentity === 'string'
      ? [rawIdentity]
      : defaults.identity;
  return {
    identity: identity.length > 0 ? identity : defaults.identity,
    theme: typeof t.theme === 'string' ? t.theme : defaults.theme,
    origin: typeof t.origin === 'string' ? t.origin : defaults.origin,
  };
}

/** Migrate totalHP/totalMP to hpBonus/mpBonus, back-computing the bonus from old values. */
const MIGRATION_DIE_VALUES: Record<string, number> = {
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

function normalizeHpMpBonus(
  parsed: Record<string, unknown>,
  initialValue: Character,
): { hpBonus: number; mpBonus: number } {
  if (typeof parsed.hpBonus === 'number') {
    return {
      hpBonus: parsed.hpBonus,
      mpBonus: typeof parsed.mpBonus === 'number' ? parsed.mpBonus : initialValue.mpBonus,
    };
  }

  const attrs = parsed.attributes as Character['attributes'] | undefined;
  const level = typeof parsed.level === 'number' ? parsed.level : initialValue.level;
  if (typeof parsed.totalHP === 'number' && attrs?.might) {
    const hpBase = (MIGRATION_DIE_VALUES[attrs.might.die] ?? 8) * 5 + level;
    const mpBase = attrs?.willpower
      ? (MIGRATION_DIE_VALUES[attrs.willpower.die] ?? 8) * 5 + level
      : 8 * 5 + level;
    return {
      hpBonus: Math.max(0, parsed.totalHP - hpBase),
      mpBonus:
        typeof parsed.totalMP === 'number'
          ? Math.max(0, parsed.totalMP - mpBase)
          : initialValue.mpBonus,
    };
  }
  return { hpBonus: initialValue.hpBonus, mpBonus: initialValue.mpBonus };
}

function normalizeSkillGroups(storedSkillGroups: unknown, defaults: Character): SkillGroup[] {
  return ((storedSkillGroups as SkillGroup[] | undefined) ?? defaults.skillGroups).map(
    (group: SkillGroup) => {
      const defaultGroup = defaultSkillGroups.find((dg) => dg.className === group.className);
      return {
        ...group,
        skills: group.skills.map((skill) => {
          const defaultSkill = defaultGroup?.skills.find((ds) => ds.name === skill.name);
          return defaultSkill?.maxLevel != null
            ? { ...skill, maxLevel: defaultSkill.maxLevel }
            : skill;
        }),
      };
    },
  );
}

function normalizeCharacter(raw: unknown, options: CharacterMigrationOptions = {}): Character {
  const initialValue = createDefaultCharacter();
  if (!raw || typeof raw !== 'object') {
    return {
      ...initialValue,
      statusEffects: normalizeStatusEffects(options.oldStatusEffects),
    };
  }

  const parsed = raw as Record<string, unknown>;
  const legacyZenit = parsed[`ze${'nn'}it`];
  return {
    ...initialValue,
    ...parsed,
    zenit:
      typeof parsed.zenit === 'number'
        ? parsed.zenit
        : typeof legacyZenit === 'number'
          ? legacyZenit
          : initialValue.zenit,
    skillGroups: normalizeSkillGroups(parsed.skillGroups, initialValue),
    backstoryPrompts: normalizeBackstoryPrompts(
      parsed.backstoryPrompts,
      options.oldBackstoryAnswers,
    ),
    equipment: normalizeEquipment(parsed.equipment),
    backpack: normalizeBackpack(parsed.backpack),
    statusEffects: normalizeStatusEffects(parsed.statusEffects ?? options.oldStatusEffects),
    traits: normalizeTraits(parsed.traits, initialValue.traits),
    ...normalizeHpMpBonus(parsed, initialValue),
  };
}

function migrateCharacter(
  raw: unknown,
  options: CharacterMigrationOptions = {},
): PersistedCharacterState {
  if (
    raw &&
    typeof raw === 'object' &&
    'schemaVersion' in raw &&
    'character' in raw &&
    typeof (raw as Partial<PersistedCharacterState>).schemaVersion === 'number'
  ) {
    const persisted = raw as PersistedCharacterState;
    return {
      schemaVersion: CHARACTER_SCHEMA_VERSION,
      character: normalizeCharacter(persisted.character, options),
    };
  }

  return {
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    character: normalizeCharacter(raw, options),
  };
}

function serializeCharacterForBackend(character: Character): PersistedCharacterState {
  // The full Character (including `statusEffects`) lives under
  // `character`. We no longer mirror `statusEffects` at the top of the
  // persisted state — that field was redundant with
  // `character.statusEffects` and is removed from the backend payload.
  return {
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    character,
  };
}

function deserializeCharacterFromBackend(raw: unknown): Character {
  if (!raw || typeof raw !== 'object') return createDefaultCharacter();
  const persisted = raw as Partial<PersistedCharacterState> & {
    // Legacy payloads stored a top-level `statusEffects` alongside
    // `character`. We accept it here as a fallback so existing rows
    // round-trip correctly until the cleanup migration runs, but new
    // writes (see serializeCharacterForBackend) no longer emit it.
    statusEffects?: unknown;
  };
  return normalizeCharacter(persisted.character ?? raw, {
    oldStatusEffects: persisted.statusEffects,
  });
}

export {
  deserializeCharacterFromBackend,
  migrateCharacter,
  normalizeCharacter,
  serializeCharacterForBackend,
};
