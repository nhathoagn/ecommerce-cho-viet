import { HttpException } from '@nestjs/common';
import type { Logger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './http-exception.filter.js';

function host() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return {
    json,
    status,
    arguments: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/api/health/live' }),
      }),
    },
  };
}

describe('AllExceptionsFilter', () => {
  it.each([400, 401, 402, 403, 404, 405, 406, 408, 409, 410, 415, 422, 429, 500, 501, 502, 503])(
    'writes HttpException status %s',
    (statusCode) => {
      const logger = { error: vi.fn() };
      const http = host();
      new AllExceptionsFilter(logger as unknown as Logger).catch(
        new HttpException('nope', statusCode),
        http.arguments as never,
      );
      expect(http.status).toHaveBeenCalledWith(statusCode);
      expect(http.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: { statusCode, message: 'nope' },
          path: '/api/health/live',
        }),
      );
      expect(logger.error).toHaveBeenCalledOnce();
    },
  );

  it('keeps an array message', () => {
    const http = host();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(
      new HttpException({ message: ['a', 'b'] }, 400),
      http.arguments as never,
    );
    expect(http.json.mock.calls[0]?.[0].error.message).toEqual(['a', 'b']);
  });

  it('keeps an object string message', () => {
    const http = host();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(
      new HttpException({ message: 'bad field' }, 422),
      http.arguments as never,
    );
    expect(http.json.mock.calls[0]?.[0].error.message).toBe('bad field');
  });

  it('does not return a response object that has no message', () => {
    const http = host();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(
      new HttpException({ error: 'x' }, 400),
      http.arguments as never,
    );
    const message = http.json.mock.calls[0]?.[0].error.message;
    expect(typeof message).toBe('string');
    expect(message).not.toEqual({ error: 'x' });
  });

  it('uses Error.message for a plain error', () => {
    const http = host();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(
      new Error('db down'),
      http.arguments as never,
    );
    expect(http.status).toHaveBeenCalledWith(500);
    expect(http.json.mock.calls[0]?.[0].error.message).toBe('db down');
  });

  it.each(['boom', null])('uses the fallback message for %j', (value) => {
    const http = host();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(
      value,
      http.arguments as never,
    );
    expect(http.status).toHaveBeenCalledWith(500);
    expect(http.json.mock.calls[0]?.[0].error.message).toBe('Internal server error');
  });
});
