import { InMemoryPlotRepository } from '../../fakes/InMemoryPlotRepository';
import { DeletePlotUseCase } from '../../../src/modules/geography/application/use-cases/DeletePlotUseCase';
import { Plot } from '../../../src/modules/geography/domain/entities/Plot';

describe('DeletePlotUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryPlotRepository();
    return { repository, useCase: new DeletePlotUseCase(repository) };
  };

  const actor = { id: 'farmer-1', role: 'productor' };
  const anonymousActor = { id: '', role: 'productor' };

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

  it('elimina lógicamente la parcela del agricultor autenticado', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    await expect(sut.useCase.execute(actor, 'plot-1')).resolves.toBeUndefined();

    const stored = await sut.repository.findById('plot-1');
    expect(stored?.deletedAt).toBeInstanceOf(Date);
  });

  it('rechaza a un actor que no es productor ni administrador (403)', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    await expect(
      sut.useCase.execute({ id: 'comprador-1', role: 'comprador_b2b' }, 'plot-1'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });

    const stored = await sut.repository.findById('plot-1');
    expect(stored?.deletedAt).toBeNull();
  });

  it('responde 404 cuando la parcela no existe', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(actor, 'plot-inexistente')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('responde 403 cuando la parcela pertenece a otro agricultor', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-2'));

    await expect(sut.useCase.execute(actor, 'plot-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  });

  it('responde 404 cuando la parcela ya fue eliminada', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));
    await sut.useCase.execute(actor, 'plot-1');

    await expect(sut.useCase.execute(actor, 'plot-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('exige una sesión autenticada', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(anonymousActor, 'plot-1')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });
});
