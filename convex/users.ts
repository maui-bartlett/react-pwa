import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getAuthUser, getOrCreateUserProfile, requireActiveUserProfile } from './lib/auth';

export const me = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await getAuthUser(ctx);
    if (!authUser) return null;
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_authUserId', (q) => q.eq('authUserId', authUser._id))
      .unique();
    return { authUser, profile };
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    await ctx.db.patch(profile._id, {
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(profile._id);
  },
});

export const archiveMyAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireActiveUserProfile(ctx);
    await ctx.db.patch(profile._id, {
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireActiveUserProfile(ctx);
    return await ctx.db
      .query('userSettings')
      .withIndex('by_userId', (q) => q.eq('userId', profile._id))
      .unique();
  },
});

export const updateSettings = mutation({
  args: {
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_userId', (q) => q.eq('userId', profile._id))
      .unique();
    const now = Date.now();

    if (!existing) {
      const id = await ctx.db.insert('userSettings', {
        userId: profile._id,
        settings: args.settings,
        createdAt: now,
        updatedAt: now,
      });
      return await ctx.db.get(id);
    }

    if (existing.userId !== profile._id) throw new ConvexError('FORBIDDEN');
    await ctx.db.patch(existing._id, { settings: args.settings, updatedAt: now });
    return await ctx.db.get(existing._id);
  },
});
