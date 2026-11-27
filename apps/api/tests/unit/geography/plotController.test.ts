import {
  createPlotSchema,
  nearbyPlotsQuerySchema,
  updatePlotSchema,
} from '@agroconnect/contracts';
import { PlotController } from '../../../src/modules/geography/presentation/controllers/PlotController';
import type { CreatePlotUseCase } from '../../../src/modules/geography/application/use-cases/CreatePlotUseCase';
import type { DeletePlotUseCase } from '../../../src/modules/geography/application/use-cases/DeletePlotUseCase';
import type { FindNearbyPlotsUseCase } from '../../../src/modules/geography/application/use-cases/FindNearbyPlotsUseCase';
import type { GetPlotUseCase } from '../../../src/modules/geography/application/use-cases/GetPlotUseCase';
import type { ListMyPlotsUseCase } from '../../../src/modules/geography/application/use-cases/ListMyPlotsUseCase';
import type { UpdatePlotUseCase } from '../../../src/modules/geography/application/use-cases/UpdatePlotUseCase';
import { ZodValidationPipe } from '../../../src/shared/http/zod-validation.pipe';
import { DomainError } from '../../../src/shared/errors/errors';
import type { AuthenticatedRequest } from '../../../src/shared/http/authenticated-user';
import { Plot } from '../../../src/modules/geography/domain/entities/Plot';
import { createPlotBoundary } from '../../../src/modules/geography/domain/value-objects/PlotGeometry';

/**
 * Réplica del pipeline de NestJS para un parámetro `@Query` o `@Body` con
 * pipe: el valor crudo de Express (strings) pasa primero por
 * `ZodValidationPipe` y el resultado parseado llega al handler.
 */
function buildController() {
  const nearbyExecute = jest.fn();
  const createExecute = jest.fn();
  const listExecute = jest.fn();
  const getExecute = jest.fn();
  const updateExecute = jest.fn();
  const deleteExecute = jest.fn();

  const controller = new PlotController(
    { execute: createExecute } as unknown as CreatePlotUseCase,
    { execute: listExecute } as unknown as ListMyPlotsUseCase,
    { execute: getExecute } as unknown as GetPlotUseCase,
    { execute: updateExecute } as unknown as UpdatePlotUseCase,
    { execute: deleteExecute } as unknown as DeletePlotUseCase,
    { execute: nearbyExecute } as unknown as FindNearbyPlotsUseCase,
  );

  const request = {
    user: {
      id: 'farmer-1',
      fullName: 'Agricultor de Pruebas',
      email: 'farmer@example.com',
      role: 'productor',
    },
  } as AuthenticatedRequest;

  const nearbyPipe = new ZodValidationPipe(
    nearbyPlotsQuerySchema,
    'Parámetros de búsqueda inválidos',
  );
  const createPipe = new ZodValidationPipe(createPlotSchema, 'Datos de la parcela inválidos');
  const updatePipe = new ZodValidationPipe(
    updatePlotSchema,
    'Datos de actualización inválidos',
  );

  return {
    controller,
    request,
    nearbyExecute,
    createExecute,
    listExecute,
    getExecute,
    updateExecute,
    deleteExecute,
    nearbyPipe,
    createPipe,
    updatePipe,
  };
}

const buildPlot = (overrides: Partial<ConstructorParameters<typeof Plot>[0]> = {}) =>
  new Plot({
    id: 'plot-1',
    name: 'Lote La Esperanza',
    areaHectares: 3.5,
    municipality: 'Salento',
    department: 'Quindío',
    farmerId: 'farmer-1',
    boundary: createPlotBoundary([
      [
        [-75.7, 4.5],
        [-75.6, 4.5],
        [-75.6, 4.6],
      ],
    ]),
    centroid: { lat: 4.5333, lng: -75.6333 },
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-02T00:00:00.000Z'),
    ...overrides,
  });

describe('PlotController.findNearby', () => {
  it('parsea la query y responde el sobre estándar con las parcelas', async () => {
    const { controller, nearbyExecute, nearbyPipe } = buildController();
    const plots = [buildPlot()];
    nearbyExecute.mockResolvedValue(plots);

    const result = await controller.findNearby(
      nearbyPipe.transform({ lat: '4.5339', lng: '-75.6811', radius: '5' }),
    );

    expect(nearbyExecute).toHaveBeenCalledWith(4.5339, -75.6811, 5);
    // La respuesta de nearby es la proyección PÚBLICA: sin `farmerId`,
    // `boundary` ni `centroid`, pero con la distancia calculada por PostGIS.
    expect(result).toEqual({
      success: true,
      data: [
        {
          id: 'plot-1',
          name: 'Lote La Esperanza',
          areaHectares: 3.5,
          municipality: 'Salento',
          department: 'Quindío',
          createdAt: '2026-09-01T00:00:00.000Z',
          distanceKm: 0,
        },
      ],
      message: 'Búsqueda de parcelas cercanas realizada',
    });
  });

  it('usa un radio por defecto de 10 km cuando no se envía', async () => {
    const { controller, nearbyExecute, nearbyPipe } = buildController();
    nearbyExecute.mockResolvedValue([]);

    await controller.findNearby(nearbyPipe.transform({ lat: '4.5339', lng: '-75.6811' }));

    expect(nearbyExecute).toHaveBeenCalledWith(4.5339, -75.6811, 10);
  });

  it('rechaza con 422 una latitud fuera de rango (barrera del contrato)', async () => {
    const { controller, nearbyExecute, nearbyPipe } = buildController();

    await expect(
      Promise.resolve().then(() =>
        controller.findNearby(nearbyPipe.transform({ lat: '999', lng: '-75.6' })),
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      details: ['lat: La latitud debe estar entre -90 y 90 grados'],
    });
    expect(nearbyExecute).not.toHaveBeenCalled();
  });

  it('rechaza con 422 un radio inválido', async () => {
    const { controller, nearbyExecute, nearbyPipe } = buildController();

    await expect(
      Promise.resolve().then(() =>
        controller.findNearby(nearbyPipe.transform({ lat: '4.5', lng: '-75.6', radius: '0' })),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    await expect(
      Promise.resolve().then(() =>
        controller.findNearby(nearbyPipe.transform({ lat: '4.5', lng: '-75.6', radius: '101' })),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    expect(nearbyExecute).not.toHaveBeenCalled();
  });

  it('rechaza con 422 parámetros no numéricos o ausentes', async () => {
    const { controller, nearbyExecute, nearbyPipe } = buildController();

    await expect(
      Promise.resolve().then(() =>
        controller.findNearby(nearbyPipe.transform({ lat: 'x', lng: 'y' })),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    await expect(
      Promise.resolve().then(() => controller.findNearby(nearbyPipe.transform({ lng: '-75.6' }))),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    expect(nearbyExecute).not.toHaveBeenCalled();
  });
});

describe('PlotController.create', () => {
  it('toma el farmerId de la sesión y responde 201 con el sobre estándar', async () => {
    const { controller, request, createExecute, createPipe } = buildController();
    const plot = buildPlot();
    createExecute.mockResolvedValue(plot);

    const body = createPipe.transform({
      name: 'Lote La Esperanza',
      municipality: 'Salento',
      department: 'Quindío',
      boundary: [
        [
          [-75.7, 4.5],
          [-75.6, 4.5],
          [-75.6, 4.6],
        ],
      ],
    });

    const result = await controller.create(request, body);

    expect(createExecute).toHaveBeenCalledWith({ id: 'farmer-1', role: 'productor' }, {
      name: 'Lote La Esperanza',
      municipality: 'Salento',
      department: 'Quindío',
      boundary: body.boundary,
    });
    expect(result).toMatchObject({
      success: true,
      message: 'Parcela registrada correctamente',
      data: {
        id: 'plot-1',
        name: 'Lote La Esperanza',
        farmerId: 'farmer-1',
        areaHectares: 3.5,
        centroid: { lat: 4.5333, lng: -75.6333 },
      },
    });
  });

  it('propaga el rol del actor al caso de uso y rechaza a un comprador (403)', async () => {
    const { controller, request, createExecute, createPipe } = buildController();
    request.user = { ...request.user!, role: 'comprador_b2b' };
    createExecute.mockRejectedValue(
      new DomainError(
        'FORBIDDEN',
        'Solo un productor o un administrador puede gestionar parcelas',
        403,
      ),
    );

    const body = createPipe.transform({
      name: 'Lote La Esperanza',
      municipality: 'Salento',
      department: 'Quindío',
      boundary: [
        [
          [-75.7, 4.5],
          [-75.6, 4.5],
          [-75.6, 4.6],
        ],
      ],
    });

    await expect(controller.create(request, body)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
    expect(createExecute).toHaveBeenCalledWith(
      { id: 'farmer-1', role: 'comprador_b2b' },
      expect.anything(),
    );
  });

  it('rechaza con 422 un polígono con menos de tres vértices', async () => {
    const { controller, request, createExecute, createPipe } = buildController();

    await expect(
      Promise.resolve().then(() =>
        controller.create(
          request,
          createPipe.transform({
            name: 'Lote',
            municipality: 'Salento',
            department: 'Quindío',
            boundary: [
              [
                [-75.7, 4.5],
                [-75.6, 4.5],
              ],
            ],
          }),
        ),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    expect(createExecute).not.toHaveBeenCalled();
  });

  it('rechaza con 422 un vértice fuera del territorio colombiano', async () => {
    const { controller, request, createExecute, createPipe } = buildController();

    await expect(
      Promise.resolve().then(() =>
        controller.create(
          request,
          createPipe.transform({
            name: 'Lote',
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
        ),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    expect(createExecute).not.toHaveBeenCalled();
  });
});

describe('PlotController.findAll', () => {
  it('lista únicamente las parcelas del agricultor autenticado', async () => {
    const { controller, request, listExecute } = buildController();
    const plot = buildPlot();
    listExecute.mockResolvedValue([plot]);

    const result = await controller.findAll(request, { limit: 20, offset: 0 });

    expect(listExecute).toHaveBeenCalledWith(
      { id: 'farmer-1', role: 'productor' },
      { limit: 20, offset: 0 },
    );
    expect(result).toMatchObject({
      success: true,
      message: 'Parcelas del agricultor obtenidas',
      data: [{ id: 'plot-1', farmerId: 'farmer-1' }],
    });
  });
});

describe('PlotController.findOne', () => {
  it('devuelve la parcela solicitada con el sobre estándar', async () => {
    const { controller, request, getExecute } = buildController();
    getExecute.mockResolvedValue(buildPlot());

    const result = await controller.findOne(request, 'plot-1');

    expect(getExecute).toHaveBeenCalledWith('farmer-1', 'plot-1');
    expect(result).toMatchObject({
      success: true,
      message: 'Parcela obtenida correctamente',
      data: { id: 'plot-1' },
    });
  });
});

describe('PlotController.update', () => {
  it('propaga la actualización parcial al caso de uso', async () => {
    const { controller, request, updateExecute, updatePipe } = buildController();
    updateExecute.mockResolvedValue(buildPlot({ name: 'Lote Renombrado' }));

    const body = updatePipe.transform({ name: 'Lote Renombrado' });
    const result = await controller.update(request, 'plot-1', body);

    expect(updateExecute).toHaveBeenCalledWith({ id: 'farmer-1', role: 'productor' }, 'plot-1', {
      name: 'Lote Renombrado',
      municipality: undefined,
      department: undefined,
      boundary: undefined,
    });
    expect(result).toMatchObject({
      success: true,
      message: 'Parcela actualizada correctamente',
      data: { name: 'Lote Renombrado' },
    });
  });

  it('rechaza con 422 un cuerpo vacío (barrera del contrato)', async () => {
    const { controller, request, updateExecute, updatePipe } = buildController();

    await expect(
      Promise.resolve().then(() => controller.update(request, 'plot-1', updatePipe.transform({}))),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    expect(updateExecute).not.toHaveBeenCalled();
  });
});

describe('PlotController.remove', () => {
  it('elimina la parcela y no devuelve cuerpo', async () => {
    const { controller, request, deleteExecute } = buildController();
    deleteExecute.mockResolvedValue(undefined);

    const result = await controller.remove(request, 'plot-1');

    expect(deleteExecute).toHaveBeenCalledWith({ id: 'farmer-1', role: 'productor' }, 'plot-1');
    expect(result).toBeUndefined();
  });
});
