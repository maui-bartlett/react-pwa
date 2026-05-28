import { ReactNode, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

export type SwipeableAction = {
  /** Icon shown inside the action button (e.g. lucide-react Pencil). */
  icon: ReactNode;
  /** Background colour for the action button surface. */
  color: string;
  /** Foreground colour for the icon. Defaults to white. */
  iconColor?: string;
  /** Accessibility label for the button. */
  ariaLabel: string;
  /** Click handler. The card auto-closes after invoking unless
   *  `closeOnClick` is set to false (e.g. the delete action keeps the
   *  card open while the confirmation modal is showing). */
  onClick: () => void;
  /** Whether the card should snap closed immediately after this
   *  action fires. Defaults to true. */
  closeOnClick?: boolean;
};

type SwipeableCardProps = {
  /** Card surface content. */
  children: ReactNode;
  /** Actions revealed when the user swipes the card left, rendered in
   *  order from left to right inside the revealed right-side strip.
   *  Pass `[deleteAction, editAction]` to match the spec (delete on
   *  the left of edit). Empty / falsy entries are ignored. */
  actions: Array<SwipeableAction | null | undefined | false>;
  /** Optional radius applied to the card surface (default 9px to match
   *  the rest of the AccountMenu rows). */
  borderRadius?: number | string;
};

const ACTION_WIDTH = 64;

/**
 * Swipe-to-reveal card wrapper that mirrors the FabU `SwipeableTraitRow`
 * styling: drag the card left and a strip of right-anchored action
 * buttons (e.g. Delete + Edit) animates into view from underneath.
 * Releasing past the threshold snaps fully open; tapping the card or
 * swiping back right snaps it closed.
 *
 * Powered by `react-swipeable` so touch + mouse + pen all work; vertical
 * scrolls pass through.
 */
function SwipeableCard({ children, actions, borderRadius = '9px' }: SwipeableCardProps) {
  const visibleActions = actions.filter((action): action is SwipeableAction => Boolean(action));
  const channelWidth = visibleActions.length * ACTION_WIDTH;

  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  // Clamp the visual offset so the card can only translate within the
  // channel range. Positive deltas (right-swipes) snap us back to 0.
  const visualX = Math.max(-channelWidth, Math.min(0, snapX + currentDeltaX));
  const channelVisible =
    visibleActions.length > 0 && (snapX !== 0 || (swiping && currentDeltaX < -5));

  function close() {
    setSnapX(0);
    setCurrentDeltaX(0);
  }

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX, deltaY }) => {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 8) {
        setSwiping(true);
      }
      setCurrentDeltaX(deltaX);
    },
    onSwiped: ({ dir, absX }) => {
      setSwiping(false);
      if (dir === 'Left' && absX > 50 && snapX === 0 && visibleActions.length > 0) {
        setSnapX(-channelWidth);
      } else if (dir === 'Right' && absX > 50 && snapX !== 0) {
        close();
      }
      setCurrentDeltaX(0);
    },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  // When the card is open (or actively swiping open), flatten the
  // INNER card's right corners so the meeting edge with the action
  // strip is a clean vertical line. The OUTER wrapper keeps its full
  // border radius, so the rightmost revealed action button (e.g. Edit)
  // still gets a rounded right corner that matches the card's
  // original silhouette.
  const cardOpen = snapX !== 0 || (swiping && currentDeltaX < -5);
  const innerBorderRadius = cardOpen
    ? typeof borderRadius === 'number'
      ? `${borderRadius}px 0 0 ${borderRadius}px`
      : `${borderRadius} 0 0 ${borderRadius}`
    : borderRadius;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius,
      }}
    >
      {channelVisible && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: channelWidth,
            display: 'flex',
            zIndex: 0,
          }}
        >
          <Stack direction="row" sx={{ width: '100%' }}>
            {visibleActions.map((action, idx) => (
              <Box
                key={idx}
                role="button"
                aria-label={action.ariaLabel}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  // Default behaviour is to snap closed, but actions
                  // can opt-out (e.g. delete keeps the card open
                  // while a confirmation modal is showing).
                  if (action.closeOnClick !== false) close();
                }}
                sx={{
                  flex: 1,
                  bgcolor: action.color,
                  color: action.iconColor ?? '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {action.icon}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
      <Box
        {...swipeHandlers}
        sx={{
          position: 'relative',
          zIndex: 1,
          transform: `translateX(${visualX}px)`,
          transition: swiping ? 'none' : 'transform 0.22s ease',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
        onClick={() => {
          // Tapping the card surface while open closes it. Open cards
          // intercept the click so the underlying content's onClick
          // (e.g. select character) doesn't fire when the user just
          // wanted to dismiss the action panel.
          if (snapX !== 0) close();
        }}
      >
        {/* Inner wrapper clips its children to the (possibly flattened)
            right corners so the card body's visual right edge follows
            our open / closed state independent of whatever child the
            caller renders. */}
        <Box sx={{ borderRadius: innerBorderRadius, overflow: 'hidden' }}>{children}</Box>
      </Box>
    </Box>
  );
}

export type { SwipeableCardProps };
export { SwipeableCard };
