import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { useFabUTokens } from '../ThemeContext';

const FIREFOX_PWA_BOTTOM_NAV_INSET = '48px';

type MobileScreenProps = PropsWithChildren<{
  header: ReactNode;
  footer: ReactNode;
  overlay?: ReactNode;
  /** Optionally receives a ref to the scrollable content viewport for external scroll management. */
  contentScrollRef?: React.MutableRefObject<HTMLDivElement | null>;
}>;

function MobileScreen({ header, footer, overlay, children, contentScrollRef }: MobileScreenProps) {
  const fabUTokens = useFabUTokens();
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [bottomSpacerHeight, setBottomSpacerHeight] = useState(0);
  const [topPaddingHeight, setTopPaddingHeight] = useState(0);

  useEffect(() => {
    const scrollViewport = scrollViewportRef.current;
    const content = contentRef.current;
    const footerElement = footerRef.current;
    const headerElement = headerRef.current;

    if (!scrollViewport || !content || !footerElement || !headerElement) {
      return undefined;
    }

    function updateSpacers() {
      if (
        !scrollViewportRef.current ||
        !contentRef.current ||
        !footerRef.current ||
        !headerRef.current
      ) {
        return;
      }

      const scrollViewport = scrollViewportRef.current;
      const content = contentRef.current;
      const footerElement = footerRef.current;
      const headerElement = headerRef.current;

      // Top padding: push content below the floating header
      setTopPaddingHeight(headerElement.offsetHeight);

      // Bottom spacer: enough room to scroll past the floating footer
      const desiredScrollAllowance = footerElement.offsetHeight + 12;
      const viewportFillRequirement = scrollViewport.clientHeight - content.offsetHeight;
      const nextSpacerHeight = Math.max(desiredScrollAllowance, viewportFillRequirement, 0);
      setBottomSpacerHeight(nextSpacerHeight);
    }

    updateSpacers();

    const resizeObserver = new ResizeObserver(updateSpacers);
    resizeObserver.observe(scrollViewport);
    resizeObserver.observe(content);
    resizeObserver.observe(footerElement);
    resizeObserver.observe(headerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, footer, header]);

  return (
    <Box
      data-pw="mobile-screen"
      data-dice-tray-root
      sx={{
        position: 'relative',
        width: { xs: '100vw', md: '100%' },
        maxWidth: { xs: 'none', md: 390 },
        height: {
          xs: '100vh',
          md: 'min(920px, calc(100dvh - 40px))',
        },
        '@supports (-moz-appearance: none)': {
          // Match Avatar Legends' visible-viewport sizing in Firefox PWAs so
          // the absolutely positioned footer is anchored inside the shown area.
          height: {
            xs: '100dvh',
            md: 'min(920px, calc(100dvh - 40px))',
          },
        },
        borderRadius: { xs: 0, md: '14px' },
        boxShadow: {
          xs: 'none',
          md: `0 5px 18px rgba(31, 42, 38, 0.05), 0 0 0 1px ${fabUTokens.color.border}`,
        },
        overflow: 'hidden',
      }}
    >
      <Stack
        sx={{
          height: '100%',
          bgcolor: fabUTokens.color.canvas,
        }}
      >
        <Box
          data-pw="content-area"
          data-dice-tray-scroll-root
          ref={(el: HTMLDivElement | null) => {
            scrollViewportRef.current = el;
            if (contentScrollRef) contentScrollRef.current = el;
          }}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            '@media (max-width: 899.95px)': {
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            },
          }}
        >
          {/* Content — top padding reserves space below the floating header + 10px breathing room */}
          <Box ref={contentRef} sx={{ px: 1, pt: `${topPaddingHeight + 10}px` }}>
            <Stack spacing={2.775}>{children}</Stack>
          </Box>

          <Box sx={{ height: bottomSpacerHeight, flexShrink: 0 }} />
        </Box>
      </Stack>

      {/* Header — floats above scroll area; transparent bg lets content show through */}
      <Box
        ref={headerRef}
        sx={{
          position: 'absolute',
          top: { xs: 0, md: '-1px' },
          left: { xs: 0, md: '-1px' },
          right: { xs: 0, md: '-1px' },
          zIndex: 2,
          pb: 1.5,
          bgcolor: 'transparent',
          borderLeft: { xs: 0, md: `1px solid ${fabUTokens.color.brand}` },
          borderRight: { xs: 0, md: `1px solid ${fabUTokens.color.brand}` },
          borderTop: { xs: 0, md: `1px solid ${fabUTokens.color.brand}` },
        }}
      >
        {header}
      </Box>

      <Box
        ref={footerRef}
        data-pw="app-footer"
        sx={{
          position: 'absolute',
          right: { xs: 0, md: '-1px' },
          bottom: { xs: 0, md: '-1px' },
          left: { xs: 0, md: '-1px' },
          px: 1,
          pt: 0.85,
          pb: { xs: 'max(20px, env(safe-area-inset-bottom))', md: 0.85 },
          '@supports (-moz-appearance: none)': {
            // Firefox installed PWAs can report no useful bottom safe-area inset,
            // so give the floating nav extra breathing room without changing Safari.
            pb: {
              xs: `calc(max(20px, env(safe-area-inset-bottom, 0px)) + ${FIREFOX_PWA_BOTTOM_NAV_INSET})`,
              md: 0.85,
            },
          },
          zIndex: 10,
          borderLeft: { xs: 0, md: `1px solid ${fabUTokens.color.border}` },
          borderRight: { xs: 0, md: `1px solid ${fabUTokens.color.border}` },
          bgcolor: fabUTokens.color.canvas,
        }}
      >
        {footer}
      </Box>
      {overlay}
    </Box>
  );
}

export default MobileScreen;
