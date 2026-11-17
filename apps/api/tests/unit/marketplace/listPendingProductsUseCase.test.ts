import { Product } from '../../../src/modules/marketplace/domain/entities/Product';
import { ListPendingProductsUseCase } from '../../../src/modules/marketplace/application/use-cases/ListPendingProductsUseCase';
import { InMemoryProductRepository } from '../../fakes/InMemoryProductRepository';

describe('ListPendingProductsUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryProductRepository();
    return { repository, useCase: new ListPendingProductsUseCase(repository) };
  };

  const pendingProduct = new Product({
    id: 'product-pending-1',
    name: 'Cosecha pendiente',
    owner: 'Carlos Martínez',
    department: 'Cundinamarca',
    municipality: 'La Mesa',
    crop: 'coffee',
    area: 50,
    productivity: 85,
    certification: 'organic',
    lat: 4.6249,
    lng: -74.0679,
    images: [],
    coordinates: [],
  });

  const admin = { id: 'admin-1', role: 'administrador' };

  it('rechaza a un usuario que no es administrador', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute({ id: 'producer-1', role: 'productor' }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  });

  it('usa la paginación por defecto de 20 elementos desde el inicio', async () => {
    const sut = buildSut();
    sut.repository.seedProduct(pendingProduct);

    const result = await sut.useCase.execute(admin);

    expect(sut.repository.lastPendingLimit).toBe(20);
    expect(sut.repository.lastPendingOffset).toBe(0);
    expect(result).toEqual([pendingProduct]);
  });

  it('delega la paginación recibida al repositorio', async () => {
    const sut = buildSut();
    sut.repository.seedProduct(pendingProduct);

    await sut.useCase.execute(admin, { limit: 5, offset: 10 });

    expect(sut.repository.lastPendingLimit).toBe(5);
    expect(sut.repository.lastPendingOffset).toBe(10);
  });

  it('rechaza un límite fuera del rango 1..100', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(admin, { limit: 0, offset: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });

    await expect(sut.useCase.execute(admin, { limit: 101, offset: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });

  it('rechaza un offset negativo', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(admin, { limit: 20, offset: -1 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });
});
