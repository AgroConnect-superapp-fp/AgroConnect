import { InMemoryPlotRepository } from '../../fakes/InMemoryPlotRepository';
import { GetPlotUseCase } from '../../../src/modules/geography/application/use-cases/GetPlotUseCase';
import { Plot } from '../../../src/modules/geography/domain/entities/Plot';

describe('GetPlotUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryPlotRepository();
    return { repository, useCase: new GetPlotUseCase(repository) };
  };

  const buildPlot = (id: string, farmerId: string) =>
    new Plot({
      id,
      name: `Lote ${id}`,
      areaHectares: 1,
      municipality: 'Salento',
      department: 'Quindío',
      farmerId,
      boundary: null,
      centroid: null,
    });

  it('devuelve la parcela cuando pertenece al agricultor autenticado', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    const result = await sut.useCase.execute('farmer-1', 'plot-1');

    expect(result.id).toBe('plot-1');
  });

  it('responde 404 cuando la parcela no existe', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute('farmer-1', 'plot-inexistente')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('responde 403 cuando la parcela pertenece a otro agricultor', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-2'));

    await expect(sut.useCase.execute('farmer-1', 'plot-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  });

  it('responde 404 cuando la parcela fue eliminada lógicamente', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));
    await sut.repository.delete('plot-1', 'farmer-1');

    await expect(sut.useCase.execute('farmer-1', 'plot-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('exige una sesión autenticada', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute('', 'plot-1')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });
});
