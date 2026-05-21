import { ComponentType, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
// from MUI's toolpad we only use Notifications
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { Provider as JotaiProvider } from 'jotai';

import { authClient } from '@/lib/auth-client';
import { convex } from '@/lib/convexClient';
import ThemeProvider from '@/theme/Provider';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

function render(App: ComponentType) {
  root.render(
    <StrictMode>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <JotaiProvider>
          <ThemeProvider>
            <NotificationsProvider>
              <App />
            </NotificationsProvider>
          </ThemeProvider>
        </JotaiProvider>
      </ConvexBetterAuthProvider>
    </StrictMode>,
  );
}

export default render;
