import { ConvexReactClient } from 'convex/react';

const PROD_CONVEX_URL = 'https://shocking-sardine-761.convex.cloud';
const DEV_CONVEX_URL = 'https://polite-rooster-646.convex.cloud';

/**
 * Pick the Convex deployment for this build.
 *   1. Explicit `VITE_CONVEX_URL` (Vercel env / `.env.local`) wins.
 *   2. Otherwise prod builds talk to prod and dev builds talk to dev.
 *      The fallback used to be hardcoded to dev, so a prod build
 *      without the env var silently wrote to dev — and the prod
 *      user's edits never appeared in the prod Convex tables.
 */
export const convexUrl =
  import.meta.env.VITE_CONVEX_URL || (import.meta.env.PROD ? PROD_CONVEX_URL : DEV_CONVEX_URL);

export const convex = new ConvexReactClient(convexUrl);
