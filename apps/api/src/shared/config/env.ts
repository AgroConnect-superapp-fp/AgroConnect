import { z } from 'zod';

/**
 * Validación del entorno de @agroconnect/api.
 *
 * Los NOMBRES y los valores por defecto son exactamente los del backend legacy
 * (`backend/src/config/env.ts`) para que `.env`, `.env.example` y `render.yaml`
 * sirvan tal cual durante la migración progresiva (ADR-009 / ADR-015).
 */
/**
 * Orígenes CORS declarados en `CORS_ORIGIN` (lista separada por comas).
 *
 * Se normalizan aquí y se vuelven a validar en `superRefine`: un origen con
 * comodines o sin URL absoluta no puede pasar.
 */
export function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
    DATABASE_SCHEMA: z.string().default('public'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    JWT_ISSUER: z.string().default('agroconnect-api'),
    JWT_AUDIENCE: z.string().default('agroconnect-web'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
    RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    // Saltos de proxy confiables (Render = 1). Con 0, req.ip es la IP del socket.
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    APP_BASE_URL: z.string().url().default('http://localhost:5173'),
    MAIL_DIR: z.string().default('/tmp/agroconnect-mails'),
    // SMTP real para verificación de correo y recuperación de contraseña. Sin
    // SMTP_HOST los correos se escriben en MAIL_DIR (desarrollo y pruebas).
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: z
      .union([z.literal('true'), z.literal('false')])
      .default('false')
      .transform((value) => value === 'true'),
    SMTP_FROM: z.string().default('AgroConnect <no-reply@agroconnect.co>'),
    // Cloudinary: subida firmada desde el navegador. El secreto se queda en el
    // servidor; el frontend recibe solo una firma de corta duración.
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_UPLOAD_FOLDER: z.string().default('agroconnect/products'),
    // Documentación interactiva (Swagger UI). Expone la superficie completa de
    // la API, así que en producción queda apagada salvo ENABLE_API_DOCS=true.
    // El mismo patrón booleano de SMTP_SECURE: 'true'/'false' como texto.
    ENABLE_API_DOCS: z
      .union([z.literal('true'), z.literal('false')])
      .default('false')
      .transform((value) => value === 'true'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  })
  .superRefine((data, ctx) => {
    // D5 bloquea el login hasta verificar el correo. Sin SMTP en producción el
    // FileEmailService escribiría el enlace en /tmp y nadie podría verificar.
    const cloudinaryValues = [
      data.CLOUDINARY_CLOUD_NAME,
      data.CLOUDINARY_API_KEY,
      data.CLOUDINARY_API_SECRET,
    ];
    const configured = cloudinaryValues.filter(
      (value) => typeof value === 'string' && value.trim().length > 0,
    ).length;
    if (configured > 0 && configured < cloudinaryValues.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['CLOUDINARY_CLOUD_NAME'],
        message:
          'Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET juntas, o ninguna',
      });
    }

    if (data.NODE_ENV === 'production' && (!data.SMTP_HOST || data.SMTP_HOST.trim().length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['SMTP_HOST'],
        message:
          'SMTP_HOST es obligatorio en producción: la verificación de correo (D5) bloquea el login hasta verificar',
      });
    }

    // CORS con `credentials: true`: un origen `*` hace que el paquete `cors`
    // refleje cualquier Origin, de modo que cualquier sitio podría leer las
    // respuestas autenticadas. Se exige una lista explícita de URLs absolutas
    // y, en producción, solo `https://`.
    const corsOrigins = parseCorsOrigins(data.CORS_ORIGIN);
    if (corsOrigins.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGIN'],
        message: 'CORS_ORIGIN debe declarar al menos un origen',
      });
    }

    for (const origin of corsOrigins) {
      if (origin.includes('*')) {
        ctx.addIssue({
          code: 'custom',
          path: ['CORS_ORIGIN'],
          message:
            `CORS_ORIGIN no admite comodines ("${origin}"). Con credenciales habilitadas, ` +
            'un origen comodín permite que cualquier sitio lea respuestas autenticadas. ' +
            'Declara los orígenes uno por uno.',
        });
        continue;
      }

      let parsed: URL | null = null;
      try {
        parsed = new URL(origin);
      } catch {
        parsed = null;
      }

      if (!parsed) {
        ctx.addIssue({
          code: 'custom',
          path: ['CORS_ORIGIN'],
          message: `El origen CORS "${origin}" no es una URL absoluta (debe incluir esquema y host)`,
        });
        continue;
      }

      if (data.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
        ctx.addIssue({
          code: 'custom',
          path: ['CORS_ORIGIN'],
          message: `En producción el origen CORS "${origin}" debe usar https://`,
        });
      }
    }

    // Defensa en profundidad: con el mismo secreto, un refresh token puede
    // aceptarse como access token (y al revés).
    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message:
          'JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos: ' +
          'compartir el mismo secreto permite usar un refresh token como access token',
      });
    }
  });

export type Env = z.infer<typeof envSchema> & {
  /**
   * Orígenes CORS ya validados y normalizados. Es la lista que consume
   * `app.setup.ts`; nunca se construye a partir de la cadena cruda.
   */
  readonly CORS_ORIGINS: readonly string[];
};

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

  const data = parsed.data;

  // `ENABLE_API_DOCS` sigue el patrón booleano del resto del entorno, pero su
  // valor por defecto depende del modo: fuera de producción la documentación
  // está disponible para el equipo; en producción hay que pedirla explícitamente
  // con ENABLE_API_DOCS=true porque revela la superficie completa de la API.
  const docsRequested = source['ENABLE_API_DOCS'];

  return {
    ...data,
    CORS_ORIGINS: parseCorsOrigins(data.CORS_ORIGIN),
    ENABLE_API_DOCS:
      docsRequested === undefined ? data.NODE_ENV !== 'production' : data.ENABLE_API_DOCS,
  };
}

/**
 * Entorno validado del proceso. Se evalúa al importar el módulo, por eso
 * `main.ts` carga `dotenv/config` como PRIMER import: así el `.env` ya está
 * disponible antes de validar.
 */
export const env: Env = parseEnv(process.env);
