export type FabUTab = 'overview' | 'combat' | 'skills' | 'spells' | 'gear' | 'notes';

export type BondType =
  | 'Admiration'
  | 'Loyalty'
  | 'Affection'
  | 'Inferiority'
  | 'Mistrust'
  | 'Hatred';

export type Bond = {
  id: string;
  characterName: string;
  types: BondType[];
};

export type CombatSubTab = 'bonds' | 'skills' | 'spells' | 'gear';

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export type DieSize = 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export type Attribute = { die: DieSize; modifier: number; temp?: DieSize | null };

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
  layout?: 'stacked' | 'inline';
  minHeight?: number | string;
  onChange?: (value: number) => void;
  onChangeSuffix?: (value: number | null) => void;
  valueSuffix?: string;
  /** When set, the committed value is clamped to [0, maxValue]. */
  maxValue?: number;
  /** When set, the committed suffix value is clamped to [0, maxValueSuffix]. */
  maxValueSuffix?: number;
  pw?: string;
};

export type AttributeRow = {
  label: string;
  score: string;
  modifier: string;
  category?: string;
  die?: DieSize;
  modifierNum?: number;
  temp?: DieSize | null;
  onChangeDie?: (die: DieSize) => void;
  onChangeModifier?: (mod: number) => void;
  onChangeTemp?: (temp: DieSize | null) => void;
};

export type SkillRow = {
  name: string;
  level?: string;
  effect: string;
};

export type SpellRow = {
  name: string;
  cost: string;
  target: string;
  duration: 'Instant' | 'Scene';
  effect: string;
};

export type EquipmentItem = {
  name: string;
  slot: string;
  tags?: string[];
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
