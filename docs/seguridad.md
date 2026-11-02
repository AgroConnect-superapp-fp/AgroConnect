# Línea base de seguridad — AgroConnect

Referencias: OWASP ASVS 4.0.3 nivel 2 y OWASP API Security Top 10 (2023). Este documento registra el estado de cada control y sirve de checklist en la revisión de PR.

**Leyenda:** ✅ implementado · 🟡 parcial · ⏳ planificado (incremento indicado).

## Autenticación y sesión (ASVS V2, V3)

| Control | Estado | Evidencia o plan |
|---|---|---|
| Contraseñas con hash adaptativo | ✅ bcrypt (12 rondas) · ⏳ Argon2id con re-hash progresivo | `BcryptPasswordHasher`, ADR-010 |
| Política de contraseña (8–72, letra + número) | ✅ | `Password` (value object), esquemas Zod |
| Mensajes genéricos ante credenciales inválidas | ✅ | `InvalidCredentialsError` |
| Rate limiting por IP real y por ruta | ✅ | PR #51: `TRUST_PROXY` + un limitador por endpoint |
| Access token corto (15 min) y algoritmo fijado | ✅ | PR #51 (`HS256`) |
| Refresh token rotativo, hasheado y de un solo uso | ✅ | PR #51 (rotación atómica) |
| Detección de reutilización (revocar la familia) | ⏳ | ADR-010, migración NestJS |
| Refresh token en cookie httpOnly; access token en memoria | ⏳ | ADR-010 |
| Enlaces de recuperación y verificación de un solo uso, con TTL | ✅ | PR #51 (`consume()` atómico) |
| Envío real de correos en producción | ⏳ | Adaptador SMTP (hoy `FileEmailService`) |

## Control de acceso (ASVS V4 · API1, API3, API5)

| Control | Estado | Evidencia o plan |
|---|---|---|
| Sin auto-registro de roles privilegiados | ✅ | PR #51 (`ROLE_NOT_ALLOWED`) |
| Autenticación obligatoria en rutas privadas (guard) | ⏳ | `JwtAuthGuard` (NestJS) |
| RBAC por permisos | ⏳ | `RolesGuard` / `@Permissions` |
| Autorización por propiedad del recurso (BOLA) | ⏳ | Políticas por módulo (el productor solo edita lo suyo) |
| Filtrado de campos de salida (sin `passwordHash`) | ✅ | `toPublicProfile()` |

## Validación, inyección y XSS (ASVS V5 · API8)

| Control | Estado | Evidencia o plan |
|---|---|---|
| Validación de entrada en el borde (Zod) | ✅ body · ⏳ query y params en `geo` | `validateBody`; en NestJS, `ZodValidationPipe` |
| SQL parametrizado (sin `$queryRawUnsafe`) | ✅ | Tagged templates de Prisma |
| Sin HTML de terceros sin escapar | ✅ | PR #51 (`escapeHtml` en geosearch) |
| Filtros PostgREST sin interpolación | ⏳ | Se elimina el acceso directo a Supabase desde el frontend |

## Configuración, transporte y cabeceras (ASVS V14 · API8)

| Control | Estado | Evidencia o plan |
|---|---|---|
| Helmet en la API | ✅ | `app.ts` |
| CORS con lista blanca por entorno (sin localhost en producción) | ✅ | PR #51 (`render.yaml`) |
| CSP, HSTS, X-Frame-Options y Referrer-Policy en el frontend | ⏳ | `frontend/vercel.json` |
| Secretos solo por variables de entorno, validados al arrancar | ✅ | `config/env.ts` (zod) |
| Subidas a Cloudinary firmadas por el backend | ⏳ | Hoy se usa un preset sin firmar |

## Registro y monitoreo (ASVS V7)

| Control | Estado | Evidencia o plan |
|---|---|---|
| Logs JSON con correlationId y redacción de PII | ✅ | `logger.ts`, `correlationId` |
| Monitoreo de errores (Sentry) | ⏳ | ADR-009 |
| Bitácora de auditoría de acciones administrativas (RF-35) | ⏳ | Módulo `audit` |

## Cadena de suministro (CI)

| Control | Estado |
|---|---|
| `npm audit --audit-level=high` en el CI | ✅ |
| CodeQL (security-and-quality) | ✅ |
| Dependabot, secret scanning y push protection | ✅ |
| `pip-audit` para el satélite Python | ⏳ (ADR-014) |
