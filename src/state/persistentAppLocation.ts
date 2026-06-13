const PERSISTENT_APP_LOCATION_KEY = 'table-top-persistent-location';
const PERSISTENT_APP_LOCATION_VERSION = 1;
const launchRoutes = new Set(['/', '/home']);

type PersistentAppViews = Record<string, Record<string, string>>;

type PersistentAppLocation = {
  version: typeof PERSISTENT_APP_LOCATION_VERSION;
  pathname: string;
  appViews: PersistentAppViews;
};

function getStorage(): Storage | null {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
}

function createDefaultLocation(): PersistentAppLocation {
  return {
    version: PERSISTENT_APP_LOCATION_VERSION,
    pathname: '/',
    appViews: {},
  };
}

function isValidPathname(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

function readPersistentAppLocation(storage = getStorage()): PersistentAppLocation {
  if (!storage) return createDefaultLocation();

  try {
    const parsed = JSON.parse(storage.getItem(PERSISTENT_APP_LOCATION_KEY) ?? 'null') as unknown;
    if (!parsed || typeof parsed !== 'object') return createDefaultLocation();

    const candidate = parsed as Partial<PersistentAppLocation>;
    if (
      candidate.version !== PERSISTENT_APP_LOCATION_VERSION ||
      !isValidPathname(candidate.pathname)
    ) {
      return createDefaultLocation();
    }

    return {
      version: PERSISTENT_APP_LOCATION_VERSION,
      pathname: candidate.pathname,
      appViews:
        candidate.appViews && typeof candidate.appViews === 'object' ? candidate.appViews : {},
    };
  } catch {
    return createDefaultLocation();
  }
}

function writePersistentAppLocation(location: PersistentAppLocation, storage = getStorage()) {
  if (!storage) return;

  try {
    storage.setItem(PERSISTENT_APP_LOCATION_KEY, JSON.stringify(location));
  } catch {
    // Persistence is best effort when storage is unavailable or full.
  }
}

function persistAppPathname(pathname: string, storage = getStorage()) {
  if (!isValidPathname(pathname)) return;

  const current = readPersistentAppLocation(storage);
  writePersistentAppLocation({ ...current, pathname }, storage);
}

function persistAppView(appId: string, viewId: string, value: string, storage = getStorage()) {
  const current = readPersistentAppLocation(storage);
  writePersistentAppLocation(
    {
      ...current,
      appViews: {
        ...current.appViews,
        [appId]: {
          ...current.appViews[appId],
          [viewId]: value,
        },
      },
    },
    storage,
  );
}

function readPersistentAppView<T extends string>(
  appId: string,
  viewId: string,
  validValues: readonly T[],
  fallback: T,
  storage = getStorage(),
): T {
  const value = readPersistentAppLocation(storage).appViews[appId]?.[viewId];
  return validValues.includes(value as T) ? (value as T) : fallback;
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    navigatorWithStandalone.standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true
  );
}

function restorePersistentAppPathname() {
  if (typeof window === 'undefined' || !isStandalonePwa()) return;

  const savedPathname = readPersistentAppLocation().pathname;
  if (!launchRoutes.has(window.location.pathname) || launchRoutes.has(savedPathname)) return;

  window.history.replaceState(window.history.state, '', savedPathname);
}

export {
  PERSISTENT_APP_LOCATION_KEY,
  isStandalonePwa,
  persistAppPathname,
  persistAppView,
  readPersistentAppLocation,
  readPersistentAppView,
  restorePersistentAppPathname,
};
export type { PersistentAppLocation };
