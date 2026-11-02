# ADR-010: Estrategia de sesión — cookies httpOnly y CSRF de origen

- **Estado**: Aceptada — implementación parcial (actualizada 2026-11-02)
- **Fecha**: 2026-10-22 (revisión 2026-11-02)
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-009, línea base de seguridad OWASP ASVS L2 (documento interno del equipo)

## Contexto y problema

Hoy el frontend guarda la sesión completa en `localStorage`, incluido el refresh token de 7 días. Cualquier XSS puede leerla. Ya se encontró un XSS real en la búsqueda del mapa, corregido en el PR #51.

Además:

- El access token nunca se usa ni se renueva.
- No hay detección de reutilización de refresh tokens.

## Decisión

1. **Sesión 100 % cookie `httpOnly`**: el access token (15 min) y el refresh
   token (7 días) viajan en cookies que JavaScript no puede leer. El cuerpo de
   las respuestas de autenticación **no** incluye tokens.
2. **Atributos de cookie:**
   - `httpOnly`, `Secure` (obligatorio en producción).
   - `SameSite=None` en producción, porque el frontend (Vercel) y la API
     (Render) son sitios distintos; `Lax` en desarrollo/pruebas.
   - `Path=/api/v1` para el access token y `Path=/api/v1/auth` para el refresh.
3. **Rotación con detección de reutilización (planificada, no implementada):**
   - Cada refresh token pertenece a una *familia*.
   - Si se presenta un token ya rotado, se revoca la familia completa.
   - Estado 2026-11-02: la tabla `refresh_tokens` aún no tiene
     `family_id`/`generation`; queda en la fase 2.
4. **JWT endurecido:** `HS256` fijado en firma y verificación (ya aplicado).
   `iss`/`aud` y autorización por rol desde BD quedan planificados.
5. **Protección CSRF:** `CsrfGuard` valida `Origin`/`Referer` contra
   `CORS_ORIGIN` y exige `X-Requested-With: XMLHttpRequest` en toda petición
   mutante. Implementado el 2026-11-02.
6. **Hash de contraseñas:** Argon2id para hashes nuevos, con re-hash
   transparente desde bcrypt en el siguiente login exitoso. **Pendiente**:
   hoy se usa bcrypt con 12 rondas.

## Alternativas consideradas

- **Mantener `localStorage`:** simple, pero expone tokens de larga vida ante cualquier XSS. Rechazada.
- **Sesiones de servidor con cookie** (express-session/Redis): exige estado de servidor o Redis y no encaja con el modelo stateless ni con el plan gratuito. Rechazada.
- **Supabase Auth:** delega la autenticación, pero descarta el módulo propio ya probado (182 pruebas) y su valor formativo. Rechazada.

## Consecuencias

- **Positivas**:
  - Un XSS ya no puede exfiltrar el refresh token.
  - Las sesiones robadas se detectan.
  - Alineado con OWASP ASVS L2 (V3).
- **Negativas**:
  - Requiere CORS con `credentials` y cookie cross-site entre Vercel y Render.
  - El flujo de arranque del frontend es más complejo (refresh silencioso).
- **Mitigaciones**:
  - Pruebas E2E del ciclo login → recarga → refresh → logout.
  - Actualización de la línea base de seguridad interna del equipo.
