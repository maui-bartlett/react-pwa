import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

import { persistAppPathname } from '@/state/persistentAppLocation';

function PersistentAppLocation() {
  const location = useLocation();

  useLayoutEffect(() => {
    persistAppPathname(location.pathname);
  }, [location.pathname]);

  return null;
}

export default PersistentAppLocation;
