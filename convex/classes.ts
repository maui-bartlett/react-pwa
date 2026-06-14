import { v } from 'convex/values';

import { internalMutation, query } from './_generated/server';
import { deriveTechniqueFatigue } from './lib/avatarTechniqueFatigue';

const AVATAR_LEGENDS_GAME_SYSTEM = 'avatar-legends';
const FABULA_ULTIMA_GAME_SYSTEM = 'fabula-ultima';
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
    technique.fatigue = deriveTechniqueFatigue(
      typeof technique.description === 'string'
        ? technique.description
        : typeof technique.text === 'string'
          ? technique.text
          : '',
      typeof technique.approach === 'string' ? technique.approach : '',
    );
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

export const clearFabulaUltimaClasses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem', (q) =>
        q.eq('class.meta.gameSystem', FABULA_ULTIMA_GAME_SYSTEM),
      )
      .collect();

    await Promise.all(existing.map((classDoc) => ctx.db.delete(classDoc._id)));

    return { deleted: existing.length };
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

export const listFabulaUltimaClasses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem', (q) =>
        q.eq('class.meta.gameSystem', FABULA_ULTIMA_GAME_SYSTEM),
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

// Cleaned "A Tainted Past" trait text for The Successor. The raw rulebook
// extraction interleaved a status/condition sidebar and stray labels
// ("Conditions", "FOCUS [+1]", "NEGATIVE Background NAME:") into the domain
// checkboxes. This version drops that noise and uses line breaks to delineate
// the intro, the two domain rows, the resource list, and the three sub-moves
// (Lineage Resources / Humble Yourself / Raid Your Lineage's Resources) so the
// sheet can render proper headings, paragraphs, and a checkbox grid.
const SUCCESSOR_CLASS_TRAIT_TEXT = `You hail from a powerful, infamous lineage — one with an impressive and terrible reputation. Your lineage has had a massive impact on the world within the scope of your story — its reach extends over the whole scope, and everyone in the scope knows of it. Choose one domain that is the source of your lineage’s power—the area in which they affected the world—and another into which they’re now beginning to extend their reach.
□ high society □ military command □ arts and entertainment □ land ownership □ organized crime □ spiritual authority □ state politics □ business and industry □ elite academics □ vigilante militias □ media and news □ vital supply chains
Lineage Resources
You have access to your family’s extensive stores of two of the following resources:
□ obscure or forbidden knowledge □ introductions and connections □ servants or muscle □ high technology □ cold hard cash □ spiritual artifacts or tomes
Spend resources during the session to establish a boon you had previously asked for or obtained, something that your lineage’s unique position and stores could provide: a vehicle, an invitation, a chest of jade coins, etc.
Humble Yourself
When you politely and obediently humble yourself before a powerful member of your lineage, roll with your Tradition. On a hit, you earn some credit; hold 3-resources. On a 7–9, their resources don’t come without strings; you’ll need to promise to fulfill some other obligation of your lineage, or let them shift your balance. On a miss, they’re dissatisfied with your display; they’re cutting you off until you fulfill some task they set to you.
Raid Your Lineage’s Resources
When you raid your lineage’s resources without their consent or knowledge, mark a condition and roll with your Progress. On a hit, hold 1-resource. On a 7–9, choose 1. On a 10+, choose 2.
• You obtain an additional 1-resource • You nab your goodies quietly; your lineage is none the wiser • You steel yourself for what you’re doing; avoid marking a condition
On a miss, you’re caught red-handed by a powerful member of your lineage who saw you coming.`;

/**
 * One-off cleanup: replace The Successor's class-trait text with the cleaned,
 * line-structured version above. Idempotent — safe to re-run.
 */
export const cleanSuccessorClassTrait = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q
          .eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM)
          .eq('class.className', 'The Successor'),
      )
      .unique();
    if (!classDoc) return { updated: false };

    const classInfo = classDoc.class as Record<string, unknown>;
    const classTrait =
      classInfo.classTrait && typeof classInfo.classTrait === 'object'
        ? { ...(classInfo.classTrait as Record<string, unknown>) }
        : {};
    classTrait.text = SUCCESSOR_CLASS_TRAIT_TEXT;
    await ctx.db.patch(classDoc._id, { class: { ...classInfo, classTrait } });
    return { updated: true };
  },
});

// Cleaned "Marked by Fate" trait text for The Destined. Drops the status /
// condition sidebar and stray rulebook labels, and line-structures the
// content so the sheet renders headings, paragraphs, a bullet list, a Destiny
// Track (a heading with five boxes, encoded as "Destiny Track □ □ □ □ □"), and
// the five Destiny Sign checkboxes.
const DESTINED_CLASS_TRAIT_TEXT = `You have been touched by something beyond—something spiritual and otherworldly. (See “My Destiny”). At character creation, fill in one detail and take one destiny sign below.
Destiny Details
Fill these in as your destiny is revealed to you, either in visions or through the insights of spiritually attuned NPCs. When you act to bring about one of these details, you may live up to your Determination without marking fatigue. When you and the GM agree one of the details is fully explored or fulfilled, mark growth.
• I will bring great change to ______ • I will weather betrayal by ______ • I will lose ______ • I will need the help of ______ • I will learn a crucial truth from ______ • I will defend or save ______
Destiny Track □ □ □ □ □
Whenever you lose your balance, get taken out, or are otherwise instructed to, mark your Destiny Track. When your destiny track fills, clear it and take a destiny sign. If you have already taken the other five, you must take “meet your fate.”
Destiny Signs
□ Otherworldly Visions: Mark your destiny track to have a vision about the situation at hand. Ask the GM one question and get an honest answer. □ Tremble Before Me: Mark your destiny track and reveal a glimpse of your otherworldly aspect to intimidate an NPC as if you rolled a 10+. Afterward, their fear and mistrust of you knows no bounds; you cannot guide and comfort or plead with that NPC until you have earned their trust. □ Self-sacrificing: Once per scene, mark your destiny track to supernaturally absorb an incoming blow aimed at an ally within view; cancel all fatigue, conditions, or balance shifts that would have been inflicted. □ Inner Strength: Once per session, mark destiny twice to clear all conditions. □ Meet Your Fate: Your destiny arrives and you are changed utterly by it. If you survive in human form, change playbooks.`;

/**
 * One-off cleanup: replace The Destined's class-trait text with the cleaned,
 * line-structured version above. Idempotent — safe to re-run.
 */
export const cleanDestinedClassTrait = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM).eq('class.className', 'The Destined'),
      )
      .unique();
    if (!classDoc) return { updated: false };

    const classInfo = classDoc.class as Record<string, unknown>;
    const classTrait =
      classInfo.classTrait && typeof classInfo.classTrait === 'object'
        ? { ...(classInfo.classTrait as Record<string, unknown>) }
        : {};
    classTrait.text = DESTINED_CLASS_TRAIT_TEXT;
    await ctx.db.patch(classDoc._id, { class: { ...classInfo, classTrait } });
    return { updated: true };
  },
});
