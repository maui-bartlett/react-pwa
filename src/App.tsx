import { BrowserRouter } from 'react-router';

import { CssBaseline } from '@mui/material';

import { withErrorHandler } from '@/error-handling';
import AppErrorBoundaryFallback from '@/error-handling/fallbacks/App';

import Pages from './routes/Pages';
import DynamicManifest from './sections/DynamicManifest';
import HotKeys from './sections/HotKeys';
import Sidebar from './sections/Sidebar';

function App() {
  return (
    <>
      <CssBaseline />
      <HotKeys />
      <BrowserRouter>
        <DynamicManifest />
        <Sidebar />
        <Pages />
      </BrowserRouter>
    </>
  );
}

const AppWithErrorHandler = withErrorHandler(App, AppErrorBoundaryFallback);
export default AppWithErrorHandler;
