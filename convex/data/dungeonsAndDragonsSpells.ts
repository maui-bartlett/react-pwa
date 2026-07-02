const DUNGEONS_AND_DRAGONS_SPELLS = [
  { type: 'spell', category: 'Spell', name: 'Fire Bolt', level: 'Cantrip', school: 'Evocation', castingTime: '1 Action', range: '120 ft.', hitDc: '+8', damage: '1d10', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Ray of Frost', level: 'Cantrip', school: 'Evocation', castingTime: '1 Action', range: '60 ft.', hitDc: '+8', damage: '1d8', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Mage Hand', level: 'Cantrip', school: 'Conjuration', castingTime: '1 Action', range: '30 ft.', hitDc: 'Utility', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Shield', level: '1st Level', school: 'Abjuration', castingTime: '1 Reaction', range: 'Self', hitDc: '+5 AC', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Absorb Elements', level: '1st Level', school: 'Abjuration', castingTime: '1 Reaction', range: 'Self', hitDc: 'Resistance', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Silvery Barbs', level: '1st Level', school: 'Enchantment', castingTime: '1 Reaction', range: '60 ft.', hitDc: 'Reroll', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Magic Missile', level: '1st Level', school: 'Evocation', castingTime: '1 Action', range: '120 ft.', hitDc: 'Auto', damage: '3d4+3', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Detect Magic', level: '1st Level', school: 'Divination', castingTime: '1 Action', range: 'Self', hitDc: 'Utility', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Misty Step', level: '2nd Level', school: 'Conjuration', castingTime: '1 Bonus Action', range: 'Self', hitDc: 'Utility', classes: ['Wizard'] },
  { type: 'spell', category: 'Spell', name: 'Invisibility', level: '2nd Level', school: 'Illusion', castingTime: '1 Action', range: 'Touch', hitDc: 'Utility', classes: ['Wizard'] },
];

export { DUNGEONS_AND_DRAGONS_SPELLS };
