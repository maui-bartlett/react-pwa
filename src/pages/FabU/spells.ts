import type { SpellRow } from '@/components/fab-u';

export type SpellGroup = {
  className: string;
  spells: SpellRow[];
};

export const spellGroups: SpellGroup[] = [
  {
    className: 'Entropist',
    spells: [
      {
        name: 'Accelerate',
        cost: '20 MP',
        target: '1',
        duration: 'Scene',
        effect: 'Target takes one extra action on their turn.',
      },
      {
        name: 'Drain Spirit',
        cost: '5 MP',
        target: '1',
        duration: 'Instant',
        effect: 'HR + 15 MP; recover half as MP.',
      },
      {
        name: 'Stop',
        cost: '10 MP',
        target: '1',
        duration: 'Scene',
        effect: 'Target performs fewer actions.',
      },
      {
        name: 'Mirror',
        cost: '10 MP',
        target: '1',
        duration: 'Instant',
        effect: 'Redirect a spell to protect the chosen target.',
      },
    ],
  },
];
