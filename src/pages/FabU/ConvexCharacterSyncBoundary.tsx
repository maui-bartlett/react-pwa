import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import type { Character } from './atoms';
import type { CharacterHistoryControls } from './useCharacterHistory';
import { useConvexCharacterSync } from './useConvexCharacterSync';

type ConvexCharacterSyncBoundaryProps = {
  character: Character;
  history: CharacterHistoryControls;
};

function ConvexCharacterSyncWorker({ character, history }: ConvexCharacterSyncBoundaryProps) {
  useConvexCharacterSync(character, history);
  return null;
}

function ConvexCharacterSyncBoundary({ character, history }: ConvexCharacterSyncBoundaryProps) {
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const retry = () => setRetryToken((token) => token + 1);
    const retryWhenVisible = () => {
      if (document.visibilityState === 'visible') retry();
    };
    const intervalId = window.setInterval(retry, 60000);

    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);
    document.addEventListener('visibilitychange', retryWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('online', retry);
      window.removeEventListener('focus', retry);
      document.removeEventListener('visibilitychange', retryWhenVisible);
    };
  }, []);

  return (
    <ErrorBoundary
      fallbackRender={() => null}
      onError={(error) => {
        console.warn('Convex character sync is unavailable; continuing locally.', error);
      }}
      resetKeys={[retryToken]}
    >
      <ConvexCharacterSyncWorker character={character} history={history} />
    </ErrorBoundary>
  );
}

export { ConvexCharacterSyncBoundary };
