import { v } from 'convex/values';

import type { MutationCtx } from './_generated/server';
import { internalMutation, query } from './_generated/server';

const FABULA_ULTIMA_GAME_SYSTEM = 'fabula-ultima';
const AVATAR_LEGENDS_GAME_SYSTEM = 'avatar-legends';

function technique(
  type: string,
  approach: string,
  name: string,
  description: string,
  options: { rare?: boolean; tags?: string[] } = {},
) {
  return {
    type,
    approach,
    name,
    summary: description,
    description,
    ...options,
  };
}

const avatarLegendsBuiltInTechniques = [
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
      'Use bloodbending to move and twist a foe’s body in painful ways. You must be Empowered to use this technique. Inflict a condition on your foe. If they are already Impaired, Trapped, or Doomed, inflict an additional condition. If this is your first, second, or third time ever using this technique, mark a condition.',
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
      'Throw a tendril of water that wraps around a foe’s limb and holds it in place. Mark fatigue and inflict Impaired on a foe; mark an additional 2-fatigue to inflict Trapped on that foe with a second tendril. If the foe is already Impaired, you only need to pay 2-fatigue for Trapped.',
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
      'Lash out with a tendril of water. Mark fatigue to inflict a condition or 2-fatigue, target’s choice.',
  },
  {
    type: 'universal',
    approach: 'Advance & Attack',
    name: 'Attack Weakness',
    summary: 'Strike an injured enemy at a weak point.',
    description:
      'Strike an enemy at a weak point where they’ve already been injured. Mark fatigue to target an engaged, Impaired enemy in reach; they suffer fatigue equal to however many conditions they already have marked.',
  },
  {
    type: 'universal',
    approach: 'Advance & Attack',
    name: 'Charge',
    summary: 'Close distance and strike an unengaged enemy at full force.',
    description:
      'Advance straight at an enemy to strike them full force. Mark fatigue to close the distance and engage with an enemy you aren’t currently engaged with, inflicting one condition or 2-fatigue, their choice. Become Favored for next exchange.',
  },
  {
    type: 'universal',
    approach: 'Evade & Observe',
    name: 'Duck and Twist',
    summary: 'Use fast movement to avoid the worst of harm.',
    description:
      'Rely on your fast movement to help keep you out of the worst of harm’s way. Mark fatigue to clear one condition and become Favored.',
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
      'The group slowly probes the defenses of a foe, one or two members attacking individually to determine the foe’s abilities. The group becomes Prepared, Favored, Inspired, and learns the balance principle of its target; the chosen foe may immediately use Strike on the group in turn.',
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
    'Throw yourself into the air with a massive burst of force. Mark 1-fatigue and become Favored. You disengage with all foes who can’t reach you high in the air for the rest of this exchange, but you come right back down into their midst at the end of this exchange.',
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
    'Catch an enemy’s limbs in metal you control. They become Impaired and cannot remove the status unless they are able to metalbend or the fight ends. While they are Impaired and you are engaged with them, you are Favored.',
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
    'Evade & Observe',
    'Thick Mud',
    'Transform the earth and stone around you into sticky, sucking mud. Any foes engaged with and acting against you in this exchange become stuck and Impaired; you may use Strike against each stuck foe in the next exchange, regardless of your chosen approach and in addition to your normal techniques.',
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
    'Swipe your surroundings with a blade of flame. Mark 1-fatigue to slice through a piece of your surroundings and destabilize your foe’s footing, inflicting 2-fatigue and Impaired on them.',
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
    'Lash out from a distance. Inflict 2-fatigue or a condition, target’s choice, and enemies must mark fatigue to get close enough to attack you this exchange.',
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
    'Rush forward with the might of the wind behind you and crash into a foe. Mark 1-fatigue to target a foe you aren’t currently engaged with and rush at them. You become engaged with them, disengaging with other current foes, and inflict a condition on them.',
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
    'Snatch a small object off the ground or from a foe’s hand with a sucking wind. The object snaps to your hand unless someone marks 2-fatigue to hold it or block its movement.',
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
    'Race at high speeds, dodging attacks and seeking escape. Mark 1-fatigue to slip to a particular point of escape, disengaging with foes; you don’t engage any new foes. If no one re-engages with you or blocks your retreat by the end of the exchange, you escape the scene.',
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
    'Throw a small prepared explosive into the midst of your foes. Mark 2-fatigue or clear Prepared to toss the explosive into your enemies’ midst. Everyone in range, including allies in the area, must either mark 3-fatigue to dive away, or mark a condition and become Stunned, their choice.',
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
    'Using impeccable timing, read your foe’s movement and lash out with blinding speed. Execute a Strike as if you had marked 1-fatigue against an engaged foe who chose advance and attack as their approach. You cannot use this technique if you have any negative statuses.',
  ),
  technique(
    'weapons',
    'Defend & Maneuver',
    'Disarm',
    'Target your foe’s ability to fight by breaking, removing, or limiting a particular style. Mark 2-fatigue to name any advanced advance and attack technique your foe has; they are unable to use that technique for the remainder of this encounter.',
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
    'Stop a foe’s attack before it connects. Choose a foe who used advance and attack this exchange; during advance and attack, mark fatigue 1-for-1 to cancel an attack they use against you after they pay the costs.',
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
    'Make careful strikes to undermine your foe’s advantageous position. Mark 1-fatigue to knock your foe from their position to a new, disadvantageous location, inflicting 1-fatigue. If your foe was Favored or Prepared at the start of the exchange, you do not mark fatigue, you inflict an additional 1-fatigue, and they lose all appropriate positive statuses. These costs and consequences cannot be canceled or avoided by another technique.',
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

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('gameSystems')
      .withIndex('by_systemId', (q) => q.eq('id', args.id))
      .unique();
  },
});
