import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  canReadCharacter,
  canWriteCanonicalCharacter,
  getActiveUserProfile,
  getOrCreateUserProfile,
  requireCharacterOwner,
} from './lib/auth';
import { FABULA_ULTIMA_TYPE, isActiveForProfile, withFabulaMeta } from './lib/fabulaMeta';

const statusEffectsValidator = v.record(v.string(), v.boolean());

export const listMine = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const profile = await getActiveUserProfile(ctx);
    if (!profile) return [];

    const characters = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId_metaType', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.type', FABULA_ULTIMA_TYPE),
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
      .withIndex('by_ownerUserId_metaType', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.type', FABULA_ULTIMA_TYPE),
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
    summary: v.optional(v.string()),
    portraitUrl: v.optional(v.string()),
    schemaVersion: v.number(),
    characterState: v.any(),
    statusEffects: v.optional(statusEffectsValidator),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const now = Date.now();
    return await ctx.db.insert('characters', {
      ownerUserId: profile._id,
      meta: withFabulaMeta({ activeForUserProfileId: profile._id }),
      name: args.name,
      summary: args.summary,
      portraitUrl: args.portraitUrl,
      schemaVersion: args.schemaVersion,
      characterState: args.characterState,
      statusEffects: args.statusEffects,
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
    statusEffects: v.optional(statusEffectsValidator),
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
      statusEffects: args.statusEffects,
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
      .withIndex('by_ownerUserId_metaType', (q) =>
        q.eq('ownerUserId', profile._id).eq('meta.type', FABULA_ULTIMA_TYPE),
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
    statusEffects: v.optional(statusEffectsValidator),
  },
  handler: async (ctx, args) => {
    if (!(await canWriteCanonicalCharacter(ctx, args.characterId)))
      throw new ConvexError('FORBIDDEN');
    await ctx.db.patch(args.characterId, {
      schemaVersion: args.schemaVersion,
      characterState: args.characterState,
      statusEffects: args.statusEffects,
      updatedAt: Date.now(),
    });
  },
});

export const updateStatusEffects = mutation({
  args: {
    characterId: v.id('characters'),
    statusEffects: statusEffectsValidator,
  },
  handler: async (ctx, args) => {
    if (!(await canWriteCanonicalCharacter(ctx, args.characterId)))
      throw new ConvexError('FORBIDDEN');
    await ctx.db.patch(args.characterId, {
      statusEffects: args.statusEffects,
      updatedAt: Date.now(),
    });
  },
});

export const updateMetadata = mutation({
  args: {
    characterId: v.id('characters'),
    name: v.optional(v.string()),
    summary: v.optional(v.string()),
    portraitUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCharacterOwner(ctx, args.characterId);
    await ctx.db.patch(args.characterId, {
      name: args.name,
      summary: args.summary,
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
