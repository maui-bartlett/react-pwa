const APP_SHELL_BOTTOM_SAFE_AREA_PADDING = 'max(20px, env(safe-area-inset-bottom, 0px))';
const APP_SHELL_FIREFOX_BOTTOM_NAV_INSET = '48px';
const APP_SHELL_DICE_FAB_SCROLL_CLEARANCE = `calc(226px + ${APP_SHELL_BOTTOM_SAFE_AREA_PADDING})`;

function withFirefoxBottomNavInset(clearance: string): string {
  return `calc(${clearance} + ${APP_SHELL_FIREFOX_BOTTOM_NAV_INSET})`;
}

export {
  APP_SHELL_BOTTOM_SAFE_AREA_PADDING,
  APP_SHELL_DICE_FAB_SCROLL_CLEARANCE,
  APP_SHELL_FIREFOX_BOTTOM_NAV_INSET,
  withFirefoxBottomNavInset,
};
