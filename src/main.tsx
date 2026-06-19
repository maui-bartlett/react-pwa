import { restorePersistentAppPathname } from '@/state/persistentAppLocation';
import { applyRouteChrome } from '@/theme/appChrome';
import welcome from '@/utils/welcome';

import './index.css';

applyRouteChrome(restorePersistentAppPathname());

// `root` contains the main dependencies and providers of the base app
//  - React, ReactDom, Jotai, ThemeProvider, etc.)
// App contains the main structure of the base app

// These are the two main chunks that are used to render the core structure of the app
// Importing them with Promise.all (by using HTTP/2/3 multiplexing) we can load them in parallel
// and achieve the best possible performance

const BOOT_RECOVERY_KEY = 'table-top-bootstrap-recovery';

function hasAttemptedBootstrapRecovery() {
  if (new URL(window.location.href).searchParams.has('app-recovery')) return true;
  try {
    return window.sessionStorage.getItem(BOOT_RECOVERY_KEY) === '1';
  } catch {
    return false;
  }
}

function setBootstrapRecoveryAttempted(attempted: boolean) {
  try {
    if (attempted) {
      window.sessionStorage.setItem(BOOT_RECOVERY_KEY, '1');
    } else {
      window.sessionStorage.removeItem(BOOT_RECOVERY_KEY);
    }
  } catch {
    // Storage can be unavailable in restricted Safari PWA sessions.
  }
}

Promise.all([import('@/root'), import('@/App')])
  .then(([{ default: render }, { default: App }]) => {
    setBootstrapRecoveryAttempted(false);
    render(App);
  })
  .catch(async (error) => {
    console.error('Application bootstrap failed.', error);
    if (hasAttemptedBootstrapRecovery()) throw error;

    setBootstrapRecoveryAttempted(true);
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.unregister();
      } catch {
        // The cache-busted navigation can still recover without SW access.
      }
    }

    const recoveryUrl = new URL(window.location.href);
    recoveryUrl.searchParams.set('app-recovery', Date.now().toString());
    window.location.replace(recoveryUrl);
  });

// welcome message for users in the console
welcome();
