/**
 * Strip trailing skill-rank circle OCR leftovers (e.g. " O.", "○.") that sometimes
 * appear at the end of imported Fabula Ultima skill blurbs.
 */
function cleanFabUSkillText(value: string | undefined): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/(?:[\s\u00a0]*)(?:[O○〇◯●◉]+(?:\.|。)?)+$/u, '')
    .replace(/\s+$/u, '')
    .trimEnd();
}

export { cleanFabUSkillText };
