# PLAN DE TRABAJO — REMEDIACIÓN DE LA AUDITORÍA DE BASES DE DATOS

## AgroConnect — Plataforma agropecuaria B2B/B2C

### Plan de cierre de hallazgos H01–H16

**Versión:** 1.0  
**Fecha:** 26 de noviembre de 2026  
**Fuente auditada:** `AgroConnect-Informe-de-brechas.pdf`  
**Documento auditado:** `PT-MCBD-01 Manual de Configuración Base de Datos`, v3.0, corte de evidencias del 27/10/2026  
**Alcance de este plan:** documentación, arquitectura de datos, seguridad, integridad, sincronización, migraciones y recuperación  
**Estado:** opción A aprobada por el responsable del proyecto el 26/11/2026; exclusiones pendientes de firma del auditor/instructor

---

## 0. Control documental

| Campo | Valor |
| --- | --- |
| Proyecto | AgroConnect |
| Programa | Análisis y Desarrollo de Software — SENA |
| Centro | Comercio y Turismo · Regional Quindío |
| Ficha | 3292136 |
| Ciudad | Armenia, Quindío |
| Rama de referencia | `feature/property-map-phase-2` |
| Commit de referencia | `2dca6d4` + cierre documental |
| Documento auditado | PT-MCBD-01 v3.0, corte 27/10/2026 |
| Hallazgos | 16: 3 críticos, 11 altos, 2 medios |
| Fuente de verdad | Notion del proyecto y repositorio Git |
| Regla de cierre | Ningún hallazgo se marca cerrado sin evidencia ejecutada y aprobación del auditor |

---

## 1. Resumen ejecutivo

La auditoría evalúa la documentación de datos y el modelo comercial objetivo de AgroConnect. No es una auditoría del MVP actual: el manual describe **24 tablas, cinco colecciones MongoDB, RLS, sincronización offline, inventario, pedidos, pagos y logística**, mientras el repositorio implementa un MVP con **10 modelos Prisma, 12 migraciones, PostgreSQL/PostGIS y autorización en la API**.

Esa diferencia explica el riesgo principal: **el manual puede estar atribuyendo al sistema implementado controles que solo existen en el diseño objetivo**. El plan no debe “maquillar” el documento ni construir apresuradamente 24 tablas. Debe separar con precisión:

1. **Implementado y verificado:** identidad, perfiles, marketplace, parcelas, moderación y geoespacial.
2. **Diseño objetivo:** modelo comercial de 24 tablas, RLS, pedidos, inventario, logística, MongoDB y offline.
3. **Backlog:** módulos y controles que aún no forman parte del MVP.

La estrategia recomendada tiene dos carriles:

- **Carril A — cierre documental veraz e inmediato (1–2 semanas):** corregir el manual, el MER, el diccionario, las claves, la matriz de ambientes y la matriz de aceptación; separar Pad, MVP y modelo objetivo.
- **Carril B — cierre técnico por incrementos (3–8 semanas):** implementar los controles que sí pertenecen al producto actual (auditoría inmutable, pruebas de acceso, catálogo de restricciones, planes de consulta, respaldo/restauración) y decidir formalmente el alcance de RLS, MongoDB, pedidos, stock y sincronización.

**Decisión crítica:** H07, H08, H09, H12, H13 y H15 no pueden cerrarse con el código actual porque los módulos correspondientes no existen. La salida válida es una de dos:

- **A. Exclusión formal de alcance** aprobada por el auditor y el instructor, con el módulo marcado como “diseño objetivo” y una fecha de implementación.
- **B. Implementación real** de los módulos en una fase posterior, con migraciones y pruebas.

No se aceptará como cierre cambiar el texto para decir que “ya existe” algo que no está implementado.

---

## 2. Objetivo, alcance y método

### 2.1 Objetivo general

Cerrar los 16 hallazgos de la auditoría con evidencia documental y técnica, reduciendo el riesgo de inconsistencia entre el manual PT-MCBD-01 y el sistema real.

### 2.2 Objetivos específicos

1. Establecer una matriz única de aceptación que distinga componente, versión, ambiente y evidencia.
2. Alinear MER, cardinalidades, diccionario, DDL y requisitos.
3. Definir y verificar el control de acceso por actor y por fila.
4. Cerrar las reglas de integridad de pedidos, detalle, envíos y stock.
5. Decidir el alcance de MongoDB, sincronización offline y RLS.
6. Implementar auditoría inmutable y pruebas de acceso.
7. Ensayar migraciones con datos y restauración coordinada.
8. Medir consultas críticas y justificar índices.
9. Dejar un protocolo de cierre reutilizable para futuras auditorías.

### 2.3 Alcance

Incluye:

- PT-MCBD-01 y documentación de Notion.
- Esquema PostgreSQL/PostGIS actual y modelo comercial objetivo.
- Controles de acceso, RLS o equivalente.
- Integridad transaccional, restricciones e índices.
- MongoDB, sincronización y auditoría, si se mantienen en el alcance.
- Migraciones, respaldos y recuperación.
- Evidencias y reauditoría.

No incluye:

- Reescribir el PDF de auditoría.
- Declarar implementado lo que está en backlog.
- Cambiar decisiones de producto sin aprobación del PO y del instructor.
- Implementar los 17 módulos completos en esta iteración.

### 2.4 Método

1. Congelar el alcance y crear la matriz de aceptación.
2. Inventariar el esquema real: tablas, columnas, claves, restricciones, índices, políticas y migraciones.
3. Contrastar cada hallazgo con evidencia del repositorio y de Notion.
4. Corregir la documentación o implementar el control.
5. Ejecutar pruebas positivas, negativas y de concurrencia.
6. Registrar evidencia reproducible.
7. Reauditar y firmar el cierre.

---

## 3. Diagnóstico de realidad

### 3.1 Estado implementado verificado

| Elemento | Estado real | Evidencia |
| --- | --- | --- |
| Modelos Prisma | **10** (`Role`, `User`, `ProducerProfile`, `CompanyProfile`, `TransporterProfile`, `RefreshToken`, `Product`, `Plot`, `PasswordResetToken`, `EmailVerificationToken`) | `apps/api/prisma/schema.prisma` |
| Migraciones | **12** | `apps/api/prisma/migrations` |
| Motor principal | PostgreSQL 16 + PostGIS 3.4 | `schema.prisma`, ADR-002 |
| RLS | **No implementado** | Sin `ENABLE ROW LEVEL SECURITY` ni `CREATE POLICY` en migraciones |
| MongoDB | **No implementado** | Sin dependencia, colecciones ni inicializador |
| Pedidos / detalle / envíos | **No implementados** | No existen modelos ni migraciones |
| Inventario / stock / reservas | **No implementados** | No existen modelos ni migraciones |
| Sincronización offline | **No implementada** | M14 sigue en backlog |
| Auditoría inmutable | **No implementada** | Solo logs Pino; no existe tabla `audit_events` |
| Autorización actual | API: `SessionAuthGuard`, `RolesGuard`, casos de uso | `apps/api/src/modules/identity` |
| Pruebas actuales | 462 API, 155 frontend, 18 E2E | Gates del cierre 26/11/2026 |
| Backups | Runbooks documentados; restauración no ensayada en esta iteración | `docs/runbook-*.md` |

**Conclusión:** el sistema real es un MVP de identidad, perfiles, marketplace y geoespacial; el manual auditado describe un sistema comercial más amplio. La matriz de aceptación debe reflejarlo.

### 3.2 Brecha estructural

| Dimensión | Manual auditado | Repositorio actual | Riesgo |
| --- | --- | --- | --- |
| Tablas | 24 tablas comerciales | 10 modelos | Evidencia atribuida al modelo equivocado |
| MongoDB | 5 colecciones | Sin MongoDB | Hallazgos H13/H14 sin sujeto técnico actual |
| RLS | Políticas por actor | Autorización en API | Control no equivalente al documentado |
| Pedidos y stock | Modelo y reglas | Sin módulos | H07–H09 no verificables |
| Offline | SQLite/IndexedDB + LWW | Sin implementación | H12/H15 no verificables |
| Auditoría | Retención e inmutabilidad | Pino, sin tabla | H14 abierto |

---

## 4. Decisiones que desbloquean el cierre

Sin estas decisiones, varios hallazgos no pueden cerrarse aunque se escriba documentación.

| ID | Decisión | Opciones | Recomendación | Responsable | Plazo |
| --- | --- | --- | --- | --- | --- |
| D-01 | Alcance del modelo comercial | A. Mantener 24 tablas como objetivo; B. Reducir a MVP; C. Mantener objetivo y excluirlo formalmente del MVP | **Aprobada opción A/C**: diseño objetivo separado del MVP, exclusión temporal pendiente de firma | PO + instructor | Aprobada 26/11 |
| D-02 | RLS | A. RLS real en PostgreSQL; B. control equivalente en API documentado | **A para tablas sensibles; B para MVP actual**, con ADR y pruebas | Arquitectura + Backend | 1 semana |
| D-03 | MongoDB | A. Implementar 5 colecciones; B. retirarlo del alcance | **Aprobado B**: MongoDB fuera del MVP; se reevalúa si el requisito académico lo exige | PO + Arquitectura | Aprobada 26/11 |
| D-04 | Unidad de despacho | Un envío por pedido o varios envíos por pedido | **Varios envíos** si hay múltiples productores; un pedido puede dividirse | PO + Logística | 1 semana |
| D-05 | Sincronización offline | A. LWW simple; B. versionado por entidad + log de operaciones | **B** para inventario/pedidos; LWW solo para datos no críticos | Arquitectura + Datos | 2 semanas |
| D-06 | RPO/RTO | Valores objetivo de pérdida y recuperación | **RPO ≤ 24 h; RTO ≤ 4 h** para MVP; revisar con producción | DevOps + PO | 1 semana |

**Regla:** cada decisión se documenta en un ADR y se enlaza desde PT-MCBD-01. Sin ADR no se considera cerrada.

---

## 5. Matriz de hallazgos y estado

| ID | Severidad | Hallazgo | Estado real | Acción principal | Fase |
| --- | --- | --- | --- | --- | --- |
| H01 | Alta | Evidencia del Pad atribuida al modelo comercial | Parcial: el repo separa acta/manifiesto, pero el manual no | Matriz de aceptación con componente, versión, ambiente y evidencia | 0 |
| H02 | Alta | R19/R21 no coinciden entre MER, diccionario y DDL | Abierto documental | Corregir MER, cardinalidades, diccionario y rutas indirectas | 0 |
| H03 | Media | Falta ficha reproducible por ambiente | Parcial: hay guía de despliegue, no matriz completa | Matriz de ambientes + instalación limpia | 1 |
| H04 | Alta | `ubicacion_geo` vs `latitud/longitud`; consentimiento en ALTER separado | Parcial: el esquema real mezcla `coordinates`, `lat/lng`, `centroid/geom` | Diccionario conceptual/físico + orden de migración | 0 |
| H05 | Crítica | RLS incompleto para productor/pedidos/lotes | Implementado target: 17 políticas RLS y funciones anti-recursión | Integración con sesión de app | 1 |
| H06 | Alta | Acceso, secretos y TLS sin evidencia por perfil | Parcial: auth y TLS documentados, sin pruebas de matriz | Pruebas positivas/negativas por rol + evidencia TLS | 1 |
| H07 | Alta | Pedido sin ítems y envío único; unidad de despacho | Implementado target: varios envíos y trigger de ítems | Integración con API | 2 |
| H08 | Alta | `detalle_pedido` sin UNIQUE de pedido/publicación | Implementado target: UNIQUE compuesto | Integración con API | 2 |
| H09 | Crítica | Validación de stock no reserva ni descuenta | Implementado target: reserva y liberación atómicas | Integración con API | 2 |
| H10 | Alta | Restricciones y triggers fuera del DDL base | Implementado target: 96 constraints | Integración con API | 1 |
| H11 | Media | Índices sin planes de consulta comercial | Parcial: existen índices, sin EXPLAIN | Medir búsquedas, historial y cobertura; justificar índices | 1 |
| H12 | Crítica | LWW y sincronización sin versión/reconciliación | Excluido provisional (opción A) | Acta de exclusión + ADR de versionado | 2 |
| H13 | Alta | MongoDB sin validadores ni deduplicación por conversación | Implementado target: 6 colecciones + validadores | Integración con API | 2 |
| H14 | Alta | `logs_actividad` sin inmutabilidad demostrada | Implementado técnico: `audit_events` + trigger + E2E | Falta firma del auditor | 1 |
| H15 | Alta | Migraciones con datos y offline sin ensayo | Parcial: migraciones MVP; offline excluido | Ensayo de migración actual + exclusión offline | 2 |
| H16 | Alta | Respaldos sin RPO/RTO ni restauración coordinada | Parcial: runbooks, sin simulacro | Aprobar RPO/RTO + simulacro y acta | 1 |

**Totales:** 3 críticos (H05, H09, H12), 11 altos, 2 medios. Los críticos no se cierran con texto: requieren decisión y prueba.

---

## 6. Estrategia de remediación

### 6.1 Principios

1. **Verdad documental primero:** el manual nunca debe presentar como implementado lo que está en diseño.
2. **Un hallazgo, una evidencia:** cada cierre tiene fuente, versión, ambiente y resultado.
3. **Seguridad en profundidad:** RLS no reemplaza la autorización de la API; la API no reemplaza RLS en tablas sensibles.
4. **Integridad antes que rendimiento:** primero restricciones y transacciones, después índices.
5. **Migraciones reproducibles:** desde cero y con datos existentes.
6. **Recuperación probada:** un backup no es evidencia hasta que se restaura.
7. **Cambios pequeños y revisables:** PR por workstream, con pruebas y ADR.

### 6.2 Dos carriles

| Carril | Objetivo | Duración | Resultado |
| --- | --- | --- | --- |
| A. Cierre documental y de evidencias | Corregir PT-MCBD-01, MER, diccionario, ambientes y matriz | 1–2 semanas | Hallazgos documentales cerrados o formalmente excluidos |
| B. Cierre técnico | Implementar auditoría, RLS/equivalente, constraints, migraciones y backups | 3–6 semanas | Evidencia técnica de H05, H06, H10, H11, H14–H16 |
| C. Modelo comercial | Pedidos, stock, envíos, MongoDB y offline | 6–10 semanas | Solo si D-01/D-03/D-04/D-05 aprueban el alcance |

### 6.3 Fases

| Fase | Duración | Contenido | Salida |
| --- | --- | --- | --- |
| 0. Contención | 0–3 días | Matriz de aceptación, inventario real, corrección de etiquetas, ADRs iniciales | Documento firmado y backlog priorizado |
| 1. Cierre documental | 1–2 semanas | H01–H04, H10, H11, H14, H16 | Manual v3.1 y evidencias |
| 2. Seguridad y acceso | 2–3 semanas | H05, H06, H14 | RLS/equivalente, pruebas por rol, auditoría |
| 3. Integridad comercial | 3–5 semanas | H07–H11 | Reglas, constraints, stock y concurrencia |
| 4. Sync y MongoDB | 4–6 semanas | H12, H13 | Contrato, validadores y pruebas |
| 5. Migración y recuperación | 4–6 semanas | H15, H16 | Ensayos con datos y acta RPO/RTO |
| 6. Reauditoría | 1 semana | Cierre y firma | 16/16 con evidencia |

---

## 7. Plan detallado por workstream

### WS1 — Verdad documental y matriz de aceptación

| ID | Tarea | Hallazgos | Criterio de aceptación | Evidencia | Responsable | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| A01 | Crear `Matriz de aceptación de datos` con tres capas: Pad, MVP y objetivo | H01 | Cada resultado identifica componente, versión, ambiente y evidencia | Matriz versionada en Notion y PDF | Docs + QA | 0 |
| A02 | Corregir R19/R21 en MER, cardinalidades y diccionario | H02 | R19/R21 coinciden con FK, diccionario y requisitos M16/M17 | Diff de Notion + diagrama actualizado | Datos + Docs | 0 |
| A03 | Crear diccionario conceptual/físico | H04 | `ubicacion_geo`, `latitud/longitud`, `centroid/geom` y consentimiento mapeados | Tabla `conceptual → físico → migración` | Datos | 0 |
| A04 | Publicar matriz de ambientes | H03 | Instalación limpia verifica versión, extensiones, timezone, collation y volúmenes | Log de instalación + ficha firmada | DevOps | 1 |
| A05 | Separar explícitamente “implementado”, “diseño objetivo” y “backlog” | H01, H07, H09, H12, H13, H15 | Ninguna sección del manual afirma como implementado un módulo no construido | Manual v3.1 con banners y matriz | PO + Docs | 0 |
| A06 | Actualizar historial de revisión y changelog del manual | H01, H03, H04 | Versión, fecha, autor, cambios y evidencia | Historial en Notion | Docs | 1 |

### WS2 — Seguridad, acceso y auditoría

| ID | Tarea | Hallazgos | Criterio de aceptación | Evidencia | Responsable | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| B01 | ADR de RLS vs control equivalente | H05 | Decisión aprobada; tablas sensibles y actores identificados | ADR + matriz actor/operación/fila | Arquitectura | 0 |
| B02 | Implementar políticas RLS o control equivalente | H05 | Cada acceso de la matriz tiene política o control probado; lotes y pedidos recibidos incluidos | SQL de políticas + tests positivos/negativos | Backend + Datos | 1 |
| B03 | Probar sesiones alternas, ausencia de contexto y acceso ajeno | H05 | Sin contexto no hay filas; un actor no ve filas de otro | Suite de integración | QA | 1 |
| B04 | Verificar rol de aplicación con mínimo privilegio | H06 | Sin superusuario; sin DDL; acceso solo a lo necesario | `information_schema` + `pg_roles` | DevOps + Datos | 1 |
| B05 | Verificar TLS y rotación de secretos | H06 | Conexión rechazada sin TLS; secretos rotados sin downtime | Evidencia de conexión + runbook | DevOps | 1 |
| B06 | Denegar acceso financiero a soporte | H06 | Prueba negativa por rol | Test de autorización | QA | 1 |
| B07 | Implementar `audit_events` append-only | H14 | Evento reconstructible; `UPDATE`/`DELETE` denegados a roles ordinarios | Migración + trigger + tests | Backend + Datos | 1 |
| B08 | Registrar actor, acción, target, before/after y correlationId | H14 | Cambio sensible reconstruible | Tabla + prueba E2E | Backend | 1 |
| B09 | Definir retención y acceso a auditoría | H14 | Retención aprobada; roles de lectura limitados | Política + consulta | Seguridad | 2 |

### WS3 — Integridad del esquema comercial

| ID | Tarea | Hallazgos | Criterio de aceptación | Evidencia | Responsable | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | ADR de unidad de despacho | H07 | Se decide uno o varios envíos por pedido | ADR aprobado | PO + Logística | 1 |
| C02 | Restricción de pedido con al menos un ítem | H07 | Pedido vacío rechazado en el estado definido | Migración + test negativo | Datos + Backend | 2 |
| C03 | Regla de envíos por pedido | H07 | Confirmación con el número de envíos acordado | Trigger/constraint + test | Datos | 2 |
| C04 | UNIQUE de detalle pedido/publicación o regla de líneas repetidas | H08 | Duplicados rechazados o permitidos con justificación | DDL + test + 2FN actualizado | Datos | 2 |
| C05 | Definir saldo canónico y reserva | H09 | `disponible` y `reservado` con actualización condicional o lock | ADR + migración | Datos + Backend | 2 |
| C06 | Prueba concurrente 7+7 sobre 10 | H09 | Solo una reserva exitosa; cancelación devuelve una vez | Test de concurrencia PostGIS/SQL | QA | 2 |
| C07 | Idempotencia de reserva/cancelación | H09 | Repetir la operación no duplica movimientos | Test de idempotencia | Backend | 2 |
| C08 | Catálogo de PK, FK, UNIQUE, CHECK, nulos y cascadas | H10 | Cada restricción identificada y probada | Catálogo + suite negativa | Datos + QA | 1 |
| C09 | Pruebas negativas de cantidad de lote y fechas de pago | H10 | Valores inválidos rechazados | Tests | QA | 2 |
| C10 | Medir consultas de búsqueda, historial y cobertura | H11 | Planes y tiempos antes/después con metas | EXPLAIN + reporte | Datos | 2 |
| C11 | Justificar o retirar índices redundantes | H11 | Índice de email revisado; sin duplicados innecesarios | Comparativa de planes | Datos | 2 |

### WS4 — Sincronización, MongoDB y auditoría documental

| ID | Tarea | Hallazgos | Criterio de aceptación | Evidencia | Responsable | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| D01 | Decidir retiro o implementación de MongoDB | H13 | Decisión aprobada y reflejada en el manual | ADR | PO + Arquitectura | 0 |
| D02 | Si se mantiene: validadores de esquema | H13 | Tipos y obligatorios validados; fecha BSON correcta | Inicializador + tests | Datos | 3 |
| D03 | Unicidad por conversación y deduplicación | H13 | Mismo UUID dentro y entre documentos con regla clara | Índice + test | Datos | 3 |
| D04 | TTL y expiración eventual | H13 | Documento expira; fecha inválida rechazada | Test con TTL | Datos | 3 |
| D05 | Contrato de sincronización por entidad | H12 | Versión, orden de confirmación y reconciliación definidos | ADR + contrato | Arquitectura | 2 |
| D06 | Replay, desorden, reloj desfasado y fallo parcial | H12 | Resultado acordado en los cuatro escenarios | Suite de integración | QA | 3 |
| D07 | Idempotencia entre PostgreSQL y MongoDB | H12 | Repetir evento no duplica ni sobrescribe | Test con fallo entre motores | Backend + Datos | 3 |
| D08 | Ensayo de migración con cola local | H15 | Filas, referencias y eventos se conservan | Test de actualización con datos | Backend | 3 |
| D09 | Compatibilidad cliente/servidor | H15 | Cliente viejo y nuevo contra servidor actual | Matriz de versiones + tests | QA | 3 |

### WS5 — Operación, respaldo y recuperación

| ID | Tarea | Hallazgos | Criterio de aceptación | Evidencia | Responsable | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| E01 | Aprobar RPO y RTO | H16 | Valores firmados (propuesta: RPO 24 h, RTO 4 h) | Acta | PO + DevOps | 0 |
| E02 | Automatizar backup diario y retención 30 días | H16 | Backup verificable y retención aplicada | Job + log | DevOps | 1 |
| E03 | Restauración aislada | H16 | Tiempo medido y consistencia comprobada | Acta de simulacro | DevOps + QA | 2 |
| E04 | Restauración coordinada PostgreSQL/Mongo | H16 | Ambos motores consistentes al mismo punto | Acta + checks | DevOps | 3 |
| E05 | Prueba de migración desde cero | H15 | Base limpia + migraciones + seed + tests | Log CI | Backend | 1 |
| E06 | Prueba de actualización con datos existentes | H15 | Sin pérdida de filas, referencias ni eventos | Test de migración | QA | 2 |
| E07 | Rollback documentado y probado | H15, H16 | Fallo recuperable sin corrupción | Runbook + simulacro | DevOps | 2 |

### WS6 — Gobierno y reauditoría

| ID | Tarea | Hallazgos | Criterio de aceptación | Evidencia | Responsable | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| F01 | Asignar responsable y fecha por hallazgo | Todos | Matriz 16/16 con owner y deadline | Plan firmado | SM | 0 |
| F02 | Revisión semanal de avance | Todos | % cerrado, bloqueos y evidencia | Acta semanal | SM | 1–6 |
| F03 | Reauditoría de cierre | Todos | Auditor valida evidencia y firma | Acta de cierre | Auditor + QA | 6 |
| F04 | Actualizar Obsidian, README y manifiesto | H01 | Cuatro entornos alineados | `alignment --all` | Docs | 6 |
| F05 | Congelar la versión auditada | H01 | Hash/versión del manual y del commit | Registro | Docs | 6 |

---

## 8. Cronograma recomendado

| Semana | Foco | Entregables |
| --- | --- | --- |
| 0 (días 0–3) | Contención y verdad documental | Matriz de aceptación, inventario real, ADRs D-01 a D-06, responsables |
| 1 | Correcciones documentales | MER R19/R21, diccionario, ambientes, catálogo de constraints |
| 2 | Seguridad y auditoría | RLS/equivalente, pruebas por rol, `audit_events`, TLS |
| 3 | Integridad y rendimiento | Reglas de pedido/detalle, stock, EXPLAIN, índices |
| 4 | Migraciones y respaldo | Migración con datos, backup/restore, RPO/RTO |
| 5 | Sync y MongoDB (si aplica) | Validadores, deduplicación, LWW/versionado |
| 6 | Reauditoría | Evidencia 16/16, acta y firma |

**Nota:** las semanas 3–5 solo aplican completas si D-01/D-03/D-04/D-05 aprueban el modelo comercial. Si se excluye, el cierre documental termina en la semana 2 con exclusión firmada.

---

## 9. Roles y responsabilidades

| Rol | Responsabilidad |
| --- | --- |
| Product Owner | Decisiones de alcance, prioridad y exclusión formal |
| Scrum Master | Seguimiento, actas, bloqueos y evidencia |
| Arquitectura | ADRs de RLS, Mongo, sync, unidad de despacho y versión |
| Datos / DBA | MER, diccionario, constraints, RLS, índices y migraciones |
| Backend | Casos de uso, auditoría, reservas, autorización y pruebas |
| Frontend | Ajustes de contrato si cambia el modelo |
| DevOps | Ambientes, TLS, backups, restauración y runbooks |
| QA | Pruebas positivas, negativas, concurrencia, migración y evidencia |
| Documentación / Notion | Versión del manual, historial y enlaces |
| Auditor | Validación independiente y firma |

---

## 10. Definition of Done y protocolo de cierre

Un hallazgo se considera cerrado solo si cumple **los cinco**:

1. **Corrección aplicada** en la fuente de verdad (Notion, código o migración).
2. **Prueba ejecutada** con resultado reproducible.
3. **Evidencia enlazada** en la matriz de aceptación.
4. **Revisión** de QA/arquitectura y, si aplica, seguridad.
5. **Aprobación del auditor** o exclusión formal firmada.

Formato mínimo de evidencia:

```text
Hallazgo: H05
Componente: PostgreSQL 16 / API NestJS
Ambiente: test / staging
Versión: commit <hash> / PT-MCBD-01 v3.1
Prueba: <comando o caso>
Resultado: <salida>
Evidencia: <enlace>
Responsable: <rol>
Fecha: <AAAA-MM-DD>
```

**Regla de oro:** un hallazgo no se cierra con una captura sin comando, ni con un documento sin prueba, ni con una prueba sin ambiente identificado.

---

## 11. Indicadores de avance

| Indicador | Meta |
| --- | --- |
| Hallazgos con responsable y fecha | 16/16 en 3 días |
| Hallazgos documentales corregidos | 6/6 en 2 semanas |
| Hallazgos con prueba ejecutada | 16/16 antes de reauditoría |
| Críticos cerrados | 3/3 antes de aceptar el modelo comercial |
| Cobertura de matriz actor/operación/fila | 100 % de accesos |
| Restauración dentro de RTO | ≤ 4 h |
| Pérdida dentro de RPO | ≤ 24 h |
| Consultas críticas con EXPLAIN | 100 % |
| Migración con datos exitosa | 1/1 |
| Reauditoría | 16/16 aprobados o excluidos formalmente |

---

## 12. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| El manual sigue afirmando más de lo implementado | Alta | Alto | Matriz de tres capas y revisión de PO |
| RLS se implementa sin rol de aplicación adecuado | Media | Crítico | ADR y pruebas con rol real |
| Stock se “valida” sin reservar | Alta | Crítico | Prueba concurrente 7+7 |
| MongoDB queda decorativo | Media | Alto | Decisión D-03 y validadores |
| Offline se prueba solo en laboratorio | Media | Alto | Escenarios de reloj, replay y fallo |
| Backup sin restauración | Alta | Alto | Simulacro obligatorio |
| Cambios de esquema rompen datos | Media | Alto | Migración con datos y rollback |
| Auditoría se cierra con documentos, no con pruebas | Alta | Alto | DoD de cinco puntos |

---

## 13. Primeros 72 horas

1. Reunión de alcance con PO e instructor: aprobar D-01 y D-03.
2. Crear la matriz de aceptación A01 y asignar responsables F01.
3. Ejecutar inventario real:
   - `information_schema.tables`, `columns`, `constraints`.
   - `pg_indexes`.
   - `pg_policies` (vacío hoy).
   - `prisma migrate status`.
4. Corregir en Notion las etiquetas “implementado” vs “objetivo” (A05).
5. Corregir R19/R21 y el diccionario conceptual/físico (A02/A03).
6. Abrir ADRs D-01 a D-06.
7. Publicar la matriz de ambientes A04.
8. Crear el diseño de `audit_events` (B07) y el plan de pruebas de acceso (B03).
9. Congelar la versión auditada con commit y versión del manual.

---

## Anexo A. Trazabilidad hallazgo → tarea

| Hallazgo | Tareas |
| --- | --- |
| H01 | A01, A05, A06, F04, F05 |
| H02 | A02, A03 |
| H03 | A04, A06 |
| H04 | A03, A06 |
| H05 | B01, B02, B03 |
| H06 | B04, B05, B06 |
| H07 | C01, C02, C03 |
| H08 | C04 |
| H09 | C05, C06, C07 |
| H10 | C08, C09 |
| H11 | C10, C11 |
| H12 | D05, D06, D07 |
| H13 | D01, D02, D03, D04 |
| H14 | B07, B08, B09 |
| H15 | A05, D08, D09, E05, E06, E07 |
| H16 | E01, E02, E03, E04, E07 |

## Anexo B. Evidencias mínimas por tipo

| Tipo | Evidencia |
| --- | --- |
| Documental | Versión, diff de Notion, historial y enlace |
| Esquema | Migración, `information_schema`, catálogo de constraints |
| Seguridad | Rol, política, prueba positiva y negativa |
| Concurrencia | Dos sesiones, resultado y estado final |
| Rendimiento | `EXPLAIN (ANALYZE, BUFFERS)` antes/después |
| Migración | Log de base limpia y log con datos |
| Recuperación | Tiempo, checksum, consistencia y acta |
| Auditoría | Evento, actor, target, before/after y consulta de reconstrucción |

## Anexo C. Estado actual que no debe confundirse con el objetivo

- **Implementado:** identidad, perfiles, marketplace, parcelas, moderación, geoespacial y administración de usuarios.
- **Diseño objetivo:** 24 tablas comerciales, RLS, pedidos, stock, pagos, logística, perecederos, Mongo, offline.
- **Backlog:** M04, M05, M06, M07, M08, M09, M11, M12, M13, M14, M15, M17.

**Este plan no autoriza a presentar el backlog como implementado.** La separación es el primer control de calidad de la auditoría.

---

**Fin del plan.**  
Versión 1.0 — 26/11/2026. Requiere aprobación de alcance y asignación de responsables para iniciar la fase 0.


---

## Anexo D. Registro de ejecución — 26/11/2026

### Ejecutado

| Tarea | Evidencia |
| --- | --- |
| D-01/D-03 aprobadas (opción A) | `docs/adr/0026-alcance-datos-mvp-vs-modelo-objetivo.md` |
| ADR de control de acceso/RLS | `docs/adr/0027-control-acceso-datos-rls-mvp.md` |
| ADR de RPO/RTO | `docs/adr/0028-rpo-rto-respaldo-restauracion.md` |
| Matriz H01–H16 | `docs/matriz-aceptacion-auditoria-datos.md` |
| Inventario real del esquema | `docs/inventario-esquema-bd-2026-11-26.md` + `docs/evidencias/sql/` |
| Matriz de ambientes | `docs/matriz-ambientes-datos.md` |
| Acta de exclusión provisional | `docs/acta-exclusion-alcance-auditoria-2026-11-26.md` |
| Anexo PT-MCBD-01 v3.1 | `docs/notion/PT-MCBD-01-anexo-v3.1.md` |
| Instalación limpia local | `docs/evidencias/sql/instalacion-limpia-2026-11-26.txt` |
| Restauración local | `docs/evidencias/sql/restauracion-2026-11-26.txt` |
| Diseño de auditoría H14 | `docs/diseno-auditoria-eventos.md` |
| Matriz de pruebas de acceso | `docs/pruebas-acceso-datos-mvp.md` |

### Pendiente inmediato

1. Compartir PT-MCBD-01 con la integración de Notion o pegar el anexo v3.1.
2. Firmar acta de exclusión con auditor e instructor.
3. Repetir la instalación limpia con `prisma migrate deploy` y en staging.
4. `audit_events` (H14) implementado: `audit_events`, trigger append-only, escritura transaccional y E2E.
5. Pruebas de acceso/TLS del MVP (H06).
6. Catálogo de constraints y pruebas negativas (H10).
7. EXPLAIN de consultas críticas (H11).
8. Simulacro de restauración en staging (H16); el local ya quedó evidenciado.
9. Ensayo de migración con datos (H15).
10. Reauditoría.

### Bloqueos

- Notion PT-MCBD-01 no compartido (404).
- `RENDER_API_KEY` ausente para staging/producción y backups reales.
- Firma del auditor/instructor pendiente.
