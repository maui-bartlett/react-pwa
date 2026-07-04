import { v } from 'convex/values';

import { type MutationCtx, internalMutation, query } from './_generated/server';
import { DUNGEONS_AND_DRAGONS_SPELLS } from './data/dungeonsAndDragonsSpells';
import { FABULA_ULTIMA_ITEMS } from './data/fabulaUltimaItems';
import { openDndSpellCatalog } from './data/openDndSpellCatalog';

const FABULA_ULTIMA_GAME_SYSTEM = 'fabula-ultima';
const DUNGEONS_AND_DRAGONS_GAME_SYSTEM = 'dungeons-and-dragons';

type CatalogType = 'item' | 'spell';
type CatalogRecord = Record<string, unknown>;

function asObject(value: unknown): CatalogRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as CatalogRecord)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeCatalogType(value: unknown, fallback: CatalogType): CatalogType {
  const normalized = asString(value)?.toLowerCase();
  return normalized === 'spell' ? 'spell' : fallback;
}

function inferCatalogType(record: CatalogRecord, fallback: CatalogType): CatalogType {
  const metadata = asObject(record.metadata);
  return normalizeCatalogType(metadata.type ?? record.type ?? record.category, fallback);
}

function normalizeCatalogRecord(
  record: CatalogRecord,
  gameSystem: string,
  fallbackType: CatalogType,
  now: number,
) {
  const { _creationTime: _discardedCreationTime, _id: _discardedId, ...data } = record;
  const meta = asObject(record.meta);
  const metadata = asObject(record.metadata);
  const catalogType = inferCatalogType(record, fallbackType);
  void _discardedCreationTime;
  void _discardedId;
  const category = asString(record.category) ?? (catalogType === 'spell' ? 'Spell' : undefined);

  return {
    ...data,
    type: asString(record.type) ?? catalogType,
    ...(category ? { category } : {}),
    meta: {
      ...meta,
      gameSystem,
    },
    metadata: {
      ...metadata,
      gameSystem,
      type: catalogType,
    },
    createdAt: typeof record.createdAt === 'number' ? record.createdAt : now,
    updatedAt: now,
  };
}

function catalogKey(record: CatalogRecord, gameSystem: string, fallbackType: CatalogType) {
  const name = asString(record.name) ?? asString(record.slug) ?? asString(record.id);
  if (!name) return null;
  return `${gameSystem}:${inferCatalogType(record, fallbackType)}:${name.toLowerCase()}`;
}

async function upsertCatalogRecords(
  ctx: MutationCtx,
  gameSystem: string,
  records: CatalogRecord[],
  fallbackType: CatalogType,
) {
  const dedupedRecords = new Map<string, CatalogRecord>();
  for (const record of records) {
    const key = catalogKey(record, gameSystem, fallbackType);
    if (key) {
      dedupedRecords.set(key, {
        ...dedupedRecords.get(key),
        ...record,
      });
    }
  }

  const existing = await ctx.db
    .query('catalog')
    .withIndex('by_metadataGameSystem', (q) => q.eq('metadata.gameSystem', gameSystem))
    .collect();
  const existingByKey = new Map(
    existing
      .map((doc) => [catalogKey(doc as CatalogRecord, gameSystem, fallbackType), doc] as const)
      .filter((entry): entry is [string, (typeof existing)[number]] => entry[0] !== null),
  );

  const now = Date.now();
  let inserted = 0;
  let updated = 0;

  for (const [key, record] of dedupedRecords.entries()) {
    const normalized = normalizeCatalogRecord(record, gameSystem, fallbackType, now);
    const existingDoc = existingByKey.get(key);
    if (existingDoc) {
      await ctx.db.patch(existingDoc._id, normalized);
      updated += 1;
    } else {
      const id = await ctx.db.insert('catalog', normalized);
      existingByKey.set(key, { ...normalized, _id: id, _creationTime: now });
      inserted += 1;
    }
  }

  return { inserted, updated, skippedDuplicates: records.length - dedupedRecords.size };
}

async function dedupeCatalogRows(ctx: MutationCtx, gameSystem: string, fallbackType: CatalogType) {
  const rows = await ctx.db
    .query('catalog')
    .withIndex('by_metadataGameSystem', (q) => q.eq('metadata.gameSystem', gameSystem))
    .collect();
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = catalogKey(row as CatalogRecord, gameSystem, fallbackType);
    if (!key) continue;
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  let deleted = 0;
  let groupsDeduped = 0;
  for (const group of grouped.values()) {
    if (group.length <= 1) continue;
    groupsDeduped += 1;
    const sorted = [...group].sort((a, b) => {
      const aUpdatedAt = typeof a.updatedAt === 'number' ? a.updatedAt : 0;
      const bUpdatedAt = typeof b.updatedAt === 'number' ? b.updatedAt : 0;
      if (bUpdatedAt !== aUpdatedAt) return bUpdatedAt - aUpdatedAt;
      return b._creationTime - a._creationTime;
    });
    const [keeper, ...duplicates] = sorted;
    const now = Date.now();
    const merged = duplicates.reduce<CatalogRecord>(
      (acc, duplicate) => ({ ...duplicate, ...acc }),
      keeper as CatalogRecord,
    );
    await ctx.db.patch(keeper._id, normalizeCatalogRecord(merged, gameSystem, fallbackType, now));
    await Promise.all(duplicates.map((duplicate) => ctx.db.delete(duplicate._id)));
    deleted += duplicates.length;
  }

  return { deleted, groupsDeduped, remaining: rows.length - deleted };
}

/**
 * Public catalog read: every catalog entry registered for a game system. The
 * legacy `items` table is included as a fallback until all deployed data has
 * been migrated into `catalog`.
 */
export const listByGameSystem = query({
  args: { gameSystem: v.string() },
  handler: async (ctx, args) => {
    const [catalogRows, legacyRows] = await Promise.all([
      ctx.db
        .query('catalog')
        .withIndex('by_metadataGameSystem', (q) =>
          q.eq('metadata.gameSystem', args.gameSystem),
        )
        .collect(),
      ctx.db
        .query('items')
        .withIndex('by_metaGameSystem', (q) => q.eq('meta.gameSystem', args.gameSystem))
        .collect(),
    ]);

    const byKey = new Map<string, CatalogRecord>();
    for (const row of legacyRows) {
      const record = row as CatalogRecord;
      const key = catalogKey(record, args.gameSystem, 'item');
      if (key) {
        byKey.set(key, {
          _id: record._id,
          _creationTime: record._creationTime,
          ...normalizeCatalogRecord(record, args.gameSystem, 'item', Date.now()),
        });
      }
    }
    for (const row of catalogRows) {
      const record = row as CatalogRecord;
      const key = catalogKey(record, args.gameSystem, 'item');
      if (key) byKey.set(key, record);
    }

    return Array.from(byKey.values());
  },
});

/**
 * Copy legacy `items` rows into `catalog` and add `metadata.type`. Safe to run
 * repeatedly; `catalog` rows are upserted by game system + type + name.
 */
export const migrateItemsToCatalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    const legacyRows = await ctx.db.query('items').collect();
    const grouped = new Map<string, CatalogRecord[]>();
    for (const row of legacyRows) {
      const record = row as CatalogRecord;
      const meta = asObject(record.meta);
      const metadata = asObject(record.metadata);
      const gameSystem = asString(metadata.gameSystem) ?? asString(meta.gameSystem);
      if (!gameSystem) continue;
      const rows = grouped.get(gameSystem) ?? [];
      rows.push(record);
      grouped.set(gameSystem, rows);
    }

    const results: Record<string, { inserted: number; updated: number }> = {};
    for (const [gameSystem, rows] of grouped.entries()) {
      results[gameSystem] = await upsertCatalogRecords(ctx, gameSystem, rows, 'item');
    }
    return results;
  },
});

/**
 * Remove duplicate catalog docs already present in the physical collection.
 * Rows are considered duplicates by game system + metadata.type + name.
 */
export const dedupeCatalog = internalMutation({
  args: {
    gameSystem: v.string(),
    type: v.union(v.literal('item'), v.literal('spell')),
  },
  handler: async (ctx, args) => {
    return await dedupeCatalogRows(ctx, args.gameSystem, args.type);
  },
});

/**
 * Seed the Fabula Ultima item catalog into the renamed `catalog` table.
 * Idempotent; existing rows are updated and retain stable document IDs.
 */
export const seedFabulaUltimaItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await upsertCatalogRecords(
      ctx,
      FABULA_ULTIMA_GAME_SYSTEM,
      FABULA_ULTIMA_ITEMS,
      'item',
    );
  },
});

/**
 * Seed all DnD spell catalog entries into the renamed `catalog` table.
 * Idempotent; existing spell rows are updated and keep their document IDs.
 */
export const seedDungeonsAndDragonsSpells = internalMutation({
  args: {},
  handler: async (ctx) => {
    const spells: CatalogRecord[] = [
      ...DUNGEONS_AND_DRAGONS_SPELLS.map((spell) => spell as CatalogRecord),
      ...openDndSpellCatalog.map((spell) => spell as CatalogRecord),
    ];
    return await upsertCatalogRecords(
      ctx,
      DUNGEONS_AND_DRAGONS_GAME_SYSTEM,
      spells,
      'spell',
    );
  },
});
