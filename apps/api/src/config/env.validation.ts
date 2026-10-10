import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  WEB_URL: Joi.string().uri().default('http://localhost:5173'),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().uri().required(),
  JWT_ACCESS_SECRET: Joi.string().min(16).default('development-access-secret'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(16)
    .default('development-refresh-secret'),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: Joi.number().integer().positive().default(2592000),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  MOMO_PARTNER_CODE: Joi.string().allow('').default(''),
  MOMO_ACCESS_KEY: Joi.string().allow('').default(''),
  MOMO_SECRET_KEY: Joi.string().allow('').default(''),
  MOMO_ENDPOINT: Joi.string().uri().required(),
  MOMO_QUERY_ENDPOINT: Joi.string()
    .uri()
    .default('https://test-payment.momo.vn/v2/gateway/api/query'),
  MOMO_REFUND_ENDPOINT: Joi.string()
    .uri()
    .default('https://test-payment.momo.vn/v2/gateway/api/refund'),
  MOMO_REDIRECT_URL: Joi.string().uri().required(),
  MOMO_IPN_URL: Joi.string().uri().required(),
  OPS_API_KEY: Joi.string().min(16).default('local-operations-key-change-me'),
  CLOUDFLARE_ACCOUNT_ID: Joi.string().allow('').default(''),
  CLOUDFLARE_R2_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  CLOUDFLARE_R2_BUCKET_PUBLIC: Joi.string().required(),
  CLOUDFLARE_R2_BUCKET_PRIVATE: Joi.string().required(),
  CLOUDFLARE_R2_PUBLIC_URL: Joi.string().allow('').default(''),
});

export function validateEnv(config: Record<string, unknown>) {
  const { error, value } = envSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value as Record<string, unknown>;
}
