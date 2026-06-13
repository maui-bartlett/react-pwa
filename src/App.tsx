import { BrowserRouter } from 'react-router';

import { CssBaseline } from '@mui/material';

import { withErrorHandler } from '@/error-handling';
import AppErrorBoundaryFallback from '@/error-handling/fallbacks/App';

import DiceRoller from './components/DiceRoller';
import Pages from './routes/Pages';
import DynamicManifest from './sections/DynamicManifest';
import HotKeys from './sections/HotKeys';
import NewVersionBanner from './sections/NewVersionBanner';
import PersistentAppLocation from './sections/PersistentAppLocation';
import Sidebar from './sections/Sidebar';

function App() {
  return (
    <>
      <CssBaseline />
      <HotKeys />
      <BrowserRouter>
        <PersistentAppLocation />
        <DynamicManifest />
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
