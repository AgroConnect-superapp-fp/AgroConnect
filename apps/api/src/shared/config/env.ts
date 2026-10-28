import { z } from 'zod';

/**
 * Validación del entorno de @agroconnect/api.
 *
 * Los NOMBRES y los valores por defecto son exactamente los del backend legacy
 * (`backend/src/config/env.ts`) para que `.env`, `.env.example` y `render.yaml`
 * sirvan tal cual durante la migración progresiva (ADR-009 / ADR-015).
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  DATABASE_SCHEMA: z.string().default('public'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Saltos de proxy confiables (Render = 1). Con 0, req.ip es la IP del socket.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  APP_BASE_URL: z.string().url().default('http://localhost:5173'),
  MAIL_DIR: z.string().default('/tmp/agroconnect-mails'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida un objeto de entorno y devuelve el objeto tipado.
 * Lanza un error legible (nunca stack para el cliente) si algo falta.
 */
export function parseEnv(source: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${missing}`);
  }

  return parsed.data;
}

/**
 * Entorno validado del proceso. Se evalúa al importar el módulo, por eso
 * `main.ts` carga `dotenv/config` como PRIMER import: así el `.env` ya está
 * disponible antes de validar.
 */
export const env: Env = parseEnv(process.env);
