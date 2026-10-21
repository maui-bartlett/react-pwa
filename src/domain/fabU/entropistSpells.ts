// Offensive markers from the Entropist spell list, core rulebook pages 192-193.
const offensiveSpells = new Set([
  'anomaly',
  'drain spirit',
  'drain vigor',
  'omega',
  'stop',
  'umbra',
]);

export function isOffensiveEntropistSpell(className: string | undefined, spellName: string) {
  return className === 'Entropist' && offensiveSpells.has(spellName.trim().toLowerCase());
}
