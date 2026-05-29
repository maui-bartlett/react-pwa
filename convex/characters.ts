import { ConvexError, v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import {
  canReadCharacter,
  canWriteCanonicalCharacter,
  getActiveUserProfile,
  getOrCreateUserProfile,
  requireCharacterOwner,
} from './lib/auth';
import { isActiveForProfile, withGameSystemMeta } from './lib/fabulaMeta';

const TITLE_SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'into',
  'like',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

function titleCaseWord(word: string, index: number, words: string[]) {
  const lower = word.toLowerCase();
  const isEdgeWord = index === 0 || index === words.length - 1;
  if (!isEdgeWord && TITLE_SMALL_WORDS.has(lower)) return lower;
  if (lower === 'i') return 'I';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleCaseSegment(segment: string) {
  const words = segment.split(/(\s+)/);
  const wordOnly = words.filter((part) => !/^\s+$/.test(part) && part.length > 0);
  let wordIndex = 0;

  return words
    .map((part) => {
      if (/^\s+$/.test(part) || part.length === 0) return part;
      const titled = titleCaseWord(part, wordIndex, wordOnly);
      wordIndex += 1;
      return titled;
    })
    .join('');
}

function titleCaseLabel(label: string) {
  return label
    .trim()
    .split(/(-)/)
    .map((part) => (part === '-' ? part : titleCaseSegment(part)))
    .join('');
}

export const listMine = query({
  args: { gameSystem: v.string(), includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const profile = await getActiveUserProfile(ctx);
    if (!profile) return [];

    const characters = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId_metaGameSystem', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.gameSystem', args.gameSystem),
      )
      .collect();
    return args.includeArchived ? characters : characters.filter((c) => !c.archivedAt);
  },
});

export const getActiveMine = query({
  args: { gameSystem: v.string() },
  handler: async (ctx, args) => {
    const profile = await getActiveUserProfile(ctx);
    if (!profile) return null;

    const characters = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId_metaGameSystem', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.gameSystem', args.gameSystem),
      )
      .collect();

    return (
      characters.find(
        (character) => !character.archivedAt && isActiveForProfile(character, profile._id),
      ) ??
      characters.find((character) => !character.archivedAt) ??
      null
    );
  },
});

export const get = query({
  args: { characterId: v.id('characters') },
  handler: async (ctx, args) => {
    const character = await canReadCharacter(ctx, args.characterId);
    if (!character) throw new ConvexError('CHARACTER_NOT_FOUND');
    return character;
  },
});

export const create = mutation({
  args: {
    gameSystem: v.string(),
    portraitUrl: v.optional(v.string()),
    schemaVersion: v.number(),
    characterState: v.any(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const now = Date.now();
    return await ctx.db.insert('characters', {
      ownerUserId: profile._id,
      meta: withGameSystemMeta(args.gameSystem, { activeForUserProfileId: profile._id }),
      portraitUrl: args.portraitUrl,
      schemaVersion: args.schemaVersion,
      characterState: args.characterState,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createFromLocalImport = mutation({
  args: {
    gameSystem: v.string(),
    schemaVersion: v.number(),
    characterState: v.any(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const now = Date.now();
    return await ctx.db.insert('characters', {
      ownerUserId: profile._id,
      meta: withGameSystemMeta(args.gameSystem, { activeForUserProfileId: profile._id }),
      schemaVersion: args.schemaVersion,
      characterState: args.characterState,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setActiveMine = mutation({
  args: { characterId: v.id('characters') },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const target = await requireCharacterOwner(ctx, args.characterId);
    const targetGameSystem = target.meta?.gameSystem;
    if (!targetGameSystem) throw new ConvexError('CHARACTER_MISSING_GAME_SYSTEM');
    const now = Date.now();

    // Only clear the active flag on the *same* game system's characters
    // — switching the active AL character shouldn't bump a FabU one and
    // vice versa.
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId_metaGameSystem', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.gameSystem', targetGameSystem),
      )
      .collect();

    await Promise.all(
      characters.map((character) => {
        const activeForUserProfileId = character._id === target._id ? profile._id : undefined;
        return ctx.db.patch(character._id, {
          meta: withGameSystemMeta(targetGameSystem, {
            ...character.meta,
            activeForUserProfileId,
          }),
          updatedAt: character._id === target._id ? now : character.updatedAt,
        });
      }),
    );

    return target._id;
  },
});

export const updateState = mutation({
  args: {
    characterId: v.id('characters'),
    schemaVersion: v.number(),
    characterState: v.any(),
  },
  handler: async (ctx, args) => {
    if (!(await canWriteCanonicalCharacter(ctx, args.characterId)))
      throw new ConvexError('FORBIDDEN');
    await ctx.db.patch(args.characterId, {
      schemaVersion: args.schemaVersion,
      characterState: args.characterState,
      updatedAt: Date.now(),
    });
  },
});

export const updateMetadata = mutation({
  args: {
    characterId: v.id('characters'),
    portraitUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCharacterOwner(ctx, args.characterId);
    await ctx.db.patch(args.characterId, {
      portraitUrl: args.portraitUrl,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Cross-app character rename. Convex doesn't carry a top-level `name`
 * column anymore — every character keeps its name inside
 * `characterState.character`. The exact field is per-app:
 *   - avatar-legends: a flat `name: string`
 *   - fabula-ultima:  a nested `name: { firstName, lastName, nickName }`
 *     where the dialog rename targets the `nickName` (the most
 *     "identity" slot users tend to edit).
 * Anything else just no-ops gracefully.
 */
export const renameCharacter = mutation({
  args: { characterId: v.id('characters'), name: v.string() },
  handler: async (ctx, args) => {
    const character = await requireCharacterOwner(ctx, args.characterId);
    const state =
      character.characterState && typeof character.characterState === 'object'
        ? (character.characterState as Record<string, unknown>)
        : {};
    const inner =
      state.character && typeof state.character === 'object'
        ? (state.character as Record<string, unknown>)
        : null;
    if (!inner) return;
    const gameSystem = character.meta?.gameSystem;
    const trimmed = args.name.trim();
    let nextInner: Record<string, unknown> = inner;
    if (gameSystem === 'fabula-ultima') {
      const existingName =
        inner.name && typeof inner.name === 'object' ? (inner.name as Record<string, unknown>) : {};
      nextInner = { ...inner, name: { ...existingName, nickName: trimmed } };
    } else {
      // Default (covers avatar-legends + any future flat-name schemas).
      nextInner = { ...inner, name: trimmed };
    }
    await ctx.db.patch(args.characterId, {
      characterState: { ...state, character: nextInner },
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: { characterId: v.id('characters') },
  handler: async (ctx, args) => {
    await requireCharacterOwner(ctx, args.characterId);
    await ctx.db.patch(args.characterId, { archivedAt: Date.now(), updatedAt: Date.now() });
  },
});

export const restore = mutation({
  args: { characterId: v.id('characters') },
  handler: async (ctx, args) => {
    await requireCharacterOwner(ctx, args.characterId);
    await ctx.db.patch(args.characterId, { archivedAt: undefined, updatedAt: Date.now() });
  },
});

export const listCampaignsForCharacter = query({
  args: { characterId: v.id('characters') },
  handler: async (ctx, args) => {
    await requireCharacterOwner(ctx, args.characterId);
    return await ctx.db
      .query('campaignCharacters')
      .withIndex('by_characterId', (q) => q.eq('characterId', args.characterId))
      .collect();
  },
});

/**
 * One-shot migration for Avatar Legends character data:
 *   - `characterState.character.age` becomes a plain number (parsing
 *     legacy strings like "Age 32" / "32 years"). Falls back to the
 *     leading integer; rows with no digits in the string are left as
 *     they were.
 *   - Each `characterState.character.techniques[i].element` is renamed
 *     to `type` (legacy `element` key is dropped).
 *   - `characterState.schemaVersion` is bumped to 2 once the row is
 *     in the new shape.
 * Safe to re-run on already-migrated rows. FabU rows skip both
 * transforms (their characterState shape doesn't include these
 * fields). Invoke after deploy:
 *   npx convex run characters:migrateAvatarLegendsShape
 */
export const migrateAvatarLegendsShape = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('characters').collect();
    let migrated = 0;
    for (const row of rows) {
      if (row.meta?.gameSystem !== 'avatar-legends') continue;
      const state =
        row.characterState && typeof row.characterState === 'object'
          ? (row.characterState as Record<string, unknown>)
          : null;
      if (!state) continue;
      const inner =
        state.character && typeof state.character === 'object'
          ? (state.character as Record<string, unknown>)
          : null;
      if (!inner) continue;

      let touched = false;

      // age: string -> number
      let nextAge: unknown = inner.age;
      if (typeof inner.age === 'string') {
        const match = inner.age.match(/-?\d+/);
        if (match) {
          const parsed = parseInt(match[0], 10);
          if (Number.isFinite(parsed)) {
            nextAge = parsed;
            touched = true;
          }
        }
      }

      // techniques[i].element -> techniques[i].type
      let nextTechniques: unknown = inner.techniques;
      if (Array.isArray(inner.techniques)) {
        const next = (inner.techniques as Array<Record<string, unknown>>).map((tech) => {
          const hasElement = Object.prototype.hasOwnProperty.call(tech, 'element');
          const hasType = typeof tech.type === 'string';
          if (!hasElement && hasType) return tech;
          const { element: legacyElement, ...rest } = tech as { element?: unknown } & Record<
            string,
            unknown
          >;
          const resolvedType =
            typeof tech.type === 'string'
              ? tech.type
              : typeof legacyElement === 'string'
                ? legacyElement
                : 'basic';
          touched = true;
          return { ...rest, type: resolvedType };
        });
        if (touched) nextTechniques = next;
      }

      if (!touched && state.schemaVersion === 2) continue;

      const nextInner: Record<string, unknown> = {
        ...inner,
        age: nextAge,
        techniques: nextTechniques,
      };
      await ctx.db.patch(row._id, {
        characterState: { ...state, schemaVersion: 2, character: nextInner },
        updatedAt: Date.now(),
      });
      migrated += 1;
    }
    return { scanned: rows.length, migrated };
  },
});

/**
 * One-shot migration for Avatar Legends v3 character data:
 *   - techniques: legacy `category` -> `approach`, `title` -> `name`,
 *     `body` -> `description`
 *   - notes/inventory: legacy `title` -> `name`, `body` -> `description`
 *   - `characterState.schemaVersion` and the document `schemaVersion`
 *     are bumped to 3 once the row is in the v3 shape.
 * Safe to re-run on already-migrated rows.
 *   npx convex run characters:migrateAvatarLegendsV3
 */
export const migrateAvatarLegendsV3 = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('characters').collect();
    let migrated = 0;
    for (const row of rows) {
      if (row.meta?.gameSystem !== 'avatar-legends') continue;
      const state =
        row.characterState && typeof row.characterState === 'object'
          ? (row.characterState as Record<string, unknown>)
          : null;
      if (!state) continue;
      const inner =
        state.character && typeof state.character === 'object'
          ? (state.character as Record<string, unknown>)
          : null;
      if (!inner) continue;

      let touched = false;

      const migrateTechnique = (tech: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...tech };
        if (typeof next.approach !== 'string' && typeof tech.category === 'string') {
          next.approach = tech.category;
          touched = true;
        }
        if (typeof next.name !== 'string' && typeof tech.title === 'string') {
          next.name = tech.title;
          touched = true;
        }
        if (typeof next.description !== 'string' && typeof tech.body === 'string') {
          next.description = tech.body;
          touched = true;
        }
        if ('category' in next) {
          delete next.category;
          touched = true;
        }
        if ('title' in next) {
          delete next.title;
          touched = true;
        }
        if ('body' in next) {
          delete next.body;
          touched = true;
        }
        return next;
      };

      const migrateJournalEntry = (entry: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...entry };
        if (typeof next.name !== 'string' && typeof entry.title === 'string') {
          next.name = entry.title;
          touched = true;
        }
        if (typeof next.description !== 'string' && typeof entry.body === 'string') {
          next.description = entry.body;
          touched = true;
        }
        if ('title' in next) {
          delete next.title;
          touched = true;
        }
        if ('body' in next) {
          delete next.body;
          touched = true;
        }
        return next;
      };

      const nextInner: Record<string, unknown> = { ...inner };
      if (Array.isArray(inner.techniques)) {
        nextInner.techniques = (inner.techniques as Array<Record<string, unknown>>).map(
          migrateTechnique,
        );
      }
      if (Array.isArray(inner.notes)) {
        nextInner.notes = (inner.notes as Array<Record<string, unknown>>).map(migrateJournalEntry);
      }
      if (Array.isArray(inner.inventory)) {
        nextInner.inventory = (inner.inventory as Array<Record<string, unknown>>).map(
          migrateJournalEntry,
        );
      }

      const stateVersion = typeof state.schemaVersion === 'number' ? state.schemaVersion : 0;
      const rowVersion = typeof row.schemaVersion === 'number' ? row.schemaVersion : 0;
      if (!touched && stateVersion >= 3 && rowVersion >= 3) continue;

      await ctx.db.patch(row._id, {
        schemaVersion: 3,
        characterState: { ...state, schemaVersion: 3, character: nextInner },
        updatedAt: Date.now(),
      });
      migrated += 1;
    }
    return { scanned: rows.length, migrated };
  },
});

/**
 * One-shot migration: drop the root `name` column from every character
 * and reshape `characterState.character` so the three flat name fields
 * (`firstName`, `lastName`, `nickName`) live nested under a single
 * `name` object. Safe to re-run — no-ops on rows that are already in
 * the new shape. Invoke once after deploy:
 *   npx convex run characters:migrateCharacterName
 */
export const migrateCharacterName = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('characters').collect();
    let migrated = 0;
    for (const row of rows) {
      const legacyRow = row as typeof row & { name?: unknown };
      const hasRootName = legacyRow.name !== undefined;

      const state = legacyRow.characterState as Record<string, unknown> | null | undefined;
      const character = state && typeof state === 'object' ? state.character : undefined;
      const hasCharacter = character && typeof character === 'object';

      // Detect flat legacy shape inside characterState.character.
      const flatChar = hasCharacter ? (character as Record<string, unknown>) : null;
      const hasNested = flatChar && flatChar.name && typeof flatChar.name === 'object';
      const hasFlat =
        flatChar &&
        (typeof flatChar.firstName === 'string' ||
          typeof flatChar.lastName === 'string' ||
          typeof flatChar.nickName === 'string');

      if (!hasRootName && !hasFlat && hasNested) continue;
      if (!hasRootName && !hasFlat && !hasNested && !hasCharacter) continue;

      const patch: Record<string, unknown> = {};

      if (hasRootName) patch.name = undefined;

      if (flatChar && (hasFlat || !hasNested)) {
        const { firstName, lastName, nickName, name: existingName, ...rest } = flatChar;
        // Prefer an already-nested `name` if present; otherwise build
        // it from the flat fields. Missing pieces fall back to empty
        // strings so the shape stays well-formed.
        const existingNested =
          existingName && typeof existingName === 'object'
            ? (existingName as Record<string, unknown>)
            : {};
        const nestedName = {
          firstName:
            typeof existingNested.firstName === 'string'
              ? existingNested.firstName
              : typeof firstName === 'string'
                ? firstName
                : '',
          lastName:
            typeof existingNested.lastName === 'string'
              ? existingNested.lastName
              : typeof lastName === 'string'
                ? lastName
                : '',
          nickName:
            typeof existingNested.nickName === 'string'
              ? existingNested.nickName
              : typeof nickName === 'string'
                ? nickName
                : '',
        };
        const nextCharacter = { ...rest, name: nestedName };
        patch.characterState = { ...(state as Record<string, unknown>), character: nextCharacter };
      }

      if (Object.keys(patch).length === 0) continue;
      await ctx.db.patch(row._id, patch);
      migrated += 1;
    }
    return { scanned: rows.length, migrated };
  },
});

/**
 * One-shot migration: rename the legacy `meta.type` field to
 * `meta.gameSystem` on every character document. The schema (and all
 * code) was renamed previously, but rows saved before that change
 * still carry the old key; this scan rewrites them in place. Run via:
 *   npx convex run characters:migrateLegacyMetaType
 * Safe to re-run — no-ops on rows that are already on `meta.gameSystem`.
 */
export const migrateLegacyMetaType = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('characters').collect();
    let migrated = 0;
    for (const row of rows) {
      const legacyMeta = row.meta as
        | { type?: unknown; gameSystem?: string; activeForUserProfileId?: unknown }
        | undefined;
      if (!legacyMeta || legacyMeta.type === undefined) continue;
      // Promote the legacy `type` value to `gameSystem` only when
      // `gameSystem` isn't already set (prefer the newer value if both
      // are present), then drop `type` from the stored object.
      const { type, ...rest } = legacyMeta as { type?: unknown } & Record<string, unknown>;
      const nextMeta = {
        ...rest,
        gameSystem:
          typeof legacyMeta.gameSystem === 'string' && legacyMeta.gameSystem.length > 0
            ? legacyMeta.gameSystem
            : typeof type === 'string'
              ? type
              : undefined,
      };
      await ctx.db.patch(row._id, { meta: nextMeta });
      migrated += 1;
    }
    return { scanned: rows.length, migrated };
  },
});

/**
 * One-shot migration: Avatar Legends stores playbook/class names in
 * title case while the sheet renders them as all caps. Safe to re-run.
 */
export const normalizeAvatarLegendsClassNames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('characters').collect();
    let migrated = 0;
    for (const row of rows) {
      if (row.meta?.gameSystem !== 'avatar-legends') continue;
      const state =
        row.characterState && typeof row.characterState === 'object'
          ? (row.characterState as Record<string, unknown>)
          : null;
      const inner =
        state?.character && typeof state.character === 'object'
          ? (state.character as Record<string, unknown>)
          : null;
      if (!state || !inner || typeof inner.className !== 'string') continue;
      const nextClassName = titleCaseLabel(inner.className);
      if (nextClassName === inner.className) continue;

      await ctx.db.patch(row._id, {
        characterState: {
          ...state,
          character: { ...inner, className: nextClassName },
        },
        updatedAt: Date.now(),
      });
      migrated += 1;
    }
    return { scanned: rows.length, migrated };
  },
});

/**
 * One-shot migration: strip the legacy `summary` and root-level
 * `statusEffects` fields from every character document, plus the
 * duplicated `statusEffects` that used to sit alongside `character`
 * inside `characterState`. Run from the Convex dashboard / CLI once
 * after this PR deploys so existing rows match the new schema:
 *   npx convex run characters:cleanupLegacyFields
 * Safe to re-run — no-ops on rows that are already clean.
 */
export const cleanupLegacyFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('characters').collect();
    let cleaned = 0;
    for (const row of rows) {
      const legacy = row as typeof row & {
        summary?: unknown;
        statusEffects?: unknown;
      };
      const hasSummary = legacy.summary !== undefined;
      const hasRootStatusEffects = legacy.statusEffects !== undefined;
      const state = legacy.characterState as
        | { statusEffects?: unknown; [key: string]: unknown }
        | null
        | undefined;
      const hasNestedStatusEffects = state && typeof state === 'object' && 'statusEffects' in state;

      if (!hasSummary && !hasRootStatusEffects && !hasNestedStatusEffects) continue;

      const patch: Record<string, unknown> = {};
      if (hasSummary) patch.summary = undefined;
      if (hasRootStatusEffects) patch.statusEffects = undefined;
      if (hasNestedStatusEffects) {
        // Re-write characterState without the redundant top-level
        // statusEffects (the canonical copy lives under
        // characterState.character.statusEffects).
        const { statusEffects: _stripped, ...rest } = state as Record<string, unknown>;
        patch.characterState = rest;
      }

      await ctx.db.patch(row._id, patch);
      cleaned += 1;
    }
    return { scanned: rows.length, cleaned };
  },
});
