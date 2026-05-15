import { PropsWithChildren, createContext, useContext } from 'react';

import { useAtomValue } from 'jotai';

import { themeModeState } from '@/theme/atoms';
import { ThemeMode } from '@/theme/types';

import { FabUTokens, darkFabUTokens, fabUTokens } from './tokens';

const FabUTokensContext = createContext<FabUTokens>(fabUTokens);

function FabUThemeProvider({ children }: PropsWithChildren) {
  const mode = useAtomValue(themeModeState);
  const tokens = mode === ThemeMode.DARK ? darkFabUTokens : fabUTokens;
  return <FabUTokensContext.Provider value={tokens}>{children}</FabUTokensContext.Provider>;
}

function useFabUTokens(): FabUTokens {
  return useContext(FabUTokensContext);
}

// eslint-disable-next-line react-refresh/only-export-components -- context file intentionally co-exports provider and hook
export { FabUThemeProvider, useFabUTokens };
