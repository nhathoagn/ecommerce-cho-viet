import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app.factory.js';

/**
 * Vercel keeps a function process warm between invocations, so the Nest app — and
 * its Prisma pool — is created once per process instead of once per request.
 */
const ready = createApp().then((app) => app.init());

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await ready;
  // vercel.json forwards the path as ?__p=... so every depth reaches this one
  // function; Nest still expects its routes under /api.
  const [pathname, query = ''] = (req.url ?? '/').split('?');
  const params = new URLSearchParams(query);
  const forwarded = params.get('__p');
  if (forwarded !== null) {
    params.delete('__p');
    params.delete('path');
    const rest = params.toString();
    req.url = `/api/${forwarded}${rest ? `?${rest}` : ''}`;
  } else if (!pathname.startsWith('/api')) {
    req.url = `/api${req.url ?? ''}`;
  }
  return app.getHttpAdapter().getInstance()(req, res);
}
