import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation.js';

const validEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ecommerce',
  REDIS_URL: 'redis://localhost:6379',
  MOMO_ENDPOINT: 'https://test-payment.momo.vn/v2/gateway/api/create',
  MOMO_REDIRECT_URL: 'http://localhost:5173/payment/result',
  MOMO_IPN_URL: 'https://example.com/api/payments/momo/ipn',
  CLOUDFLARE_R2_BUCKET_PUBLIC: 'ecommerce-public',
  CLOUDFLARE_R2_BUCKET_PRIVATE: 'ecommerce-private',
};

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
});
