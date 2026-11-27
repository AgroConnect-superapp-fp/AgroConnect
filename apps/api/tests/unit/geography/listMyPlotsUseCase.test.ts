import { InMemoryPlotRepository } from '../../fakes/InMemoryPlotRepository';
import { ListMyPlotsUseCase } from '../../../src/modules/geography/application/use-cases/ListMyPlotsUseCase';
import { Plot } from '../../../src/modules/geography/domain/entities/Plot';

describe('ListMyPlotsUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryPlotRepository();
    return { repository, useCase: new ListMyPlotsUseCase(repository) };
  };

  const actor = { id: 'farmer-1', role: 'productor' };
  const anonymousActor = { id: '', role: 'productor' };
  const pagination = { limit: 20, offset: 0 };

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

  it('devuelve solo las parcelas del agricultor autenticado', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));
    sut.repository.seedPlot(buildPlot('plot-2', 'farmer-2'));

    const result = await sut.useCase.execute(actor, pagination);

    expect(result.map((plot) => plot.id)).toEqual(['plot-1']);
  });

  it('excluye las parcelas eliminadas lógicamente', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));
    await sut.repository.delete('plot-1', 'farmer-1');

    const result = await sut.useCase.execute(actor, pagination);

    expect(result).toEqual([]);
  });

  it('rechaza a un actor que no es productor ni administrador (403)', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    await expect(
      sut.useCase.execute({ id: 'comprador-1', role: 'comprador_b2b' }, pagination),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('aplica el límite y el desplazamiento de la paginación', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));
    sut.repository.seedPlot(buildPlot('plot-2', 'farmer-1'));
    sut.repository.seedPlot(buildPlot('plot-3', 'farmer-1'));

    const primeraPagina = await sut.useCase.execute(actor, { limit: 2, offset: 0 });
    const segundaPagina = await sut.useCase.execute(actor, { limit: 2, offset: 2 });

    expect(primeraPagina).toHaveLength(2);
    expect(segundaPagina).toHaveLength(1);
  });

  it('rechaza un límite o un desplazamiento fuera de rango', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(actor, { limit: 0, offset: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(sut.useCase.execute(actor, { limit: 101, offset: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(sut.useCase.execute(actor, { limit: 20, offset: -1 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });

  it('exige una sesión autenticada', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(anonymousActor, pagination)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });
});
