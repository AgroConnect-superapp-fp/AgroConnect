import { InMemoryPlotRepository } from '../../fakes/InMemoryPlotRepository';
import { UpdatePlotUseCase } from '../../../src/modules/geography/application/use-cases/UpdatePlotUseCase';
import { Plot } from '../../../src/modules/geography/domain/entities/Plot';
import type { PlotRing } from '../../../src/modules/geography/domain/value-objects/PlotGeometry';

describe('UpdatePlotUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryPlotRepository();
    return { repository, useCase: new UpdatePlotUseCase(repository) };
  };

  const buildPlot = (id: string, farmerId: string) =>
    new Plot({
      id,
      name: 'Lote La Esperanza',
      areaHectares: 1,
      municipality: 'Salento',
      department: 'Quindío',
      farmerId,
      boundary: null,
      centroid: null,
    });

  const validBoundary: PlotRing[] = [
    [
      [-75.7, 4.5],
      [-75.6, 4.5],
      [-75.6, 4.6],
    ],
  ];

  const actor = { id: 'farmer-1', role: 'productor' };
  const anonymousActor = { id: '', role: 'productor' };

  // El dominio cierra el anillo (RFC 7946) antes de persistirlo.
  const closedBoundary: PlotRing[] = [
    [
      [-75.7, 4.5],
      [-75.6, 4.5],
      [-75.6, 4.6],
      [-75.7, 4.5],
    ],
  ];

  it('actualiza solo los campos enviados', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    const result = await sut.useCase.execute(actor, 'plot-1', { name: 'Lote Renombrado' });

    expect(result.name).toBe('Lote Renombrado');
    expect(result.municipality).toBe('Salento');
    expect(result.department).toBe('Quindío');
  });

  it('reemplaza la geometría cuando llega un nuevo polígono', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    const result = await sut.useCase.execute(actor, 'plot-1', {
      boundary: validBoundary,
    });

    expect(result.boundary).toEqual({ type: 'Polygon', coordinates: closedBoundary });
  });

  it('rechaza una actualización sin ningún campo', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    await expect(sut.useCase.execute(actor, 'plot-1', {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });

  it('rechaza un nombre de menos de 3 caracteres', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    await expect(
      sut.useCase.execute(actor, 'plot-1', { name: 'Lo' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza un polígono inválido', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    await expect(
      sut.useCase.execute(actor, 'plot-1', {
        boundary: [
          [
            [-75.7, 4.5],
            [-75.6, 4.5],
          ],
        ],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza a un actor que no es productor ni administrador (403)', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-1'));

    await expect(
      sut.useCase.execute({ id: 'comprador-1', role: 'comprador_b2b' }, 'plot-1', {
        name: 'Nuevo nombre',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('responde 404 cuando la parcela no existe', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute(actor, 'plot-inexistente', { name: 'Nuevo nombre' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  it('responde 403 cuando la parcela pertenece a otro agricultor', async () => {
    const sut = buildSut();
    sut.repository.seedPlot(buildPlot('plot-1', 'farmer-2'));

    await expect(
      sut.useCase.execute(actor, 'plot-1', { name: 'Nuevo nombre' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('exige una sesión autenticada', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute(anonymousActor, 'plot-1', { name: 'Nuevo nombre' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
  });
});
