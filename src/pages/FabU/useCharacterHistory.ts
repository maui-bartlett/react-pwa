import { createCharacterHistory } from '@/state/createCharacterHistory';
import type { CharacterHistoryControls as GenericControls } from '@/state/createCharacterHistory';

import type { Character } from './atoms';
import { characterState } from './atoms';

/** FabU-specific specialization of the generic history controls. */
type CharacterHistoryControls = GenericControls<Character>;

/**
 * FabU's hook bound to the persisted character atom. Built on the
 * reusable factory in `src/state/createCharacterHistory.ts` so the
 * undo/redo machinery is shared across every app that wants it.
 */
const useCharacterHistory = createCharacterHistory(characterState);

export type { CharacterHistoryControls };
export { useCharacterHistory };
