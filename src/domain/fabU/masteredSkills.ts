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

const MASTERED_SKILL_OPTIONS = [...GENERIC_MASTERED_SKILLS, ...CLASS_MASTERED_SKILLS];

function toSkillRow(option: FabUMasteredSkillOption): SkillRow {
  return {
    name: option.name,
    level: option.level,
    maxLevel: option.maxLevel,
    mastered: option.mastered,
    effect: option.effect,
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
