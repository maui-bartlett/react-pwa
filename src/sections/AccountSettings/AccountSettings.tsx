import { useEffect, useMemo } from 'react';

import type { SxProps, Theme } from '@mui/material/styles';

import { useSetAtom } from 'jotai';

import AccountMenu from '@/components/account/AccountMenu';
import { FabUTokensContext } from '@/components/account/AccountThemeContext';
import {
  FabUTokens,
  avatarDarkTokens,
  avatarLightTokens,
  darkFabUTokens,
  dndDarkTokens,
  dndLightTokens,
  fabUTokens,
} from '@/components/account/tokens';
import type { UseLocalCharacterSlotsResult } from '@/state/useLocalCharacterSlots';
import { useThemeMode } from '@/theme/hooks';

import { GameSystem, gameSystemAtom } from './atoms';

type AccountSettingsProps = {
  /**
   * Which RPG system this surface represents. Sets the shared gameSystemAtom
   * (so downstream account-menu queries can filter) AND swaps the palette
   * the dialog renders with — green for fabula-ultima, blue for avatar-legends,
   * red/black for dungeons-and-dragons.
   */
  gameSystem: GameSystem;
  /** Optional locally-active character name. */
  localCharacterName?: string;
  /** Signed-out local character slots for this game system. */
  localCharacters?: UseLocalCharacterSlotsResult;
  /** Optional palette override for game surfaces with dynamic theme colors. */
  tokensOverride?: FabUTokens;
  /** Optional game-specific creator for new character rows. */
  createCharacterPayload?: (context: { avatarClass?: unknown }) => {
    schemaVersion: number;
    characterState: unknown;
  };
  /** Applies a selected backend character to the owning app immediately. */
  onSelectCharacterState?: (characterState: unknown) => void;
  /** Optional app-specific edit handler for local character cards. */
  onEditLocalCharacter?: (id: string) => void;
  /** App-specific event fired after selecting a character. */
  selectCharacterEventName?: string;
  /** Optional trigger button override for host app chrome. */
  triggerSx?: SxProps<Theme>;
};

/**
 * App-level wrapper around the existing AccountMenu. Provides:
 *   1. the shared gameSystemAtom (set on mount/prop change)
 *   2. the global theme-toggle hook for the menu's light/dark switch
 *   3. a FabUTokensContext.Provider scoped to this dialog so the menu
 *      inherits the right palette (green for FabU, blue for Avatar Legends)
 */
function AccountSettings({
  gameSystem,
  localCharacterName,
  localCharacters,
  tokensOverride,
  createCharacterPayload,
  onSelectCharacterState,
  onEditLocalCharacter,
  selectCharacterEventName,
  triggerSx,
}: AccountSettingsProps) {
  const setGameSystem = useSetAtom(gameSystemAtom);
  const { isDarkMode, toggle } = useThemeMode();

  useEffect(() => {
    setGameSystem(gameSystem);
  }, [gameSystem, setGameSystem]);

  // Pick the palette to use inside this dialog based on the game system.
  // The default app-wide FabUTokensContext stays untouched (FabU still
  // gets its green look); this wrapper only overrides it for the menu's
  // own subtree.
  const tokens = useMemo(() => {
    if (tokensOverride) return tokensOverride;
    if (gameSystem === 'avatar-legends') {
      return isDarkMode ? avatarDarkTokens : avatarLightTokens;
    }
    if (gameSystem === 'dungeons-and-dragons') {
      return isDarkMode ? dndDarkTokens : dndLightTokens;
    }
    return isDarkMode ? darkFabUTokens : fabUTokens;
  }, [gameSystem, isDarkMode, tokensOverride]);

  return (
    <FabUTokensContext.Provider value={tokens}>
      <AccountMenu
        localCharacterName={localCharacterName}
        localCharacters={localCharacters}
        themeMode={isDarkMode ? 'dark' : 'light'}
        onToggleTheme={toggle}
        createCharacterPayload={createCharacterPayload}
        onSelectCharacterState={onSelectCharacterState}
        onEditLocalCharacter={onEditLocalCharacter}
        selectCharacterEventName={selectCharacterEventName}
        triggerSx={triggerSx}
      />
    </FabUTokensContext.Provider>
  );
}

export default AccountSettings;
