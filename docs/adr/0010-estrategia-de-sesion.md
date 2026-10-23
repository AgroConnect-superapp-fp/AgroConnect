# ADR-010: Estrategia de sesión — access token en memoria y refresh token en cookie httpOnly

- **Estado**: Aceptada
- **Fecha**: 2026-10-22
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-009, línea base de seguridad OWASP ASVS L2 (documento interno del equipo)

## Contexto y problema

Hoy el frontend guarda la sesión completa en `localStorage`, incluido el refresh token de 7 días. Cualquier XSS puede leerla. Ya se encontró un XSS real en la búsqueda del mapa, corregido en el PR #51.

Además:

- El access token nunca se usa ni se renueva.
- No hay detección de reutilización de refresh tokens.

## Decisión

1. **Access token JWT** de 15 minutos que vive **solo en memoria** (estado de React) y viaja en el header `Authorization: Bearer`.
2. **Refresh token** en una cookie con estos atributos:
   - `httpOnly`, `Secure`, `SameSite=None`
   - `Path=/api/v1/auth`
   - de dominio API

   Al recargar la página, el frontend obtiene un access token nuevo llamando a `POST /auth/refresh`.
3. **Rotación con detección de reutilización:**
   - Cada refresh token pertenece a una *familia*.
   - Si se presenta un token ya rotado, se revoca la familia completa (indicio de robo).
4. **JWT endurecido:**
   - `HS256` fijado (ya aplicado en el PR #51).
   - Claims `iss` y `aud`.
   - Secretos distintos para access y refresh.
5. **Protección CSRF** para el endpoint de cookie: `SameSite`, más la verificación de `Origin` contra la lista CORS y un header personalizado obligatorio (`X-Requested-With`).
6. **Hash de contraseñas:** Argon2id para hashes nuevos, con re-hash transparente desde bcrypt en el siguiente login exitoso.

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
