# Casos de Uso — Módulo de Usuarios (Caso E-commerce)

## Datos Generales

| Campo | Valor |
|-------|-------|
| **Proyecto** | Caso Simulado — Plataforma de Comercio Electrónico |
| **Módulo** | Gestión de Usuarios |
| **Total CU** | 8 |
| **Versión** | 1.0 |
| **Fecha** | 2026-07-03 |

---

## CU-01: Registrar Cuenta

| Atributo | Valor |
|----------|-------|
| **ID** | CU-01 |
| **Nombre** | Registrar cuenta de usuario |
| **Actor** | Usuario Visitante |
| **Descripción** | Permite que una persona sin cuenta cree una nueva cuenta en la plataforma proporcionando sus datos personales. |
| **Precondición** | El usuario no tiene una cuenta activa con el correo proporcionado. |
| **Postcondición** | Se crea una cuenta con estado "pendiente de verificación". Se envía correo de verificación. |
| **RF asociado** | RF-01 |
| **Prioridad** | Alta |

### Flujo Básico

1. El usuario accede a la opción "Registrarse".
2. El sistema muestra el formulario de registro con los campos: nombre completo, correo electrónico, contraseña, confirmación de contraseña, teléfono, dirección.
3. El usuario completa los campos y envía el formulario.
4. El sistema valida que todos los campos obligatorios estén completos.
5. El sistema valida el formato del correo electrónico.
6. El sistema valida que la contraseña cumpla la política de seguridad (≥ 8 caracteres, 1 mayúscula, 1 número).
7. El sistema verifica que la confirmación de contraseña coincida.
8. El sistema verifica que el correo no esté registrado previamente.
9. El sistema crea la cuenta con estado "pendiente de verificación".
10. El sistema genera un token de verificación y lo envía al correo electrónico.
11. El sistema muestra un mensaje de éxito indicando que revise su correo.

### Flujos Alternativos

**FA-01: Correo ya registrado**
- En el paso 8, si el correo ya existe, el sistema muestra un mensaje: "Este correo ya está registrado. ¿Desea iniciar sesión?"

**FA-02: Contraseña no cumple política**
- En el paso 6, si la contraseña no cumple los requisitos, el sistema muestra los criterios de seguridad no satisfechos.

**FA-03: Campos obligatorios incompletos**
- En el paso 4, si faltan campos obligatorios, el sistema resalta los campos faltantes.

---

## CU-02: Iniciar Sesión

| Atributo | Valor |
|----------|-------|
| **ID** | CU-02 |
| **Nombre** | Iniciar sesión |
| **Actor** | Usuario Registrado |
| **Descripción** | Permite que un usuario registrado y verificado acceda a su cuenta mediante correo electrónico y contraseña. |
| **Precondición** | El usuario tiene una cuenta activa y verificada. |
| **Postcondición** | El usuario obtiene un token de sesión válido. |
| **RF asociado** | RF-02 |
| **Prioridad** | Alta |

### Flujo Básico

1. El usuario accede a la opción "Iniciar sesión".
2. El sistema muestra el formulario de inicio de sesión (correo, contraseña).
3. El usuario ingresa sus credenciales y envía.
4. El sistema verifica que el correo exista en la base de datos.
5. El sistema verifica que la cuenta esté verificada.
6. El sistema verifica que la contraseña coincida con el hash almacenado.
7. El sistema reinicia el contador de intentos fallidos.
8. El sistema genera un token JWT con vigencia de 24 horas.
9. El sistema redirige al usuario al dashboard.

### Flujos Alternativos

**FA-01: Credenciales incorrectas**
- En el paso 6, si la contraseña no coincide, el sistema incrementa el contador de intentos fallidos.
- Si el contador llega a 5, el sistema bloquea la cuenta por 15 minutos.
- Muestra mensaje: "Credenciales incorrectas. Intentos restantes: X."

**FA-02: Cuenta no verificada**
- En el paso 5, si la cuenta no está verificada, el sistema muestra: "Por favor verifica tu correo electrónico antes de iniciar sesión. ¿Reenviar correo de verificación?"

**FA-03: Cuenta bloqueada**
- Si la cuenta está bloqueada por intentos fallidos, el sistema muestra: "Cuenta bloqueada temporalmente. Intenta de nuevo en 15 minutos."

---

## CU-03: Cerrar Sesión

| Atributo | Valor |
|----------|-------|
| **ID** | CU-03 |
| **Nombre** | Cerrar sesión |
| **Actor** | Usuario Autenticado |
| **Descripción** | Permite que un usuario autenticado cierre su sesión explícitamente. |
| **Precondición** | El usuario tiene una sesión activa (token válido). |
| **Postcondición** | El token de sesión se invalida. El usuario es redirigido a la página de inicio. |
| **RF asociado** | RF-03 |
| **Prioridad** | Alta |

### Flujo Básico

1. El usuario hace clic en "Cerrar sesión".
2. El sistema solicita confirmación.
3. El usuario confirma.
4. El sistema invalida el token de sesión.
5. El sistema redirige al usuario a la página de inicio/login.
6. El sistema muestra mensaje: "Sesión cerrada correctamente."

### Flujo Alternativo

**FA-01: Cancelar cierre**
- En el paso 3, si el usuario cancela, el sistema no toma ninguna acción y regresa a la página anterior.

---

## CU-04: Recuperar Contraseña

| Atributo | Valor |
|----------|-------|
| **ID** | CU-04 |
| **Nombre** | Recuperar contraseña |
| **Actor** | Usuario Registrado |
| **Descripción** | Permite que un usuario registrado restablezca su contraseña mediante el envío de un enlace a su correo electrónico. |
| **Precondición** | El usuario tiene una cuenta registrada con el correo proporcionado. |
| **Postcondición** | La contraseña se actualiza. El usuario puede iniciar sesión con la nueva contraseña. |
| **RF asociado** | RF-04 |
| **Prioridad** | Media |

### Flujo Básico

1. El usuario accede a la opción "¿Olvidaste tu contraseña?".
2. El sistema muestra un campo para ingresar el correo electrónico.
3. El usuario ingresa su correo y envía.
4. El sistema verifica que el correo exista en la base de datos.
5. El sistema genera un token de restablecimiento con vigencia de 30 minutos.
6. El sistema envía un correo con el enlace de restablecimiento.
7. El usuario abre el enlace en su correo.
8. El sistema valida que el token sea válido y no haya expirado.
9. El sistema muestra un formulario para ingresar la nueva contraseña.
10. El usuario ingresa y confirma la nueva contraseña.
11. El sistema valida que la contraseña cumpla la política de seguridad.
12. El sistema actualiza la contraseña.
13. El sistema muestra mensaje de éxito y redirige al inicio de sesión.

### Flujos Alternativos

**FA-01: Correo no registrado**
- En el paso 4, si el correo no existe, el sistema muestra: "Si el correo está registrado, recibirás un enlace de restablecimiento." (Por seguridad, no se revela si el correo existe o no.)

**FA-02: Token expirado**
- En el paso 8, si el token expiró, el sistema muestra: "El enlace ha expirado. Solicita un nuevo restablecimiento."

**FA-03: Contraseña no cumple política**
- Similar a CU-01, FA-02.

---

## CU-05: Consultar Lista de Pedidos

| Atributo | Valor |
|----------|-------|
| **ID** | CU-05 |
| **Nombre** | Consultar lista de pedidos |
| **Actor** | Usuario Autenticado |
| **Descripción** | Permite que un usuario autenticado consulte una lista paginada de sus pedidos realizados. |
| **Precondición** | El usuario ha iniciado sesión. |
| **Postcondición** | Se muestra la lista de pedidos del usuario. |
| **RF asociado** | RF-05 |
| **Prioridad** | Alta |

### Flujo Básico

1. El usuario navega a la sección "Mis pedidos".
2. El sistema consulta los pedidos del usuario autenticado.
3. El sistema muestra la lista paginada con: número de pedido, fecha, estado, total, artículos.
4. El usuario puede navegar entre páginas.

### Flujos Alternativos

**FA-01: Sin pedidos**
- Si el usuario no tiene pedidos, el sistema muestra: "Aún no has realizado ningún pedido."

**FA-02: Paginación**
- El usuario puede cambiar de página mediante controles de paginación.

---

## CU-06: Consultar Detalle de Pedido

| Atributo | Valor |
|----------|-------|
| **ID** | CU-06 |
| **Nombre** | Consultar detalle de pedido |
| **Actor** | Usuario Autenticado |
| **Descripción** | Permite que un usuario autenticado vea el detalle completo de uno de sus pedidos. |
| **Precondición** | El usuario tiene al menos un pedido registrado. |
| **Postcondición** | Se muestra el detalle completo del pedido seleccionado. |
| **RF asociado** | RF-06 |
| **Prioridad** | Media |

### Flujo Básico

1. Desde la lista de pedidos (CU-05), el usuario hace clic en un pedido.
2. El sistema consulta el detalle del pedido verificando que pertenezca al usuario.
3. El sistema muestra: número de pedido, fecha, estado, dirección de envío, lista de artículos con cantidades y precios, subtotal, impuestos, costo de envío, total, historial de estados.

### Flujo Alternativo

**FA-01: Pedido no pertenece al usuario**
- Si se intenta acceder a un pedido de otro usuario, el sistema muestra error 403: "No tienes permiso para ver este pedido."

---

## CU-07: Cancelar Pedido

| Atributo | Valor |
|----------|-------|
| **ID** | CU-07 |
| **Nombre** | Cancelar pedido |
| **Actor** | Usuario Autenticado |
| **Descripción** | Permite que un usuario autenticado cancele un pedido si su estado lo permite. |
| **Precondición** | El usuario tiene un pedido en estado "pendiente" o "confirmado". |
| **Postcondición** | El pedido cambia a estado "cancelado". |
| **RF asociado** | RF-07 |
| **Prioridad** | Baja |

### Flujo Básico

1. Desde el detalle del pedido (CU-06), el usuario hace clic en "Cancelar pedido".
2. El sistema verifica que el estado del pedido sea cancelable (pendiente o confirmado).
3. El sistema solicita confirmación: "¿Estás seguro de cancelar el pedido XXX?"
4. El usuario confirma.
5. El sistema actualiza el estado del pedido a "cancelado".
6. El sistema muestra mensaje: "Pedido cancelado exitosamente."
7. El sistema regresa al detalle del pedido con el estado actualizado.

### Flujos Alternativos

**FA-01: Pedido no cancelable**
- En el paso 2, si el pedido está en estado "enviado" o "entregado", el sistema muestra: "Este pedido ya no puede cancelarse porque ha sido enviado. Contacta a servicio al cliente."

**FA-02: Cancelación cancelada**
- En el paso 4, si el usuario cancela la operación, no se realiza ningún cambio.

---

## CU-08: Actualizar Perfil

| Atributo | Valor |
|----------|-------|
| **ID** | CU-08 |
| **Nombre** | Actualizar perfil de usuario |
| **Actor** | Usuario Autenticado |
| **Descripción** | Permite que un usuario autenticado actualice su información personal (nombre, teléfono, dirección). |
| **Precondición** | El usuario ha iniciado sesión. |
| **Postcondición** | Los datos del perfil se actualizan en la base de datos. |
| **RF asociado** | RF-08 |
| **Prioridad** | Media |

### Flujo Básico

1. El usuario navega a la sección "Mi perfil".
2. El sistema muestra el formulario con los datos actuales precargados.
3. El usuario modifica los campos deseados (nombre, teléfono, dirección).
4. El sistema valida los campos modificados.
5. El sistema guarda los cambios.
6. El sistema muestra mensaje: "Perfil actualizado exitosamente."

### Flujos Alternativos

**FA-01: Datos inválidos**
- Si el nombre está vacío, el teléfono es inválido o la dirección está vacía, el sistema muestra errores de validación.

**FA-02: Intento de cambiar correo**
- Si el usuario intenta modificar el correo, el sistema indica que esta opción no está disponible y sugiere contactar a soporte.

---

## Resumen de CU

| ID | Nombre | Actor | RF Asociado | Prioridad |
|----|--------|-------|-------------|-----------|
| CU-01 | Registrar cuenta | Usuario Visitante | RF-01 | Alta |
| CU-02 | Iniciar sesión | Usuario Registrado | RF-02 | Alta |
| CU-03 | Cerrar sesión | Usuario Autenticado | RF-03 | Alta |
| CU-04 | Recuperar contraseña | Usuario Registrado | RF-04 | Media |
| CU-05 | Consultar lista de pedidos | Usuario Autenticado | RF-05 | Alta |
| CU-06 | Consultar detalle de pedido | Usuario Autenticado | RF-06 | Media |
| CU-07 | Cancelar pedido | Usuario Autenticado | RF-07 | Baja |
| CU-08 | Actualizar perfil | Usuario Autenticado | RF-08 | Media |
