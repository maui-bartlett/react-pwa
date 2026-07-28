import type { SkillRow, SpellRow } from '@/components/fab-u';

import type { Character } from './characterTypes';

type FabUMasteredSkillOption = SkillRow & {
  classRequirements: 'any' | readonly string[];
  /** Class skills the character must already have (e.g. Warning Shot). */
  skillRequirements?: readonly string[];
  minimumRequiredMasteredClasses?: number;
  /** How many times this Heroic Skill may be acquired (default 1). */
  maxAcquisitions?: number;
  heroicSpell?: SpellRow;
};

const GENERIC_MASTERED_SKILLS: FabUMasteredSkillOption[] = [
  {
    name: 'Ambidextrous',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect:
      'Apply two-weapon fighting benefits to weapons from different categories, including melee and ranged.',
    summary:
      'Apply two-weapon fighting benefits to weapons from different categories, including melee and ranged.',
    description:
      'You may apply the benefits of two-weapon fighting to weapons belonging to different categories, even if one is a melee weapon and the other is a ranged weapon (such as a dagger and a firearm).',
  },
  {
    name: 'Extra HP',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect: 'Permanently increase your maximum Hit Points by 10 (20 at level 40+).',
    summary: 'Permanently increase your maximum Hit Points by 10 (20 at level 40+).',
    description:
      'Permanently increase your maximum Hit Points by 10. This amount increases to 20 if you are level 40 or higher.',
  },
  {
    name: 'Extra MP',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect: 'Permanently increase your maximum Mind Points by 10 (20 at level 40+).',
    summary: 'Permanently increase your maximum Mind Points by 10 (20 at level 40+).',
    description:
      'Permanently increase your maximum Mind Points by 10. This amount increases to 20 if you are level 40 or higher.',
  },
  {
    name: 'Extra IP',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect: 'Permanently increase your maximum Inventory Points by 4.',
    summary: 'Permanently increase your maximum Inventory Points by 4.',
    description: 'Permanently increase your maximum Inventory Points by 4.',
  },
  {
    name: 'Extra Spells',
    level: 'M',
    maxLevel: 1,
    mastered: true,
    classRequirements: 'any',
    effect: 'Learn any two spells from Elementalist, Entropist, or Spiritist (same list).',
    summary: 'Learn any two spells from Elementalist, Entropist, or Spiritist (same list).',
    description:
      'When you acquire this Skill, learn any two spells from one of the following lists: Elementalist, Entropist, or Spiritist. Both spells chosen this way must come from the same list, and they follow the standard rules for casting spells of that Class.',
  },
];

function heroicSkill({
  name,
  classRequirements,
  summary,
  description,
  skillRequirements,
  minimumRequiredMasteredClasses,
  maxAcquisitions,
  heroicSpell,
}: {
  name: string;
  classRequirements: 'any' | readonly string[];
  summary: string;
  description: string;
  skillRequirements?: readonly string[];
  minimumRequiredMasteredClasses?: number;
  maxAcquisitions?: number;
  heroicSpell?: SpellRow;
}): FabUMasteredSkillOption {
  return {
    name,
    level: 'M',
    maxLevel: maxAcquisitions ?? 1,
    mastered: true,
    classRequirements,
    skillRequirements,
    minimumRequiredMasteredClasses,
    maxAcquisitions,
    effect: summary,
    summary,
    description,
    heroicSpell,
  };
}

const CORE_HEROIC_SKILLS: FabUMasteredSkillOption[] = [
  heroicSkill({
    name: 'Adversity',
    classRequirements: ['Darkblade'],
    summary: 'Gain Check bonuses and extra damage for each status effect you suffer.',
    description:
      'Requirements: you must have mastered the Darkblade Class. As long as you are suffering from one or more status effects, you gain a +1 bonus on all Checks for every status effect you are suffering from, and you deal 2 extra damage for every status effect you are suffering from (be it with attacks, spells, Arcana, items or any other method).',
  }),
  heroicSkill({
    name: 'Arcane Echoes',
    classRequirements: ['Arcanist'],
    summary: 'Fill or erase an extra Clock section when an Arcanum domain applies.',
    description:
      'Requirements: you must have mastered the Arcanist Class. When you successfully perform a Check to fill or erase one or more sections of a Clock, if the domains of one or more Arcana you have bound are applicable to the Check in question, you may fill or erase an additional section of that Clock. The Game Master has final say on whether a given domain applies or not.',
  }),
  heroicSkill({
    name: 'Revelation',
    classRequirements: ['Arcanist'],
    summary: 'Bind a unique Arcanum and trigger its dismiss effect without dismissing it.',
    description:
      'Requirements: you must have mastered the Arcanist Class. You make contact with an unknown Arcanum and bind it to your soul. This Arcanum must be something you design together with the rest of the group; as long as you live, no one else in your world will be able to bind that Arcanum. Once per scene while you are merged with an Arcanum, you may use an action and spend 2 Fabula Points to trigger that Arcanum’s dismiss effect (if any) without dismissing them. Doing so does not trigger the Arcane Circle Skill.',
  }),
  heroicSkill({
    name: 'Chimeric Mastery',
    classRequirements: ['Chimerist'],
    maxAcquisitions: 2,
    summary: 'Learn Spell Mimic spells from more Species and raise your spell limit by 2.',
    description:
      'Requirements: you must have mastered the Chimerist Class. Choose two creature Species among construct, demon, elemental, and undead. You can now use Spell Mimic to learn spells from creatures of the chosen Species. This Heroic Skill may be acquired up to twice, each time selecting two Species from the list above. Whenever you acquire this Skill, you also increase your upper limit for memorized Chimerist spells by 2.',
  }),
  heroicSkill({
    name: 'Comet',
    classRequirements: ['Entropist'],
    summary: 'Learn Comet, the ultimate Entropist spell for untyped enemy-wide damage.',
    description:
      'Requirements: you must have mastered the Entropist Class. You learn the ultimate Entropist spell: Comet. Comet costs 50 MP, has Target: Special, and Duration: Instantaneous. Choose one option: one creature you can see suffers 60 damage; or you choose any number of creatures you can see, and each of them suffers 40 damage. These amounts increase by 5 if you are level 20 or higher, or by 10 if you are level 40 or higher. Damage dealt by this spell has no type (and thus is not affected by damage Affinities).',
    heroicSpell: {
      name: 'Comet',
      cost: '50 MP',
      target: 'Special',
      duration: 'Instant',
      effect:
        'Choose one visible creature for 60 untyped damage, or any number of visible creatures for 40 untyped damage.',
      summary:
        'Choose one visible creature for 60 untyped damage, or any number of visible creatures for 40 untyped damage.',
      description:
        'Comet costs 50 MP, has Target: Special, and Duration: Instantaneous. Choose one option: one creature you can see suffers 60 damage; or you choose any number of creatures you can see, and each of them suffers 40 damage. These amounts increase by 5 if you are level 20 or higher, or by 10 if you are level 40 or higher. Damage dealt by this spell has no type (and thus is not affected by damage Affinities).',
    },
  }),
  heroicSkill({
    name: 'Deep Pockets',
    classRequirements: ['Tinkerer'],
    summary: 'Spend 1 less Inventory Point whenever you spend IP (minimum 1).',
    description:
      'Requirements: you must have mastered the Tinkerer Class. When you spend Inventory Points, you spend 1 less Inventory Point (to a minimum of 1 Inventory Point).',
  }),
  heroicSkill({
    name: 'Disarming Rhetoric',
    classRequirements: ['Orator'],
    summary: 'Spend MP to make a shaken or Crisis soldier-rank foe leave conflict peacefully.',
    description:
      'Requirements: you must have mastered the Orator Class. During a conflict scene, you may use an action and choose a soldier-rank creature that can hear and understand you. If that creature is shaken or in Crisis, you may spend an amount of Mind Points equal to [20 + half that creature’s level] to have them peacefully leave the conflict. The Game Master will tell you which creatures are soldiers.',
  }),
  heroicSkill({
    name: 'Heartbreaker',
    classRequirements: ['Darkblade'],
    summary: 'Spend half your current HP to deal Bond-scaled extra damage once per turn.',
    description:
      'Requirements: you must have mastered the Darkblade Class. When you hit a creature with an attack, if that attack only targeted that creature and you have a Bond towards them, you may choose to spend half of your current Hit Points, rounded down. If you do, the attack deals extra damage equal to [10 multiplied by the strength of your Bond towards the target]. You may use this Skill only on your turn during a conflict, and only once per turn.',
  }),
  heroicSkill({
    name: 'Hope',
    classRequirements: ['Spiritist'],
    summary: 'Learn Hope, the ultimate Spiritist spell that revives a surrendered PC.',
    description:
      'Requirements: you must have mastered the Spiritist Class. You learn the ultimate Spiritist spell: Hope. Hope costs 40 MP, has Target: Special, and Duration: Instantaneous. Choose a Player Character who surrendered but is still present on the scene; that Player Character immediately regains consciousness and recovers an amount of Hit Points equal to their Crisis score. This spell does not undo the consequences of their surrender and cannot help characters who left the scene. A Player Character can only be affected by this spell once per scene.',
    heroicSpell: {
      name: 'Hope',
      cost: '40 MP',
      target: 'Special',
      duration: 'Instant',
      effect:
        'Revive a surrendered Player Character still on the scene, restoring HP equal to their Crisis score.',
      summary:
        'Revive a surrendered Player Character still on the scene, restoring HP equal to their Crisis score.',
      description:
        'Hope costs 40 MP, has Target: Special, and Duration: Instantaneous. Choose a Player Character who surrendered but is still present on the scene; that Player Character immediately regains consciousness and recovers an amount of Hit Points equal to their Crisis score. This spell does not undo the consequences of their surrender and cannot help characters who left the scene. A Player Character can only be affected by this spell once per scene.',
    },
  }),
  heroicSkill({
    name: 'Heroic Companion',
    classRequirements: ['Wayfarer', 'Tamer'],
    skillRequirements: ['Faithful Companion'],
    summary: 'Strengthen your companion’s HP, an Attribute die, and Skills.',
    description:
      'Requirements: you must have mastered the Wayfarer Class, and must have acquired the Faithful Companion Skill. Your companion’s maximum Hit Points increase by 10. Choose one of your companion’s Attributes among Dexterity, Insight, Might, and Willpower; the chosen Attribute is permanently increased by one die size (up to a maximum size of d12). Your companion gains an additional Skill; when you reach level 40, or if you have already reached it, your companion gains an additional Skill.',
  }),
  heroicSkill({
    name: 'Mathemagic',
    classRequirements: ['Loremaster'],
    summary: 'Double a single-target spell’s MP cost to hit matching Attribute die sizes.',
    description:
      'Requirements: you must have mastered the Loremaster Class. When you cast a spell with a target of “One creature”, you may double the spell’s total MP cost. If you do, choose an Attribute (Dexterity, Insight, Might, or Willpower) and a die size (d6, d8, d10, or d12). The spell will now target all creatures present on the scene whose current Attribute die size matches your choice, regardless of whether they are friends or foes (including you). The effects of the spell are fully applied to every target; if the spell is an offensive spell, you perform a single Magic Check and compare it against the Magic Defense of each target.',
  }),
  heroicSkill({
    name: 'Monkey Grip',
    classRequirements: ['Fury'],
    summary: 'Equip two-handed flail, heavy, spear, or sword weapons in one hand.',
    description:
      'Requirements: you must have mastered the Fury Class. You may equip two-handed weapons belonging to the flail, heavy, spear, or sword Categories in a single hand slot. This allows you to use two-weapon fighting with two two-handed weapons, or to equip a two-handed weapon in your main hand slot and a shield in your off-hand slot.',
  }),
  heroicSkill({
    name: 'Perfect Aim',
    classRequirements: ['Sharpshooter'],
    skillRequirements: ['Warning Shot'],
    summary: 'Choose two Warning Shot options instead of one.',
    description:
      'Requirements: you must have mastered the Sharpshooter Class and must have acquired the Warning Shot Skill. When you hit one or more creatures with a ranged attack and choose to deal no damage in order to gain the benefits of the Warning Shot Skill, you may choose two options instead of one.',
  }),
  heroicSkill({
    name: 'Pillage',
    classRequirements: ['Rogue'],
    skillRequirements: ['Soul Steal'],
    summary: 'Use Soul Steal against any number of creatures at once.',
    description:
      'Requirements: you must have mastered the Rogue Class and must have acquired the Soul Steal Skill. When you use the Soul Steal Skill, you may target any number of creatures at the same time. You perform a single Check and compare it against the Magic Defense of each creature you are targeting.',
  }),
  heroicSkill({
    name: 'Powerful Shot',
    classRequirements: ['Sharpshooter'],
    summary: 'Add extra damage to ranged attacks (5, or 10 at level 40+).',
    description:
      'Requirements: you must have mastered the Sharpshooter Class. When you hit one or more creatures with a ranged attack, that attack deals 5 extra damage to each creature. This amount increases to 10 if you are level 40 or higher.',
  }),
  heroicSkill({
    name: 'Powerful Spell',
    classRequirements: ['Chimerist', 'Elementalist', 'Entropist', 'Spiritist'],
    summary: 'Add extra damage to damaging spells (5, or 10 at level 40+).',
    description:
      'Requirements: you must have mastered one or more Classes among Chimerist, Elementalist, Entropist, or Spiritist. When you cast a spell that deals damage to one or more creatures, that spell deals 5 extra damage to each creature. This amount increases to 10 if you are level 40 or higher.',
  }),
  heroicSkill({
    name: 'Powerful Strike',
    classRequirements: ['Fury', 'Weaponmaster'],
    summary: 'Add extra damage to melee attacks (5, or 10 at level 40+).',
    description:
      'Requirements: you must have mastered one or more Classes among Fury or Weaponmaster. When you hit one or more creatures with a melee attack, that attack deals 5 extra damage to each creature. This amount increases to 10 if you are level 40 or higher.',
  }),
  heroicSkill({
    name: 'Predictable!',
    classRequirements: ['Loremaster'],
    summary: 'Spend 20 MP to tax a chosen action type when you know two Traits.',
    description:
      'Requirements: you must have mastered the Loremaster Class. During a conflict, you may use an action and spend 20 Mind Points to anticipate the upcoming moves of a creature you can see, as long as you know two or more of that creature’s Traits. If you do so, choose one type of action among Attack, Guard, Objective, Spell, or Skill. Until the start of your next turn, the creature must spend 20 Mind Points whenever they wish to perform that action; if they can’t, they must perform a different action.',
  }),
  heroicSkill({
    name: 'Rampart',
    classRequirements: ['Guardian'],
    summary: 'In round one of conflict, resist all damage and ignore new statuses.',
    description:
      'Requirements: you must have mastered the Guardian Class. During the first round of each conflict scene, you have Resistance to all damage types and cannot suffer status effects (you do not recover from preexisting status effects, however). These benefits last until the end of the first round.',
  }),
  heroicSkill({
    name: 'Repetition',
    classRequirements: ['Orator'],
    summary: 'Once per turn, immediately repeat Condemn or Encourage by paying MP.',
    description:
      'Requirements: you must have mastered the Orator Class. Once per turn during a conflict, after you use the Condemn Skill or the Encourage Skill, you may immediately perform that same Skill again (on the same target or a different one). You must still pay the Mind Point cost for the second use of the Skill.',
  }),
  heroicSkill({
    name: 'Status Immunity',
    classRequirements: ['Wayfarer'],
    summary: 'Become completely immune to one status effect of your choice.',
    description:
      'Requirements: you must have mastered the Wayfarer Class. You become completely immune to a single status effect of your choice.',
  }),
  heroicSkill({
    name: 'Tempest Strike',
    classRequirements: ['Weaponmaster'],
    summary: 'Concentrate a multi melee attack on one foe for bonus damage.',
    description:
      'Requirements: you must have mastered the Weaponmaster Class. When you perform a melee attack with the multi property, if you choose to target only one creature, the attack deals 5 extra damage if the attack had multi (2), or 10 extra damage if the attack had multi (3 or higher).',
  }),
  heroicSkill({
    name: 'Unbreakable',
    classRequirements: ['Guardian'],
    summary: 'Once per scene, remain at 1 HP instead of dropping to 0.',
    description:
      'Requirements: you must have mastered the Guardian Class. Once per scene when you are about to be reduced to 0 Hit Points, you may instead choose to withstand the pain and be reduced to exactly 1 Hit Point.',
  }),
  heroicSkill({
    name: 'Upgrade',
    classRequirements: ['Tinkerer'],
    summary: 'Once per rest, add or replace a Quality on a weapon, armor, or shield.',
    description:
      'Requirements: you must have mastered the Tinkerer Class. Once per rest, you may choose a weapon, armor, or shield that has no Quality or replace a current Quality with a different one from the default lists for that item type. The cost modifier of the chosen Quality cannot be higher than +1000 zenit, and you must spend an amount of zenit equal to twice the cost modifier of the chosen Quality. The item will be ready at the end of the rest, and you may only modify one item per rest.',
  }),
  heroicSkill({
    name: 'Vanish',
    classRequirements: ['Rogue'],
    summary: 'After hitting foes, spend 1 FP so they cannot see you until your next turn.',
    description:
      'Requirements: you must have mastered the Rogue Class. When you hit one or more creatures with an attack, you may spend 1 Fabula Point. If you do so, each creature hit by the attack becomes unable to perform any action that requires them to see you until the start of your next turn.',
  }),
  heroicSkill({
    name: 'Volcano',
    classRequirements: ['Elementalist'],
    summary: 'Learn Volcano, the ultimate Elementalist fire spell.',
    description:
      'Requirements: you must have mastered the Elementalist Class. You learn the ultimate Elementalist spell: Volcano. Volcano costs 40 MP, has Target: Special, and Duration: Instantaneous. Choose one option: one creature you can see suffers 50 fire damage; or you choose any number of creatures you can see, and each of them suffers 30 fire damage. These amounts increase by 5 if you are level 20 or higher, or by 10 if you are level 40 or higher. Damage dealt by this spell ignores Resistances and Immunities.',
    heroicSpell: {
      name: 'Volcano',
      cost: '40 MP',
      target: 'Special',
      duration: 'Instant',
      effect:
        'Choose one visible creature for 50 fire damage, or any number of visible creatures for 30 fire damage.',
      summary:
        'Choose one visible creature for 50 fire damage, or any number of visible creatures for 30 fire damage.',
      description:
        'Volcano costs 40 MP, has Target: Special, and Duration: Instantaneous. Choose one option: one creature you can see suffers 50 fire damage; or you choose any number of creatures you can see, and each of them suffers 30 fire damage. These amounts increase by 5 if you are level 20 or higher, or by 10 if you are level 40 or higher. Damage dealt by this spell ignores Resistances and Immunities.',
    },
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
    heroicScope: option.classRequirements === 'any' ? 'standard' : 'class',
    heroicSpell: option.heroicSpell,
  };
}

function hasRequiredSkills(
  option: FabUMasteredSkillOption,
  ownedSkillNames: readonly string[],
): boolean {
  if (!option.skillRequirements?.length) return true;
  const owned = new Set(ownedSkillNames.map((name) => name.trim().toLowerCase()));
  return option.skillRequirements.every((required) => owned.has(required.trim().toLowerCase()));
}

function isMasteredSkillAvailableForClass(
  option: FabUMasteredSkillOption,
  className: string,
  masteredClassNames: readonly string[],
  ownedSkillNames: readonly string[] = [],
) {
  if (!hasRequiredSkills(option, ownedSkillNames)) return false;
  // Heroic Skills are chosen when mastering a Class; only offer them on mastered classes.
  if (!masteredClassNames.includes(className)) return false;

  if (option.classRequirements === 'any') return true;

  const matchingMasteredClassCount = option.classRequirements.filter((requiredClass) =>
    masteredClassNames.includes(requiredClass),
  ).length;
  return matchingMasteredClassCount >= (option.minimumRequiredMasteredClasses ?? 1);
}

function getFabUMasteredSkillMaxAcquisitions(skillName: string): number {
  const option = MASTERED_SKILL_OPTIONS.find(
    (entry) => entry.name.trim().toLowerCase() === skillName.trim().toLowerCase(),
  );
  return option?.maxAcquisitions ?? option?.maxLevel ?? 1;
}

function getFabUMasteredSkillOptionsForClass(
  className: string,
  masteredClassNames: readonly string[],
  ownedSkillNames: readonly string[] = [],
): SkillRow[] {
  return MASTERED_SKILL_OPTIONS.filter((option) =>
    isMasteredSkillAvailableForClass(option, className, masteredClassNames, ownedSkillNames),
  ).map(toSkillRow);
}

function getFabUHeroicSpellForSkill(className: string, skillName: string): SpellRow | undefined {
  const normalizedSkillName = skillName.trim().toLowerCase();
  return MASTERED_SKILL_OPTIONS.find(
    (option) =>
      option.heroicSpell &&
      option.name.trim().toLowerCase() === normalizedSkillName &&
      option.classRequirements !== 'any' &&
      option.classRequirements.includes(className),
  )?.heroicSpell;
}

function repairFabUGrantedHeroicSpells(character: Character): Character {
  let spellGroups = character.spellGroups;

  character.skillGroups.forEach((skillGroup) => {
    skillGroup.skills.forEach((skill) => {
      const grantedSpell =
        skill.heroicSpell ?? getFabUHeroicSpellForSkill(skillGroup.className, skill.name);
      if (!grantedSpell) return;

      const existingGroup = spellGroups.find((group) => group.className === skillGroup.className);
      if (
        existingGroup?.spells.some(
          (spell) => spell.name.trim().toLowerCase() === grantedSpell.name.trim().toLowerCase(),
        )
      ) {
        return;
      }

      spellGroups = existingGroup
        ? spellGroups.map((group) =>
            group.className === skillGroup.className
              ? { ...group, spells: [...group.spells, grantedSpell] }
              : group,
          )
        : [...spellGroups, { className: skillGroup.className, spells: [grantedSpell] }];
    });
  });

  return spellGroups === character.spellGroups ? character : { ...character, spellGroups };
}

export {
  getFabUHeroicSpellForSkill,
  getFabUMasteredSkillMaxAcquisitions,
  getFabUMasteredSkillOptionsForClass,
  repairFabUGrantedHeroicSpells,
};
