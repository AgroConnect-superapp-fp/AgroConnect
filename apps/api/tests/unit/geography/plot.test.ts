import { Plot } from '../../../src/modules/geography/domain/entities/Plot';

describe('Plot (entidad de dominio)', () => {
  const plot = new Plot('plot-1', 'Lote La Esperanza', 3.5, 'Salento', 'Quindío', 'farmer-1');

  it('expone los datos de la parcela', () => {
    expect(plot.id).toBe('plot-1');
    expect(plot.name).toBe('Lote La Esperanza');
    expect(plot.areaHectares).toBe(3.5);
    expect(plot.municipality).toBe('Salento');
    expect(plot.department).toBe('Quindío');
    expect(plot.farmerId).toBe('farmer-1');
  });

  it('identifica parcelas ubicadas en el Quindío', () => {
    expect(plot.isLocatedInQuindio()).toBe(true);
  });

  it('reconoce parcelas fuera del Quindío', () => {
    const other = new Plot('plot-2', 'Lote Norte', 1.2, 'Medellín', 'Antioquia', 'farmer-2');
    expect(other.isLocatedInQuindio()).toBe(false);
  });

  it('acepta una fecha de creación opcional', () => {
    const createdAt = new Date('2026-09-01T00:00:00.000Z');
    const withDate = new Plot('plot-3', 'Lote', 1, 'Salento', 'Quindío', 'farmer-1', createdAt);

    expect(withDate.createdAt).toBe(createdAt);
    expect(plot.createdAt).toBeUndefined();
  });
});
