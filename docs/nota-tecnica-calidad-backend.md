# Nota técnica: gates de calidad del backend AgroConnect

Fecha: 2026-11-16 (actualizada 2026-11-17)
Alcance: `@agroconnect/api` (Node.js 20+, Express/NestJS, TypeScript estricto, Prisma 7 + PostgreSQL/PostGIS).

Esta nota documenta los gates de calidad que quedaron ejecutables en el backend:
gate de arquitectura (Clean Architecture), documentación OpenAPI/Swagger, seed de
desarrollo reproducible y pruebas de integración contra PostGIS real. No sustituye
al acta de cierre del sprint; es la referencia operativa de los comandos.

---

## 1. Gate de arquitectura (dependency-cruiser)

### 1.1 Comando

```bash
npm run arch:check -w @agroconnect/api
```

Equivale a `depcruise --config .dependency-cruiser.js src --output-type err-long`
ejecutado en `apps/api`. La configuración vive en
`apps/api/.dependency-cruiser.js` y solo analiza `src/` (`includeOnly: '^src/'`),
por lo que los tests y los scripts no entran en el análisis.

Salida esperada cuando la arquitectura es correcta:

```
✔ no dependency violations found (123 modules, 383 dependencies cruised)
```

El comando devuelve código de salida 0 si no hay violaciones y 1 si las hay, de
modo que puede bloquear un pipeline sin necesidad de un script adicional.

### 1.2 Capas y dirección de dependencias

Las cuatro capas se organizan de dentro hacia fuera:

| Capa | Ubicación | Responsabilidad |
| --- | --- | --- |
| `domain` | `src/modules/<modulo>/domain/` | Entidades, value objects e interfaces de repositorio. |
| `application` | `src/modules/<modulo>/application/` | Casos de uso y DTOs. |
| `infrastructure` | `src/modules/<modulo>/infrastructure/` | Adaptadores (Prisma, Argon2, JWT, SMTP, Cloudinary). |
| `presentation` | `src/modules/<modulo>/presentation/` | Controllers, guards y composition root (`*.module.ts`). |

La regla de Clean Architecture es que las capas internas no dependen de las
externas. El archivo de reglas convierte esa frase en un gate ejecutable.

### 1.3 Reglas configuradas

| Regla | Qué prohíbe |
| --- | --- |
| `no-circular` | Ciclos entre módulos propios. Excluye `src/generated/**` porque el cliente Prisma es código generado y sus ciclos internos no son código del proyecto. |
| `domain-no-outward-dependencies` | Que el dominio dependa de aplicación, infraestructura, presentación, configuración, HTTP, logger, Prisma o `node_modules`. Solo admite sus propios tipos y `src/shared/errors/errors.ts`. |
| `application-no-infrastructure-dependencies` | Que la capa de aplicación dependa de infraestructura, presentación, configuración, HTTP, logger, Prisma o el cliente generado. |
| `infrastructure-no-inner-layer-dependencies` | Que la infraestructura vuelva a las capas de aplicación o presentación. |
| `presentation-no-infrastructure-dependencies` | Que controllers y guards instancien adaptadores. Deben recibir interfaces por inyección de dependencias. |
| `generated-client-restricted-to-infrastructure` | Que el cliente Prisma generado se use fuera de `infrastructure/repositories/**`, `src/prisma/**` y `src/generated/**`. |
| `shared-no-module-dependencies` | Que `src/shared/` dependa de `src/modules/`, que sería el camino corto para que todo importe todo. |
| `cross-cutting-no-module-dependencies` | Que los módulos transversales (`src/docs/`, `src/health/`) dependan de los módulos de negocio. |

### 1.4 Las tres excepciones y su motivo

Las excepciones son deliberadas y están documentadas en el propio archivo de
configuración. Cada una responde a una razón concreta:

1. **`src/shared/infrastructure/prismaErrors.ts`** (excepción de
   `application-no-infrastructure-dependencies`). Traduce códigos de error de
   Prisma (P2002, P2025, etc.) a errores de dominio. Es un traductor de errores
   compartido, no un repositorio ni un cliente de base de datos: no abre
   conexiones ni conoce el esquema. Se mantiene en `shared/` para no duplicar el
   mapeo en cada caso de uso.

2. **`*.module.ts` dentro de `presentation/`** (excepción de
   `presentation-no-infrastructure-dependencies`). Son el composition root de
   NestJS. Ahí se enlaza cada interfaz del dominio con su implementación
   concreta (`PrismaUserRepository`, `Argon2PasswordHasher`, `JwtTokenService`).
   Sin esta excepción no existiría ningún punto donde inyectar las
   dependencias.

3. **`src/modules/*/infrastructure/repositories/**` y `src/prisma/**`**
   (excepción de `generated-client-restricted-to-infrastructure`). Son los únicos
   lugares autorizados para conocer el cliente Prisma generado.
   `src/prisma/**` expone el `PrismaService` que comparte la conexión entre
   módulos.

### 1.5 Criterio de aceptación

Una modificación se considera conforme cuando `npm run arch:check -w @agroconnect/api`
termina con `no dependency violations found` y código de salida 0. Si una
dependencia nueva es realmente necesaria, la excepción se documenta en el
archivo de configuración con su motivo; no se desactivan reglas de forma
silenciosa.

---

## 2. Documentación OpenAPI y Swagger UI

### 2.1 Estado actual

El módulo `src/docs/` expone la documentación en la raíz del servidor, fuera del
prefijo de negocio:

- `GET /docs` sirve la interfaz Swagger UI.
- `GET /docs/openapi.json` sirve el documento OpenAPI 3.1.0.

El documento se genera desde `packages/contracts/openapi.json`, de modo que la
documentación publicada y los contratos compartidos no pueden divergir. La
interfaz se habilita con `ENABLE_API_DOCS=true` y por defecto queda apagada, de
modo que en producción no se publica salvo decisión explícita. Los assets de
Swagger UI se sirven localmente desde `swagger-ui-dist` (sin CDN) y las respuestas
llevan `Cache-Control: no-store`.

### 2.2 Por qué `/docs` vive en la raíz

`apps/api/src/main.ts` declara:

```ts
app.setGlobalPrefix('api/v1', {
  exclude: ['health', 'health/ready', 'docs', 'docs/openapi.json'],
});
```

El acta de cierre del sprint exige "Swagger en `/docs`", y `/docs` es además la
ruta canónica que esperan Swagger UI, los portales de documentación y las
herramientas de integración. Excluir `docs/openapi.json` es necesario además de
`docs` porque el documento se sirve en una subruta del controller y el prefijo se
aplica a todas las rutas del controller salvo las excluidas de forma explícita.

Consecuencia: `/api/v1/docs` responde `404`; la documentación solo es alcanzable
por `/docs`. Los endpoints de negocio no se ven afectados.

### 2.3 Verificación manual

```bash
curl -i http://localhost:4000/docs
curl -i http://localhost:4000/docs/openapi.json
curl -i http://localhost:4000/api/v1/docs          # 404 esperado
```

Se espera `200` con `Content-Type` de HTML y de JSON respectivamente. Sin
`ENABLE_API_DOCS=true`, `/docs` responde `404`. Verificado por curl: `/docs` 200,
`/docs/` 200, `/docs/openapi.json` 200 con 17 paths (incluye `/plots`,
`/plots/{id}` y `/plots/nearby`), assets `/docs/swagger-ui-*.{css,js}` 200 y
`/api/v1/docs` 404.

---

## 3. Seed de desarrollo

### 3.1 Comando

```bash
npm run prisma:seed -w @agroconnect/api
```

Ejecuta `ts-node scripts/seed.ts`, que invoca `runSeed()` de
`apps/api/prisma/seed.ts` y presenta el reporte final. El seed es idempotente:
puede ejecutarse varias veces sin duplicar roles, usuarios ni parcelas.

### 3.2 Variables de entorno

| Variable | Efecto |
| --- | --- |
| `SEED_ADMIN_PASSWORD` | Obligatoria. Contraseña de `admin@agroconnect.local`. |
| `SEED_PRODUCER_PASSWORD` | Obligatoria. Contraseña de `productor@agroconnect.local`. |
| `ALLOW_DEV_SEED` | `true` habilita el seed fuera de `development`/`test`, siempre que la base no sea producción real. |

No existe contraseña de respaldo hardcodeada: si falta cualquiera de las dos
variables obligatorias, el seed aborta con código de salida 1 e indica el nombre
exacto de la variable faltante. Las contraseñas nunca se imprimen, ni en claro ni
hasheadas.

### 3.3 Guard de seguridad

El seed se niega a ejecutarse salvo que se cumplan todas estas condiciones:

1. `NODE_ENV` no es `production`. Con `NODE_ENV=production` aborta siempre,
   incluso si `ALLOW_DEV_SEED=true`.
2. `ALLOW_DEV_SEED=true`, **o** (`NODE_ENV` es `development`/`test` **y** el host
   de la cadena de conexión es local: `localhost`, `127.0.0.1`, `::1` o `[::1]`).

El objetivo es que un seed con datos de prueba y contraseñas conocidas no pueda
apuntar por accidente a una base remota. El guard se evalúa antes de abrir
conexión.

Verificado empíricamente: `NODE_ENV=staging` sin `ALLOW_DEV_SEED` aborta con
exit 1; `NODE_ENV=production` con `ALLOW_DEV_SEED=true` aborta con exit 1; sin
`SEED_ADMIN_PASSWORD` o sin `SEED_PRODUCER_PASSWORD` aborta nombrando la variable
faltante; con la configuración válida termina con exit 0.

### 3.4 Idempotencia y conservación de contraseñas

Una segunda ejecución no duplica roles, usuarios ni parcelas, y **no resetea la
contraseña** de un usuario existente: el `ON CONFLICT` solo actualiza
`nombre_completo`, `rol_id`, `estado` y `actualizado_en`. El reporte final marca
cada usuario como `insertado` o `conservada` e indica la fuente de la contraseña
(`env`). Verificado empíricamente: el `password_hash` de
`admin@agroconnect.local` es idéntico antes y después de una segunda corrida.

### 3.5 Fallback cuando no existe `plots.geom`

El seed detecta en tiempo de ejecución si la columna `plots.geom` y el trigger
`plots_sync_geometry_trigger` existen. Si no existen (por ejemplo, contra un
esquema anterior a la migración `20261116000000_add_plot_geometry`), el seed:

- omite el seed de parcelas;
- emite un aviso en el reporte indicando que se omitió y por qué;
- termina con código de salida 0, porque roles y usuarios sí pudieron
  crearse.

La razón de este comportamiento es que el polígono de la parcela no se puede
modelar con Prisma (`geom geometry(Polygon,4326)`) y el centroide y el área se
derivan en base de datos con `ST_Centroid` y `ST_Area` sobre `geography`
dentro del trigger. Escribir esos valores a mano duplicaría la verdad de la
geometría y la dejaría inconsistente.

---

## 4. Pruebas de integración contra PostGIS real (Testcontainers)

### 4.1 Comando

```bash
cd apps/api && npx jest --runInBand tests/integration/postgis.testcontainers.test.ts
```

O, desde la raíz del monorepo:

```bash
npm run test:integration -w @agroconnect/api
```

### 4.2 Qué valida

El test levanta un contenedor con la misma imagen que usa el desarrollo
(`postgis/postgis:16-3.4`), aplica las migraciones reales del repositorio con
`prisma migrate deploy` y comprueba contra el motor PostGIS:

1. La extensión `postgis` está instalada y el tipo `geography` existe.
2. `ST_DWithin` encuentra la parcela cercana a Salento (Quindío) dentro de un
   radio de 5 km, y devuelve únicamente esa parcela.
3. La parcela de Pijao queda fuera de ese radio de 5 km.
4. `ST_Centroid` y `ST_Area` son coherentes con `area_hectares` (el área en
   hectáreas sale de `ST_Area(geom::geography) / 10000`).
5. El CHECK `plots_centroid_colombia_check` está aplicado en la base de datos.
6. Una parcela con polígono en París es rechazada con el error de PostgreSQL
   `23514` (violación de restricción de tipo check).

El esquema no se inventa en el test: se aplica la cadena de migraciones real,
de modo que el test valida el esquema que se despliega.

### 4.3 Modos skip y su significado

El test nunca reporta como aprobado lo que no se ejecutó. Hay dos modos de
omisión, ambos con la razón explícita en el título de la suite:

| Modo | Condición | Resultado en Jest |
| --- | --- | --- |
| Docker ausente | No hay `DOCKER_HOST`, no existe `/var/run/docker.sock` y `docker info` falla. | `Test Suites: 1 skipped`, `Tests: 6 skipped`. |
| CHECK no declarado | Ninguna migración de `prisma/migrations/*/migration.sql` declara `plots_centroid_colombia_check`. | La suite de PostGIS corre y solo el bloque del CHECK queda omitido: `4 passed, 2 skipped`. |

Consecuencia operativa: un `skipped` en la salida de CI significa que la
verificación geoespacial no se ejecutó en ese entorno, no que haya pasado. Para
que el gate sea efectivo, el runner de CI debe disponer de un demonio Docker
(o de un servicio PostGIS equivalente) y las migraciones deben incluir el
CHECK.

### 4.4 Requisitos

- Demonio Docker accesible (socket local o `DOCKER_HOST`).
- La imagen `postgis/postgis:16-3.4` puede descargarse o estar cacheada.
- El CLI de Prisma disponible en el workspace (`node_modules/.bin/prisma`).

---

## 5. Endurecimiento HTTP

### 5.1 Límite del cuerpo JSON

`apps/api/src/app.setup.ts` registra el parser JSON con
`app.useBodyParser('json', { limit: JSON_BODY_LIMIT })`, donde `JSON_BODY_LIMIT`
vale `32kb` por defecto y es configurable por entorno. Un cuerpo mayor no llega a
los controllers: el parser aborta y el filtro global devuelve `413` con el código
`PAYLOAD_TOO_LARGE`.

La respuesta conserva el formato de error del contrato:

```json
{
  "success": false,
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "El cuerpo de la petición supera el límite de 32kb."
  },
  "correlationId": "..."
}
```

`PAYLOAD_TOO_LARGE` forma parte de la unión `ErrorCode` y del mapa
`STATUS_TO_CODE` del filtro global, de modo que no es un código ad hoc.

### 5.2 Orden de CORS respecto al parser

Cuando el parser JSON lanza el error, Express salta los middlewares no-error y,
si CORS estuviera registrado después del parser, la respuesta `413` saldría sin
`Access-Control-Allow-Origin`: el navegador reportaría un fallo de CORS en lugar
del `413` real. Por eso CORS se registra **antes** del parser.

Verificado por curl con un cuerpo de ~40 kB: `HTTP/1.1 413 Payload Too Large` con
`Access-Control-Allow-Origin: http://localhost:5173`, credenciales y
`x-correlation-id` presentes.

### 5.3 Validación de CORS

`src/shared/config/env.ts` rechaza `CORS_ORIGIN='*'` cuando se envían credenciales
(cookies de refresco), porque el navegador descarta esa combinación. El origen se
declara de forma explícita por entorno.

### 5.4 Correlation ID

`src/shared/http/correlation-id.middleware.ts` valida el `x-correlation-id`
entrante contra `^[A-Za-z0-9._-]{1,64}$`. Un valor con formato inválido se
descarta y se genera uno nuevo, para evitar inyección de contenido en los logs y
en las cabeceras de respuesta.

---

## 6. Umbrales de cobertura

`apps/api/jest.config.js` fija un umbral global de 80 % en statements, branches,
functions y lines. La cobertura se recoge solo de `src/**/*.ts`, excluyendo
`src/main.ts`, `src/types/**`, los archivos `.d.ts` y `src/generated/**` (el
cliente Prisma es código generado y no computa para el umbral).

Estado verificado el 2026-11-17: **45 suites y 421 tests en verde**, con
statements 92.36 % (1803/1952), branches 80.69 % (836/1036), functions 94.53 %
(415/439) y lines 92.30 % (1716/1859). El margen de branches sobre el umbral es
estrecho (0.69 pp): cualquier regresión de cobertura en otro módulo bloquea el
merge, que es precisamente el comportamiento buscado por el gate.

---

## 7. Verificación reproducible

```bash
npm run typecheck --workspace @agroconnect/api
npm run lint --workspace @agroconnect/api
npm run arch:check --workspace @agroconnect/api
npm test --workspace @agroconnect/api -- --coverage
npm run generate:openapi --workspace @agroconnect/contracts
npm run check:drift --workspace @agroconnect/contracts
npm audit --workspace @agroconnect/api
```

---

## 8. Riesgos residuales y pendientes

1. La prueba de PostGIS depende del demonio Docker del entorno; en runners sin
   Docker queda omitida y no aporta evidencia de la geoespacial.
2. `npm audit` queda en **0 vulnerabilidades** en la raíz y en el API gracias al
   `overrides.glob` del `package.json` raíz (`glob@^14.0.6`, con la excepción
   `rimraf.glob@^7.2.3`, que no es vulnerable porque el rango afectado es
   `>=9.0.0 <=14.0.1`). Revisar el override cuando esas dependencias publiquen
   versiones sin `glob`.
3. Las ramas no cubiertas que quedan en `src/docs/` corresponden a guardas
   defensivas inalcanzables en ejecución (`?? ''` sobre un acceso indexado
   garantizado por `noUncheckedIndexedAccess` y el corte de búsqueda de
   directorios padre). No son defectos funcionales.
4. `marketplace` e `identity` siguen lanzando `VALIDATION_ERROR` con **400**
   mientras su `ZodValidationPipe` devuelve **422** para un cuerpo inválido: la
   misma inconsistencia que ya se corrigió en `geography`. Unificarlo exige tocar
   esos módulos y sus tests; queda como deuda técnica con alcance propio.
5. El seed exige `SEED_ADMIN_PASSWORD` y `SEED_PRODUCER_PASSWORD`. El archivo
   `.env.example` todavía no las declara, así que un clon nuevo debe añadirlas a
   mano antes de ejecutar `npm run prisma:seed -w @agroconnect/api`.
