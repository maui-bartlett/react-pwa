import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { useFabUTokens } from '../ThemeContext';

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
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 390,
        height: {
          xs: 'min(780px, calc(100dvh - 32px))',
          md: 'min(900px, calc(100dvh - 48px))',
        },
        borderRadius: '14px',
        border: `1px solid ${fabUTokens.color.border}`,
        boxShadow: '0 5px 18px rgba(31, 42, 38, 0.05)',
        overflow: 'hidden',
      }}
    >
      <Stack
        sx={{
          height: '100%',
          bgcolor: fabUTokens.isDark ? fabUTokens.color.canvas : '#ffffff',
        }}
      >
        <Box
          data-pw="content-area"
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
          }}
        >
          {/* Content — top padding reserves space below the floating header */}
          <Box ref={contentRef} sx={{ px: 1, pt: `${topPaddingHeight}px` }}>
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
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          px: 1,
          pt: 'max(16px, calc(env(safe-area-inset-top) + 8px))',
          pb: 1.5,
          bgcolor: 'transparent',
        }}
      >
        {header}
      </Box>

      <Box
        ref={footerRef}
        data-pw="app-footer"
        sx={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          px: 1,
          py: 0.85,
          zIndex: 10,
          borderTop: `1px solid ${fabUTokens.color.border}`,
          bgcolor: fabUTokens.color.surface,
        }}
      >
        {footer}
      </Box>
      {overlay}
    </Box>
  );
}

export default MobileScreen;
