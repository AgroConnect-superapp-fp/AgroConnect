# Plan T6 — Resto del incremento de acceso y perfiles

**Fecha:** 3 de octubre de 2026
**Estado:** Incrementos 2a (recuperación de contraseña) y 2b (verificación de correo) completados; este documento cubre lo restante.

---

## 1. Completado (Incrementos 2a y 2b)

| Elemento | Evidencia |
|---|---|
| Tabla `password_reset_tokens` (SHA-256, expiración 30 min, uso único) | Migración `20261003000000_add_password_reset_tokens` |
| Endpoints `POST /api/v1/auth/forgot-password` y `POST /api/v1/auth/reset-password` | 178/178 pruebas backend · 7/7 E2E |
| Casos de uso `RequestPasswordResetUseCase` y `ResetPasswordUseCase` | Tests unitarios + integración |
| Revocación de todas las sesiones tras el restablecimiento | Test de integración dedicado |
| Pantallas `ForgotPasswordScreen` y `ResetPasswordScreen` con token por URL | E2E de navegación |
| `FileEmailService` (dev: escribe en `MAIL_DIR`, sin PII en logs) | Interfaz `EmailService` lista para proveedor real |
| **2b — Verificación de correo**: tabla `email_verification_tokens` + `correo_verificado_en`, `RequestEmailVerificationUseCase` y `VerifyEmailUseCase`, endpoints `/verify-email` y `/resend-verification`, envío automático al registrar, campo `verificado` en el perfil público, pantalla `VerifyEmailScreen` con reenvío | Migración `20261003100000_add_email_verification` · 178/178 pruebas backend · 7/7 E2E |

## 2. Pendientes del T6

### 2.1 Verificación de correo al registrar — ✅ COMPLETADA (Incremento 2b)

Implementada según el diseño previsto: tabla `email_verification_tokens` + columna `correo_verificado_en`, `RequestEmailVerificationUseCase` y `VerifyEmailUseCase`, endpoints `POST /verify-email` y `POST /resend-verification`, envío automático tras el registro, `verificado` en el perfil público y pantalla `VerifyEmailScreen` con reenvío de enlace.

> Pendiente menor para 2c: proveedor SMTP real en producción (hoy `FileEmailService` escribe en `MAIL_DIR`). La regla de bloqueo de acciones sensibles para correos sin verificar se definirá al implementar M03/M08.

### 2.2 Perfiles específicos de empresa y transportista

**Empresa (ya existe el perfil básico):** ampliar `company_profiles` con `tipo_empresa`, `departamento`, `municipio` y validación de NIT contra la DIAN (servicio externo, opcional).

**Transportista (nuevo):** crear `transporter_profiles` con:
- `tipo_vehiculo` (camión, camioneta, moto, furgón)
- `placa` (validación formato colombiano `[A-Z]{3}\d{3}` o `[A-Z]{3}\d{2}[A-Z]`)
- `capacidad_kg`
- `zona_cobertura` (municipios)
- `cadena_frio` (boolean; habilita transporte de perecederos M17)
- Documentos: SOAT y licencia vigentes (fechas, validación de vigencia)

**Estimación:** 1 incremento medio (migración + registro multi-paso + tests).

### 2.3 Migración del prototipo Marketplace a la API propia (M03/M16)

**Objetivo:** retirar Supabase/PostgREST del prototipo y consumir `/api/v1` (cierra la deuda técnica registrada desde el Incremento 1).

**Trabajo:**
1. Modelo de dominio `Product` (M03) y `Plot` (M16, ya existe en backend) con repositorios Prisma.
2. Endpoints: `GET /api/v1/products` (filtros + paginación), `GET /api/v1/plots/nearby` (ya existe), `POST /api/v1/products` (productor autenticado).
3. Búsqueda geoespacial: `ST_DWithin` con índice GIST (patrón ya implementado en M16).
4. Frontend: reemplazar `services/supabase.ts` por `services/productsApi.ts`; eliminar `@supabase/supabase-js` de `package.json`.
5. Datos semilla para desarrollo (`prisma/seed.ts`).
6. E2E del flujo: buscar → filtrar por ubicación → ver detalle.

**Estimación:** 2 incrementos (catálogo + migración del prototipo).

## 3. Orden recomendado

| Prioridad | Incremento | Valor |
|---|---|---|
| ~~1~~ | ~~2b — Verificación de correo~~ | ✅ Completado el 3-oct-2026 |
| 1 | 2c — Perfiles empresa/transportista | Habilita logística y B2B reales (M06/M17) |
| 2 | 2d — Marketplace API propia | Elimina Supabase y habilita M03/M16 de punta a punta |

Cada incremento debe repetir el ciclo verificado: migración manual + tests unitarios/integración + E2E + CI en verde + evidencia documentada.
