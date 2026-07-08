import type { SkillRow } from '@/components/fab-u';

type FabUMasteredSkillOption = SkillRow & {
  classRequirements: 'any' | readonly string[];
  minimumRequiredMasteredClasses?: number;
};

const GENERIC_MASTERED_SKILLS: FabUMasteredSkillOption[] = [
  {
    name: 'Extra HP',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect: 'Permanently increase your maximum Hit Points.',
    description:
      'Choose this Heroic Skill to make the character noticeably harder to defeat. Record the maximum Hit Point increase in your HP modifiers and keep it as a permanent benefit.',
  },
  {
    name: 'Extra MP',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect: 'Permanently increase your maximum Mind Points.',
    description:
      "Choose this Heroic Skill to expand the character's pool for spells, techniques, and other Mind Point costs. Record the maximum Mind Point increase in your MP modifiers and keep it as a permanent benefit.",
  },
  {
    name: 'Extra IP',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect: 'Permanently increase your maximum Inventory Points.',
    description:
      'Choose this Heroic Skill to carry more usable supplies into scenes and conflicts. Record the maximum Inventory Point increase in your IP modifiers and keep it as a permanent benefit.',
  },
  {
    name: 'Extra Spell',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect: 'Expand your magical options with one additional spell choice.',
    description:
      'Choose this Heroic Skill when a mastered character should broaden their spell access instead of gaining a resource increase. Add the extra spell to an appropriate class spell list and follow the normal spell restrictions for your table.',
  },
];

function heroicSkill({
  name,
  classRequirements,
  summary,
  description,
  minimumRequiredMasteredClasses,
}: {
  name: string;
  classRequirements: 'any' | readonly string[];
  summary: string;
  description: string;
  minimumRequiredMasteredClasses?: number;
}): FabUMasteredSkillOption {
  return {
    name,
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements,
    minimumRequiredMasteredClasses,
    effect: summary,
    summary,
    description,
  };
}

const CORE_HEROIC_SKILLS: FabUMasteredSkillOption[] = [
  heroicSkill({
    name: 'Arcane Echoes',
    classRequirements: ['Arcanist'],
    summary: 'Use your Arcana to influence Clocks with supernatural momentum.',
    description:
      'Requirements: you must have mastered the Arcanist Class. Your Arcana resonate through a scene instead of fading after a single flourish. When an Arcanum you have summoned or dismissed would logically help with a Clock, you may draw on that Arcanum as part of the action and let its nature influence the Clock in a meaningful way.',
  }),
  heroicSkill({
    name: 'Revelation',
    classRequirements: ['Arcanist'],
    summary: 'Design a unique Arcanum and trigger its dismiss effect without dismissing it.',
    description:
      'Requirements: you must have mastered the Arcanist Class. Work with your group to design an unknown Arcanum tied to your story. Once per scene, while merged with that Arcanum, you may spend an action and 2 Fabula Points to trigger its dismiss effect without actually dismissing it; this does not benefit from Arcane Circle.',
  }),
  heroicSkill({
    name: 'Chimeric Mastery',
    classRequirements: ['Chimerist'],
    summary: 'Learn spells from additional Species and increase your spell limit.',
    description:
      'Requirements: you must have mastered the Chimerist Class. Your magic adapts to a wider range of creatures. You may learn Chimerist spells from new Species beyond your usual limits, and your maximum number of Chimerist spells increases, making Spell Mimic characters feel more like true living archives of monster magic.',
  }),
  heroicSkill({
    name: 'Comet',
    classRequirements: ['Entropist'],
    summary: 'Learn Comet, the ultimate Entropist spell for untyped enemy-wide damage.',
    description:
      'Requirements: you must have mastered the Entropist Class. You learn the ultimate Entropist spell: Comet. Comet costs 50 MP, has Target: Special, and Duration: Instantaneous. Choose one option: deal 60 damage to one enemy you can see; or deal 40 damage to every enemy you can see. This damage increases by 5 if you are level 20 or higher, or by 10 if you are level 40 or higher. Damage dealt by this spell has no type and ignores damage Affinities.',
  }),
  heroicSkill({
    name: 'Deep Pockets',
    classRequirements: ['Tinkerer'],
    summary: 'Reduce Inventory Point costs for your improvised tools and supplies.',
    description:
      'Requirements: you must have mastered the Tinkerer Class. Your preparation is almost impossible to exhaust. When you spend Inventory Points on Tinkerer options or comparable crafted resources, reduce the pressure of that cost as appropriate for the Skill at your table, letting you keep gadgets, mixtures, and emergency tools flowing longer.',
  }),
  heroicSkill({
    name: 'Disarming Rhetoric',
    classRequirements: ['Orator'],
    summary: 'Use words to persuade enemies to back down or retreat.',
    description:
      'Requirements: you must have mastered the Orator Class. Your words can make violence feel foolish, costly, or unnecessary. When the fiction supports it, you may use your social authority to convince enemies to withdraw, surrender, or abandon a hostile plan instead of simply applying a combat penalty.',
  }),
  heroicSkill({
    name: 'Heartbreaker',
    classRequirements: ['Darkblade'],
    summary: 'Sacrifice HP to empower a devastating attack.',
    description:
      'Requirements: you must have mastered the Darkblade Class. Your pain becomes a blade. When you strike with the force of your anguish, you may sacrifice your own Hit Points to dramatically increase the damage of the attack, turning personal suffering into a finishing blow.',
  }),
  heroicSkill({
    name: 'Hope',
    classRequirements: ['Spiritist'],
    summary: 'Learn Hope, the ultimate Spiritist spell.',
    description:
      'Requirements: you must have mastered the Spiritist Class. You learn the ultimate Spiritist spell: Hope. Use it as a major restorative miracle for scenes where faith, resolve, and protection should turn the tide for the group.',
  }),
  heroicSkill({
    name: 'Heroic Companion',
    classRequirements: ['Wayfarer', 'Tamer'],
    summary: 'Let your companion grow into a stronger heroic presence.',
    description:
      'Requirements: you must have mastered the Wayfarer Class, or have a companion-focused mastered Class. Your companion becomes more than a helper. Improve the companion as a heroic ally, increasing its reliability and scene impact so it can stand beside the party during major conflicts and journeys.',
  }),
  heroicSkill({
    name: 'Mathemagic',
    classRequirements: ['Loremaster'],
    summary: 'Extend spells that normally affect only a single target.',
    description:
      'Requirements: you must have mastered the Loremaster Class. Your calculations reshape magic with terrifying elegance. When a spell normally affects a single target and your formulas can justify the extension, you may broaden that spell according to the Skill rules, turning precise theory into practical battlefield control.',
  }),
  heroicSkill({
    name: 'Monkey Grip',
    classRequirements: ['Fury'],
    summary: 'Wield certain two-handed weapons in one hand.',
    description:
      'Requirements: you must have mastered the Fury Class. Choose one weapon Category among flail, heavy, spear, or sword. You may equip two-handed weapons of the chosen Category in a single hand, allowing shield, dual-wielding, or other one-hand synergies while still carrying oversized force.',
  }),
  heroicSkill({
    name: 'Perfect Aim',
    classRequirements: ['Sharpshooter'],
    summary: 'Choose two Warning Shot options instead of one.',
    description:
      'Requirements: you must have mastered the Sharpshooter Class and have the Warning Shot Skill. When your ranged attack hits and deals no damage because of Warning Shot, you may choose two Warning Shot options instead of one.',
  }),
  heroicSkill({
    name: 'Pillage',
    classRequirements: ['Rogue'],
    summary: 'Use Soul Steal against multiple creatures at once.',
    description:
      'Requirements: you must have mastered the Rogue Class and have the Soul Steal Skill. When you use Soul Steal, you may target any number of creatures you can affect, making one Check against each target’s Magic Defense.',
  }),
  heroicSkill({
    name: 'Powerful Shot',
    classRequirements: ['Sharpshooter'],
    summary: 'Add extra damage to ranged attacks.',
    description:
      'Requirements: you must have mastered the Sharpshooter Class. Your ranged attacks deal 5 extra damage. If you are level 40 or higher, they deal 10 extra damage instead.',
  }),
  heroicSkill({
    name: 'Powerful Spell',
    classRequirements: ['Chimerist', 'Elementalist', 'Entropist', 'Spiritist'],
    summary: 'Add extra damage to offensive spells.',
    description:
      'Requirements: you must have mastered Chimerist, Elementalist, Entropist, or Spiritist. When one of your spells deals damage to one or more targets, that spell deals 5 extra damage to each target. If you are level 40 or higher, it deals 10 extra damage to each target instead.',
  }),
  heroicSkill({
    name: 'Powerful Strike',
    classRequirements: ['Fury', 'Weaponmaster'],
    summary: 'Add extra damage to melee attacks.',
    description:
      'Requirements: you must have mastered Fury or Weaponmaster. Your melee attacks deal 5 extra damage to each target. If you are level 40 or higher, they deal 10 extra damage to each target instead.',
  }),
  heroicSkill({
    name: 'Predictable!',
    classRequirements: ['Loremaster'],
    summary: 'Read a foe and tax a chosen action type with MP.',
    description:
      'Requirements: you must have mastered the Loremaster Class. As an action, spend 20 MP and choose a creature you can analyze. If you know at least two of that creature’s Traits, choose a type of action. Until the start of your next turn, that creature must spend 20 MP to perform that action or choose a different action.',
  }),
  heroicSkill({
    name: 'Rampart',
    classRequirements: ['Guardian'],
    summary: 'Begin conflicts with broad resistance and status protection.',
    description:
      'Requirements: you must have mastered the Guardian Class. During the first round of a conflict, you have Resistance to all damage and cannot suffer new status effects. This does not clear statuses you were already suffering.',
  }),
  heroicSkill({
    name: 'Repetition',
    classRequirements: ['Orator'],
    summary: 'Repeat Condemn or Encourage once per turn by paying MP.',
    description:
      'Requirements: you must have mastered the Orator Class. Once per turn, immediately after you use Condemn or Encourage, you may pay the required MP to use that same Skill again.',
  }),
  heroicSkill({
    name: 'Status Immunity',
    classRequirements: ['Wayfarer'],
    summary: 'Become immune to one chosen status effect.',
    description:
      'Requirements: you must have mastered the Wayfarer Class. Choose one status effect. You are immune to that status, representing the hardiness and lived experience of a legendary traveler.',
  }),
  heroicSkill({
    name: 'Tempest Strike',
    classRequirements: ['Weaponmaster'],
    summary: 'Concentrate multi-attacks on one creature for bonus damage.',
    description:
      'Requirements: you must have mastered the Weaponmaster Class. When you perform a melee multi-attack and choose only one creature as the target, deal 5 extra damage if the attack has multi (2), or 10 extra damage if it has multi (3 or higher).',
  }),
  heroicSkill({
    name: 'Unbreakable',
    classRequirements: ['Guardian'],
    summary: 'Once per scene, remain standing at 1 HP instead of dropping to 0.',
    description:
      'Requirements: you must have mastered the Guardian Class. Once per scene, when you would be reduced to 0 Hit Points, you are reduced to exactly 1 Hit Point instead.',
  }),
  heroicSkill({
    name: 'Upgrade',
    classRequirements: ['Tinkerer'],
    summary: 'Add or replace a Quality on equipment during a rest.',
    description:
      'Requirements: you must have mastered the Tinkerer Class. Once per rest, choose a weapon, armor, or shield and add or replace one Quality following the normal Quality limits and cost modifier. Spend twice the Quality’s cost modifier; the item is ready at the end of the rest.',
  }),
  heroicSkill({
    name: 'Vanish',
    classRequirements: ['Rogue'],
    summary: 'After hitting enemies, spend FP to disappear from their sight.',
    description:
      'Requirements: you must have mastered the Rogue Class. After you hit one or more creatures with an attack, you may spend 1 Fabula Point. Those creatures cannot perform actions that require seeing you until the start of your next turn.',
  }),
  heroicSkill({
    name: 'Volcano',
    classRequirements: ['Elementalist'],
    summary: 'Learn Volcano, the ultimate Elementalist spell.',
    description:
      'Requirements: you must have mastered the Elementalist Class. You learn the ultimate Elementalist spell: Volcano. Volcano costs 40 MP, has Target: Special, and Duration: Instantaneous. Choose one visible creature to take 50 fire damage, or any number of visible creatures to each take 30 fire damage. This damage ignores Resistance and Immunity.',
  }),
];

const EXPANDED_HEROIC_SKILLS: FabUMasteredSkillOption[] = [
  heroicSkill({
    name: 'Black & White',
    classRequirements: ['Ace of Cards', 'Darkblade', 'Entropist', 'Spiritist'],
    summary: 'Turn card magic toward light and dark damage and pierce affinities with jokers.',
    description:
      'Requirements: you must have mastered Ace of Cards, Darkblade, Entropist, or Spiritist. Your card magic dances between radiance and shadow. Double Trouble may deal light or dark damage when appropriate, and when a joker is in your discard pile, Blinding Flush, Double Trouble, and Magic Flush can ignore Resistance and Immunity.',
  }),
  heroicSkill({
    name: 'Cheer Up!',
    classRequirements: ['Chanter', 'Esper', 'Orator'],
    summary: 'Use performance or empathy to rally allies when morale drops.',
    description:
      'Requirements: you must have mastered Chanter, Esper, or Orator. Your voice or mental presence pulls allies back from the brink. Use this Heroic Skill when encouragement should restore momentum, ease pressure, or help a companion keep acting with confidence.',
  }),
  heroicSkill({
    name: 'Ephemeral Tranquility',
    classRequirements: ['Dancer', 'Esper', 'Illusionist', 'Rogue', 'Spiritist', 'Symbolist'],
    summary: 'Blend misdirection and calm to manipulate Hallucination and Torpor effects.',
    description:
      'Requirements: you must have mastered a Class tied to perception, spirits, or subtle movement. Your presence softens the boundary between what is real and what is felt. Use this Heroic Skill to impose, combine, or exploit Hallucination and Torpor style effects according to the scene and your table’s rules.',
  }),
  heroicSkill({
    name: 'Fitcast',
    classRequirements: ['Chimerist', 'Darkblade', 'Esper', 'Fury', 'Mutant', 'Wayfarer'],
    summary: 'Use Might for certain spells, rituals, and arcane weapon interactions.',
    description:
      'Requirements: you must have mastered Chimerist, Darkblade, Esper, Fury, Mutant, or Wayfarer. Your body is a conduit for magic. When a spell or Ritual would fit this physical channeling, you may use Might for its Magic Check, and weapons that rely on Might may count as arcane for relevant Skills and effects.',
  }),
  heroicSkill({
    name: 'Greater Chloromancy',
    classRequirements: ['Floralist'],
    summary: 'Trigger garden magiseed effects with an action and MP.',
    description:
      'Requirements: you must have mastered the Floralist Class. Once per turn, if your garden contains a magiseed with an end-of-turn effect, you may spend an action and 20 MP to produce one of those effects immediately. If you have Verdant Sway, your Rituals may also influence or control soldier-rank plant creatures when the fiction supports it.',
  }),
  heroicSkill({
    name: 'Green Thumb',
    classRequirements: ['Floralist'],
    summary: 'Adjust Growth Clocks and make magiseed damage pierce Resistance.',
    description:
      'Requirements: you must have mastered the Floralist Class. When filling a Growth Clock, you may fill one additional section or one fewer section; you cannot use this again until that Growth Clock is empty. Damage dealt by your magiseeds ignores Resistance.',
  }),
  heroicSkill({
    name: 'Inner Wellspring',
    classRequirements: ['Invoker'],
    summary: 'Choose a favored elemental wellspring after each rest.',
    description:
      'Requirements: you must have mastered the Invoker Class. When you acquire this Skill and after each rest, choose one wellspring. Until your next rest, that wellspring is always available to you, you may perform Elementalism Rituals tied to it, you gain Resistance to its damage type, and you may change damage you deal to that type while ignoring Resistance.',
  }),
  heroicSkill({
    name: 'For a Better Future',
    classRequirements: ['Merchant'],
    summary: 'Spend Trade Points like Fabula Points and improve settlements.',
    description:
      'Requirements: you must have mastered the Merchant Class and have Real Treasure or Winds of Trade. You may spend Trade Points instead of Fabula Points except to alter the story. When you would gain 2 or more Trade Points, you may gain 1 fewer and increase the prosperity of a nearby settlement, creating ongoing benefits through trade and community support.',
  }),
  heroicSkill({
    name: 'Power Nap',
    classRequirements: ['Guardian', 'Merchant', 'Wayfarer'],
    summary: 'Recover HP, MP, and statuses mid-conflict at a temporary defensive cost.',
    description:
      'Requirements: you must have mastered Guardian, Merchant, or Wayfarer. As an action in conflict, recover Hit Points and Mind Points equal to 20 plus half your level, and clear all status effects. Your turn ends, and until the start of your next turn or until you lose HP or are hit, you lose sight and hearing and your Defense and Magic Defense become 5 and cannot be modified.',
  }),
  heroicSkill({
    name: 'Side by Side',
    classRequirements: ['Tamer', 'Wayfarer'],
    summary: 'Make your companion stronger and easier to invoke in key moments.',
    description:
      'Requirements: you must have mastered Wayfarer or another companion-focused Class and have Faithful Companion. Your companion deals 5 extra damage. You may spend 1 Fabula Point to invoke one of your companion’s Traits for a reroll. After using Faithful Companion, choose whether you and your companion each recover 10 MP or gain a bonus to the next relevant Check equal to your Faithful Companion Skill Level.',
  }),
  heroicSkill({
    name: 'Silent Hunter',
    classRequirements: ['Hunter', 'Rogue', 'Sharpshooter', 'Weaponmaster'],
    summary: 'Add extra damage to High Speed attacks with bows, spears, or thrown weapons.',
    description:
      'Requirements: you must have mastered a stealthy or precision weapon Class and have High Speed. When High Speed grants a free attack with a bow, spear, or thrown weapon, that attack deals extra damage equal to your High Speed Skill Level multiplied by 5.',
  }),
  heroicSkill({
    name: 'Skillful Dosage',
    classRequirements: ['Gourmet', 'Loremaster', 'Merchant', 'Tinkerer'],
    summary: 'Let potions, delicacies, and similar effects exceed normal HP or MP maximums.',
    description:
      'Requirements: you must have mastered Gourmet, Loremaster, Merchant, or Tinkerer. Your mixtures and measurements are exact enough to safely exceed normal limits. Potions, delicacies, spells, or comparable restorative effects may raise HP or MP beyond the normal maximum, up to 150 percent of that maximum.',
  }),
  heroicSkill({
    name: 'Signature Delicacy',
    classRequirements: ['Gourmet'],
    summary: 'Create a three-ingredient delicacy with chosen special effects.',
    description:
      'Requirements: you must have mastered the Gourmet Class. Choose a set of tastes and corresponding effects when you acquire this Heroic Skill. When a delicacy uses exactly three ingredients and matches the chosen tastes, you may ignore its normal effects and apply your special signature effects instead.',
  }),
  heroicSkill({
    name: 'Anatomist',
    classRequirements: ['Fury', 'Hunter', 'Loremaster', 'Sharpshooter', 'Slayer', 'Weaponmaster'],
    summary: 'Choose prey species and exploit anatomy for damage or reeling.',
    description:
      'Requirements: you must have mastered Fury, Loremaster, Sharpshooter, Weaponmaster, or a monster-hunting Class, and have Knowledge is Power. Choose two Species. When you damage a humanoid or one of the chosen Species, you may either deal 5 extra damage or inflict reeling; a reeling creature halves HP and MP recovery, then the condition ends. This Heroic Skill may be acquired multiple times to choose additional Species.',
  }),
  heroicSkill({
    name: 'Arcane Sacrifice',
    classRequirements: ['Arcanist', 'Guardian'],
    summary: 'Let a merged Arcanum prevent a fall to 0 HP once per scene.',
    description:
      'Requirements: you must have mastered Arcanist or Guardian. Once per scene, when you or an ally would be reduced to 0 HP while you are merged with an Arcanum, that character is reduced to 1 HP instead. The Arcanum is dismissed without triggering its dismiss effect, and you cannot summon it again until the end of the scene.',
  }),
  heroicSkill({
    name: 'Phagomagus',
    classRequirements: ['Chimerist', 'Entropist', 'Gourmet', 'Mutant', 'Necromancer'],
    summary: 'Devour hostile magic and turn it into power.',
    description:
      'Requirements: you must have mastered Chimerist, Entropist, Gourmet, Mutant, or a death-and-transformation themed Class. Your body or spirit can consume magical residue from foes. Use this Heroic Skill to devour magic present on enemies and convert it into a useful benefit according to the scene and your table’s rules.',
  }),
  heroicSkill({
    name: 'Symbiotic Roots',
    classRequirements: ['Chimerist', 'Floralist', 'Mutant', 'Tamer', 'Wayfarer'],
    summary: 'Share strength with plant-like companions and symbiotic allies.',
    description:
      'Requirements: you must have mastered Chimerist, Floralist, Mutant, Wayfarer, or a companion Class. You and a plant-Species faithful companion or symbiotic ally share strength through living roots, letting one of you support or reinforce the other when the fiction supports that bond.',
  }),
  heroicSkill({
    name: 'Witchvoice',
    classRequirements: ['Chanter', 'Hexer', 'Orator'],
    summary: 'Use curses, verses, or condemnations to draw enemy attacks.',
    description:
      'Requirements: you must have mastered Chanter, Hexer, or Orator. Your voice becomes a hook in the enemy’s mind. When you use Condemn or an appropriate verse or curse, you may draw hostile attention and redirect attacks toward yourself when the fiction supports it.',
  }),
  heroicSkill({
    name: 'Advanced Armament',
    classRequirements: ['Pilot'],
    summary: 'Create a magitech armament with special qualities and elemental options.',
    description:
      'Requirements: you must have mastered the Pilot Class. You can create a magitech armament. If both of your hand slots are empty, you may immediately equip it and make a free attack with it. Your armaments gain a special Quality and may deal elemental damage when appropriate.',
  }),
  heroicSkill({
    name: 'Palm and Step Style',
    classRequirements: ['Monk'],
    summary: 'Blend evasive movement and unarmed technique into a heroic style.',
    description:
      'Requirements: you must have mastered a martial discipline such as Monk and have evasive or indomitable training. Your stance turns motion into defense and open hands into precise force. Use this Heroic Skill to reinforce unarmed attacks, agile footwork, and defensive reactions built around refusing to be pinned down.',
  }),
];

const CLASS_MASTERED_SKILLS: FabUMasteredSkillOption[] = [
  {
    name: 'Arcane Mark',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Sharpshooter', 'Symbolist', 'Weaponmaster'],
    effect: 'Improve your spell criticals when channeling magic through arcane weapons.',
    description:
      'When your build combines martial precision with spellcasting, this Heroic Skill lets arcane weapons sharpen your magic. Use it for characters whose weapon form and spell work are meant to reinforce each other, especially when fishing for critical success on offensive spells.',
  },
  {
    name: 'Bimagus',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Elementalist', 'Entropist', 'Spiritist'],
    minimumRequiredMasteredClasses: 2,
    effect: 'Cast one spell right after another while saving MP.',
    description:
      'Requires mastery of two spellcasting traditions among Elementalist, Entropist, and Spiritist. This Heroic Skill represents advanced dual-discipline spell flow: after resolving one spell, you may immediately follow with another spell and reduce the pressure on your Mind Point economy.',
  },
  {
    name: 'Blade Adept',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Rogue', 'Weaponmaster'],
    effect: 'Gain dagger-focused bonuses and broaden how daggers count for weapon synergies.',
    description:
      'Treat daggers as an especially flexible signature weapon. This Heroic Skill supports builds that want daggers to interact with brawling, sword, and thrown weapon tactics, giving light-blade characters more ways to trigger weapon-based options.',
  },
  {
    name: 'Fast Rituals',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Chimerist', 'Elementalist', 'Entropist', 'Spiritist'],
    effect: 'Reduce the effort needed to complete Ritual Clocks during conflicts.',
    description:
      'Your ritual practice becomes fast enough to matter under pressure. When performing rituals in conflict, reduce the number of clock sections the group must fill, letting magical problem-solving compete with direct combat actions.',
  },
  {
    name: 'Fleeting Moment',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Weaponmaster'],
    effect: 'Improve sword Counterattacks by adding your High Roll.',
    description:
      'For a sword specialist, the opening after a foe attacks is all the time you need. This Heroic Skill strengthens Counterattack-style play by letting your High Roll matter when you answer an enemy with a blade.',
  },
  {
    name: 'Grand Summoning',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Arcanist'],
    effect: 'Summon Arcana as creatures instead of only invoking their normal effects.',
    description:
      'Your bond with Arcana becomes strong enough to call them into the scene as active presences. Use this Heroic Skill when an Arcanist should make their summons feel like companions, guardians, or dramatic battlefield manifestations.',
  },
  {
    name: 'Hoplite',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Commander', 'Guardian'],
    effect: 'Strengthen attacks made while fighting with weapon and shield.',
    description:
      'A disciplined defender turns shield work into forward pressure. This Heroic Skill rewards characters who pair formation tactics with protection, improving offense when they fight with both a weapon and shield.',
  },
  {
    name: 'Iron Forest',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Commander', 'Weaponmaster'],
    effect: 'After spear attacks, pressure enemies into spending MP to act freely.',
    description:
      'Your spearwork controls space like a wall of points. When you hit with spear tactics, enemies must respect your threat, often paying Mind Points if they want to keep acting without being pinned by your reach and timing.',
  },
  {
    name: 'Paso Doble',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Dancer'],
    effect: 'Ignore the MP cost of Follow My Lead while you are in Crisis.',
    description:
      'When danger peaks, your dance becomes instinct. This Heroic Skill lets a Dancer keep guiding the rhythm of the group in Crisis without paying the usual Mind Point cost for Follow My Lead.',
  },
  {
    name: 'Power Chord',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Chanter'],
    effect: "Improve allies' critical success chance with songs.",
    description:
      "Your performance pushes the whole party toward decisive moments. While your songs are carrying the scene, allies gain a better chance to land critical successes and turn momentum in the group's favor.",
  },
  {
    name: 'Pulverizing Strike',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Darkblade', 'Fury', 'Weaponmaster'],
    effect: 'Make Breach deal damage when used with heavy weapons.',
    description:
      'This Heroic Skill turns armor-breaking force into raw harm. When you use Breach with a heavy weapon, the impact does more than open defenses: it also batters the target directly.',
  },
  {
    name: 'Rising Tide',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Fury', 'Weaponmaster'],
    effect: 'Gain benefits for consecutive attacks with brawling weapons.',
    description:
      'Your hand-to-hand rhythm builds with every blow. This Heroic Skill rewards staying in close and chaining brawling weapon attacks, turning repeated pressure into escalating advantage.',
  },
  {
    name: 'Ritual Seals',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Symbolist'],
    effect: 'Store Rituals inside seals for later use.',
    description:
      'A mastered Symbolist can compress ritual work into prepared seals. This Heroic Skill lets you bind a ritual into a symbol so its power can be carried, placed, and released when the timing is right.',
  },
  {
    name: 'Showstopper',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Dancer'],
    effect: 'Perform three dances in a dramatic sequence, then pause before doing it again.',
    description:
      'Your performance erupts into a spectacular burst of choreography. This Heroic Skill lets a Dancer string together three dances for a major swing in tempo, followed by a short break before repeating the spectacle.',
  },
  {
    name: "Spider's Web",
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Fury', 'Weaponmaster'],
    effect: 'Attack twice with flails.',
    description:
      'Flails become a blur of binding arcs and brutal follow-through. This Heroic Skill supports characters who fight with flexible weapons by letting them strike twice and keep enemies tangled in their reach.',
  },
  {
    name: 'Swirling Swarm',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Dancer', 'Fury', 'Sharpshooter'],
    effect: 'Gain benefits for consecutive attacks with thrown weapons.',
    description:
      'Your thrown weapons move like a storm around the battlefield. This Heroic Skill rewards repeated thrown-weapon attacks, building momentum as your strikes keep coming from unexpected angles.',
  },
  {
    name: 'Tabula Rasa',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Commander'],
    effect: 'Turn your tactical Skills into direct HP loss.',
    description:
      'Your commands erase the enemy plan and make hesitation costly. This Heroic Skill lets certain Commander Skills inflict Hit Point loss, giving tactical control a sharper offensive edge.',
  },
  {
    name: 'Theme Song',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Chanter'],
    effect: 'Gain a signature theme song with flexible scene benefits.',
    description:
      'Your legend has a refrain. This Heroic Skill gives the character a theme song that can shape important scenes with benefits chosen to match the moment, making the Chanter feel unmistakably iconic.',
  },
  {
    name: 'Triple Slash',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: ['Dancer', 'Weaponmaster'],
    effect: 'Equip three daggers or swords and perform triple attacks.',
    description:
      'A flourish of blades becomes a real combat style. This Heroic Skill supports characters who fight with multiple daggers or swords, letting them commit to a three-weapon assault pattern.',
  },
];

const MASTERED_SKILL_OPTIONS = [
  ...GENERIC_MASTERED_SKILLS,
  ...CORE_HEROIC_SKILLS,
  ...EXPANDED_HEROIC_SKILLS,
  ...CLASS_MASTERED_SKILLS,
];

function toSkillRow(option: FabUMasteredSkillOption): SkillRow {
  return {
    name: option.name,
    level: option.level,
    maxLevel: option.maxLevel,
    mastered: option.mastered,
    effect: option.effect,
    summary: option.summary ?? option.effect,
    description: option.description,
  };
}

function isMasteredSkillAvailableForClass(
  option: FabUMasteredSkillOption,
  className: string,
  masteredClassNames: readonly string[],
) {
  if (option.classRequirements === 'any') return true;
  if (!option.classRequirements.includes(className)) return false;

  const matchingMasteredClassCount = option.classRequirements.filter((requiredClass) =>
    masteredClassNames.includes(requiredClass),
  ).length;
  return matchingMasteredClassCount >= (option.minimumRequiredMasteredClasses ?? 1);
}

function getFabUMasteredSkillOptionsForClass(
  className: string,
  masteredClassNames: readonly string[],
): SkillRow[] {
  return MASTERED_SKILL_OPTIONS.filter((option) =>
    isMasteredSkillAvailableForClass(option, className, masteredClassNames),
  ).map(toSkillRow);
}

export { getFabUMasteredSkillOptionsForClass };
