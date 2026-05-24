import { useEffect, useRef, useState } from 'react';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';

import { ThemeMode } from '@/theme/types';

import { api } from '../../convex/_generated/api';
import { authClient } from './auth-client';

function useProfileThemeSync(themeMode: ThemeMode, setThemeMode: (themeMode: ThemeMode) => void) {
  const { data: session } = authClient.useSession();
  const convexAuth = useConvexAuth();
  const canSyncProfileTheme =
    Boolean(session?.user) && !convexAuth.isLoading && convexAuth.isAuthenticated;
  const storedTheme = useQuery(api.users.getCurrentTheme, canSyncProfileTheme ? {} : 'skip');
  const updateCurrentTheme = useMutation(api.users.updateCurrentTheme);
  const [hasLoadedStoredTheme, setHasLoadedStoredTheme] = useState(false);
  const lastPersistedThemeRef = useRef<ThemeMode | null>(null);

  useEffect(() => {
    if (!canSyncProfileTheme) {
      setHasLoadedStoredTheme(false);
      lastPersistedThemeRef.current = null;
      return;
    }

    if (storedTheme === undefined || hasLoadedStoredTheme) return;

    setHasLoadedStoredTheme(true);
    if (storedTheme) {
      lastPersistedThemeRef.current = storedTheme;
      if (storedTheme !== themeMode) setThemeMode(storedTheme);
    }
  }, [canSyncProfileTheme, hasLoadedStoredTheme, setThemeMode, storedTheme, themeMode]);

  useEffect(() => {
    if (!canSyncProfileTheme || storedTheme === undefined || !hasLoadedStoredTheme) return;
    if (lastPersistedThemeRef.current === themeMode) return;

    lastPersistedThemeRef.current = themeMode;
    void updateCurrentTheme({ currentTheme: themeMode }).catch((error) => {
      console.warn('[profile] failed to persist theme preference', error);
      lastPersistedThemeRef.current = null;
    });
  }, [canSyncProfileTheme, hasLoadedStoredTheme, storedTheme, themeMode, updateCurrentTheme]);
}

export { useProfileThemeSync };
