# Verificación de cumplimiento — Incremento 1 (T5)

**Fecha:** 28 de septiembre de 2026
**Alcance:** comprobar que el software construido cumple, punto por punto, lo documentado en los entregables 01 a 06 del proyecto formativo AgroConnect (SENA ADSO, Ficha 3292136).
**Método:** cada afirmación de los documentos se contrasta con evidencia ejecutable en el repositorio (código, migraciones, pruebas y comandos reproducibles).

---

## 1. Documento 01 — ETIP y Resumen Proyecto Formativo

| Compromiso documentado | Evidencia en el software | Estado |
|---|---|---|
| Stack oficial: React + Vite + TypeScript + Tailwind (frontend) | `frontend/package.json`, pantallas en `frontend/src/auth/` | Cumplido |
| Stack oficial: Node.js + Express + TypeScript (backend, "planificado" en el ETIP) | `backend/package.json`, `backend/src/app.ts` | Cumplido |
| PostgreSQL 16 + PostGIS 3.4 como arquitectura oficial (el prototipo usaba Supabase/PostgREST) | `backend/prisma/schema.prisma` + contenedor `postgis/postgis:16-3.4`; el incremento ya no depende de Supabase | Cumplido |
| Prisma ORM y migraciones | `backend/prisma/migrations/20260928041427_init_auth/` | Cumplido |
| Seguridad: JWT + refresh tokens y control de acceso por roles | `JwtTokenService`, `RefreshTokenUseCase`, rol en el payload del token | Cumplido |
| Limitación de intentos (rate limiting) | `rateLimiters.ts` (login y forgot-password) | Cumplido |
| 2FA diferido (según entregables 03 y 04) | Declarado fuera del alcance del incremento | Cumplido (diferido con nombre propio) |
| MVP: Usuarios → Productos → Inventario (Sprint 10) | Incremento 1 = Usuarios (M02, RF-05, CU#01, HU01); los demás están planificados en el panel | Cumplido |
| Prohibiciones del SPEC: sin `any` en producción | ESLint `@typescript-eslint/no-explicit-any: error` en `src/**` | Cumplido |
| Prohibiciones del SPEC: sin `console.log` en backend | ESLint `no-console: error` en el backend | Cumplido |
| Prohibiciones del SPEC: sin secretos en el código | `.env` ignorado por git; verificado con `git check-ignore` | Cumplido |
| Prohibiciones del SPEC: distancias/áreas en PostGIS, no en JS | Coordenadas almacenadas con `geography(Point,4326)` y `ST_MakePoint` en el repositorio | Cumplido |

## 2. Documento 02 — Taller MVP y Ruta de Construcción

| Compromiso documentado | Evidencia | Estado |
|---|---|---|
| Primera funcionalidad del MVP: registro y autenticación de usuarios | Módulo `auth` completo en backend y frontend | Cumplido |
| No cambiar el alcance definido | Sin funcionalidades adicionales al incremento; los demás incrementos quedan planificados | Cumplido |

## 3. Documento 03 — Diseño Técnico de la Primera Funcionalidad

| Compromiso documentado | Evidencia | Estado |
|---|---|---|
| Tabla 3 — Capas Clean Architecture (presentación, aplicación, dominio, infraestructura, transversal) | Estructura `backend/src/modules/auth/{domain,application,infrastructure,presentation}` + `shared/` | Cumplido |
| Tabla 4 — Flujo en 5 pasos (usuario → frontend → backend → BD → respuesta) | Recorrido verificado con smoke test 12/12 y E2E Playwright | Cumplido |
| Tabla 5 — Modelo de datos: `users`, `roles`, `producer_profiles`, `company_profiles`, `refresh_tokens` | Migración `init_auth` crea las 5 tablas con los campos documentados | Cumplido |
| Coordenadas de finca con PostGIS (`Geography/Point 4326`), nunca en JavaScript | Columna `coordenadas geography(Point, 4326)` + índice GIST + `ST_MakePoint` en transacción | Cumplido |
| Tabla 6 — 5 endpoints bajo `/api/v1/auth` con sus códigos | `register` (201/409/422), `login` (200/401/422/429), `refresh` (200/401), `logout` (204), `forgot-password` (202) | Cumplido |
| Contrato JSON de ejemplo del registro | Contrato implementado; respuesta real verificada por curl | Cumplido |
| Tabla 7 — Errores estandarizados | `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `RATE_LIMITED`, `INTERNAL_ERROR` en `AuthErrors` y `errorHandler` | Cumplido |
| Seguridad: bcrypt, unicidad en servidor, Zod, JWT corto + refresh rotativo con revocación, rate limiting, Ley 1581, sin stack traces ni PII en logs | `BcryptPasswordHasher`, `RegisterUserUseCase`, `authSchemas`, `JwtTokenService` (jti + rotación), `rateLimiters`, `acceptsDataProcessing`, `logger.ts` con redacción | Cumplido |
| Tabla 8 — Pruebas: unitarias (Jest), integración (Jest + Supertest) y E2E (Playwright) con cobertura ≥ 80 % | 111 pruebas + 4 E2E; cobertura global: 95.9 % statements, 82.2 % branches, 94.3 % functions, 96.1 % lines | Cumplido |
| Tabla 9 — Criterios de aceptación CA1–CA7 de HU01 verificados por prueba | Ver §6 de este documento (mapeo CA → prueba) | Cumplido |
| Tabla 11 — Estado de preparación (todo "Pendiente" debía resolverse en construcción) | Proyecto ejecutable, migración, endpoints, pantallas, pruebas y seguridad implementados | Cumplido |

## 4. Documento 04 — Qué Necesitamos para Comenzar a Implementar

| Compromiso documentado | Evidencia | Estado |
|---|---|---|
| Los 7 elementos (actor, interfaz, datos, proceso, BD, comunicación, prueba) | Implementados y verificados de extremo a extremo | Cumplido |
| Tabla 4 — Dependencias: backend ejecutable | `npm run dev` levanta Express con Pino y manejo de errores | Cumplido |
| Tabla 4 — Schema Prisma y migración inicial | Migración aplicada en dev y test; 5 tablas + 5 roles sembrados | Cumplido |
| Tabla 4 — Endpoints `/api/v1/auth/*` | 5 endpoints implementados y probados | Cumplido |
| Tabla 4 — Pantallas React (bienvenida, rol, registro, login) | `frontend/src/auth/screens/` (4 pantallas + panel por rol) | Cumplido |
| Tabla 4 — Servicios de seguridad (bcrypt, JWT, Zod, rate limiting) | Implementados con pruebas | Cumplido |
| Tabla 4 — Suite de pruebas y CI | Jest + Supertest + Playwright + `.github/workflows/ci.yml` | Cumplido |
| Tabla 9 — Plan de arranque (6 pasos con criterio de terminado) | Los 6 pasos completados en orden | Cumplido |
| Veredicto: "lo pendiente es construcción, no decisiones" | Construcción completada sin abrir nuevas decisiones | Cumplido |

## 5. Documento 05 — Del Diseño al Primer Incremento Funcional

| Compromiso documentado | Evidencia | Estado |
|---|---|---|
| Tabla 1 — Recorrido de 7 estaciones demostrable | Verificado con el smoke test 12/12 y E2E | Cumplido |
| Tabla 3 — Prueba de los 5 minutos (respuestas cerradas) | Todas ejecutables: quién (productor/multi-rol), qué (crea cuenta y habilita sesión), datos (8 campos), proceso (validar → duplicados → bcrypt → transacción → tokens) y comprobación (201 + fila + login 200) | Cumplido |
| Tabla 5 — Recorrido real con artefacto por estación | Cada estación tiene su artefacto en el repositorio (pantallas, cliente HTTP, casos de uso, repositorio Prisma, controlador) | Cumplido |
| Tabla 7 — Caso exitoso con datos reales (María Fernanda López, finca El Mirador, Salento, Boquía) | Reproducido en smoke test; verificado con SELECT: usuario, rol productor, contraseña bcrypt y `POINT(-75.5703 4.6371)` | Cumplido |
| Tabla 8 — Casos de error (422, 409, 401, 429, doble clic) | Cubiertos por pruebas de integración y E2E; el botón se deshabilita durante el envío (anti doble-envío) | Cumplido |
| Tabla 9 — Checklist: los 7 criterios en "Cumplido" | Los 7 verificados con evidencia ejecutable | Cumplido |
| Suite Jest + Supertest + Playwright en verde con cobertura ≥ 80 % | 111 + 4 pruebas en verde; cobertura por encima del umbral | Cumplido |

## 6. Documento 06 — Demostrar, Probar, Corregir y Dejar Listo el Camino

| Compromiso documentado | Evidencia | Estado |
|---|---|---|
| Tabla 1 — Los 9 pasos de la demostración ejecutables | Todos ejecutados en el smoke test final (health, 201, login 200, refresh, 401, logout, 409, 422, correlación, PostGIS) | Cumplido |
| Hallazgo "Corregir": documento de identidad solo dígitos 6–12 | `Documento.ts` (dominio), `authSchemas.ts` (HTTP) y validación en línea del formulario; probado con `10987A5432` → 422 | Cumplido |
| Hallazgo "Corregir": mensaje genérico de credenciales (no revela si el correo existe) | `InvalidCredentialsError` único para correo inexistente, contraseña errada y usuario inactivo; probado | Cumplido |
| Hallazgo "Corregir": el botón GUARDAR no permite doble envío | `Button` con estado `loading` + guarda `if (submitting) return` en los formularios | Cumplido |
| Hallazgo "Investigar": envío del correo de verificación | Diferido a T6 por decisión de los propios documentos (no bloquea el incremento) | Diferido con nombre propio |
| Hallazgo "Pendiente": guía de instalación de PostgreSQL + PostGIS para los equipos | `docs/guia-arranque-postgis.md` (contenedor, verificación, migraciones y troubleshooting) | **Resuelto** |
| Hallazgo "Puede esperar": detalles visuales de la pantalla de bienvenida | Sin cambios de alcance; queda para el sprint de diseño | Diferido con nombre propio |
| Tabla 4 — Estado real: "Suite en integración continua: funciona parcialmente, faltan las E2E en el pipeline" | Job `e2e` del CI con servicio PostGIS y Chromium | **Resuelto** |
| Tabla 5 — Siguientes incrementos definidos | Visibles en el panel por rol (pulido del acceso, productos, inventario, búsqueda PostGIS) | Cumplido |
| Tabla 7 — Punto de partida para T6 | Repositorio con migraciones, BD con datos de prueba, suite en verde, entregables 01–06, deuda registrada y siguiente incremento definido | Cumplido |

## 7. Mapeo de los criterios de aceptación de HU01

| Criterio | Verificación | Prueba |
|---|---|---|
| CA1: nombre, correo y contraseña obligatorios | Formulario y Zod | `RegisterScreen` + `registerSchema`; E2E "validación del formulario" |
| CA2: selección del tipo de usuario (Productor, Comprador, Empresa) | Tarjetas de rol (5 roles incluyendo los 3 de HU01) | E2E `role-card-productor`; `RoleSelectionScreen` |
| CA3: validar que el correo no esté registrado | Verificación en servidor | `RegisterUserUseCase` + integración 409 |
| CA4: mensaje "El correo ya se encuentra registrado" | `EmailAlreadyExistsError` | Integración + E2E "correo duplicado" |
| CA5: contraseña mínimo 8 caracteres | `Password.ts` + Zod | Unitarias de value object + integración 422 |
| CA6: registro correcto en la base de datos | Transacción Prisma | Integración: fila con rol, perfil y token; smoke con SELECT |
| CA7: mensaje "Registro exitoso" y poder iniciar sesión | Respuesta 201 + banner en el panel + login | E2E "registro → login → panel"; smoke |

## 8. Verificación reproducible

```bash
# 1. Base de datos (una vez)
docker start agroconnect-postgres

# 2. Backend
cd backend
npm run lint            # 0 errores
npm run typecheck       # 0 errores
npm test -- --coverage  # 111 pruebas, cobertura >= 80 %
npm run dev             # API en http://localhost:4000

# 3. Frontend (otra terminal)
cd frontend
npm run lint            # 0 errores
npx tsc -b              # 0 errores
npm run dev             # UI en http://localhost:5173

# 4. E2E completo (levanta API y UI automáticamente)
cd frontend && npm run test:e2e   # 4/4 en verde

# 5. Gate de seguridad
node scripts/security-audit.mjs backend
node scripts/security-audit.mjs frontend
```

## 9. Riesgos aceptados y deuda vigente

| Elemento | Estado | Acción |
|---|---|---|
| Advisory GHSA-ggr8-5vv4-36mx (`deepmerge-ts` vía Prisma CLI, dev-only) | Riesgo aceptado | Sin fix estable publicado; allowlist documentada en `scripts/security-audit.mjs` |
| Prototipo del mercado con Supabase | Deuda registrada | Migrar a `/api/v1` en el incremento de productos |
| Verificación por correo y recuperación completa | Diferido a T6 | Definir proveedor y plantilla |
| Perfiles específicos de empresa y transportista | Diferido a T6 | Campos adicionales en el registro |
| 2FA y reputación | Diferido (fuera del alcance declarado) | Backlog priorizado |

## 10. Conclusión

Las afirmaciones de los entregables 01 a 06 quedan respaldadas por software ejecutable y pruebas reproducibles: no existe en los documentos ninguna promesa del incremento 1 sin evidencia en el repositorio. Los dos hallazgos con acción inmediata del entregable 06 (guía PostGIS y E2E en el pipeline) quedaron resueltos; lo demás está diferido con nombre propio y registrado como deuda técnica.
