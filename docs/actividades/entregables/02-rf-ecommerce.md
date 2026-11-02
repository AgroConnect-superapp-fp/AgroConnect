# Requisitos Funcionales — Módulo de Usuarios (Caso E-commerce)

## Datos Generales

| Campo | Valor |
|-------|-------|
| **Proyecto** | Caso Simulado — Plataforma de Comercio Electrónico |
| **Módulo** | Gestión de Usuarios |
| **Total RF** | 8 |
| **Versión** | 1.0 |
| **Fecha** | 2026-07-03 |

---

## RF-01: Registro de Cuenta

| Atributo | Valor |
|----------|-------|
| **ID** | RF-01 |
| **Nombre** | Registro de cuenta de usuario |
| **Descripción** | El sistema debe permitir que un usuario visitante se registre proporcionando: nombre completo, correo electrónico, contraseña, teléfono y dirección de envío. |
| **Actor** | Usuario Visitante |
| **Prioridad** | Alta |
| **Dependencias** | — |
| **Criterios de aceptación** | El sistema valida que el correo no exista previamente; la contraseña cumple políticas de seguridad (mín. 8 caracteres, 1 mayúscula, 1 número); se envía correo de verificación. |

### Especificación

- **Entrada**: nombre, correo electrónico, contraseña, confirmación de contraseña, teléfono, dirección.
- **Validaciones**:
  - Correo electrónico con formato válido.
  - Contraseña ≥ 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número.
  - Confirmación de contraseña coincide.
  - Correo electrónico no registrado previamente.
- **Salida**: Cuenta creada con estado "pendiente de verificación". Se envía correo con enlace de verificación.
- **Postcondición**: El usuario queda registrado pero no puede iniciar sesión hasta verificar su correo.

---

## RF-02: Inicio de Sesión

| Atributo | Valor |
|----------|-------|
| **ID** | RF-02 |
| **Nombre** | Inicio de sesión de usuario |
| **Descripción** | El sistema debe permitir que un usuario registrado y verificado inicie sesión con su correo electrónico y contraseña. |
| **Actor** | Usuario Registrado |
| **Prioridad** | Alta |
| **Dependencias** | RF-01 |

### Especificación

- **Entrada**: correo electrónico, contraseña.
- **Validaciones**:
  - La cuenta debe estar verificada (correo confirmado).
  - La contraseña debe coincidir con el hash almacenado.
  - Máximo 5 intentos fallidos antes de bloqueo temporal (15 minutos).
- **Salida**: Token de sesión (JWT) con vigencia de 24 horas.
- **Postcondición**: El usuario accede al dashboard con sus datos y funcionalidades disponibles según su rol.

---

## RF-03: Cierre de Sesión

| Atributo | Valor |
|----------|-------|
| **ID** | RF-03 |
| **Nombre** | Cierre de sesión |
| **Descripción** | El sistema debe permitir que un usuario autenticado cierre su sesión de forma explícita, invalidando el token actual. |
| **Actor** | Usuario Autenticado |
| **Prioridad** | Alta |
| **Dependencias** | RF-02 |

### Especificación

- **Entrada**: Token de sesión activo.
- **Proceso**: El sistema invalida el token (lo agrega a lista negra o lo elimina).
- **Salida**: Confirmación de cierre de sesión. Redirección a la página de inicio/login.
- **Postcondición**: El token deja de ser válido. Se requiere nueva autenticación para acceder.

---

## RF-04: Recuperación de Contraseña

| Atributo | Valor |
|----------|-------|
| **ID** | RF-04 |
| **Nombre** | Recuperación de contraseña |
| **Descripción** | El sistema debe permitir que un usuario registrado solicite la recuperación de su contraseña mediante el envío de un enlace de restablecimiento a su correo electrónico registrado. |
| **Actor** | Usuario Registrado |
| **Prioridad** | Media |
| **Dependencias** | RF-01 |

### Especificación

- **Entrada**: Correo electrónico registrado.
- **Proceso**:
  1. El sistema verifica que el correo exista.
  2. Genera un token de restablecimiento con vigencia de 30 minutos.
  3. Envía un correo con el enlace de restablecimiento.
  4. El usuario hace clic en el enlace, ingresa y confirma una nueva contraseña.
- **Validaciones**:
  - La nueva contraseña debe cumplir las mismas políticas que RF-01.
- **Salida**: Confirmación de cambio exitoso.
- **Postcondición**: El usuario puede iniciar sesión con la nueva contraseña.

---

## RF-05: Consulta de Lista de Pedidos

| Atributo | Valor |
|----------|-------|
| **ID** | RF-05 |
| **Nombre** | Consulta de lista de pedidos |
| **Descripción** | El sistema debe mostrar al usuario autenticado una lista paginada de sus pedidos realizados, ordenados del más reciente al más antiguo, con información resumida de cada uno. |
| **Actor** | Usuario Autenticado |
| **Prioridad** | Alta |
| **Dependencias** | RF-02 |

### Especificación

- **Entrada**: Token de autenticación (identifica al usuario).
- **Salida**: Lista paginada (10 pedidos por página) con:
  - Número de pedido
  - Fecha
  - Estado (pendiente, confirmado, enviado, entregado, cancelado)
  - Total
  - Cantidad de artículos
- **Postcondición**: Visualización de la tabla de pedidos.

---

## RF-06: Consulta de Detalle de Pedido

| Atributo | Valor |
|----------|-------|
| **ID** | RF-06 |
| **Nombre** | Consulta de detalle de pedido |
| **Descripción** | El sistema debe permitir que un usuario autenticado consulte el detalle completo de uno de sus pedidos. |
| **Actor** | Usuario Autenticado |
| **Prioridad** | Media |
| **Dependencias** | RF-05 |

### Especificación

- **Entrada**: ID del pedido + token de autenticación.
- **Validaciones**: El pedido debe pertenecer al usuario autenticado.
- **Salida**:
  - Número de pedido, fecha, estado
  - Dirección de envío
  - Lista de artículos (nombre, cantidad, precio unitario, subtotal)
  - Subtotal, impuestos, costo de envío, total
  - Historial de estados (fecha y estado anterior)

---

## RF-07: Cancelación de Pedido

| Atributo | Valor |
|----------|-------|
| **ID** | RF-07 |
| **Nombre** | Cancelación de pedido |
| **Descripción** | El sistema debe permitir que un usuario autenticado cancele un pedido siempre que su estado sea "pendiente" o "confirmado". |
| **Actor** | Usuario Autenticado |
| **Prioridad** | Baja |
| **Dependencias** | RF-06 |

### Especificación

- **Entrada**: ID del pedido + token de autenticación.
- **Validaciones**:
  - El pedido debe pertenecer al usuario.
  - El estado debe ser "pendiente" o "confirmado" (no se pueden cancelar pedidos ya enviados o entregados).
- **Proceso**: El sistema cambia el estado del pedido a "cancelado" y registra la fecha/hora de cancelación.
- **Salida**: Confirmación de cancelación. El pedido ya no es elegible para modificación.
- **Postcondición**: El estado del pedido se actualiza a "cancelado".

---

## RF-08: Actualización de Perfil

| Atributo | Valor |
|----------|-------|
| **ID** | RF-08 |
| **Nombre** | Actualización de información de perfil |
| **Descripción** | El sistema debe permitir que un usuario autenticado actualice su información personal: nombre, teléfono, dirección. |
| **Actor** | Usuario Autenticado |
| **Prioridad** | Media |
| **Dependencias** | RF-02 |

### Especificación

- **Entrada**: Campos a actualizar (nombre, teléfono, dirección) + token de autenticación.
- **Validaciones**:
  - El nombre no puede estar vacío.
  - El teléfono debe tener formato válido (Colombia: 10 dígitos).
  - La dirección no puede estar vacía.
- **Restricciones**: El correo electrónico NO se puede modificar; si se desea cambiar, debe realizar el proceso de recuperación o contactar a soporte.
- **Salida**: Confirmación de actualización con los datos reflejados.
- **Postcondición**: Los datos del usuario se actualizan en la base de datos.

---

## Resumen de RF

| ID | Nombre | Prioridad | Dependencias |
|----|--------|-----------|--------------|
| RF-01 | Registro de cuenta | Alta | — |
| RF-02 | Inicio de sesión | Alta | RF-01 |
| RF-03 | Cierre de sesión | Alta | RF-02 |
| RF-04 | Recuperación de contraseña | Media | RF-01 |
| RF-05 | Consulta de lista de pedidos | Alta | RF-02 |
| RF-06 | Consulta de detalle de pedido | Media | RF-05 |
| RF-07 | Cancelación de pedido | Baja | RF-06 |
| RF-08 | Actualización de perfil | Media | RF-02 |
