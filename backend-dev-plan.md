# Backend Development Plan: Convex + better-auth

This plan is intended for a coding agent implementing the Fabula Ultima app backend in this repository. The goal is to add persistent user accounts, saved character state for multiple characters, user-level settings, and campaigns where users can participate or act as GM/owner. A user's characters must be able to participate in multiple campaigns.

## Current repository context

From the current repo inspection:

- The app is a Vite React PWA using TypeScript and ES modules.
- React entry is split between `src/main.tsx`, `src/root.tsx`, and `src/App.tsx`.
- `src/root.tsx` currently provides global React providers: React StrictMode, Jotai, theme, and Toolpad notifications.
- `src/App.tsx` mounts `CssBaseline`, hotkeys, `BrowserRouter`, `Sidebar`, and `Pages`.
- Path aliasing uses `@/* -> src/*` in `tsconfig.app.json` and Vite.
- The package currently has React, React Router, Jotai, MUI, Toolpad, vite-plugin-pwa, Vitest, and Playwright dependencies, but no Convex or better-auth dependencies yet.
- The current code search did not reveal Fabula-specific domain files by obvious strings such as `Fabula`, `characterState`, `Campaign`, `Bonds`, `Skills`, `Spells`, or `Combat`. Before wiring data calls, the implementation agent must inventory the actual state and UI files present in its working copy.

## Core data model assumptions

Use these assumptions unless the product owner clarifies otherwise:

1. Authenticated users own one or more characters.
2. Each character has one canonical persisted `characterState` document.
3. A character can participate in multiple campaigns.
4. A user can be a campaign GM/owner, a player/member, or both in different campaigns.
5. Campaign membership and character participation are separate concepts:
   - A user can be a member of a campaign even before assigning a character.
   - A character can be added to multiple campaigns through a join table.
6. User settings are stored separately from auth identity/account tables.
7. Character state should initially be stored as a flexible JSON-like object to avoid overfitting before the app's character schema stabilizes.
8. Authorization must be enforced in Convex functions, not only in React route guards.

## Ambiguities to resolve with the product owner

Ask these before final implementation choices that would be expensive to change:

1. Should sign-in support only email/password, or also OAuth providers such as Google, Discord, Apple, or GitHub?
2. Should campaign membership be invitation-based, join-code based, public-discoverable, or manually added by a GM?
3. Can a player use more than one of their characters in the same campaign?
4. Can a character be copied/forked for a campaign, or does every campaign reference the same live character state?
5. Should campaign-specific character overrides exist, such as HP/MP during a session, notes, visibility, or GM-only metadata?
6. Are characters private by default outside campaigns?
7. What user-level settings are known today: theme, compact layout, active character, active campaign, dice preferences, accessibility settings, sync behavior?
8. Should the app remain useful offline as a PWA and sync later, or is online-only acceptable after auth is introduced?
9. Should there be anonymous/local characters that can later be claimed by a signed-in account?
10. Should deleting a user hard-delete characters/campaigns, soft-delete them, or transfer campaign ownership?

## Implementation phases

### Phase 0: Full project inventory

1. Run the local test/build baseline before changing anything:
   ```bash
   npm install
   npm run ts:check
   npm run lint:check
   npm run test:unit -- --run
   npm run build
   ```
2. Inventory the source tree:
   ```bash
   find src -maxdepth 4 -type f | sort
   ```
3. Locate current app state sources:
   ```bash
   grep -R "jotai\|atom(\|localStorage\|useLocalStorage\|character\|campaign\|Fabula\|Bonds\|Skills\|Spells\|Gear\|Combat" -n src || true
   ```
4. Document in the implementation PR which files currently own character state, navigation state, settings, and static mock data.
5. Identify whether existing state is centralized in Jotai atoms, component-local React state, localStorage hooks, hardcoded fixture objects, or route params.
6. Do not introduce backend calls into UI components until this inventory is complete.

### Phase 1: Install and initialize Convex

1. Install Convex:
   ```bash
   npm install convex
   npx convex dev
   ```
2. Follow the Convex CLI prompts to create/link the Convex project.
3. Commit generated Convex files, usually including:
   - `convex/`
   - generated Convex config files
   - updated `package.json`
   - updated lockfile
4. Add environment files without committing secrets:
   - `.env.local` for local secrets
   - update `env/.shared` or equivalent template with non-secret public variable names
5. Ensure Vite receives the public Convex URL through an env var such as:
   ```bash
   VITE_CONVEX_URL=<development deployment url>
   ```
6. Add generated Convex types to the TypeScript workflow and verify:
   ```bash
   npx convex codegen
   npm run ts:check
   npm run build
   ```

### Phase 2: Add Convex provider to React root

1. Create `src/lib/convex.ts` or `src/backend/convexClient.ts`:
   ```ts
   import { ConvexReactClient } from 'convex/react';

   const convexUrl = import.meta.env.VITE_CONVEX_URL;

   if (!convexUrl) {
     throw new Error('Missing VITE_CONVEX_URL');
   }

   export const convex = new ConvexReactClient(convexUrl);
   ```
2. Update `src/root.tsx` to wrap the existing providers with `ConvexProvider` from `convex/react`.
3. Preserve current provider behavior:
   - Keep `JotaiProvider`.
   - Keep `ThemeProvider`.
   - Keep `NotificationsProvider`.
   - Do not move `BrowserRouter` unless there is a clear reason.
4. Verify no provider-order regressions in `App.tsx`, routing, theme, hotkeys, sidebar, or notifications.

### Phase 3: Install and configure better-auth with Convex

1. Install better-auth packages following the current better-auth Convex integration docs:
   ```bash
   npm install better-auth
   ```
   If the current integration requires an adapter or Convex-specific helper package, install that package too.
2. Use the better-auth CLI to generate the auth schema/config, then adapt it to Convex.
3. Expected implementation files may include:
   - `convex/auth.ts`
   - `convex/http.ts`
   - `src/lib/auth-client.ts`
   - auth route/callback helpers if required by better-auth
4. Configure auth environment variables. Do not commit secret values:
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - OAuth provider IDs/secrets if OAuth is enabled
   - Convex deployment variables required by the better-auth integration
5. Decide and document the initial auth providers.
   - Recommended MVP: email/password or magic-link if product owner wants minimal setup.
   - Recommended social provider for campaign apps: Google or Discord, if desired.
6. Ensure the frontend has an auth client wrapper and hooks for:
   - current session
   - sign in
   - sign up
   - sign out
   - loading/error state
7. Add auth screens/routes only after checking the existing route structure.
8. Protect backend data with server-side identity checks in Convex functions regardless of client route guards.

### Phase 4: Define Convex schema

Create `convex/schema.ts` with tables similar to the following. Adapt naming to better-auth's generated table conventions so auth-owned tables are not duplicated.

#### Auth-owned tables

Use the better-auth generated/required tables for users, sessions, accounts, verification tokens, and related auth data. Do not manually invent conflicting auth user tables.

#### App-owned tables

Recommended initial schema:

```ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  userProfiles: defineTable({
    authUserId: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
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
    characterState: v.any(),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .searchIndex('search_name', { searchField: 'name', filterFields: ['ownerUserId'] }),

  campaigns: defineTable({
    ownerUserId: v.id('userProfiles'),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('archived')),
    settings: v.optional(v.any()),
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
    role: v.optional(v.union(v.literal('playerCharacter'), v.literal('npc'), v.literal('companion'))),
    campaignState: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    removedAt: v.optional(v.number()),
  })
    .index('by_campaignId', ['campaignId'])
    .index('by_characterId', ['characterId'])
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_campaignId_characterId', ['campaignId', 'characterId']),
});
```

Notes:

- `authUserId` should map to the stable user identifier exposed by better-auth.
- Keep `characterState` as `v.any()` for the MVP, then migrate toward a validated nested schema after UI state stabilizes.
- `campaignState` allows campaign-specific mutable state without mutating the canonical character for every campaign.
- Use soft archive/remove fields instead of immediate deletion for campaigns and character links.

### Phase 5: Implement auth/session helpers for Convex functions

Create reusable helpers in `convex/lib/auth.ts` or similar:

1. `getAuthUser(ctx)`
   - Reads the better-auth/Convex session identity.
   - Throws an auth error if unauthenticated.
2. `getOrCreateUserProfile(ctx)`
   - Finds `userProfiles.by_authUserId`.
   - Creates the profile on first authenticated access.
3. `requireCharacterOwner(ctx, characterId)`
   - Ensures the current user owns the character.
4. `requireCampaignMember(ctx, campaignId)`
   - Ensures the current user is an active member.
5. `requireCampaignGM(ctx, campaignId)`
   - Ensures the current user is active with role `gm`, or owns the campaign.
6. `canReadCharacter(ctx, characterId)`
   - Allows owner access.
   - Allows access when the character is linked to a campaign where the current user is an active member.
7. `canWriteCharacter(ctx, characterId)`
   - MVP recommendation: only the character owner can edit canonical `characterState`.
   - Campaign-specific state may be writable by the owner and GM depending on product rules.

### Phase 6: Implement Convex API modules

Create separate Convex modules by domain.

#### `convex/users.ts`

Queries/mutations:

- `me`
  - Returns current profile and settings.
- `updateProfile`
  - Updates display name/avatar fields that are not owned by auth provider.
- `getSettings`
- `updateSettings`
  - Deep-merge or replace settings consistently. Pick one strategy and document it.

#### `convex/characters.ts`

Queries/mutations:

- `listMine`
  - Lists non-archived characters owned by current user.
- `get`
  - Reads a character if owner or shared through campaign membership.
- `create`
  - Creates a character with initial `characterState`.
- `updateState`
  - Replaces or patches `characterState`.
  - Validate payload size and optionally version/stamp updates to avoid overwriting concurrent edits.
- `updateMetadata`
  - Updates name, summary, portrait.
- `archive`
  - Sets `archivedAt` instead of deleting.
- `listCampaignsForCharacter`
  - Returns campaigns where this character participates.

#### `convex/campaigns.ts`

Queries/mutations:

- `listMine`
  - Returns campaigns where current user is owner or active member.
- `get`
  - Returns campaign details if active member.
- `create`
  - Creates campaign and adds creator as `gm` active member.
- `update`
  - GM/owner only.
- `archive`
  - GM/owner only.
- `listMembers`
  - Active campaign members only.
- `addMember`
  - GM/owner only. Exact flow depends on invite ambiguity.
- `removeMember`
  - GM/owner only, with guard against removing sole GM.
- `setMemberRole`
  - GM/owner only, with guard against no remaining GM.
- `addCharacter`
  - Owner of character can add own character if campaign member.
  - GM can add NPC/companion characters according to product rules.
- `removeCharacter`
  - Character owner or campaign GM.
- `listCharacters`
  - Active campaign members only.
- `updateCampaignCharacterState`
  - For campaign-specific HP/session/visibility state if needed.

#### `convex/invites.ts` or join-code flow

Only implement after product owner clarifies invite model. Possible MVP:

- `createInviteCode(campaignId)` GM-only.
- `joinByInviteCode(code)` authenticated users only.
- `revokeInviteCode(code)` GM-only.

Alternative MVP:

- Add members manually by email/user ID after they already have accounts.

### Phase 7: Frontend integration plan

1. Add data access wrappers under `src/backend/`, `src/features/`, or the repo's existing convention after inventory.
2. Prefer thin React hooks around Convex generated API calls:
   - `useCurrentUserProfile`
   - `useMyCharacters`
   - `useCharacter(characterId)`
   - `useSaveCharacterState`
   - `useMyCampaigns`
   - `useCampaign(campaignId)`
3. Keep Jotai for transient UI state:
   - selected tabs
   - unsaved local form edits
   - drawer/sidebar state
   - optimistic editor state
4. Move durable state to Convex:
   - `characterState`
   - character metadata
   - user settings
   - campaign data
   - membership links
5. Introduce a migration bridge if current app stores state in localStorage:
   - Detect local character state after sign-in.
   - Prompt user to import/create backend character.
   - Do not silently delete local data.
6. Add route protection after auth is working:
   - public: landing, sign-in, sign-up
   - private: character list, character detail, campaign list, campaign detail, settings
7. Add loading and error states using existing MUI/Toolpad notifications where appropriate.
8. Preserve PWA behavior:
   - Review whether authenticated routes and Convex calls interact safely with the service worker.
   - Avoid caching auth callback responses or sensitive API responses in Workbox.

### Phase 8: Character state strategy

Because the current UI/state model must be inventoried first, start with an adapter layer rather than rewriting all components.

1. Define `src/domain/characterState.ts`:
   - `CharacterState` TypeScript type inferred from current app state if available.
   - `createDefaultCharacterState()`.
   - `normalizeCharacterState(raw)`.
   - `migrateCharacterState(raw)` for future version upgrades.
2. Store state with a version:
   ```ts
   {
     schemaVersion: 1,
     data: { ...currentCharacterState }
   }
   ```
3. Ensure saves update `updatedAt`.
4. Consider debounced saves for high-frequency character-sheet edits.
5. Add explicit save status in UI if edits are not instant.
6. Do not expose raw `v.any()` data directly across unrelated components; pass through domain helpers.

### Phase 9: Authorization matrix

Implement tests or at least server-side assertions for the following:

| Action | Owner | Campaign GM | Campaign member | Non-member |
| --- | --- | --- | --- | --- |
| Read own character | yes | no unless shared | no unless shared | no |
| Edit canonical character state | yes | no by default | no | no |
| Read campaign | yes if member/owner | yes | yes | no |
| Edit campaign metadata | owner/GM | yes | no | no |
| Add own character to campaign | yes if active member | yes for allowed NPC flow | no for others | no |
| Remove character from campaign | character owner or GM | yes | own only if product allows | no |
| Update user settings | self only | no | no | no |

### Phase 10: Testing checklist

1. Add unit tests for pure character-state migration/normalization helpers.
2. Add Convex function tests if the repo adopts Convex testing utilities.
3. Add smoke tests for:
   - sign up/sign in/sign out
   - create character
   - update character state
   - create campaign
   - add campaign member
   - add character to campaign
   - verify a character appears in multiple campaigns
4. Run:
   ```bash
   npm run ts:check
   npm run lint:check
   npm run test:unit -- --run
   npm run build
   ```
5. If Playwright is already configured and stable, add an e2e happy path after auth route UX is implemented.

### Phase 11: Deployment checklist

1. Create Convex production deployment.
2. Configure production env vars in hosting provider:
   - `VITE_CONVEX_URL`
   - better-auth public/base URL values
3. Configure Convex env vars/secrets:
   - better-auth secret
   - OAuth provider secrets if any
4. Configure auth callback URLs for every provider.
5. Verify PWA service worker does not cache auth-sensitive endpoints.
6. Verify HTTPS-only cookies/session requirements in production.
7. Run production build locally before deploy.

### Phase 12: Suggested coding-agent task breakdown

Implement as small PRs/commits in this order:

1. `chore: inventory app state and document backend integration points`
   - No behavior changes.
   - Add notes to this plan or a separate implementation note.
2. `chore: install and initialize convex`
   - Adds Convex dependency/config only.
3. `chore: add convex react provider`
   - Adds client provider and env validation.
4. `chore: install and configure better-auth`
   - Adds auth client/server config and generated schema artifacts.
5. `feat: add backend schema for profiles characters campaigns`
   - Adds app schema and indexes.
6. `feat: add auth helpers and user profile functions`
   - Adds `me`, settings, profile creation.
7. `feat: add character persistence functions`
   - Adds CRUD/archive/list.
8. `feat: add campaign and membership functions`
   - Adds campaign CRUD and membership/character links.
9. `feat: add frontend auth screens and session hooks`
   - Adds sign-in/out UX.
10. `feat: connect character state to convex`
    - Replaces local durable character state with backend persistence.
11. `feat: connect campaigns UI to convex`
    - Adds campaign list/detail flows.
12. `test: add backend auth and data access coverage`
    - Adds tests around permissions and core flows.

## Initial data access rules to enforce

The implementation should fail closed. If unsure whether a user should access data, deny access until product rules are clarified.

- Every query/mutation that reads or writes user-owned data must require an authenticated user.
- Never trust client-provided `ownerUserId`; derive it from session.
- Never trust client-provided role; derive campaign permissions from `campaignMembers`.
- Do not expose all users, all campaigns, or all characters through broad list queries.
- Ensure indexes support every list/access pattern before shipping.
- Prefer soft deletes/archives for MVP.

## Risks and mitigation

1. **Auth adapter mismatch**
   - better-auth's Convex integration may require specific generated tables or handler structure. Use the current official CLI/docs during implementation and adapt schema naming accordingly.
2. **PWA caching auth-sensitive responses**
   - Audit Workbox config before production.
3. **Flexible `characterState` becoming unmanageable**
   - Add `schemaVersion`, domain normalization, and migration helpers from the beginning.
4. **Concurrent edits overwriting character state**
   - Add `updatedAt` checks or revision numbers if multiple devices/users can edit the same record.
5. **Campaign membership complexity**
   - Keep user membership and character participation as separate join tables.
6. **Existing local state migration**
   - Preserve local data and ask before importing/deleting.

## Done criteria for MVP backend

- A user can create an account and sign in/out.
- A signed-in user gets a `userProfile` and `userSettings` record.
- A signed-in user can create, list, open, update, and archive their own characters.
- Character state persists across reloads and devices.
- A signed-in user can create a campaign and is automatically its GM.
- A GM can add/remove campaign members according to the chosen invite model.
- A user can add one of their characters to multiple campaigns.
- A campaign can list its active members and participating characters.
- Unauthorized users cannot read or mutate private user/character/campaign data.
- TypeScript, lint, unit tests, and production build pass.
