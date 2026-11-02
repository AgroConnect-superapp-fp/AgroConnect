import { InMemoryPlotRepository } from '../../fakes/InMemoryPlotRepository';
import { Plot } from '../../../src/modules/geography/domain/entities/Plot';
import { FindNearbyPlotsUseCase } from '../../../src/modules/geography/application/use-cases/FindNearbyPlotsUseCase';

describe('FindNearbyPlotsUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryPlotRepository();
    return { repository, useCase: new FindNearbyPlotsUseCase(repository) };
  };

  it('delega la búsqueda en el repositorio con los parámetros recibidos', async () => {
    const sut = buildSut();
    const plot = new Plot('plot-1', 'Lote La Esperanza', 3.5, 'Salento', 'Quindío', 'farmer-1');
    sut.repository.seedPlot(plot);

    const result = await sut.useCase.execute(4.5339, -75.6811, 5);

    expect(sut.repository.lastQuery).toEqual({ lat: 4.5339, lng: -75.6811, radiusKm: 5 });
    expect(result).toEqual([plot]);
  });

  it('rechaza latitudes fuera de rango con VALIDATION_ERROR y 400', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(90.01, -75.6, 10)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    await expect(sut.useCase.execute(-90.01, -75.6, 10)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    expect(sut.repository.lastQuery).toBeNull();
  });

  it('rechaza longitudes fuera de rango con VALIDATION_ERROR y 400', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(4.5, -180.01, 10)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    await expect(sut.useCase.execute(4.5, 180.01, 10)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  });

  it('rechaza radios fuera de rango con VALIDATION_ERROR y 400', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(4.5, -75.6, 0)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      message: 'El radio de búsqueda debe estar entre 1 y 100 km',
    });
    await expect(sut.useCase.execute(4.5, -75.6, 100.01)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    await expect(sut.useCase.execute(4.5, -75.6, -5)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  });

  it('acepta los límites exactos del rango válido', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(90, -180, 1)).resolves.toEqual([]);
    await expect(sut.useCase.execute(-90, 180, 100)).resolves.toEqual([]);
  });
});
