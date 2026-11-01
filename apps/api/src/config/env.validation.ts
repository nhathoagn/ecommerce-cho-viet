import Joi from 'joi';

/** Values that must never reach production: the app would boot with a public secret. */
const DEV_ONLY_DEFAULTS: Record<string, string> = {
  JWT_ACCESS_SECRET: 'development-access-secret',
  JWT_REFRESH_SECRET: 'development-refresh-secret',
  OPS_API_KEY: 'local-operations-key-change-me',
};

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  WEB_URL: Joi.string().uri().default('http://localhost:5173'),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().uri().required(),
  JWT_ACCESS_SECRET: Joi.string()
    .min(16)
    .default(DEV_ONLY_DEFAULTS.JWT_ACCESS_SECRET),
  JWT_REFRESH_SECRET: Joi.string()
    .min(16)
    .default(DEV_ONLY_DEFAULTS.JWT_REFRESH_SECRET),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: Joi.number().integer().positive().default(2592000),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  OPS_API_KEY: Joi.string().min(16).default(DEV_ONLY_DEFAULTS.OPS_API_KEY),
  CLOUDFLARE_ACCOUNT_ID: Joi.string().allow('').default(''),
  CLOUDFLARE_R2_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  CLOUDFLARE_R2_BUCKET_PUBLIC: Joi.string().required(),
  CLOUDFLARE_R2_BUCKET_PRIVATE: Joi.string().required(),
  CLOUDFLARE_R2_PUBLIC_URL: Joi.string().allow('').default(''),
  // Optional overrides to point the same client at another S3-compatible store.
  S3_ENDPOINT: Joi.string().allow('').default(''),
  S3_REGION: Joi.string().allow('').default('auto'),
  S3_FORCE_PATH_STYLE: Joi.string().valid('true', 'false').default('false'),
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

  if (value.NODE_ENV === 'production') {
    const unset = Object.entries(DEV_ONLY_DEFAULTS)
      .filter(([key, devDefault]) => config[key] === undefined || config[key] === devDefault)
      .map(([key]) => key);
    if (unset.length)
      throw new Error(
        `Environment validation failed: ${unset.join(', ')} must be set to a real secret in production`,
      );
  }

  return value as Record<string, unknown>;
}
