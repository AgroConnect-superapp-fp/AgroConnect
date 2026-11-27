import { InMemoryProductRepository } from '../../fakes/InMemoryProductRepository';
import { Product } from '../../../src/modules/marketplace/domain/entities/Product';
import { ModerateProductUseCase } from '../../../src/modules/marketplace/application/use-cases/ModerateProductUseCase';
import { ListPendingProductsUseCase } from '../../../src/modules/marketplace/application/use-cases/ListPendingProductsUseCase';

function buildProduct(): Product {
  return new Product({
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Café pendiente',
    owner: 'Productor',
    department: 'Quindío',
    municipality: 'Salento',
    crop: 'coffee',
    area: 5,
    productivity: 80,
    lat: 4.5,
    lng: -75.6,
    producerId: 'producer-1',
    images: [],
    coordinates: [],
    moderationStatus: 'pending',
  });
}

describe('ModerateProductUseCase', () => {
  it('aprueba un producto como administrador', async () => {
    const repository = new InMemoryProductRepository();
    repository.seedProduct(buildProduct());
    const useCase = new ModerateProductUseCase(repository);

    const product = await useCase.execute(
      { id: 'admin-1', role: 'administrador' },
      '00000000-0000-4000-8000-000000000010',
      'approved',
    );

    expect(product.moderationStatus).toBe('approved');
  });

  it('rechaza a un productor y a un producto inexistente', async () => {
    const repository = new InMemoryProductRepository();
    repository.seedProduct(buildProduct());
    const useCase = new ModerateProductUseCase(repository);

    await expect(
      useCase.execute(
        { id: 'producer-1', role: 'productor' },
        '00000000-0000-4000-8000-000000000010',
        'approved',
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });

    await expect(
      useCase.execute(
        { id: 'admin-1', role: 'administrador' },
        '00000000-0000-4000-8000-000000000099',
        'approved',
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });
});

describe('ListPendingProductsUseCase', () => {
  it('lista pendientes para administrador y rechaza otros roles', async () => {
    const repository = new InMemoryProductRepository();
    repository.seedProduct(buildProduct());
    repository.seedProduct(
      new Product({ ...buildProduct().props, id: 'approved-id', moderationStatus: 'approved' }),
    );
    const useCase = new ListPendingProductsUseCase(repository);

    const pending = await useCase.execute({ id: 'admin-1', role: 'administrador' });
    expect(pending).toHaveLength(1);
    expect(pending[0]?.moderationStatus).toBe('pending');

    await expect(useCase.execute({ id: 'producer-1', role: 'productor' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  });
});
