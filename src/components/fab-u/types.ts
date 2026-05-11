export type FabUTab = 'overview' | 'combat' | 'skills' | 'spells' | 'gear' | 'notes';

export type CombatSubTab = 'bonds' | 'skills' | 'spells' | 'gear';

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export type TabOption<T extends string> = {
  label: string;
  value: T;
};

export type HeaderAction = {
  label: string;
  value: string;
};

export type StatPillData = {
  label: string;
  value: string;
  helperText?: string;
  tone?: Tone;
};

export type AttributeRow = {
  label: string;
  score: string;
  modifier: string;
  category?: string;
};

export type SkillRow = {
  name: string;
  attribute: string;
  rank: string;
  modifier: string;
  focus?: string;
};

export type SpellRow = {
  name: string;
  discipline: string;
  cost: string;
  range: string;
  effect: string;
};

export type EquipmentItem = {
  name: string;
  slot: string;
  tags: string[];
  description: string;
  weight?: string;
};

export type NoteItem = {
  title: string;
  body: string;
  updatedAt: string;
  tag?: string;
};

export type BondItem = {
  name: string;
  role: string;
  strength: string;
  influence: string;
  note: string;
};
