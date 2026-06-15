import { v } from 'convex/values';

import type { MutationCtx } from './_generated/server';
import { internalMutation, query } from './_generated/server';
import { deriveTechniqueFatigue, withTechniqueFatigue } from './lib/avatarTechniqueFatigue';

const FABULA_ULTIMA_GAME_SYSTEM = 'fabula-ultima';
const AVATAR_LEGENDS_GAME_SYSTEM = 'avatar-legends';

/** Short collapsed-card blurb: the first sentence of the rules text, falling
 *  back to a clipped prefix. Mirrors the client's `summarizeTechnique` so the
 *  accordion's collapsed summary differs from the expanded full description. */
function summarizeTechnique(text: string) {
  const firstSentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return firstSentence && firstSentence.length <= 150
    ? firstSentence
    : `${text.slice(0, 118).trim()}${text.length > 118 ? '...' : ''}`;
}

function technique(
  type: string,
  approach: string,
  name: string,
  description: string,
  options: { rare?: boolean; tags?: string[]; summary?: string } = {},
) {
  const { summary, ...rest } = options;
  return {
    type,
    approach,
    name,
    summary: summary ?? summarizeTechnique(description),
    description,
    ...rest,
  };
}

const avatarLegendsBuiltInTechniquesWithoutFatigue = [
  {
    type: 'basic',
    approach: 'Defend & Maneuver',
    name: 'Ready',
    summary: 'Ready yourself or your environment by assigning or clearing a fitting status.',
    description:
      'Mark 1-fatigue to ready yourself or your environment, assigning or clearing a fictionally appropriate status of nearby characters or yourself.',
  },
  {
    type: 'basic',
    approach: 'Defend & Maneuver',
    name: 'Retaliate',
    summary: 'Steel yourself and punish foes who harm or unbalance you.',
    description:
      'Steel yourself for their blows. Each time a foe inflicts fatigue, a condition, or shifts your balance in this exchange, inflict 1-fatigue on that foe.',
  },
  {
    type: 'basic',
    approach: 'Defend & Maneuver',
    name: 'Seize a Position',
    summary: 'Move to a new location or escape while engaged foes may spend fatigue to block you.',
    description:
      'Move to a new location. Engage/disengage with a foe, overcome a negative status or danger, establish an advantageous position, or escape the scene. Any foe engaged with you can mark 1-fatigue to block this technique.',
  },
  {
    type: 'basic',
    approach: 'Advance & Attack',
    name: 'Strike',
    summary: 'Force a foe in reach to suffer fatigue, mark a condition, or shift balance.',
    description:
      'Strike a foe in reach, forcing them to mark 2-fatigue, mark a condition, or shift their balance away from center, their choice. Mark 1-fatigue to instead choose to hammer them with your blows, forcing them to mark 2-fatigue, or strike where they are weak, inflicting a condition.',
  },
  {
    type: 'basic',
    approach: 'Advance & Attack',
    name: 'Pressure',
    summary: 'Impress or intimidate a foe to shut off one approach for their next exchange.',
    description:
      'Impress or intimidate a foe. Choose an approach; your foe cannot choose to use that approach in the next exchange.',
  },
  {
    type: 'basic',
    approach: 'Advance & Attack',
    name: 'Smash',
    summary: 'Destroy or destabilize something in the environment.',
    description:
      'Mark 1-fatigue to destroy or destabilize something in the environment, possibly inflicting or overcoming a fictionally appropriate positive or negative status.',
  },
  {
    type: 'basic',
    approach: 'Evade & Observe',
    name: 'Test Balance',
    summary: "Challenge an engaged foe's balance and learn or shift their principle.",
    description:
      "Mark 1-fatigue to challenge an engaged foe's balance. Ask what their principle is; they must answer honestly. If you already know their principle, instead shift their balance away from center by questioning or challenging their beliefs or perspective.",
  },
  {
    type: 'basic',
    approach: 'Evade & Observe',
    name: 'Bolster or Hinder',
    summary: 'Aid or impede a nearby character by inflicting an appropriate status.',
    description: 'Aid or impede a nearby character, inflicting an appropriate status.',
  },
  {
    type: 'basic',
    approach: 'Evade & Observe',
    name: 'Commit',
    summary: 'Shift toward one of your principles and avoid fatigue next time you live up to it.',
    description:
      'Recenter yourself amidst the fray. Shift your balance toward one of your principles; the next time you live up to that principle, do not mark fatigue.',
  },
  {
    type: 'waterbending',
    approach: 'Advance & Attack',
    name: 'Blood Twisting',
    summary: "Use bloodbending to painfully move and twist a foe's body.",
    description:
      "Use bloodbending to move and twist a foe's body in painful ways. You must be Empowered to use this technique. Inflict a condition on your foe. If they are already Impaired, Trapped, or Doomed, inflict an additional condition. If this is your first, second, or third time ever using this technique, mark a condition.",
    rare: true,
    tags: ['blood'],
  },
  {
    type: 'waterbending',
    approach: 'Defend & Maneuver',
    name: 'Breath of Ice',
    summary: 'Ready yourself to chill any foe who gets close.',
    description:
      'Become ready to breathe shivering cold upon any foe who gets close to you. Any foe engaged with you at any point in this exchange becomes Impaired until they clear the ice from their limbs.',
  },
  {
    type: 'waterbending',
    approach: 'Evade & Observe',
    name: 'Creeping Ice',
    summary: 'Stealthily spread ice beneath foes and become ready to engage them.',
    description:
      'Carefully and stealthily extend a sheet of ice out beneath foes of your choice; they become Impaired as long as they remain on the ice, and you become Prepared to engage with them.',
  },
  {
    type: 'waterbending',
    approach: 'Advance & Attack',
    name: 'Crushing Grip of Seas',
    summary: 'Wrap a foe with water to impair or trap them.',
    description:
      "Throw a tendril of water that wraps around a foe's limb and holds it in place. Mark fatigue and inflict Impaired on a foe; mark an additional 2-fatigue to inflict Trapped on that foe with a second tendril. If the foe is already Impaired, you only need to pay 2-fatigue for Trapped.",
    rare: true,
  },
  {
    type: 'waterbending',
    approach: 'Defend & Maneuver',
    name: 'Flow as Water',
    summary: 'Propel yourself smoothly with water and impair foes you move around.',
    description:
      'Use a jet of water to propel you smoothly around obstacles. Mark 1-fatigue and move to a new location. If you engage with or disengage from a foe, they are Impaired.',
  },
  {
    type: 'waterbending',
    approach: 'Advance & Attack',
    name: 'Freeze Blood',
    summary: 'Use bloodbending to seize a target and hold them in place.',
    description:
      'Use bloodbending to seize a target and hold them in place. You must be Empowered to use this technique. Mark 1-fatigue; your target becomes Trapped and/or Doomed, your choice. If this is your first, second, or third time ever using this technique, mark a condition.',
    rare: true,
    tags: ['blood'],
  },
  {
    type: 'waterbending',
    approach: 'Defend & Maneuver',
    name: 'Ice Gauntlet',
    summary: 'Cover your hand in ice and make your next attack stronger.',
    description:
      'Cover your hand with a sheathe of ice. Become Prepared. When you next make an attack, inflict an additional 1-fatigue.',
  },
  {
    type: 'waterbending',
    approach: 'Advance & Attack',
    name: 'Ice Prison',
    summary: 'Wrap a foe standing in water or on ice with trapping ice.',
    description:
      'Aggressively wrap a foe in ice. Mark 2-fatigue to inflict Trapped on a foe standing in water or on ice.',
    rare: true,
  },
  {
    type: 'waterbending',
    approach: 'Evade & Observe',
    name: 'Refresh',
    summary: 'Heal a willing nearby ally with water.',
    description:
      'Apply water to reinvigorate and close wounds on a willing target. Mark fatigue to heal an ally in reach who is evading and observing. Clear an appropriate status from them, and clear 3-fatigue or two conditions.',
    tags: ['heal'],
  },
  {
    type: 'waterbending',
    approach: 'Advance & Attack',
    name: 'Stream the Water',
    summary: 'Pin a foe with a powerful stream from a significant water source.',
    description:
      'Push a high-powered stream of water from a significant source. Mark fatigue to inflict a condition on a foe within reach of the water source; they are pinned against something and cannot shift positions or engage foes other than you until they break the stream or you drop it. Mark 1-fatigue at the end of each exchange to continue the stream.',
  },
  {
    type: 'waterbending',
    approach: 'Evade & Observe',
    name: 'Slip Over Ice',
    summary: 'Move easily across ice and water while repositioning foes.',
    description:
      'Use ice and water to slip around your environment with ease while putting foes off-balance. Clear 1-fatigue (in addition to clearing 1-fatigue via evade and observe) and reposition foes within reach, deciding who is engaged with whom unless they are willing to mark 1-fatigue and become Impaired to remain where they are.',
  },
  {
    type: 'waterbending',
    approach: 'Defend & Maneuver',
    name: 'Water Cloak',
    summary: 'Surround yourself with water and spend hold to reduce harm or affect the scene.',
    description:
      'Surround yourself with water; mark fatigue and hold 3. Spend your hold 1-for-1 to reduce the 1-fatigue or conditions inflicted by an incoming attack by 1; to become Favored for the next exchange, as long as you use waterbending techniques; or to throw water into the environment, affecting it and possibly inflicting a status. Mark 1-fatigue at the end of each exchange to maintain the hold to the next exchange.',
    rare: true,
  },
  {
    type: 'waterbending',
    approach: 'Defend & Maneuver',
    name: 'Water Whip',
    summary: 'Lash a target with a tendril of water.',
    description:
      "Lash out with a tendril of water. Mark fatigue to inflict a condition or 2-fatigue, target's choice.",
  },
  technique(
    'waterbending',
    'Defend & Maneuver',
    "Arms of Ocean's Reach",
    'Pull water along your arms to create long tendrils to attack. Mark 1-fatigue and become Prepared. While Prepared, your reach is extended by your water tendrils. It costs foes an extra 1-fatigue to disengage with you in any way. If you use another advanced technique with tendrils while you are Prepared from this technique, you may lose Prepared to ignore the fatigue cost of that technique and inflict an extra 1-fatigue if it harms a target.',
  ),
  technique(
    'waterbending',
    'Defend & Maneuver',
    'Douse Flame',
    'Cast a wave of water, extinguishing all flames and soaking your foes. Mark 1-fatigue. Everyone around you except waterbenders becomes Impaired. All firebenders affected by this technique cannot remove Impaired until they first spend 2-fatigue to heat themselves up and dry out their soaked clothes.',
  ),
  technique(
    'waterbending',
    'Advance & Attack',
    'Fist of the Seas',
    'Use a significant body of water nearby to send a towering wave into foes. You cannot use this technique without a significant body of water nearby like a lake, river, or ocean. Mark 3-fatigue to inflict a condition, 2-fatigue, and Stunned on every foe within reach of the water.',
    { rare: true },
  ),
  technique(
    'waterbending',
    'Advance & Attack',
    'Human Puppet',
    'Use bloodbending to control your opponent. You must be Empowered to use this technique. Mark 2-fatigue and your opponent becomes Stunned, Impaired, and Trapped. You hold 3 qi moving forward and may use 1 qi to puppet your opponent to perform an additional basic technique during your turn. If this is your first, second, or third time using this technique, mark a condition.',
    { rare: true, tags: ['blood'] },
  ),
  technique(
    'waterbending',
    'Evade & Observe',
    'Ice Claws',
    'Cover your fingers with ice to create sharp, pointed claws. Mark 1-fatigue to become Prepared. As long as you are Prepared, any time you attack an enemy in close range, inflict an additional 2-fatigue. If you lose the claws, you lose Prepared.',
  ),
  technique(
    'waterbending',
    'Advance & Attack',
    'Ice Grab',
    "Grab a foe's limb in ice and fling them. Mark 1-fatigue to send a ball of water at an opponent, freeze it around a limb, and throw them away from you. They either become Impaired and mark a condition to resist the movement, or allow themselves to be flung. If you throw them into a wall or other people, the target suffers 1-fatigue upon impact as do any people they strike.",
  ),
  technique(
    'waterbending',
    'Defend & Maneuver',
    'Ice Slide',
    'Create an ice slide around you to shift and redirect your foes. Mark 1-fatigue. For any foes engaged with you who choose to advance & attack or defend & maneuver, you may shift their position, engaging or disengaging with them as appropriate. Each of those foes may mark a condition or 2-fatigue to resist this movement.',
  ),
  technique(
    'waterbending',
    'Defend & Maneuver',
    'Ice Snare',
    "Prepare to throw water at a foe's limb, catching it and freezing it in place. Gain 1 reaction. Mark a fatigue and spend this reaction to interrupt a foe's technique this exchange. If you do, they either become Impaired and mark 2-fatigue or the technique is interrupted and fails. Lose all reactions at the end of the exchange.",
  ),
  technique(
    'waterbending',
    'Defend & Maneuver',
    'Octopus Form',
    'Surround yourself with 8 tendrils of water, blocking incoming blows and striking at foes. Mark 2-fatigue. While you have Octopus Form active, once per exchange you may use Strike against any one foe engaged with you. Mark 1-fatigue at the end of each subsequent exchange to keep this form active. While this form is active, you are Impaired, unless you have Mastered this technique.',
  ),
  technique(
    'waterbending',
    'Evade & Observe',
    'Quiet Grip of Ice',
    "Use a bit of water on the ground to grab a foe's foot in an icy hold. Mark 1-fatigue; your opponent becomes Impaired, and if you advance & attack next exchange, you inflict an additional 1-fatigue on that foe with any attacks you make during the exchange.",
  ),
  technique(
    'waterbending',
    'Advance & Attack',
    'Razor Rings',
    'While standing in or near a large source of water, send a wave of razor-sharp water rings rolling at a foe nearby. Mark 1-fatigue. Your foe must dodge the rings, marking 2-fatigue and becoming Impaired, or you can cut loose or destroy any vulnerable objects or items they carry, your choice.',
  ),
  technique(
    'waterbending',
    'Evade & Observe',
    'Rings of Water',
    'Pull long streams of water out of a medium to large source to surround yourself with 1-3 flowing rings. Mark 2, 3, or 4-fatigue respectively. If you manifest one ring, you become Favored; if two rings, you also become Prepared; if three rings, you also become Empowered as long as you have one ring remaining. You may use rings one-for-one to strengthen other waterbending techniques, reducing the fatigue cost by 1 per ring spent, or inflict an additional 2-fatigue per ring spent on a waterbending attack.',
  ),
  technique(
    'waterbending',
    'Defend & Maneuver',
    'Rising Geyser',
    'Rise up on a pillar of water drawn from a large water source. Mark 2-fatigue to become Favored and Empowered for as long as you remain atop the pillar. You remain there until the pillar is destroyed or you choose to use water for another technique. If you choose to use another water technique, reduce any fatigue costs of that technique by one.',
  ),
  technique(
    'waterbending',
    'Advance & Attack',
    'Spike Drill Drive',
    'Leap into the air, then descend feet first, spinning like a corkscrew and surrounding your lower body with an icy spike. Mark 3-fatigue. Every foe near the ground where you land marks 2-fatigue and is thrown backward. If there is anything beneath the surface you land on (a cave, basement, etc.), you immediately move into that space, engaging or disengaging with foes as appropriate.',
  ),
  technique(
    'waterbending',
    'Evade & Observe',
    'Sudden Phase Change',
    'Suddenly shift a small pool or area of water between solid, liquid, and vapor. If you shift to solid, mark 1-fatigue and turn the water to ice -- anyone in the water must mark 1-fatigue to leap away or become Trapped; anyone who passes over it slips and becomes Impaired until they get past it. If you shift to liquid, you become Favored as you give yourself a supply of water to bend with. If you shift to vapor, mark 1-fatigue to inflict Impaired on everyone in the fog who depends on sight, including yourself.',
  ),
  technique(
    'waterbending',
    'Defend & Maneuver',
    'Surf the Wave',
    'Create a giant wave of water from a medium to large source to wash away foes. Mark 2-fatigue, become Favored, and move to a new location. All enemies currently engaged with you or in the path of the wave mark 1-fatigue and become Impaired. If they wish to remain engaged, they must mark an additional 1-fatigue.',
  ),
  technique(
    'waterbending',
    'Defend & Maneuver',
    'Sweat It Out',
    'Must be suffering from one negative status and one condition to use this technique. In a pinch, use your own sweat to fuel your bending. Mark between 1 and 3-fatigue and throw tiny razor blades of sweat towards an opponent. They take between 2 and 4-fatigue depending on fatigue marked. After using this move, you become Favored.',
  ),
  technique(
    'waterbending',
    'Advance & Attack',
    'Water Jab',
    'Surround your fist in water and use the force of the stream to enhance your punch. Mark 1-fatigue to inflict 3-fatigue on your target. Your foe can choose to become Impaired to reduce the amount of fatigue they suffer by 2.',
  ),
  technique(
    'waterbending',
    'Advance & Attack',
    'Water Knife',
    'Create a fast, cutting swoop of water that can cut through vulnerable materials. Mark 1-fatigue and choose your target. If you target a person, inflict a condition and Impaired upon them. If you target the environment, become Prepared and treat this technique as if you had used Smash.',
  ),
  technique(
    'waterbending',
    'Defend & Maneuver',
    'Water Sphere Shield',
    'Surround yourself with a sphere of water to deflect attacks and return fire. Mark between 1 and 3-fatigue, your choice, and hold 1 qi for each fatigue marked. Spend these to block the next 2-fatigue, 1 condition, or negative status you would suffer. As long as you are holding qi, you are Empowered.',
  ),
  {
    type: 'universal',
    approach: 'Advance & Attack',
    name: 'Attack Weakness',
    summary: 'Strike an injured enemy at a weak point.',
    description:
      "Strike an enemy at a weak point where they've already been injured. Mark fatigue to target an engaged, Impaired enemy in reach; they suffer fatigue equal to however many conditions they already have marked.",
  },
  {
    type: 'universal',
    approach: 'Advance & Attack',
    name: 'Charge',
    summary: 'Close distance and strike an unengaged enemy at full force.',
    description:
      "Advance straight at an enemy to strike them full force. Mark fatigue to close the distance and engage with an enemy you aren't currently engaged with, inflicting one condition or 2-fatigue, their choice. Become Favored for next exchange.",
  },
  {
    type: 'universal',
    approach: 'Evade & Observe',
    name: 'Duck and Twist',
    summary: 'Use fast movement to avoid the worst of harm.',
    description:
      "Rely on your fast movement to help keep you out of the worst of harm's way. Mark fatigue to clear one condition and become Favored.",
  },
  {
    type: 'universal',
    approach: 'Advance & Attack',
    name: 'Forceful Blow',
    summary: 'Send an enemy flying with a mighty swing.',
    description:
      'Swing at an enemy with all your might, sending them flying. Mark fatigue and inflict 2-fatigue or one condition on your target, your choice. Then push them to a new position of your choice unless they mark 2-fatigue.',
  },
  {
    type: 'universal',
    approach: 'Advance & Attack',
    name: 'Furious Assault',
    summary: 'Make an unbalanced strike fueled by passion.',
    description:
      'Make an unbalanced, impassioned strike. Become Impaired due to your overwhelming passion, shift your balance away from center, and inflict conditions equal to your Passion on an enemy; NPCs instead inflict conditions equal to their current balance. You may only remove Impaired when your balance is at your center.',
    rare: true,
  },
  {
    type: 'universal',
    approach: 'Advance & Attack',
    name: 'Pounce',
    summary: 'Press the advantage against an off-balance enemy.',
    description:
      'Press the advantage against an enemy who is off-balance. Mark fatigue to inflict Impaired on a foe, or inflict Stunned on an Impaired foe, or inflict 5-fatigue on a Stunned foe.',
    rare: true,
  },
  {
    type: 'universal',
    approach: 'Defend & Maneuver',
    name: 'Protect',
    summary: 'Intercept and stop an attack against an ally.',
    description:
      'Protect an ally within reach. Mark fatigue to intercept and stop an attack made against them in this exchange; if no attack is made against them in this exchange, you both become Inspired.',
  },
  {
    type: 'universal',
    approach: 'Evade & Observe',
    name: 'Rapid Assessment',
    summary: 'Quickly assess the situation and prepare yourself or an ally.',
    description:
      'Quickly take in your situation far faster than normal. Ask one question about the situation at hand. Become Prepared to act on the answer, and you may call out your plan to an ally to make them Prepared as well.',
  },
  {
    type: 'universal',
    approach: 'Evade & Observe',
    name: 'Seek Vulnerabilities',
    summary: 'Study a foe for weaknesses and exploit their balance.',
    description:
      'Examine your foe for weak points. The next time you inflict a condition or fatigue on them, you may also shift their balance. If you know what their principle is, then you may mark fatigue to shift their balance a second time.',
  },
  {
    type: 'universal',
    approach: 'Evade & Observe',
    name: 'Sense Environment',
    summary: 'Find opportunities to reshape your environment usefully.',
    description:
      'Look for opportunities to usefully reshape your environment. The next time you advance and attack or defend and maneuver, you may use Smash or Ready, as appropriate, in addition to any other techniques you use, even on a miss. When you use Smash or Ready this way, do not mark fatigue.',
  },
  {
    type: 'universal',
    approach: 'Defend & Maneuver',
    name: 'Stand Strong',
    summary: 'Brace yourself and block negative statuses this exchange.',
    description:
      'Plant your feet and prepare yourself for incoming blows. Become Prepared, and you automatically block or avoid any negative statuses inflicted on you this exchange.',
  },
  {
    type: 'universal',
    approach: 'Defend & Maneuver',
    name: 'Suck It Up',
    summary: 'Absorb attacks and ready yourself to act immediately after.',
    description:
      'Focus and absorb a blow, readying yourself to act immediately after. For each attack that inflicts fatigue, conditions, or balance shifts on you this exchange, choose one additional technique next exchange, even if you roll a miss on the stance move.',
  },
  {
    type: 'universal',
    approach: 'Defend & Maneuver',
    name: 'Take Cover',
    summary: 'Move into cover and let it absorb the first attack.',
    description:
      'Swerve and maneuver into cover. The first attack on you this exchange strikes your cover, damaging or destroying it, but leaving you unharmed.',
  },
  {
    type: 'group',
    approach: 'Evade & Observe',
    name: 'Attend to Commands',
    summary: 'Organize the group and improve its next attacks.',
    description:
      'A leading voice in the group takes a moment to organize it effectively. The group clears Impaired, becomes Inspired, and inflicts an additional 1-fatigue on all attacks made next exchange.',
  },
  {
    type: 'group',
    approach: 'Evade & Observe',
    name: 'Coordination',
    summary: 'Prepare the group for a coordinated attack next exchange.',
    description:
      'The group sets itself up to launch a concerted, skilled attack upon its targets next exchange. The group becomes Prepared and Favored and may clear 2-fatigue or a condition, in addition to the normal 1-fatigue for evade and observe.',
  },
  {
    type: 'group',
    approach: 'Evade & Observe',
    name: 'Draw Foe',
    summary: 'Mislead an engaged foe into overextending.',
    description:
      'The group misleads foes into overextending themselves. The group targets an engaged foe who chose the advance and attack approach this exchange. That foe must mark 1-fatigue, becomes Impaired, and is moved out of reach of allies.',
  },
  {
    type: 'group',
    approach: 'Defend & Maneuver',
    name: 'Engulf',
    summary: 'Swarm and engage a target, cutting off escape.',
    description:
      'The whole group shifts forward en masse, engulfing their target and engaging them. An engulfed target becomes Impaired and cannot escape or disengage this exchange. The group automatically uses Strike against each Impaired foe within reach.',
  },
  {
    type: 'group',
    approach: 'Advance & Attack',
    name: 'Focused Fire',
    summary: 'Attack in synchronized fashion against the same target.',
    description:
      'The group pours out all of its attacks simultaneously, in synchronized fashion, against the same target. Mark fatigue to inflict 2-fatigue and a condition. If the group was Prepared for this attack, inflict an additional 2-fatigue and another condition.',
  },
  {
    type: 'group',
    approach: 'Advance & Attack',
    name: 'Overwhelm',
    summary: 'Strike every combatant in reach.',
    description:
      'Strike at every combatant in reach. All foes engaged with the group must mark 2-fatigue or one condition, their choice.',
  },
  {
    type: 'group',
    approach: 'Evade & Observe',
    name: 'Scatter and Regroup',
    summary: 'Split apart, clear a condition, and reform nearby.',
    description:
      'The group splits apart and reforms nearby. The group clears one condition. Any foe engaged with the group is no longer engaged with the group, and the group can advance and engage with foes as it chooses; any foes the group engages with are Impaired.',
  },
  {
    type: 'group',
    approach: 'Defend & Maneuver',
    name: 'Shield Wall',
    summary: 'Form a barricade and block movement past it.',
    description:
      'The group together forms a barricade. The group becomes Favored and ignores the first 2-fatigue and one condition it would mark this exchange. Next exchange, all movement or maneuvering past the shield wall is automatically blocked.',
  },
  {
    type: 'group',
    approach: 'Defend & Maneuver',
    name: 'Spread Out',
    summary: 'Cover more ground and avoid large-scale attacks.',
    description:
      'The group spreads itself out to cover more ground and avoid large-scale attacks. The group cannot suffer more than 1-fatigue, one condition, or one balance shift from any individual attack; the attacker chooses which if necessary. The group can also engage with any foes in a much wider reach, and pays no cost to keep an engaged foe from escaping.',
  },
  {
    type: 'group',
    approach: 'Advance & Attack',
    name: 'Surround',
    summary: 'Close around one foe and punish repeated attacks.',
    description:
      'The group closes around a single foe. Every additional attack made on that foe during this exchange inflicts an additional 1-fatigue. Every attack made by a surrounded foe forces them to suffer 1-fatigue.',
  },
  {
    type: 'group',
    approach: 'Advance & Attack',
    name: 'Swarm',
    summary: 'Throw the group onto a foe with no regard for safety.',
    description:
      'The group throws itself upon a foe with no heed to its own safety. Mark fatigue to inflict 2-fatigue on a single target. This technique may be chosen multiple times. Each time it is chosen after the first, it inflicts an additional 1-fatigue.',
  },
  {
    type: 'group',
    approach: 'Evade & Observe',
    name: 'Test Defenses',
    summary: 'Probe a foe and learn their abilities.',
    description:
      "The group slowly probes the defenses of a foe, one or two members attacking individually to determine the foe's abilities. The group becomes Prepared, Favored, Inspired, and learns the balance principle of its target; the chosen foe may immediately use Strike on the group in turn.",
  },
  {
    type: 'group',
    approach: 'Defend & Maneuver',
    name: 'Protect Objective',
    summary: 'Surround and protect a person, place, or object.',
    description:
      'The group surrounds a person, place, or object with their backs to it, to protect it from attack, disruption, or seizure. The group marks 2-fatigue and becomes Prepared. All foes near or engaged with the protected target become disengaged and pushed back from the target and are now engaged with the group. No foe can reach the protected target until the group is scattered or loses Prepared.',
  },
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Detect the Heavy Step',
    'Use seismic sense to detect the instant an enemy is about to move against you. Become Prepared, and at any time during this exchange, you may lose your Prepared status and mark fatigue to interrupt an enemy as they use a technique; they must mark an additional 3-fatigue or you disrupt their attempt to act, canceling the technique.',
    { rare: true, tags: ['seismic sense'] },
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Dust Stepping',
    'Step up into the air on thin pillars of dust and stone. Advance to a higher position and become Favored and Prepared. Any foe engaged with you can mark 2-fatigue to block this effect.',
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Earth Armor',
    'Gather earth, crystal, or other available material around you to create armor. Hold 3. Spend one hold to negate one condition or 2-fatigue inflicted upon you. While you have hold, you are Favored. You must spend hold at least one whenever an incoming attack would inflict fatigue or conditions.',
  ),
  technique(
    'earthbending',
    'Advance & Attack',
    'Earth Gauntlet',
    'Wrap your arm or fist in rock and strike. Mark fatigue; inflict one condition or 2-fatigue. You can also knock your foe out of reach and disengage; they must mark an additional fatigue to resist.',
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Earth Launch',
    "Throw yourself into the air with a massive burst of force. Mark 1-fatigue and become Favored. You disengage with all foes who can't reach you high in the air for the rest of this exchange, but you come right back down into their midst at the end of this exchange.",
  ),
  technique(
    'earthbending',
    'Advance & Attack',
    'Earth Sinking',
    'Sink a foe into the earth itself. Mark 2-fatigue to trap an enemy standing on the ground in the earth; they become Trapped.',
    { rare: true },
  ),
  technique(
    'earthbending',
    'Evade & Observe',
    'Eat Dirt',
    'Even the smallest pebble can cause a gator-phant to stumble. Cause a foe to lose their footing. Your target is Impaired and unable to choose defend and maneuver in the next exchange.',
  ),
  technique(
    'earthbending',
    'Evade & Observe',
    'Ground Shift',
    'Twist the ground itself to displace or unbalance foes. Target an individual foe or an area. If you target an area, mark 1-fatigue. All affected foes become Impaired for an exchange, or Stunned if they are already Impaired.',
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Lava Star',
    'Create a floating, spinning star of lava that can cut through nearly anything. Mark fatigue and become Favored as long as the star is active. Every time you use the star as part of an attack, you can also cut through or destroy part of the scenery as if you had used the Smash basic technique, at no additional cost. You may mark fatigue at the end of each exchange to keep the star active.',
    { rare: true, tags: ['lava'] },
  ),
  technique(
    'earthbending',
    'Evade & Observe',
    'Metal Bindings',
    "Catch an enemy's limbs in metal you control. They become Impaired and cannot remove the status unless they are able to metalbend or the fight ends. While they are Impaired and you are engaged with them, you are Favored.",
    { tags: ['metal'] },
  ),
  technique(
    'earthbending',
    'Advance & Attack',
    'Rock Column',
    'Pin a foe with a column of earth. Inflict Impaired on a single combatant. If they are already Impaired, inflict Trapped. If they are already Trapped, inflict Doomed.',
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Stone Shield',
    'Raise a defensive shield of stone that protects you or someone else. Mark 1-fatigue to raise the shield. Anyone protected by the Stone Shield gains Impaired; it is tough to move inside. The shield blocks the first attack directed toward it each exchange. It remains in place until you decide it comes down. You can elect to use the raw material in the wall for an earthbending technique, reducing its cost by 1-fatigue and removing the Stone Shield.',
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Pack Earth',
    'Lift stone and dirt into the air and pack it together as tightly as possible to create a super-hard ball. Mark 1-fatigue. You may use Strike next exchange with this ball.',
  ),
  technique(
    'earthbending',
    'Evade & Observe',
    'Quicksand',
    "Turn the earth in an area to quicksand; all foes in the area become Impaired. If they don't free themselves by the end of the next exchange after becoming Impaired, they become Trapped. If they don't free themselves by the end of the next exchange after becoming Trapped, they become Doomed.",
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Rapid Tunneling',
    'Dive into the earth. You become Empowered immediately and can use no other techniques in this exchange, but you cannot be targeted by any attacks or effects besides earthbending. You emerge next exchange in a place within reach thru the earth. Lose Empowered the following exchange.',
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Slice Stone',
    'Cut a large stone or stone structure in two with a swipe of your hand. Mark 1-fatigue and clear the obstacle; become Prepared to lift the cut chunk of stone with your bending in the next exchange. If there are foes in reach, you may cut the stone so it falls atop them, inflicting 2-fatigue as they dive out of the way.',
  ),
  technique(
    'earthbending',
    'Defend & Maneuver',
    'Subtle Misdirection',
    'Subtly earthbend the ground under a foe to direct their next attack elsewhere. Mark 2-fatigue and target someone who attacked and advanced this exchange; you select the target for the first attack they make this exchange.',
  ),
  technique(
    'earthbending',
    'Evade & Observe',
    'Thick Mud',
    'Transform the earth and stone around you into sticky, sucking mud. Any foes engaged with and acting against you in this exchange become stuck and Impaired; you may use Strike against each stuck foe in the next exchange, regardless of your chosen approach and in addition to your normal techniques.',
  ),
  technique(
    'martial',
    'Advance & Attack',
    'Aerial Kick',
    'Launch yourself vertically into a bicycle kick. Mark 1-fatigue to target two individual foes or one group with this attack. Individual foes must each mark 2-fatigue or one condition; the group must mark 4-fatigue or two conditions, their choice.',
  ),
  technique(
    'martial',
    'Advance & Attack',
    'Bludgeon',
    'With hand-to-hand combat, attempt to rapidly subdue your foe. Mark 1-fatigue and cause your foe to shift their balance away from center; if their balance is +2 or higher, they become Stunned. Mark an additional fatigue to move your foe to a new position.',
  ),
  technique(
    'martial',
    'Defend & Maneuver',
    'Counterstrike',
    "Using impeccable timing, read your foe's movement and lash out with blinding speed. Execute a Strike as if you had marked 1-fatigue against an engaged foe who chose advance and attack. You cannot use this technique if you have any negative statuses.",
  ),
  technique(
    'martial',
    'Advance & Attack',
    'Dire Strike',
    'Put all your force and strength behind a two-handed punch. Mark 2-fatigue and inflict 4-fatigue, a condition, and Impaired on the target. If they are wielding a weapon, you may mark an additional 1-fatigue to disarm them.',
  ),
  technique(
    'martial',
    'Defend & Maneuver',
    'Disarm',
    "Target your foe's ability to fight by breaking, removing, or limiting a particular style. Mark 2-fatigue to name any advanced advance and attack technique your foe has -- they are unable to use that technique for the remainder of this encounter.",
  ),
  technique(
    'martial',
    'Advance & Attack',
    'Double Leg Kickout',
    'Leap and land both your feet on your foe, kicking off them with your whole body. Mark 1-fatigue; you and your foe each roll 2d6. If you roll higher than your foe, they are knocked to the ground, becoming Stunned and Impaired.',
  ),
  technique(
    'martial',
    'Advance & Attack',
    'Draw Close',
    'Dash and dodge in close to an opponent of your choice. Mark 1-fatigue and become Favored. If they advance and attack next exchange, they have to mark 1-fatigue for each technique they use (they may choose to use fewer than their full amount).',
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Feint',
    'Trick your foes into overextending themselves against you. If you were targeted by any attacks this exchange, you may mark 1-fatigue to immediately inflict a condition on each opponent.',
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Flying Tiger-Squirrel',
    'Launch yourself into the air as if flying to avoid an attack and land in a chosen position. You become Prepared.',
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Flowing Stance',
    'You take up a stance to enable you to string many motions together fluidly. Mark 2-fatigue and become Prepared. While you are Prepared from this technique, you may use one additional advanced martial technique each exchange, as long as you advance & attack or defend & maneuver.',
  ),
  technique(
    'martial',
    'Advance & Attack',
    'Hook Foe',
    "Use your martial prowess to catch and hook a foe's limb, pulling them off their feet. Mark 2-fatigue; your opponent becomes Stunned and falls to the ground unless they mark 3-fatigue to keep their feet.",
  ),
  technique(
    'martial',
    'Advance & Attack',
    'Hurl Weapon',
    'Hurl a weapon unintended for throwing at a foe. You lose your weapon and become Impaired for the next exchange or until you retrieve it. Inflict 2-fatigue and a condition on your target.',
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Improvise Weapon',
    'Quickly arm yourself with a weapon improvised from materials around you. Mark 1-fatigue and become Favored. When you inflict harm with this weapon, the weapon breaks and you inflict an additional 2-fatigue.',
  ),
  technique(
    'martial',
    'Defend & Maneuver',
    'Mirror Block',
    "Prepare to match, mirror, and capitalize on an opponent's attack. Mark 1-fatigue and become Prepared. While you are Prepared from this technique, you may lose Prepared to mirror an opponent's attack, blocking it and then pulling them off-balance; if you do, you completely cancel the effects of an attack they make and inflict Impaired on them.",
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Monologue',
    'Rant a bit about your own awesomeness in the middle of a fight. Clear 1-fatigue and become Inspired.',
  ),
  technique(
    'martial',
    'Advance & Attack',
    'Oh How the Turns Table',
    "Make careful strikes to undermine your foe's advantageous position. Mark 1-fatigue to knock your foe from their position to a new, lesser location, inflicting 1-fatigue. If your foe was Favored or Prepared at the start of the exchange, you instead inflict an additional 1-fatigue. They lose all appropriate positive statuses. These costs and consequences cannot be canceled or avoided by another technique.",
  ),
  technique(
    'martial',
    'Advance & Attack',
    'One Inch Punch',
    'When Trapped, mark 2-fatigue to break out of your supposed prison. You remain Impaired but become Favored. You may only use this technique twice before resting.',
  ),
  technique(
    'martial',
    'Defend & Maneuver',
    'Parry',
    "Stop a foe's attack before it connects. Choose a foe who used advance and attack this exchange; mark fatigue 1-for-1 to cancel an attack they use against you after they pay the cost.",
  ),
  technique(
    'martial',
    'Defend & Maneuver',
    'Qi Blocking Jabs',
    "Pinpoint hand strikes to block a foe's qi. Mark 1-fatigue to block a foe's chi with your strikes, inflicting a condition and rendering a limb useless (and blocking bending with that limb). An enemy with one fewer useful limb chooses 1 fewer technique to use each exchange. Limbs become usable again when combat ends or three exchanges pass.",
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Recoiling Jet',
    'Throw yourself away from danger with a sudden burst of energy. Mark 1-fatigue, become Favored, and remove all of Trapped, Impaired, and Doomed as appropriate.',
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Seek the Deepest Calm',
    'Quiet your emotions and focus yourself. Use only in an exchange in which no conditions were inflicted upon you. Clear any non-physical negative statuses or become Inspired. Clear two conditions of your choice. You may only use this technique once per combat.',
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Switch It Up',
    'Switch up your style, footwork, or bearing, causing your foe to second-guess your next move. Mark 1-fatigue to become Prepared and force an engaged foe to reveal their next approach (AA, DM, EO) before you choose yours next exchange.',
  ),
  technique(
    'martial',
    'Defend & Maneuver',
    'Take the High Ground',
    'Move to an advantageous position above your foe. Mark 1-fatigue, become Favored, and ignore the harm and negative statuses from any attacks they make against you this exchange.',
  ),
  technique(
    'martial',
    'Evade & Observe',
    'Taunt',
    'Insult and taunt a foe into making a mistake. Your foe must either try to ignore your insults and mark fatigue equal to their highest balance principle rating, or give in to them, agreeing now to advance and attack and target you with any attacks. If your foe gives in to your insults, you become Prepared.',
  ),
  technique(
    'martial',
    'Defend & Maneuver',
    'The Way of Jasmine',
    "Use wide sweeping blows to control your foe's movements and options in the fight. Mark 1-fatigue to use the Pressure basic technique, but choosing 2 approaches instead of 1. You cannot use Pressure on its own in the same exchange that you use the Way of Jasmine.",
  ),
  technique(
    'martial',
    'Defend & Maneuver',
    'This Is My Hand Now',
    "You catch a foe's incoming hand and twist it until it feels like it could break. Their attack fails; mark 1-fatigue and your opponent is Impaired.",
  ),
  technique(
    'firebending',
    'Evade & Observe',
    'A Single Spark',
    'Unleash your emotions into the flames around you. Mark 1-fatigue to hold 1 for each condition you have marked. Spend your hold 1-for-1 in the next exchange to pay the costs of techniques as if it was fatigue, to inflict Doomed on a foe you target with firebending, or to use Seize a Position no matter what approach you used, in addition to your other techniques.',
  ),
  technique(
    'firebending',
    'Evade & Observe',
    'Arc Lightning',
    'Channel lightning through your body against a closely engaged foe. Mark 1-fatigue to inflict a condition on an engaged foe who used an advance and attack technique against you this exchange; if they already have two conditions marked, they are also Stunned.',
    { rare: true, tags: ['lightning'] },
  ),
  technique(
    'firebending',
    'Advance & Attack',
    'Breath of Fire',
    'Breathe fire in a massive gout. Mark fatigue to set alight as much or as little of your surroundings as you choose and try to set aflame any foes within reach. Those foes must either retreat and disengage with you, becoming Impaired, or suffer 2-fatigue and become Doomed as they catch fire.',
  ),
  technique(
    'firebending',
    'Advance & Attack',
    'Explosive Blast',
    'Fire a sparking, spitting beam of focused energy that explodes when it reaches its target. Your target must either dive for cover or take the blow. If they dive for cover, they mark 2-fatigue and become Impaired; if they are already Impaired, they cannot dive for cover. If they take the blow, they mark 4-fatigue.',
    { rare: true, tags: ['combustion'] },
  ),
  technique(
    'firebending',
    'Advance & Attack',
    'Fire Blade',
    "Swipe your surroundings with a blade of flame. Mark 1-fatigue to slice through a piece of your surroundings and destabilize your foe's footing, inflicting 2-fatigue and Impaired on them.",
  ),
  technique(
    'firebending',
    'Advance & Attack',
    'Fire Pinwheel',
    'Throw a spinning disc of pure flame. Mark 1-fatigue; your target must either mark 2 conditions, or mark 1-fatigue and dodge the disc and allow it to set everything around them aflame, possibly inflicting negative statuses.',
    { rare: true },
  ),
  technique(
    'firebending',
    'Defend & Maneuver',
    'Fire Stream',
    'Pour fire upon a target. Mark fatigue to inflict Impaired on them. Mark 3-fatigue to inflict Doomed and Impaired. Mark 5-fatigue to inflict Trapped, Doomed, and Impaired.',
  ),
  technique(
    'firebending',
    'Defend & Maneuver',
    'Fire Whip',
    "Lash out from a distance. Inflict 2-fatigue or a condition, target's choice, and enemies must mark fatigue to get close enough to attack you this exchange.",
  ),
  technique(
    'firebending',
    'Advance & Attack',
    'Flame Knives',
    'Mark up to 3-fatigue. Hold an equal number of flames. Lose 1-flame at the end of each exchange after this one. When you inflict fatigue or conditions on a foe, inflict an additional 1-fatigue for each remaining flame.',
  ),
  technique(
    'firebending',
    'Evade & Observe',
    'Jet Stepping',
    'Advance to a higher position and become Favored and Prepared for the next exchange. Any foe engaged with you can mark 2-fatigue to block this technique.',
  ),
  technique(
    'firebending',
    'Advance & Attack',
    'Lightning Blast',
    'Hurl a bolt of lightning at a target. Mark up to 3-fatigue. For each fatigue you mark, your target must mark 2-fatigue.',
    { rare: true, tags: ['lightning'] },
  ),
  technique(
    'firebending',
    'Advance & Attack',
    'Spiral Flare Kick',
    'Spin skyward on jets of flame as you lash out with your legs. Mark 1-fatigue to target two individual foes or one group with this attack. Individual foes must each mark 2-fatigue or one condition, their choice; the group must mark 4-fatigue or two conditions, their choice.',
    { rare: true },
  ),
  technique(
    'firebending',
    'Defend & Maneuver',
    'Wall of Fiery Breath',
    'Breathe a gout of flame that keeps foes back as you maneuver away from them. Mark one condition and move to a new position. Foes must keep their distance and become disengaged, or push through the flame and suffer 4-fatigue.',
  ),
  technique(
    'airbending',
    'Evade & Observe',
    'Air Cushion',
    'Soften the blows an ally takes and get them back on their feet faster. Mark fatigue to clear 2-fatigue, one condition, or any one status from an ally within reach who was struck by an attack this exchange.',
  ),
  technique(
    'airbending',
    'Evade & Observe',
    'Air Scooter',
    'Summon a ball or ring of air under yourself. While riding it, you are Favored. You can sacrifice your air scooter to avoid marking fatigue or conditions when you are struck by an attack.',
  ),
  technique(
    'airbending',
    'Defend & Maneuver',
    'Air Swipe',
    'Prepare to cast an arc of pressurized air to knock away incoming attacks and throw enemies off-balance. If any enemy attacks you, you may mark fatigue to cast the arc and block or divert the strike. If no enemy has attacked you by the end of the exchange, you may cast the arc to inflict 2-fatigue on up to three enemies.',
  ),
  technique(
    'airbending',
    'Advance & Attack',
    'Breath of Wind',
    'Exhale mightily through pursed lips. Knock down a single target and inflict Stunned on them, unless they choose to mark 4-fatigue.',
  ),
  technique(
    'airbending',
    'Advance & Attack',
    'Cannonball',
    "Rush forward with the might of the wind behind you and crash into a foe. Mark 1-fatigue to target a foe you aren't currently engaged with and rush at them. You become engaged with them, disengaging with other current foes, and inflict a condition on them.",
  ),
  technique(
    'airbending',
    'Evade & Observe',
    'Cushion the Forceful Fist',
    'Put a cushion of twisting air around your body that keeps physical strikes at bay. Mark 2-fatigue to become Favored; you are immune to hard, physical, forceful attacks and blows until the end of the next exchange.',
    { rare: true },
  ),
  technique(
    'airbending',
    'Advance & Attack',
    'Directed Funnel',
    'Create a spinning funnel of air that can fire objects at high speed. Mark fatigue; each ally in reach can mark 1-fatigue to toss an appropriate small object into the funnel, inflicting 2-fatigue on a target within reach for each ally who does.',
  ),
  technique(
    'airbending',
    'Evade & Observe',
    'Reed in the Wind',
    'Adjust your movements to perfectly match and avoid the movements of a foe. Mark 2-fatigue and secretly name the approach you believe your foe will use in the next exchange; reveal it after approaches are chosen. If you were incorrect, you may shift your chosen approach. If you were correct, you become immediately Favored for that exchange, and they cannot target you with any techniques.',
    { rare: true },
  ),
  technique(
    'airbending',
    'Evade & Observe',
    'Shockwave',
    'Leap into the air and hurtle back to the ground, sending a massive burst of pressurized air all around you. Mark 2-fatigue; everyone in the area, including allies, is thrown away, disengaging and becoming Stunned unless they mark 4-fatigue.',
    { rare: true },
  ),
  technique(
    'airbending',
    'Evade & Observe',
    'Small Vortex',
    'Spin a single enemy off the ground on a small vortex. Mark 3-fatigue; your target becomes Impaired and Stunned.',
  ),
  technique(
    'airbending',
    'Evade & Observe',
    'Suction',
    "Snatch a small object off the ground or from a foe's hand with a sucking wind. The object snaps to your hand unless someone marks 2-fatigue to hold it or block its movement.",
  ),
  technique(
    'airbending',
    'Defend & Maneuver',
    'Twisting Wind',
    'Effortlessly flow around blows like the wind itself. For each foe engaged with you who chose an advance and attack approach, clear 1-fatigue and hold 1-momentum. If you advance and attack next exchange, you may spend your momentum instead of fatigue.',
  ),
  technique(
    'airbending',
    'Defend & Maneuver',
    'Wind Run',
    "Race at high speeds, dodging attacks and seeking escape. Mark 1-fatigue to slip to a particular point of escape, disengaging with foes; you don't engage any new foes. If no one re-engages with you or blocks your retreat by the end of the exchange, you escape the scene.",
  ),
  technique(
    'weapons',
    'Advance & Attack',
    'Bludgeon',
    'Using a blunt weapon or hand-to-hand combat, attempt to rapidly subdue your foe. Mark 1-fatigue and cause your foe to shift their balance away from center; if their balance is now +2 or higher, they mark Stunned. Mark an additional 1-fatigue to move your foe to a different position within reach.',
  ),
  technique(
    'weapons',
    'Advance & Attack',
    'Boom!',
    "Throw a small prepared explosive into the midst of your foes. Mark 2-fatigue or clear Prepared to toss the explosive into your enemies' midst. Everyone in range, including allies in the area, must either mark 3-fatigue to dive away, or mark a condition and become Stunned, their choice.",
    { rare: true },
  ),
  technique(
    'weapons',
    'Evade & Observe',
    'Chart a Course',
    'Plan a clear and perfect path of action. Secretly choose your approach and up to two techniques you plan to use in the next exchange, noting them in advance. If you use those techniques in the next exchange, reveal your planning; those techniques cost no fatigue and cannot be canceled or blocked. Anyone engaged with you can mark fatigue to look at the note.',
    { rare: true },
  ),
  technique(
    'weapons',
    'Defend & Maneuver',
    'Counterstrike',
    "Using impeccable timing, read your foe's movement and lash out with blinding speed. Execute a Strike as if you had marked 1-fatigue against an engaged foe who chose advance and attack as their approach. You cannot use this technique if you have any negative statuses.",
  ),
  technique(
    'weapons',
    'Defend & Maneuver',
    'Disarm',
    "Target your foe's ability to fight by breaking, removing, or limiting a particular style. Mark 2-fatigue to name any advanced advance and attack technique your foe has; they are unable to use that technique for the remainder of this encounter.",
  ),
  technique(
    'weapons',
    'Evade & Observe',
    'Feint',
    'Trick your foes into overextending themselves against you. If you were targeted by any attacks this exchange, you may mark fatigue to immediately inflict a condition on each of your attackers.',
  ),
  technique(
    'weapons',
    'Defend & Maneuver',
    'Parry',
    "Stop a foe's attack before it connects. Choose a foe who used advance and attack this exchange; during advance and attack, mark fatigue 1-for-1 to cancel an attack they use against you after they pay the costs.",
  ),
  technique(
    'weapons',
    'Advance & Attack',
    'Pin a Fly to a Tree',
    'Fire arrows with perfect accuracy to pin a foe in place. Mark 1-fatigue to inflict Impaired on a target, or 3-fatigue to inflict Impaired and Trapped.',
    { rare: true },
  ),
  technique(
    'weapons',
    'Advance & Attack',
    'Pinpoint Thrust',
    'Using a thrusting or stabbing weapon, go straight for the target with precision and accuracy. Mark 1-fatigue and inflict 2-fatigue and Impaired on your foe. You may mark an additional 1-fatigue to move yourself to a new position within reach immediately; any foes engaged with you may mark 1-fatigue to block this movement.',
  ),
  technique(
    'weapons',
    'Evade & Observe',
    'Switch It Up',
    'Switch up your style, footwork, weapon, or bearing, causing your foe to second-guess your next move. Mark 1-fatigue to become Prepared and force an engaged foe to reveal their choice of approach before you choose yours during the next exchange.',
  ),
  technique(
    'weapons',
    'Defend & Maneuver',
    'Take the High Ground',
    'Move to an advantageous position above your foe. Mark 1-fatigue, become Favored, and ignore the harm and negative statuses from any attacks they make against you this exchange.',
  ),
  technique(
    'weapons',
    'Advance & Attack',
    'Turn the Tables',
    "Make careful strikes to undermine your foe's advantageous position. Mark 1-fatigue to knock your foe from their position to a new, disadvantageous location, inflicting 1-fatigue. If your foe was Favored or Prepared at the start of the exchange, you do not mark fatigue, you inflict an additional 1-fatigue, and they lose all appropriate positive statuses. These costs and consequences cannot be canceled or avoided by another technique.",
    { rare: true },
  ),
  technique(
    'technology',
    'Defend & Maneuver',
    'Better, Faster, Stronger',
    'You push your equipment to its limits to move fast and charge up. Mark 1-fatigue to use Seize a Position, but no foe can block you. You may mark an additional 1-fatigue to gain Empowered for as long as you maintain the new position, or to move to an unsafe, unstable area and make it safe.',
  ),
  technique(
    'technology',
    'Advance & Attack',
    'Blinded By Science',
    'Use your gadgets and gizmos in a way that confuses and dazzles even the most tech-savvy foe. Mark up to 3-fatigue as you throw out your devices. If you mark 1-fatigue, inflict 1-fatigue and Impaired on your foe. If you mark 2-fatigue, inflict Trapped or Stunned on your foe, as well. If you mark 3-fatigue, inflict both Trapped and Stunned in addition to the 1-fatigue effects.',
  ),
  technique(
    'technology',
    'Evade & Observe',
    'Collect Material',
    'Scrounge up bits and bobs from the area around you that you can use to your advantage. Take 3-gears and become Prepared. Spend gears 1-for-1 instead of fatigue on technology techniques or basic techniques using technology training.',
  ),
  technique(
    'technology',
    'Advance & Attack',
    'Entangler',
    'Entangle a foe with a weapon or device. Mark 1-fatigue to wrap the entangling object around your foe; they are Trapped. They break free automatically after they are Trapped for two full exchanges.',
  ),
  technique(
    'technology',
    'Advance & Attack',
    'Full-Power Attack',
    'Discharge your batteries, release the high-tension coils, and otherwise unleash the full charge of your equipment. Become Impaired and inflict 2-fatigue on a targeted foe. Spend all gears you currently hold 1-for-1 to inflict 1 additional fatigue. If you spend 3 or more gears in this way, inflict 2 additional fatigue. You cannot earn gears for the rest of this scene; your equipment is too damaged, depleted, or otherwise used up.',
    { rare: true },
  ),
  technique(
    'technology',
    'Advance & Attack',
    'Jolt',
    'Launch a disruptive attack on a target within reach in an attempt to control or slow them. Mark 1-fatigue to target a person or object. If you target a person, they must shift their balance away from center; if they are a technology user or covered in metal, they become Stunned. If you target an object, it is temporarily slowed or shut down.',
  ),
  technique(
    'technology',
    'Advance & Attack',
    'Jury Rig',
    'Create a new device on the fly. You gain Favored, hold 1-gear, and name one basic technique from any approach. As long as you hold this device, you can use that technique as if it was part of your current approach by spending 1-gear. Otherwise, spend gears 1-for-1 instead of fatigue on technology techniques or basic techniques using technology training.',
    { rare: true },
  ),
  technique(
    'technology',
    'Evade & Observe',
    'Pinpoint Flaws',
    'Identify weak points in your environment. Name a status you wish to inflict on a foe next exchange; the GM will tell you what you need to break in your environment to inflict that status. Next exchange, you may use Smash for free no matter what approach you use.',
  ),
  technique(
    'technology',
    'Evade & Observe',
    'Plant Trap',
    'Place a snare or triggered explosive into your environment. Mark 1-fatigue; the next enemy who enters the trapped area must mark a condition and shift their balance away from center.',
  ),
  technique(
    'technology',
    'Defend & Maneuver',
    'Rebuild',
    'Using your technological know-how, you improve your situation by quickly tuning, repairing, and adjusting your available equipment. Mark 1-fatigue, clear a condition, and gain 3-gears. Spend gears 1-for-1 instead of fatigue on technology techniques or basic techniques using technology training.',
  ),
  technique(
    'technology',
    'Defend & Maneuver',
    'Smoke Bomb',
    'Throw a smoke bomb to cover your escape from the combat. Mark 1-fatigue to immediately Impair any foes engaged with you. You escape at the end of this exchange. Any foe who is engaged with you and not Impaired may mark 1-fatigue to block your escape.',
  ),
  technique(
    'technology',
    'Defend & Maneuver',
    'Wind Up',
    'Wind up a technological device to build tension and charge. Gain 1-gear and become Favored; then, mark up to 2-fatigue, and hold 2 additional gears for each fatigue you mark. Spend gears 1-for-1 instead of fatigue on technology techniques or basic techniques using technology training.',
    { rare: true },
  ),
];

// Hand-authored collapsed-card summaries, keyed by `type|name`. Each is a
// descriptive first line followed by condensed mechanical line(s) (terse, not
// necessarily full sentences) so the collapsed card differs from the expanded
// rules text. Applied over every built-in technique below.
export const AVATAR_LEGENDS_TECHNIQUE_SUMMARIES: Record<string, string> = {
  // Basic
  'basic|Ready':
    'Ready yourself or your environment.\nMark 1-fatigue; assign or clear a fitting status on nearby characters or yourself.',
  'basic|Retaliate':
    'Steel yourself and punish foes who harm or unbalance you.\nEach time a foe inflicts fatigue, a condition, or shifts your balance this exchange, inflict 1-fatigue on them.',
  'basic|Seize a Position':
    'Move to a new location or escape.\nEngage/disengage, overcome a status or danger, take an advantageous spot, or flee. Engaged foes may mark 1-fatigue to block.',
  'basic|Strike':
    'Strike a foe in reach.\nThey mark 2-fatigue, a condition, or shift balance (their choice). Mark 1-fatigue to instead force 2-fatigue or inflict a condition.',
  'basic|Pressure':
    "Impress or intimidate a foe.\nChoose an approach; they can't use it next exchange.",
  'basic|Smash':
    'Destroy or destabilize something in the environment.\nMark 1-fatigue; may inflict or overcome a fitting status.',
  'basic|Test Balance':
    'Challenge an engaged foe’s balance.\nMark 1-fatigue; ask their principle (answered honestly). If you know it, shift their balance from center instead.',
  'basic|Bolster or Hinder':
    'Aid or impede a nearby character.\nInflict an appropriate status on them.',
  'basic|Commit':
    "Recenter yourself amid the fray.\nShift balance toward a principle; next time you live up to it, don't mark fatigue.",
  // Waterbending
  'waterbending|Blood Twisting':
    "Bloodbend to twist a foe's body painfully.\nMust be Empowered. Inflict a condition; +1 if they're Impaired/Trapped/Doomed. First 3 uses ever: mark a condition.",
  'waterbending|Breath of Ice':
    'Ready to chill any foe who closes in.\nAny foe engaged with you this exchange becomes Impaired until they clear the ice.',
  'waterbending|Creeping Ice':
    'Stealthily spread ice beneath chosen foes.\nThey are Impaired while on the ice; you become Prepared to engage them.',
  'waterbending|Crushing Grip of Seas':
    "Wrap a foe's limb in water.\nMark fatigue, inflict Impaired; +2-fatigue to also inflict Trapped (only 2-fatigue if already Impaired).",
  'waterbending|Flow as Water':
    'Propel yourself smoothly on a jet of water.\nMark 1-fatigue, move to a new location; foes you engage/disengage become Impaired.',
  'waterbending|Freeze Blood':
    'Bloodbend to seize and hold a target.\nMust be Empowered. Mark 1-fatigue; target becomes Trapped and/or Doomed. First 3 uses ever: mark a condition.',
  'waterbending|Ice Gauntlet':
    'Sheathe your hand in ice.\nBecome Prepared; your next attack inflicts +1-fatigue.',
  'waterbending|Ice Prison':
    'Wrap a foe in ice.\nMark 2-fatigue to inflict Trapped on a foe standing in water or on ice.',
  'waterbending|Refresh':
    'Apply water to heal a willing ally.\nMark fatigue; heal an ally who is evading/observing: clear a fitting status plus 3-fatigue or two conditions.',
  'waterbending|Stream the Water':
    "Pin a foe with a powerful stream from a large water source.\nMark fatigue, inflict a condition; they're pinned and can't reposition or engage others. Mark 1-fatigue/exchange to maintain.",
  'waterbending|Slip Over Ice':
    'Glide over ice and water, putting foes off-balance.\nClear 1-fatigue (plus the usual 1) and reposition foes in reach; they mark 1-fatigue and become Impaired to resist.',
  'waterbending|Water Cloak':
    'Surround yourself with water.\nMark fatigue, hold 3. Spend 1-for-1: cut an attack’s harm by 1; be Favored next exchange with waterbending; or throw water to affect the scene. Mark 1-fatigue/exchange to keep.',
  'waterbending|Water Whip':
    "Lash a target with a tendril of water.\nMark fatigue; inflict a condition or 2-fatigue (target's choice).",
  "waterbending|Arms of Ocean's Reach":
    'Form long water tendrils to extend your reach.\nMark 1-fatigue, become Prepared; foes pay +1-fatigue to disengage. May lose Prepared to ignore another tendril technique’s cost and add 1-fatigue.',
  'waterbending|Douse Flame':
    'Wash a wave of water over your foes.\nMark 1-fatigue; all non-waterbenders become Impaired. Firebenders must spend 2-fatigue to dry off before clearing it.',
  'waterbending|Fist of the Seas':
    'Send a towering wave from a nearby body of water.\nRequires a large water source. Mark 3-fatigue; every foe in reach marks a condition, 2-fatigue, and Stunned.',
  'waterbending|Human Puppet':
    "Bloodbend to control your opponent.\nMust be Empowered. Mark 2-fatigue; they're Stunned, Impaired, Trapped. Hold 3 qi; spend 1 to force a basic technique. First 3 uses: mark a condition.",
  'waterbending|Ice Claws':
    'Form sharp claws of ice on your fingers.\nMark 1-fatigue, become Prepared; while Prepared, close-range attacks inflict +2-fatigue. Lose the claws, lose Prepared.',
  'waterbending|Ice Grab':
    "Freeze a foe's limb and fling them.\nMark 1-fatigue; they become Impaired and mark a condition to resist, or are thrown. Into a wall/others: 1-fatigue on impact (and those struck).",
  'waterbending|Ice Slide':
    'Form an ice slide to redirect foes.\nMark 1-fatigue; foes engaged who chose A&A or D&M can be repositioned (engage/disengage). They mark a condition or 2-fatigue to resist.',
  'waterbending|Ice Snare':
    "Ready to freeze a foe's limb mid-action.\nGain 1 reaction. Mark fatigue and spend it to interrupt a technique: they're Impaired and mark 2-fatigue, or it fails. Lose reactions at exchange end.",
  'waterbending|Octopus Form':
    "Surround yourself with eight water tendrils.\nMark 2-fatigue; once/exchange use Strike on an engaged foe. Mark 1-fatigue/exchange to maintain. You're Impaired unless Mastered.",
  'waterbending|Quiet Grip of Ice':
    "Grip a foe's foot in a quiet icy hold.\nMark 1-fatigue; they're Impaired, and if you A&A next exchange your attacks inflict +1-fatigue on them.",
  'waterbending|Razor Rings':
    'Roll razor-sharp water rings at a nearby foe.\nRequires a large water source. Mark 1-fatigue; the foe marks 2-fatigue and Impaired dodging, or you cut/destroy their items.',
  'waterbending|Rings of Water':
    'Surround yourself with 1-3 flowing water rings.\nMark 2/3/4-fatigue: Favored; +Prepared; +Empowered while a ring remains. Spend rings to cut a water cost by 1 each, or add 2-fatigue per ring to a water attack.',
  'waterbending|Rising Geyser':
    'Ride up on a pillar of water.\nMark 2-fatigue; Favored and Empowered atop it. Lasts until destroyed or you use the water; using a water technique cuts its cost by 1.',
  'waterbending|Spike Drill Drive':
    "Corkscrew down feet-first on an icy spike.\nMark 3-fatigue; foes near the landing mark 2-fatigue and are thrown back. If there's space below, you drop into it, engaging/disengaging as fits.",
  'waterbending|Sudden Phase Change':
    'Shift water between solid, liquid, and vapor.\nSolid: mark 1-fatigue, ice traps/impairs. Liquid: become Favored (water supply). Vapor: mark 1-fatigue, Impair all sight-reliant in the fog (incl. you).',
  'waterbending|Surf the Wave':
    'Ride a giant wave to wash away foes.\nMark 2-fatigue, Favored, move to a new location; engaged foes and those in its path mark 1-fatigue and Impaired (+1-fatigue to stay engaged).',
  'waterbending|Sweat It Out':
    'In a pinch, fuel bending with your own sweat.\nMust have a negative status and a condition. Mark 1-3 fatigue to throw sweat blades for 2-4 fatigue; then become Favored.',
  'waterbending|Water Jab':
    'Enhance a punch with a stream of water.\nMark 1-fatigue; inflict 3-fatigue. The foe may become Impaired to reduce it by 2.',
  'waterbending|Water Knife':
    'Cut with a fast swoop of water.\nMark 1-fatigue; vs a person, inflict a condition and Impaired; vs the environment, become Prepared and treat as Smash.',
  'waterbending|Water Sphere Shield':
    'Surround yourself with a deflecting water sphere.\nMark 1-3 fatigue, hold 1 qi each; spend to block the next 2-fatigue, a condition, or a negative status. Empowered while holding qi.',
  // Universal
  'universal|Attack Weakness':
    'Strike an injured enemy at a weak point.\nMark fatigue; target an engaged, Impaired foe in reach: they mark fatigue equal to their conditions.',
  'universal|Charge':
    'Rush an unengaged enemy and strike full force.\nMark fatigue, close and engage; inflict a condition or 2-fatigue (their choice). Become Favored next exchange.',
  'universal|Duck and Twist':
    'Use speed to dodge the worst of the harm.\nMark fatigue; clear one condition and become Favored.',
  'universal|Forceful Blow':
    'Send an enemy flying with a mighty swing.\nMark fatigue; inflict 2-fatigue or a condition, then push them to a new position unless they mark 2-fatigue.',
  'universal|Furious Assault':
    'An unbalanced strike fueled by passion.\nBecome Impaired, shift balance from center; inflict conditions equal to your Passion (NPCs: their balance). Clear Impaired only at center.',
  'universal|Pounce':
    'Press the advantage on an off-balance foe.\nMark fatigue; inflict Impaired, or Stunned on an Impaired foe, or 5-fatigue on a Stunned foe.',
  'universal|Protect':
    'Shield an ally within reach.\nMark fatigue; intercept an attack on them this exchange. If none comes, you both become Inspired.',
  'universal|Rapid Assessment':
    'Take in the situation in a flash.\nAsk one question; become Prepared to act on it, and may make an ally Prepared too.',
  'universal|Seek Vulnerabilities':
    'Study a foe for weak points.\nNext time you inflict a condition/fatigue on them, also shift their balance. If you know their principle, mark fatigue to shift it again.',
  'universal|Sense Environment':
    'Look for ways to reshape your surroundings.\nNext A&A or D&M, also use Smash or Ready for free (even on a miss).',
  'universal|Stand Strong':
    'Brace for incoming blows.\nBecome Prepared; automatically block or avoid any negative statuses this exchange.',
  'universal|Suck It Up':
    'Absorb a blow and ready to act after.\nFor each attack inflicting fatigue/conditions/balance shifts this exchange, choose one extra technique next exchange (even on a miss).',
  'universal|Take Cover':
    'Maneuver into cover.\nThe first attack on you this exchange hits your cover instead, leaving you unharmed.',
  // Group
  'group|Attend to Commands':
    'A leader organizes the group.\nClear Impaired, become Inspired, and inflict +1-fatigue on all attacks next exchange.',
  'group|Coordination':
    'Set up a coordinated group attack.\nBecome Prepared and Favored; clear 2-fatigue or a condition (plus the usual 1).',
  'group|Draw Foe':
    'Bait a foe into overextending.\nTarget an engaged foe who chose A&A: they mark 1-fatigue, become Impaired, and are moved from allies.',
  'group|Engulf':
    "Surge forward and engulf a target.\nThe target is Impaired and can't escape or disengage; the group uses Strike on each Impaired foe in reach.",
  'group|Focused Fire':
    'Pour all attacks onto one target.\nMark fatigue; inflict 2-fatigue and a condition. If Prepared, +2-fatigue and another condition.',
  'group|Overwhelm':
    'Strike every combatant in reach.\nAll foes engaged with the group mark 2-fatigue or a condition (their choice).',
  'group|Scatter and Regroup':
    'Split apart and reform nearby.\nClear one condition; disengage from all foes, then re-engage whom you choose (those foes are Impaired).',
  'group|Shield Wall':
    'Form a barricade.\nBecome Favored; ignore the first 2-fatigue and a condition this exchange. Next exchange, movement past the wall is blocked.',
  'group|Spread Out':
    'Spread out to cover ground.\nNo single attack inflicts more than 1-fatigue, a condition, or one balance shift; engage foes in wide reach and hold them free.',
  'group|Surround':
    'Close around one foe.\nEach extra attack on that foe inflicts +1-fatigue; each attack the foe makes costs them 1-fatigue.',
  'group|Swarm':
    'Throw the group recklessly onto a foe.\nMark fatigue; inflict 2-fatigue. May be chosen repeatedly, +1-fatigue each time after the first.',
  'group|Test Defenses':
    'Probe a foe’s defenses.\nBecome Prepared, Favored, Inspired, and learn their principle; that foe may immediately Strike the group.',
  'group|Protect Objective':
    "Surround and guard a person, place, or object.\nMark 2-fatigue, become Prepared; foes are pushed off and engaged with the group. None can reach the target until you're scattered or lose Prepared.",
  // Earthbending
  'earthbending|Detect the Heavy Step':
    'Sense an enemy’s move via seismic sense.\nBecome Prepared; lose it and mark fatigue to interrupt a technique: they mark +3-fatigue or it is canceled.',
  'earthbending|Dust Stepping':
    'Step skyward on pillars of dust and stone.\nAdvance higher, become Favored and Prepared. Engaged foes may mark 2-fatigue to block.',
  'earthbending|Earth Armor':
    'Encase yourself in earth or crystal armor.\nHold 3; spend 1 to negate a condition or 2-fatigue (must spend on incoming harm). Favored while you have hold.',
  'earthbending|Earth Gauntlet':
    'Wrap your fist in rock and strike.\nMark fatigue; inflict a condition or 2-fatigue. May also knock the foe out of reach (they mark +1-fatigue to resist).',
  'earthbending|Earth Launch':
    'Hurl yourself skyward.\nMark 1-fatigue, become Favored; disengage from foes who can’t reach you, but you land back among them at exchange end.',
  'earthbending|Earth Sinking':
    'Sink a foe into the earth.\nMark 2-fatigue; a foe standing on the ground becomes Trapped.',
  'earthbending|Eat Dirt':
    "Trip a foe with a stray pebble.\nThe target is Impaired and can't choose D&M next exchange.",
  'earthbending|Ground Shift':
    'Twist the ground to unbalance foes.\nTarget a foe or an area (mark 1-fatigue for an area); affected foes are Impaired, or Stunned if already Impaired.',
  'earthbending|Lava Star':
    'Spin a floating star of lava.\nMark fatigue, become Favored while active; each attack with it also Smashes scenery for free. Mark fatigue/exchange to maintain.',
  'earthbending|Metal Bindings':
    "Bind a foe's limbs in metal.\nThey're Impaired until they metalbend or the fight ends; you're Favored while engaged with them.",
  'earthbending|Rock Column':
    'Pin a foe with a column of earth.\nInflict Impaired; Trapped if already Impaired; Doomed if already Trapped.',
  'earthbending|Stone Shield':
    'Raise a stone shield for you or an ally.\nMark 1-fatigue; protected ones are Impaired; it blocks the first attack each exchange. Reuse the stone for a -1-fatigue earth technique.',
  'earthbending|Pack Earth':
    'Pack stone into a super-hard ball.\nMark 1-fatigue; use Strike with it next exchange.',
  'earthbending|Quicksand':
    'Turn an area to quicksand.\nFoes there are Impaired; if not freed, Trapped next exchange, then Doomed the one after.',
  'earthbending|Rapid Tunneling':
    "Dive into the earth.\nBecome Empowered; use no other techniques, but can't be targeted except by earthbending. Emerge in reach next exchange, then lose Empowered.",
  'earthbending|Slice Stone':
    'Cleave a stone or structure in two.\nMark 1-fatigue, clear the obstacle, become Prepared to lift the chunk. May drop it on foes in reach for 2-fatigue.',
  'earthbending|Subtle Misdirection':
    "Bend the ground to misdirect a foe's attack.\nMark 2-fatigue; target a foe who attacked/advanced and choose the target of their first attack this exchange.",
  'earthbending|Thick Mud':
    'Turn nearby earth to sticky mud.\nFoes engaged and acting against you are stuck and Impaired; use Strike on each next exchange regardless of approach.',
  // Martial
  'martial|Aerial Kick':
    'Launch into a vertical bicycle kick.\nMark 1-fatigue; hit two foes or one group. Foes mark 2-fatigue or a condition each; a group marks 4-fatigue or two conditions.',
  'martial|Bludgeon':
    'Subdue a foe with rapid blows.\nMark 1-fatigue; shift their balance from center (Stunned if +2 or higher). Mark +1-fatigue to move them.',
  'martial|Counterstrike':
    "Read your foe and strike with blinding speed.\nStrike (as if 1-fatigue) an engaged foe who chose A&A. Can't use with any negative status.",
  'martial|Dire Strike':
    'Throw a two-handed punch with full force.\nMark 2-fatigue; inflict 4-fatigue, a condition, and Impaired. +1-fatigue to disarm a weapon.',
  'martial|Disarm':
    "Limit a foe's fighting style.\nMark 2-fatigue; name an A&A technique they have—they can't use it for the rest of the encounter.",
  'martial|Double Leg Kickout':
    'Kick off a foe with both feet.\nMark 1-fatigue; you and the foe roll 2d6. Beat them: they’re Stunned and Impaired (knocked down).',
  'martial|Draw Close':
    'Dash in close to an opponent.\nMark 1-fatigue, become Favored; if they A&A next exchange, each technique costs them 1-fatigue.',
  'martial|Feint':
    'Bait foes into overextending.\nIf any attacked you this exchange, mark 1-fatigue to inflict a condition on each.',
  'martial|Flying Tiger-Squirrel':
    'Leap through the air to dodge and reposition.\nBecome Prepared.',
  'martial|Flowing Stance':
    'Take a stance to flow between motions.\nMark 2-fatigue, become Prepared; while Prepared, use one extra martial technique each exchange (on A&A or D&M).',
  'martial|Hook Foe':
    "Hook a foe's limb and pull them down.\nMark 2-fatigue; they're Stunned and fall unless they mark 3-fatigue to keep their feet.",
  'martial|Hurl Weapon':
    'Throw a weapon not meant for throwing.\nYou lose it and are Impaired until retrieved; inflict 2-fatigue and a condition.',
  'martial|Improvise Weapon':
    "Arm yourself with whatever's at hand.\nMark 1-fatigue, become Favored; when it next harms, it breaks and inflicts +2-fatigue.",
  'martial|Mirror Block':
    "Ready to mirror an opponent's attack.\nMark 1-fatigue, become Prepared; lose it to fully cancel their attack and inflict Impaired.",
  'martial|Monologue': 'Brag about yourself mid-fight.\nClear 1-fatigue and become Inspired.',
  'martial|Oh How the Turns Table':
    "Strike to spoil a foe's advantage.\nMark 1-fatigue; knock them to a worse spot for 1-fatigue (+1 more if they were Favored/Prepared). They lose those statuses; can't be canceled.",
  'martial|One Inch Punch':
    'Break out of a prison with a focused blow.\nWhile Trapped, mark 2-fatigue to break free: still Impaired but Favored. Twice per rest.',
  'martial|Parry':
    'Stop an attack before it lands.\nVs a foe who used A&A, mark fatigue 1-for-1 to cancel an attack after they pay its cost.',
  'martial|Qi Blocking Jabs':
    'Pinpoint strikes to block a foe’s qi.\nMark 1-fatigue; inflict a condition and disable a limb (blocks bending there). They choose 1 fewer technique/exchange until combat ends or 3 exchanges.',
  'martial|Recoiling Jet':
    'Blast yourself away from danger.\nMark 1-fatigue, become Favored, and clear Trapped, Impaired, and Doomed as applicable.',
  'martial|Seek the Deepest Calm':
    'Quiet your emotions and focus.\nUse only if no conditions were inflicted on you this exchange. Clear non-physical negative statuses or be Inspired; clear two conditions. Once per combat.',
  'martial|Switch It Up':
    'Change your style to wrong-foot a foe.\nMark 1-fatigue, become Prepared; force an engaged foe to reveal their next approach before you choose.',
  'martial|Take the High Ground':
    'Move to high ground above your foe.\nMark 1-fatigue, become Favored, and ignore harm and negative statuses from their attacks this exchange.',
  'martial|Taunt':
    'Goad a foe into a mistake.\nThey mark fatigue equal to their top principle to ignore you, or agree to A&A and target you. If they give in, you become Prepared.',
  'martial|The Way of Jasmine':
    "Sweeping blows to control a foe's options.\nMark 1-fatigue to use Pressure choosing 2 approaches. Can't also use Pressure alone this exchange.",
  'martial|This Is My Hand Now':
    "Catch and twist a foe's striking hand.\nTheir attack fails; mark 1-fatigue and they're Impaired.",
  // Firebending
  'firebending|A Single Spark':
    'Pour your emotions into the flames.\nMark 1-fatigue, hold 1 per marked condition. Spend 1-for-1 to pay technique costs, inflict Doomed with firebending, or use Seize a Position regardless of approach.',
  'firebending|Arc Lightning':
    'Channel lightning into a close foe.\nMark 1-fatigue; inflict a condition on an engaged foe who A&A’d you. If they have 2+ conditions, also Stunned.',
  'firebending|Breath of Fire':
    'Breathe a massive gout of fire.\nMark fatigue; set surroundings alight. Foes in reach retreat Impaired, or mark 2-fatigue and become Doomed (catch fire).',
  'firebending|Explosive Blast':
    'Fire a beam that explodes on impact.\nFoe dives for cover (2-fatigue, Impaired; impossible if already Impaired) or takes the blow (4-fatigue).',
  'firebending|Fire Blade':
    'Slash with a blade of flame.\nMark 1-fatigue; cut the surroundings and inflict 2-fatigue and Impaired on a foe.',
  'firebending|Fire Pinwheel':
    'Throw a spinning disc of flame.\nMark 1-fatigue; the foe marks 2 conditions, or marks 1-fatigue to dodge and let it set everything around them ablaze.',
  'firebending|Fire Stream':
    'Pour fire onto a target.\nMark fatigue: Impaired. 3-fatigue: Doomed + Impaired. 5-fatigue: Trapped + Doomed + Impaired.',
  'firebending|Fire Whip':
    "Lash out with fire from a distance.\nInflict 2-fatigue or a condition (target's choice); foes must mark fatigue to close on you this exchange.",
  'firebending|Flame Knives':
    'Conjure floating flames.\nMark up to 3-fatigue, hold that many flames (lose 1/exchange). When you harm a foe, +1-fatigue per flame.',
  'firebending|Jet Stepping':
    'Ride jets of fire to higher ground.\nAdvance higher, become Favored and Prepared. Engaged foes may mark 2-fatigue to block.',
  'firebending|Lightning Blast':
    'Hurl a bolt of lightning.\nMark up to 3-fatigue; the target marks 2-fatigue for each.',
  'firebending|Spiral Flare Kick':
    'Spin skyward on jets of flame, legs lashing.\nMark 1-fatigue; hit two foes or one group. Foes mark 2-fatigue or a condition each; a group marks 4-fatigue or two conditions.',
  'firebending|Wall of Fiery Breath':
    'Breathe a wall of flame as you retreat.\nMark a condition, move to a new position; foes keep their distance and disengage, or push through for 4-fatigue.',
  // Airbending
  'airbending|Air Cushion':
    'Soften an ally’s blow and lift them up.\nMark fatigue; clear 2-fatigue, a condition, or any one status from an ally in reach struck this exchange.',
  'airbending|Air Scooter':
    "Ride a ball of air.\nWhile riding, you're Favored. Sacrifice it to avoid marking fatigue or conditions from an attack.",
  'airbending|Air Swipe':
    'Ready an arc of pressurized air.\nIf attacked, mark fatigue to block/divert the strike. If unattacked by exchange end, inflict 2-fatigue on up to three foes.',
  'airbending|Breath of Wind':
    'Exhale a mighty blast of air.\nKnock down a single target, inflicting Stunned unless they mark 4-fatigue.',
  'airbending|Cannonball':
    'Crash into a foe on a gust of wind.\nMark 1-fatigue; engage an unengaged foe (disengaging others) and inflict a condition.',
  'airbending|Cushion the Forceful Fist':
    'Wrap yourself in cushioning air.\nMark 2-fatigue, become Favored; immune to hard physical attacks until the end of next exchange.',
  'airbending|Directed Funnel':
    'Spin a funnel that fires objects.\nMark fatigue; each ally in reach may mark 1-fatigue to toss in an object, inflicting 2-fatigue on a target per ally.',
  'airbending|Reed in the Wind':
    "Flow to match a foe's movements.\nMark 2-fatigue, secretly name their next approach. Wrong: shift your approach. Right: become Favored and they can't target you.",
  'airbending|Shockwave':
    'Slam down a burst of pressurized air.\nMark 2-fatigue; everyone nearby (incl. allies) is thrown back, disengaged and Stunned unless they mark 4-fatigue.',
  'airbending|Small Vortex':
    'Spin one enemy up on a vortex.\nMark 3-fatigue; the target becomes Impaired and Stunned.',
  'airbending|Suction':
    'Snatch a small object with a sucking wind.\nIt flies to your hand unless someone marks 2-fatigue to hold or block it.',
  'airbending|Twisting Wind':
    'Flow around blows like the wind.\nFor each engaged foe who chose A&A, clear 1-fatigue and hold 1 momentum. Spend momentum instead of fatigue if you A&A next exchange.',
  'airbending|Wind Run':
    'Race off at high speed seeking escape.\nMark 1-fatigue; slip to an escape point, disengaging. If no one re-engages or blocks you by exchange end, you escape the scene.',
  // Weapons
  'weapons|Bludgeon':
    'Subdue a foe with a blunt weapon.\nMark 1-fatigue; shift their balance from center (Stunned if +2 or higher). Mark +1-fatigue to move them.',
  'weapons|Boom!':
    'Lob a prepared explosive into the foes.\nMark 2-fatigue or clear Prepared; everyone in range (incl. allies) marks 3-fatigue to dive away, or a condition and Stunned.',
  'weapons|Chart a Course':
    "Plan a perfect path of action.\nSecretly note an approach and up to two techniques. If used next exchange, they cost no fatigue and can't be canceled. Foes may mark fatigue to peek.",
  'weapons|Counterstrike':
    "Read your foe and strike with blinding speed.\nStrike (as if 1-fatigue) an engaged foe who chose A&A. Can't use with any negative status.",
  'weapons|Disarm':
    "Limit a foe's fighting style.\nMark 2-fatigue; name an A&A technique they have—they can't use it for the rest of the encounter.",
  'weapons|Feint':
    'Bait foes into overextending.\nIf any attacked you this exchange, mark fatigue to inflict a condition on each attacker.',
  'weapons|Parry':
    'Stop an attack before it lands.\nVs a foe who used A&A, mark fatigue 1-for-1 to cancel an attack after they pay its cost.',
  'weapons|Pin a Fly to a Tree':
    'Pin a foe in place with precise arrows.\nMark 1-fatigue for Impaired, or 3-fatigue for Impaired and Trapped.',
  'weapons|Pinpoint Thrust':
    'Thrust precisely at your target.\nMark 1-fatigue; inflict 2-fatigue and Impaired. +1-fatigue to reposition (engaged foes mark 1-fatigue to block).',
  'weapons|Switch It Up':
    'Change your style to wrong-foot a foe.\nMark 1-fatigue, become Prepared; force an engaged foe to reveal their next approach before you choose.',
  'weapons|Take the High Ground':
    'Move to high ground above your foe.\nMark 1-fatigue, become Favored, and ignore harm and negative statuses from their attacks this exchange.',
  'weapons|Turn the Tables':
    "Strike to spoil a foe's advantage.\nMark 1-fatigue; knock them to a worse spot for 1-fatigue. If they were Favored/Prepared: no cost, +1-fatigue, they lose those statuses. Can't be canceled.",
  // Technology
  'technology|Better, Faster, Stronger':
    'Push your gear to move fast and charge up.\nMark 1-fatigue to use Seize a Position unblockably. +1-fatigue for Empowered (while holding position) or to make an unsafe area safe.',
  'technology|Blinded By Science':
    'Dazzle a foe with gadgets.\nMark up to 3-fatigue: 1 = 1-fatigue and Impaired; 2 = also Trapped or Stunned; 3 = both Trapped and Stunned.',
  'technology|Collect Material':
    'Scrounge useful bits from the area.\nTake 3 gears, become Prepared. Spend gears 1-for-1 instead of fatigue on technology or basic techniques.',
  'technology|Entangler':
    "Entangle a foe with a device.\nMark 1-fatigue; they're Trapped, breaking free after two full exchanges.",
  'technology|Full-Power Attack':
    "Unleash your equipment's full charge.\nBecome Impaired; inflict 2-fatigue. Spend gears 1-for-1 for +1-fatigue (3+ gears: +2). No more gears this scene.",
  'technology|Jolt':
    'Fire a disruptive jolt at a target.\nMark 1-fatigue. Person: shift their balance (Stunned if a tech user or metal-clad). Object: slowed or shut down.',
  'technology|Jury Rig':
    'Cobble together a new device.\nBecome Favored, hold 1 gear, name a basic technique; spend 1 gear to use it in your approach. Else spend gears 1-for-1 on tech/basic techniques.',
  'technology|Pinpoint Flaws':
    'Spot weak points in your environment.\nName a status to inflict next exchange; the GM says what to break. Next exchange, use Smash free regardless of approach.',
  'technology|Plant Trap':
    'Set a snare or triggered explosive.\nMark 1-fatigue; the next enemy entering the area marks a condition and shifts balance from center.',
  'technology|Rebuild':
    'Tune and repair your equipment on the fly.\nMark 1-fatigue, clear a condition, gain 3 gears. Spend gears 1-for-1 instead of fatigue on tech/basic techniques.',
  'technology|Smoke Bomb':
    'Throw smoke to cover your escape.\nMark 1-fatigue; Impair engaged foes and escape at exchange end. Unimpaired engaged foes may mark 1-fatigue to block you.',
  'technology|Wind Up':
    'Wind up a device to build charge.\nGain 1 gear, become Favored; mark up to 2-fatigue, holding 2 extra gears each. Spend gears 1-for-1 instead of fatigue on tech/basic techniques.',
};

const avatarLegendsBuiltInTechniques = avatarLegendsBuiltInTechniquesWithoutFatigue
  .map((technique) => ({
    ...technique,
    summary:
      AVATAR_LEGENDS_TECHNIQUE_SUMMARIES[`${technique.type}|${technique.name}`] ??
      technique.summary,
  }))
  .map(withTechniqueFatigue);

async function upsertGameSystem(ctx: MutationCtx, document: unknown) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) return null;
  const id = (document as { id?: unknown }).id;
  if (typeof id !== 'string' || id.trim().length === 0) return null;

  const existing = await ctx.db
    .query('gameSystems')
    .withIndex('by_systemId', (q) => q.eq('id', id))
    .unique();

  const nextDocument = {
    ...(document as Record<string, unknown>),
    id,
    updatedAt: Date.now(),
    createdAt:
      existing && typeof (existing as { createdAt?: unknown }).createdAt === 'number'
        ? (existing as { createdAt?: number }).createdAt
        : Date.now(),
  };

  if (existing) {
    await ctx.db.replace(existing._id, nextDocument);
    return { id, action: 'updated' };
  }

  await ctx.db.insert('gameSystems', nextDocument);
  return { id, action: 'inserted' };
}

export const seedDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = [];

    results.push(
      await upsertGameSystem(ctx, {
        id: FABULA_ULTIMA_GAME_SYSTEM,
        name: 'Fabula Ultima',
      }),
    );
    results.push(
      await upsertGameSystem(ctx, {
        id: AVATAR_LEGENDS_GAME_SYSTEM,
        name: 'Avatar Legends',
        techniques: avatarLegendsBuiltInTechniques,
      }),
    );

    return results.filter(Boolean);
  },
});

export const migrateAvatarLegendsTechniqueFatigue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const gameSystem = await ctx.db
      .query('gameSystems')
      .withIndex('by_systemId', (q) => q.eq('id', AVATAR_LEGENDS_GAME_SYSTEM))
      .unique();
    let gameSystemUpdated = false;
    if (gameSystem) {
      const techniques = Array.isArray(gameSystem.techniques)
        ? gameSystem.techniques
            .filter(
              (technique): technique is Record<string, unknown> =>
                Boolean(technique) && typeof technique === 'object' && !Array.isArray(technique),
            )
            .map(withTechniqueFatigue)
        : avatarLegendsBuiltInTechniques;
      await ctx.db.patch(gameSystem._id, { techniques, updatedAt: Date.now() });
      gameSystemUpdated = true;
    }

    const classes = await ctx.db
      .query('classes')
      .withIndex('by_classMetaGameSystem', (q) =>
        q.eq('class.meta.gameSystem', AVATAR_LEGENDS_GAME_SYSTEM),
      )
      .collect();
    let classesUpdated = 0;
    for (const classDoc of classes) {
      if (!classDoc.class || typeof classDoc.class !== 'object') continue;
      const classInfo = classDoc.class as Record<string, unknown>;
      if (
        !classInfo.advancedTechnique ||
        typeof classInfo.advancedTechnique !== 'object' ||
        Array.isArray(classInfo.advancedTechnique)
      ) {
        continue;
      }
      const advancedTechnique = classInfo.advancedTechnique as Record<string, unknown>;
      const normalizedTechnique = {
        ...advancedTechnique,
        fatigue: deriveTechniqueFatigue(
          typeof advancedTechnique.description === 'string'
            ? advancedTechnique.description
            : typeof advancedTechnique.text === 'string'
              ? advancedTechnique.text
              : '',
          typeof advancedTechnique.approach === 'string' ? advancedTechnique.approach : '',
        ),
      };
      await ctx.db.patch(classDoc._id, {
        class: { ...classInfo, advancedTechnique: normalizedTechnique },
      });
      classesUpdated += 1;
    }

    return { gameSystemUpdated, classesScanned: classes.length, classesUpdated };
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('gameSystems')
      .withIndex('by_systemId', (q) => q.eq('id', args.id))
      .unique();
  },
});
