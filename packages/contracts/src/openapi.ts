/**
 * Generador del documento OpenAPI 3.1 a partir de los esquemas Zod (ADR-015).
 *
 * OpenAPI 3.1 usa JSON Schema 2020-12 como dialecto de esquemas, y Zod 4 lo
 * produce nativamente con `z.toJSONSchema`. Así el contrato vive una sola vez
 * (Zod) y el OpenAPI es un artefacto derivado, verificado por `check:drift`.
 *
 * Los refinements de Zod (`.refine`, `.trim`, `.toLowerCase`) no son
 * representables en JSON Schema y se omiten del documento; la validación
 * autoritativa siempre es el esquema Zod que consume el servidor.
 */
import { z } from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './authSchemas';

export interface OpenApiDocument {
  openapi: '3.1.0';
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string }[];
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, unknown>;
  };
}

const jsonBody = (schemaRef: string) => ({
  required: true,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${schemaRef}` },
    },
  },
});

const response = (description: string, schemaRef?: string) => ({
  description,
  ...(schemaRef
    ? {
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schemaRef}` },
          },
        },
      }
    : {}),
});

const validationErrors = {
  '400': response('Solicitud malformada o cuerpo inválido'),
  '422': response('Reglas de negocio incumplidas (detalles por campo)'),
  '500': response('Error interno del servidor'),
};

const rateLimited = {
  '429': response('Demasiadas solicitudes: límite de tasa aplicado'),
};

const authOperation = (summary: string, schemaRef: string, responses: Record<string, unknown>) => ({
  post: {
    tags: ['Auth'],
    summary,
    requestBody: jsonBody(schemaRef),
    responses,
  },
});

export function buildOpenApiDocument(): OpenApiDocument {
  return {
    openapi: '3.1.0',
    info: {
      title: 'AgroConnect API',
      version: '1.0.0',
      description:
        'Contrato de la API REST de AgroConnect (plataforma B2B+B2C agropecuaria para Colombia rural). ' +
        'Generado desde los esquemas Zod de @agroconnect/contracts (ADR-015, contract-first). ' +
        'Los códigos de error listados son el contrato mínimo; el detalle fino por endpoint se ' +
        'documentará con la migración a NestJS (ADR-009).',
    },
    servers: [{ url: '/api/v1' }],
    paths: {
      '/auth/register': authOperation('Registra un nuevo usuario (productor, comprador o transportista)', 'RegisterRequestBody', {
        '201': response('Usuario creado; se envía correo de verificación'),
        '409': response('Correo o documento ya registrados'),
        ...validationErrors,
        ...rateLimited,
      }),
      '/auth/login': authOperation('Autentica un usuario y emite tokens JWT', 'LoginRequestBody', {
        '200': response('Tokens de acceso y refresco emitidos'),
        '401': response('Credenciales inválidas o correo sin verificar'),
        ...validationErrors,
        ...rateLimited,
      }),
      '/auth/refresh': authOperation('Renueva el par de tokens con un refresh token válido', 'RefreshRequestBody', {
        '200': response('Nuevos tokens emitidos'),
        '401': response('Refresh token inválido, expirado o revocado'),
        ...validationErrors,
        ...rateLimited,
      }),
      '/auth/logout': authOperation('Revoca la sesión del refresh token entregado', 'LogoutRequestBody', {
        '204': response('Sesión revocada'),
        ...validationErrors,
      }),
      '/auth/forgot-password': authOperation('Envía un correo con el enlace de recuperación', 'ForgotPasswordRequestBody', {
        '200': response('Respuesta neutra; no revela si el correo existe'),
        ...validationErrors,
        ...rateLimited,
      }),
      '/auth/reset-password': authOperation('Restablece la contraseña con un token de recuperación', 'ResetPasswordRequestBody', {
        '200': response('Contraseña actualizada correctamente'),
        '401': response('Token de recuperación inválido o expirado'),
        ...validationErrors,
        ...rateLimited,
      }),
      '/auth/verify-email': authOperation('Verifica el correo con el token del enlace', 'VerifyEmailRequestBody', {
        '200': response('Correo verificado correctamente'),
        '401': response('Token de verificación inválido o expirado'),
        ...validationErrors,
        ...rateLimited,
      }),
      '/auth/resend-verification': authOperation('Reenvía el correo de verificación', 'ResendVerificationRequestBody', {
        '200': response('Respuesta neutra; no revela si el correo existe'),
        ...validationErrors,
        ...rateLimited,
      }),
    },
    components: {
      schemas: {
        RegisterRequestBody: z.toJSONSchema(registerSchema),
        LoginRequestBody: z.toJSONSchema(loginSchema),
        RefreshRequestBody: z.toJSONSchema(refreshSchema),
        LogoutRequestBody: z.toJSONSchema(logoutSchema),
        ForgotPasswordRequestBody: z.toJSONSchema(forgotPasswordSchema),
        ResetPasswordRequestBody: z.toJSONSchema(resetPasswordSchema),
        VerifyEmailRequestBody: z.toJSONSchema(verifyEmailSchema),
        ResendVerificationRequestBody: z.toJSONSchema(resendVerificationSchema),
      },
    },
  };
}
