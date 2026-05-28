import { ReactNode, useRef, useState } from 'react';

import Box from '@mui/material/Box';

const REVEAL_PX = 84;
const SWIPE_THRESHOLD = 40;
const HORIZONTAL_BIAS = 1.2;

type SwipeableCardProps = {
  /** Foreground content (the actual card). */
  children: ReactNode;
  /** Action revealed when the user swipes the card to the right.
   *  Rendered fixed under the card; gets its own click handler. */
  action: ReactNode;
  /** Optional callback fired when the card snaps fully open. */
  onOpen?: () => void;
};

/**
 * Lightweight swipe-to-reveal wrapper. Drag the card horizontally to
 * the right and an action panel (e.g. an Edit button) slides into view
 * from underneath. Releasing past the threshold snaps fully open; tap
 * anywhere outside the action or swipe back left to dismiss.
 *
 * Pointer events drive the gesture so mouse + touch + pen all work.
 * Vertical drags pass through (the page can still scroll).
 */
function SwipeableCard({ children, action, onOpen }: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [opened, setOpened] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  function reset() {
    setOffset(0);
    setOpened(false);
    startXRef.current = null;
    startYRef.current = null;
    draggingRef.current = false;
  }

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
      {/* Revealed action panel — sits behind the card on the left edge. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'stretch',
          // Action button hugs the left edge so swipe-right reveals it.
          pointerEvents: opened ? 'auto' : 'none',
        }}
      >
        {action}
      </Box>

      {/* The card itself — translates rightward to reveal the action. */}
      <Box
        ref={surfaceRef}
        onPointerDown={(e) => {
          startXRef.current = e.clientX;
          startYRef.current = e.clientY;
          draggingRef.current = false;
        }}
        onPointerMove={(e) => {
          if (startXRef.current === null || startYRef.current === null) return;
          const dx = e.clientX - startXRef.current;
          const dy = e.clientY - startYRef.current;
          if (!draggingRef.current) {
            // Only claim the gesture once horizontal travel clearly
            // dominates vertical — keeps page scrolling intact.
            if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS) {
              draggingRef.current = true;
              (e.target as Element).setPointerCapture?.(e.pointerId);
            } else if (Math.abs(dy) > Math.abs(dx)) {
              startXRef.current = null;
              startYRef.current = null;
              return;
            } else {
              return;
            }
          }
          // Only allow positive (right-swipe) translation. Clamp at the
          // reveal width so the card can't be over-dragged.
          const next = Math.max(0, Math.min(REVEAL_PX, opened ? REVEAL_PX + dx : dx));
          setOffset(next);
        }}
        onPointerUp={(e) => {
          if (!draggingRef.current) {
            // No horizontal drag — treat as a tap. If the card is open,
            // a tap on the surface closes it.
            if (opened) {
              reset();
            }
            startXRef.current = null;
            startYRef.current = null;
            return;
          }
          (e.target as Element).releasePointerCapture?.(e.pointerId);
          if (offset >= SWIPE_THRESHOLD) {
            setOffset(REVEAL_PX);
            if (!opened) {
              setOpened(true);
              onOpen?.();
            }
          } else {
            reset();
          }
          startXRef.current = null;
          startYRef.current = null;
          draggingRef.current = false;
        }}
        onPointerCancel={() => {
          reset();
        }}
        sx={{
          position: 'relative',
          transform: `translateX(${offset}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.2s ease',
          touchAction: 'pan-y',
          willChange: 'transform',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export type { SwipeableCardProps };
export { SwipeableCard };
