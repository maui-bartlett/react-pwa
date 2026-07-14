import { useEffect } from 'react';
import { BrowserRouter } from 'react-router';

import { CssBaseline } from '@mui/material';

import { BRAVE_BROWSER_CLASS, detectBraveBrowser } from '@/browserEnvironment';
import { withErrorHandler } from '@/error-handling';
import AppErrorBoundaryFallback from '@/error-handling/fallbacks/App';

import DiceRoller from './components/DiceRoller';
import Pages from './routes/Pages';
import AppUpdatePrompt from './sections/AppUpdatePrompt';
import DynamicManifest from './sections/DynamicManifest';
import HotKeys from './sections/HotKeys';
import NewVersionBanner from './sections/NewVersionBanner';
import PersistentAppLocation from './sections/PersistentAppLocation';
import Sidebar from './sections/Sidebar';

function App() {
  useEffect(() => {
    let active = true;

    detectBraveBrowser().then((brave) => {
      if (!active) return;
      document.body.classList.toggle(BRAVE_BROWSER_CLASS, brave);
    });

    return () => {
      active = false;
      document.body.classList.remove(BRAVE_BROWSER_CLASS);
    };
  }, []);

  return (
    <>
      <CssBaseline />
      <HotKeys />
      <BrowserRouter>
        <PersistentAppLocation />
        <DynamicManifest />
        <AppUpdatePrompt />
        <NewVersionBanner />
        <Sidebar />
        <Pages />
        <DiceRoller />
      </BrowserRouter>
    </>
  );
}

const AppWithErrorHandler = withErrorHandler(App, AppErrorBoundaryFallback);
export default AppWithErrorHandler;
