import { createCharacterHistory } from '@/state/createCharacterHistory';
import type { CharacterHistoryControls as GenericControls } from '@/state/createCharacterHistory';

import { dndCharacterState } from './atoms';
import type { DndCharacter } from './atoms';

type DndCharacterHistoryControls = GenericControls<DndCharacter>;

const useDndCharacterHistory = createCharacterHistory(dndCharacterState);

export { useDndCharacterHistory };
export type { DndCharacterHistoryControls };
