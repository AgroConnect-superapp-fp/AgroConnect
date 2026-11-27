import { InMemoryPlotRepository } from '../../fakes/InMemoryPlotRepository';
import { CreatePlotUseCase } from '../../../src/modules/geography/application/use-cases/CreatePlotUseCase';
import type { PlotRing } from '../../../src/modules/geography/domain/value-objects/PlotGeometry';

describe('CreatePlotUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryPlotRepository();
    return { repository, useCase: new CreatePlotUseCase(repository) };
  };

  const validRing: PlotRing = [
    [-75.7, 4.5],
    [-75.6, 4.5],
    [-75.6, 4.6],
  ];

  const validBoundary: PlotRing[] = [validRing];

  const actor = { id: 'farmer-1', role: 'productor' };
  const anonymousActor = { id: '', role: 'productor' };

  // El dominio cierra el anillo (RFC 7946): el polígono almacenado en PostGIS
  // debe ser válido para que `ST_Area` pueda derivar el área.
  const closedRing: PlotRing = [
    [-75.7, 4.5],
    [-75.6, 4.5],
    [-75.6, 4.6],
    [-75.7, 4.5],
  ];

  it('registra la parcela a nombre del agricultor autenticado', async () => {
    const sut = buildSut();

    const plot = await sut.useCase.execute(actor, {
      name: 'Lote La Esperanza',
      municipality: 'Salento',
      department: 'Quindío',
      boundary: validBoundary,
    });

    expect(plot.farmerId).toBe('farmer-1');
    expect(plot.name).toBe('Lote La Esperanza');
    expect(plot.municipality).toBe('Salento');
    expect(plot.department).toBe('Quindío');
    expect(plot.boundary).toEqual({ type: 'Polygon', coordinates: [closedRing] });
    expect(sut.repository.plots).toHaveLength(1);
  });

  it('normaliza los espacios del nombre, municipio y departamento', async () => {
    const sut = buildSut();

    const plot = await sut.useCase.execute(actor, {
      name: '  Lote La Esperanza  ',
      municipality: ' Salento ',
      department: ' Quindío ',
      boundary: validBoundary,
    });

    expect(plot.name).toBe('Lote La Esperanza');
    expect(plot.municipality).toBe('Salento');
    expect(plot.department).toBe('Quindío');
  });

  it('exige una sesión autenticada', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute(anonymousActor, {
        name: 'Lote La Esperanza',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: validBoundary,
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
    expect(sut.repository.plots).toHaveLength(0);
  });

  it('rechaza un nombre de menos de 3 caracteres', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute(actor, {
        name: 'Lo',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: validBoundary,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    expect(sut.repository.plots).toHaveLength(0);
  });

  it('rechaza un municipio o departamento demasiado cortos', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute(actor, {
        name: 'Lote La Esperanza',
        municipality: 'S',
        department: 'Quindío',
        boundary: validBoundary,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });

    await expect(
      sut.useCase.execute(actor, {
        name: 'Lote La Esperanza',
        municipality: 'Salento',
        department: 'Q',
        boundary: validBoundary,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza a un actor que no es productor ni administrador (403)', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute({ id: 'comprador-1', role: 'comprador_b2b' }, {
        name: 'Lote La Esperanza',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: validBoundary,
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    expect(sut.repository.plots).toHaveLength(0);
  });

  it('rechaza un polígono con menos de tres vértices', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute(actor, {
        name: 'Lote La Esperanza',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: [
          [
            [-75.7, 4.5],
            [-75.6, 4.5],
          ],
        ],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza un polígono con más de un anillo (sin huecos)', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute(actor, {
        name: 'Lote La Esperanza',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: [validRing, validRing],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza vértices fuera del territorio colombiano', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute(actor, {
        name: 'Lote La Esperanza',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: [
          [
            [-75.7, 4.5],
            [-75.6, 4.5],
            [10.4, 4.6],
          ],
        ],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });
});
