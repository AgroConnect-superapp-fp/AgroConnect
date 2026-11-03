import { productsQuerySchema } from '@agroconnect/contracts';
import { ProductController } from '../../../src/modules/marketplace/presentation/controllers/ProductController';
import type { ListProductsUseCase } from '../../../src/modules/marketplace/application/use-cases/ListProductsUseCase';
import { Product } from '../../../src/modules/marketplace/domain/entities/Product';
import { ZodValidationPipe } from '../../../src/shared/http/zod-validation.pipe';

/**
 * Réplica del pipeline de NestJS para `@Query` + `ZodValidationPipe`: el valor
 * crudo de Express (strings) pasa por el pipe y luego llega al handler.
 */
function buildController() {
  const execute = jest.fn();
  const useCase = { execute } as unknown as ListProductsUseCase;
  const pipe = new ZodValidationPipe(productsQuerySchema, 'Parámetros de búsqueda inválidos');

  const call = async (query: unknown) => {
    const parsed = pipe.transform(query);
    return new ProductController(useCase).findAll(parsed);
  };

  return { execute, call };
}

describe('ProductController.findAll', () => {
  it('parsea la query y responde el sobre estándar', async () => {
    const { execute, call } = buildController();
    const product = new Product({
      id: 'product-1',
      name: 'Finca La Esperanza',
      owner: 'Carlos Martínez',
      department: 'Cundinamarca',
      municipality: 'La Mesa',
      crop: 'coffee',
      area: 50,
      productivity: 85,
      lat: 4.6249,
      lng: -74.0679,
      images: [],
      coordinates: [],
    });
    execute.mockResolvedValue([product]);

    const result = await call({ search: 'café', crop: 'coffee' });

    expect(execute).toHaveBeenCalledWith({
      search: 'café',
      crop: 'coffee',
      limit: 50,
      offset: 0,
    });
    expect(result).toEqual({
      success: true,
      data: [product.props],
      message: 'Productos del marketplace obtenidos',
    });
  });

  it('usa paginación por defecto y coacciona los strings numéricos', async () => {
    const { execute, call } = buildController();
    execute.mockResolvedValue([]);

    await call({ limit: '10', offset: '20' });

    expect(execute).toHaveBeenCalledWith({ limit: 10, offset: 20 });
  });

  it('rechaza con 422 un cultivo desconocido', async () => {
    const { execute, call } = buildController();

    await expect(call({ crop: 'tomate' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('rechaza con 422 límites y offsets inválidos', async () => {
    const { execute, call } = buildController();

    await expect(call({ limit: '0' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(call({ limit: '101' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(call({ offset: '-1' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    expect(execute).not.toHaveBeenCalled();
  });
});
