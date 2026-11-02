# Informe General del Sistema — PT-IGS-01

**Caso Simulado:** Plataforma de Comercio Electrónico — Módulo de Gestión de Usuarios

| Campo | Valor |
|-------|-------|
| **Código** | PT-IGS-01 |
| **Versión** | 1.0 |
| **Fecha** | 2026-07-03 |
| **Metodología** | RUP + Scrum (Contexto Formativo SENA ADSO) |

---

# PARTE 1: CARACTERÍSTICAS Y USUARIOS

## 1. Descripción del Sistema

| Atributo | Valor |
|----------|-------|
| **Nombre** | Módulo de Gestión de Usuarios |
| **Tipo** | Subsistema de plataforma e-commerce |
| **Objetivo** | Gestionar el ciclo de vida de la cuenta de usuario: registro, autenticación, recuperación de acceso, consulta de pedidos, cancelación y actualización de perfil |
| **Alcance** | Funcionalidades de usuario final sin incluir administración, catálogo de productos, carrito de compras ni procesamiento de pagos |

El sistema permite que usuarios visitantes creen una cuenta, accedan a ella de forma segura, consulten y gestionen sus pedidos, actualicen su información personal y cierren sesión. Está diseñado como un módulo independiente que puede integrarse en una plataforma e-commerce más amplia.

## 2. Características Principales

| # | Característica | Descripción |
|:-:|----------------|-------------|
| 1 | Registro de cuenta | Creación de cuenta con verificación por correo electrónico y validación de política de contraseñas |
| 2 | Inicio de sesión | Autenticación con JWT, control de intentos fallidos y bloqueo temporal |
| 3 | Cierre de sesión | Invalidación explícita del token de sesión |
| 4 | Recuperación de contraseña | Restablecimiento mediante enlace temporizado de 30 minutos enviado al correo |
| 5 | Consulta de pedidos | Lista paginada con resumen de órdenes del usuario autenticado |
| 6 | Detalle de pedido | Vista completa con productos, costos desglosados e historial de estados |
| 7 | Cancelación de pedido | Anulación de pedidos en estados pendiente o confirmado |
| 8 | Actualización de perfil | Modificación de nombre, teléfono y dirección por parte del usuario |

## 3. Usuarios del Sistema

| Actor | Descripción | Participación en CU |
|-------|-------------|---------------------|
| Usuario Visitante | Persona sin cuenta que navega la plataforma | CU-01 (Registrar cuenta) |
| Usuario Registrado | Persona con cuenta creada, verificada o no | CU-02 (Iniciar sesión — si verificada), CU-04 (Recuperar contraseña) |
| Usuario Autenticado | Usuario con sesión activa (token JWT válido) | CU-03 (Cerrar sesión), CU-05 (Lista de pedidos), CU-06 (Detalle de pedido), CU-07 (Cancelar pedido), CU-08 (Actualizar perfil) |

## 4. Casos de Uso

Total: **8 CU**. Ver documento PT-ECU-01 (`03-cu-ecommerce.md`) para detalle completo.

| ID | Nombre | Actor | Prioridad |
|----|--------|-------|:---------:|
| CU-01 | Registrar cuenta | Usuario Visitante | Alta |
| CU-02 | Iniciar sesión | Usuario Registrado | Alta |
| CU-03 | Cerrar sesión | Usuario Autenticado | Alta |
| CU-04 | Recuperar contraseña | Usuario Registrado | Media |
| CU-05 | Consultar lista de pedidos | Usuario Autenticado | Alta |
| CU-06 | Consultar detalle de pedido | Usuario Autenticado | Media |
| CU-07 | Cancelar pedido | Usuario Autenticado | Baja |
| CU-08 | Actualizar perfil | Usuario Autenticado | Media |

## 5. Entorno Operativo

| Componente | Tecnología |
|------------|------------|
| **Frontend** | React + Vite + TypeScript + Tailwind CSS |
| **Backend** | Node.js + Express + TypeScript |
| **Base de datos** | PostgreSQL |
| **ORM** | Prisma |
| **Autenticación** | JWT (access token 24h + refresh token) |
| **Correo** | Nodemailer / servicio SMTP transaccional |
| **Entorno de desarrollo** | Node 20+, npm, TypeScript 5+ |

---

# PARTE 2: PLANO MAESTRO DEL SOFTWARE

## 6. Arquitectura

El módulo sigue una **arquitectura en capas** con separación de responsabilidades:

```
┌─────────────────────────┐
│   Capa de Presentación  │  React + React Router
│   (Frontend)            │  Formularios, vistas, componentes UI
├─────────────────────────┤
│   Capa de API           │  Express Router + Middleware
│   (REST)                │  Endpoints, validación, autenticación
├─────────────────────────┤
│   Capa de Servicios     │  Lógica de negocio: registro,
│   (Business Logic)      │  autenticación, pedidos, perfil
├─────────────────────────┤
│   Capa de Datos         │  Prisma ORM + PostgreSQL
│   (Persistencia)        │  Modelos: User, Order, OrderItem, etc.
└─────────────────────────┘
```

### Flujo de datos transversal

1. El frontend envía peticiones HTTP autenticadas con JWT en el header `Authorization: Bearer <token>`.
2. El middleware de Express valida el token y extrae el `userId`.
3. El controlador delega en el servicio correspondiente.
4. El servicio ejecuta la lógica de negocio e interactúa con Prisma.
5. La respuesta viaja de vuelta en formato JSON estructurado.

### Seguridad

- Contraseñas hasheadas con bcrypt.
- Tokens JWT firmados con secreto de entorno.
- Rate limiting en login y recuperación de contraseña.
- Validación de pertenencia de recursos (un usuario solo ve sus propios pedidos).
- Bloqueo temporal tras 5 intentos fallidos de login.

## 7. Modelo de Datos

### Diagrama Entidad-Relación (MER)

```
┌─────────────────┐       ┌──────────────────┐
│      User       │       │     Order        │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │◄──────│ userId (FK)      │
│ email (unique)  │ 1   N │ id (PK)          │
│ passwordHash    │       │ status           │
│ name            │       │ total            │
│ phone           │       │ shippingAddress  │
│ address         │       │ createdAt        │
│ emailVerified   │       │ updatedAt        │
│ lockedUntil     │       └────────┬─────────┘
│ failedAttempts  │                │ 1
│ createdAt       │       ┌────────▼─────────┐
│ updatedAt       │       │   OrderItem      │
└─────────────────┘       ├──────────────────┤
                          │ id (PK)          │
┌─────────────────┐       │ orderId (FK)     │
│ PasswordToken   │       │ productName      │
├─────────────────┤       │ quantity         │
│ id (PK)         │       │ unitPrice        │
│ userId (FK)     │       │ subtotal         │
│ token (unique)  │       └──────────────────┘
│ expiresAt       │
│ used            │
│ createdAt       │
└─────────────────┘
```

### Tablas principales

1. **User** — Almacena datos de la cuenta (nombre, email, password hash, dirección, teléfono, estado de verificación, control de intentos fallidos y bloqueo).
2. **PasswordToken** — Tokens de restablecimiento de contraseña con expiración de 30 minutos y marcador de uso.
3. **Order** — Pedidos del usuario con estado, total, dirección de envío y timestamps.
4. **OrderItem** — Líneas de cada pedido con producto, cantidad, precio unitario y subtotal.

### Índices y constraints

- `User.email`: unique index (búsqueda por correo en login y registro).
- `PasswordToken.token`: unique index (búsqueda por token de restablecimiento).
- `Order.userId`: index para filtrar pedidos por usuario.
- `Order.status`: index para filtrar pedidos cancelables.
- Foreign key `Order.userId → User.id` con restricción de integridad referencial.

## 8. Tecnologías

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| Frontend | React 18 + Vite + TypeScript | Rendimiento, tipado estricto, ecosistema maduro |
| Estilos | Tailwind CSS | Utilidades primero, diseño responsive rápido |
| Backend | Node.js + Express + TypeScript | REST API ligera, tipado seguro, amplia adopción |
| ORM | Prisma | Type-safe queries, migraciones, schema declarativo |
| Base de datos | PostgreSQL | Confiabilidad, soporte transaccional, madurez |
| Autenticación | JWT + bcrypt | Stateless, seguro, estándar de la industria |
| Testing | Jest + Supertest (API) | Cobertura unitaria e integración |

## 9. Integraciones

| Integración | Propósito |
|-------------|-----------|
| Nodemailer / SMTP | Envío de correos de verificación y restablecimiento de contraseña |
| Servicio de logging (Pino) | Registro estructurado de eventos de seguridad y errores |

## 10. Diagrama de Clases

### Clases del dominio

```
┌─────────────────────────────┐
│         User                │
├─────────────────────────────┤
│ - id: string                │
│ - email: Email              │
│ - passwordHash: string      │
│ - name: string              │
│ - phone: Phone              │
│ - address: Address          │
│ - emailVerified: boolean    │
│ - lockedUntil: Date | null  │
│ - failedAttempts: number    │
│ - createdAt: Date           │
│ - updatedAt: Date           │
├─────────────────────────────┤
│ + isLocked(): boolean       │
│ + incrementFailedAttempts() │
│ + resetFailedAttempts()     │
│ + lock(duration: number)    │
└─────────────────────────────┘

┌─────────────────────────────┐
│      PasswordToken          │
├─────────────────────────────┤
│ - id: string                │
│ - userId: string            │
│ - token: string             │
│ - expiresAt: Date           │
│ - used: boolean             │
│ - createdAt: Date           │
├─────────────────────────────┤
│ + isValid(): boolean        │
│ + markAsUsed(): void        │
└─────────────────────────────┘

┌─────────────────────────────┐
│         Order               │
├─────────────────────────────┤
│ - id: string                │
│ - userId: string            │
│ - status: OrderStatus       │
│ - total: Money              │
│ - shippingAddress: Address  │
│ - createdAt: Date           │
│ - updatedAt: Date           │
├─────────────────────────────┤
│ + isCancellable(): boolean  │
│ + cancel(): void            │
└─────────────────────────────┘

┌─────────────────────────────┐
│       OrderItem             │
├─────────────────────────────┤
│ - id: string                │
│ - orderId: string           │
│ - productName: string       │
│ - quantity: number          │
│ - unitPrice: Money          │
│ - subtotal: Money           │
└─────────────────────────────┘
```

### Enumeraciones

```
OrderStatus: PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
```

---

# PARTE 3: DE LA IDEA A LA APP

## 11. Prototipado

### Mockups y diseño UI

El módulo cuenta con las siguientes vistas prototipadas:

| Vista | Descripción |
|-------|-------------|
| Registro | Formulario con nombre, email, contraseña, confirmación, teléfono, dirección |
| Inicio de sesión | Formulario de email + contraseña con enlace a recuperación |
| Recuperación de contraseña | Paso 1: solicitar enlace. Paso 2: nueva contraseña |
| Dashboard / Mis pedidos | Lista paginada de pedidos del usuario |
| Detalle de pedido | Vista completa con productos, costos e historial |
| Cancelación | Diálogo de confirmación con retroalimentación |
| Mi perfil | Formulario con datos precargados para editar nombre, teléfono, dirección |

### Design System (propuesto)

| Token | Valor |
|-------|-------|
| Color primario | `#2563EB` (azul — confianza, seguridad) |
| Color de éxito | `#16A34A` (verde) |
| Color de error | `#DC2626` (rojo) |
| Tipografía | Inter (UI), sistema sans-serif (contenido) |
| Touch targets | Mínimo 44x44px (accesibilidad) |
| Contraste | WCAG AA mínimo (4.5:1) |

## 12. Historias de Usuario

Total: **8 HU refinadas**. Ver documento `04-historias-refinadas.md` para detalle completo.

| ID | Historia | Prioridad | SP |
|:--:|----------|:---------:|:--:|
| HU-01 | Como usuario visitante, quiero registrarme... | P1 | 5 |
| HU-02 | Como usuario registrado y verificado, quiero iniciar sesión... | P1 | 5 |
| HU-08 | Como usuario autenticado, quiero cerrar mi sesión... | P1 | 2 |
| HU-04 | Como usuario autenticado, quiero ver una lista paginada de mis pedidos... | P1 | 3 |
| HU-03 | Como usuario registrado que olvidó su contraseña, quiero solicitar un enlace... | P2 | 5 |
| HU-05 | Como usuario autenticado, quiero ver el detalle completo de un pedido... | P2 | 3 |
| HU-07 | Como usuario autenticado, quiero actualizar mi información personal... | P2 | 3 |
| HU-06 | Como usuario autenticado, quiero cancelar un pedido... | P3 (recomendado P2) | 3 |
| **Total** | **8 HU** | — | **29** |

### Criterios de refinamiento aplicados

1. **Descomposición**: HU original "Gestión de cuenta" se dividió en HU-01 (registro), HU-02 (login), HU-08 (cierre).
2. **Redacción completa**: Cada HU sigue el formato "Como… Quiero… Para…" con propósito y criterios BDD.
3. **Priorización**: P1 (funcionalidades críticas de autenticación y consulta), P2 (recuperación, detalle, perfil), P3 (cancelación).
4. **Estimación**: 29 SP totales usando talla relativa (Fibonacci-like: 2, 3, 5).

## 13. Plan de Sprints

Distribución en 3 sprints según prioridad y dependencias:

### Sprint 1 (15 SP) — Fundación

| HU | Descripción | SP |
|:--:|-------------|:--:|
| HU-01 | Registro de cuenta | 5 |
| HU-02 | Inicio de sesión | 5 |
| HU-08 | Cierre de sesión | 2 |
| HU-04 | Consultar lista de pedidos | 3 |
| **Total** | **4 HU** | **15** |

*Dependencias cubiertas: HU-02 ← HU-01, HU-08 ← HU-02, HU-04 ← HU-02*

### Sprint 2 (11 SP) — Valor

| HU | Descripción | SP |
|:--:|-------------|:--:|
| HU-03 | Recuperación de contraseña | 5 |
| HU-05 | Consultar detalle de pedido | 3 |
| HU-07 | Actualizar perfil | 3 |
| **Total** | **3 HU** | **11** |

*Dependencias cubiertas: HU-03 ← HU-01, HU-05 ← HU-04, HU-07 ← HU-02*

### Sprint 3 (3 SP) — Mejora

| HU | Descripción | SP |
|:--:|-------------|:--:|
| HU-06 | Cancelar pedido | 3 |
| **Total** | **1 HU** | **3** |

*Dependencias cubiertas: HU-06 ← HU-05*

## 14. Prototipo Funcional

### Stack de desarrollo

```bash
# Frontend
npx create-vite@latest ecommerce-front --template react-ts
npm install react-router-dom tailwindcss @tailwindcss/vite

# Backend
mkdir ecommerce-api && cd ecommerce-api
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken
npm install -D typescript @types/* ts-node nodemon
npm install @prisma/client
npx prisma init
```

### Endpoints de la API

| Método | Ruta | Autenticación | CU |
|--------|------|:-------------:|:--:|
| POST | `/api/auth/register` | No | CU-01 |
| POST | `/api/auth/login` | No | CU-02 |
| POST | `/api/auth/logout` | Sí | CU-03 |
| POST | `/api/auth/forgot-password` | No | CU-04 |
| POST | `/api/auth/reset-password/:token` | No | CU-04 |
| GET | `/api/orders` | Sí | CU-05 |
| GET | `/api/orders/:id` | Sí | CU-06 |
| PATCH | `/api/orders/:id/cancel` | Sí | CU-07 |
| PATCH | `/api/profile` | Sí | CU-08 |

## 15. Refinamiento

### Proceso de refinamiento aplicado

1. **Análisis de HU originales**: Se identificaron ambigüedades, faltas de detalle y dependencias no declaradas.
2. **Descomposición funcional**: La HU original "Gestión de cuenta" se descompuso en 3 HU independientes (registro, login, cierre).
3. **Redacción completa**: Cada HU recibió redacción CQ-P, propósito explícito y criterios de aceptación en formato BDD.
4. **Trazabilidad**: Se estableció matriz RF ↔ CU ↔ HU con cobertura 100%.
5. **Priorización y estimación**: Backlog priorizado con 29 SP distribuidos en 3 sprints.

### Lecciones aprendidas

- La descomposición de HU genéricas reduce ambigüedad y permite mejor estimación.
- La trazabilidad RF-CU-HU garantiza que ningún requisito quede sin implementar.
- Las fichas técnicas facilitan la planificación de sprints al concentrar toda la información de una HU en un solo lugar.
- La matriz de trazabilidad y el backlog priorizado son herramientas complementarias: una asegura cobertura, el otra guía la ejecución.

### Trazabilidad consolidada

| RF | Descripción | CU | HU | Prioridad |
|:--:|-------------|:--:|:--:|:---------:|
| RF-01 | Registro de cuenta | CU-01 | HU-01 | P1 |
| RF-02 | Inicio de sesión | CU-02 | HU-02 | P1 |
| RF-03 | Cierre de sesión | CU-03 | HU-08 | P1 |
| RF-04 | Recuperación de contraseña | CU-04 | HU-03 | P2 |
| RF-05 | Consulta de lista de pedidos | CU-05 | HU-04 | P1 |
| RF-06 | Consulta de detalle de pedido | CU-06 | HU-05 | P2 |
| RF-07 | Cancelación de pedido | CU-07 | HU-06 | P3 |
| RF-08 | Actualización de perfil | CU-08 | HU-07 | P2 |

**Totales: 8 RF · 8 CU · 8 HU · 3 niveles de prioridad · 29 SP · 3 sprints**

---

## Anexos

| Documento | Archivo |
|-----------|---------|
| Análisis y corrección de HU | `01-analisis-correccion-historias.md` |
| Requisitos funcionales | `02-rf-ecommerce.md` |
| Casos de uso (PT-ECU-01) | `03-cu-ecommerce.md` |
| Historias de usuario refinadas | `04-historias-refinadas.md` |
| Matriz de trazabilidad | `05-matriz-trazabilidad.md` |
| Backlog priorizado | `06-backlog-priorizado.md` |
| Fichas técnicas | `07-fichas-tecnicas.md` |
| **Este documento** | **`08-pt-igs-01.md`** |
| Guion de video de sustentación | `09-guion-video.md` |
