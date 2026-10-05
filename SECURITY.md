# Política de seguridad — AgroConnect

## Versiones soportadas

| Versión | Soportada |
|---|---|
| 1.x | ✅ |

## Cómo reportar una vulnerabilidad

**No abras un issue público.** Usa el canal privado de GitHub:

1. Ve a la pestaña **Security** del repositorio → **Advisories** →
   *Report a vulnerability*
   (<https://github.com/AgroConnect-superapp-fp/AgroConnect/security/advisories/new>).
2. Incluye: descripción, pasos de reproducción, impacto estimado y, si es
   posible, una prueba de concepto mínima.

**Compromiso de respuesta:** confirmación en un plazo orientativo de **72 horas
hábiles** y plan de mitigación para los reportes válidos.

## Alcance

- Este es un **proyecto formativo académico** (SENA ADSO). La instancia pública
  de demostración no procesa datos reales de terceros; las credenciales de demo
  no son secretos de producción.
- Quedan en alcance: el código del backend y frontend de este repositorio, sus
  dependencias declaradas y la configuración de despliegue versionada
  (`render.yaml`, `vercel.json`).

## Buenas prácticas del repositorio

- **Cero secretos versionados**: los `.env` están ignorados por git; sólo se
  versionan los `.env.example` sin valores reales.
- **Dependencias vigiladas**: `npm audit` corre en cada push del CI y Dependabot
  propone actualizaciones semanales.
- **Autenticación**: JWT de acceso corto + refresh con rotación, bcrypt (12
  rondas) y rate limiting en los endpoints de autenticación.
- **Frontend**: Helmet en el API, validación Zod compartida y mensajes de error
  que nunca exponen stack traces.

## Créditos

Política mantenida por el equipo del proyecto formativo AgroConnect
(Scrum Master: [@NFGS](https://github.com/NFGS)).
