# Matriz de Trazabilidad — Módulo de Usuarios (Caso E-commerce)

## Datos Generales

| Campo | Valor |
|-------|-------|
| **Proyecto** | Caso Simulado — Plataforma de Comercio Electrónico |
| **Módulo** | Gestión de Usuarios |
| **Versión** | 1.0 |
| **Fecha** | 2026-07-03 |

---

## Convenciones

| Símbolo | Significado |
|---------|-------------|
| ✓ | Trazabilidad directa |
| — | Sin relación |

---

## Matriz RF ↔ CU

| RF / CU | CU-01 | CU-02 | CU-03 | CU-04 | CU-05 | CU-06 | CU-07 | CU-08 |
|---------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **RF-01** Registro de cuenta | ✓ | — | — | — | — | — | — | — |
| **RF-02** Inicio de sesión | — | ✓ | — | — | — | — | — | — |
| **RF-03** Cierre de sesión | — | — | ✓ | — | — | — | — | — |
| **RF-04** Recuperar contraseña | — | — | — | ✓ | — | — | — | — |
| **RF-05** Lista de pedidos | — | — | — | — | ✓ | — | — | — |
| **RF-06** Detalle de pedido | — | — | — | — | — | ✓ | — | — |
| **RF-07** Cancelar pedido | — | — | — | — | — | — | ✓ | — |
| **RF-08** Actualizar perfil | — | — | — | — | — | — | — | ✓ |

---

## Matriz HU ↔ RF

| HU / RF | RF-01 | RF-02 | RF-03 | RF-04 | RF-05 | RF-06 | RF-07 | RF-08 |
|---------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **HU-01** Registro de cuenta | ✓ | — | — | — | — | — | — | — |
| **HU-02** Inicio de sesión | — | ✓ | — | — | — | — | — | — |
| **HU-03** Recuperar contraseña | — | — | — | ✓ | — | — | — | — |
| **HU-04** Lista de pedidos | — | — | — | — | ✓ | — | — | — |
| **HU-05** Detalle de pedido | — | — | — | — | — | ✓ | — | — |
| **HU-06** Cancelar pedido | — | — | — | — | — | — | ✓ | — |
| **HU-07** Actualizar perfil | — | — | — | — | — | — | — | ✓ |
| **HU-08** Cerrar sesión | — | — | ✓ | — | — | — | — | — |

---

## Matriz HU ↔ CU

| HU / CU | CU-01 | CU-02 | CU-03 | CU-04 | CU-05 | CU-06 | CU-07 | CU-08 |
|---------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **HU-01** Registro de cuenta | ✓ | — | — | — | — | — | — | — |
| **HU-02** Inicio de sesión | — | ✓ | — | — | — | — | — | — |
| **HU-03** Recuperar contraseña | — | — | — | ✓ | — | — | — | — |
| **HU-04** Lista de pedidos | — | — | — | — | ✓ | — | — | — |
| **HU-05** Detalle de pedido | — | — | — | — | — | ✓ | — | — |
| **HU-06** Cancelar pedido | — | — | — | — | — | — | ✓ | — |
| **HU-07** Actualizar perfil | — | — | — | — | — | — | — | ✓ |
| **HU-08** Cerrar sesión | — | — | ✓ | — | — | — | — | — |

---

## Matriz Integral RF × CU × HU

| RF | Nombre | CU | HU |
|----|--------|:--:|:--:|
| RF-01 | Registro de cuenta | CU-01 | HU-01 |
| RF-02 | Inicio de sesión | CU-02 | HU-02 |
| RF-03 | Cierre de sesión | CU-03 | HU-08 |
| RF-04 | Recuperación de contraseña | CU-04 | HU-03 |
| RF-05 | Consulta de lista de pedidos | CU-05 | HU-04 |
| RF-06 | Consulta de detalle de pedido | CU-06 | HU-05 |
| RF-07 | Cancelación de pedido | CU-07 | HU-06 |
| RF-08 | Actualización de perfil | CU-08 | HU-07 |

---

## Estadísticas de Trazabilidad

| Elemento | Cantidad |
|----------|:--------:|
| Requisitos Funcionales (RF) | 8 |
| Casos de Uso (CU) | 8 |
| Historias de Usuario (HU) | 8 |
| Relaciones RF → CU (1 a 1) | 8 |
| Relaciones HU → RF (1 a 1) | 8 |
| Relaciones HU → CU (1 a 1) | 8 |
| Cobertura de trazabilidad | 100% |
