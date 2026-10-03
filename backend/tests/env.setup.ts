process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_test?schema=public';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test_access_secret_with_at_least_32_characters_ok';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret_with_at_least_32_characters_ok';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_ATTEMPTS = '1000';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'fatal';
