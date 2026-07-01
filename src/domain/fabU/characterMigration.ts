import type {
  Attribute,
  Bond,
  BondType,
  EquipmentItem,
  SkillRow,
  SpellRow,
} from '@/components/fab-u';
import { skillGroups as defaultSkillGroups } from '@/pages/FabU/skills';
import type { SkillGroup } from '@/pages/FabU/skills';
import type { SpellGroup } from '@/pages/FabU/spells';

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
  CharacterName,
  ClassEntry,
  PersistedCharacterState,
  StatusEffects,
} from './characterTypes';

type CharacterMigrationOptions = {
  oldBackstoryAnswers?: unknown;
  oldStatusEffects?: unknown;
};

const DIE_SIZES = new Set(['d6', 'd8', 'd10', 'd12', 'd20']);
const BOND_TYPES = new Set<BondType>([
  'Admiration',
  'Loyalty',
  'Affection',
  'Inferiority',
  'Mistrust',
  'Hatred',
]);

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeNullableNumber(value: unknown, fallback: number | null): number | null {
  return value === null
    ? null
    : typeof value === 'number' && Number.isFinite(value)
      ? value
      : fallback;
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeAttribute(stored: unknown, fallback: Attribute): Attribute {
  if (!stored || typeof stored !== 'object') return fallback;
  const attribute = stored as Record<string, unknown>;
  return {
    die:
      typeof attribute.die === 'string' && DIE_SIZES.has(attribute.die)
        ? (attribute.die as Attribute['die'])
        : fallback.die,
    modifier: normalizeNumber(attribute.modifier, fallback.modifier),
    temp:
      attribute.temp === null
        ? null
        : typeof attribute.temp === 'string' && DIE_SIZES.has(attribute.temp)
          ? (attribute.temp as Attribute['die'])
          : fallback.temp,
  };
}

function normalizeAttributes(
  stored: unknown,
  defaults: Character['attributes'],
): Character['attributes'] {
  const attributes =
    stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  return {
    dex: normalizeAttribute(attributes.dex, defaults.dex),
    insight: normalizeAttribute(attributes.insight, defaults.insight),
    might: normalizeAttribute(attributes.might, defaults.might),
    willpower: normalizeAttribute(attributes.willpower, defaults.willpower),
  };
}

function normalizeClasses(stored: unknown, defaults: ClassEntry[]): ClassEntry[] {
  if (!Array.isArray(stored)) return defaults;
  return stored.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const classEntry = entry as Record<string, unknown>;
    if (typeof classEntry.name !== 'string') return [];
    return [
      {
        name: classEntry.name,
        level: normalizeNumber(classEntry.level, 0),
        subtitle: normalizeString(classEntry.subtitle, ''),
      },
    ];
  });
}

function normalizeBonds(stored: unknown, defaults: Bond[]): Bond[] {
  if (!Array.isArray(stored)) return defaults;
  return stored.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const bond = entry as Record<string, unknown>;
    if (typeof bond.characterName !== 'string') return [];
    const types = Array.isArray(bond.types)
      ? bond.types.filter(
          (type): type is BondType => typeof type === 'string' && BOND_TYPES.has(type as BondType),
        )
      : [];
    return [
      {
        id: typeof bond.id === 'string' ? bond.id : String(Math.random()),
        characterName: bond.characterName,
        types,
      },
    ];
  });
}

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

/**
 * Accept both the new nested `name: { firstName, lastName, nickName }`
 * shape and the legacy flat `firstName / lastName / nickName` shape so
 * older persisted characters round-trip cleanly into the new form.
 */
function normalizeName(parsed: Record<string, unknown>, defaults: CharacterName): CharacterName {
  const normalizeNickName = (value: unknown) =>
    typeof value === 'string' ? value.trim() || undefined : undefined;
  const nested = parsed.name;
  if (nested && typeof nested === 'object') {
    const n = nested as Partial<CharacterName>;
    return {
      firstName: typeof n.firstName === 'string' ? n.firstName : defaults.firstName,
      lastName: typeof n.lastName === 'string' ? n.lastName : defaults.lastName,
      nickName: normalizeNickName(n.nickName),
    };
  }
  return {
    firstName: typeof parsed.firstName === 'string' ? parsed.firstName : defaults.firstName,
    lastName: typeof parsed.lastName === 'string' ? parsed.lastName : defaults.lastName,
    nickName: normalizeNickName(parsed.nickName),
  };
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

function normalizeSkillRow(stored: unknown): SkillRow | null {
  if (!stored || typeof stored !== 'object') return null;
  const skill = stored as Record<string, unknown>;
  if (typeof skill.name !== 'string') return null;
  return {
    name: skill.name,
    effect:
      typeof skill.effect === 'string'
        ? skill.effect
        : typeof skill.description === 'string'
          ? skill.description
          : '',
    ...(typeof skill.level === 'string' ? { level: skill.level } : {}),
    ...(typeof skill.maxLevel === 'number' && Number.isFinite(skill.maxLevel)
      ? { maxLevel: skill.maxLevel }
      : {}),
    ...(typeof skill.description === 'string' ? { description: skill.description } : {}),
  };
}

function normalizeSkillGroups(storedSkillGroups: unknown, defaults: Character): SkillGroup[] {
  const groups = Array.isArray(storedSkillGroups) ? storedSkillGroups : defaults.skillGroups;
  return groups.flatMap((storedGroup) => {
    if (!storedGroup || typeof storedGroup !== 'object') return [];
    const group = storedGroup as Record<string, unknown>;
    if (typeof group.className !== 'string') return [];
    const skills = Array.isArray(group.skills)
      ? group.skills.map(normalizeSkillRow).filter((skill): skill is SkillRow => skill !== null)
      : [];
    const normalizedGroup: SkillGroup = { className: group.className, skills };
    const defaultGroup = defaultSkillGroups.find(
      (candidate) => candidate.className === normalizedGroup.className,
    );
    return [
      {
        ...normalizedGroup,
        skills: normalizedGroup.skills.map((skill) => {
          const defaultSkill = defaultGroup?.skills.find(
            (candidate) => candidate.name === skill.name,
          );
          return defaultSkill?.maxLevel != null
            ? { ...skill, maxLevel: defaultSkill.maxLevel }
            : skill;
        }),
      },
    ];
  });
}

function normalizeSpellRow(stored: unknown): SpellRow | null {
  if (!stored || typeof stored !== 'object') return null;
  const spell = stored as Record<string, unknown>;
  if (typeof spell.name !== 'string') return null;
  return {
    name: spell.name,
    cost: normalizeString(spell.cost, ''),
    target: normalizeString(spell.target, ''),
    duration: spell.duration === 'Scene' ? 'Scene' : 'Instant',
    effect: normalizeString(spell.effect, ''),
  };
}

function normalizeSpellGroups(storedSpellGroups: unknown, defaults: Character): SpellGroup[] {
  const groups = Array.isArray(storedSpellGroups) ? storedSpellGroups : defaults.spellGroups;
  return groups.flatMap((storedGroup) => {
    if (!storedGroup || typeof storedGroup !== 'object') return [];
    const group = storedGroup as Record<string, unknown>;
    if (typeof group.className !== 'string') return [];
    return [
      {
        className: group.className,
        spells: Array.isArray(group.spells)
          ? group.spells.map(normalizeSpellRow).filter((spell): spell is SpellRow => spell !== null)
          : [],
      },
    ];
  });
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
  // Drop the legacy flat firstName / lastName / nickName before
  // spreading so they don't survive on the new Character shape; the
  // nested `name` object is rebuilt by normalizeName below.
  const withoutFlatName = { ...parsed };
  delete withoutFlatName.firstName;
  delete withoutFlatName.lastName;
  delete withoutFlatName.nickName;
  return {
    ...initialValue,
    ...withoutFlatName,
    name: normalizeName(parsed, initialValue.name),
    initiative: normalizeNumber(parsed.initiative, initialValue.initiative),
    defense: normalizeNumber(parsed.defense, initialValue.defense),
    defenseTemp: normalizeNullableNumber(parsed.defenseTemp, initialValue.defenseTemp),
    magicDefense: normalizeNumber(parsed.magicDefense, initialValue.magicDefense),
    magicDefenseTemp: normalizeNullableNumber(
      parsed.magicDefenseTemp,
      initialValue.magicDefenseTemp,
    ),
    fabulaPoints: normalizeNumber(parsed.fabulaPoints, initialValue.fabulaPoints),
    inventoryPoints: normalizeNumber(parsed.inventoryPoints, initialValue.inventoryPoints),
    currentHP: normalizeNumber(parsed.currentHP, initialValue.currentHP),
    currentMP: normalizeNumber(parsed.currentMP, initialValue.currentMP),
    currentXP: normalizeNumber(parsed.currentXP, initialValue.currentXP),
    totalXP: normalizeNumber(parsed.totalXP, initialValue.totalXP),
    level: normalizeNumber(parsed.level, initialValue.level),
    zenit:
      typeof parsed.zenit === 'number'
        ? parsed.zenit
        : typeof legacyZenit === 'number'
          ? legacyZenit
          : initialValue.zenit,
    attributes: normalizeAttributes(parsed.attributes, initialValue.attributes),
    bonds: normalizeBonds(parsed.bonds, initialValue.bonds),
    classes: normalizeClasses(parsed.classes, initialValue.classes),
    skillGroups: normalizeSkillGroups(parsed.skillGroups, initialValue),
    spellGroups: normalizeSpellGroups(parsed.spellGroups, initialValue),
    backstoryPrompts: normalizeBackstoryPrompts(
      parsed.backstoryPrompts,
      options.oldBackstoryAnswers,
    ),
    equipment: normalizeEquipment(parsed.equipment),
    backpack: normalizeBackpack(parsed.backpack),
    statusEffects: normalizeStatusEffects(parsed.statusEffects ?? options.oldStatusEffects),
    traits: normalizeTraits(parsed.traits, initialValue.traits),
    notes: normalizeString(parsed.notes, initialValue.notes),
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
