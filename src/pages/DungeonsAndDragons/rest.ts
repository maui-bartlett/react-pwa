import type { DndCharacter, HitDicePool } from './atoms';

type DndRestType = 'short' | 'long';

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function hitDieAverageHeal(die: string, constitutionModifier: number) {
  const sides = Number.parseInt(die.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(sides) || sides <= 0) return Math.max(1, constitutionModifier);
  return Math.max(1, Math.floor(sides / 2) + 1 + constitutionModifier);
}

function recoverLongRestHitDice(pools: HitDicePool[]) {
  const total = pools.reduce((sum, pool) => sum + pool.max, 0);
  let remainingRecovery = Math.max(1, Math.floor(total / 2));
  return pools.map((pool) => {
    const recovered = Math.min(pool.used, remainingRecovery);
    remainingRecovery -= recovered;
    return { ...pool, used: pool.used - recovered };
  });
}

function resetsOnRest(reset: string, restType: DndRestType) {
  const normalized = reset.toLowerCase();
  return restType === 'long'
    ? normalized.includes('long rest') || normalized.includes('short')
    : normalized.includes('short');
}

function resetRestFeatures(character: DndCharacter, restType: DndRestType) {
  return character.features.map((feature) => {
    if (!feature.uses || !resetsOnRest(feature.uses.reset, restType)) return feature;
    return { ...feature, uses: { ...feature.uses, used: 0 } };
  });
}

function spendDndHitDie(character: DndCharacter, die: string) {
  const pool = character.hitPoints.hitDicePools.find((entry) => entry.die === die);
  if (!pool || pool.used >= pool.max || character.hitPoints.current >= character.hitPoints.max) {
    return { character, didSpend: false };
  }
  const constitutionScore =
    character.abilities.find((ability) => ability.key === 'con')?.score ?? 10;
  const healAmount = hitDieAverageHeal(die, abilityModifier(constitutionScore));
  return {
    didSpend: true,
    character: {
      ...character,
      hitPoints: {
        ...character.hitPoints,
        current: Math.min(character.hitPoints.max, character.hitPoints.current + healAmount),
        hitDicePools: character.hitPoints.hitDicePools.map((entry) =>
          entry.die === die ? { ...entry, used: entry.used + 1 } : entry,
        ),
      },
    },
  };
}

function spendHitDiceToFull(character: DndCharacter) {
  let nextCharacter = character;
  for (const pool of character.hitPoints.hitDicePools) {
    let available = pool.max - pool.used;
    while (available > 0 && nextCharacter.hitPoints.current < nextCharacter.hitPoints.max) {
      const result = spendDndHitDie(nextCharacter, pool.die);
      if (!result.didSpend) break;
      nextCharacter = result.character;
      available -= 1;
    }
  }
  return nextCharacter;
}

function applyDndRest(character: DndCharacter, restType: DndRestType) {
  const resetCharacter = {
    ...character,
    features: resetRestFeatures(character, restType),
  };

  if (restType === 'short') {
    return spendHitDiceToFull(resetCharacter);
  }

  return {
    ...resetCharacter,
    hitPoints: {
      ...resetCharacter.hitPoints,
      current: resetCharacter.hitPoints.max,
      temp: 0,
      hitDicePools: recoverLongRestHitDice(resetCharacter.hitPoints.hitDicePools),
      deathSaves: { successes: 0, failures: 0 },
    },
    spellcasting: {
      ...resetCharacter.spellcasting,
      slots: resetCharacter.spellcasting.slots.map((slot) => ({ ...slot, used: 0 })),
    },
  };
}

export { applyDndRest, hitDieAverageHeal, recoverLongRestHitDice, spendDndHitDie };
export type { DndRestType };
