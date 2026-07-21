type FabUResourceBonuses = {
  hp: number;
  mp: number;
  ip: number;
};

const EMPTY_RESOURCE_BONUSES: FabUResourceBonuses = { hp: 0, mp: 0, ip: 0 };

const FIXED_CLASS_IP_BONUSES: Readonly<Record<string, number>> = {
  Gourmet: 2,
  Merchant: 2,
  Symbolist: 2,
  Tinkerer: 2,
};

function parseFabUClassResourceBonuses(freeBenefits: readonly string[]): FabUResourceBonuses {
  return freeBenefits.reduce<FabUResourceBonuses>(
    (bonuses, benefit) => {
      const normalized = benefit.toLowerCase();
      if (!normalized.includes('permanently increase your maximum')) return bonuses;

      const amount = Number.parseInt(benefit.match(/\bby\s+(\d+)/i)?.[1] ?? '', 10);
      if (!Number.isFinite(amount)) return bonuses;

      const affectsHP = /\b(?:maximum\s+)?hit points\b/.test(normalized);
      const affectsMP = /\b(?:maximum\s+)?mind points\b/.test(normalized);
      const affectsIP = /\b(?:maximum\s+)?inventory points\b/.test(normalized);
      const affectedResourceCount = [affectsHP, affectsMP, affectsIP].filter(Boolean).length;
      const isChoice = affectedResourceCount > 1 && /\bor\b/.test(normalized);
      if (isChoice) return bonuses;

      return {
        hp: bonuses.hp + (affectsHP ? amount : 0),
        mp: bonuses.mp + (affectsMP ? amount : 0),
        ip: bonuses.ip + (affectsIP ? amount : 0),
      };
    },
    { ...EMPTY_RESOURCE_BONUSES },
  );
}

function calculateFabUClassResourceBonuses(
  classNames: readonly string[],
  freeBenefitsByClass: ReadonlyMap<string, readonly string[]>,
): FabUResourceBonuses {
  return classNames.reduce<FabUResourceBonuses>(
    (totals, className) => {
      const bonuses = parseFabUClassResourceBonuses(freeBenefitsByClass.get(className) ?? []);
      return {
        hp: totals.hp + bonuses.hp,
        mp: totals.mp + bonuses.mp,
        ip: totals.ip + bonuses.ip,
      };
    },
    { ...EMPTY_RESOURCE_BONUSES },
  );
}

function calculateFabUFixedClassIPBonus(classNames: readonly string[]): number {
  return classNames.reduce(
    (total, className) => total + (FIXED_CLASS_IP_BONUSES[className] ?? 0),
    0,
  );
}

export {
  EMPTY_RESOURCE_BONUSES,
  calculateFabUClassResourceBonuses,
  calculateFabUFixedClassIPBonus,
  parseFabUClassResourceBonuses,
};
export type { FabUResourceBonuses };
