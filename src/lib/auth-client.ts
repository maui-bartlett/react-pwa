import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authBaseUrl =
  import.meta.env.VITE_CONVEX_SITE_URL || 'https://polite-rooster-646.convex.site';

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [convexClient(), crossDomainClient(), magicLinkClient()],
});
