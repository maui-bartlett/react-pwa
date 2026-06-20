const dieSizes = [4, 6, 8, 10, 12, 20, 100] as const;
type DieSize = (typeof dieSizes)[number];

type RollDie = {
  id: number;
  sides: DieSize;
};

type RollResult = {
  id: number;
  rolls: Array<{ sides: DieSize; value: number }>;
  total: number;
};

type DiceBoxRoll = {
  rolls?: Array<{
    dieType?: string;
    sides?: number | string;
    value?: number;
    result?: number;
  }>;
  dieType?: string;
  result?: number;
  sides?: number | string;
  value?: number;
};

let resultIdCounter = 0;

function normalizeDieSize(value: number | string | undefined): DieSize {
  const sides = typeof value === 'string' ? Number(value.match(/\d+/)?.[0]) : Number(value);
  return dieSizes.includes(sides as DieSize) ? (sides as DieSize) : 6;
}

function getRollValue(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value)) ?? 0;
}

function normalizeRollValue(sides: DieSize, value: number) {
  return sides === 10 && value === 10 ? 0 : value;
}

function toRollResult(groups: DiceBoxRoll[]): RollResult {
  const rolls = groups.flatMap((group) => {
    if (!group.rolls?.length) {
      const sides = normalizeDieSize(group.sides ?? group.dieType);
      return [
        {
          sides,
          value: normalizeRollValue(sides, getRollValue(group.value, group.result)),
        },
      ];
    }

    return group.rolls.map((roll) => {
      const isSingleDieGroup = group.rolls?.length === 1;
      const sides = normalizeDieSize(roll.sides ?? roll.dieType ?? group.sides ?? group.dieType);
      return {
        sides,
        value: normalizeRollValue(
          sides,
          getRollValue(
            roll.value,
            roll.result,
            isSingleDieGroup ? group.value : undefined,
            isSingleDieGroup ? group.result : undefined,
          ),
        ),
      };
    });
  });

  return {
    id: Date.now() * 1000 + (resultIdCounter++ % 1000),
    rolls,
    total: rolls.reduce((sum, roll) => sum + roll.value, 0),
  };
}

function isValidRollResult(result: RollResult, selectedDice: RollDie[]) {
  if (result.rolls.length !== selectedDice.length) return false;

  const expectedCounts = new Map<DieSize, number>();
  const actualCounts = new Map<DieSize, number>();

  selectedDice.forEach(({ sides }) => {
    expectedCounts.set(sides, (expectedCounts.get(sides) ?? 0) + 1);
  });

  for (const roll of result.rolls) {
    const minimum = roll.sides === 10 ? 0 : 1;
    const maximum = roll.sides === 10 ? 9 : roll.sides;
    if (!Number.isInteger(roll.value) || roll.value < minimum || roll.value > maximum) return false;
    actualCounts.set(roll.sides, (actualCounts.get(roll.sides) ?? 0) + 1);
  }

  return dieSizes.every((sides) => expectedCounts.get(sides) === actualCounts.get(sides));
}

function createRandomRollResult(dice: RollDie[], random: () => number = Math.random): RollResult {
  return toRollResult(
    dice.map(({ sides }) => ({
      sides,
      value: sides === 10 ? Math.floor(random() * 10) : Math.floor(random() * sides) + 1,
    })),
  );
}

export { createRandomRollResult, dieSizes, isValidRollResult, toRollResult };
export type { DiceBoxRoll, DieSize, RollDie, RollResult };
