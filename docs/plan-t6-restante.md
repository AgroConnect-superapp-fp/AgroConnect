# Plan T6 — Resto del incremento de acceso y perfiles

**Fecha:** 3 de octubre de 2026
**Estado:** Incrementos 2a, 2b, 2.3a/2.3b (marketplace), 2c (perfiles de registro) y 2.4 (perfil autenticado GET/PATCH) completados.

---

## 1. Completado (Incrementos 2a y 2b)

| Elemento                                                                                                                                                                                                                                                                                                                    | Evidencia                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Tabla `password_reset_tokens` (SHA-256, expiración 30 min, uso único)                                                                                                                                                                                                                                                       | Migración `20261003000000_add_password_reset_tokens`                                  |
| Endpoints `POST /api/v1/auth/forgot-password` y `POST /api/v1/auth/reset-password`                                                                                                                                                                                                                                          | 178/178 pruebas backend · 7/7 E2E                                                     |
| Casos de uso `RequestPasswordResetUseCase` y `ResetPasswordUseCase`                                                                                                                                                                                                                                                         | Tests unitarios + integración                                                         |
| Revocación de todas las sesiones tras el restablecimiento                                                                                                                                                                                                                                                                   | Test de integración dedicado                                                          |
| Pantallas `ForgotPasswordScreen` y `ResetPasswordScreen` con token por URL                                                                                                                                                                                                                                                  | E2E de navegación                                                                     |
| `FileEmailService` (dev: escribe en `MAIL_DIR`, sin PII en logs)                                                                                                                                                                                                                                                            | Interfaz `EmailService` lista para proveedor real                                     |
| **2b — Verificación de correo**: tabla `email_verification_tokens` + `correo_verificado_en`, `RequestEmailVerificationUseCase` y `VerifyEmailUseCase`, endpoints `/verify-email` y `/resend-verification`, envío automático al registrar, campo `verificado` en el perfil público, pantalla `VerifyEmailScreen` con reenvío | Migración `20261003100000_add_email_verification` · 178/178 pruebas backend · 7/7 E2E |

## 2. Pendientes del T6

### 2.1 Verificación de correo al registrar — ✅ COMPLETADA (Incremento 2b)

Implementada según el diseño previsto: tabla `email_verification_tokens` + columna `correo_verificado_en`, `RequestEmailVerificationUseCase` y `VerifyEmailUseCase`, endpoints `POST /verify-email` y `POST /resend-verification`, envío automático tras el registro, `verificado` en el perfil público y pantalla `VerifyEmailScreen` con reenvío de enlace.

> `SmtpEmailService` es obligatorio en producción (`SMTP_HOST`); `FileEmailService` queda solo para desarrollo y pruebas. La regla de bloqueo de acciones sensibles para correos sin verificar se definirá al implementar M03/M08.

### 2.2 Perfiles específicos de empresa y transportista

**Estado:** ✅ implementado el 3-nov-2026 con migración `20261103140000_add_company_transporter_profiles`, validación de dominio, registro UI y pruebas.

**Empresa (ya existe el perfil básico):** ampliar `company_profiles` con `tipo_empresa`, `departamento`, `municipio` y validación de NIT contra la DIAN (servicio externo, opcional).

**Transportista (nuevo):** crear `transporter_profiles` con:

- `tipo_vehiculo` (camión, camioneta, moto, furgón)
- `placa` (validación formato colombiano `[A-Z]{3}\d{3}` o `[A-Z]{3}\d{2}[A-Z]`)
- `capacidad_kg`
- `zona_cobertura` (municipios)
- `cadena_frio` (boolean; habilita transporte de perecederos M17)
- Documentos: SOAT y licencia vigentes (fechas, validación de vigencia)

**Estimación:** completado; validación DIAN y carga de documentos quedan como mejoras futuras.

### 2.3 Migración del prototipo Marketplace a la API propia (M03/M16)

**Estado:** 2.3a (catálogo de lectura) y 2.3b (publicación autenticada) **completadas el 2026-11-03**.

**Objetivo:** retirar Supabase/PostgREST del prototipo y consumir `/api/v1` (cierra la deuda técnica registrada desde el Incremento 1).

**Implementado (2.3a/2.3b):**

1. Modelo Prisma `Product` (M03) con enums de cultivo/certificación, JSONB de imágenes/coordenadas, checks de productividad/coordenadas e índices; migración `20261103114851_add_marketplace_products`.
2. `GET /api/v1/products` con búsqueda, filtros (`crop`, `department`, `municipality`, `certification`), `limit`/`offset` y contrato Zod/OpenAPI en `@agroconnect/contracts`.
3. Módulo `marketplace` con dominio, puerto, casos de uso, repositorio Prisma y controller; 240 pruebas backend y cobertura 83.26 % de ramas.
4. Frontend: `services/productsApi.ts` reemplaza `services/supabase.ts`; se eliminó `@supabase/supabase-js`; fallback demo si la API no responde.
5. Seed idempotente de 10 productos (`scripts/seed-products.ts`).
6. `POST /api/v1/products` con `SessionAuthGuard`, autorización productor/administrador, `producerId` desde la sesión y formulario `PublishProductScreen` con carga a Cloudinary.
7. E2E 14/14: demo/fallback contra `/api/v1/products`, autenticación, marketplace y publicación real de una cosecha con imagen.

**Mejoras futuras:** búsqueda geoespacial de productos por radio si el catálogo lo requiere; prueba E2E de publicación con Cloudinary real (hoy la firma y la CDN están simuladas).

**Estimación:** 2.3a/2.3b completadas.

### 2.4 Perfil autenticado GET/PATCH — ✅ COMPLETADA (2026-11-04)

Implementado `GET/PATCH /api/v1/profile/me` con `SessionAuthGuard` (cookie
httpOnly), contrato Zod/OpenAPI, autorización por rol y validación de dominio.
La edición permite actualizar únicamente el bloque del rol en sesión:

- Productor: nombre de finca, municipio, vereda y coordenadas PostGIS.
- Empresa: razón social, dirección, tipo, departamento y municipio; NIT no editable.
- Transportista: vehículo, placa, capacidad, cobertura, cadena de frío y vigencias.

Frontend: `ProfileScreen` + botón **Mi perfil** en el panel. Evidencia: 267
pruebas backend, cobertura 82.21 % de ramas, 52 unitarios frontend y 14/14 E2E.

**Mejoras futuras:** historial de cambios de perfil y carga de documentos
(SOAT, licencia, cámara de comercio) a Cloudinary firmado.

### 2.5 Imágenes firmadas y edición por propietario — ✅ COMPLETADA (2026-11-04)

- `POST /api/v1/uploads/signature`: firma SHA-1 server-side, carpeta por
  usuario, formatos permitidos y rate limit; el `api_secret` no sale del backend.
- `PATCH /api/v1/products/:id`: reemplazo de hasta 6 imágenes con validación
  de rol y propiedad (BOLA).
- Frontend: la subida usa la firma; el modal persiste las imágenes y actualiza
  la galería sin duplicarlas.
- Evidencia: 297 tests backend (82.32 % ramas), 52 unitarios frontend y 14/14 E2E.
- Moderación previa implementada: `pending` por defecto, catálogo público solo `approved` y endpoints administrativos (ADR-023).

### 2.6 Decisiones de producto

Decisiones aprobadas por Fabián Gallego el 2026-11-05; el despliegue sigue
pendiente de acceso.

| Tema              | Decisión necesaria                                                      | Estado        |
| ----------------- | ----------------------------------------------------------------------- | ------------- |
| Moderación        | Aprobación previa por administrador; publicaciones nuevas en `pending`. | ✅ 2026-11-05 |
| Precio/inventario | Vitrina sin precio/stock hasta cerrar pagos y logística.                | ✅ 2026-11-05 |
| D7                | Tabla de equivalencias aprobada por Fabián Gallego.                     | ✅ 2026-11-05 |
| Despliegue        | Proveer PostgreSQL, Cloudinary y accesos Render/Vercel.                 | ⏳            |

Decisiones registradas en ADR-022 y ADR-023. D7: la aprobación cubre la tabla
de equivalencias (HU06→HU14, HU15→HU08, HU04→HU11) y HU33→CU#31; HU08, HU28 y
HU30 no tienen equivalencia explícita en el SSOT y no se inventan.

## 3. Orden recomendado

| Prioridad | Incremento                                          | Valor                                                         |
| --------- | --------------------------------------------------- | ------------------------------------------------------------- |
| ~~1~~     | ~~2b — Verificación de correo~~                     | ✅ Completado el 3-oct-2026                                   |
| ~~1~~     | ~~2c — Perfiles empresa/transportista~~             | ✅ Completado el 3-nov-2026                                   |
| ~~2~~     | ~~2d — Marketplace API propia (2.3a lectura)~~      | ✅ Completado el 3-nov-2026: elimina Supabase del marketplace |
| ~~3~~     | ~~2.3b — Publicación autenticada de productos~~     | ✅ Completado el 3-nov-2026                                   |
| ~~4~~     | ~~2.4 — Perfil autenticado GET/PATCH~~              | ✅ Completado el 4-nov-2026                                   |
| ~~5~~     | ~~2.5 — Imágenes firmadas y PATCH por propietario~~ | ✅ Completado el 4-nov-2026                                   |

Cada incremento debe repetir el ciclo verificado: migración manual + tests unitarios/integración + E2E + CI en verde + evidencia documentada.
