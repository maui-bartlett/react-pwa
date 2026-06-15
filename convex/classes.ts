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
You have access to your family’s extensive stores of two of the following resources.
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
□ Otherworldly Visions: Mark your destiny track to have a vision about the situation at hand. Ask the GM one question and get an honest answer. □ Inner Strength: Once per session, mark destiny twice to clear all conditions. □ Self-sacrificing: Once per scene, mark your destiny track to supernaturally absorb an incoming blow aimed at an ally within view; cancel all fatigue, conditions, or balance shifts that would have been inflicted. □ Tremble Before Me: Mark your destiny track and reveal a glimpse of your otherworldly aspect to intimidate an NPC as if you rolled a 10+. Afterward, their fear and mistrust of you knows no bounds; you cannot guide and comfort or plead with that NPC until you have earned their trust. □ Meet Your Fate: Your destiny arrives and you are changed utterly by it. If you survive in human form, change playbooks.`;

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

// Cleaned "Role" trait text for The Icon. Drops the status sidebar / stray
// labels and line-structures it so the responsibilities and prohibitions
// become checkbox grids under their headings, and the moves (Break Tradition,
// Live Up to Your Role, End of Session) read as headings + paragraphs.
const ICON_CLASS_TRAIT_TEXT = `You are an icon of your burden and tradition. You are expected to be its exemplar, its single most important representative, trained up from a young age and saddled with the weight of history. You have been told that you are vital to the world.
Choose 3 responsibilities of your burden and tradition you are expected to assume:
□ Protecting humanity from natural disasters and dark spirits □ destroying dangerous creatures □ overthrowing tyrants □ serving and defending rightful rulers □ performing rituals □ providing aid and succor to the downtrodden □ searching for hidden histories and artifacts □ guarding nature from threats and destruction □ safekeeping records and relics
Choose 3 prohibitions of your burden and tradition:
□ Never refuse an earnest request for help □ never express great emotion □ never run from a fight □ never start a fight □ never deny someone knowledge or truth □ never use your role for gain or profit □ never intervene in a community without invitation □ never withhold forgiveness □ never steal or cheat
Break Tradition
When you directly and openly break a prohibition of your burden and tradition, mark a condition, shift your balance twice towards Freedom, and mark growth.
Live Up to Your Role
When you live up to your Role through the responsibilities of your burden and tradition despite opposition or danger, shift your balance toward Role instead of marking fatigue, and clear fatigue equal to your Role (minimum 0-fatigue).
End of Session
At the end of each session, answer these after your standard growth questions.
• Did I uphold a responsibility? If yes, shift balance toward Role and clear a condition. • Did I break a prohibition? If yes, shift balance toward Freedom.
Underline one prohibition you broke during the session. If it’s already underlined, cross it out—it doesn’t mean anything to you to break it again.`;

/** One-off cleanup of The Icon's class-trait text. Idempotent. */
export const cleanIconClassTrait = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM).eq('class.className', 'The Icon'),
      )
      .unique();
    if (!classDoc) return { updated: false };
    const classInfo = classDoc.class as Record<string, unknown>;
    const classTrait =
      classInfo.classTrait && typeof classInfo.classTrait === 'object'
        ? { ...(classInfo.classTrait as Record<string, unknown>) }
        : {};
    classTrait.text = ICON_CLASS_TRAIT_TEXT;
    await ctx.db.patch(classDoc._id, { class: { ...classInfo, classTrait } });
    return { updated: true };
  },
});

// Cleaned "Squad Leader" trait text for The Pillar. Converts the squad-trait,
// values, and team-disposition lists into checkbox grids under their headings,
// keeps the leadership/support style lists, and breaks the prose paragraphs
// out. Drops the trailing status sidebar.
const PILLAR_CLASS_TRAIT_TEXT = `You were the leader of a small group of 10 or so well-trained warriors from a recognized and noble tradition. Where does your squad call home? _______________________________
Which are the most well known traits of your squad? (choose up to 3):
□ our weapons □ our fighting style □ our battle cry □ our costumes □ our legends □ our purpose
What does your squad value? (choose 2):
□ Excellence □ Justice □ Duty □ Mercy □ Tradition □ Protection
Despite being the leader, you chose to travel with your new companions for the time being, until you’ve achieved this group’s purpose.
Choose where your team is without you:
□ protecting the team’s home while you are away □ training and preparing for something important □ temporarily disbanded or exiled □ protecting a powerful figure □ journeying, doing good works throughout your scope □ performing traditional or ceremonial duties □ stationed at an important location □ escorting important travelers
Within any group, you serve a role both subtle and overt, sometimes leading the team, sometimes helping it glue itself together. You earn Team through your leadership style, and you spend Team through your support style. At the end of each session, you may change 1 style of leadership and 1 style of support.
Choose 2 styles of leadership. Earn 1-Team when…
□ Firm: …you openly call on a companion to live up to their principle. □ Inspiring: …you live up to your principle and roll a hit. □ Indomitable: …you roll a hit when you resist shifting your balance or you deny a callout. □ Empathetic: …you guide and comfort a companion and they open up to you. □ Guidance: …you assess a situation and give a companion instructions based on the answers. □ Diplomatic: …you plead with an NPC for help and roll a 10+.
Choose 2 styles of support. Spend 1-Team when…
□ Comforting: …you spend time one-on-one in a quiet moment with a companion to clear a condition from them. □ Invigorating: …you rally a companion to action in a tense moment to clear 2-fatigue from them. □ Defending: …you are within reach of a companion in combat to clear a negative status from them. □ Bolstering: …you help another companion to give them a +1 to their roll, after the roll. □ Encouraging: …you openly endorse a friend living up to their principle to shift their balance toward that principle. □ Trusting: …you openly endorse a friend resisting shifting their balance to give them +2, after the roll.`;

/** One-off cleanup of The Pillar's class-trait text. Idempotent. */
export const cleanPillarClassTrait = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM).eq('class.className', 'The Pillar'),
      )
      .unique();
    if (!classDoc) return { updated: false };
    const classInfo = classDoc.class as Record<string, unknown>;
    const classTrait =
      classInfo.classTrait && typeof classInfo.classTrait === 'object'
        ? { ...(classInfo.classTrait as Record<string, unknown>) }
        : {};
    classTrait.text = PILLAR_CLASS_TRAIT_TEXT;
    await ctx.db.patch(classDoc._id, { class: { ...classInfo, classTrait } });
    return { updated: true };
  },
});

// Cleaned "Bad Habits" trait text for The Rogue. Heading for the bad-habits
// list, the habits as a checkbox grid, the "Any necessary skills…" line as its
// own paragraph, and each move result (When you indulge / On a hit / On a miss)
// as its own paragraph. Trailing status sidebar dropped.
const ROGUE_CLASS_TRAIT_TEXT = `You’ve picked up some bad habits over the years. Most other people are pretty set on trying to get you to stop. But maybe you can bring your friends along for the ride…
Choose 4 bad habits you indulge:
□ Casual thievery and pickpocketing □ Vandalism or sabotage □ Trespassing □ Daredevil stunts □ “Charming” insults of dangerous people □ Cons □ Rabble-rousing □ Gambling
Any necessary skills or talents related to your bad habits are considered to be part of your background.
When you indulge a bad habit on your own, shift your balance toward Survival, and roll with Survival.
On a hit, you pull it off and vent your frustrations; clear fatigue or conditions equal to your Survival (minimum 0). If you have no fatigue or conditions, mark growth. On a 10+, you also gain a windfall, a boon or opportunity—your bad habits paid off this time.
On a miss, you’re caught by someone dangerous or powerful, and they complicate your life.
When you indulge a bad habit with a friend, shift your balance toward Friendship, and roll with Friendship.
On a hit, you and your friend pull it off and grow closer; each of you makes the other Inspired. On a 10+, you also obtain some useful resource or information, and become Prepared.
On a miss, something goes terribly awry; you can either take the heat yourself, or shift your balance twice toward Survival and leave your friend in the lurch.`;

/** One-off cleanup of The Rogue's class-trait text. Idempotent. */
export const cleanRogueClassTrait = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM).eq('class.className', 'The Rogue'),
      )
      .unique();
    if (!classDoc) return { updated: false };
    const classInfo = classDoc.class as Record<string, unknown>;
    const classTrait =
      classInfo.classTrait && typeof classInfo.classTrait === 'object'
        ? { ...(classInfo.classTrait as Record<string, unknown>) }
        : {};
    classTrait.text = ROGUE_CLASS_TRAIT_TEXT;
    await ctx.db.patch(classDoc._id, { class: { ...classInfo, classTrait } });
    return { updated: true };
  },
});

/**
 * Fix The Razor's balance principles. The class was imported with an empty
 * opposingPrinciples array, so the sheet fell back to the default
 * Tradition / Progress; The Razor's balance track is Control / Connection.
 */
export const fixRazorPrinciples = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM).eq('class.className', 'The Razor'),
      )
      .unique();
    if (!classDoc) return { updated: false };
    const classInfo = classDoc.class as Record<string, unknown>;
    await ctx.db.patch(classDoc._id, {
      class: { ...classInfo, opposingPrinciples: ['Control', 'Connection'] },
    });
    return { updated: true };
  },
});

// "Bringing Them Down" trait text for The Hammer, transcribed from the
// rulebook screenshot (the imported data had an empty trait text).
const HAMMER_CLASS_TRAIT_TEXT = `You always have an adversary, one who represents the things you’re trying to smash through—tyranny, inequality, war; larger and more dangerous concepts that, to you at least, this one person embodies. Your adversary is someone significant and powerful—someone who actually deserves the amount of force you can bring to bear.
Name your adversary: _______________________________
Choose a goal you have for your adversary:
□ Capture them □ Depose them □ Expose them □ Discredit them □ Restrain them □ Exile them
Take -1 ongoing to plead with, trick, or guide and comfort your adversary.
Changing Your Adversary
You can change your adversary any time you mark a condition, or at the end of each session. When you do, choose an appropriate goal, and the GM shifts your balance twice to match your new adversary and your new goal.
When you successfully accomplish your goal and defeat your adversary, take a growth advancement and choose a new adversary.
Fighting Your Adversary
When you enter into a fight against your adversary, clear all fatigue and become Inspired. When you select any combat approach against your adversary, mark fatigue to roll with conditions marked instead of your normal stat.`;

/** One-off creation of The Hammer's class-trait text. Idempotent. */
export const cleanHammerClassTrait = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM).eq('class.className', 'The Hammer'),
      )
      .unique();
    if (!classDoc) return { updated: false };
    const classInfo = classDoc.class as Record<string, unknown>;
    const classTrait =
      classInfo.classTrait && typeof classInfo.classTrait === 'object'
        ? { ...(classInfo.classTrait as Record<string, unknown>) }
        : {};
    classTrait.text = HAMMER_CLASS_TRAIT_TEXT;
    await ctx.db.patch(classDoc._id, { class: { ...classInfo, classTrait } });
    return { updated: true };
  },
});

// "Extraordinary Skill" trait text for The Prodigy, transcribed from the
// rulebook screenshot (the imported data held only status-sidebar noise).
const PRODIGY_CLASS_TRAIT_TEXT = `You aren’t just capable in your area of skill and training; you’re astonishing. A true prodigy, excelling and learning far more quickly than anyone would expect. You start play with one additional mastered technique.
Choose two areas in which your mastery is particularly impressive:
□ Shaping □ Maneuvering □ Breaking □ Sensing □ Forcing □ Guarding
When you rely on skills and training, use a combat stance, or otherwise trigger a move while using your mastery, ignore penalties from conditions or statuses.
When you see someone use an unknown technique, if it is available to your skills and training, you may mark fatigue to shift your balance towards Excellence and take the technique as learned. You can only do this if your balance is at +1 Excellence or higher. You must still get a mastery condition from a master of the technique in order to move the technique from practiced to mastered.
When you study with a teacher to learn a new technique, shift your balance towards Community and automatically learn the technique at the practiced level (skipping learned). You cannot learn techniques by studying with a teacher if your Balance is +0 Community or lower.
When you spend time teaching a fellow companion a technique available to their skills and training, roll with Community. On a hit, you teach well enough; they learn the technique. On a 7–9, you get impatient or frustrated; choose to either take it out on them and inflict 2 conditions, or take it out on yourself and suffer 2 conditions. On a miss, you get too frustrated with their inadequacies; both of you suffer 2 conditions, and you can never try to teach them this technique again.`;

/** One-off creation of The Prodigy's class-trait text. Idempotent. */
export const cleanProdigyClassTrait = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q
          .eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM)
          .eq('class.className', 'The Prodigy'),
      )
      .unique();
    if (!classDoc) return { updated: false };
    const classInfo = classDoc.class as Record<string, unknown>;
    const classTrait =
      classInfo.classTrait && typeof classInfo.classTrait === 'object'
        ? { ...(classInfo.classTrait as Record<string, unknown>) }
        : {};
    classTrait.text = PRODIGY_CLASS_TRAIT_TEXT;
    await ctx.db.patch(classDoc._id, { class: { ...classInfo, classTrait } });
    return { updated: true };
  },
});

// "Making Amends" trait for The Razor, transcribed from the rulebook
// screenshot. The imported data was partial and mis-named the trait
// "Disconnected" (actually a sub-section), so this also fixes the name.
const RAZOR_CLASS_TRAIT_TEXT = `You were once the weapon of powerful figures—your masters. In your time as your masters’ weapon, you hurt people, even those who looked to you for friendship, leadership, protection, or support. You must make amends. Choose four mistakes you’re trying to make up for (on the back of the sheet).
Once per session, when you have tried your best to prove that you are a different, better person now through your actions, roll, taking +1 for each “yes” to the following questions:
• Did you make amends directly to a person you harmed? • Are you at your center? • Did someone honestly thank you for your efforts or forgive you for your mistakes?
On a hit, you feel the spark of hope—you’re making progress. On a 7-9, choose 1. On a 10+, choose 2 (you can choose the same option twice), or unlock the next Connection balance track space (see Disconnected).
• Clear a condition • Mark growth • Shift your Balance toward Connection
On a miss, something’s off—you don’t feel you’ve changed. Choose someone here to ask what more you can do—they will tell you, and the GM will shift your balance twice based on what they say.
Disconnected
Your Balance begins play at +2 Control; you can still shift it by one step when you make your character.
Your Connection principle starts play locked—you cannot shift your balance higher than +0 Connection. If you would shift your balance to a locked value, you lose your balance, but your center cannot shift higher than the highest unlocked Connection value. When you unlock Connection +3, treat your balance track as normal.
When you shift your center to +1, +2, and +3 Connection for the first time, choose a companion to whom you have connected. They give you one move from their playbook (ignoring advancement limits).
Honed
When you sublimate your feelings to be effective, clear conditions equal to one plus your Control and cross off one unmarked condition—you can no longer mark that condition for any reason. When you shift your center toward Connection, you may restore all crossed off conditions.
You may live up to your Control principle by shifting balance toward Control instead of marking fatigue.`;

/** One-off creation of The Razor's class-trait text + name. Idempotent. */
export const cleanRazorClassTrait = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem_className', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM).eq('class.className', 'The Razor'),
      )
      .unique();
    if (!classDoc) return { updated: false };
    const classInfo = classDoc.class as Record<string, unknown>;
    const classTrait =
      classInfo.classTrait && typeof classInfo.classTrait === 'object'
        ? { ...(classInfo.classTrait as Record<string, unknown>) }
        : {};
    classTrait.name = 'Making Amends';
    classTrait.text = RAZOR_CLASS_TRAIT_TEXT;
    await ctx.db.patch(classDoc._id, { class: { ...classInfo, classTrait } });
    return { updated: true };
  },
});
