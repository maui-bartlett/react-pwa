import type { Doc, Id } from '../_generated/dataModel';

const FABULA_ULTIMA_TYPE = 'fabula-ultima';
const AVATAR_LEGENDS_TYPE = 'avatar-legends';

type GameSystemMeta = {
  gameSystem?: string;
  activeForUserProfileId?: Id<'userProfiles'>;
};

function isFabulaUltimaDocument(document: { meta?: GameSystemMeta } | null | undefined) {
  return document?.meta?.gameSystem === FABULA_ULTIMA_TYPE;
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
  isFabulaUltimaDocument,
  withFabulaMeta,
  withGameSystemMeta,
};
export type { GameSystemMeta };
