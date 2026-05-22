import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  getOrCreateUserProfile,
  requireActiveUserProfile,
  requireCampaignGM,
} from './lib/auth';
import { generateJoinCode, hashSecret } from './lib/hash';

export const createJoinCode = mutation({
  args: {
    campaignId: v.id('campaigns'),
    roleGranted: v.union(v.literal('player'), v.literal('observer')),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const gm = await requireCampaignGM(ctx, args.campaignId);
    const code = generateJoinCode();
    const codeHash = await hashSecret(code);
    await ctx.db.insert('campaignJoinCodes', {
      campaignId: args.campaignId,
      codeHash,
      createdByUserId: gm.userId,
      roleGranted: args.roleGranted,
      expiresAt: args.expiresAt,
      maxUses: args.maxUses,
      useCount: 0,
      createdAt: Date.now(),
    });
    return { code };
  },
});

export const revokeJoinCode = mutation({
  args: { joinCodeId: v.id('campaignJoinCodes') },
  handler: async (ctx, args) => {
    const joinCode = await ctx.db.get(args.joinCodeId);
    if (!joinCode) return;
    await requireCampaignGM(ctx, joinCode.campaignId);
    await ctx.db.delete(args.joinCodeId);
  },
});

export const joinByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const codeHash = await hashSecret(args.code.trim().toUpperCase());
    const joinCode = await ctx.db
      .query('campaignJoinCodes')
      .withIndex('by_codeHash', (q) => q.eq('codeHash', codeHash))
      .unique();
    const now = Date.now();
    if (!joinCode) throw new ConvexError('JOIN_CODE_NOT_FOUND');
    if (joinCode.expiresAt && joinCode.expiresAt < now) {
      await ctx.db.delete(joinCode._id);
      throw new ConvexError('JOIN_CODE_EXPIRED');
    }
    if (joinCode.maxUses != null && joinCode.useCount >= joinCode.maxUses) {
      await ctx.db.delete(joinCode._id);
      throw new ConvexError('JOIN_CODE_EXHAUSTED');
    }

    const existing = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId_userId', (q) =>
        q.eq('campaignId', joinCode.campaignId).eq('userId', profile._id),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: existing.role === 'gm' ? 'gm' : joinCode.roleGranted,
        status: 'active',
        joinedAt: existing.joinedAt ?? now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('campaignMembers', {
        campaignId: joinCode.campaignId,
        userId: profile._id,
        role: joinCode.roleGranted,
        status: 'active',
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(joinCode._id, { useCount: joinCode.useCount + 1 });
    return joinCode.campaignId;
  },
});

export const createEmailInvite = mutation({
  args: {
    campaignId: v.id('campaigns'),
    email: v.optional(v.string()),
    invitedUserId: v.optional(v.id('userProfiles')),
    roleGranted: v.union(v.literal('gm'), v.literal('player'), v.literal('observer')),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const gm = await requireCampaignGM(ctx, args.campaignId);
    if (!args.email && !args.invitedUserId) throw new ConvexError('INVITEE_REQUIRED');
    const now = Date.now();
    return await ctx.db.insert('campaignInvites', {
      campaignId: args.campaignId,
      email: args.email?.toLowerCase(),
      invitedUserId: args.invitedUserId,
      invitedByUserId: gm.userId,
      roleGranted: args.roleGranted,
      status: 'pending',
      tokenHash: args.email
        ? await hashSecret(`${args.campaignId}:${args.email}:${now}`)
        : undefined,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const acceptInvite = mutation({
  args: { inviteId: v.id('campaignInvites') },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const invite = await ctx.db.get(args.inviteId);
    const now = Date.now();
    if (!invite || invite.status !== 'pending') throw new ConvexError('INVITE_NOT_FOUND');
    if (invite.expiresAt && invite.expiresAt < now) {
      await ctx.db.patch(invite._id, { status: 'expired', updatedAt: now });
      throw new ConvexError('INVITE_EXPIRED');
    }
    if (invite.invitedUserId && invite.invitedUserId !== profile._id) {
      throw new ConvexError('FORBIDDEN');
    }

    const existing = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId_userId', (q) =>
        q.eq('campaignId', invite.campaignId).eq('userId', profile._id),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: existing.role === 'gm' ? 'gm' : invite.roleGranted,
        status: 'active',
        invitedByUserId: invite.invitedByUserId,
        joinedAt: existing.joinedAt ?? now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('campaignMembers', {
        campaignId: invite.campaignId,
        userId: profile._id,
        role: invite.roleGranted,
        status: 'active',
        invitedByUserId: invite.invitedByUserId,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(invite._id, {
      status: 'accepted',
      invitedUserId: profile._id,
      updatedAt: now,
    });
    return invite.campaignId;
  },
});

export const revokeInvite = mutation({
  args: { inviteId: v.id('campaignInvites') },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) return;
    await requireCampaignGM(ctx, invite.campaignId);
    await ctx.db.patch(invite._id, { status: 'revoked', updatedAt: Date.now() });
  },
});

export const listPendingInvitesForCampaign = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    await requireCampaignGM(ctx, args.campaignId);
    const invites = await ctx.db
      .query('campaignInvites')
      .withIndex('by_campaignId', (q) => q.eq('campaignId', args.campaignId))
      .collect();
    return invites.filter((invite) => invite.status === 'pending');
  },
});

export const listMyInvites = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireActiveUserProfile(ctx);
    const byAccount = await ctx.db
      .query('campaignInvites')
      .withIndex('by_invitedUserId', (q) => q.eq('invitedUserId', profile._id))
      .collect();
    return byAccount.filter((invite) => invite.status === 'pending');
  },
});

export const listJoinCodesForCampaign = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    await requireCampaignGM(ctx, args.campaignId);
    return await ctx.db
      .query('campaignJoinCodes')
      .withIndex('by_campaignId', (q) => q.eq('campaignId', args.campaignId))
      .collect();
  },
});
