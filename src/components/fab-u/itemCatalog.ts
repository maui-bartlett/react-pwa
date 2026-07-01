import type { EquipmentItem } from './types';

/** A Fabula Ultima catalog item as returned by `items.listByGameSystem`. */
export type CatalogItem = {
  _id?: string;
  name: string;
  type: string;
  category?: string;
  cost_z?: number;
  rarity?: string;
  martial?: boolean;
  quality?: string | null;
  description?: string;
  summary?: string;
  accuracy?: string;
  damage?: string;
  damage_type?: string;
  hands?: string;
  range?: string;
  notes?: string;
  defense?: string | number;
  magic_defense?: string | number;
  defense_bonus?: number;
  magic_defense_bonus?: number;
  initiative?: number;
  ip_cost?: number;
  effect?: string;
  passengers?: string;
  distance_multiplier?: number;
};

export const EQUIPMENT_SLOTS = ['Main Hand', 'Off Hand', 'Accessory', 'Armor'] as const;
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

/** Which catalog items may go into a given Equipment slot. Backpack ('all')
 *  accepts everything. */
export function itemFitsSlot(item: CatalogItem, slot: EquipmentSlot | 'all'): boolean {
  switch (slot) {
    case 'Main Hand':
      return item.type === 'weapon';
    case 'Off Hand':
      return item.type === 'shield' || (item.type === 'weapon' && item.hands === 'one-handed');
    case 'Armor':
      return item.type === 'armor';
    case 'Accessory':
      return item.type === 'accessory';
    case 'all':
    default:
      return true;
  }
}

/** Human cost label, e.g. "100z" or "3 IP". */
export function itemCostLabel(item: CatalogItem): string {
  if (typeof item.cost_z === 'number') return `${item.cost_z}z`;
  if (typeof item.ip_cost === 'number') return `${item.ip_cost} IP`;
  return '';
}

/** Compact stat chips for an item, keyed off its type. */
export function itemStatTags(item: CatalogItem): string[] {
  const tags: string[] = [];
  const push = (v: unknown) => {
    if (v !== undefined && v !== null && String(v).trim().length > 0) tags.push(String(v).trim());
  };
  switch (item.type) {
    case 'weapon':
      push(item.category);
      push(item.hands);
      push(item.range);
      if (item.accuracy) push(`【${item.accuracy}】`);
      if (item.damage) push(`${item.damage}${item.damage_type ? ` ${item.damage_type}` : ''}`);
      if (item.martial) push('martial');
      break;
    case 'armor':
      if (item.defense !== undefined) push(`DEF ${item.defense}`);
      if (item.magic_defense !== undefined) push(`M.DEF ${item.magic_defense}`);
      if (item.initiative) push(`Init ${item.initiative}`);
      if (item.martial) push('martial');
      break;
    case 'shield':
      if (item.defense_bonus !== undefined) push(`DEF +${item.defense_bonus}`);
      if (item.magic_defense_bonus !== undefined) push(`M.DEF +${item.magic_defense_bonus}`);
      if (item.initiative) push(`Init ${item.initiative}`);
      if (item.martial) push('martial');
      break;
    case 'consumable':
      push(item.category);
      break;
    case 'service':
      push(item.category);
      break;
    case 'transport':
      push(item.category);
      if (item.passengers) push(`${item.passengers} passenger(s)`);
      if (item.distance_multiplier) push(`×${item.distance_multiplier} distance`);
      break;
    case 'accessory':
    default:
      break;
  }
  return tags;
}

/** The descriptive line shown for an item (effect / summary / quality). */
export function itemDescription(item: CatalogItem): string {
  return (
    item.summary?.trim() ||
    item.effect?.trim() ||
    (typeof item.quality === 'string' ? item.quality.trim() : '') ||
    item.description?.trim() ||
    ''
  );
}

/** Map a catalog item into an EquipmentItem for a given slot. */
export function catalogItemToEquipment(item: CatalogItem, slot: EquipmentSlot): EquipmentItem {
  const tags = itemStatTags(item);
  return {
    name: item.name,
    slot,
    description: itemDescription(item),
    tags: tags.length ? tags : undefined,
    weight: itemCostLabel(item) || undefined,
  };
}

/** One-line subtitle for a backpack entry. */
export function catalogItemBackpackSubtitle(item: CatalogItem): string {
  const parts = itemStatTags(item);
  const cost = itemCostLabel(item);
  if (cost) parts.push(cost);
  if (parts.length) return parts.join(' · ');
  return itemDescription(item);
}
