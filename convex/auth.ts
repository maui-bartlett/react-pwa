import { type GenericCtx, createClient } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';

import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authConfig from './auth.config';

const siteUrl = process.env.SITE_URL ?? 'http://localhost:5173';

function optionalSocialProviders(): BetterAuthOptions['socialProviders'] {
  return {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? {
          discord: {
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
          },
        }
      : {}),
  };
}

async function sendAuthEmail({
  email,
  subject,
  url,
}: {
  email: string;
  subject: string;
  url: string;
}) {
  const webhookUrl = process.env.AUTH_EMAIL_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(`Auth email for ${email}: ${subject} ${url}`);
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, subject, url }),
  });

  if (!response.ok) {
    throw new Error(`Auth email webhook failed with ${response.status}`);
  }
}

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    appName: 'Fab U',
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [siteUrl, 'https://appleid.apple.com'],
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: optionalSocialProviders(),
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendAuthEmail({
            email,
            subject: 'Sign in to Fab U',
            url,
          });
        },
        storeToken: 'hashed',
      }),
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  });

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
