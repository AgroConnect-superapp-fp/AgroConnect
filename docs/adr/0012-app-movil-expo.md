# ADR-012: App móvil con Expo / React Native (sustituye a ADR-001 Flutter)

- **Estado**: Aceptada (sustituye a ADR-001)
- **Fecha**: 2026-10-22
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-001 (Flutter, planificado), ADR-004, ADR-006 (UUID + LWW offline), ADR-011, ADR-015

## Contexto y problema

M14 pide app Android e iOS (RF-48/49) con operación offline para el productor y el transportista (RF-50 a 55). ADR-001 había elegido Flutter, pero esa elección se hizo antes de que el backend y la web quedaran en TypeScript con contratos Zod compartidos.

Con Flutter, el equipo tendría que mantener en Dart una tercera copia de:

- los modelos,
- la validación,
- el cliente API,
- la lógica de sincronización.

## Decisión

La app móvil se construye con **Expo SDK / React Native en TypeScript**:

- **Persistencia offline:** `expo-sqlite` con la estrategia UUID local + Last-Write-Wins (ADR-006).
- **Código compartido:** consume `packages/contracts` (ADR-015) y comparte el cliente API generado y la lógica de sincronización con la web.
- **Compilación y distribución:** EAS Build.
- **Plan B:** Capacitor sobre la PWA existente, si el único objetivo fuera publicar en tienda sin funciones nativas adicionales.

## Alternativas consideradas

- **Flutter (ADR-001)**:
  - Ventajas: excelente rendimiento y un UI kit sólido.
  - Desventajas: un tercer lenguaje (Dart) y modelos, validación y sincronización duplicados.
  - Decisión: sustituida.
- **Kotlin + Swift nativos**: dos codebases y dos perfiles de desarrollador. Rechazada.
- **Solo PWA**: cubre bien Android, pero iOS limita el trabajo en segundo plano y las notificaciones. Se mantiene como canal web principal, no como app de tienda.

## Consecuencias

- **Positivas**:
  - Un solo lenguaje en todo el producto.
  - Reutilización de contratos y lógica.
  - El equipo ya domina React.
- **Negativas**:
  - El rendimiento de animaciones complejas es inferior al de Flutter, aunque es irrelevante para formularios, listas y mapas.
  - Hay dependencia del ecosistema Expo.
- **Implementación**: fuera del MVP actual (iteración I+5 de la hoja de ruta). Hay que actualizar PT-AR-ARQ-01 §10 y el índice de ADRs.
