import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  userProfiles: defineTable({
    authUserId: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    settings: v.optional(v.any()),
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
    meta: v.optional(
      v.object({
        gameSystem: v.optional(v.string()),
        activeForUserProfileId: v.optional(v.id('userProfiles')),
      }),
    ),
    portraitUrl: v.optional(v.string()),
    schemaVersion: v.number(),
    characterState: v.any(),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_ownerUserId_metaGameSystem', ['ownerUserId', 'meta.gameSystem']),

  classes: defineTable({
    class: v.any(),
  })
    .index('by_classMetaGameSystem', ['class.meta.gameSystem'])
    .index('by_classMetaGameSystem_className', ['class.meta.gameSystem', 'class.className']),

  gameSystems: defineTable(v.any()).index('by_systemId', ['id']),

  // Catalog of selectable equipment/items per game system (e.g. Fabula Ultima
  // weapons/armor/etc.). Item shape varies by type, so stored as `v.any()`
  // alongside a `meta.gameSystem` tag.
  items: defineTable(v.any()).index('by_metaGameSystem', ['meta.gameSystem']),

  // Small key/value singleton store. Currently holds the latest published
  // PWA build version so open clients can be prompted to update in real time.
  appConfig: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index('by_key', ['key']),

  campaigns: defineTable({
    ownerUserId: v.id('userProfiles'),
    meta: v.optional(
      v.object({
        gameSystem: v.optional(v.string()),
      }),
    ),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('archived')),
    settings: v.optional(v.any()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_ownerUserId_metaGameSystem', ['ownerUserId', 'meta.gameSystem'])
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
    // Plaintext invite code, stored so the GM's edit screen can re-display the
    // shareable link. Invite codes are bearer tokens, not credentials.
    code: v.optional(v.string()),
    createdByUserId: v.id('userProfiles'),
    roleGranted: v.union(v.literal('player'), v.literal('observer')),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    useCount: v.number(),
    createdAt: v.number(),
  })
    .index('by_campaignId', ['campaignId'])
    .index('by_codeHash', ['codeHash'])
    .index('by_code', ['code']),

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
