# Guion de Video de Sustentación

**Asignatura:** Análisis y Diseño de Sistemas de Información
**Actividades:** 2 y 3 — Caso Simulado de E-commerce
**Duración estimada:** 10–12 minutos
**Formato:** Presentación dialogada con apoyo visual (diapositivas / demo)

---

## Estructura General

| Segmento | Duración | Tema |
|----------|:--------:|------|
| 1. Apertura | 0:30 | Presentación personal y contexto |
| 2. Análisis de HU originales (Actividad 2) | 1:30 | Errores identificados y correcciones |
| 3. Definición de RF y CU | 1:30 | 8 RF y 8 CU con trazabilidad |
| 4. Refinamiento de HU (Actividad 3) | 2:00 | 8 HU refinadas con BDD |
| 5. Matriz de trazabilidad y backlog | 1:30 | Cobertura 100%, 29 SP, 3 sprints |
| 6. Fichas técnicas | 1:00 | Formato y contenido de 8 fichas |
| 7. Informe General (PT-IGS-01) | 1:30 | 3 partes del informe |
| 8. Cierre | 1:00 | Lecciones aprendidas y conclusiones |
| **Total** | **10:30** | |

---

## Segmento 1 — Apertura (0:30)

**Diapositiva:** Título — "Actividades 2 y 3: Caso Simulado E-commerce"
**Formato:** Presentador frente a cámara o voz en off sobre diapositivas

**Guion:**

> Hola, mi nombre es [Nombre], aprendiz del programa Análisis y Desarrollo de Software del SENA. En este video voy a presentar el trabajo realizado para las actividades 2 y 3 del caso simulado de comercio electrónico, que consistió en analizar, corregir y refinar ocho historias de usuario del módulo de gestión de usuarios, y producir los artefactos de ingeniería de requisitos correspondientes.
>
> Los entregables incluyen: análisis de historias, requisitos funcionales, casos de uso, historias refinadas, matriz de trazabilidad, backlog priorizado, fichas técnicas, informe general del sistema y el presente guion de sustentación.

---

## Segmento 2 — Análisis de HU Originales (1:30)

**Diapositiva:** Tabla comparativa "Antes vs. Después" de las HU
**Guion:**

> En la Actividad 2 recibimos ocho historias de usuario originales con deficiencias típicas de un primer borrador. Detectamos los siguientes problemas:
>
> **Ambigüedad en la redacción.** Por ejemplo, la HU original decía "Como usuario quiero gestionar mi cuenta", lo cual era demasiado genérico. La descomponemos en tres historias específicas: registro, inicio de sesión y cierre de sesión.
>
> **Falta del propósito.** Varias historias omitían el "Para..." que justifica la funcionalidad desde la perspectiva del usuario. Sin el propósito, es imposible evaluar si la implementación resuelve la necesidad real.
>
> **Dependencias no explicítadas.** No se indicaba que consultar pedidos requiere haber iniciado sesión, ni que cancelar un pedido requiere haberlo consultado antes.
>
> **Criterios de aceptación ausentes.** Ninguna historia original incluía escenarios de prueba que definieran cuándo una funcionalidad está completa.
>
> **Solución:** Reescribimos las ocho historias siguiendo el formato "Como... Quiero... Para..." y documentamos todos los hallazgos en el archivo de análisis y corrección.

---

## Segmento 3 — Definición de RF y CU (1:30)

**Diapositiva:** Tabla de 8 RF + 8 CU con su correspondencia
**Guion:**

> A partir del análisis, definimos ocho requisitos funcionales, enumerados como RF-01 a RF-08, que cubren: registro de cuenta, inicio de sesión, cierre de sesión, recuperación de contraseña, consulta de lista de pedidos, consulta de detalle de pedido, cancelación de pedido y actualización de perfil.
>
> Cada requisito funcional se asoció a un caso de uso, CU-01 a CU-08. Los casos de uso incluyen actores precondiciones, flujo básico, flujos alternativos y postcondiciones. Por ejemplo, el CU-02 — Iniciar sesión — contempla el flujo alternativo de cuenta bloqueada por cinco intentos fallidos.
>
> La relación es uno a uno: cada RF corresponde exactamente a un CU, lo que simplifica la trazabilidad. Todos los documentos están en los archivos `02-rf-ecommerce.md` y `03-cu-ecommerce.md`.

---

## Segmento 4 — Refinamiento de HU (2:00)

**Diapositiva:** HU refinada de ejemplo (HU-01 o HU-02) con sus criterios BDD
**Guion:**

> En la Actividad 3 aplicamos el proceso de refinamiento de diez puntos a cada historia. El resultado son ocho historias de usuario refinadas con el formato completo: identificador, título, redacción "Como... Quiero... Para...", criterios de aceptación en formato BDD — Given, When, Then — y notas técnicas.
>
> Tomemos como ejemplo la HU-01: "Registrar cuenta". Dice: "Como usuario visitante, quiero registrarme en la plataforma proporcionando nombre, correo electrónico, contraseña, teléfono opcional y dirección opcional, para poder acceder a las funcionalidades de compra."
>
> Sus criterios BDD incluyen escenarios como:
> - Given un correo no registrado, When el usuario envía el formulario completo, Then la cuenta se crea y se recibe un correo de verificación.
> - Given un correo ya registrado, When se intenta registrar, Then se muestra un mensaje de error.
> - Given una contraseña débil, When se envía el formulario, Then se rechaza con una indicación de la política de contraseñas.
>
> Este nivel de detalle elimina ambigüedades y permite que el equipo de desarrollo y calidad tengan una comprensión compartida de cada funcionalidad.

---

## Segmento 5 — Matriz de Trazabilidad y Backlog (1:30)

**Diapositiva:** Matriz de trazabilidad + tabla de backlog priorizado
**Guion:**

> Construimos una matriz de trazabilidad que cruza los ocho requisitos funcionales con los ocho casos de uso y las ocho historias de usuario. La cobertura es del 100%, lo que significa que cada requisito está cubierto por un caso de uso y una historia de usuario, y viceversa.
>
> Con base en la matriz y en la priorización, armamos el backlog priorizado. Asignamos puntos de historia usando talla relativa: 2, 3 y 5. El total es de 29 puntos historia distribuidos en tres sprints.
>
> **Sprint 1 — Fundación (15 SP):** Registro, inicio de sesión, cierre de sesión y consulta de pedidos. Son las funcionalidades base que habilitan todo lo demás.
>
> **Sprint 2 — Valor (11 SP):** Recuperación de contraseña, detalle de pedido y actualización de perfil.
>
> **Sprint 3 — Mejora (3 SP):** Cancelación de pedido, que tiene la prioridad más baja porque su valor de negocio depende de que los pedidos existan y sean consultables.

---

## Segmento 6 — Fichas Técnicas (1:00)

**Diapositiva:** Ejemplo de ficha técnica (HU-01)
**Guion:**

> Para cada historia de usuario creamos una ficha técnica que concentra toda la información necesaria para planificar y desarrollar la historia. Cada ficha incluye: identificador, nombre, redacción, criterios de aceptación, prioridad, puntos de historia, sprint asignado, dependencias, RF y CU asociados, mockups referenciados y notas técnicas.
>
> Las fichas técnicas son el puente entre la visión del producto y la ejecución del desarrollo. Un equipo puede tomar cualquier ficha y comenzar a implementar sin necesidad de consultar documentación dispersa.

---

## Segmento 7 — Informe General PT-IGS-01 (1:30)

**Diapositiva:** Estructura de 3 partes del informe
**Guion:**

> Finalmente, produjimos el Informe General del Sistema con código PT-IGS-01, siguiendo la estructura de tres partes que exige la metodología SENA ADSO.
>
> La **Parte 1** describe las características del sistema, los usuarios o actores, los casos de uso y el entorno operativo.
>
> La **Parte 2** es el plano maestro: arquitectura en capas, modelo de datos con el diagrama entidad-relación que incluye las tablas User, PasswordToken, Order y OrderItem, el diagrama de clases del dominio, las tecnologías del stack y las integraciones.
>
> La **Parte 3** cubre el recorrido de la idea a la aplicación: prototipado con las vistas del módulo, las ocho historias de usuario, el plan de tres sprints con sus dependencias, el prototipo funcional con los endpoints de la API y el refinamiento aplicado.
>
> Todos estos artefactos se encuentran en la carpeta de entregables del proyecto.

---

## Segmento 8 — Cierre (1:00)

**Diapositiva:** Resumen visual + gracias
**Guion:**

> Como lecciones aprendidas, destacamos tres puntos:
>
> Primero, la descomposición de historias de usuario genéricas en funcionalidades atómicas reduce la ambigüedad y permite estimaciones más precisas.
>
> Segundo, la trazabilidad entre requisitos, casos de uso e historias garantiza que ningún requisito quede sin implementar y que cada historia responda a una necesidad documentada.
>
> Tercero, las fichas técnicas y el backlog priorizado son herramientas prácticas que el equipo de desarrollo puede usar directamente para planificar y ejecutar sprints.
>
> Este trabajo demuestra la aplicación del análisis y diseño de sistemas en un caso simulado de e-commerce, preparando el camino para abordar proyectos más complejos como el sistema AgroConnect, que integra contexto geoespacial y del sector agropecuario colombiano.
>
> Muchas gracias por su atención. Estoy atento a sus preguntas y retroalimentación.

---

## Notas de Producción

| Aspecto | Recomendación |
|---------|---------------|
| **Diapositivas** | Utilizar presentación limpia, fondo blanco, tipografía sans-serif. Colores: azul corporativo (#2563EB) para títulos |
| **Ritmo** | No apresurarse. Pausa breve (2-3 seg) entre segmentos |
| **Demostración** | Si el tiempo lo permite, mostrar el archivo `04-historias-refinadas.md` y la matriz de trazabilidad en pantalla |
| **Audio** | Ambiente silencioso, micrófono claro, volumen constante |
| **Formato de entrega** | MP4, 1080p, 30 fps, H.264 |
| **Duración objetivo** | 10:30 — ideal entre 10 y 12 minutos |
