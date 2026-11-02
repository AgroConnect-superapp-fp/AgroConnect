# Fichas Técnicas de Historias de Usuario — Módulo de Usuarios (Caso E-commerce)

## Datos Generales

| Campo | Valor |
|-------|-------|
| **Proyecto** | Caso Simulado — Plataforma de Comercio Electrónico |
| **Módulo** | Gestión de Usuarios |
| **Total fichas** | 8 |
| **Versión** | 1.0 |
| **Fecha** | 2026-07-03 |

---

## Ficha HU-01: Registro de Cuenta

| Campo | Valor |
|-------|-------|
| **ID** | HU-01 |
| **Nombre** | Registro de cuenta |
| **Actor** | Usuario Visitante |
| **RF Asociado** | RF-01 — Registro de cuenta |
| **CU Asociado** | CU-01 — Registrar cuenta |
| **Prioridad** | P1 (Crítica) |
| **Dependencias** | — |
| **Esfuerzo estimado** | 5 SP |

**Historia:**
> Como usuario visitante, quiero registrarme en la plataforma proporcionando mis datos personales, para crear una cuenta y poder realizar compras.

**Propósito:**
Habilitar el acceso al e-commerce mediante la creación de una cuenta segura con verificación por correo.

**Criterios de Aceptación:**
1. Registro exitoso con envío de correo de verificación.
2. Rechazo si el correo ya está registrado.
3. Rechazo si la contraseña no cumple política de seguridad.
4. Validación de campos obligatorios.

---

## Ficha HU-02: Inicio de Sesión

| Campo | Valor |
|-------|-------|
| **ID** | HU-02 |
| **Nombre** | Inicio de sesión |
| **Actor** | Usuario Registrado (verificado) |
| **RF Asociado** | RF-02 — Inicio de sesión |
| **CU Asociado** | CU-02 — Iniciar sesión |
| **Prioridad** | P1 (Crítica) |
| **Dependencias** | HU-01 |
| **Esfuerzo estimado** | 5 SP |

**Historia:**
> Como usuario registrado y verificado, quiero iniciar sesión con mi correo y contraseña, para acceder a mi cuenta y gestionar mis pedidos.

**Propósito:**
Autenticar usuarios de forma segura, protegiendo la cuenta contra accesos no autorizados mediante límite de intentos fallidos.

**Criterios de Aceptación:**
1. Inicio de sesión exitoso con token JWT.
2. Mensaje de error y conteo de intentos si la contraseña es incorrecta.
3. Bloqueo de 15 minutos tras 5 intentos fallidos.
4. Mensaje si la cuenta no está verificada.

---

## Ficha HU-03: Recuperación de Contraseña

| Campo | Valor |
|-------|-------|
| **ID** | HU-03 |
| **Nombre** | Recuperación de contraseña |
| **Actor** | Usuario Registrado |
| **RF Asociado** | RF-04 — Recuperación de contraseña |
| **CU Asociado** | CU-04 — Recuperar contraseña |
| **Prioridad** | P2 (Importante) |
| **Dependencias** | HU-01 |
| **Esfuerzo estimado** | 5 SP |

**Historia:**
> Como usuario registrado que olvidó su contraseña, quiero solicitar un enlace de restablecimiento a mi correo, para crear una nueva contraseña y recuperar el acceso a mi cuenta.

**Propósito:**
Permitir que los usuarios recuperen el acceso a su cuenta de forma segura y autónoma mediante token temporizado de 30 minutos.

**Criterios de Aceptación:**
1. Restablecimiento exitoso con enlace válido y nueva contraseña.
2. Mensaje de error si el enlace ha expirado.
3. Validación de política de seguridad para la nueva contraseña.

---

## Ficha HU-04: Consultar Lista de Pedidos

| Campo | Valor |
|-------|-------|
| **ID** | HU-04 |
| **Nombre** | Consultar lista de pedidos |
| **Actor** | Usuario Autenticado |
| **RF Asociado** | RF-05 — Consulta de lista de pedidos |
| **CU Asociado** | CU-05 — Consultar lista de pedidos |
| **Prioridad** | P1 (Crítica) |
| **Dependencias** | HU-02 |
| **Esfuerzo estimado** | 3 SP |

**Historia:**
> Como usuario autenticado, quiero ver una lista paginada de mis pedidos ordenados del más reciente al más antiguo, para dar seguimiento a mis compras.

**Propósito:**
Proveer una vista resumida y navegable de todas las órdenes del usuario.

**Criterios de Aceptación:**
1. Lista paginada con datos resumidos.
2. Mensaje informativo si no hay pedidos.
3. Controles de paginación funcionales.

---

## Ficha HU-05: Consultar Detalle de Pedido

| Campo | Valor |
|-------|-------|
| **ID** | HU-05 |
| **Nombre** | Consultar detalle de pedido |
| **Actor** | Usuario Autenticado |
| **RF Asociado** | RF-06 — Consulta de detalle de pedido |
| **CU Asociado** | CU-06 — Consultar detalle de pedido |
| **Prioridad** | P2 (Importante) |
| **Dependencias** | HU-04 |
| **Esfuerzo estimado** | 3 SP |

**Historia:**
> Como usuario autenticado, quiero ver el detalle completo de un pedido específico, para conocer los artículos comprados, los costos y el estado actual del envío.

**Propósito:**
Brindar información detallada de cada pedido incluyendo productos, costos desglosados e historial de cambios de estado.

**Criterios de Aceptación:**
1. Visualización de todos los datos del pedido.
2. Error 403 si se intenta acceder a un pedido ajeno.
3. Visualización del historial de cambios de estado.

---

## Ficha HU-06: Cancelar Pedido

| Campo | Valor |
|-------|-------|
| **ID** | HU-06 |
| **Nombre** | Cancelar pedido |
| **Actor** | Usuario Autenticado |
| **RF Asociado** | RF-07 — Cancelación de pedido |
| **CU Asociado** | CU-07 — Cancelar pedido |
| **Prioridad** | P3 (Mejora) / Recomendado P2 |
| **Dependencias** | HU-05 |
| **Esfuerzo estimado** | 3 SP |

**Historia:**
> Como usuario autenticado, quiero cancelar un pedido siempre que esté en estado pendiente o confirmado, para evitar compras que ya no deseo recibir.

**Propósito:**
Permitir que los usuarios anulen pedidos antes de que sean procesados para envío.

**Criterios de Aceptación:**
1. Cancelación exitosa si el estado lo permite.
2. Mensaje de error si el pedido ya fue enviado o entregado.
3. Sin cambios si el usuario aborta la cancelación.

---

## Ficha HU-07: Actualizar Perfil

| Campo | Valor |
|-------|-------|
| **ID** | HU-07 |
| **Nombre** | Actualizar perfil |
| **Actor** | Usuario Autenticado |
| **RF Asociado** | RF-08 — Actualización de perfil |
| **CU Asociado** | CU-08 — Actualizar perfil |
| **Prioridad** | P2 (Importante) |
| **Dependencias** | HU-02 |
| **Esfuerzo estimado** | 3 SP |

**Historia:**
> Como usuario autenticado, quiero actualizar mi información personal (nombre, teléfono, dirección), para mantener mis datos actualizados y recibir pedidos correctamente.

**Propósito:**
Permitir que los usuarios modifiquen sus datos personales de forma autónoma.

**Criterios de Aceptación:**
1. Actualización exitosa con datos válidos.
2. Errores de validación si los datos son inválidos.
3. Restricción de modificación del correo electrónico.

---

## Ficha HU-08: Cierre de Sesión

| Campo | Valor |
|-------|-------|
| **ID** | HU-08 |
| **Nombre** | Cierre de sesión |
| **Actor** | Usuario Autenticado |
| **RF Asociado** | RF-03 — Cierre de sesión |
| **CU Asociado** | CU-03 — Cerrar sesión |
| **Prioridad** | P1 (Crítica) |
| **Dependencias** | HU-02 |
| **Esfuerzo estimado** | 2 SP |

**Historia:**
> Como usuario autenticado, quiero cerrar mi sesión de forma explícita, para proteger mi cuenta cuando termino de usar la plataforma o accedo desde un dispositivo compartido.

**Propósito:**
Garantizar la seguridad de la cuenta permitiendo al usuario finalizar su sesión activa.

**Criterios de Aceptación:**
1. Cierre exitoso con invalidación de token.
2. Sin cambios si el usuario cancela la operación.

---

## Resumen General

| Ficha | ID | Prioridad | SP | Dependencias |
|-------|:--:|:---------:|:--:|:------------:|
| Registro de cuenta | HU-01 | P1 | 5 | — |
| Inicio de sesión | HU-02 | P1 | 5 | HU-01 |
| Recuperación de contraseña | HU-03 | P2 | 5 | HU-01 |
| Consultar lista de pedidos | HU-04 | P1 | 3 | HU-02 |
| Consultar detalle de pedido | HU-05 | P2 | 3 | HU-04 |
| Cancelar pedido | HU-06 | P3 | 3 | HU-05 |
| Actualizar perfil | HU-07 | P2 | 3 | HU-02 |
| Cierre de sesión | HU-08 | P1 | 2 | HU-02 |
| **Total** | **8** | — | **29** | — |
