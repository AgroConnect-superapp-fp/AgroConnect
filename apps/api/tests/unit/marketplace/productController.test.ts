import { productsQuerySchema, publishProductSchema } from '@agroconnect/contracts';
import { ProductController } from '../../../src/modules/marketplace/presentation/controllers/ProductController';
import type { ListProductsUseCase } from '../../../src/modules/marketplace/application/use-cases/ListProductsUseCase';
import type { PublishProductUseCase } from '../../../src/modules/marketplace/application/use-cases/PublishProductUseCase';
import type { UpdateProductImagesUseCase } from '../../../src/modules/marketplace/application/use-cases/UpdateProductImagesUseCase';
import { Product } from '../../../src/modules/marketplace/domain/entities/Product';
import { ZodValidationPipe } from '../../../src/shared/http/zod-validation.pipe';
import type { AuthenticatedRequest } from '../../../src/shared/http/authenticated-user';

/**
 * Réplica del pipeline de NestJS para `@Query` + `ZodValidationPipe`: el valor
 * crudo de Express (strings) pasa por el pipe y luego llega al handler.
 */
function buildController() {
  const execute = jest.fn();
  const publishExecute = jest.fn();
  const updateImagesExecute = jest.fn();
  const useCase = { execute } as unknown as ListProductsUseCase;
  const publishUseCase = { execute: publishExecute } as unknown as PublishProductUseCase;
  const updateImagesUseCase = {
    execute: updateImagesExecute,
  } as unknown as UpdateProductImagesUseCase;
  const pipe = new ZodValidationPipe(productsQuerySchema, 'Parámetros de búsqueda inválidos');

  const controller = new ProductController(useCase, publishUseCase, updateImagesUseCase);
  const call = async (query: unknown) => {
    const parsed = pipe.transform(query);
    return controller.findAll(parsed);
  };

  return { execute, publishExecute, updateImagesExecute, controller, call };
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

describe('ProductController.create', () => {
  const buildPublished = () =>
    new Product({
      id: 'product-2',
      name: 'Café del Quindío',
      owner: 'María Productora',
      department: 'Quindío',
      municipality: 'Salento',
      crop: 'coffee',
      area: 10,
      productivity: 90,
      certification: 'organic',
      lat: 4.5339,
      lng: -75.6811,
      producerId: 'user-1',
      images: [],
      coordinates: [],
    });

  it('publica con el usuario autenticado y responde 201 con el producto', async () => {
    const { publishExecute, controller } = buildController();
    const product = buildPublished();
    publishExecute.mockResolvedValue(product);

    const body = publishProductSchema.parse({
      name: 'Café del Quindío',
      department: 'Quindío',
      municipality: 'Salento',
      crop: 'coffee',
      area: 10,
      productivity: 90,
      certification: 'organic',
      lat: 4.5339,
      lng: -75.6811,
    });
    const request = {
      user: {
        id: 'user-1',
        fullName: 'María Productora',
        email: 'maria@example.com',
        role: 'productor',
      },
    } as AuthenticatedRequest;

    const result = await controller.create(request, body);

    expect(publishExecute).toHaveBeenCalledWith(request.user, body);
    expect(result).toEqual({
      success: true,
      data: product.props,
      message: 'Producto publicado correctamente',
    });
  });
});
