type BraveNavigator = Navigator & {
  brave?: { isBrave?: () => Promise<boolean> };
  standalone?: boolean;
};

const BRAVE_BROWSER_CLASS = 'is-brave-browser';

async function detectBraveBrowser(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  const braveNavigator = navigator as BraveNavigator;
  try {
    return Boolean(braveNavigator.brave?.isBrave && (await braveNavigator.brave.isBrave()));
  } catch {
    return false;
  }
}

function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;

  const braveNavigator = navigator as BraveNavigator;
  return (
    braveNavigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  );
}

export { BRAVE_BROWSER_CLASS, detectBraveBrowser, isStandalonePwa };
