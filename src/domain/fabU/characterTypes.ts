import type { Attribute, Bond, EquipmentItem } from '@/components/fab-u';
import type { SkillGroup } from '@/pages/FabU/skills';
import type { SpellGroup } from '@/pages/FabU/spells';

type ClassEntry = {
  name: string;
  level: number;
  subtitle: string;
};

type BackstoryPrompt = {
  prompt: string;
  response: string;
};

type BackpackItem = {
  id: string;
  title: string;
  subtitle: string;
};

type StatusEffects = Record<string, boolean>;

type CharacterName = {
  firstName: string;
  lastName: string;
  nickName?: string;
};

type Character = {
  name: CharacterName;
  initiative: number;
  defense: number;
  defenseTemp: number | null;
  magicDefense: number;
  magicDefenseTemp: number | null;
  fabulaPoints: number;
  inventoryPoints: number;
  currentHP: number;
  /** Bonus added on top of (MIG die × 5 + level) to get max HP. */
  hpBonus: number;
  currentMP: number;
  /** Bonus added on top of (WLP die × 5 + level) to get max MP. */
  mpBonus: number;
  currentXP: number;
  totalXP: number;
  level: number;
  zenit: number;
  attributes: {
    dex: Attribute;
    insight: Attribute;
    might: Attribute;
    willpower: Attribute;
  };
  bonds: Bond[];
  backstoryPrompts: BackstoryPrompt[];
  notes: string;
  classes: ClassEntry[];
  skillGroups: SkillGroup[];
  spellGroups: SpellGroup[];
  equipment: EquipmentItem[];
  backpack: BackpackItem[];
  statusEffects: StatusEffects;
  traits: { identity: string[]; theme: string; origin: string };
};

type PersistedCharacterState = {
  schemaVersion: number;
  character: Character;
};

export type {
  BackpackItem,
  BackstoryPrompt,
  Character,
  CharacterName,
  ClassEntry,
  PersistedCharacterState,
  StatusEffects,
};
