import type { DieSize } from './diceRollResults';

const TABLETOP_ROLL_DICE_EVENT = 'tabletop-roll-dice';

type TabletopRollDiceDetail = {
  dice: DieSize[];
  label?: string;
  modifier?: number;
};

function dispatchTabletopDiceRoll(detail: TabletopRollDiceDetail) {
  window.dispatchEvent(new CustomEvent<TabletopRollDiceDetail>(TABLETOP_ROLL_DICE_EVENT, { detail }));
}

export { TABLETOP_ROLL_DICE_EVENT, dispatchTabletopDiceRoll };
export type { TabletopRollDiceDetail };
