import { useEffect } from 'react';

import { useSetAtom } from 'jotai';

import AccountMenu from '@/components/fab-u/organisms/AccountMenu';
import { useThemeMode } from '@/theme/hooks';

import { GameSystem, gameSystemAtom } from './atoms';

type AccountSettingsProps = {
  /**
   * Which RPG system this surface represents. Setting this on mount lets
   * downstream account-menu screens filter their data to the right system
   * (e.g. only show Avatar Legends characters when opened from /avatar-legends).
   */
  gameSystem: GameSystem;
  /**
   * Optional locally-active character name (FabU surfaces it; Avatar Legends
   * doesn't pass one).
   */
  localCharacterName?: string;
};

/**
 * App-level wrapper around the existing AccountMenu — provides a uniform
 * settings button + dialog that any UI can mount in its header. Sets the
 * shared `gameSystemAtom` so the account menu's data screens know which
 * RPG context they're being opened from.
 */
function AccountSettings({ gameSystem, localCharacterName }: AccountSettingsProps) {
  const setGameSystem = useSetAtom(gameSystemAtom);
  const { isDarkMode, toggle } = useThemeMode();

  // Sync the game-system context whenever this surface mounts (or its
  // gameSystem prop changes). The atom drives account-menu queries.
  useEffect(() => {
    setGameSystem(gameSystem);
  }, [gameSystem, setGameSystem]);

  return (
    <AccountMenu
      localCharacterName={localCharacterName}
      themeMode={isDarkMode ? 'dark' : 'light'}
      onToggleTheme={toggle}
    />
  );
}

export default AccountSettings;
