import { describe, expect, it } from 'vitest';

import { deriveTechniqueFatigue as deriveBackendTechniqueFatigue } from '../../../convex/lib/avatarTechniqueFatigue';
import { deriveTechniqueFatigue } from './techniqueFatigue';

function expectFatigue(description: string, approach: string, expected: unknown) {
  expect(deriveTechniqueFatigue(description, approach)).toEqual(expected);
  expect(deriveBackendTechniqueFatigue(description, approach)).toEqual(expected);
}

describe('deriveTechniqueFatigue', () => {
  it('assigns imperative fatigue costs to self', () => {
    expectFatigue('Mark 1-fatigue, then mark an additional 2-fatigue.', 'Advance & Attack', {
      self: { mark: 3, clear: 0 },
      target: { mark: 0, clear: 0 },
    });
  });

  it('assigns inflicted and foe-marked fatigue to the target', () => {
    expectFatigue(
      'Mark 1-fatigue; your target must mark 2-fatigue or suffer 1-fatigue.',
      'Advance & Attack',
      {
        self: { mark: 1, clear: 0 },
        target: { mark: 2, clear: 0 },
      },
    );
  });

  it('adds the Evade & Observe clear to explicit self clears', () => {
    expectFatigue(
      'Clear 1-fatigue (in addition to clearing 1-fatigue via evade and observe).',
      'Evade & Observe',
      {
        self: { mark: 0, clear: 2 },
        target: { mark: 0, clear: 0 },
      },
    );
  });

  it('assigns fatigue cleared from an ally to the target', () => {
    expectFatigue(
      'Mark fatigue to heal an ally and clear 3-fatigue from them.',
      'Evade & Observe',
      {
        self: { mark: 1, clear: 1 },
        target: { mark: 0, clear: 3 },
      },
    );
  });

  it('carries a target across a coordinated clear clause', () => {
    expectFatigue(
      'Clear an appropriate status from them, and clear 3-fatigue or two conditions.',
      'Evade & Observe',
      {
        self: { mark: 0, clear: 1 },
        target: { mark: 0, clear: 3 },
      },
    );
  });

  it('assigns fatigue inflicted on the user to self', () => {
    expectFatigue(
      'For each attack that inflicts 2-fatigue on you, become Prepared.',
      'Defend & Maneuver',
      {
        self: { mark: 2, clear: 0 },
        target: { mark: 0, clear: 0 },
      },
    );
  });

  it('carries an inflict action across an alternative fatigue value', () => {
    expectFatigue(
      'Mark fatigue to inflict a condition or 2-fatigue, target’s choice.',
      'Advance & Attack',
      {
        self: { mark: 1, clear: 0 },
        target: { mark: 2, clear: 0 },
      },
    );
  });

  it('does not count instructions not to mark fatigue', () => {
    expectFatigue('The next time you act, do not mark fatigue.', 'Advance & Attack', {
      self: { mark: 0, clear: 0 },
      target: { mark: 0, clear: 0 },
    });
  });
});
