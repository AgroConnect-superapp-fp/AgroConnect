# Propuesta de normalización MoSCoW — Backlog de HU (H10)

**Fecha:** 3 de octubre de 2026
**Estado:** ✅ **EJECUTADA el 3 de octubre de 2026** — aprobada por el Product Owner. 48 HU actualizadas; conteo final verificado contra Notion: **35 Must Have · 8 Should Have · 21 Could Have · 5 Won't Have**. Log de auditoría: `docs/notion_hu_priority_updates.md`.
**Fuente:** base "Product Backlog — Desarrollo" (69 HU) en Notion

---

## 1. Problema

La propiedad `Tipo` de las 69 HU mezcla **seis taxonomías** para lo que debería ser una sola escala MoSCoW:

| Valor actual | HU | ¿Conforme MoSCoW? |
|---|---|---|
| `Esencial` | 24 | Parcial (falta la etiqueta) |
| `Esencial (Must Have)` | 11 | Sí |
| `Importante (Should Have)` | 8 | Sí |
| `Deseable (Could Have)` | 2 | Sí |
| `Ideal` | 19 | No (valor inventado) |
| `Opcional` | 5 | No (valor inventado) |

El resultado es un backlog con 6 categorías donde el estándar exige 4, lo que impide priorizar de forma consistente en Jira y en la planeación de sprints.

## 2. Mapeo propuesto (MoSCoW estándar)

| Valor actual | → | Valor normalizado | Justificación |
|---|---|---|---|
| `Esencial` | → | `Esencial (Must Have)` | Misma intención; unifica etiqueta |
| `Esencial (Must Have)` | → | `Esencial (Must Have)` | Sin cambio |
| `Importante (Should Have)` | → | `Importante (Should Have)` | Sin cambio |
| `Deseable (Could Have)` | → | `Deseable (Could Have)` | Sin cambio |
| `Ideal` | → | `Deseable (Could Have)` | Valor deseable no crítico; no bloquea el MVP |
| `Opcional` | → | `Opcional (Won't Have por ahora)` | Refleja intención de no abordarlo en el alcance vigente |

**Resultado:** Must Have 35 · Should Have 8 · Could Have 21 · Won't Have 5.

> El mapeo de `Ideal` y `Opcional` **cambia la priorización relativa de 24 HU** y por eso requiere aprobación explícita del Product Owner (Juan David Ferrer Castillo) antes de aplicarse. Es una decisión de negocio, no técnica.

## 3. Implementación (una vez aprobada)

El proyecto ya tiene el patrón probado en `scripts/update_notion_modules.py` (actualización masiva de propiedades por API). El script de normalización:

1. Consulta la base de HU (`data_source_id: cfdbdc33-f294-8320-b169-07486fb60bf9`).
2. Mapea cada valor de `Tipo` según la tabla de la sección 2.
3. Actualiza con `PATCH /v1/pages/{id}` (secuencial, con pausas para evitar rate limit).
4. Escribe un log de auditoría (`docs/notion_hu_priority_updates.md`).

Pseudo-flujo del script:

```python
MAPEO = {
    "Esencial": "Esencial (Must Have)",
    "Esencial (Must Have)": "Esencial (Must Have)",
    "Importante (Should Have)": "Importante (Should Have)",
    "Deseable (Could Have)": "Deseable (Could Have)",
    "Ideal": "Deseable (Could Have)",
    "Opcional": "Opcional (Won't Have por ahora)",
}
# 1) leer todas las HU de la base
# 2) por cada una: PATCH properties.Tipo.select.name = MAPEO[valor_actual]
# 3) registrar en el log: HUxx: viejo -> nuevo
```

## 4. Impacto en Jira

- Los issues `Story` de Jira deben usar el mismo conjunto de 4 valores (labels o campo prioridad) para que la sincronización Notion↔Jira sea consistente.
- El workflow de Jira necesita permitir estados `Backlog`/`Por hacer` en issues HU (pendiente ya anotado en la Matriz v4.0, sección "Próximos Pasos").

## 5. Aprobaciones

- [x] Product Owner — mapeo de `Ideal` y `Opcional` (sección 2)
- [x] Scrum Master — ventana de ejecución del script y comunicación al equipo
- [x] Verificación posterior: conteo 35/8/21/5 y log de auditoría

**Ejecución:** `python3 scripts/normalize_moscow.py` (3 de octubre de 2026) — 48 cambios aplicados con pausa anti-rate-limit y log de auditoría por HU.
