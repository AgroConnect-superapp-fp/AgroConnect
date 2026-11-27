import { Product } from '../../../src/modules/marketplace/domain/entities/Product';
import { ListProductsUseCase } from '../../../src/modules/marketplace/application/use-cases/ListProductsUseCase';
import { InMemoryProductRepository } from '../../fakes/InMemoryProductRepository';

describe('ListProductsUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryProductRepository();
    return { repository, useCase: new ListProductsUseCase(repository) };
  };

  const product = new Product({
    id: 'product-1',
    name: 'Finca La Esperanza',
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

  it('delega la consulta con los filtros recibidos', async () => {
    const sut = buildSut();
    sut.repository.seedProduct(product);

    const result = await sut.useCase.execute({
      search: 'café',
      crop: 'coffee',
      limit: 20,
      offset: 0,
    });

    expect(sut.repository.lastFilters).toEqual({
      search: 'café',
      crop: 'coffee',
      limit: 20,
      offset: 0,
    });
    expect(result).toEqual([product]);
  });

  it('normaliza la búsqueda y elimina wildcards de SQL', async () => {
    const sut = buildSut();

    await sut.useCase.execute({
      search: "  %café_  (quindío)'  ",
      limit: 50,
      offset: 0,
    });

    expect(sut.repository.lastFilters?.search).toBe('café quindío');
  });

  it('convierte una búsqueda vacía en undefined', async () => {
    const sut = buildSut();

    await sut.useCase.execute({ search: '   %  ', limit: 50, offset: 0 });

    expect(sut.repository.lastFilters?.search).toBeUndefined();
  });

  it('rechaza límites fuera del rango soportado', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute({ limit: 0, offset: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(sut.useCase.execute({ limit: 101, offset: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });

  it('rechaza offsets negativos', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute({ limit: 50, offset: -1 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });
});
