/**
 * Reglas de arquitectura (Clean Architecture) de @agroconnect/api.
 *
 * Capas (de dentro hacia fuera):
 *   domain         -> entidades, value objects e interfaces de repositorio.
 *   application    -> casos de uso y DTOs.
 *   infrastructure -> adaptadores (Prisma, Argon2, JWT, SMTP, Cloudinary).
 *   presentation   -> controllers, guards y composition root (`*.module.ts`).
 *
 * La regla de dependencia de Clean Architecture dice que las capas internas no
 * dependen de las externas. Este archivo convierte esa regla en un gate
 * ejecutable (`npm run arch:check -w @agroconnect/api`).
 *
 * Cada excepción está documentada con el motivo por el que existe.
 */
module.exports = {
  forbidden: [
    {
      // Sin ciclos entre módulos propios. Se excluye `src/generated/**`: el
      // cliente Prisma es código generado por la herramienta y sus ciclos
      // internos (models <-> prismaNamespace) no son código nuestro.
      name: 'no-circular',
      severity: 'error',
      from: { pathNot: '^src/generated/' },
      to: { circular: true },
    },

    {
      // El dominio no conoce nada del exterior: ni casos de uso, ni Prisma,
      // ni NestJS, ni configuración. Solo puede usar sus propios tipos y los
      // errores de dominio compartidos en `src/shared/errors/errors.ts`.
      name: 'domain-no-outward-dependencies',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain/' },
      to: {
        path: '^(src/modules/[^/]+/(application|infrastructure|presentation)/|src/shared/(config|http|logger|infrastructure)/|src/shared/errors/all-exceptions\\.filter\\.ts$|src/prisma/|src/generated/|node_modules/)',
      },
    },

    {
      // La capa de aplicación orquesta casos de uso; no conoce adaptadores.
      //
      // EXCEPCIÓN 1 — `src/shared/infrastructure/prismaErrors.ts`:
      // traduce códigos de error de Prisma (P2002, P2025...) a errores de
      // dominio. Es un traductor de errores compartido, no un repositorio ni
      // un cliente de base de datos: no abre conexiones ni conoce el esquema.
      // Se mantiene aquí para no duplicar el mapeo en cada caso de uso.
      name: 'application-no-infrastructure-dependencies',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application/' },
      to: {
        path: '^(src/modules/[^/]+/(infrastructure|presentation)/|src/shared/(config|http|logger|infrastructure)/|src/prisma/|src/generated/)',
        pathNot: '^src/shared/infrastructure/prismaErrors\\.ts$',
      },
    },

    {
      // La infraestructura implementa las interfaces del dominio; no debe
      // volver a las capas de aplicación ni de presentación.
      name: 'infrastructure-no-inner-layer-dependencies',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/infrastructure/' },
      to: { path: '^src/modules/[^/]+/(application|presentation)/' },
    },

    {
      // Los controllers y guards no instancian adaptadores: reciben interfaces
      // por inyección de dependencias.
      //
      // EXCEPCIÓN 2 — `*.module.ts` dentro de `presentation/`:
      // son el composition root de NestJS. Ahí se enlaza cada interfaz del
      // dominio con su implementación concreta (PrismaUserRepository,
      // Argon2PasswordHasher, JwtTokenService...). Sin esta excepción no
      // existiría ningún punto donde inyectar las dependencias.
      name: 'presentation-no-infrastructure-dependencies',
      severity: 'error',
      from: {
        path: '^src/modules/[^/]+/presentation/',
        pathNot: '\\.module\\.ts$',
      },
      to: {
        path: '^(src/modules/[^/]+/infrastructure/|src/shared/infrastructure/|src/prisma/|src/generated/)',
      },
    },

    {
      // El cliente Prisma generado solo puede usarse en la capa de
      // infraestructura.
      //
      // EXCEPCIÓN 3 — `src/modules/*/infrastructure/repositories/**` y
      // `src/prisma/**`: son los únicos lugares autorizados para conocer el
      // cliente generado. `src/prisma/**` expone el `PrismaService` que
      // comparte la conexión entre módulos.
      name: 'generated-client-restricted-to-infrastructure',
      severity: 'error',
      from: {
        pathNot: '^(src/modules/[^/]+/infrastructure/repositories/|src/prisma/|src/generated/)',
      },
      to: { path: '^src/generated/' },
    },

    {
      // `shared/` es código transversal: no puede depender de los módulos de
      // negocio (sería el camino corto para que todo importe todo).
      name: 'shared-no-module-dependencies',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/modules/' },
    },

    {
      // Los módulos transversales (documentación, health) son independientes
      // de los módulos de negocio.
      name: 'cross-cutting-no-module-dependencies',
      severity: 'error',
      from: { path: '^src/(docs|health)/' },
      to: { path: '^src/modules/' },
    },
  ],

  options: {
    includeOnly: '^src/',
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['main', 'module'],
    },
    reporterOptions: {
      dot: { collapsePattern: 'node_modules/[^/]+' },
    },
  },
};
