import { InMemoryProductRepository } from '../../fakes/InMemoryProductRepository';
import { Product } from '../../../src/modules/marketplace/domain/entities/Product';
import { UpdateProductImagesUseCase } from '../../../src/modules/marketplace/application/use-cases/UpdateProductImagesUseCase';

function buildProduct(producerId = 'producer-1'): Product {
  return new Product({
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Café de prueba',
    owner: 'Productor',
    department: 'Quindío',
    municipality: 'Salento',
    crop: 'coffee',
    area: 10,
    productivity: 80,
    lat: 4.5,
    lng: -75.6,
    producerId,
    images: [],
    coordinates: [],
  });
}

describe('UpdateProductImagesUseCase', () => {
  it('permite al propietario reemplazar las imágenes', async () => {
    const repository = new InMemoryProductRepository();
    repository.seedProduct(buildProduct());
    const useCase = new UpdateProductImagesUseCase(repository);

    const updated = await useCase.execute(
      { id: 'producer-1', role: 'productor' },
      '00000000-0000-4000-8000-000000000001',
      [{ publicId: 'agroconnect/products/user/cosecha', alt: 'Cosecha' }],
    );

    expect(updated.props.images).toEqual([
      { publicId: 'agroconnect/products/user/cosecha', alt: 'Cosecha' },
    ]);
  });

  it('rechaza a un productor que no es propietario', async () => {
    const repository = new InMemoryProductRepository();
    repository.seedProduct(buildProduct());
    const useCase = new UpdateProductImagesUseCase(repository);

    await expect(
      useCase.execute(
        { id: 'otro', role: 'productor' },
        '00000000-0000-4000-8000-000000000001',
        [],
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('permite al administrador editar y rechaza productos inexistentes', async () => {
    const repository = new InMemoryProductRepository();
    repository.seedProduct(buildProduct());
    const useCase = new UpdateProductImagesUseCase(repository);

    const updated = await useCase.execute(
      { id: 'admin', role: 'administrador' },
      '00000000-0000-4000-8000-000000000001',
      [],
    );
    expect(updated.props.images).toEqual([]);

    await expect(
      useCase.execute(
        { id: 'admin', role: 'administrador' },
        '00000000-0000-4000-8000-000000000002',
        [],
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  it('rechaza más de 6 imágenes', async () => {
    const repository = new InMemoryProductRepository();
    repository.seedProduct(buildProduct());
    const useCase = new UpdateProductImagesUseCase(repository);

    await expect(
      useCase.execute(
        { id: 'producer-1', role: 'productor' },
        '00000000-0000-4000-8000-000000000001',
        Array.from({ length: 7 }, (_, index) => ({ publicId: `img-${index}` })),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });
  });
});
