# Historias de Usuario Refinadas — Módulo de Usuarios (Caso E-commerce)

## Datos Generales

| Campo | Valor |
|-------|-------|
| **Proyecto** | Caso Simulado — Plataforma de Comercio Electrónico |
| **Módulo** | Gestión de Usuarios |
| **Total HU** | 8 |
| **Versión** | 3.0 (refinada) |
| **Fecha** | 2026-07-03 |

---

## HU-01: Registro de Cuenta

- **Como** usuario visitante,
- **quiero** registrarme en la plataforma proporcionando mis datos personales,
- **para** crear una cuenta y poder realizar compras.

**Propósito**: Habilitar el acceso al e-commerce mediante la creación de una cuenta segura con verificación por correo.

**Criterios de Aceptación (BDD):**

**Escenario 1: Registro exitoso**
- **Given** un usuario visitante en la página de registro
- **When** completa todos los campos obligatorios con datos válidos
- **And** la contraseña cumple la política de seguridad
- **And** el correo no está registrado previamente
- **Then** el sistema crea la cuenta con estado "pendiente de verificación"
- **And** envía un correo de verificación al usuario

**Escenario 2: Correo ya registrado**
- **Given** un usuario visitante en la página de registro
- **When** ingresa un correo electrónico que ya existe en el sistema
- **Then** el sistema muestra el mensaje "Este correo ya está registrado"
- **And** ofrece la opción de iniciar sesión

**Escenario 3: Contraseña insegura**
- **Given** un usuario visitante en la página de registro
- **When** ingresa una contraseña de menos de 8 caracteres
- **Then** el sistema muestra los requisitos de seguridad no cumplidos
- **And** no crea la cuenta

**Escenario 4: Campos obligatorios incompletos**
- **Given** un usuario visitante en la página de registro
- **When** envía el formulario sin completar todos los campos obligatorios
- **Then** el sistema resalta los campos faltantes
- **And** no envía el formulario

---

## HU-02: Inicio de Sesión

- **Como** usuario registrado y verificado,
- **quiero** iniciar sesión con mi correo y contraseña,
- **para** acceder a mi cuenta y gestionar mis pedidos.

**Propósito**: Autenticar usuarios de forma segura, protegiendo la cuenta contra accesos no autorizados mediante límite de intentos fallidos.

**Criterios de Aceptación (BDD):**

**Escenario 1: Inicio de sesión exitoso**
- **Given** un usuario registrado con cuenta verificada
- **When** ingresa su correo y contraseña correctos
- **Then** el sistema le otorga un token de sesión válido
- **And** lo redirige al dashboard

**Escenario 2: Contraseña incorrecta**
- **Given** un usuario registrado con cuenta verificada
- **When** ingresa una contraseña incorrecta
- **Then** el sistema muestra "Credenciales incorrectas"
- **And** muestra los intentos restantes antes del bloqueo

**Escenario 3: Bloqueo por intentos fallidos**
- **Given** un usuario registrado
- **When** falla la autenticación 5 veces consecutivas
- **Then** el sistema bloquea la cuenta por 15 minutos
- **And** muestra el mensaje "Cuenta bloqueada temporalmente"

**Escenario 4: Cuenta no verificada**
- **Given** un usuario registrado con cuenta pendiente de verificación
- **When** intenta iniciar sesión
- **Then** el sistema muestra "Por favor verifica tu correo electrónico"
- **And** ofrece reenviar el correo de verificación

---

## HU-03: Recuperación de Contraseña

- **Como** usuario registrado que olvidó su contraseña,
- **quiero** solicitar un enlace de restablecimiento a mi correo,
- **para** crear una nueva contraseña y recuperar el acceso a mi cuenta.

**Propósito**: Permitir que los usuarios recuperen el acceso a su cuenta de forma segura y autónoma mediante un mecanismo de restablecimiento con token temporizado.

**Criterios de Aceptación (BDD):**

**Escenario 1: Restablecimiento exitoso**
- **Given** un usuario registrado que olvidó su contraseña
- **When** solicita el restablecimiento ingresando su correo
- **And** hace clic en el enlace recibido dentro de los 30 minutos
- **And** ingresa una nueva contraseña válida
- **Then** el sistema actualiza la contraseña
- **And** permite iniciar sesión con la nueva contraseña

**Escenario 2: Enlace expirado**
- **Given** un usuario registrado que solicitó restablecimiento
- **When** hace clic en el enlace después de 30 minutos
- **Then** el sistema muestra "El enlace ha expirado"
- **And** solicita un nuevo restablecimiento

**Escenario 3: Contraseña no cumple política**
- **Given** un usuario registrado en la página de restablecimiento
- **When** ingresa una nueva contraseña que no cumple la política de seguridad
- **Then** el sistema muestra los requisitos insatisfechos
- **And** no actualiza la contraseña

---

## HU-04: Consultar Lista de Pedidos

- **Como** usuario autenticado,
- **quiero** ver una lista paginada de mis pedidos ordenados del más reciente al más antiguo,
- **para** dar seguimiento a mis compras.

**Propósito**: Proveer una vista resumida y navegable de todas las órdenes del usuario para facilitar el seguimiento y la localización de pedidos específicos.

**Criterios de Aceptación (BDD):**

**Escenario 1: Lista con pedidos**
- **Given** un usuario autenticado con pedidos registrados
- **When** navega a "Mis pedidos"
- **Then** el sistema muestra una tabla paginada con número, fecha, estado, total y cantidad de artículos
- **And** los pedidos se muestran del más reciente al más antiguo

**Escenario 2: Lista sin pedidos**
- **Given** un usuario autenticado sin pedidos
- **When** navega a "Mis pedidos"
- **Then** el sistema muestra "Aún no has realizado ningún pedido"

**Escenario 3: Paginación**
- **Given** un usuario autenticado con más de 10 pedidos
- **When** navega a "Mis pedidos"
- **Then** el sistema muestra los primeros 10 pedidos
- **And** muestra controles para navegar entre páginas

---

## HU-05: Consultar Detalle de Pedido

- **Como** usuario autenticado,
- **quiero** ver el detalle completo de un pedido específico,
- **para** conocer los artículos comprados, los costos y el estado actual del envío.

**Propósito**: Brindar información detallada de cada pedido incluyendo productos, costos desglosados e historial de cambios de estado.

**Criterios de Aceptación (BDD):**

**Escenario 1: Detalle visible**
- **Given** un usuario autenticado con pedidos
- **When** selecciona un pedido de la lista
- **Then** el sistema muestra número de pedido, fecha, estado, dirección de envío, artículos, subtotal, impuestos, envío y total

**Escenario 2: Intento de acceso a pedido ajeno**
- **Given** un usuario autenticado
- **When** intenta acceder al detalle de un pedido que no le pertenece
- **Then** el sistema muestra error 403 "No tienes permiso para ver este pedido"

**Escenario 3: Historial de estados visible**
- **Given** un usuario autenticado visualizando un pedido
- **Then** el sistema muestra el historial de cambios de estado con fechas

---

## HU-06: Cancelar Pedido

- **Como** usuario autenticado,
- **quiero** cancelar un pedido siempre que esté en estado pendiente o confirmado,
- **para** evitar compras que ya no deseo recibir.

**Propósito**: Permitir que los usuarios anulen pedidos antes de que sean procesados para envío, reduciendo devoluciones y reclamaciones.

**Criterios de Aceptación (BDD):**

**Escenario 1: Cancelación exitosa**
- **Given** un usuario autenticado con un pedido en estado "pendiente" o "confirmado"
- **When** confirma la cancelación del pedido
- **Then** el sistema cambia el estado a "cancelado"
- **And** muestra "Pedido cancelado exitosamente"

**Escenario 2: Pedido no cancelable**
- **Given** un usuario autenticado con un pedido en estado "enviado" o "entregado"
- **When** intenta cancelarlo
- **Then** el sistema muestra "Este pedido ya no puede cancelarse"
- **And** sugiere contactar a servicio al cliente

**Escenario 3: Cancelación abortada**
- **Given** un usuario autenticado en la pantalla de confirmación de cancelación
- **When** decide no confirmar la cancelación
- **Then** el sistema no realiza ningún cambio
- **And** regresa al detalle del pedido

---

## HU-07: Actualizar Perfil

- **Como** usuario autenticado,
- **quiero** actualizar mi información personal (nombre, teléfono, dirección),
- **para** mantener mis datos actualizados y recibir pedidos correctamente.

**Propósito**: Permitir que los usuarios modifiquen sus datos personales de forma autónoma sin necesidad de contacto con soporte, manteniendo la integridad de los datos críticos.

**Criterios de Aceptación (BDD):**

**Escenario 1: Actualización exitosa**
- **Given** un usuario autenticado en la página "Mi perfil"
- **When** modifica su nombre, teléfono o dirección con datos válidos
- **And** guarda los cambios
- **Then** el sistema actualiza los datos
- **And** muestra "Perfil actualizado exitosamente"

**Escenario 2: Datos inválidos**
- **Given** un usuario autenticado en la página "Mi perfil"
- **When** intenta guardar un nombre vacío o un teléfono inválido
- **Then** el sistema muestra errores de validación
- **And** no guarda los cambios

**Escenario 3: Intento de cambiar correo**
- **Given** un usuario autenticado en la página "Mi perfil"
- **When** intenta modificar su correo electrónico
- **Then** el sistema indica que el correo no puede modificarse
- **And** sugiere contactar a soporte si necesita cambiarlo

---

## HU-08: Cierre de Sesión

- **Como** usuario autenticado,
- **quiero** cerrar mi sesión de forma explícita,
- **para** proteger mi cuenta cuando termino de usar la plataforma o accedo desde un dispositivo compartido.

**Propósito**: Garantizar la seguridad de la cuenta permitiendo al usuario finalizar su sesión activa y eliminar el token de acceso.

**Criterios de Aceptación (BDD):**

**Escenario 1: Cierre exitoso**
- **Given** un usuario autenticado con sesión activa
- **When** hace clic en "Cerrar sesión"
- **And** confirma la acción
- **Then** el sistema invalida el token de sesión
- **And** redirige a la página de inicio
- **And** muestra "Sesión cerrada correctamente"

**Escenario 2: Cancelación del cierre**
- **Given** un usuario autenticado que inició el cierre de sesión
- **When** cancela la confirmación
- **Then** el sistema no toma ninguna acción
- **And** regresa a la página anterior

---

## Resumen de Cambios respecto a HU Originales

| HU Original | Problema | HU Refinada | Mejora Principal |
|-------------|----------|-------------|-------------------|
| HU-01 | Ambigua, sin propósito | HU-01 | Redacción "Como-Quiero-Para", criterios BDD, propósito explícito |
| HU-02 | Contenía login + recuperación | HU-02 | Separada de recuperación, agregado bloqueo por intentos |
| HU-03 | "Rápida y segura" (subjetivo) | HU-03 | Tiempo límite 30 min, política de seguridad definida |
| HU-04 | Sin propósito ni criterios | HU-04 | Propósito de seguimiento, paginación, caso sin pedidos |
| HU-05 | Sin propósito | HU-05 | Propósito de detalle, historial de estados |
| HU-06 | Múltiples historias en una | HU-06 | Solo cancelación, condiciones claras de estado |
| HU-07 | Sin propósito ni criterios | HU-07 | Restricción correo, validaciones concretas |
| HU-08 | Vacía | HU-08 | Cierre de sesión con confirmación e invalidación de token |
