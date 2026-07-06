import type { AbilityKey, HitDicePool } from './atoms';

type DndClassEntry = {
  name: string;
  level: number;
  subclass?: string;
};

type DndCatalogFeature = {
  name?: string;
  featureName?: string;
  title?: string;
  level?: number | string;
  summary?: string;
  description?: string;
  text?: string;
};

type DndCatalogSubclass = {
  name?: string;
  subclassName?: string;
  title?: string;
  level?: number | string;
  features?: DndCatalogFeature[];
  classFeatures?: DndCatalogFeature[];
  subclassFeatures?: DndCatalogFeature[];
};

type DndCatalogClass = {
  className?: string;
  features?: unknown[];
  classFeatures?: unknown[];
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
  subclasses?: unknown[];
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

function normalizeCatalogKey(value?: string) {
  return (value ?? '').trim().toLowerCase();
}

function normalizeIdSegment(value: string) {
  return normalizeCatalogKey(value)
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
}

function asNonEmptyString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getFeatureName(feature: DndCatalogFeature) {
  return (
    asNonEmptyString(feature.name) ??
    asNonEmptyString(feature.featureName) ??
    asNonEmptyString(feature.title)
  );
}

function isCatalogFeature(value: unknown): value is DndCatalogFeature {
  return Boolean(value && typeof value === 'object' && getFeatureName(value as DndCatalogFeature));
}

function isCatalogSubclass(value: unknown): value is string | DndCatalogSubclass {
  return typeof value === 'string' || Boolean(value && typeof value === 'object');
}

function getFeatureSummary(feature: DndCatalogFeature) {
  return (
    asNonEmptyString(feature.summary) ??
    asNonEmptyString(feature.description) ??
    asNonEmptyString(feature.text) ??
    'No feature summary has been recorded yet.'
  );
}

function getFeatureLevel(feature: DndCatalogFeature) {
  const levelValue = feature.level;
  const level =
    typeof levelValue === 'number'
      ? levelValue
      : typeof levelValue === 'string'
        ? Number.parseInt(levelValue, 10)
        : null;
  return Number.isFinite(level) && level !== null ? level : null;
}

function getSubclassName(subclass: string | DndCatalogSubclass) {
  if (typeof subclass === 'string') return asNonEmptyString(subclass);
  return (
    asNonEmptyString(subclass.name) ??
    asNonEmptyString(subclass.subclassName) ??
    asNonEmptyString(subclass.title)
  );
}

function getSubclassFeatures(subclass: DndCatalogSubclass) {
  return [
    ...(subclass.features ?? []),
    ...(subclass.classFeatures ?? []),
    ...(subclass.subclassFeatures ?? []),
  ].filter(isCatalogFeature);
}

function toDerivedCatalogFeature(options: {
  feature: DndCatalogFeature;
  idPrefix: string;
  source: string;
  existingFeatureIds: Set<string>;
}) {
  const name = getFeatureName(options.feature);
  if (!name) return null;
  const id = `${options.idPrefix}-${normalizeIdSegment(name)}`;
  if (options.existingFeatureIds.has(id)) return null;
  return {
    id,
    name,
    source: options.source,
    summary: getFeatureSummary(options.feature),
  };
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
  const hitDiceMaximums = new Map<string, number>();
  options.classes.forEach((entry) => {
    const classInfo = options.catalogByName.get(entry.name);
    if (!classInfo?.hitDie) return;
    hitDiceMaximums.set(
      classInfo.hitDie,
      (hitDiceMaximums.get(classInfo.hitDie) ?? 0) + Math.max(1, entry.level),
    );
  });
  const hitDicePools = Array.from(hitDiceMaximums.entries()).map(([die, max]) => {
    const previous = options.currentHitDicePools.find((pool) => pool.die === die);
    return {
      die,
      max,
      used: Math.min(max, Math.max(0, previous?.used ?? 0)),
    };
  });
  const hitDice = hitDicePools.map((pool) => `${pool.max}${pool.die}`).join(' + ');
  const primarySavingThrows = options.catalogByName.get(
    options.classes[0]?.name ?? '',
  )?.savingThrows;
  const savingThrowKeys = (primarySavingThrows ?? [])
    .map(abilityNameToKey)
    .filter((key): key is AbilityKey => Boolean(key));
  const hasSavingThrowData = Boolean(primarySavingThrows);
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
  const classSummaryFeatures: DerivedClassFeature[] = classInfos
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
  const classCatalogFeatures = options.classes.flatMap((entry) => {
    const classInfo = options.catalogByName.get(entry.name);
    if (!classInfo?.className) return [];
    const classFeatureSource = classInfo.className;
    const classFeatures = [...(classInfo.features ?? []), ...(classInfo.classFeatures ?? [])]
      .filter(isCatalogFeature)
      .filter((feature) => {
        const level = getFeatureLevel(feature);
        return level === null || level <= entry.level;
      })
      .map((feature) =>
        toDerivedCatalogFeature({
          feature,
          idPrefix: `class-feature-${normalizeIdSegment(classInfo.className ?? entry.name)}`,
          source: classFeatureSource,
          existingFeatureIds,
        }),
      )
      .filter((feature): feature is DerivedClassFeature => feature !== null);

    const selectedSubclass = asNonEmptyString(entry.subclass);
    if (!selectedSubclass || !Array.isArray(classInfo.subclasses)) return classFeatures;

    const subclass = classInfo.subclasses.filter(isCatalogSubclass).find((candidate) => {
      const candidateName = getSubclassName(candidate);
      return normalizeCatalogKey(candidateName ?? '') === normalizeCatalogKey(selectedSubclass);
    });
    if (!subclass || typeof subclass === 'string') return classFeatures;

    const subclassFeatures = getSubclassFeatures(subclass)
      .filter((feature) => {
        const level = getFeatureLevel(feature);
        return level === null || level <= entry.level;
      })
      .map((feature) =>
        toDerivedCatalogFeature({
          feature,
          idPrefix: `subclass-feature-${normalizeIdSegment(classInfo.className ?? entry.name)}-${normalizeIdSegment(selectedSubclass)}`,
          source: selectedSubclass,
          existingFeatureIds,
        }),
      )
      .filter((feature): feature is DerivedClassFeature => feature !== null);

    return [...classFeatures, ...subclassFeatures];
  });
  const features = [...classSummaryFeatures, ...classCatalogFeatures];

  return {
    hitDicePools,
    hitDice,
    savingThrowKeys,
    hasSavingThrowData,
    proficiencies,
    spellcastingAbility,
    features,
  };
}

export { abilityNameToKey, deriveDndClassFields, formatSpellcasting };
export type { DndCatalogClass };
