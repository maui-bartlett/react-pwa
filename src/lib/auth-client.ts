import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// Better-auth talks to the deployment's HTTP-action site (`.convex.site`),
// which MUST match the deployment the data client (`convexClient.ts`) uses.
// A prod build that authenticated against the dev site would establish a
// session the prod data client can't validate, leaving `useConvexAuth`
// permanently unauthenticated. Mirror the same prod/dev selection here.
const PROD_CONVEX_SITE_URL = 'https://shocking-sardine-761.convex.site';
const DEV_CONVEX_SITE_URL = 'https://polite-rooster-646.convex.site';

export const authBaseUrl =
  import.meta.env.VITE_CONVEX_SITE_URL ||
  (import.meta.env.PROD ? PROD_CONVEX_SITE_URL : DEV_CONVEX_SITE_URL);

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [convexClient(), crossDomainClient(), magicLinkClient()],
});
