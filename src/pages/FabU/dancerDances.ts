import type { SpellRow } from '@/components/fab-u';
import type { Character } from '@/domain/fabU/characterTypes';

const DANCER_DANCE_SKILL = 'Dance';
const DANCER_CLASS = 'Dancer';
const DANCE_MP_COST = '10 MP';

const DANCER_DANCE_ROWS: Array<Omit<SpellRow, 'summary' | 'description'>> = [
  {
    name: 'Angel Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Until next turn',
    effect:
      'Choose one option: you gain Resistance to light damage; or all damage dealt by your attacks and spells becomes light.',
  },
  {
    name: 'Banshee Dance',
    cost: DANCE_MP_COST,
    target: '1 creature',
    duration: 'Instant',
    effect:
      'Choose another creature that is able to see you. If that creature is already slow, they immediately suffer shaken.',
  },
  {
    name: 'Bat Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Until next turn',
    effect:
      'Choose one option: you gain Resistance to dark damage; or all damage dealt by your attacks and spells becomes dark.',
  },
  {
    name: 'Golem Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Until next turn',
    effect:
      'Choose one option: you gain Resistance to bolt damage; or all damage dealt by your attacks and spells becomes bolt.',
  },
  {
    name: 'Griffin Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Until next turn',
    effect:
      'Choose one option: you gain Resistance to air damage; or all damage dealt by your attacks and spells becomes air.',
  },
  {
    name: 'Hydra Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Until next turn',
    effect:
      'After you suffer damage, choose one option: you recover 5 Hit Points, or you recover 5 Mind Points.',
  },
  {
    name: 'Kraken Dance',
    cost: DANCE_MP_COST,
    target: '1 creature',
    duration: 'Instant',
    effect:
      'Choose another creature that is able to see you. If that creature is already dazed, they immediately suffer slow.',
  },
  {
    name: 'Lion Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Instant',
    effect: 'You immediately recover from a single status effect of your choice.',
  },
  {
    name: 'Maenad Dance',
    cost: DANCE_MP_COST,
    target: '1 creature',
    duration: 'Instant',
    effect:
      'Choose another creature that is able to see you. That creature loses an amount of Mind Points equal to your current Dexterity die size.',
  },
  {
    name: 'Myrmidon Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Until next turn',
    effect:
      'Choose one option: you gain Resistance to earth damage; or all damage dealt by your attacks and spells becomes earth.',
  },
  {
    name: 'Nightmare Dance',
    cost: DANCE_MP_COST,
    target: '1 creature',
    duration: 'Instant',
    effect:
      'Choose another creature that is able to see you. If that creature is already shaken, they immediately suffer weak.',
  },
  {
    name: 'Ouroboros Dance',
    cost: DANCE_MP_COST,
    target: '1 ally',
    duration: 'Instant',
    effect:
      'Choose one ally you can see who has yet to take a turn during this round. That ally may take their turn immediately after yours during this round.',
  },
  {
    name: 'Peacock Dance',
    cost: DANCE_MP_COST,
    target: '1 creature',
    duration: 'Instant',
    effect:
      'Choose another creature that is able to see you. The next time that creature performs an attack or casts an offensive spell during this scene, that attack or spell must include you among its targets if possible.',
  },
  {
    name: 'Phoenix Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Until next turn',
    effect:
      'Choose one option: you gain Resistance to fire damage; or all damage dealt by your attacks and spells becomes fire.',
  },
  {
    name: 'Satyr Dance',
    cost: DANCE_MP_COST,
    target: '1 creature',
    duration: 'Instant',
    effect:
      'Choose another creature that is able to see you. If that creature is already weak, they immediately suffer dazed.',
  },
  {
    name: 'Unicorn Dance',
    cost: DANCE_MP_COST,
    target: '1 ally',
    duration: 'Instant',
    effect:
      'Choose an ally that is able to see you and has a Bond towards you: you and that ally both recover an amount of Hit Points equal to your current Dexterity die size. The restored amount increases by 5 Hit Points if you are level 20 or higher, or by 10 Hit Points if you are level 40 or higher.',
  },
  {
    name: 'Yeti Dance',
    cost: DANCE_MP_COST,
    target: 'Self',
    duration: 'Until next turn',
    effect:
      'Choose one option: you gain Resistance to ice damage; or all damage dealt by your attacks and spells becomes ice.',
  },
];

const DANCER_DANCES: SpellRow[] = DANCER_DANCE_ROWS.map((dance) => ({
  ...dance,
  summary: dance.effect,
  description: dance.effect,
}));

function getDancerDanceSkillLevel(character: Character): number {
  if (!character.classes.some((cls) => cls.name === DANCER_CLASS)) return 0;

  const danceSkill = character.skillGroups
    .find((group) => group.className === DANCER_CLASS)
    ?.skills.find((skill) => skill.name.trim().toLowerCase() === DANCER_DANCE_SKILL.toLowerCase());
  const level = Number.parseInt(danceSkill?.level ?? '0', 10);
  return Number.isFinite(level) ? Math.max(0, level) : 0;
}

function hasDancerDanceSkill(character: Character): boolean {
  return getDancerDanceSkillLevel(character) > 0;
}

function isDancerDance(spellName: string): boolean {
  const normalized = spellName.trim().toLowerCase();
  return DANCER_DANCES.some((dance) => dance.name.trim().toLowerCase() === normalized);
}

function getSelectedDancerDances(character: Character): SpellRow[] {
  const selectedDances =
    character.spellGroups
      .find((group) => group.className === DANCER_CLASS)
      ?.spells.filter((spell) => isDancerDance(spell.name)) ?? [];
  return selectedDances.slice(0, getDancerDanceSkillLevel(character));
}

export {
  DANCER_CLASS,
  DANCER_DANCES,
  DANCER_DANCE_SKILL,
  getDancerDanceSkillLevel,
  getSelectedDancerDances,
  hasDancerDanceSkill,
  isDancerDance,
};
