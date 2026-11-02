# Resumen Completo del Proyecto AgroConnect

**Versión:** 1.0  
**Fecha de corte:** 31 de julio de 2026  
**Estado del documento:** Consolidación del proyecto formativo  
**Institución:** Servicio Nacional de Aprendizaje (SENA)  
**Programa:** Análisis y Desarrollo de Software (ADSO)  
**Metodología:** RUP + Scrum

## Identificación del proyecto

### Información general

| Elemento                   | Descripción                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Nombre oficial**         | AgroConnect                                                                                                         |
| **Tipo de solución**       | Plataforma B2B+B2C para el sector agropecuario                                                                      |
| **Ámbito**                 | Colombia rural                                                                                                      |
| **Propósito**              | Conectar productores agropecuarios con compradores y facilitar la gestión de la cadena comercial y logística        |
| **Población objetivo**     | Productores, compradores, empresas, transportistas, administradores e instructores SENA                             |
| **Equipo Scrum**           | Nelson Fabián Gallego Sánchez, Juan David Ferrer Castillo, Carlos Andrés Zuluaga Atehortua y Santiago Palacio Tovar |
| **Repositorio**            | Proyecto local AgroConnect, con frontend, backend, documentación, scripts y configuración de agentes                |
| **Página raíz documental** | Notion, página raíz del proyecto AgroConnect                                                                        |
| **Clave operativa**        | SCRUM en Jira                                                                                                       |

### Alcance funcional definido

La línea base SENA del sistema contempla:

- **17 módulos funcionales.**
- **68 requisitos funcionales (RF).**
- **30 requisitos no funcionales (RNF).**
- **66 casos de uso (CU).**
- **69 historias de usuario (HU).**
- **6 actores:** Productor, Comprador, Transportista, Administrador, AgroBot e Instructor SENA.

La matriz de trazabilidad local v2.0 registra el mapeo completo de los 68 RF, 66 CU, 69 HU y 17 módulos. El informe de auditoría documental y el plan de corrección de Notion establecen esta línea base después de depurar versiones anteriores que contenían 100 casos de uso y 77 historias de usuario.

### Stack tecnológico oficial

- **Frontend:** React, Vite, TypeScript y Tailwind CSS.
- **Backend:** Node.js, Express y TypeScript.
- **Base de datos:** PostgreSQL con PostGIS.
- **Persistencia:** Prisma ORM.
- **Imágenes y multimedia:** Cloudinary.
- **Mapas:** Leaflet y OpenStreetMap.
- **Diseño:** Penpot y Stitch.
- **Documentación y presentaciones:** Markdown y Marp.
- **Arquitectura:** Clean Architecture, principios de Domain-Driven Design y patrones GoF cuando correspondan.

### Principios de diseño y operación

- Enfoque **mobile-first** y rural-first.
- Colores principales: verde `#2E7D32` y amarillo `#F9A825`.
- Tipografías: Inter para la interfaz y Merriweather para contenido.
- Áreas táctiles mínimas de 48 × 48 píxeles.
- Contraste mínimo WCAG AA de 4.5:1 para texto normal.
- Uso de PostGIS para operaciones geoespaciales, evitando calcular distancias o áreas en JavaScript.
- Protección de credenciales y variables de entorno mediante `direnv`.
- Uso de JWT y refresh tokens para autenticación.
- Procesamiento local con Ollama para datos sensibles como coordenadas de fincas, información financiera y datos personales.

### Estado general al corte

La documentación SENA y la trazabilidad se encuentran consolidadas en un nivel avanzado. El repositorio contiene un prototipo frontend funcional orientado al mapa de propiedades agrícolas, indicadores y consulta de productores. El backend cuenta con una base inicial de Clean Architecture para geolocalización, pero todavía no constituye una aplicación ejecutable completa. Por tanto, AgroConnect se encuentra en una etapa de prototipo funcional y consolidación técnica, no en una etapa de producción.

## Planteamiento del problema

Los productores agropecuarios de zonas rurales colombianas suelen enfrentar dificultades para acceder directamente a compradores, publicar su oferta, comunicar la disponibilidad real de sus productos y coordinar la entrega. La información sobre fincas, cultivos, inventario, ubicación y condiciones de venta se encuentra con frecuencia dispersa en canales informales o herramientas que no fueron diseñadas para las condiciones de conectividad y operación del campo.

Esta situación produce varios problemas relacionados:

- Dependencia de intermediarios y menor capacidad de negociación para el productor.
- Baja visibilidad de la oferta agrícola local frente a compradores individuales y empresariales.
- Dificultad para consultar productos por ubicación, cultivo, disponibilidad o certificación.
- Desconexión entre inventario, pedidos, pagos y logística.
- Poca trazabilidad sobre el estado de una negociación o entrega.
- Riesgo de pérdidas en productos perecederos por falta de coordinación y actualización oportuna.
- Barreras de conectividad, alfabetización digital y disponibilidad de dispositivos en contextos rurales.
- Riesgos de privacidad cuando se manejan coordenadas de fincas, datos personales y datos financieros sin controles adecuados.

El problema central que aborda AgroConnect puede expresarse así:

> ¿Cómo facilitar una conexión directa, segura, georreferenciada y usable desde contextos rurales entre productores agropecuarios y compradores, integrando la oferta, los pedidos, los pagos, la logística y la trazabilidad de la operación?

La solución propuesta no se limita a crear un catálogo. Busca organizar el proceso completo alrededor de una plataforma modular que permita publicar productos, descubrir fincas y cultivos, gestionar inventario, negociar, cerrar transacciones, coordinar entregas y conservar información verificable de la operación.

## Objetivo general

Analizar, diseñar y construir progresivamente una plataforma web agropecuaria B2B+B2C que conecte productores rurales colombianos con compradores, integre la consulta geoespacial de fincas y productos, y apoye la gestión segura de inventarios, pedidos, pagos, comunicación, logística y trazabilidad, aplicando RUP + Scrum y buenas prácticas de ingeniería de software.

## Objetivos específicos

1. Identificar las necesidades de productores, compradores, transportistas y administradores en el contexto agropecuario rural colombiano.
2. Especificar y organizar los requisitos del sistema en 17 módulos, manteniendo la línea base de 68 RF y 30 RNF.
3. Modelar los actores, casos de uso e historias de usuario del sistema mediante la convención SENA ADSO.
4. Mantener la trazabilidad entre RF, CU y HU, verificando la relación 68 RF, 66 CU y 69 HU.
5. Diseñar una arquitectura modular basada en Clean Architecture, separación de responsabilidades, DDD y contratos entre capas.
6. Desarrollar una interfaz mobile-first que permita consultar propiedades agrícolas, cultivos, ubicaciones, imágenes e indicadores de producción.
7. Incorporar capacidades geoespaciales con Leaflet, OpenStreetMap y PostGIS para localizar fincas, buscar lugares, visualizar zonas productivas y trabajar con parcelas.
8. Diseñar los módulos necesarios para publicación de productos, inventario, marketplace, pedidos, pagos, comunicación, transporte, soporte, seguridad e inteligencia auxiliar AgroBot.
9. Considerar operación offline-first, sincronización y uso en condiciones de conectividad limitada, sin comprometer la integridad de la información.
10. Aplicar controles de seguridad para autenticación, autorización, protección de datos personales, gestión de secretos, logging y manejo seguro de errores.
11. Validar la solución mediante pruebas unitarias, de integración y end-to-end, con cobertura mínima esperada del 80% y criterios de calidad verificables.
12. Documentar el proceso formativo, las decisiones técnicas, los resultados de los sprints, las correcciones y las evidencias de trazabilidad para facilitar la evaluación y la continuidad del proyecto.

## Justificación

### Justificación social

AgroConnect responde a una necesidad de inclusión digital en el sector rural. Una herramienta que acerque productores y compradores puede mejorar la visibilidad de la oferta local y facilitar relaciones comerciales más directas. El enfoque mobile-first, la atención a la conectividad limitada y los controles de accesibilidad buscan que la tecnología sea usable por personas que no trabajan permanentemente con computadores o redes de alta velocidad.

### Justificación económica

La plataforma puede ayudar a reducir la dependencia de intermediarios, ampliar el acceso a compradores y mejorar la planificación de inventario y entregas. La integración de marketplace, pedidos, pagos y logística permite que una operación comercial tenga mayor continuidad y que productores y compradores cuenten con información más clara para tomar decisiones.

### Justificación tecnológica

El proyecto integra tecnologías abiertas y ampliamente adoptadas: React, Node.js, Express, PostgreSQL, PostGIS, Prisma, Leaflet, OpenStreetMap y Cloudinary. Esta selección permite construir una base escalable, evitar dependencia de Google Maps, aprovechar capacidades geoespaciales especializadas y separar el dominio de los detalles de infraestructura.

### Justificación de seguridad y privacidad

El sistema debe manejar información que puede ser sensible: datos personales, coordenadas de fincas, información de pagos e historial de operaciones. Por ello, el diseño considera validación en servidor, JWT con refresh tokens, rate limiting, HTTPS en producción, protección de secretos, logging sin PII y procesamiento local de información sensible. Estas decisiones se relacionan con las buenas prácticas de requisitos, arquitectura, calidad y seguridad de SWEBOK V4.0a (KA01, KA02, KA12 y KA13).

### Justificación académica y formativa

AgroConnect permite aplicar de forma integrada las competencias de ADSO: levantamiento de requisitos, modelado UML, diseño de arquitectura, construcción de software, bases de datos, pruebas, gestión ágil y documentación. La matriz de trazabilidad y los entregables SENA hacen visible la relación entre el problema, los requisitos, los casos de uso, las historias de usuario y la implementación.

### Justificación organizacional

El proyecto cuenta con una estructura de trabajo que combina Notion como fuente documental, Jira como herramienta operativa, Open Notebook como repositorio de material formativo, Obsidian como base de conocimiento y OpenCode como sistema de orquestación de agentes. Esta organización facilita la continuidad del trabajo, la revisión de decisiones y el control de cambios.

## Fases del proyecto

### Fase 0. Iniciativa y organización del proyecto

**Propósito:** definir la idea, el equipo, el contexto del problema y la forma de trabajo.

**Actividades principales:**

- Identificación de la oportunidad en el sector agropecuario colombiano.
- Definición del nombre, alcance preliminar y población objetivo.
- Conformación del equipo Scrum y asignación de responsabilidades.
- Organización inicial del repositorio y de los espacios de trabajo.
- Selección de RUP + Scrum como enfoque metodológico.

**Evidencias:** README del proyecto, registro inicial del proyecto formativo, material F01 del Open Notebook y configuración de Jira, Notion y GitHub.

**Estado:** completada como fase de formulación y organización.

### Fase 1. Propuesta técnica y levantamiento de requisitos

**Propósito:** comprender el problema y convertir las necesidades del negocio en requisitos verificables.

**Actividades principales:**

- Aplicación de técnicas de levantamiento y análisis de requisitos.
- Identificación de requisitos funcionales y no funcionales.
- Organización del sistema en 17 módulos.
- Definición de los actores oficiales.
- Revisión de seguridad, rendimiento, disponibilidad, usabilidad y compatibilidad.

**Resultado de línea base:** 68 RF, 30 RNF, 17 módulos y 6 actores.

**Evidencias:** materiales F01 del Open Notebook, entregables de actividades integradoras, matriz de detalle y documentación referenciada como PT-ERS-01.

**Estado:** completada en la dimensión documental; la disponibilidad de una página individual PT-ERS-01 debe mantenerse verificada porque la línea base también se encuentra representada en la matriz y en Notion.

### Fase 2. Modelado y refinamiento de casos de uso e historias de usuario

**Propósito:** transformar los requisitos en comportamientos observables del sistema y unidades de valor priorizables.

**Actividades principales:**

- Identificación y refinamiento de casos de uso.
- Descripción de actores, precondiciones, flujos principales, alternos y postcondiciones.
- Redacción y refinamiento de historias de usuario.
- Aplicación de criterios de aceptación y priorización.
- Eliminación de duplicados y normalización de identificadores.

**Resultado de línea base:** 66 CU y 69 HU.

**Evidencias:** actividades integradoras de identificación y refinamiento, entregables `03-cu-ecommerce.md`, `04-historias-refinadas.md`, `06-backlog-priorizado.md`, y bases de CU/HU sincronizadas con Notion.

**Estado:** completada documentalmente, con trazabilidad validada en la matriz v2.0.

### Fase 3. Informe general, prototipado y diseño de experiencia

**Propósito:** representar el sistema antes de completar la construcción y establecer una experiencia coherente para usuarios rurales.

**Actividades principales:**

- Elaboración del Informe General del Sistema.
- Definición de las capacidades principales: marketplace dual, trazabilidad rural, operación multicanal offline e IA local.
- Prototipado de baja y alta fidelidad.
- Definición de la experiencia mobile-first.
- Creación del design system con paleta verde y amarilla, tipografías Inter y Merriweather, objetivos WCAG AA y controles táctiles de 48 × 48 píxeles.

**Evidencias:** entregable `08-pt-igs-01.md`, actividad de refinamiento de prototipado, PT-PS-01 referenciado en la documentación y configuración visual del frontend.

**Estado:** definida y representada parcialmente en el prototipo frontend; requiere continuar la implementación de los flujos completos del marketplace.

### Fase 4. Arquitectura tecnológica y configuración

**Propósito:** establecer una base técnica mantenible, segura y escalable.

**Decisiones principales:**

- Clean Architecture con capas de dominio, aplicación, infraestructura y presentación.
- DDD para separar reglas de negocio de frameworks y proveedores.
- PostgreSQL + PostGIS para datos y operaciones geoespaciales.
- Prisma como ORM en infraestructura.
- Express y TypeScript para API backend.
- JWT, refresh token rotation, Pino y correlation ID como elementos de seguridad y observabilidad.
- Cloudinary para imágenes optimizadas.
- Leaflet + OpenStreetMap para mapas.
- Estrategia offline-first con UUID y resolución LWW documentada en la arquitectura.

**Evidencias:** PT-AR-ARQ-01, PT-MTC-01 v1.0.2, `.opencode/SPEC.md`, estructura `backend/src/modules/geography/` y servicios de Cloudinary del frontend.

**Estado:** definida documentalmente; la implementación ejecutable de la arquitectura todavía está incompleta.

### Fase 5. Construcción del prototipo funcional

**Frontend implementado:**

- Dashboard de propiedades agrícolas con indicadores de cantidad, hectáreas, productividad y producción orgánica.
- Mapa interactivo centrado en Colombia.
- Clustering de marcadores y visualización de zonas productivas.
- Heatmap de productividad.
- Búsqueda de ubicaciones y propiedades con OpenStreetMap.
- Cuatro capas base seleccionables.
- Herramientas de dibujo de parcelas.
- Tarjetas de productores y cultivos.
- Modal de detalle, galería y carga de imágenes mediante Cloudinary.
- Estados de carga, error, reintento y base de datos vacía.
- Lazy loading del mapa y Error Boundary.

**Backend iniciado:**

- Entidad de dominio `Plot`.
- Contrato `PlotRepository`.
- Caso de uso `FindNearbyPlotsUseCase`.
- Repositorio `PrismaPlotRepository` con consulta PostGIS para `ST_DWithin`.
- Controlador `PlotController`.
- Ruta `plotRoutes.ts` para búsqueda de parcelas cercanas.

**Brechas observadas en el repositorio:**

- El backend no tiene todavía `package.json`, `tsconfig.json`, punto de entrada ni composición completa de Express.
- No se encontró un schema Prisma ni migraciones listas para ejecutar.
- El frontend consulta Supabase directamente, mientras que la arquitectura oficial define Express + Prisma como backend de la aplicación.
- `frontend/src/main.tsx` contiene dos montajes de React; debe conservarse un único `createRoot`.
- Existen usos de `console` en código de aplicación que deben migrarse al logger definido para producción.
- Existen usos de `any` y manejo genérico de errores en el esqueleto backend que deben corregirse antes de considerarlo conforme al contrato del proyecto.
- No hay scripts de pruebas Jest, Supertest o Playwright implementados en `frontend/package.json`.
- No se ha consolidado el pipeline CI/CD descrito en la especificación.

**Estado:** prototipo frontend funcional y backend en construcción inicial.

### Fase 6. Gestión ágil, auditoría y corrección documental

**Propósito:** revisar los resultados, corregir inconsistencias y cerrar la línea base documental.

**Resultados documentados:**

- Sprint 6: cierre de la versión inicial del manual técnico y manual de usuario.
- Sprint 7: entrega documentada de 75/75 story points, cobertura reportada del 87% y cierre de 8 hallazgos críticos.
- Sprint 8: entrega documentada de 50/50 story points, cobertura reportada del 89% y cierre de 16 hallazgos de prioridad alta.
- Sprint 9: cierre documentado de 53/53 hallazgos de PT-FIX-01, cobertura reportada del 91% y declaración de cierre del proyecto formativo.
- PT-AUD-02: auditoría documental basada en SWEBOK V4.0a y depuración de la línea base.
- PT-FIX-02: consolidación de las correcciones y reemplazo operativo de PT-FIX-01.
- Matriz v2.0: 100% de los artefactos trazados y 84 propiedades de módulos actualizadas en Notion.

**Estado:** completada en la dimensión de documentación y control formativo. Las métricas de cobertura consignadas en actas deben contrastarse con la ejecución actual del repositorio cuando se reconstruya el pipeline técnico.

### Fase 7. Consolidación técnica y preparación para producción

Esta es la fase pendiente para llevar el proyecto desde el prototipo y la documentación hacia una solución ejecutable integral.

**Prioridades:**

1. Crear el proyecto backend ejecutable con Express, TypeScript, configuración, dependencias y punto de entrada.
2. Crear el schema Prisma, las migraciones y la configuración PostgreSQL/PostGIS.
3. Exponer contratos API y conectar el frontend con el backend oficial.
4. Implementar autenticación, roles, autorización, refresh tokens y rate limiting.
5. Completar marketplace, inventario, pedidos, pagos, mensajería, logística, soporte y módulos restantes.
6. Resolver la operación offline-first y la sincronización de datos.
7. Eliminar secretos o valores de configuración sensibles del código fuente y rotar credenciales expuestas durante el desarrollo.
8. Corregir los hallazgos de calidad: doble render, `any`, `console`, errores no tipados y validación insuficiente.
9. Implementar pruebas unitarias, integración y E2E con cobertura mínima del 80%.
10. Crear el pipeline CI/CD con lint, typecheck, pruebas, auditoría de dependencias, SAST, staging y smoke tests.

**Estado:** pendiente; esta fase representa la principal brecha entre el avance documental y la madurez de producto.

## Competencias asociadas

### Competencias técnicas

| Competencia                                             | Evidencia en AgroConnect                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Analizar necesidades y requisitos del cliente**       | Planteamiento del problema, levantamiento de requisitos y organización de 17 módulos.                               |
| **Especificar requisitos funcionales y no funcionales** | Línea base de 68 RF y 30 RNF con criterios de trazabilidad.                                                         |
| **Modelar sistemas de información**                     | 6 actores, 66 casos de uso, historias de usuario, actividades UML y refinamiento de flujos.                         |
| **Diseñar la arquitectura de software**                 | PT-AR-ARQ-01, Clean Architecture, DDD, contratos de repositorio y separación de capas.                              |
| **Diseñar y gestionar datos**                           | PostgreSQL, PostGIS, Prisma, modelo de parcelas y consultas geoespaciales.                                          |
| **Construir interfaces web**                            | React, Vite, TypeScript, Tailwind, componentes reutilizables y diseño responsive.                                   |
| **Implementar funcionalidades geoespaciales**           | Leaflet, OpenStreetMap, búsqueda, clustering, heatmap y dibujo de parcelas.                                         |
| **Integrar servicios externos**                         | Cloudinary para imágenes, OpenStreetMap para búsqueda y Jira/Notion para gestión y trazabilidad.                    |
| **Aplicar seguridad y protección de información**       | JWT, refresh tokens, validación, control de secretos, manejo de PII y procesamiento local de datos sensibles.       |
| **Aplicar aseguramiento de calidad**                    | Auditoría documental, correcciones PT-FIX-02, linters, formateo, objetivos de cobertura y criterios de rendimiento. |
| **Gestionar configuración y versiones**                 | Git, ramas definidas, `.opencode/SPEC.md`, `.envrc`, scripts de automatización y control de artefactos.             |
| **Gestionar proyectos ágiles**                          | Equipo Scrum, planificación y cierre de sprints, story points, Jira y retrospectiva documental.                     |

### Competencias transversales y formativas

- Comunicación efectiva para presentar avances, decisiones y resultados técnicos.
- Trabajo colaborativo y distribución de responsabilidades en un equipo Scrum.
- Resolución de problemas mediante análisis, prototipado, validación y corrección iterativa.
- Investigación formativa y uso crítico de fuentes sobre requisitos, UML, Scrum y desarrollo de software.
- Pensamiento ético frente al tratamiento de datos personales, coordenadas rurales y operaciones financieras.
- Responsabilidad social y orientación a necesidades concretas de comunidades productoras.
- Organización documental y capacidad de mantener la trazabilidad de las decisiones del proyecto.

## Impactos esperados

### Impacto social

- Mayor visibilidad de productores y productos rurales.
- Acceso más directo a compradores individuales y empresariales.
- Reducción de barreras de uso mediante una experiencia móvil, clara y adaptada a contextos rurales.
- Mejor acceso a información de ubicación, oferta, disponibilidad y estado de pedidos.

### Impacto económico

- Posible reducción de la dependencia de intermediarios.
- Mejores oportunidades de negociación y comercialización para productores.
- Mayor capacidad para planear inventarios, pedidos y entregas.
- Disminución esperada de pérdidas asociadas a descoordinación en productos perecederos.

### Impacto en la cadena de suministro

- Integración progresiva de oferta, inventario, pedidos, pagos y logística.
- Trazabilidad del estado de las operaciones.
- Mejor coordinación entre productor, comprador y transportista.
- Uso de información geográfica para apoyar la localización y la planificación de entregas.

### Impacto tecnológico

- Uso de tecnologías open source y estándares web.
- Base arquitectónica preparada para crecer por módulos.
- Separación del dominio respecto de Express, Prisma y otros detalles de infraestructura.
- Incorporación de capacidades geoespaciales con PostGIS en lugar de cálculos improvisados en el cliente.
- Posibilidad de operar con estrategias offline-first y sincronización para contextos con conectividad limitada.

### Impacto ambiental

- Mejor planificación de recorridos y consolidación de entregas mediante información geográfica.
- Potencial reducción de desplazamientos innecesarios.
- Mejor gestión de productos perecederos y, por tanto, posibilidad de reducir desperdicios.

Estos impactos son esperados y deberán verificarse mediante métricas de uso, operaciones realizadas, tiempos de entrega, desperdicio reportado y satisfacción de los usuarios. No deben presentarse como resultados ya medidos mientras el backend y los módulos de negocio no estén implementados de forma integral.

### Impacto académico y profesional

- Evidencia de aplicación de las competencias del programa ADSO.
- Consolidación de una matriz de trazabilidad completa.
- Experiencia práctica con RUP + Scrum, Clean Architecture, PostGIS, React, Express y documentación técnica.
- Base reutilizable para proyectos futuros de comercio, logística y analítica agropecuaria.

### Indicadores de seguimiento propuestos

| Indicador                            | Meta o criterio                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Cobertura de trazabilidad documental | 100% de RF, CU, HU y módulos según la línea base oficial                                                          |
| Cobertura de pruebas                 | Igual o superior al 80%                                                                                           |
| Latencia de API                      | P95 menor a 300 ms en condiciones objetivo                                                                        |
| Rendimiento frontend                 | LCP menor a 2.5 s y TTI menor a 3.5 s en 3G                                                                       |
| Bundle inicial                       | Menor a 200 KB comprimido, sujeto a validación de la aplicación completa                                          |
| Vulnerabilidades críticas            | 0 en el gate de seguridad                                                                                         |
| Calidad de entrega                   | 0 errores de lint y typecheck en CI                                                                               |
| Disponibilidad funcional             | Flujos críticos de login, CRUD de producto, búsqueda geoespacial y checkout cubiertos por pruebas E2E             |
| Adopción                             | Medir productores, compradores, productos publicados, pedidos y transacciones una vez exista un entorno operativo |

## Conclusión

AgroConnect presenta una base documental SENA sólida, una matriz de trazabilidad consolidada y un prototipo frontend que demuestra el concepto de visualización geográfica de propiedades agrícolas. El proyecto también cuenta con una definición arquitectónica clara y con un esqueleto backend orientado a geolocalización.

La principal brecha se encuentra en la transición desde la documentación y el prototipo hacia una plataforma integrada: el backend, el esquema de datos, las APIs, la autenticación, los módulos de negocio, las pruebas y el pipeline de despliegue todavía requieren construcción y validación. La siguiente etapa debe priorizar la alineación del frontend con la arquitectura oficial Express + Prisma + PostgreSQL/PostGIS y convertir la base actual en un sistema ejecutable, seguro y verificable.

## Fuentes de consolidación

- `.opencode/SPEC.md`, contrato maestro del sistema.
- `README.md`, descripción general, stack y organización del repositorio.
- `docs/matriz_trazabilidad_completa.md`, matriz v2.0 de RF, CU, HU y módulos.
- `docs/matriz_trazabilidad_resumen_v2.md` y archivos CSV de trazabilidad.
- `docs/actividades/entregables/`, entregables de las actividades integradoras.
- Notion: PT-AR-ARQ-01, PT-AUD-02, PT-FIX-02, PT-MTC-01, PT-MU-01, PT-PP-02 y matriz de trazabilidad.
- Notion: actas documentadas de Sprint 7, Sprint 8 y Sprint 9.
- Open Notebook AgroConnect: 38 fuentes del material formativo SENA.
- `frontend/src/App.tsx`, `frontend/src/components/`, `frontend/src/services/` y `frontend/package.json`.
- `backend/src/modules/geography/`, base inicial del módulo geográfico.
- SWEBOK V4.0a: áreas de conocimiento de requisitos, arquitectura, gestión, proceso, calidad y seguridad (KA01, KA02, KA09, KA10, KA12 y KA13).
