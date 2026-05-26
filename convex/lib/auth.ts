import { ConvexError } from 'convex/values';

import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';
import { isFabulaUltimaDocument } from './fabulaMeta';

type AuthUser = {
  _id: string;
  name?: string | null;
  image?: string | null;
  email?: string | null;
};

type ReadCtx = QueryCtx | MutationCtx;

async function getAuthUser(ctx: ReadCtx): Promise<AuthUser | null> {
  return (await authComponent.getAuthUser(ctx)) as unknown as AuthUser | null;
}

async function requireAuthUser(ctx: ReadCtx): Promise<AuthUser> {
  const authUser = await getAuthUser(ctx);
  if (!authUser) throw new ConvexError('UNAUTHENTICATED');
  return authUser;
}

async function findUserProfileByAuthUserId(
  ctx: ReadCtx,
  authUserId: string,
): Promise<Doc<'userProfiles'> | null> {
  return await ctx.db
    .query('userProfiles')
    .withIndex('by_authUserId', (q) => q.eq('authUserId', authUserId))
    .unique();
}

async function getOrCreateUserProfile(ctx: MutationCtx): Promise<Doc<'userProfiles'>> {
  const authUser = await requireAuthUser(ctx);
  const existing = await findUserProfileByAuthUserId(ctx, authUser._id);
  if (existing) return existing;

  const now = Date.now();
  const userProfileId = await ctx.db.insert('userProfiles', {
    authUserId: authUser._id,
    displayName: authUser.name ?? undefined,
    avatarUrl: authUser.image ?? undefined,
    settings: {},
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert('userSettings', {
    userId: userProfileId,
    settings: {},
    createdAt: now,
    updatedAt: now,
  });

  const profile = await ctx.db.get(userProfileId);
  if (!profile) throw new ConvexError('PROFILE_CREATE_FAILED');
  return profile;
}

async function getActiveUserProfile(ctx: ReadCtx): Promise<Doc<'userProfiles'> | null> {
  const authUser = await requireAuthUser(ctx);
  const profile = await findUserProfileByAuthUserId(ctx, authUser._id);
  if (!profile || profile.archivedAt) return null;
  return profile;
}

async function requireActiveUserProfile(ctx: ReadCtx): Promise<Doc<'userProfiles'>> {
  const profile = await getActiveUserProfile(ctx);
  if (!profile) throw new ConvexError('PROFILE_NOT_FOUND');
  return profile;
}

async function requireCharacterOwner(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
): Promise<Doc<'characters'>> {
  const profile = await requireActiveUserProfile(ctx);
  const character = await ctx.db.get(characterId);
  if (!character || character.archivedAt) throw new ConvexError('CHARACTER_NOT_FOUND');
  if (!isFabulaUltimaDocument(character)) throw new ConvexError('CHARACTER_NOT_FOUND');
  if (character.ownerUserId !== profile._id) throw new ConvexError('FORBIDDEN');
  return character;
}

async function requireCampaignMember(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
): Promise<Doc<'campaignMembers'>> {
  const profile = await requireActiveUserProfile(ctx);
  const member = await ctx.db
    .query('campaignMembers')
    .withIndex('by_campaignId_userId', (q) =>
      q.eq('campaignId', campaignId).eq('userId', profile._id),
    )
    .unique();
  if (!member || member.status !== 'active') throw new ConvexError('CAMPAIGN_MEMBER_NOT_FOUND');
  return member;
}

async function requireCampaignGM(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
): Promise<Doc<'campaignMembers'>> {
  const member = await requireCampaignMember(ctx, campaignId);
  if (member.role !== 'gm') throw new ConvexError('GM_REQUIRED');
  return member;
}

async function canReadCharacter(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
): Promise<Doc<'characters'> | null> {
  const profile = await requireActiveUserProfile(ctx);
  const character = await ctx.db.get(characterId);
  if (!character || character.archivedAt) return null;
  if (!isFabulaUltimaDocument(character)) return null;
  if (character.ownerUserId === profile._id) return character;

  const links = await ctx.db
    .query('campaignCharacters')
    .withIndex('by_characterId', (q) => q.eq('characterId', characterId))
    .collect();

  for (const link of links) {
    if (link.removedAt) continue;
    const member = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId_userId', (q) =>
        q.eq('campaignId', link.campaignId).eq('userId', profile._id),
      )
      .unique();
    if (member?.status === 'active' && link.permissions?.playersCanView) return character;
    if (member?.status === 'active' && member.role === 'gm') return character;
  }

  return null;
}

async function canWriteCanonicalCharacter(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
): Promise<boolean> {
  const profile = await requireActiveUserProfile(ctx);
  const character = await ctx.db.get(characterId);
  if (!character || character.archivedAt) return false;
  if (!isFabulaUltimaDocument(character)) return false;
  if (character.ownerUserId === profile._id) return true;

  const links = await ctx.db
    .query('campaignCharacters')
    .withIndex('by_characterId', (q) => q.eq('characterId', characterId))
    .collect();

  for (const link of links) {
    if (link.removedAt || !link.permissions?.gmCanEditCanonicalState) continue;
    const member = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaignId_userId', (q) =>
        q.eq('campaignId', link.campaignId).eq('userId', profile._id),
      )
      .unique();
    if (member?.status === 'active' && member.role === 'gm') return true;
  }

  return false;
}

async function canWriteCampaignCharacterState(
  ctx: ReadCtx,
  campaignCharacterId: Id<'campaignCharacters'>,
): Promise<boolean> {
  const profile = await requireActiveUserProfile(ctx);
  const link = await ctx.db.get(campaignCharacterId);
  if (!link || link.removedAt) return false;
  if (link.ownerUserId === profile._id) return true;

  const member = await ctx.db
    .query('campaignMembers')
    .withIndex('by_campaignId_userId', (q) =>
      q.eq('campaignId', link.campaignId).eq('userId', profile._id),
    )
    .unique();

  return member?.status === 'active' && member.role === 'gm';
}

export {
  canReadCharacter,
  canWriteCampaignCharacterState,
  canWriteCanonicalCharacter,
  getActiveUserProfile,
  getAuthUser,
  getOrCreateUserProfile,
  requireActiveUserProfile,
  requireCampaignGM,
  requireCampaignMember,
  requireCharacterOwner,
};
