import { httpRouter } from 'convex/server';

import { authComponent, createAuth } from './auth';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedHeaders: ['x-better-auth-forwarded-host', 'x-better-auth-forwarded-proto'],
  },
});

export default http;
