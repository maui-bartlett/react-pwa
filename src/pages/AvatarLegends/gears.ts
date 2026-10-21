export function normalizeGears(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value)))
    : 0;
}

export function getAvatarGears(character: {
  name: string;
  primaryTraining: string;
  gears?: unknown;
}) {
  // Seed Tom's existing sheet once; an explicitly saved zero must stay zero.
  if (
    character.gears === undefined &&
    character.primaryTraining === 'Technology' &&
    character.name.trim().toLowerCase() === 'tom dorito'
  )
    return 3;
  return normalizeGears(character.gears);
}

export function canSpendGears(primaryTraining: string, techniqueType: string) {
  return (
    primaryTraining === 'Technology' &&
    (techniqueType === 'technology' || techniqueType === 'basic')
  );
}
