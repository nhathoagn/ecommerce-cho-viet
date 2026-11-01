import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app.factory.js';

/**
 * Vercel keeps a function process warm between invocations, so the Nest app — and
 * its Prisma pool — is created once per process instead of once per request.
 */
const ready = createApp().then((app) => app.init());

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await ready;
  // Nest routes are registered under /api; restore the prefix if the platform
  // handed us the path already stripped.
  if (!req.url?.startsWith('/api')) req.url = `/api${req.url ?? ''}`;
  return app.getHttpAdapter().getInstance()(req, res);
}
