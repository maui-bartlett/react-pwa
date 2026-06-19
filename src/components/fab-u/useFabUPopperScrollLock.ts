import { useEffect } from 'react';

let lockCount = 0;
let lockedViewport: HTMLElement | null = null;
let previousOverflowY = '';

function useFabUPopperScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const scrollViewport = document.querySelector<HTMLElement>('[data-pw="content-area"]');
    if (!scrollViewport) return;

    if (lockCount === 0) {
      lockedViewport = scrollViewport;
      previousOverflowY = scrollViewport.style.overflowY;
      scrollViewport.style.overflowY = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0 && lockedViewport) {
        lockedViewport.style.overflowY = previousOverflowY;
        lockedViewport = null;
        previousOverflowY = '';
      }
    };
  }, [open]);
}

export default useFabUPopperScrollLock;
