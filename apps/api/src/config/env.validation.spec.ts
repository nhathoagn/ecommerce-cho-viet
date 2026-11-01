import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation.js';

const validEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ecommerce',
  REDIS_URL: 'redis://localhost:6379',
  CLOUDFLARE_R2_BUCKET_PUBLIC: 'ecommerce-public',
  CLOUDFLARE_R2_BUCKET_PRIVATE: 'ecommerce-private',
};

/** Production refuses the development placeholder secrets. */
const productionSecrets = {
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  OPS_API_KEY: 'c'.repeat(32),
};

const required = Object.keys(validEnv);

describe('validateEnv', () => {
  it('applies safe defaults to a valid configuration', () => {
    const result = validateEnv(validEnv);

    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3000);
    expect(result.LOG_LEVEL).toBe('info');
  });

  it('reports all missing required variables', () => {
    expect(() => validateEnv({})).toThrow('Environment validation failed');
  });

  it('names every required key when the object is empty', () => {
    expect(() => validateEnv({})).toThrow(/Environment validation failed/);
    try {
      validateEnv({});
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      for (const key of required) expect(message).toContain(key);
    }
  });

  it.each(required)('rejects a missing %s', (key) => {
    const input = { ...validEnv };
    delete input[key as keyof typeof input];
    expect(() => validateEnv(input)).toThrow(key);
  });

  it.each(required)('rejects an empty %s', (key) => {
    expect(() => validateEnv({ ...validEnv, [key]: '' })).toThrow(key);
  });

  it.each(['development', 'test'])('accepts NODE_ENV %s', (value) => {
    expect(validateEnv({ ...validEnv, NODE_ENV: value }).NODE_ENV).toBe(value);
  });

  it('accepts NODE_ENV production when the secrets are real', () => {
    expect(validateEnv({ ...validEnv, ...productionSecrets, NODE_ENV: 'production' }).NODE_ENV).toBe('production');
  });

  it.each(Object.keys(productionSecrets))('refuses the development placeholder %s in production', (key) => {
    const input = { ...validEnv, ...productionSecrets, NODE_ENV: 'production' };
    delete (input as Record<string, unknown>)[key];
    expect(() => validateEnv(input)).toThrow(key);
  });

  it.each(['staging', '', '1'])('rejects NODE_ENV %j', (value) => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: value })).toThrow('NODE_ENV');
  });

  it.each([1, 80, 3000, 65535])('accepts PORT %s', (port) => {
    expect(validateEnv({ ...validEnv, PORT: port }).PORT).toBe(port);
  });

  it.each([-1, 65536, 70000, 'abc'])('rejects PORT %j', (port) => {
    expect(() => validateEnv({ ...validEnv, PORT: port })).toThrow('PORT');
  });

  it.each(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])(
    'accepts LOG_LEVEL %s',
    (level) => {
      expect(validateEnv({ ...validEnv, LOG_LEVEL: level }).LOG_LEVEL).toBe(level);
    },
  );

  it.each(['verbose', '', 'INFO'])('rejects LOG_LEVEL %j', (level) => {
    expect(() => validateEnv({ ...validEnv, LOG_LEVEL: level })).toThrow('LOG_LEVEL');
  });

  it.each(['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'OPS_API_KEY'])(
    'rejects a 15 character %s',
    (key) => {
      expect(() => validateEnv({ ...validEnv, [key]: 'a'.repeat(15) })).toThrow(key);
    },
  );

  it.each(['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'OPS_API_KEY'])(
    'accepts a 16 character %s',
    (key) => {
      const secret = 'a'.repeat(16);
      expect(validateEnv({ ...validEnv, [key]: secret })[key]).toBe(secret);
    },
  );

  it('defaults JWT and ops secrets', () => {
    const result = validateEnv(validEnv);
    expect(result.JWT_ACCESS_SECRET).toBe('development-access-secret');
    expect(result.JWT_REFRESH_SECRET).toBe('development-refresh-secret');
    expect(result.OPS_API_KEY).toBe('local-operations-key-change-me');
    expect(result.JWT_ACCESS_TTL_SECONDS).toBe(900);
    expect(result.JWT_REFRESH_TTL_SECONDS).toBe(2592000);
    expect(result.WEB_URL).toBe('http://localhost:5173');
  });

  it.each([
    ['JWT_ACCESS_TTL_SECONDS', 0],
    ['JWT_ACCESS_TTL_SECONDS', -1],
    ['JWT_REFRESH_TTL_SECONDS', 0],
    ['JWT_REFRESH_TTL_SECONDS', -5],
  ])('rejects %s %s', (key, value) => {
    expect(() => validateEnv({ ...validEnv, [key]: value })).toThrow(key);
  });

  it('accepts a positive access ttl', () => {
    expect(
      validateEnv({ ...validEnv, JWT_ACCESS_TTL_SECONDS: 1 }).JWT_ACCESS_TTL_SECONDS,
    ).toBe(1);
  });

  it.each(['REDIS_URL', 'WEB_URL'])('rejects a non-URI %s', (key) => {
    expect(() => validateEnv({ ...validEnv, [key]: 'not a uri' })).toThrow(key);
  });

  it.each([
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_PUBLIC_URL',
  ])('allows an empty %s', (key) => {
    expect(validateEnv({ ...validEnv, [key]: '' })[key]).toBe('');
  });

  it('keeps unknown keys', () => {
    expect(validateEnv({ ...validEnv, EXTRA: 'kept' }).EXTRA).toBe('kept');
  });
});
