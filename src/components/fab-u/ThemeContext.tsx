import { PropsWithChildren, createContext, useContext } from 'react';

import GlobalStyles from '@mui/material/GlobalStyles';

import { useAtomValue } from 'jotai';

import { themeModeState } from '@/theme/atoms';
import { ThemeMode } from '@/theme/types';

import { FabUTokens, darkFabUTokens, fabUTokens } from './tokens';

const FabUTokensContext = createContext<FabUTokens>(fabUTokens);

const darkScrollbarStyles = {
  '*::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '*::-webkit-scrollbar-track': {
    background: darkFabUTokens.color.canvas,
  },
  '*::-webkit-scrollbar-thumb': {
    background: darkFabUTokens.color.border,
    borderRadius: '3px',
  },
  '*::-webkit-scrollbar-thumb:hover': {
    background: darkFabUTokens.color.brand,
  },
  '*': {
    scrollbarColor: `${darkFabUTokens.color.border} ${darkFabUTokens.color.canvas}`,
    scrollbarWidth: 'thin' as const,
  },
};

function FabUThemeProvider({ children }: PropsWithChildren) {
  const mode = useAtomValue(themeModeState);
  const tokens = mode === ThemeMode.DARK ? darkFabUTokens : fabUTokens;
  return (
    <FabUTokensContext.Provider value={tokens}>
      {mode === ThemeMode.DARK && <GlobalStyles styles={darkScrollbarStyles} />}
      {children}
    </FabUTokensContext.Provider>
  );
}

function useFabUTokens(): FabUTokens {
  return useContext(FabUTokensContext);
}

// eslint-disable-next-line react-refresh/only-export-components -- context file intentionally co-exports provider and hook
export { FabUThemeProvider, useFabUTokens };
