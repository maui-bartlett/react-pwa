import { v } from 'convex/values';

import { FABULA_ULTIMA_ITEMS } from './data/fabulaUltimaItems';
import { internalMutation, query } from './_generated/server';

const FABULA_ULTIMA_GAME_SYSTEM = 'fabula-ultima';

/**
 * Public catalog read: every item registered for a game system. Used by the
 * FabU item picker to populate selectable equipment / backpack items.
 */
export const listByGameSystem = query({
  args: { gameSystem: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('items')
      .withIndex('by_metaGameSystem', (q) => q.eq('meta.gameSystem', args.gameSystem))
      .collect();
  },
});

/**
 * Seed the Fabula Ultima item catalog. Idempotent — clears the existing FU
 * items and re-inserts from the generated data file. Run after deploy:
 *   npx convex run items:seedFabulaUltimaItems
 */
export const seedFabulaUltimaItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('items')
      .withIndex('by_metaGameSystem', (q) => q.eq('meta.gameSystem', FABULA_ULTIMA_GAME_SYSTEM))
      .collect();
    await Promise.all(existing.map((doc) => ctx.db.delete(doc._id)));

    const now = Date.now();
    let inserted = 0;
    for (const item of FABULA_ULTIMA_ITEMS) {
      await ctx.db.insert('items', {
        ...item,
        meta: { gameSystem: FABULA_ULTIMA_GAME_SYSTEM },
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }
    return { deleted: existing.length, inserted };
  },
});
