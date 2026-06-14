import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getAuthUser } from './lib/auth';

// Singleton key under which the latest published PWA build version lives in
// the `appConfig` table.
const PWA_VERSION_KEY = 'pwaVersion';
// Build version format: YYYY.MM.DD.N (N is an unbounded integer).
const VERSION_PATTERN = /^\d{4}\.\d{2}\.\d{2}\.\d+$/;
// Reject versions dated implausibly far in the future so a compromised client
// can't pin every other client to a perpetual update prompt. Two days of slack
// covers timezone skew around a same-day deploy.
const MAX_FUTURE_SKEW_MS = 2 * 24 * 60 * 60 * 1000;

function isImplausiblyFutureDated(version: string): boolean {
  const [year, month, day] = version.split('.').map((part) => Number.parseInt(part, 10));
  const versionDate = Date.UTC(year, month - 1, day);
  return versionDate > Date.now() + MAX_FUTURE_SKEW_MS;
}

/**
 * Numeric-aware comparison of two `YYYY.MM.DD.N` version strings. Returns a
 * positive number when `a` is newer than `b`, negative when older, 0 when
 * equal. Component-wise integer compare so `...13.10` correctly beats `...13.8`
 * (plain string comparison would get that backwards).
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const partsB = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);
  for (let index = 0; index < length; index += 1) {
    const valueA = partsA[index] ?? 0;
    const valueB = partsB[index] ?? 0;
    if (valueA !== valueB) return valueA - valueB;
  }
  return 0;
}

/** Latest published PWA build version, or null if none has been published. */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query('appConfig')
      .withIndex('by_key', (q) => q.eq('key', PWA_VERSION_KEY))
      .unique();
    return doc?.value ?? null;
  },
});

/**
 * Publish a client's build version. The stored value only ever moves forward,
 * so an older client loading the app can never roll the advertised version
 * back. The first client to load a new deploy publishes it, which is what
 * prompts every other open client to update.
 */
export const publish = mutation({
  args: { version: v.string() },
  handler: async (ctx, args) => {
    // Only authenticated clients may advertise a build version, so the update
    // signal can't be poisoned by anonymous callers. Reads stay public so even
    // signed-out clients still get prompted.
    const authUser = await getAuthUser(ctx);
    if (!authUser) {
      return { published: false, current: null as string | null };
    }

    const version = args.version.trim();
    if (!VERSION_PATTERN.test(version) || isImplausiblyFutureDated(version)) {
      return { published: false, current: null as string | null };
    }

    const existing = await ctx.db
      .query('appConfig')
      .withIndex('by_key', (q) => q.eq('key', PWA_VERSION_KEY))
      .unique();

    if (!existing) {
      await ctx.db.insert('appConfig', {
        key: PWA_VERSION_KEY,
        value: version,
        updatedAt: Date.now(),
      });
      return { published: true, current: version };
    }

    if (compareVersions(version, existing.value) > 0) {
      await ctx.db.patch(existing._id, { value: version, updatedAt: Date.now() });
      return { published: true, current: version };
    }

    return { published: false, current: existing.value };
  },
});
