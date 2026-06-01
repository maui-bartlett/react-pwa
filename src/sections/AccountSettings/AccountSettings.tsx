import { useEffect, useMemo } from 'react';

import { useSetAtom } from 'jotai';

import { FabUTokensContext } from '@/components/fab-u/ThemeContext';
import AccountMenu from '@/components/fab-u/organisms/AccountMenu';
import {
  FabUTokens,
  avatarDarkTokens,
  avatarLightTokens,
  darkFabUTokens,
  fabUTokens,
} from '@/components/fab-u/tokens';
import { useThemeMode } from '@/theme/hooks';

import { GameSystem, gameSystemAtom } from './atoms';

type AccountSettingsProps = {
  /**
   * Which RPG system this surface represents. Sets the shared gameSystemAtom
   * (so downstream account-menu queries can filter) AND swaps the palette
   * the dialog renders with — green for fabula-ultima, blue for avatar-legends.
   */
  gameSystem: GameSystem;
  /** Optional locally-active character name. */
  localCharacterName?: string;
  /** Optional palette override for game surfaces with dynamic theme colors. */
  tokensOverride?: FabUTokens;
  /** Optional game-specific creator for new character rows. */
  createCharacterPayload?: (context: { avatarClass?: unknown }) => {
    schemaVersion: number;
    characterState: unknown;
  };
  /** App-specific event fired after selecting a character. */
  selectCharacterEventName?: string;
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
  tokensOverride,
  createCharacterPayload,
  selectCharacterEventName,
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
    return isDarkMode ? darkFabUTokens : fabUTokens;
  }, [gameSystem, isDarkMode, tokensOverride]);

  return (
    <FabUTokensContext.Provider value={tokens}>
      <AccountMenu
        localCharacterName={localCharacterName}
        themeMode={isDarkMode ? 'dark' : 'light'}
        onToggleTheme={toggle}
        createCharacterPayload={createCharacterPayload}
        selectCharacterEventName={selectCharacterEventName}
      />
    </FabUTokensContext.Provider>
  );
}

export default AccountSettings;
