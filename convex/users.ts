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
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    await ctx.db.patch(profile._id, {
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      settings: args.settings ?? profile.settings ?? {},
      updatedAt: Date.now(),
    });
    return await ctx.db.get(profile._id);
  },
});

export const getCurrentTheme = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await getAuthUser(ctx);
    if (!authUser) return null;

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_authUserId', (q) => q.eq('authUserId', authUser._id))
      .unique();

    if (!profile || profile.archivedAt) return null;

    const currentTheme = profile.settings?.currentTheme;
    return currentTheme === 'dark' || currentTheme === 'light' ? currentTheme : null;
  },
});

export const updateCurrentTheme = mutation({
  args: {
    currentTheme: v.union(v.literal('dark'), v.literal('light')),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const settings =
      profile.settings && typeof profile.settings === 'object' && !Array.isArray(profile.settings)
        ? profile.settings
        : {};

    await ctx.db.patch(profile._id, {
      settings: { ...settings, currentTheme: args.currentTheme },
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
