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
import { z } from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./authSchemas";
import {
  createPlotSchema,
  listMyPlotsQuerySchema,
  nearbyPlotListSchema,
  nearbyPlotsQuerySchema,
  plotListSchema,
  plotSchema,
  updatePlotSchema,
} from "./plotSchemas";
import { profileSnapshotSchema, profileUpdateSchema } from "./profileSchemas";
import {
  pendingProductsQuerySchema,
  productSchema,
  productsQuerySchema,
  publishProductSchema,
  updateProductImagesSchema,
  updateProductModerationSchema,
} from "./productSchemas";
import { uploadSignatureSchema } from "./uploadSchemas";

export interface OpenApiDocument {
  openapi: "3.1.0";
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
    "application/json": {
      schema: { $ref: `#/components/schemas/${schemaRef}` },
    },
  },
});

const response = (description: string, schemaRef?: string) => ({
  description,
  ...(schemaRef
    ? {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["success", "data", "message"],
              properties: {
                success: { type: "boolean", const: true },
                data: { $ref: `#/components/schemas/${schemaRef}` },
                message: { type: "string" },
              },
            },
          },
        },
      }
    : {}),
});

const validationErrors = {
  "400": response("Solicitud malformada o cuerpo inválido"),
  "422": response("Reglas de negocio incumplidas (detalles por campo)"),
  "500": response("Error interno del servidor"),
};

const rateLimited = {
  "429": response("Demasiadas solicitudes: límite de tasa aplicado"),
};

const authOperation = (
  summary: string,
  schemaRef: string,
  responses: Record<string, unknown>,
  requiresBody = true,
) => ({
  post: {
    tags: ["Auth"],
    summary,
    ...(requiresBody ? { requestBody: jsonBody(schemaRef) } : {}),
    responses,
  },
});

/** Parámetro de ruta `id` compartido por los endpoints de una parcela. */
const plotIdParameter = {
  name: "id",
  in: "path" as const,
  required: true,
  schema: { type: "string", format: "uuid" },
};

/**
 * Convierte el JSON Schema de un objeto Zod en parámetros `in: query` de
 * OpenAPI (uno por propiedad). Los campos con `.default()` no son obligatorios.
 */
const queryParameters = (jsonSchema: Record<string, unknown>) => {
  const properties = (jsonSchema.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const required = new Set((jsonSchema.required ?? []) as string[]);

  return Object.entries(properties).map(([name, schema]) => ({
    name,
    in: "query" as const,
    required: required.has(name),
    schema,
  }));
};

export function buildOpenApiDocument(): OpenApiDocument {
  return {
    openapi: "3.1.0",
    info: {
      title: "AgroConnect API",
      version: "1.0.0",
      description:
        "Contrato de la API REST de AgroConnect (plataforma B2B+B2C agropecuaria para Colombia rural). " +
        "Generado desde los esquemas Zod de @agroconnect/contracts (ADR-015, contract-first). " +
        "Los códigos de error listados son el contrato mínimo; el detalle fino por endpoint se " +
        "documentará con la migración a NestJS (ADR-009).",
    },
    servers: [{ url: "/api/v1" }],
    paths: {
      "/auth/register": authOperation(
        "Registra un nuevo usuario (productor, comprador o transportista)",
        "RegisterRequestBody",
        {
          "201": response(
            "Usuario creado; revisa el correo para verificar la cuenta",
          ),
          "409": response("Correo o documento ya registrados"),
          ...validationErrors,
          ...rateLimited,
        },
      ),
      "/auth/login": authOperation(
        "Autentica un usuario; la sesión se entrega en cookies httpOnly",
        "LoginRequestBody",
        {
          "200": response("Sesión creada; cookies httpOnly emitidas"),
          "401": response("Credenciales inválidas"),
          "403": response("Correo sin verificar (EMAIL_NOT_VERIFIED)"),
          ...validationErrors,
          ...rateLimited,
        },
      ),
      "/auth/refresh": authOperation(
        "Renueva la sesión con la cookie httpOnly de refresh",
        "RefreshRequestBody",
        {
          "200": response("Sesión renovada; cookies httpOnly rotadas"),
          "401": response("Refresh token inválido, expirado o revocado"),
          "403": response("Correo sin verificar (EMAIL_NOT_VERIFIED)"),
          ...validationErrors,
          ...rateLimited,
        },
        false,
      ),
      "/auth/logout": authOperation(
        "Revoca la sesión y limpia las cookies",
        "LogoutRequestBody",
        {
          "204": response("Sesión revocada"),
          ...validationErrors,
        },
        false,
      ),
      "/auth/forgot-password": authOperation(
        "Envía un correo con el enlace de recuperación",
        "ForgotPasswordRequestBody",
        {
          "202": response("Respuesta neutra; no revela si el correo existe"),
          ...validationErrors,
          ...rateLimited,
        },
      ),
      "/auth/reset-password": authOperation(
        "Restablece la contraseña con un token de recuperación",
        "ResetPasswordRequestBody",
        {
          "200": response("Contraseña actualizada correctamente"),
          "401": response("Token de recuperación inválido o expirado"),
          ...validationErrors,
          ...rateLimited,
        },
      ),
      "/auth/verify-email": authOperation(
        "Verifica el correo con el token del enlace",
        "VerifyEmailRequestBody",
        {
          "200": response("Correo verificado correctamente"),
          "401": response("Token de verificación inválido o expirado"),
          ...validationErrors,
          ...rateLimited,
        },
      ),
      "/auth/resend-verification": authOperation(
        "Reenvía el correo de verificación",
        "ResendVerificationRequestBody",
        {
          "202": response("Respuesta neutra; no revela si el correo existe"),
          ...validationErrors,
          ...rateLimited,
        },
      ),
      "/plots": {
        get: {
          tags: ["Geography"],
          summary:
            "Lista paginada de las parcelas del agricultor autenticado (solo productor o administrador)",
          parameters: queryParameters(
            z.toJSONSchema(listMyPlotsQuerySchema, { io: "input" }),
          ),
          responses: {
            "200": response("Parcelas del agricultor autenticado", "PlotList"),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("El rol no puede gestionar parcelas"),
            ...validationErrors,
          },
        },
        post: {
          tags: ["Geography"],
          summary: "Registra una parcela con su geometría (PostGIS)",
          requestBody: jsonBody("CreatePlotRequestBody"),
          responses: {
            "201": response(
              "Parcela creada; centroide y área calculados por PostGIS",
              "Plot",
            ),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("El rol no puede registrar parcelas"),
            ...validationErrors,
          },
        },
      },
      "/plots/{id}": {
        get: {
          tags: ["Geography"],
          summary: "Obtiene una parcela del agricultor autenticado",
          parameters: [plotIdParameter],
          responses: {
            "200": response("Parcela solicitada", "Plot"),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("La parcela pertenece a otro agricultor"),
            "404": response("Parcela no encontrada"),
            ...validationErrors,
          },
        },
        patch: {
          tags: ["Geography"],
          summary:
            "Actualiza parcialmente una parcela del agricultor autenticado",
          parameters: [plotIdParameter],
          requestBody: jsonBody("UpdatePlotRequestBody"),
          responses: {
            "200": response(
              "Parcela actualizada; centroide y área recalculados por PostGIS",
              "Plot",
            ),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("La parcela pertenece a otro agricultor"),
            "404": response("Parcela no encontrada"),
            ...validationErrors,
          },
        },
        delete: {
          tags: ["Geography"],
          summary:
            "Elimina (soft delete) una parcela del agricultor autenticado",
          parameters: [plotIdParameter],
          responses: {
            "204": { description: "Parcela eliminada" },
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("La parcela pertenece a otro agricultor"),
            "404": response("Parcela no encontrada"),
            ...validationErrors,
          },
        },
      },
      "/plots/nearby": {
        get: {
          tags: ["Geography"],
          summary:
            "Busca parcelas dentro de un radio alrededor de un punto (PostGIS ST_DWithin)",
          // `io: 'input'`: el documento describe lo que el cliente envía; el
          // campo con `.default()` (radius) no es obligatorio en la query.
          parameters: queryParameters(
            z.toJSONSchema(nearbyPlotsQuerySchema, { io: "input" }),
          ),
          responses: {
            "200": response(
              "Parcelas dentro del radio de búsqueda, con su distancia en km",
              "NearbyPlotList",
            ),
            ...validationErrors,
          },
        },
      },
      "/profile/me": {
        get: {
          tags: ["Profile"],
          summary: "Obtiene el perfil del usuario autenticado",
          responses: {
            "200": response("Perfil del usuario", "ProfileSnapshot"),
            "401": response("Sesión ausente, expirada o inválida"),
            ...validationErrors,
          },
        },
        patch: {
          tags: ["Profile"],
          summary: "Actualiza el perfil del rol autenticado",
          requestBody: jsonBody("ProfileUpdateRequestBody"),
          responses: {
            "200": response("Perfil actualizado", "ProfileSnapshot"),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("El bloque no corresponde al rol autenticado"),
            ...validationErrors,
          },
        },
      },
      "/products": {
        get: {
          tags: ["Marketplace"],
          summary:
            "Lista los productos del marketplace con búsqueda, filtros y paginación",
          parameters: queryParameters(
            z.toJSONSchema(productsQuerySchema, { io: "input" }),
          ),
          responses: {
            "200": response("Productos del marketplace", "ProductList"),
            ...validationErrors,
          },
        },
        post: {
          tags: ["Marketplace"],
          summary: "Publica un producto (solo productor autenticado)",
          requestBody: jsonBody("PublishProductRequestBody"),
          responses: {
            "201": response("Producto publicado", "Product"),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("El rol no puede publicar productos"),
            ...validationErrors,
          },
        },
      },
      "/products/pending": {
        get: {
          tags: ["Marketplace"],
          summary:
            "Lista productos pendientes de moderación (solo administrador)",
          parameters: queryParameters(
            z.toJSONSchema(pendingProductsQuerySchema, { io: "input" }),
          ),
          responses: {
            "200": response("Productos pendientes", "ProductList"),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("El usuario no es administrador"),
            ...validationErrors,
          },
        },
      },
      "/products/{id}/moderation": {
        patch: {
          tags: ["Marketplace"],
          summary: "Aprueba o rechaza un producto (solo administrador)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: jsonBody("UpdateProductModerationRequestBody"),
          responses: {
            "200": response("Producto moderado", "Product"),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("El usuario no es administrador"),
            "404": response("Producto no encontrado"),
            ...validationErrors,
          },
        },
      },
      "/products/{id}": {
        patch: {
          tags: ["Marketplace"],
          summary: "Actualiza las imágenes de un producto del propietario",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: jsonBody("UpdateProductImagesRequestBody"),
          responses: {
            "200": response("Imágenes actualizadas", "Product"),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("El usuario no es propietario ni administrador"),
            "404": response("Producto no encontrado"),
            ...validationErrors,
          },
        },
      },
      "/uploads/signature": {
        post: {
          tags: ["Uploads"],
          summary: "Genera una firma de subida directa a Cloudinary",
          responses: {
            "200": response("Firma de subida", "UploadSignature"),
            "401": response("Sesión ausente, expirada o inválida"),
            "403": response("El rol no puede subir imágenes de producto"),
            "429": response("Demasiadas solicitudes: límite de tasa aplicado"),
            "503": response("Cloudinary no configurado en este entorno"),
          },
        },
      },
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
        NearbyPlotsQuery: z.toJSONSchema(nearbyPlotsQuerySchema, {
          io: "input",
        }),
        ListMyPlotsQuery: z.toJSONSchema(listMyPlotsQuerySchema, {
          io: "input",
        }),
        NearbyPlotList: z.toJSONSchema(nearbyPlotListSchema),
        CreatePlotRequestBody: z.toJSONSchema(createPlotSchema),
        UpdatePlotRequestBody: z.toJSONSchema(updatePlotSchema),
        Plot: z.toJSONSchema(plotSchema),
        PlotList: z.toJSONSchema(plotListSchema),
        ProductsQuery: z.toJSONSchema(productsQuerySchema, { io: "input" }),
        Product: z.toJSONSchema(productSchema),
        ProfileUpdateRequestBody: z.toJSONSchema(profileUpdateSchema),
        ProfileSnapshot: z.toJSONSchema(profileSnapshotSchema),
        PublishProductRequestBody: z.toJSONSchema(publishProductSchema),
        UpdateProductImagesRequestBody: z.toJSONSchema(
          updateProductImagesSchema,
        ),
        UpdateProductModerationRequestBody: z.toJSONSchema(
          updateProductModerationSchema,
        ),
        UploadSignature: z.toJSONSchema(uploadSignatureSchema),
        ProductList: {
          type: "array",
          items: { $ref: "#/components/schemas/Product" },
        },
      },
    },
  };
}
