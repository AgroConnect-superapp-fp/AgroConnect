import {
  createPlotBoundary,
  MAX_PLOT_VERTICES,
  type PlotRing,
} from '../../../src/modules/geography/domain/value-objects/PlotGeometry';

/**
 * Captura el error lanzado por una acción síncrona.
 *
 * Evita `expect.objectContaining(...)` dentro de `toThrow`: su tipo es `any` y
 * el linter rechaza el argumento inseguro.
 */
function captureError(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  return undefined;
}

/**
 * Reglas puras de la geometría de la parcela (sin PostGIS).
 */
describe('createPlotBoundary', () => {
  const triangulo: PlotRing = [
    [-75.7, 4.5],
    [-75.6, 4.5],
    [-75.6, 4.6],
  ];

  it('cierra el anillo (RFC 7946) para que PostGIS pueda calcular el área', () => {
    const boundary = createPlotBoundary([triangulo]);

    expect(boundary.coordinates[0]).toHaveLength(4);
    expect(boundary.coordinates[0]?.[0]).toEqual(boundary.coordinates[0]?.[3]);
  });

  it('no duplica el vértice de cierre si el anillo ya viene cerrado', () => {
    const cerrado: PlotRing = [...triangulo, triangulo[0]!];

    const boundary = createPlotBoundary([cerrado]);

    expect(boundary.coordinates[0]).toHaveLength(4);
  });

  it('rechaza vértices duplicados consecutivos', () => {
    const duplicado: PlotRing = [
      [-75.7, 4.5],
      [-75.7, 4.5],
      [-75.6, 4.6],
    ];

    const error = captureError(() => createPlotBoundary([duplicado]));
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza un anillo degenerado con vértices colineales', () => {
    const colineal: PlotRing = [
      [-75.7, 4.5],
      [-75.65, 4.5],
      [-75.6, 4.5],
    ];

    const error = captureError(() => createPlotBoundary([colineal]));
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza un polígono con demasiados vértices', () => {
    const exceso: PlotRing = Array.from({ length: MAX_PLOT_VERTICES + 1 }, (_, index) => [
      -75.7 + index * 0.0001,
      4.5,
    ] as const);

    const error = captureError(() => createPlotBoundary([exceso]));
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });
});
