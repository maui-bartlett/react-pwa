type FabulaUltimaSkill = {
  id: string;
  name: string;
  maxLevel?: number;
  summary: string;
  description: string;
  type: 'skill';
  source: string;
  sourceType: string;
};

type FabulaUltimaSpell = {
  id: string;
  name: string;
  school: string;
  mpCost: string;
  target: string;
  duration: 'Instantaneous' | 'Scene';
  offensive: boolean;
  summary: string;
  description: string;
  effect: string;
  type: 'spell';
  source: string;
  sourceType: string;
};

type FabulaUltimaClass = {
  id: string;
  name: string;
  type: 'class';
  source: string;
  sourceType: string;
  summary: string;
  description: string;
  freeBenefits: string[];
  skills: string[];
  skillsExpanded: FabulaUltimaSkill[];
  spells?: string[];
  spellsExpanded?: FabulaUltimaSpell[];
  meta: { gameSystem: 'fabula-ultima' };
};

const GAME_SYSTEM = 'fabula-ultima';
const OFFICIAL_BONUS = 'official-bonus';
const OFFICIAL_ATLAS = 'official-atlas';
const COMMUNITY_ATLAS = 'community-atlas';
const HIGH_FANTASY = 'Fabula Ultima High Fantasy Atlas';
const TECHNO_FANTASY = 'Fabula Ultima Techno Fantasy Atlas';
const NATURAL_FANTASY = 'Fabula Ultima Natural Fantasy Atlas';
const LOW_FANTASY = 'Fabula Ultima Low Fantasy Atlas';
const DARK_FANTASY = 'Fabula Ultima Dark Fantasy Atlas';

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function skill(
  name: string,
  maxLevel: number | undefined,
  summary: string,
  source: string,
  sourceType: string,
  description = summary,
): FabulaUltimaSkill {
  return {
    id: slug(name),
    name,
    ...(maxLevel && maxLevel > 1 ? { maxLevel } : {}),
    summary,
    description,
    type: 'skill',
    source,
    sourceType,
  };
}

function spell(
  className: string,
  name: string,
  mpCost: string,
  target: string,
  duration: 'Instantaneous' | 'Scene',
  offensive: boolean,
  summary: string,
  source: string,
  sourceType: string,
): FabulaUltimaSpell {
  return {
    id: slug(name),
    name,
    school: className,
    mpCost,
    target,
    duration,
    offensive,
    summary,
    description: summary,
    effect: summary,
    type: 'spell',
    source,
    sourceType,
  };
}

function fabulaClass(args: {
  name: string;
  source: string;
  sourceType: string;
  summary: string;
  description?: string;
  freeBenefits?: string[];
  skills: Array<[string, number | undefined, string, string?]>;
  spells?: Array<[string, string, string, 'Instantaneous' | 'Scene', boolean, string]>;
}): FabulaUltimaClass {
  return {
    id: slug(args.name),
    name: args.name,
    type: 'class',
    source: args.source,
    sourceType: args.sourceType,
    summary: args.summary,
    description: args.description ?? args.summary,
    freeBenefits: args.freeBenefits ?? [],
    skills: args.skills.map(([name]) => name),
    skillsExpanded: args.skills.map(([name, maxLevel, summary, description]) =>
      skill(name, maxLevel, summary, args.source, args.sourceType, description),
    ),
    ...(args.spells
      ? {
          spells: args.spells.map(([name]) => name),
          spellsExpanded: args.spells.map(([name, mpCost, target, duration, offensive, summary]) =>
            spell(
              args.name,
              name,
              mpCost,
              target,
              duration,
              offensive,
              summary,
              args.source,
              args.sourceType,
            ),
          ),
        }
      : {}),
    meta: { gameSystem: GAME_SYSTEM },
  };
}

const FABULA_ULTIMA_MISSING_CLASSES: FabulaUltimaClass[] = [
  fabulaClass({
    name: 'Ace of Cards',
    source: 'Fabula Ultima Bonus: Ace of Cards',
    sourceType: OFFICIAL_BONUS,
    summary: 'Manipulates magical energy through a personalized deck of cards.',
    freeBenefits: ['Permanently increase your maximum Hit Points or Mind Points by 5.'],
    skills: [
      [
        'Double or Nothing',
        undefined,
        'Risk a check becoming a failure unless it scores a critical success, doubling the result on a critical.',
      ],
      [
        'High or Low',
        undefined,
        'Draw and discard cards whenever you generate a critical success or fumble.',
      ],
      [
        'Magic Cards',
        3,
        'Use MP during conflict to resolve sets from your hand and produce card-based magical effects.',
      ],
      ['Mulligan', 5, 'Discard and redraw cards at the end of your turn during conflict.'],
      [
        'Trap Card',
        4,
        'Declare a suit after an enemy action; matching the revealed card lets you cast a low-cost spell for free.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Chanter',
    source: HIGH_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Weaves magical songs and verses to support allies and pressure enemies.',
    freeBenefits: ['Permanently increase your maximum Mind Points by 5.'],
    skills: [
      [
        'Magichant',
        10,
        'Learn frequencies, keys, and tones used to sing magical verses during conflict.',
      ],
      [
        'Resonance',
        3,
        'After a verse affects enemies, allies deal extra damage to them or you recover MP when they suffer damage.',
      ],
      ["Siren's Song", undefined, 'Perform Ritualism rituals and create hearing-based illusions.'],
      [
        'Sound Barrier',
        5,
        'Reduce physical damage you suffer after singing a medium or high frequency verse.',
      ],
      [
        'Vibrato',
        undefined,
        'After a low or medium frequency verse, perform a free weapon attack with HR treated as 0.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Commander',
    source: HIGH_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Shapes the battlefield through tactical orders and inspiring command.',
    freeBenefits: [
      'Permanently increase your maximum Hit Points by 5.',
      'Gain the ability to equip martial melee weapons and martial ranged weapons.',
    ],
    skills: [
      [
        "Bishop's Edict",
        5,
        'Spend MP to double all MP costs or increase all damage until your next turn.',
      ],
      ['Charging Cavalry', 5, 'Spend MP to let an ally immediately perform a boosted free attack.'],
      [
        'Crushing Chariot',
        undefined,
        'After a command skill, let another PC who has not acted take their turn after yours.',
      ],
      [
        "King's Castle",
        4,
        'Spend MP to prevent recovery or increase recovery until your next turn.',
      ],
      [
        "Queen's Gambit",
        6,
        'Perform a free attack, then heal an ally or use another command skill for free.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Dancer',
    source: HIGH_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Uses precise dances to create combat, support, and elemental effects.',
    freeBenefits: ['Permanently increase your maximum Hit Points or Mind Points by 5.'],
    skills: [
      [
        'Dance',
        10,
        'Learn dances and spend MP to perform one before or after your action during conflict.',
      ],
      [
        'Follow My Lead',
        undefined,
        'Spend extra MP to share a lasting dance benefit with an affectionate ally.',
      ],
      [
        'Frenetic Footwork',
        2,
        'Gain a bonus to opposed checks based on acrobatics, coordination, or speed after a lasting dance.',
      ],
      [
        'Quick-Change',
        undefined,
        'After you perform a dance, perform the Equipment action for free.',
      ],
      [
        'Wardancer',
        5,
        'After a dance, increase damage with select weapons and offensive spells until your next turn.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Esper',
    source: TECHNO_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Connects to the Soul Network to enhance bonds, senses, and psychic power.',
    freeBenefits: ['Permanently increase your maximum Mind Points by 5.'],
    skills: [
      [
        'Cognitive Focus',
        5,
        'Designate a focus and gain SL-based bonuses to examine, attack, or heal them.',
        'At the start of your turn during a conflict, you may choose one ally who is able to hear you or one enemy you can see that is suffering from dazed, enraged, and/or shaken.\nUntil the start of your next turn, the chosen creature becomes your focus.\n\nYou gain a bonus equal to 【SL】 to Checks you perform to examine your focus, as well as to your Accuracy Checks and Magic Checks for attacks and offensive spells (r) that include your focus among the targets. When you cause your focus to recover Hit Points and/or Mind Points, they recover 【SL × 2】 additional HP and/or MP, respectively.',
      ],
      [
        'Cognitive Amplifier',
        5,
        'Improve damage or recovery when affecting creatures toward whom you have a Bond.',
      ],
      [
        'Ephemeral Bond',
        undefined,
        'Temporarily treat a creature as having a strength 1 Bond when MP is lost or recovered.',
      ],
      [
        'Navigator',
        undefined,
        'Communicate telepathically with bonded allies and use Ritualism through the Soul Network.',
      ],
      [
        'Hypercognition',
        5,
        'Reduce the MP cost of spells and verses that include your focus.',
        'The total MP cost of your spells and verses (see High Fantasy Atlas, page 138) that include your focus among their targets is reduced by 【SL】, or by 【SL × 2】 if your focus is the only target (to a minimum cost of 0 Mind Points).',
      ],
      ['Psychic Gifts', 5, 'Gain psychic gifts powered by your Brainwave Clock.'],
      ['Psychic Warrior', undefined, 'Replace one die in an Accuracy Check with Willpower.'],
    ],
  }),
  fabulaClass({
    name: 'Floralist',
    source: NATURAL_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Plants and cultivates magiseeds that blossom into scene-wide magical effects.',
    freeBenefits: ['Permanently increase your maximum Hit Points by 5.'],
    skills: [
      [
        'Battle Gardening',
        4,
        'After planting a magiseed, perform a free attack or low-cost offensive spell and help its Growth Clock.',
      ],
      ['Chloromancy', 6, 'Discover magiseeds and plant them in your garden during conflict.'],
      ['Flowery Aroma', undefined, 'Perform Ritualism rituals and create smell-based illusions.'],
      [
        'Spore Mist',
        3,
        'After a creature hits you with a melee attack, deal poison damage back to them.',
      ],
      [
        'Tree of Life',
        3,
        'Spend HP when planting a magiseed to fill sections of its Growth Clock.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Gourmet',
    source: NATURAL_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Transforms ingredients into delicacies with supernatural effects.',
    freeBenefits: [
      'Permanently increase your maximum Inventory Points by 2.',
      'You may start Projects to create unique foods and drinks.',
    ],
    skills: [
      [
        'Cooking',
        5,
        'Gain ingredients and combine them into delicacies that help allies or hamper enemies.',
      ],
      [
        'Knife and Fork',
        undefined,
        'Your Cooking-granted free attack may deal damage as normal with HR treated as 0.',
      ],
      [
        'Made with Love',
        2,
        'Spend MP to apply a delicacy chosen for an ally to additional allies.',
      ],
      [
        'Salt and Pepper',
        undefined,
        'Spend Inventory Points to change an ingredient taste while preparing a delicacy.',
      ],
      ['Traveling Cook', 3, 'Gain extra ingredients after each travel roll.'],
    ],
  }),
  fabulaClass({
    name: 'Hexer',
    source: DARK_FANTASY,
    sourceType: COMMUNITY_ATLAS,
    summary: 'Uses curses and occult spells to exploit doom, torment, and vulnerability.',
    freeBenefits: ['Permanently increase your maximum Mind Points by 5.'],
    skills: [
      [
        'Curse Magic',
        10,
        'Learn Hexer spells and use Insight plus Willpower for offensive Hexer magic.',
      ],
      [
        'Curse Ritualism',
        undefined,
        'Perform Ritualism rituals, especially those involving curses and ill fate.',
      ],
      [
        'Encroaching Hex',
        5,
        'Apply additional pressure when a curse or Hexer spell affects a vulnerable target.',
      ],
      [
        'Fell Resonance',
        3,
        'Recover resources or strengthen effects when cursed enemies suffer harm.',
      ],
      [
        'Where Evil Treads',
        undefined,
        'Sense and investigate cursed places, dark magic, and malignant presences.',
      ],
    ],
    spells: [
      [
        'Armor of Thorns',
        '10',
        'Self',
        'Scene',
        false,
        'Protect yourself with punishing thornlike magic.',
      ],
      [
        'Curse of Fragility',
        '10',
        'One creature',
        'Scene',
        true,
        'Make a foe more vulnerable to incoming harm.',
      ],
      [
        'Curse of Frailty',
        '10',
        'One creature',
        'Scene',
        true,
        'Weaken a foe through an ongoing curse.',
      ],
      [
        'Darkbolt',
        '10',
        'One creature',
        'Instantaneous',
        true,
        'Strike a foe with dark magical damage.',
      ],
      [
        'Despair',
        '10',
        'One creature',
        'Instantaneous',
        true,
        'Crush a foe with despair and mental pressure.',
      ],
      [
        'Evil Eye',
        '5',
        'One creature',
        'Scene',
        true,
        'Place a malefic gaze that disrupts the target.',
      ],
      [
        'Ghost Light',
        '5',
        'One creature',
        'Scene',
        false,
        'Conjure eerie light for misdirection or supernatural pressure.',
      ],
      [
        'Hex',
        '10',
        'One creature',
        'Scene',
        true,
        'Curse a target and set up stronger follow-up effects.',
      ],
      ['Jinx', '5', 'One creature', 'Instantaneous', true, 'Twist fortune against a target.'],
      [
        'Malison',
        '10',
        'One creature',
        'Scene',
        true,
        'Afflict a target with a persistent magical curse.',
      ],
      [
        'Siphon Luck',
        '10',
        'One creature',
        'Instantaneous',
        true,
        'Steal fortune or momentum from a target.',
      ],
      [
        'Wither',
        '10',
        'One creature',
        'Instantaneous',
        true,
        'Wither a target with harmful occult energy.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Hunter',
    source: LOW_FANTASY,
    sourceType: COMMUNITY_ATLAS,
    summary: 'Tracks prey, prepares traps, and exploits a foe once they are locked on.',
    freeBenefits: ['Permanently increase your maximum Hit Points by 5.'],
    skills: [
      ['Lock-On', undefined, 'Spend MP during conflict to mark a target as your prey.'],
      ['Set Trap', 5, 'Create traps that punish or hinder enemies who trigger them.'],
      ['Track', 5, 'Follow creatures and gather information through wilderness expertise.'],
      ['Vital Strike', undefined, 'Exploit your locked-on prey with a decisive attack.'],
      ['Wild Reflexes', 5, 'React quickly to danger and improve your defensive timing.'],
    ],
  }),
  fabulaClass({
    name: 'Illusionist',
    source: LOW_FANTASY,
    sourceType: COMMUNITY_ATLAS,
    summary: 'Creates phantasms and illusions that twist expectations and redirect harm.',
    freeBenefits: ['Permanently increase your maximum Mind Points by 5.'],
    skills: [
      [
        'Illusionist Magic',
        10,
        'Learn Illusionist spells and use Insight plus Willpower for offensive Illusionist magic.',
      ],
      ['Phantasmal Echo', 5, 'Preserve or echo a phantasmal spell effect for additional benefit.'],
      ['Phantasmal Recovery', 5, 'Recover resources through your phantasms and illusions.'],
      [
        'Phantasmal Recycling',
        undefined,
        'Reclaim value from a phantasm when it ends or is replaced.',
      ],
      [
        'Ritual Illusionism',
        undefined,
        'Perform Ritualism rituals based on phantasms, illusions, and misdirection.',
      ],
    ],
    spells: [
      [
        'Essence Sacrifice',
        '10',
        'One creature',
        'Instantaneous',
        false,
        'Trade essence or vitality for a phantasmal benefit.',
      ],
      [
        'Mirage Blitz',
        '10',
        'One creature',
        'Instantaneous',
        true,
        'Strike through a deceptive burst of illusion.',
      ],
      [
        'Multi Shatter',
        '10 × T',
        'Up to three creatures',
        'Instantaneous',
        true,
        'Shatter phantasmal force across multiple targets.',
      ],
      [
        'Nocebo Weapon',
        '10',
        'One weapon',
        'Scene',
        false,
        'Infuse a weapon with harmful expectation.',
      ],
      [
        'Placebo Energy',
        '10',
        'One creature',
        'Scene',
        false,
        'Use belief and illusion to bolster a target.',
      ],
      [
        'Spectral Light',
        '5',
        'One creature',
        'Scene',
        false,
        'Create spectral light for concealment, revelation, or misdirection.',
      ],
      [
        'Vital Sacrifice',
        '10',
        'One creature',
        'Instantaneous',
        false,
        'Transform sacrifice into urgent restoration or power.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Invoker',
    source: NATURAL_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Draws upon elemental wellsprings to perform flexible invocations.',
    freeBenefits: ['Permanently increase your maximum Hit Points or Mind Points by 5.'],
    skills: [
      [
        'Elemental Harmony',
        4,
        'Communicate with elementals and improve recovery when elementals are present.',
      ],
      ['Invocation', 3, 'Spend MP to perform invocations from wellsprings available in the scene.'],
      [
        'Linked Invocation',
        3,
        'Spend additional MP to let an invocation affect extra visible creatures.',
      ],
      ['Ripples', 3, 'Follow up after an ally damages an enemy affected by your hex invocation.'],
      [
        'Wellspring Expansion',
        5,
        'Spend MP to treat a dealt elemental damage type as a present wellspring and enhance it.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Merchant',
    source: NATURAL_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Uses trade, contacts, and wealth as adventuring tools.',
    freeBenefits: ['Permanently increase your maximum Inventory Points by 2.'],
    skills: [
      ['A La Mode', undefined, 'Gain an additional accessory slot.'],
      [
        'Expiration Date',
        5,
        'Turn HP recovery from delicacies or potions into poison damage instead.',
      ],
      [
        'Just a Humble Merchant!',
        undefined,
        'Spend a Trade Point to make an incoming attack or offensive spell miss you.',
      ],
      [
        'Sell Ash to Grenados',
        3,
        'Increase item sale prices and potentially gain Trade Points from valuable sales.',
      ],
      [
        'Winds of Trade',
        6,
        'Rest in a commerce-friendly area to gain zenit, Trade Points, and trade-based options.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Monk',
    source: LOW_FANTASY,
    sourceType: COMMUNITY_ATLAS,
    summary: 'Turns discipline, speed, and inner strength into decisive unarmed combat.',
    freeBenefits: ['Permanently increase your maximum Hit Points by 5.'],
    skills: [
      [
        'Aura of Tranquility',
        5,
        'Project calm discipline to protect or stabilize yourself and allies.',
      ],
      ['Inner Strength', 5, 'Draw on focus and training to improve your staying power.'],
      ['Mind Over Body', 5, 'Use discipline to push beyond normal bodily limits.'],
      ['Pinpoint Strike', 4, 'Target a foe precisely with an empowered unarmed strike.'],
      ['Swift Flurry', 5, 'Use speed and rhythm to improve or extend your attacks.'],
    ],
  }),
  fabulaClass({
    name: 'Mutant',
    source: TECHNO_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Uses dangerous mutations and body alterations in battle.',
    freeBenefits: ['Permanently increase your maximum Hit Points by 5.'],
    skills: [
      [
        'Akromorphosis',
        6,
        'Increase unarmed strike damage and temporarily alter their weapon category.',
      ],
      ['Biophagy', 6, 'Recover HP after causing creatures to lose HP while you are in Crisis.'],
      ['Ecdysis', undefined, 'Spend HP after typed damage to gain Resistance to that damage type.'],
      [
        'Genoclepsis',
        3,
        'After a focused melee hit, learn the target species and gain bonuses against that species.',
      ],
      [
        'Theriomorphosis',
        6,
        'Learn therioforms and spend HP to manifest up to two of them for a scene.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Necromancer',
    source: 'Fabula Ultima Bonus: Necromancer',
    sourceType: OFFICIAL_BONUS,
    summary: 'Harvests Grave Points from crisis and channels deathly soul magic.',
    freeBenefits: ['Permanently increase your maximum Hit Points or Mind Points by 5.'],
    skills: [
      [
        'Beyond the Realms of Death',
        5,
        'Gain Grave Points when nearby creatures lose HP in Crisis, and spend them to avoid falling at 0 HP.',
      ],
      [
        'Children of the Grave',
        undefined,
        'Communicate with undead and ask one truthful question of an undead each scene.',
      ],
      [
        'Fear Is the Key',
        3,
        'Gain Grave Points and recover HP/MP after damaging enemies suffering shaken or weak.',
      ],
      [
        'For Whom the Bell Tolls',
        3,
        'Spend a Grave Point to amplify a single-target damaging spell or inflict shaken.',
      ],
      [
        'Rondo of Nightmare',
        undefined,
        'Spend Grave Points to broaden a one-creature offensive spell to all visible creatures.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Pilot',
    source: TECHNO_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Bonds with a personal vehicle and configures modules for battle and travel.',
    freeBenefits: ['Permanently increase your maximum Hit Points by 5.'],
    skills: [
      [
        'Compression Tech',
        undefined,
        'Spend Inventory Points to call or dismiss your personal vehicle when space allows.',
      ],
      [
        'Flexible Configuration',
        4,
        'Spend a Fabula Point to swap active and inactive vehicle modules while driving.',
      ],
      [
        'Mounted Warrior',
        5,
        'Increase weapon damage while driving a Steed-frame personal vehicle.',
      ],
      [
        'Personal Vehicle',
        6,
        'Gain a personal vehicle and modules, with more modules as this skill increases.',
      ],
      [
        'Strong Grip',
        undefined,
        'Replace one Attribute die with Might when using a weapon module.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Slayer',
    source: DARK_FANTASY,
    sourceType: COMMUNITY_ATLAS,
    summary: 'Prepares specialized oils and tactics to bring down dangerous prey.',
    freeBenefits: ['Permanently increase your maximum Hit Points by 5.'],
    skills: [
      ['Bane Oils', 5, 'Prepare oils that exploit creature species or vulnerabilities.'],
      ['Exploit', 5, 'Capitalize on a known weakness to improve damage or pressure.'],
      [
        'Giant Killer',
        undefined,
        'Stand against larger or more powerful foes with specialized tactics.',
      ],
      ['Lockdown', 4, 'Limit a dangerous enemy and keep them from acting freely.'],
      ['Wildlife Expert', 3, 'Identify, track, and understand creatures and their habits.'],
    ],
  }),
  fabulaClass({
    name: 'Symbolist',
    source: HIGH_FANTASY,
    sourceType: OFFICIAL_ATLAS,
    summary: 'Creates magical symbols that remain on creatures until destroyed.',
    freeBenefits: ['Permanently increase your maximum Inventory Points by 2.'],
    skills: [
      [
        'Magic Symbols',
        3,
        'Allies bearing your symbols may destroy them to cast low-cost spells you know.',
      ],
      ['Mirage', undefined, 'Perform Ritualism rituals and create sight-based illusions.'],
      [
        'Personal Touch',
        5,
        'Improve damage or recovery involving a creature bearing one of your symbols.',
      ],
      [
        'Symbolic Connection',
        undefined,
        'Know the direction of creatures bearing your symbols within two travel days.',
      ],
      [
        'Symbolism',
        5,
        'Learn symbols and create them through Inventory actions or no-damage attacks.',
      ],
    ],
  }),
  fabulaClass({
    name: 'Tamer',
    source: DARK_FANTASY,
    sourceType: COMMUNITY_ATLAS,
    summary: 'Coordinates with a companion creature through commands and training.',
    freeBenefits: ['Permanently increase your maximum Hit Points by 5.'],
    skills: [
      ['All-Out Attack', undefined, 'Command your companion into an aggressive attack pattern.'],
      [
        'Hybridization',
        undefined,
        'Alter or combine companion traits for unusual tactical options.',
      ],
      ['Interceptor', 6, 'Use your companion to intercept threats and protect allies.'],
      ['Negotiate', 4, 'Communicate, bargain, or establish terms with creatures.'],
      ['Unleash', 4, 'Let your companion act with greater force for a short burst.'],
    ],
  }),
];

export { FABULA_ULTIMA_MISSING_CLASSES };
export type { FabulaUltimaClass, FabulaUltimaSkill, FabulaUltimaSpell };
