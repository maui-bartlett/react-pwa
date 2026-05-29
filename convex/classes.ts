import { v } from 'convex/values';

import { internalMutation, query } from './_generated/server';

const AVATAR_LEGENDS_GAME_SYSTEM = 'avatar-legends';
const TITLE_SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'into',
  'like',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

function titleCaseWord(word: string, index: number, words: string[]) {
  const lower = word.toLowerCase();
  const isEdgeWord = index === 0 || index === words.length - 1;
  if (!isEdgeWord && TITLE_SMALL_WORDS.has(lower)) return lower;
  if (lower === 'i') return 'I';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleCaseSegment(segment: string) {
  const words = segment.split(/(\s+)/);
  const wordOnly = words.filter((part) => !/^\s+$/.test(part) && part.length > 0);
  let wordIndex = 0;

  return words
    .map((part) => {
      if (/^\s+$/.test(part) || part.length === 0) return part;
      const titled = titleCaseWord(part, wordIndex, wordOnly);
      wordIndex += 1;
      return titled;
    })
    .join('');
}

function titleCaseLabel(label: string) {
  return label
    .trim()
    .split(/(-)/)
    .map((part) => (part === '-' ? part : titleCaseSegment(part)))
    .join('');
}

function stripExtractedText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripExtractedText);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'extractedText')
      .map(([key, nested]) => [key, stripExtractedText(nested)]),
  );
}

function normalizeClassInfo(classInfo: Record<string, unknown>) {
  const next = { ...classInfo };

  if (typeof next.className === 'string') next.className = titleCaseLabel(next.className);
  if (Array.isArray(next.opposingPrinciples)) {
    next.opposingPrinciples = next.opposingPrinciples.map((principle) =>
      typeof principle === 'string' ? titleCaseLabel(principle) : principle,
    );
  }
  if (Array.isArray(next.demeanorOptions)) {
    next.demeanorOptions = next.demeanorOptions.map((demeanor) =>
      typeof demeanor === 'string' ? titleCaseLabel(demeanor) : demeanor,
    );
  }
  if (next.classTrait && typeof next.classTrait === 'object' && !Array.isArray(next.classTrait)) {
    next.classTrait = { ...(next.classTrait as Record<string, unknown>) };
    const trait = next.classTrait as Record<string, unknown>;
    if (typeof trait.name === 'string') trait.name = titleCaseLabel(trait.name);
  }
  if (Array.isArray(next.classMoves)) {
    next.classMoves = next.classMoves.map((move) => {
      if (!move || typeof move !== 'object' || Array.isArray(move)) return move;
      const normalized = { ...(move as Record<string, unknown>) };
      if (typeof normalized.name === 'string') normalized.name = titleCaseLabel(normalized.name);
      return normalized;
    });
  }
  if (Array.isArray(next.movesAdvice)) {
    next.movesAdvice = next.movesAdvice.map((advice) => {
      if (!advice || typeof advice !== 'object' || Array.isArray(advice)) return advice;
      const normalized = { ...(advice as Record<string, unknown>) };
      if (typeof normalized.moveName === 'string') {
        normalized.moveName = titleCaseLabel(normalized.moveName);
      }
      return normalized;
    });
  }
  if (
    next.advancedTechnique &&
    typeof next.advancedTechnique === 'object' &&
    !Array.isArray(next.advancedTechnique)
  ) {
    next.advancedTechnique = { ...(next.advancedTechnique as Record<string, unknown>) };
    const technique = next.advancedTechnique as Record<string, unknown>;
    if (typeof technique.techniqueName === 'string') {
      technique.techniqueName = titleCaseLabel(technique.techniqueName);
    }
    if (typeof technique.approach === 'string') {
      technique.approach = titleCaseLabel(technique.approach);
    }
  }

  return next;
}

export const replaceAvatarLegendsClasses = internalMutation({
  args: { classes: v.array(v.any()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('classes').collect();
    const idsToDelete = new Set(
      existing
        .filter((classDoc) => {
          const oldShapeGameSystem = (classDoc as { meta?: { gameSystem?: string } }).meta
            ?.gameSystem;
          const newShapeGameSystem = (classDoc as { class?: { meta?: { gameSystem?: string } } })
            .class?.meta?.gameSystem;
          return (
            oldShapeGameSystem === AVATAR_LEGENDS_GAME_SYSTEM ||
            newShapeGameSystem === AVATAR_LEGENDS_GAME_SYSTEM
          );
        })
        .map((classDoc) => classDoc._id),
    );

    await Promise.all([...idsToDelete].map((classId) => ctx.db.delete(classId)));

    const ids = [];
    for (const classInfo of args.classes) {
      const stripped = stripExtractedText(classInfo);
      if (!stripped || typeof stripped !== 'object' || Array.isArray(stripped)) continue;
      const normalized = normalizeClassInfo(stripped as Record<string, unknown>);
      const classDoc = {
        class: {
          ...normalized,
          meta: { gameSystem: AVATAR_LEGENDS_GAME_SYSTEM },
        },
      };
      ids.push(await ctx.db.insert('classes', classDoc));
    }

    return { deleted: idsToDelete.size, inserted: ids.length };
  },
});

export const listAvatarLegendsClasses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM),
      )
      .collect();
  },
});

export const getAvatarLegendsClassByName = query({
  args: { className: v.string() },
  handler: async (ctx, args) => {
    const className = titleCaseLabel(args.className);
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM).eq('class.className', className),
      )
      .unique();
    return classDoc?.class ?? null;
  },
});
