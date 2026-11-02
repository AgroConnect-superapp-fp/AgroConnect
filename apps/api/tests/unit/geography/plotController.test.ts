import { nearbyPlotsQuerySchema } from '@agroconnect/contracts';
import { PlotController } from '../../../src/modules/geography/presentation/controllers/PlotController';
import type { FindNearbyPlotsUseCase } from '../../../src/modules/geography/application/use-cases/FindNearbyPlotsUseCase';
import { ZodValidationPipe } from '../../../src/shared/http/zod-validation.pipe';

/**
 * Réplica del pipeline de NestJS para un parámetro `@Query` con pipe: el valor
 * crudo de Express (strings) pasa primero por `ZodValidationPipe` y el
 * resultado parseado llega al handler.
 */
function buildController() {
  const execute = jest.fn();
  const useCase = { execute } as unknown as FindNearbyPlotsUseCase;
  const pipe = new ZodValidationPipe(nearbyPlotsQuerySchema, 'Parámetros de búsqueda inválidos');

  const call = async (query: unknown) => {
    const parsed = pipe.transform(query);
    return new PlotController(useCase).findNearby(parsed);
  };

  return { execute, call };
}

describe('PlotController.findNearby', () => {
  it('parsea la query y responde el sobre estándar con las parcelas', async () => {
    const { execute, call } = buildController();
    const plots = [{ id: 'plot-1' }];
    execute.mockResolvedValue(plots);

    const result = await call({ lat: '4.5339', lng: '-75.6811', radius: '5' });

    expect(execute).toHaveBeenCalledWith(4.5339, -75.6811, 5);
    expect(result).toEqual({
      success: true,
      data: plots,
      message: 'Búsqueda de parcelas cercanas realizada',
    });
  });

  it('usa un radio por defecto de 10 km cuando no se envía', async () => {
    const { execute, call } = buildController();
    execute.mockResolvedValue([]);

    await call({ lat: '4.5339', lng: '-75.6811' });

    expect(execute).toHaveBeenCalledWith(4.5339, -75.6811, 10);
  });

  it('rechaza con 422 una latitud fuera de rango (barrera del contrato)', async () => {
    const { execute, call } = buildController();

    await expect(call({ lat: '999', lng: '-75.6' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      details: ['lat: La latitud debe estar entre -90 y 90 grados'],
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('rechaza con 422 un radio inválido', async () => {
    const { execute, call } = buildController();

    await expect(call({ lat: '4.5', lng: '-75.6', radius: '0' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(call({ lat: '4.5', lng: '-75.6', radius: '101' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('rechaza con 422 parámetros no numéricos o ausentes', async () => {
    const { execute, call } = buildController();

    await expect(call({ lat: 'x', lng: 'y' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(call({ lng: '-75.6' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    expect(execute).not.toHaveBeenCalled();
  });
});
