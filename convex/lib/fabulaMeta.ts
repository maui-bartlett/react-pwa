import type { Doc, Id } from '../_generated/dataModel';

const FABULA_ULTIMA_TYPE = 'fabula-ultima';
const AVATAR_LEGENDS_TYPE = 'avatar-legends';

type GameSystemMeta = {
  gameSystem?: string;
  activeForUserProfileId?: Id<'userProfiles'>;
};

const MANAGED_GAME_SYSTEMS: ReadonlySet<string> = new Set([
  FABULA_ULTIMA_TYPE,
  AVATAR_LEGENDS_TYPE,
]);

/**
 * True when a document belongs to one of the game systems this backend
 * manages (currently Fabula Ultima and Avatar Legends). Used by the
 * read/write/owner guards so they apply uniformly across apps — gating
 * on a single system would silently reject the other app's characters.
 */
function isManagedCharacterDocument(document: { meta?: GameSystemMeta } | null | undefined) {
  const system = document?.meta?.gameSystem;
  return typeof system === 'string' && MANAGED_GAME_SYSTEMS.has(system);
}

/**
 * Stamp a meta object with the given game system, preserving any other
 * meta fields (e.g. `activeForUserProfileId`) that might already be set.
 */
function withGameSystemMeta(gameSystem: string, meta?: GameSystemMeta): GameSystemMeta {
  return { ...meta, gameSystem };
}

/** Back-compat shim — equivalent to `withGameSystemMeta(FABULA_ULTIMA_TYPE, meta)`. */
function withFabulaMeta(meta?: GameSystemMeta): GameSystemMeta {
  return withGameSystemMeta(FABULA_ULTIMA_TYPE, meta);
}

function isActiveForProfile(
  document: Pick<Doc<'characters'>, 'meta'>,
  userProfileId: Id<'userProfiles'>,
) {
  return document.meta?.activeForUserProfileId === userProfileId;
}

export {
  AVATAR_LEGENDS_TYPE,
  FABULA_ULTIMA_TYPE,
  isActiveForProfile,
  isManagedCharacterDocument,
  withFabulaMeta,
  withGameSystemMeta,
};
export type { GameSystemMeta };
