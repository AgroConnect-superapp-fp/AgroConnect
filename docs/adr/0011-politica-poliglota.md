# ADR-011: Política políglota — núcleo homogéneo, bordes políglotas

- **Estado**: Aceptada
- **Fecha**: 2026-10-22
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-008, ADR-009, ADR-012, ADR-013, ADR-014

## Contexto y problema

Los módulos de AgroConnect tienen naturalezas distintas:

- CRUD transaccional: usuarios, catálogo, inventario, pedidos.
- Integraciones: pagos, SMS/USSD, mapas.
- Cómputo especializado: rutas óptimas, predicción de pérdidas y de precios.
- Interfaces: web, móvil.

La pregunta es si conviene usar un lenguaje o framework distinto según el módulo para ajustar cada herramienta a su necesidad.

## Decisión

Se adopta **núcleo homogéneo en TypeScript con bordes políglotas**. Un lenguaje o runtime distinto del núcleo solo se introduce si cumple **al menos dos** de estos criterios:

1. **Brecha de capacidad:** el ecosistema del núcleo no resuelve bien el problema (ML numérico, optimización combinatoria).
2. **Perfil de ejecución distinto:** CPU intensivo, batch o consumo de memoria muy distinto al de la API transaccional.
3. **Ciclo de vida independiente:** se despliega sin tocar el núcleo y su caída no rompe una venta.
4. **Sin transacción compartida:** no participa en la misma transacción ACID que pedido, inventario o pago.

### Evaluación por módulo

| Módulo / capacidad | Decisión | Motivo |
|---|---|---|
| M01, M02, M10 (inicio, usuarios, seguridad) | Núcleo TS | No cumple ningún criterio |
| M03, M04, M13, M07 (catálogo, inventario, compras, pedidos) | Núcleo TS | Transacción compartida pedido↔stock |
| M08, M15 (pagos) | Núcleo TS + adaptador de pasarela | Transacción pago↔pedido |
| M05 (mensajería en tiempo real) | Núcleo TS (Socket.IO) | El volumen no justifica Elixir ni Go |
| M16 (geo: proximidad, cobertura) | SQL / PostGIS | La base de datos es la herramienta óptima (ADR-002) |
| M06/M16 (rutas óptimas multidestino) | Motor externo por adaptador (ADR-013) | Cumple los 4 criterios; autoalojarlo es inviable en free |
| M17 (alertas de vencimiento, cadena de frío) | Núcleo TS (pg-boss) | Son tareas programadas, no cómputo |
| M17/M09 (predicción de pérdida, precio y demanda) | Python, satélite `agro-intelligence` (ADR-014) | Cumple los 4 criterios |
| M12 (AgroBot) | Núcleo TS + Claude API + pgvector | Un LLM vía API no requiere Python; crea tickets en el núcleo |
| M09 (reportes) | SQL (vistas materializadas) + exportación desde el núcleo | — |
| M14 (web/PWA) | React + Vite (ADR-004) | — |
| M14 (app móvil) | Expo / React Native en TS (ADR-012) | Evita un tercer lenguaje (Dart) |
| M14 (SMS/USSD) | Núcleo TS + adaptador de proveedor | Es integración, no cómputo |

**Lenguajes resultantes:**

- **TypeScript:** API, web, móvil y contratos.
- **SQL/PLpgSQL:** geoespacial, reportes, RLS.
- **Python:** solo el satélite de ML.
- **YAML:** CI/CD e IaC.

**Lenguajes descartados para el núcleo:**

- **Go:** no cubre ninguna brecha del dominio.
- **Java/Spring:** implica reescritura total y pesa en el plan free.
- **Elixir:** escala de chat innecesaria para AgroConnect.
- **Rust:** no hay cómputo crítico.
- **Dart/Flutter:** sustituido por Expo (ADR-012).

## Consecuencias

- **Positivas**:
  - Cada problema usa una herramienta adecuada sin multiplicar runtimes sin motivo.
  - Contratos compartidos de punta a punta.
  - El equipo se concentra en un lenguaje principal.
- **Negativas**:
  - Cada runtime extra suma CI, despliegue, monitoreo, contratos entre procesos y otro cold start en el plan free.
- **Mitigaciones**:
  - Comunicación asíncrona con degradación elegante (ADR-014).
  - Contratos generados (ADR-015).
  - Revisión de este ADR antes de introducir cualquier lenguaje nuevo.
