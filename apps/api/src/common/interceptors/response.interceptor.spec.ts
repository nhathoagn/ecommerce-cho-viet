import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ResponseInterceptor } from './response.interceptor.js';

function context(url: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ url }) }),
  };
}

async function intercept(url: string, value: unknown) {
  const result = new ResponseInterceptor().intercept(context(url) as never, {
    handle: () => of(value),
  });
  return firstValueFrom(result);
}

describe('ResponseInterceptor', () => {
  it.each([
    [{ status: 'ok' }, { status: 'ok' }],
    [null, null],
    [undefined, undefined],
    [0, 0],
    [false, false],
    ['', ''],
    [[], []],
    [[1], [1]],
    [12, 12],
    [{ a: { b: 1 } }, { a: { b: 1 } }],
  ])('wraps %j', async (value, data) => {
    const body = await intercept('/api/health/live', value);
    expect(body).toMatchObject({ success: true, data, path: '/api/health/live' });
    expect(Number.isNaN(Date.parse((body as { timestamp: string }).timestamp))).toBe(false);
  });

  it.each(['/api/products', '/api/cart', '/api/orders', '/', ''])(
    'keeps path %j',
    async (path) => {
      const body = await intercept(path, { ok: true });
      expect(body).toMatchObject({ success: true, data: { ok: true }, path });
    },
  );
});
