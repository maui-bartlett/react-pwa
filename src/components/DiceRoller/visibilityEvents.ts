import { useEffect } from 'react';

const TABLETOP_DICE_VISIBILITY_EVENT = 'tabletop:dice-visibility';

type TabletopDiceVisibilityDetail = {
  id: string;
  hidden: boolean;
};

function dispatchDiceVisibility(id: string, hidden: boolean) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<TabletopDiceVisibilityDetail>(TABLETOP_DICE_VISIBILITY_EVENT, {
      detail: { id, hidden },
    }),
  );
}

function useHideDiceRollerWhileOpen(id: string, open: boolean) {
  useEffect(() => {
    if (!open) {
      dispatchDiceVisibility(id, false);
      return undefined;
    }

    dispatchDiceVisibility(id, true);
    return () => dispatchDiceVisibility(id, false);
  }, [id, open]);
}

export { TABLETOP_DICE_VISIBILITY_EVENT, dispatchDiceVisibility, useHideDiceRollerWhileOpen };
export type { TabletopDiceVisibilityDetail };
