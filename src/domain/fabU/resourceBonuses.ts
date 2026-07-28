type FabUResourceBonuses = {
  hp: number;
  mp: number;
  ip: number;
};

type FabUSkillResourceModifierSource = {
  id: string;
  label: string;
  source: string;
  value: number;
  resource: keyof FabUResourceBonuses;
};

type FabUSkillGroupLike = {
  className: string;
  skills: readonly { name: string; level?: string }[];
};

const EMPTY_RESOURCE_BONUSES: FabUResourceBonuses = { hp: 0, mp: 0, ip: 0 };

const FIXED_CLASS_IP_BONUSES: Readonly<Record<string, number>> = {
  Gourmet: 2,
  Merchant: 2,
  Symbolist: 2,
  Tinkerer: 2,
};

/** Permanent max-resource bonuses granted by specific class skills (SL × amount). */
const SKILL_RESOURCE_BONUSES: ReadonlyArray<{
  className: string;
  skillName: string;
  resource: keyof FabUResourceBonuses;
  amountPerLevel: number;
  source: string;
}> = [
  {
    className: 'Loremaster',
    skillName: 'Focused',
    resource: 'mp',
    amountPerLevel: 3,
    source: 'Permanently increase your maximum Mind Points by 【SL × 3】.',
  },
];

function getFabUSkillLevel(
  skillGroups: readonly FabUSkillGroupLike[],
  className: string,
  skillName: string,
): number {
  const skill = skillGroups
    .find((group) => group.className.trim().toLowerCase() === className.trim().toLowerCase())
    ?.skills.find((entry) => entry.name.trim().toLowerCase() === skillName.trim().toLowerCase());
  const level = Number.parseInt(skill?.level ?? '0', 10);
  return Number.isFinite(level) ? Math.max(0, level) : 0;
}

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

function listFabUSkillResourceModifierSources(
  classNames: readonly string[],
  skillGroups: readonly FabUSkillGroupLike[],
  characterLevel = 0,
): FabUSkillResourceModifierSource[] {
  const ownedClasses = new Set(classNames.map((name) => name.trim().toLowerCase()));
  const ownedSkills = new Set(
    skillGroups.flatMap((group) => group.skills.map((skill) => skill.name.trim().toLowerCase())),
  );

  const classSkillSources = SKILL_RESOURCE_BONUSES.flatMap((rule) => {
    if (!ownedClasses.has(rule.className.trim().toLowerCase())) return [];

    const skillLevel = getFabUSkillLevel(skillGroups, rule.className, rule.skillName);
    if (skillLevel <= 0) return [];

    const value = skillLevel * rule.amountPerLevel;
    if (value === 0) return [];

    return [
      {
        id: `skill-${rule.resource}-${rule.className}-${rule.skillName}`,
        label: rule.skillName,
        source: `${rule.className} · ${rule.source}`,
        value,
        resource: rule.resource,
      },
    ];
  });

  const heroicSources: FabUSkillResourceModifierSource[] = [];
  if (ownedSkills.has('extra hp')) {
    const value = characterLevel >= 40 ? 20 : 10;
    heroicSources.push({
      id: 'skill-hp-heroic-Extra HP',
      label: 'Extra HP',
      source: 'Heroic Skill · Permanently increase your maximum Hit Points.',
      value,
      resource: 'hp',
    });
  }
  if (ownedSkills.has('extra mp')) {
    const value = characterLevel >= 40 ? 20 : 10;
    heroicSources.push({
      id: 'skill-mp-heroic-Extra MP',
      label: 'Extra MP',
      source: 'Heroic Skill · Permanently increase your maximum Mind Points.',
      value,
      resource: 'mp',
    });
  }
  if (ownedSkills.has('extra ip')) {
    heroicSources.push({
      id: 'skill-ip-heroic-Extra IP',
      label: 'Extra IP',
      source: 'Heroic Skill · Permanently increase your maximum Inventory Points by 4.',
      value: 4,
      resource: 'ip',
    });
  }

  return [...classSkillSources, ...heroicSources];
}

function calculateFabUSkillResourceBonuses(
  classNames: readonly string[],
  skillGroups: readonly FabUSkillGroupLike[],
  characterLevel = 0,
): FabUResourceBonuses {
  return listFabUSkillResourceModifierSources(
    classNames,
    skillGroups,
    characterLevel,
  ).reduce<FabUResourceBonuses>(
    (totals, source) => ({
      ...totals,
      [source.resource]: totals[source.resource] + source.value,
    }),
    { ...EMPTY_RESOURCE_BONUSES },
  );
}

export {
  EMPTY_RESOURCE_BONUSES,
  calculateFabUClassResourceBonuses,
  calculateFabUFixedClassIPBonus,
  calculateFabUSkillResourceBonuses,
  getFabUSkillLevel,
  listFabUSkillResourceModifierSources,
  parseFabUClassResourceBonuses,
};
export type { FabUResourceBonuses, FabUSkillGroupLike, FabUSkillResourceModifierSource };
