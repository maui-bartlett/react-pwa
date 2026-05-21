import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  userProfiles: defineTable({
    authUserId: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_authUserId', ['authUserId']),

  userSettings: defineTable({
    userId: v.id('userProfiles'),
    settings: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  characters: defineTable({
    ownerUserId: v.id('userProfiles'),
    name: v.string(),
    summary: v.optional(v.string()),
    portraitUrl: v.optional(v.string()),
    schemaVersion: v.number(),
    characterState: v.any(),
    statusEffects: v.optional(v.record(v.string(), v.boolean())),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['ownerUserId'],
    }),

  campaigns: defineTable({
    ownerUserId: v.id('userProfiles'),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('archived')),
    settings: v.optional(v.any()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_status', ['status']),

  campaignMembers: defineTable({
    campaignId: v.id('campaigns'),
    userId: v.id('userProfiles'),
    role: v.union(v.literal('gm'), v.literal('player'), v.literal('observer')),
    status: v.union(v.literal('invited'), v.literal('active'), v.literal('removed')),
    invitedByUserId: v.optional(v.id('userProfiles')),
    joinedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_campaignId', ['campaignId'])
    .index('by_userId', ['userId'])
    .index('by_campaignId_userId', ['campaignId', 'userId']),

  campaignCharacters: defineTable({
    campaignId: v.id('campaigns'),
    characterId: v.id('characters'),
    ownerUserId: v.id('userProfiles'),
    addedByUserId: v.id('userProfiles'),
    role: v.union(v.literal('playerCharacter'), v.literal('npc'), v.literal('companion')),
    campaignState: v.optional(v.any()),
    permissions: v.optional(
      v.object({
        gmCanEditCanonicalState: v.optional(v.boolean()),
        playersCanView: v.optional(v.boolean()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    removedAt: v.optional(v.number()),
  })
    .index('by_campaignId', ['campaignId'])
    .index('by_characterId', ['characterId'])
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_campaignId_characterId', ['campaignId', 'characterId']),

  campaignJoinCodes: defineTable({
    campaignId: v.id('campaigns'),
    codeHash: v.string(),
    createdByUserId: v.id('userProfiles'),
    roleGranted: v.union(v.literal('player'), v.literal('observer')),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    useCount: v.number(),
    createdAt: v.number(),
  })
    .index('by_campaignId', ['campaignId'])
    .index('by_codeHash', ['codeHash']),

  campaignInvites: defineTable({
    campaignId: v.id('campaigns'),
    email: v.optional(v.string()),
    invitedUserId: v.optional(v.id('userProfiles')),
    invitedByUserId: v.id('userProfiles'),
    roleGranted: v.union(v.literal('gm'), v.literal('player'), v.literal('observer')),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('revoked'),
      v.literal('expired'),
    ),
    tokenHash: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_campaignId', ['campaignId'])
    .index('by_email', ['email'])
    .index('by_invitedUserId', ['invitedUserId']),
});
