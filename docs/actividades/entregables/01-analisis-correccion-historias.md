# Análisis y Corrección de Historias de Usuario — Caso E-commerce

## Contexto

**Caso simulado**: Empresa de comercio electrónico desea implementar un módulo básico de gestión de usuarios que permita: registro, inicio de sesión, recuperación de contraseña, consulta de pedidos, detalle de pedido, cancelación de pedido y actualización de perfil.

Se presentan 8 historias de usuario iniciales (HU-01 a HU-08) que requieren análisis, corrección, descomposición y priorización.

---

## 1. Análisis de las Historias Iniciales

### HU-01: "Como usuario quiero gestionar mis pedidos fácilmente."

| Aspecto | Diagnóstico |
|---------|-------------|
| **Verbo** | "Gestionar" es demasiado amplio y ambiguo. No especifica qué operaciones se pueden realizar (ver, cancelar, modificar, rastrear, etc.). |
| **Adverbio** | "Fácilmente" es subjetivo y no verificable. No puede medirse ni probarse. |
| **Criterio de aceptación** | Ninguno. No hay forma de determinar cuándo está completa. |
| **Formato** | Incumple el formato "Como… Quiero… Para…" — falta el propósito (el *para qué*). |

### HU-02: "Como usuario quiero registrarme en el sistema."

| Aspecto | Diagnóstico |
|---------|-------------|
| **Formato** | Tiene el inicio correcto ("Como usuario quiero…") pero le falta el *para qué*. |
| **Completitud** | No especifica qué datos son necesarios, ni qué validaciones aplicar, ni qué ocurre si el correo ya existe. |
| **Criterio de aceptación** | Ninguno. |
| **Alcance** | Correcto en intención, pero incompleto. |

### HU-03: "Como usuario quiero ver mis cosas."

| Aspecto | Diagnóstico |
|---------|-------------|
| **Ambigüedad** | Extremadamente vaga. "Cosas" no es un término válido en un contexto de software. No se sabe si se refiere a pedidos, perfil, favoritos, etc. |
| **Formato** | Le falta el propósito (*para qué*). |
| **Criterio de aceptación** | Ninguno. |
| **Solapamiento** | Se superpone con HU-01 y HU-06 si "cosas" se refiere a pedidos. |

### HU-04: "Como usuario quiero recuperar mi contraseña rápido."

| Aspecto | Diagnóstico |
|---------|-------------|
| **Adverbio** | "Rápido" es subjetivo. 5 segundos es rápido para unos, 5 minutos para otros. No es verificable. |
| **Formato** | Le falta el propósito (*para qué*). |
| **Criterio de aceptación** | Ninguno. |
| **Mecanismo** | No especifica el medio de recuperación (correo electrónico, SMS, preguntas de seguridad). |

### HU-05: "Como usuario quiero actualizar mis datos."

| Aspecto | Diagnóstico |
|---------|-------------|
| **Ambigüedad** | "Datos" no especifica cuáles: nombre, correo, contraseña, dirección, teléfono, todos, algunos. |
| **Formato** | Le falta el propósito (*para qué*). |
| **Criterio de aceptación** | Ninguno. |
| **Validaciones** | No se mencionan reglas de negocio (¿se puede cambiar el correo? ¿se requiere verificación?). |

### HU-06: "Como usuario quiero ver mis pedidos y cancelarlos y ver detalles."

| Aspecto | Diagnóstico |
|---------|-------------|
| **Historias múltiples** | Confla tres funcionalidades distintas en una sola historia: (a) ver lista de pedidos, (b) cancelar un pedido, (c) ver detalle de un pedido. Viola el principio de una historia = una funcionalidad. |
| **Formato** | Le falta el propósito (*para qué*). |
| **Criterio de aceptación** | Ninguno. |
| **Redacción** | Gramática pobre, uso repetitivo de "y". |

### HU-07: "Como usuario quiero iniciar sesión."

| Aspecto | Diagnóstico |
|---------|-------------|
| **Formato** | Correcto en estructura básica. |
| **Completitud** | Le falta el propósito (*para qué*). También falta especificar qué ocurre con credenciales incorrectas, bloqueo por intentos, etc. |
| **Criterio de aceptación** | Ninguno. |

### HU-08: "(No aparece en requisitos)"

| Aspecto | Diagnóstico |
|---------|-------------|
| **Origen** | No corresponde a ningún requisito del caso. Se creó sin justificación. |
| **Contenido** | Vacío — no hay redacción, ni criterios, ni referencia. |
| **Decisión** | Tras analizar el módulo, se identifica que falta el requisito **Cerrar sesión**, necesario para completar el ciclo de autenticación. Se redefine HU-08 para cubrir este vacío. |

---

## 2. Resumen de Problemas Encontrados

| Tipo de Problema | HU Afectadas | Descripción |
|------------------|--------------|-------------|
| **Ambigüedad** | HU-01, HU-03, HU-05 | Verbos genéricos ("gestionar", "ver cosas") o términos vagos ("datos") |
| **Adverbios subjetivos** | HU-01, HU-04 | "Fácilmente", "rápido" — no verificables ni medibles |
| **Múltiples historias** | HU-06 | Confla 3 funcionalidades en una |
| **Propósito ausente** | HU-01 a HU-07 | Ninguna incluye el *para qué* del formato "Como… Quiero… Para…" |
| **Sin criterios de aceptación** | HU-01 a HU-08 | Ninguna historia incluye criterios BDD |
| **Solapamiento** | HU-01, HU-03, HU-06 | Las tres cubren funcionalidades de pedidos |
| **Vacío / Sin requisito** | HU-08 | No corresponde a ningún requisito del caso |
| **Requisito faltante** | — | El cierre de sesión no está cubierto por ninguna HU |

---

## 3. Descomposición y Refinamiento

### Criterios de descomposición

1. **Una funcionalidad por historia**: Cada HU debe representar una única operación atómica desde la perspectiva del usuario.
2. **Propósito explícito**: Toda HU debe responder "para qué" el usuario quiere esa funcionalidad.
3. **Criterios de aceptación BDD**: Mínimo 4 escenarios por HU en formato Given/When/Then.
4. **Trazable**: Cada HU debe corresponder a al menos un RF y un CU.

### Árbol de descomposición

```
HU-01 (gestionar pedidos)
  ├── HU-04: Consultar lista de pedidos
  ├── HU-05: Consultar detalle de pedido
  └── HU-06: Cancelar pedido

HU-03 (ver mis cosas)
  └── (ambigua — se fusiona con las HU de pedidos)

HU-06 (ver + cancelar + detalle)
  ├── HU-04: Consultar lista de pedidos
  ├── HU-05: Consultar detalle de pedido
  └── HU-06: Cancelar pedido

HU-08 (sin requisito)
  └── HU-08: Cerrar sesión (nuevo requisito identificado)
```

### Correspondencia HU Inicial → HU Refinada

| HU Inicial | Problema Principal | HU Refinada(s) |
|------------|-------------------|----------------|
| HU-01 | Ambigua, sin propósito | HU-04, HU-05, HU-06 |
| HU-02 | Sin propósito, incompleta | HU-01 (refinada) |
| HU-03 | Ambigua, solapada | HU-04, HU-05, HU-06 |
| HU-04 | Adverbio subjetivo, incompleta | HU-03 (refinada) |
| HU-05 | Ambigua, incompleta | HU-07 (refinada) |
| HU-06 | Múltiples historias | HU-04, HU-05, HU-06 |
| HU-07 | Incompleta | HU-02 (refinada) |
| HU-08 | Sin requisito | HU-08 (redefinida) |

---

## 4. Tabla Comparativa: Antes vs Después

| # | Historia Inicial | Problemas | Historia Refinada |
|---|-----------------|-----------|-------------------|
| HU-01 | "Como usuario quiero gestionar mis pedidos fácilmente." | Verbo genérico, adverbio subjetivo, sin propósito, sin CA | *(Descompuesta en HU-04, HU-05, HU-06)* |
| HU-02 | "Como usuario quiero registrarme en el sistema." | Sin propósito, sin CA | "Como **usuario visitante** quiero **registrarme en el sistema** para **crear una cuenta con mis datos personales y acceder a los servicios de la plataforma**." |
| HU-03 | "Como usuario quiero ver mis cosas." | Término vago "cosas", sin propósito, sin CA | *(Fusionada con HU-04, HU-05, HU-06)* |
| HU-04 | "Como usuario quiero recuperar mi contraseña rápido." | Adverbio "rápido", sin mecanismo, sin CA | "Como **usuario registrado** quiero **recuperar mi contraseña mediante correo electrónico** para **restablecer el acceso a mi cuenta cuando la haya olvidado**." |
| HU-05 | "Como usuario quiero actualizar mis datos." | Término vago "datos", sin CA | *(Refinada como HU-07)* |
| HU-06 | "Como usuario quiero ver mis pedidos y cancelarlos y ver detalles." | 3 funcionalidades confladas, sin CA | *(Descompuesta en HU-04, HU-05, HU-06)* |
| HU-07 | "Como usuario quiero iniciar sesión." | Sin propósito, sin CA | "Como **usuario registrado** quiero **iniciar sesión con mi correo y contraseña** para **acceder a mi cuenta y a las funcionalidades de la plataforma**." |
| HU-08 | *(No aparece en requisitos)* | Vacío, sin requisito asociado | "Como **usuario autenticado** quiero **cerrar sesión** para **proteger mi cuenta cuando termine de usar la plataforma**." |

---

## 5. Priorización

### Criterios de priorización

- **P1 — Esencial**: Sin esta funcionalidad el sistema no cumple su propósito mínimo.
- **P2 — Importante**: Funcionalidad necesaria para la experiencia completa del usuario.
- **P3 — Mejora**: Funcionalidad deseable pero no crítica para el MVP.

### Tabla de prioridades

| HU | Nombre | Prioridad | Justificación |
|----|--------|-----------|---------------|
| HU-01 | Registrar cuenta | **P1** | Sin registro no hay usuarios en el sistema |
| HU-02 | Iniciar sesión | **P1** | Sin autenticación no hay acceso a funcionalidades protegidas |
| HU-03 | Recuperar contraseña | **P2** | Importante para UX pero no bloquea el MVP (puede usarse soporte manual) |
| HU-04 | Consultar lista de pedidos | **P1** | Funcionalidad principal del módulo de pedidos |
| HU-05 | Consultar detalle de pedido | **P2** | Depende de HU-04; valor añadido sobre la lista |
| HU-06 | Cancelar pedido | **P3** | Funcionalidad avanzada; puede implementarse después del MVP |
| HU-07 | Actualizar perfil | **P2** | Importante para mantener datos actualizados |
| HU-08 | Cerrar sesión | **P1** | Requisito de seguridad esencial |

---

## 6. Validación con Stakeholders (Simulada)

Se realizó una validación simulada con los siguientes roles y resultados:

| Stakeholder | Observaciones | Acepta Cambios |
|-------------|---------------|----------------|
| **Product Owner** | "Estoy de acuerdo con la descomposición de HU-01 y HU-06. La priorización me parece correcta, aunque movería HU-06 a P2 si el negocio lo requiere." | Sí, con observación |
| **Usuario final** | "Antes no entendía bien qué iba a poder hacer. Ahora está claro." | Sí |
| **Desarrollador** | "Las historias ahora son accionables y tienen criterios claros. Podemos estimarlas." | Sí |
| **QA** | "Con los criterios BDD podemos diseñar casos de prueba directamente." | Sí |

**Decisión final**: Se acepta el refinamiento. HU-06 (Cancelar pedido) se mantiene en P3 para el MVP, con opción a subir a P2 en el siguiente sprint si el negocio lo prioriza.

---

## 7. Control de Cambios

| Versión | Fecha | Autor | Cambio |
|---------|-------|-------|--------|
| v1.0 | 2026-07-03 | Analista de Requisitos | Versión inicial con 8 HU del caso |
| v2.0 | 2026-07-03 | Analista de Requisitos | Análisis de problemas identificados |
| v2.1 | 2026-07-03 | Analista de Requisitos | Descomposición de HU-01, HU-03, HU-06 |
| v2.2 | 2026-07-03 | Analista de Requisitos | Redacción de HU refinadas con propósito |
| v2.3 | 2026-07-03 | Analista de Requisitos | Adición de criterios de aceptación BDD |
| v3.0 | 2026-07-03 | Product Owner | Priorización y validación aprobada |
