import type { Doc, Id } from '../_generated/dataModel';

const FABULA_ULTIMA_TYPE = 'fabula-ultima';

type FabulaMeta = {
  type?: string;
  activeForUserProfileId?: Id<'userProfiles'>;
};

function isFabulaUltimaDocument(document: { meta?: FabulaMeta } | null | undefined) {
  return document?.meta?.type === FABULA_ULTIMA_TYPE;
}

function withFabulaMeta(meta?: FabulaMeta): FabulaMeta {
  return { ...meta, type: FABULA_ULTIMA_TYPE };
}

function isActiveForProfile(
  document: Pick<Doc<'characters'>, 'meta'>,
  userProfileId: Id<'userProfiles'>,
) {
  return document.meta?.activeForUserProfileId === userProfileId;
}

export { FABULA_ULTIMA_TYPE, isActiveForProfile, isFabulaUltimaDocument, withFabulaMeta };
export type { FabulaMeta };
