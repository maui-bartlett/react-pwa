import { ConvexError, v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
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

// ---------- Invite links ----------

// Reusable campaign invite links expire after this window; the GM regenerates
// (or re-opens the invite section) to mint a fresh one.
const INVITE_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateInviteCode() {
  // URL-safe, ~48 bits of entropy. Enough for a shareable bearer token.
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

async function findActiveJoinCode(ctx: QueryCtx, campaignId: Id<'campaigns'>, now: number) {
  const codes = await ctx.db
    .query('campaignJoinCodes')
    .withIndex('by_campaignId', (q) => q.eq('campaignId', campaignId))
    .collect();
  return (
    codes.find(
      (entry) =>
        typeof entry.code === 'string' &&
        entry.code.length > 0 &&
        (!entry.expiresAt || entry.expiresAt > now) &&
        (!entry.maxUses || entry.useCount < entry.maxUses),
    ) ?? null
  );
}

/** The campaign's current active invite link plus whether the caller may
 *  manage it. Non-GM members get `canManage: false` (rather than an error) so
 *  the edit UI can simply hide the invite section instead of crashing. */
export const getInviteLink = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    const member = await requireCampaignMember(ctx, args.campaignId);
    if (member.role !== 'gm') return { canManage: false as const, link: null };
    const active = await findActiveJoinCode(ctx, args.campaignId, Date.now());
    return {
      canManage: true as const,
      link: active ? { code: active.code ?? '', expiresAt: active.expiresAt ?? null } : null,
    };
  },
});

/** GM: return the active invite link, creating one if none exists. */
export const createInviteLink = mutation({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    const gm = await requireCampaignGM(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.archivedAt || !hasGameSystem(campaign)) {
      throw new ConvexError('CAMPAIGN_NOT_FOUND');
    }
    const now = Date.now();
    const existing = await findActiveJoinCode(ctx, args.campaignId, now);
    if (existing) return { code: existing.code ?? '', expiresAt: existing.expiresAt ?? null };

    const code = generateInviteCode();
    const expiresAt = now + INVITE_LINK_TTL_MS;
    await ctx.db.insert('campaignJoinCodes', {
      campaignId: args.campaignId,
      code,
      codeHash: code,
      createdByUserId: gm.userId,
      roleGranted: 'player',
      expiresAt,
      useCount: 0,
      createdAt: now,
    });
    return { code, expiresAt };
  },
});

/** GM: invalidate any existing invite links and mint a fresh one. */
export const regenerateInviteLink = mutation({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    const gm = await requireCampaignGM(ctx, args.campaignId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.archivedAt || !hasGameSystem(campaign)) {
      throw new ConvexError('CAMPAIGN_NOT_FOUND');
    }
    const existing = await ctx.db
      .query('campaignJoinCodes')
      .withIndex('by_campaignId', (q) => q.eq('campaignId', args.campaignId))
      .collect();
    await Promise.all(existing.map((entry) => ctx.db.delete(entry._id)));

    const now = Date.now();
    const code = generateInviteCode();
    const expiresAt = now + INVITE_LINK_TTL_MS;
    await ctx.db.insert('campaignJoinCodes', {
      campaignId: args.campaignId,
      code,
      codeHash: code,
      createdByUserId: gm.userId,
      roleGranted: 'player',
      expiresAt,
      useCount: 0,
      createdAt: now,
    });
    return { code, expiresAt };
  },
});

/** Public: resolve an invite code to a campaign summary for the join page.
 *  Does not require auth so the invitee sees what they're joining first. */
export const resolveInviteCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const joinCode = await ctx.db
      .query('campaignJoinCodes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique();
    if (!joinCode) return { status: 'invalid' as const };
    const now = Date.now();
    if (joinCode.expiresAt && joinCode.expiresAt < now) return { status: 'expired' as const };
    if (joinCode.maxUses && joinCode.useCount >= joinCode.maxUses) {
      return { status: 'exhausted' as const };
    }
    const campaign = await ctx.db.get(joinCode.campaignId);
    if (!campaign || campaign.archivedAt || !hasGameSystem(campaign)) {
      return { status: 'invalid' as const };
    }
    return {
      status: 'ok' as const,
      campaignId: campaign._id,
      name: campaign.name,
      gameSystem: campaign.meta?.gameSystem ?? '',
      roleGranted: joinCode.roleGranted,
    };
  },
});

/** Auth: join a campaign via an invite code, optionally bringing a character.
 *  Idempotent for an already-active member; re-adds a previously removed one. */
export const joinViaInviteCode = mutation({
  args: { code: v.string(), characterId: v.optional(v.id('characters')) },
  handler: async (ctx, args) => {
    const profile = await getOrCreateUserProfile(ctx);
    const joinCode = await ctx.db
      .query('campaignJoinCodes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique();
    if (!joinCode) throw new ConvexError('INVITE_INVALID');
    const now = Date.now();
    if (joinCode.expiresAt && joinCode.expiresAt < now) throw new ConvexError('INVITE_EXPIRED');
    if (joinCode.maxUses && joinCode.useCount >= joinCode.maxUses) {
      throw new ConvexError('INVITE_EXHAUSTED');
    }
    const campaign = await ctx.db.get(joinCode.campaignId);
    if (!campaign || campaign.archivedAt || !hasGameSystem(campaign)) {
      throw new ConvexError('CAMPAIGN_NOT_FOUND');
    }

    const existingMember = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId_userId', (q) =>
        q.eq('campaignId', joinCode.campaignId).eq('userId', profile._id),
      )
      .unique();
    const alreadyActive = existingMember?.status === 'active';
    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        status: 'active',
        // Don't demote a GM who re-opens their own invite link.
        role: existingMember.role === 'gm' ? 'gm' : joinCode.roleGranted,
        joinedAt: existingMember.joinedAt ?? now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('campaignMembers', {
        campaignId: joinCode.campaignId,
        userId: profile._id,
        role: joinCode.roleGranted,
        status: 'active',
        invitedByUserId: joinCode.createdByUserId,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (args.characterId) {
      const character = await ctx.db.get(args.characterId);
      if (!character || character.ownerUserId !== profile._id) {
        throw new ConvexError('CHARACTER_NOT_FOUND');
      }
      if (character.meta?.gameSystem !== campaign.meta?.gameSystem) {
        throw new ConvexError('GAME_SYSTEM_MISMATCH');
      }
      const existingLink = await ctx.db
        .query('campaignCharacters')
        .withIndex('by_campaignId_characterId', (q) =>
          q.eq('campaignId', joinCode.campaignId).eq('characterId', args.characterId!),
        )
        .unique();
      if (!existingLink) {
        await ctx.db.insert('campaignCharacters', {
          campaignId: joinCode.campaignId,
          characterId: args.characterId,
          ownerUserId: profile._id,
          addedByUserId: profile._id,
          role: 'playerCharacter',
          permissions: { gmCanEditCanonicalState: false, playersCanView: true },
          createdAt: now,
          updatedAt: now,
        });
      } else if (existingLink.removedAt) {
        await ctx.db.patch(existingLink._id, { removedAt: undefined, updatedAt: now });
      }
    }

    if (!alreadyActive) {
      await ctx.db.patch(joinCode._id, { useCount: joinCode.useCount + 1 });
    }
    return { campaignId: joinCode.campaignId, gameSystem: campaign.meta?.gameSystem ?? '' };
  },
});
