import type { AbilityKey, HitDicePool } from './atoms';

type DndClassEntry = {
  name: string;
  level: number;
};

type DndCatalogClass = {
  className?: string;
  hitDie?: string;
  primaryAbilities?: string[];
  savingThrows?: string[];
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  toolProficiencies?: string[];
  spellcasting?: {
    type?: string;
    ability?: string;
    ritualCasting?: boolean;
    preparation?: string;
  } | null;
};

type DerivedClassFeature = {
  id: string;
  name: string;
  source: string;
  summary: string;
};

const abilityKeys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function abilityNameToKey(value?: string): AbilityKey | null {
  const normalized = value?.trim().toLowerCase().slice(0, 3);
  if (!normalized) return null;
  return abilityKeys.find((key) => key === normalized) ?? null;
}

function formatSpellcasting(spellcasting: DndCatalogClass['spellcasting']) {
  if (!spellcasting) return 'None';
  const parts = [
    spellcasting.type,
    spellcasting.ability ? `${spellcasting.ability} based` : null,
    spellcasting.ritualCasting ? 'ritual casting' : null,
    spellcasting.preparation,
  ].filter(Boolean);
  return parts.join(' · ') || 'Spellcasting';
}

function deriveDndClassFields(options: {
  classes: DndClassEntry[];
  catalogByName: ReadonlyMap<string, DndCatalogClass>;
  currentHitDicePools: HitDicePool[];
  existingFeatureIds?: Set<string>;
}) {
  const classInfos = options.classes
    .map((entry) => options.catalogByName.get(entry.name))
    .filter((classInfo): classInfo is DndCatalogClass => Boolean(classInfo?.className));
  const hitDicePools = options.classes
    .map((entry) => {
      const classInfo = options.catalogByName.get(entry.name);
      if (!classInfo?.hitDie) return null;
      const max = Math.max(1, entry.level);
      const previous = options.currentHitDicePools.find((pool) => pool.die === classInfo.hitDie);
      return {
        die: classInfo.hitDie,
        max,
        used: Math.min(max, Math.max(0, previous?.used ?? 0)),
      };
    })
    .filter((pool): pool is HitDicePool => Boolean(pool));
  const hitDice = hitDicePools.map((pool) => `${pool.max}${pool.die}`).join(' + ');
  const savingThrowKeys = (
    options.catalogByName.get(options.classes[0]?.name ?? '')?.savingThrows ?? []
  )
    .map(abilityNameToKey)
    .filter((key): key is AbilityKey => Boolean(key));
  const proficiencies = [
    ...new Set(
      classInfos.flatMap((classInfo) => [
        ...(classInfo.armorProficiencies ?? []),
        ...(classInfo.weaponProficiencies ?? []),
        ...(classInfo.toolProficiencies ?? []),
      ]),
    ),
  ];
  const spellcastingAbility = classInfos
    .map((classInfo) => abilityNameToKey(classInfo.spellcasting?.ability))
    .find((key): key is AbilityKey => Boolean(key));
  const existingFeatureIds = options.existingFeatureIds ?? new Set<string>();
  const features: DerivedClassFeature[] = classInfos
    .filter((classInfo) => !existingFeatureIds.has(`class-summary-${classInfo.className}`))
    .map((classInfo) => ({
      id: `class-summary-${classInfo.className}`,
      name: `${classInfo.className} Training`,
      source: classInfo.className ?? 'Class',
      summary: [
        classInfo.hitDie ? `Hit die ${classInfo.hitDie}.` : null,
        classInfo.primaryAbilities?.length
          ? `Primary abilities: ${classInfo.primaryAbilities.join(', ')}.`
          : null,
        classInfo.spellcasting
          ? `Spellcasting: ${formatSpellcasting(classInfo.spellcasting)}.`
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    }));

  return { hitDicePools, hitDice, savingThrowKeys, proficiencies, spellcastingAbility, features };
}

export { abilityNameToKey, deriveDndClassFields, formatSpellcasting };
export type { DndCatalogClass };
