import type { SkillRow } from '@/components/fab-u';

export type SkillGroup = {
  className: string;
  skills: SkillRow[];
};

export const skillGroups: SkillGroup[] = [
  {
    className: 'Entropist',
    skills: [
      { name: 'Entropic Magic', level: '7', effect: 'Alter fate, time, decay, or probability.' },
      { name: 'Absorb MP', level: '1', effect: 'Recover MP when magic is turned aside.' },
      { name: 'Stolen Time', level: '1', effect: 'Read time, weather, and celestial signs.' },
    ],
  },
  {
    className: 'Sharpshooter',
    skills: [
      {
        name: 'Ranged Weapon Mastery',
        level: '1',
        effect: 'Improve attacks and damage with ranged weapons.',
      },
      {
        name: 'Crossfire',
        level: '1',
        effect: 'Create an opening or apply pressure with ranged attacks.',
      },
    ],
  },
  {
    className: 'Tinkerer',
    skills: [
      {
        name: 'Emergency Item',
        level: '1',
        effect: 'Once per conflict, create a useful item or tool.',
      },
      {
        name: 'Improvisation',
        level: '—',
        effect: 'Spend IP to solve a practical problem in the scene.',
      },
    ],
  },
];
