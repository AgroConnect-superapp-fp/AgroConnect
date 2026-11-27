import { Plot } from '../../../src/modules/geography/domain/entities/Plot';
import { createPlotBoundary } from '../../../src/modules/geography/domain/value-objects/PlotGeometry';

describe('Plot (entidad de dominio)', () => {
  const boundary = createPlotBoundary([
    [
      [-75.7, 4.5],
      [-75.6, 4.5],
      [-75.6, 4.6],
    ],
  ]);

  const buildPlot = (overrides: Partial<ConstructorParameters<typeof Plot>[0]> = {}) =>
    new Plot({
      id: 'plot-1',
      name: 'Lote La Esperanza',
      areaHectares: 3.5,
      municipality: 'Salento',
      department: 'Quindío',
      farmerId: 'farmer-1',
      boundary,
      centroid: { lat: 4.5333, lng: -75.6333 },
      ...overrides,
    });

  it('expone los datos de la parcela', () => {
    const plot = buildPlot();

    expect(plot.id).toBe('plot-1');
    expect(plot.name).toBe('Lote La Esperanza');
    expect(plot.areaHectares).toBe(3.5);
    expect(plot.municipality).toBe('Salento');
    expect(plot.department).toBe('Quindío');
    expect(plot.farmerId).toBe('farmer-1');
  });

  it('expone la geometría y el centroide calculados por PostGIS', () => {
    const plot = buildPlot();

    expect(plot.boundary).toEqual(boundary);
    expect(plot.centroid).toEqual({ lat: 4.5333, lng: -75.6333 });
    expect(plot.hasBoundary()).toBe(true);
  });

  it('identifica parcelas ubicadas en el Quindío', () => {
    expect(buildPlot().isLocatedInQuindio()).toBe(true);
  });

  it('reconoce parcelas fuera del Quindío', () => {
    const other = buildPlot({
      id: 'plot-2',
      name: 'Lote Norte',
      municipality: 'Medellín',
      department: 'Antioquia',
      farmerId: 'farmer-2',
    });

    expect(other.isLocatedInQuindio()).toBe(false);
  });

  it('acepta una fecha de creación opcional', () => {
    const createdAt = new Date('2026-09-01T00:00:00.000Z');

    expect(buildPlot({ createdAt }).createdAt).toBe(createdAt);
    expect(buildPlot().createdAt).toBeUndefined();
  });

  it('reconoce el centroide dentro de Colombia', () => {
    expect(buildPlot().isWithinColombia()).toBe(true);
  });

  it('rechaza un centroide fuera del territorio colombiano', () => {
    const outside = buildPlot({ centroid: { lat: 40.4168, lng: -3.7038 } });

    expect(outside.isWithinColombia()).toBe(false);
  });

  it('no considera válida una parcela sin geometría', () => {
    const withoutGeometry = buildPlot({ boundary: null, centroid: null });

    expect(withoutGeometry.hasBoundary()).toBe(false);
    expect(withoutGeometry.isWithinColombia()).toBe(false);
  });

  it('verifica la pertenencia de la parcela al agricultor', () => {
    const plot = buildPlot();

    expect(plot.belongsTo('farmer-1')).toBe(true);
    expect(plot.belongsTo('farmer-2')).toBe(false);
  });

  it('expone la distancia solo cuando la consulta fue de proximidad', () => {
    expect(buildPlot().distanceKm).toBeUndefined();
    expect(buildPlot({ distanceKm: 1.25 }).distanceKm).toBe(1.25);
  });
});
