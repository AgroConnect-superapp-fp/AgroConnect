# AgroConnect

Plataforma de comercio agrícola **B2B + B2C** que conecta directamente a productores rurales colombianos con consumidores finales y compradores empresariales, eliminando la intermediación innecesaria. Los productores pueden publicar sus productos, gestionar inventarios incluso con conexión intermitente, recibir pagos con los medios que ya usan, coordinar entregas y construir reputación; los compradores acceden a búsqueda sencilla, precios transparentes, productos frescos rastreables desde el origen, alertas de vencimiento y canales alternos para regiones con poca señal.

**Proyecto Formativo ADSO — SENA · Ficha 2026**
Centro de Comercio y Turismo · Regional Quindío · Programa Análisis y Desarrollo de Software (código 228118)
**Metodología:** RUP + Scrum (Scrum Guide 2020) · **Esfuerzo:** 410 Story Points en 12 sprints

---

## Información del proyecto

| Atributo | Valor |
|---|---|
| Nombre oficial | AgroConnect |
| Tipo | Marketplace dual B2B y B2C agropecuario para Colombia rural |
| Alcance | 17 módulos funcionales (M01–M17) |
| Trazabilidad oficial | 68 RF · 30 RNF · 66 CU · 69 HU · 6 actores |
| Documentación fuente | Notion: PT-PP-01, PT-ERS-01, PT-ECU-01, PT-AR-ARQ-01, PT-IGS-01, PT-PP-02, PT-MTC-01, PT-MU-01 |

### Equipo Scrum

| Rol | Nombre |
|---|---|
| Scrum Master | Nelson Fabián Gallego Sánchez |
| Product Owner | Juan David Ferrer Castillo |
| Desarrollador 1 | Carlos Andrés Zuluaga Atehortua |
| Desarrollador 2 | Santiago Palacio Tovar |
| Asesor pedagógico | Instructor SENA ADSO Ficha 2026 |

---

## Problema y propuesta de valor

En Colombia, miles de productores rurales comercializan sus cosechas a través de cadenas de intermediación largas y fragmentadas que erosionan su rentabilidad: el productor recibe apenas entre el 15 % y el 30 % del precio final pagado por el consumidor. A esto se suman la volatilidad de precios por asimetrías de información, la baja adopción tecnológica, la informalidad de las transacciones y la falta de trazabilidad sanitaria verificable. En el eslabón opuesto, los compradores urbanos y empresariales pagan precios elevados por alimentos cuyo origen y frescura son difíciles de comprobar, mientras una porción significativa de la producción perecedera se pierde por falta de canales de venta oportunos.

AgroConnect responde con una plataforma que integra cuatro capacidades diferenciales:

1. **Operación multicanal y offline-first (M14)** — sincronización idempotente con UUID local y resolución Last-Write-Wins, cola local de sincronización, notificaciones SMS y acceso por código USSD para zonas sin conectividad estable.
2. **Pagos locales colombianos (M15)** — PSE, Nequi, Daviplata, Bre-B y Transfiya, con generación de CUFE y facturación electrónica en XML UBL 2.1 conforme a la Resolución 165 de 2023 de la DIAN.
3. **Geolocalización rural (M16)** — PostgreSQL 16 + PostGIS para cobertura veredal y municipal, rutas óptimas y cálculo geoespacial nativo.
4. **Productos perecederos (M17)** — control de cadena de frío, alertas escalonadas de vencimiento (72/48/24 h) y trazabilidad sanitaria conforme a la Resolución ICA 824 de 2022.

---

## Módulos funcionales (17)

| Módulo | Nombre |
|---|---|
| M01 | Gestión de Inicio y Panel General |
| M02 | Gestión de Usuarios y Perfiles |
| M03 | Marketplace Agropecuario |
| M04 | Gestión de Inventarios |
| M05 | Comunicación Interna |
| M06 | Gestión Logística |
| M07 | Gestión de Pedidos |
| M08 | Pagos y Transacciones |
| M09 | Panel Administrativo |
| M10 | Seguridad y Control |
| M11 | Soporte y Ayuda |
| M12 | Inteligencia Artificial AgroBot |
| M13 | Gestión de Compras |
| M14 | Funcionamiento Multicanal y Sincronización Offline |
| M15 | Pagos y Métodos Locales |
| M16 | Geolocalización y Logística Rural |
| M17 | Manejo de Productos Perecederos |

### Actores del sistema (6)

Productor Agrícola · Comprador (B2C y B2B) · Transportista · Administrador · Soporte y Moderador · AgroBot (asistente automatizado).

---

## Arquitectura

La arquitectura oficial (PT-AR-ARQ-01, v1.0) sigue **Clean Architecture** (Robert C. Martin) con cuatro capas concéntricas y regla estricta de dependencias, complementada con **Domain-Driven Design** y patrones GoF:

| Capa | Responsabilidad |
|---|---|
| Domain | Entidades, Value Objects, Aggregates y eventos de dominio. Sin dependencias externas. |
| Application | Casos de uso, DTOs, mappers e interfaces (ports) de repositorios. Solo depende de Domain. |
| Infrastructure | Implementaciones Prisma, adaptadores de servicios externos (Cloudinary, JWT, correo). |
| Interface | Controllers REST, middleware, validación y serialización. |

Reglas clave del diseño:

- El dominio **no conoce** Prisma ni Express; la inversión de dependencias se hace por interfaces (`import { PrismaClient }` está prohibido fuera de infraestructura).
- Los 17 módulos se agrupan en 4 bounded contexts: Identidad y Acceso, Catálogo y Marketplace, Transacciones y Servicios Complementarios.
- **Offline-first**: UUID v4 local por entidad, Last-Write-Wins con timestamps lógicos, con excepciones controladas para inventario, aceptación de pedidos y pagos (idempotency key).
- **Geoespacial nativo**: `GEOGRAPHY(Point, 4326)`, índices GiST y funciones `ST_Distance`, `ST_Within`, `ST_Intersects`, `ST_DWithin`. Los cálculos de distancia y área nunca se hacen en JavaScript.
- Patrones aplicados: Repository, Use Case, Strategy (pagos), Circuit Breaker, Outbox y Observer (AgroBot).

### Decisiones arquitectónicas destacadas (ADR)

| ADR | Decisión |
|---|---|
| ADR-002 | PostgreSQL 16 LTS + PostGIS sobre Oracle/PostgreSQL 15 |
| ADR-003 | Cloudinary para activos multimedia |
| ADR-004 | React + Vite como SPA (sin Next.js) |
| ADR-005 | Clean Architecture de 4 capas |
| ADR-006 | UUID local + Last-Write-Wins para operación offline |
| ADR-007 | Leaflet + OpenStreetMap (Google Maps está prohibido en el proyecto) |

---

## Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript 6 (strict) + Tailwind CSS 3 + Leaflet 1.9 (OpenStreetMap) |
| Backend | Node.js 22 + Express 4 + TypeScript 5 (strict) + Zod |
| Persistencia | PostgreSQL 16 + PostGIS 3.4 + Prisma ORM |
| Seguridad | JWT + refresh tokens rotativos, bcrypt (12 rondas), Helmet, rate limiting, Pino con redacción de PII |
| Pruebas | Jest + Supertest (unitarias/integración) · Playwright (E2E) |
| Assets | Cloudinary (transformaciones y CDN) |

**Design system:** verde primario `#2E7D32`, amarillo acento `#F9A825`, tipografías Inter (UI) y Merriweather (contenido), touch targets mínimos de 48×48 px y contraste WCAG AA.

---

## Estructura del repositorio

```
AgroConnect/
├── backend/     # API REST — Clean Architecture + DDD
│   ├── prisma/  # Esquema y migraciones (PostgreSQL 16 + PostGIS)
│   ├── src/     # config, shared y módulos (auth, geography)
│   └── tests/   # unitarias, integración y dobles de prueba
└── frontend/    # SPA React — PWA con Service Worker
    ├── src/     # auth (M02), componentes de mapa y UI, servicios
    ├── public/  # Service Worker e iconografía
    └── e2e/     # Pruebas end-to-end con Playwright
```

---

## Estado implementado (incrementos 1–2b)

### M02 — Gestión de Usuarios y Perfiles

API `/api/v1/auth` con flujo completo de registro, autenticación y seguridad de cuenta:

| Método | Ruta | Propósito |
|---|---|---|
| POST | `/register` | Registro multi-rol (productor, comprador, empresa, transportista, administrador) |
| POST | `/login` | Autenticación con JWT |
| POST | `/refresh` | Renovación con rotación de refresh token |
| POST | `/logout` | Revocación del refresh token |
| POST | `/forgot-password` | Token de recuperación de un solo uso (30 min) |
| POST | `/reset-password` | Restablecimiento y revocación de sesiones |
| POST | `/verify-email` | Verificación de correo |
| POST | `/resend-verification` | Reenvío del enlace de verificación |

Características: contraseñas con bcrypt, unicidad de correo/documento/celular validada en servidor, refresh tokens con `jti` y hash SHA-256, rate limiting (5 intentos/15 min), autorización de tratamiento de datos (Ley 1581 de 2012) y errores estandarizados con `correlationId`.

### M16 — Base geoespacial

- Parcelas almacenadas como `geography(Point, 4326)` con índice GiST y búsqueda por radio con `ST_DWithin` en `/api/v1/plots`.
- Frontend: mapa Leaflet + OpenStreetMap con 4 capas base (OSM, satélite Esri, topográfico, CartoDB), clustering de fincas, heatmap de productividad y herramientas de dibujo de parcelas.

### Calidad

- 178 pruebas Jest + Supertest (cobertura 97 % en líneas) y 7 pruebas E2E con Playwright.

---

## Puesta en marcha

### Backend

```bash
# 1. Base de datos PostgreSQL 16 + PostGIS 3.4
docker run -d --name agroconnect-postgres \
  -e POSTGRES_USER=agroconnect \
  -e POSTGRES_PASSWORD=agroconnect_dev \
  -e POSTGRES_DB=agroconnect_dev \
  -p 5434:5432 postgis/postgis:16-3.4

# 2. Dependencias y entorno
cd backend
npm install
cp .env.example .env
openssl rand -hex 32   # JWT_ACCESS_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET

# 3. Migraciones y servidor
npx prisma generate
npx prisma migrate dev
npm run dev            # http://localhost:4000
```

Verificación: `curl http://localhost:4000/health`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # completar VITE_API_URL y claves públicas
npm run dev                   # http://localhost:5173
```

### Pruebas

```bash
cd backend && npm test -- --coverage   # unitarias + integración (cobertura 97%)
cd frontend && npm run test:unit       # unitarias (Vitest)
cd frontend && npm run test:e2e        # E2E (levanta API y web)
```

---

## Despliegue (Vercel)

- **URL de producción:** https://agroconnectpreview.vercel.app
- **Proyecto:** `agro-connect/agroconnectpreview` · **Root Directory:** `frontend` · Node 24.x
- **Variables de entorno (Production/Preview):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`.

> **Nota de infraestructura (plan Hobby):** Vercel no permite conectar repositorios privados de organizaciones sin plan Pro, por lo que la Git Integration nativa no está activa. El job `deploy` del CI queda como respaldo automático (condicionado al scope del token) y no marca el pipeline en rojo si el token no tiene acceso.

**Acceso de demostración:** el botón **«🚀 Explorar la demo (sin registro)»** del inicio permite entrar al mercado sin backend. El registro e inicio de sesión reales requieren el backend local (no desplegado).

**Deploy manual (procedimiento vigente)** — desde la raíz del repo, con sesión `vercel login` activa:

```bash
npx vercel deploy --prod --yes --archive=tgz
```

**Verificación post-deploy:** `curl -I https://agroconnectpreview.vercel.app` debe responder `200` y el marketplace debe cargar las 12 propiedades con sus imágenes y créditos.

### Backend de autenticación (Render)

El backend Express + Prisma + PostgreSQL se despliega como **Web Service en Render** (plan free) con el Blueprint `render.yaml` de la raíz (Infraestructura como Código):

1. Render → **New → Blueprint** → conectar `AgroConnect-superapp-fp/AgroConnect`.
2. Completar `DATABASE_URL` con la connection string de **Supabase** (Settings → Database → Connection string → *Session pooler*).
3. Deploy → URL del servicio (p. ej. `https://agroconnect-api.onrender.com`).
4. En Vercel: `VITE_API_URL=https://agroconnect-api.onrender.com` (Production) → redeploy del frontend.

Migraciones iniciales (una sola vez): `cd backend && DATABASE_URL="<supabase-connection-string>" npx prisma migrate deploy`.

> Nota free tier: el servicio se suspende tras ~15 min de inactividad y despierta en ~1 min en la primera petición.

> Detalle operativo completo en `docs/despliegue.md` (guía interna del proyecto).

---

## Cumplimiento normativo colombiano

| Norma | Aplicación en el sistema |
|---|---|
| Ley 1581 de 2012 + Decreto 1377 de 2013 | Protección de datos personales (Habeas Data) y autorización de tratamiento en el registro |
| Ley 527 de 1999 | Validez probatoria de mensajes de datos y comercio electrónico |
| Ley 1480 de 2011, modificada por Ley 2439 de 2024 | Estatuto del Consumidor: retracto (5 días hábiles), reversión (15 días) y entrega (30 días) |
| Resolución 165 de 2023 DIAN | Facturación electrónica con CUFE y XML UBL 2.1 (M15) |
| Resolución ICA 824 de 2022 y modificatorias | Registro y trazabilidad de productos perecederos (M17) |
| Decreto 1500 de 2007 | Trazabilidad origen-destino de productos |
| Resolución 2674 de 2013 INVIMA | Buenas Prácticas de Manufactura |
| Decreto 2200 de 2019 | Cadena de frío en transporte de perecederos |

---

## Enlaces del proyecto

- **Notion (SSOT documental):** repositorio de plantillas PT-PP-01, PT-ERS-01, PT-ECU-01, PT-AR-ARQ-01, PT-IGS-01, PT-PP-02, PT-MTC-01 y PT-MU-01.
- **Jira (SSOT operativo):** tablero SCRUM del proyecto.
- **GitHub:** organización `AgroConnect-superapp-fp`.

---

## Créditos

**Institución:** SENA — Análisis y Desarrollo de Software (ADSO), Ficha 2026, Centro de Comercio y Turismo, Regional Quindío.
**Año:** 2026. Construido con tecnologías 100 % open source.

### Créditos de imágenes

Fotografías de cultivos usadas en el prototipo del mercado:

| Cultivo | Archivo | Autor/a | Licencia |
|---|---|---|---|
| Banano | [Magdalena zona bananera.jpg](https://commons.wikimedia.org/wiki/File:Magdalena_zona_bananera.jpg) | Claudia Marcela Bolaño Castro | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Café | [Coffee tree in Hacienda Guayabal, Colombia.jpg](https://commons.wikimedia.org/wiki/File:Coffee_tree_in_Hacienda_Guayabal,_Colombia.jpg) | Bernard Gagnon | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Café | [Coffea arabica 2.jpg](https://commons.wikimedia.org/wiki/File:Coffea_arabica_2.jpg) | Kızıldeniz | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Café | [Coffea arabica, coffee beans .jpg](https://commons.wikimedia.org/wiki/File:Coffea_arabica,_coffee_beans_.jpg) | Renjusplace | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Arroz | [Blond and green rice fields.jpg](https://commons.wikimedia.org/wiki/File:Blond_and_green_rice_fields.jpg) | Basile Morin | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Palma de aceite | [Oil palm plantation in Mersing District.jpg](https://commons.wikimedia.org/wiki/File:Oil_palm_plantation_in_Mersing_District.jpg) | Wee Hong | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Cacao | [Cacao fruit in Côte d'Ivoire (11).JPG](https://commons.wikimedia.org/wiki/File:Cacao_fruit_in_C%C3%B4te_d%27Ivoire_(11).JPG) | Hanay | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Cacao | [Theobroma cacao fruit.jpg](https://commons.wikimedia.org/wiki/File:Theobroma_cacao_fruit.jpg) | Bernard Gagnon | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Caña de azúcar | [Sugarcane plantation 01.jpg](https://commons.wikimedia.org/wiki/File:Sugarcane_plantation_01.jpg) | Filo gèn' | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Yuca | [Cassava plants.jpg](https://commons.wikimedia.org/wiki/File:Cassava_plants.jpg) | Munkaila Sulemana | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |

Además se usan fotografías de [Unsplash](https://unsplash.com/license) (banano, maíz y café) bajo la licencia Unsplash.

> La galería de detalle de la app muestra el crédito (autor · licencia) de cada imagen.
> Si Supabase no responde, el prototipo muestra datos de demostración con un aviso visible.

> Documentación elaborada por el equipo Scrum AgroConnect con base en el set documental oficial del proyecto formativo.
