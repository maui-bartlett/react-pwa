import { ConvexError, v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import {
  canReadCharacter,
  canWriteCanonicalCharacter,
  getActiveUserProfile,
  getOrCreateUserProfile,
  requireCharacterOwner,
} from './lib/auth';
import { FABULA_ULTIMA_TYPE, isActiveForProfile, withFabulaMeta } from './lib/fabulaMeta';

export const listMine = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const profile = await getActiveUserProfile(ctx);
    if (!profile) return [];

    const characters = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId_metaGameSystem', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.gameSystem', FABULA_ULTIMA_TYPE),
      )
      .collect();
    return args.includeArchived ? characters : characters.filter((c) => !c.archivedAt);
  },
});

export const getActiveMine = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getActiveUserProfile(ctx);
    if (!profile) return null;

    const characters = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId_metaGameSystem', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.gameSystem', FABULA_ULTIMA_TYPE),
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
    name: v.string(),
    portraitUrl: v.optional(v.string()),
    schemaVersion: v.number(),
    characterState: v.any(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const now = Date.now();
    return await ctx.db.insert('characters', {
      ownerUserId: profile._id,
      meta: withFabulaMeta({ activeForUserProfileId: profile._id }),
      name: args.name,
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
    name: v.string(),
    schemaVersion: v.number(),
    characterState: v.any(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const now = Date.now();
    return await ctx.db.insert('characters', {
      ownerUserId: profile._id,
      meta: withFabulaMeta({ activeForUserProfileId: profile._id }),
      name: args.name,
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
    const now = Date.now();

    const characters = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId_metaGameSystem', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.gameSystem', FABULA_ULTIMA_TYPE),
      )
      .collect();

    await Promise.all(
      characters.map((character) => {
        const activeForUserProfileId = character._id === target._id ? profile._id : undefined;
        return ctx.db.patch(character._id, {
          meta: withFabulaMeta({
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
    name: v.optional(v.string()),
    portraitUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCharacterOwner(ctx, args.characterId);
    await ctx.db.patch(args.characterId, {
      name: args.name,
      portraitUrl: args.portraitUrl,
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
      const hasNestedStatusEffects =
        state && typeof state === 'object' && 'statusEffects' in state;

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
