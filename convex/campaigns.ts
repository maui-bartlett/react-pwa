import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  canWriteCampaignCharacterState,
  getOrCreateUserProfile,
  requireActiveUserProfile,
  requireCampaignGM,
  requireCampaignMember,
  requireCharacterOwner,
} from './lib/auth';
import { withGameSystemMeta } from './lib/fabulaMeta';

/** Generic check that a campaign document is tagged with a game system. */
function hasGameSystem(document: { meta?: { gameSystem?: string } } | null | undefined) {
  return Boolean(document?.meta?.gameSystem);
}

export const listMine = query({
  args: { gameSystem: v.string(), includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const profile = await requireActiveUserProfile(ctx);
    const memberships = await ctx.db
      .query('campaignMembers')
      .withIndex('by_userId', (q) => q.eq('userId', profile._id))
      .collect();

    const campaigns = await Promise.all(
      memberships
        .filter((m) => m.status === 'active')
        .map(async (m) => {
          const campaign = await ctx.db.get(m.campaignId);
          return campaign ? { campaign, membership: m } : null;
        }),
    );

    return campaigns.filter(
      (item) =>
        item &&
        item.campaign.meta?.gameSystem === args.gameSystem &&
        (args.includeArchived || item.campaign.status !== 'archived'),
    );
  },
});

export const get = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    await requireCampaignMember(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.archivedAt || !hasGameSystem(campaign)) {
      throw new ConvexError('CAMPAIGN_NOT_FOUND');
    }
    return campaign;
  },
});

export const create = mutation({
  args: {
    gameSystem: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const now = Date.now();
    const campaignId = await ctx.db.insert('campaigns', {
      ownerUserId: profile._id,
      meta: withGameSystemMeta(args.gameSystem),
      name: args.name,
      description: args.description,
      status: 'active',
      settings: args.settings,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert('campaignMembers', {
      campaignId,
      userId: profile._id,
      role: 'gm',
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return campaignId;
  },
});

export const update = mutation({
  args: {
    campaignId: v.id('campaigns'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireCampaignGM(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    await ctx.db.patch(args.campaignId, {
      name: args.name,
      description: args.description,
      settings: args.settings,
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    await requireCampaignGM(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    await ctx.db.patch(args.campaignId, {
      status: 'archived',
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const restore = mutation({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    await requireCampaignGM(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    await ctx.db.patch(args.campaignId, {
      status: 'active',
      archivedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const listMembers = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    await requireCampaignMember(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    return await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId', (q) => q.eq('campaignId', args.campaignId))
      .collect();
  },
});

export const manualAddMember = mutation({
  args: {
    campaignId: v.id('campaigns'),
    userId: v.id('userProfiles'),
    role: v.union(v.literal('gm'), v.literal('player'), v.literal('observer')),
  },
  handler: async (ctx, args) => {
    const gm = await requireCampaignGM(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    const now = Date.now();
    const existing = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId_userId', (q) =>
        q.eq('campaignId', args.campaignId).eq('userId', args.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        status: 'active',
        invitedByUserId: gm.userId,
        joinedAt: existing.joinedAt ?? now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert('campaignMembers', {
      campaignId: args.campaignId,
      userId: args.userId,
      role: args.role,
      status: 'active',
      invitedByUserId: gm.userId,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeMember = mutation({
  args: { campaignId: v.id('campaigns'), userId: v.id('userProfiles') },
  handler: async (ctx, args) => {
    await requireCampaignGM(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    const member = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId_userId', (q) =>
        q.eq('campaignId', args.campaignId).eq('userId', args.userId),
      )
      .unique();
    if (member) await ctx.db.patch(member._id, { status: 'removed', updatedAt: Date.now() });
  },
});

export const setMemberRole = mutation({
  args: {
    campaignId: v.id('campaigns'),
    userId: v.id('userProfiles'),
    role: v.union(v.literal('gm'), v.literal('player'), v.literal('observer')),
  },
  handler: async (ctx, args) => {
    await requireCampaignGM(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    const member = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId_userId', (q) =>
        q.eq('campaignId', args.campaignId).eq('userId', args.userId),
      )
      .unique();
    if (!member) throw new ConvexError('CAMPAIGN_MEMBER_NOT_FOUND');
    await ctx.db.patch(member._id, { role: args.role, updatedAt: Date.now() });
  },
});

export const addCharacter = mutation({
  args: {
    campaignId: v.id('campaigns'),
    characterId: v.id('characters'),
    role: v.union(v.literal('playerCharacter'), v.literal('npc'), v.literal('companion')),
    campaignState: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const profile = await requireActiveUserProfile(ctx);
    const character = await requireCharacterOwner(ctx, args.characterId);
    const member = await requireCampaignMember(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    if (member.role === 'observer') throw new ConvexError('FORBIDDEN');
    const now = Date.now();
    return await ctx.db.insert('campaignCharacters', {
      campaignId: args.campaignId,
      characterId: args.characterId,
      ownerUserId: character.ownerUserId,
      addedByUserId: profile._id,
      role: args.role,
      campaignState: args.campaignState,
      permissions: {
        gmCanEditCanonicalState: false,
        playersCanView: true,
      },
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeCharacter = mutation({
  args: { campaignCharacterId: v.id('campaignCharacters') },
  handler: async (ctx, args) => {
    const profile = await requireActiveUserProfile(ctx);
    const link = await ctx.db.get(args.campaignCharacterId);
    if (!link || link.removedAt) return;
    const member = await requireCampaignMember(ctx, link.campaignId);
    const campaign = await ctx.db.get(link.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    if (link.ownerUserId !== profile._id && member.role !== 'gm')
      throw new ConvexError('FORBIDDEN');
    await ctx.db.patch(link._id, { removedAt: Date.now(), updatedAt: Date.now() });
  },
});

export const listCharacters = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    await requireCampaignMember(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    return await ctx.db
      .query('campaignCharacters')
      .withIndex('by_campaignId', (q) => q.eq('campaignId', args.campaignId))
      .collect();
  },
});

export const updateCampaignCharacterState = mutation({
  args: {
    campaignCharacterId: v.id('campaignCharacters'),
    campaignState: v.any(),
  },
  handler: async (ctx, args) => {
    if (!(await canWriteCampaignCharacterState(ctx, args.campaignCharacterId))) {
      throw new ConvexError('FORBIDDEN');
    }
    const link = await ctx.db.get(args.campaignCharacterId);
    if (!link) throw new ConvexError('CAMPAIGN_CHARACTER_NOT_FOUND');
    const campaign = await ctx.db.get(link.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    await ctx.db.patch(args.campaignCharacterId, {
      campaignState: args.campaignState,
      updatedAt: Date.now(),
    });
  },
});

export const setCampaignCharacterPermissions = mutation({
  args: {
    campaignCharacterId: v.id('campaignCharacters'),
    permissions: v.object({
      gmCanEditCanonicalState: v.optional(v.boolean()),
      playersCanView: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.campaignCharacterId);
    if (!link || link.removedAt) throw new ConvexError('CAMPAIGN_CHARACTER_NOT_FOUND');
    await requireCampaignGM(ctx, link.campaignId);
    const campaign = await ctx.db.get(link.campaignId);
    if (!hasGameSystem(campaign)) throw new ConvexError('CAMPAIGN_NOT_FOUND');
    await ctx.db.patch(link._id, { permissions: args.permissions, updatedAt: Date.now() });
  },
});
