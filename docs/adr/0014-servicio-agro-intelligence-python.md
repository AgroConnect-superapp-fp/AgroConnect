# ADR-014: Servicio satélite `agro-intelligence` en Python (FastAPI)

- **Estado**: Aceptada (implementación posterior al MVP)
- **Fecha**: 2026-10-22
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-011, ADR-015, M17 (Perecederos), M09 (Reportes), M12 (AgroBot, ingesta RAG)

## Contexto y problema

AgroConnect contempla capacidades predictivas:

- riesgo de pérdida de lotes perecederos (M17),
- precio sugerido por producto y temporada,
- demanda por región (M09).

Requieren análisis numérico y modelos de aprendizaje automático (pandas, scikit-learn, statsmodels), con un ecosistema muy superior en Python. Por la política de ADR-011 se acepta un runtime adicional: cumple los cuatro criterios.

## Decisión

Se crea `services/agro-intelligence` con este stack:

- Python 3.13, FastAPI, Pydantic v2, pandas y scikit-learn.
- Herramientas: `uv` (dependencias), `ruff` (lint y formato), `mypy` (tipos) y `pytest`.

1. **Contrato:** OpenAPI generado por FastAPI. Los modelos de entrada y salida se generan desde `packages/contracts` con `datamodel-code-generator` (ADR-015).
2. **Comunicación asíncrona:**
   1. El núcleo encola un job en pg-boss.
   2. Un worker del núcleo invoca el satélite por HTTP, con timeout, reintentos con backoff y circuit breaker.
   3. El resultado se persiste en el núcleo.

   Nunca hay llamadas síncronas en el camino crítico de una venta.
3. **Degradación elegante:** si el satélite no responde (por ejemplo, suspendido en el plan free), la funcionalidad sigue sin la predicción.
4. **Seguridad:**
   - Autenticación servicio a servicio con JWT de servicio y audiencia propia.
   - El satélite no accede a tablas de negocio, solo a un schema `analytics` de lectura (vistas).
   - Sin datos personales en los conjuntos de entrenamiento (Ley 1581 de 2012).
5. **Despliegue:** segundo servicio web en Render free, con su propio pipeline de CI con filtro por ruta.

## Alternativas consideradas

- **ML en TypeScript** (TensorFlow.js, ml.js): ecosistema inmaduro para análisis tabular y series de tiempo. Rechazada.
- **Notebooks manuales:** sin integración ni reproducibilidad. Rechazada.
- **Servicios gestionados de ML:** costo y dependencia innecesarios para el alcance formativo. Rechazada.

## Consecuencias

- **Positivas**: la herramienta adecuada para analítica y evidencia de integración de sistemas heterogéneos.
- **Negativas**: un segundo runtime (CI, despliegue, monitoreo) y un cold start adicional.
- **Mitigaciones**: comunicación asíncrona, degradación y contratos generados.
- **Implementación**: iteración I+6 de la hoja de ruta.
