# Backlog Priorizado — Módulo de Usuarios (Caso E-commerce)

## Datos Generales

| Campo | Valor |
|-------|-------|
| **Proyecto** | Caso Simulado — Plataforma de Comercio Electrónico |
| **Módulo** | Gestión de Usuarios |
| **Total HU** | 8 |
| **Versión** | 1.0 |
| **Fecha** | 2026-07-03 |

---

## Prioridades

| Prioridad | Definición |
|-----------|------------|
| **P1 — Crítica** | Funcionalidad imprescindible para el MVP. Sin ella la plataforma no es usable. Debe implementarse en el primer sprint. |
| **P2 — Importante** | Funcionalidad necesaria pero no bloqueante. Mejora la experiencia del usuario y completa el módulo. Segundo sprint. |
| **P3 — Mejora** | Funcionalidad valorada pero no crítica. Puede diferirse a versiones posteriores sin afectar la operación. |

---

## Backlog Priorizado

### Sprint 1 — Prioridad P1 (Crítica)

| # | ID | Nombre | RF | Prioridad | Esfuerzo Est. | Valor Negocio | Dependencias |
|:-:|:--:|--------|:--:|:---------:|:-------------:|:-------------:|:------------:|
| 1 | HU-01 | Registro de cuenta | RF-01 | P1 | 5 SP | Alto | — |
| 2 | HU-02 | Inicio de sesión | RF-02 | P1 | 5 SP | Alto | HU-01 |
| 3 | HU-04 | Consultar lista de pedidos | RF-05 | P1 | 3 SP | Alto | HU-02 |
| 4 | HU-08 | Cierre de sesión | RF-03 | P1 | 2 SP | Alto | HU-02 |

**Justificación P1**: Sin registro (HU-01) e inicio de sesión (HU-02) la plataforma no puede operar. Sin lista de pedidos (HU-04) el usuario no puede ver sus compras, funcionalidad principal del e-commerce. Sin cierre de sesión (HU-08) hay un riesgo de seguridad crítico.

**Total estimado Sprint 1**: 15 SP

---

### Sprint 2 — Prioridad P2 (Importante)

| # | ID | Nombre | RF | Prioridad | Esfuerzo Est. | Valor Negocio | Dependencias |
|:-:|:--:|--------|:--:|:---------:|:-------------:|:-------------:|:------------:|
| 5 | HU-05 | Consultar detalle de pedido | RF-06 | P2 | 3 SP | Medio | HU-04 |
| 6 | HU-03 | Recuperación de contraseña | RF-04 | P2 | 5 SP | Medio | HU-01 |
| 7 | HU-07 | Actualizar perfil | RF-08 | P2 | 3 SP | Medio | HU-02 |

**Justificación P2**: El detalle de pedido (HU-05) complementa la lista pero no es bloqueante para el MVP. La recuperación de contraseña (HU-03) es importante para reducir llamadas a soporte pero puede gestionarse manualmente en las primeras semanas. La actualización de perfil (HU-07) mejora la autonomía del usuario.

**Total estimado Sprint 2**: 11 SP

---

### Sprint 3 / Post-MVP — Prioridad P3 (Mejora)

| # | ID | Nombre | RF | Prioridad | Esfuerzo Est. | Valor Negocio | Dependencias |
|:-:|:--:|--------|:--:|:---------:|:-------------:|:-------------:|:------------:|
| 8 | HU-06 | Cancelar pedido | RF-07 | P3 | 3 SP | Medio | HU-05 |

**Justificación P3**: La cancelación de pedidos (HU-06) es una función valiosa pero puede implementarse después del lanzamiento inicial. Se recomienda ascender a P2 si el volumen de solicitudes de cancelación a soporte es alto desde el inicio.

**Total estimado Sprint 3**: 3 SP

---

## Resumen por Prioridad

| Prioridad | Cantidad HU | Story Points |
|:---------:|:-----------:|:------------:|
| P1 | 4 | 15 |
| P2 | 3 | 11 |
| P3 | 1 | 3 |
| **Total** | **8** | **29** |

---

## Gráfico de Priorización

```
Prioridad
    ▲
  P1 │ ██ HU-01 (5SP)  ██ HU-02 (5SP)  ██ HU-04 (3SP)  ██ HU-08 (2SP)
  P2 │ ██ HU-03 (5SP)  ██ HU-05 (3SP)  ██ HU-07 (3SP)
  P3 │ ██ HU-06 (3SP)
    └─────────────────────────────────────────────────────────────► Tiempo
       Sprint 1              Sprint 2              Sprint 3
```

## Recomendaciones para el PO

1. **HU-06 a P2**: Si el negocio proyecta más de 50 pedidos/mes en el primer trimestre, subir HU-06 a P2.
2. **HU-03 primera semana**: Implementar recuperación de contraseña en el Sprint 1 si no hay personal de soporte dedicado.
3. **Monitorear deuda técnica**: Las HU P1 deben implementarse con tests y logging desde el inicio para evitar refactors costosos al agregar P2/P3.
