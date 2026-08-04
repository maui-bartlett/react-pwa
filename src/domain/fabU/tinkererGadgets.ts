import type { Character } from './characterTypes';

type GadgetType = 'alchemy' | 'infusions' | 'magitech';
type GadgetTier = 'basic' | 'advanced' | 'superior';
type MagicannonDamageType = 'air' | 'bolt' | 'earth' | 'fire' | 'ice' | 'physical';

type GadgetsState = {
  alchemy?: GadgetTier;
  infusions?: GadgetTier;
  magitech?: GadgetTier;
  magicannonDamageType?: MagicannonDamageType;
};

const GADGETS_SKILL_NAME = 'Gadgets';
const TINKERER_CLASS = 'Tinkerer';
const MAGISPHERE_SPELL_SOURCES = ['Elementalist', 'Entropist', 'Spiritist'] as const;

const GADGET_TYPES: readonly GadgetType[] = ['alchemy', 'infusions', 'magitech'];

const GADGET_TYPE_LABELS: Record<GadgetType, string> = {
  alchemy: 'Alchemy',
  infusions: 'Infusions',
  magitech: 'Magitech',
};

const GADGET_TIER_LABELS: Record<GadgetTier, string> = {
  basic: 'Basic',
  advanced: 'Advanced',
  superior: 'Superior',
};

const MAGICANNON_DAMAGE_TYPES: readonly MagicannonDamageType[] = [
  'air',
  'bolt',
  'earth',
  'fire',
  'ice',
  'physical',
];

const TIER_RANK: Record<GadgetTier, number> = {
  basic: 1,
  advanced: 2,
  superior: 3,
};

const NEXT_TIER: Record<GadgetTier, GadgetTier | null> = {
  basic: 'advanced',
  advanced: 'superior',
  superior: null,
};

const GADGETS_SKILL_SUMMARY =
  'Choose and upgrade gadget invention types: Alchemy, Infusions, or Magitech.';

const GADGETS_SKILL_DESCRIPTION = [
  'When you first acquire this Skill, choose a gadget type: alchemy, infusions or magitech. You gain its basic benefits.',
  'Whenever you take this Skill again, choose one option: you gain the basic benefits of a new gadget type; or you gain the advanced benefits of a gadget type whose basic benefits you already obtained; or you gain the superior benefits of a gadget type whose advanced benefits you already obtained.',
].join(' ');

const GADGET_TIER_SUMMARIES: Record<GadgetType, Record<GadgetTier, string>> = {
  alchemy: {
    basic: 'Craft a basic mix (3 IP): roll 2d20, assign one to target and one to effect.',
    advanced: 'Craft an advanced mix (4 IP): roll 3d20, assign one to target and one to effect.',
    superior: 'Craft a superior mix (5 IP): roll 4d20, assign one to target and one to effect.',
  },
  infusions: {
    basic: 'On a hit, spend 2 IP to apply Cryo, Pyro, or Volt (+5 damage, change damage type).',
    advanced: 'Also unlock Cyclone, Exorcism, Seismic, and Shadow infusions.',
    superior: 'Also unlock Vampire (single-target HP/MP drain) and Venom (poison + poisoned).',
  },
  magitech: {
    basic:
      'Magitech Override: spend 10 MP and win 【INS+INS】 vs a nearby soldier-rank construct to control it.',
    advanced:
      'Magicannon: spend 3 IP to create a two-handed ranged firearm (【DEX+INS】+1, 【HR+10】).',
    superior:
      'Magispheres: develop spell prototypes from Elementalist, Entropist, and Spiritist lists.',
  },
};

function emptyGadgetsState(): GadgetsState {
  return {};
}

function normalizeGadgetsState(raw: unknown): GadgetsState {
  if (!raw || typeof raw !== 'object') return emptyGadgetsState();
  const stored = raw as Record<string, unknown>;
  const next: GadgetsState = {};
  for (const type of GADGET_TYPES) {
    const tier = stored[type];
    if (tier === 'basic' || tier === 'advanced' || tier === 'superior') {
      next[type] = tier;
    }
  }
  if (
    typeof stored.magicannonDamageType === 'string' &&
    MAGICANNON_DAMAGE_TYPES.includes(stored.magicannonDamageType as MagicannonDamageType)
  ) {
    next.magicannonDamageType = stored.magicannonDamageType as MagicannonDamageType;
  }
  return next;
}

function getGadgetsSkillLevel(character: Pick<Character, 'skillGroups'>): number {
  const skill = character.skillGroups
    .find((group) => group.className === TINKERER_CLASS)
    ?.skills.find((entry) => entry.name.trim().toLowerCase() === GADGETS_SKILL_NAME.toLowerCase());
  const level = Number.parseInt(skill?.level ?? '0', 10);
  return Number.isFinite(level) ? Math.max(0, level) : 0;
}

function hasGadgetsSkill(character: Pick<Character, 'skillGroups'>): boolean {
  return getGadgetsSkillLevel(character) > 0;
}

function getGadgetsState(character: Pick<Character, 'gadgets'>): GadgetsState {
  return normalizeGadgetsState(character.gadgets);
}

function getGadgetTierRank(tier: GadgetTier | undefined): number {
  return tier ? TIER_RANK[tier] : 0;
}

function getSpentGadgetsLevels(gadgets: GadgetsState): number {
  return GADGET_TYPES.reduce((sum, type) => sum + getGadgetTierRank(gadgets[type]), 0);
}

function getPendingGadgetsSelections(character: Character): number {
  return Math.max(
    0,
    getGadgetsSkillLevel(character) - getSpentGadgetsLevels(getGadgetsState(character)),
  );
}

type GadgetsUpgradeOption = {
  id: string;
  type: GadgetType;
  tier: GadgetTier;
  label: string;
  summary: string;
};

function listAvailableGadgetsUpgrades(gadgets: GadgetsState): GadgetsUpgradeOption[] {
  const options: GadgetsUpgradeOption[] = [];
  for (const type of GADGET_TYPES) {
    const current = gadgets[type];
    if (!current) {
      options.push({
        id: `${type}-basic`,
        type,
        tier: 'basic',
        label: `Unlock ${GADGET_TYPE_LABELS[type]} (Basic)`,
        summary: GADGET_TIER_SUMMARIES[type].basic,
      });
      continue;
    }
    const next = NEXT_TIER[current];
    if (!next) continue;
    options.push({
      id: `${type}-${next}`,
      type,
      tier: next,
      label: `Upgrade ${GADGET_TYPE_LABELS[type]} to ${GADGET_TIER_LABELS[next]}`,
      summary: GADGET_TIER_SUMMARIES[type][next],
    });
  }
  return options;
}

function applyGadgetsUpgrade(
  gadgets: GadgetsState,
  type: GadgetType,
  tier: GadgetTier,
): GadgetsState {
  const currentRank = getGadgetTierRank(gadgets[type]);
  const nextRank = TIER_RANK[tier];
  // Only allow unlocking basic from nothing, or upgrading exactly one step.
  if (currentRank === 0 && tier !== 'basic') return gadgets;
  if (currentRank > 0 && nextRank !== currentRank + 1) return gadgets;
  return { ...gadgets, [type]: tier };
}

function hasMagitechSuperior(character: Character): boolean {
  return getGadgetsState(character).magitech === 'superior';
}

function getMagisphereCapacity(
  character: Pick<Character, 'level' | 'gadgets' | 'skillGroups'>,
): number {
  if (!hasGadgetsSkill(character)) return 0;
  if (getGadgetsState(character).magitech !== 'superior') return 0;
  const level = Number.isFinite(character.level) ? character.level : 1;
  if (level >= 40) return 7;
  if (level >= 20) return 5;
  return 3;
}

function isMagisphereSpellSource(className: string): boolean {
  return MAGISPHERE_SPELL_SOURCES.some(
    (source) => source.toLowerCase() === className.trim().toLowerCase(),
  );
}

export {
  GADGETS_SKILL_DESCRIPTION,
  GADGETS_SKILL_NAME,
  GADGETS_SKILL_SUMMARY,
  GADGET_TIER_LABELS,
  GADGET_TIER_SUMMARIES,
  GADGET_TYPE_LABELS,
  GADGET_TYPES,
  MAGICANNON_DAMAGE_TYPES,
  MAGISPHERE_SPELL_SOURCES,
  TINKERER_CLASS,
  applyGadgetsUpgrade,
  emptyGadgetsState,
  getGadgetsSkillLevel,
  getGadgetsState,
  getMagisphereCapacity,
  getPendingGadgetsSelections,
  getSpentGadgetsLevels,
  hasGadgetsSkill,
  hasMagitechSuperior,
  isMagisphereSpellSource,
  listAvailableGadgetsUpgrades,
  normalizeGadgetsState,
};
export type { GadgetTier, GadgetType, GadgetsState, GadgetsUpgradeOption, MagicannonDamageType };
