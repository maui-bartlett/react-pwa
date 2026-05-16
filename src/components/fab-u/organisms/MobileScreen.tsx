import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { useFabUTokens } from '../ThemeContext';

type MobileScreenProps = PropsWithChildren<{
  header: ReactNode;
  footer: ReactNode;
  overlay?: ReactNode;
}>;

function MobileScreen({ header, footer, overlay, children }: MobileScreenProps) {
  const fabUTokens = useFabUTokens();
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [bottomSpacerHeight, setBottomSpacerHeight] = useState(0);

  useEffect(() => {
    const scrollViewport = scrollViewportRef.current;
    const content = contentRef.current;
    const footerElement = footerRef.current;

    if (!scrollViewport || !content || !footerElement) {
      return undefined;
    }

    function updateBottomSpacer() {
      if (!scrollViewportRef.current || !contentRef.current || !footerRef.current) {
        return;
      }

      const scrollViewport = scrollViewportRef.current;
      const content = contentRef.current;
      const footerElement = footerRef.current;
      const desiredScrollAllowance = footerElement.offsetHeight + 12;
      const viewportFillRequirement = scrollViewport.clientHeight - content.offsetHeight;
      const nextSpacerHeight = Math.max(desiredScrollAllowance, viewportFillRequirement, 0);

      setBottomSpacerHeight(nextSpacerHeight);
    }

    updateBottomSpacer();

    const resizeObserver = new ResizeObserver(updateBottomSpacer);
    resizeObserver.observe(scrollViewport);
    resizeObserver.observe(content);
    resizeObserver.observe(footerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, footer]);

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
        bgcolor: fabUTokens.color.canvas,
        boxShadow: '0 5px 18px rgba(31, 42, 38, 0.05)',
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
          sx={{
            px: 1,
            pt: 'max(16px, calc(env(safe-area-inset-top) + 8px))',
            pb: 1.5,
            flexShrink: 0,
          }}
        >
          {header}
        </Box>
        <Box
          data-pw="content-area"
          ref={scrollViewportRef}
          sx={{
            px: 1,
            pt: '9px',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          <Stack ref={contentRef} spacing={2.775}>
            {children}
          </Stack>
          <Box sx={{ height: bottomSpacerHeight, flexShrink: 0 }} />
        </Box>
      </Stack>
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
