import type { Character } from './characterTypes';

function getChimeristSpellMimicLevel(character: Character) {
  const spellMimic = character.skillGroups
    .find((group) => group.className === 'Chimerist')
    ?.skills.find((skill) => skill.name.trim().toLowerCase() === 'spell mimic');
  if (!spellMimic) return undefined;
  const level = parseInt(spellMimic.level ?? '0', 10);
  return Number.isFinite(level) ? Math.max(0, level) : 0;
}

function hasChimeristSpellMimic(character: Character) {
  return getChimeristSpellMimicLevel(character) !== undefined;
}

function getFabUClassSpellCapacity(
  character: Character,
  className: string,
  defaultCapacity: number,
) {
  if (className !== 'Chimerist') return defaultCapacity;
  const spellMimicLevel = getChimeristSpellMimicLevel(character);
  return spellMimicLevel === undefined ? defaultCapacity : spellMimicLevel + 2;
}

export { getChimeristSpellMimicLevel, getFabUClassSpellCapacity, hasChimeristSpellMimic };
