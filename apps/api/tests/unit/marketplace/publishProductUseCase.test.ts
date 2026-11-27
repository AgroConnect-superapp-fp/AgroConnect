import { PublishProductUseCase } from '../../../src/modules/marketplace/application/use-cases/PublishProductUseCase';
import { InMemoryProductRepository } from '../../fakes/InMemoryProductRepository';

describe('PublishProductUseCase', () => {
  const buildSut = () => {
    const repository = new InMemoryProductRepository();
    return { repository, useCase: new PublishProductUseCase(repository) };
  };

  const actor = {
    id: 'user-productor-1',
    fullName: 'María Productora',
    role: 'productor',
  };

  const command = {
    name: 'Café del Quindío',
    department: 'Quindío',
    municipality: 'Salento',
    crop: 'coffee' as const,
    area: 10,
    productivity: 90,
    certification: 'organic' as const,
    lat: 4.5339,
    lng: -75.6811,
    images: [],
    coordinates: [],
  };

  it('crea el producto con el productor autenticado como dueño', async () => {
    const sut = buildSut();

    const product = await sut.useCase.execute(actor, command);

    expect(product.props.producerId).toBe(actor.id);
    expect(product.props.owner).toBe(actor.fullName);
    expect(product.props.name).toBe(command.name);
    expect(sut.repository.products).toHaveLength(1);
  });

  it('respeta el owner explícito del formulario', async () => {
    const sut = buildSut();

    const product = await sut.useCase.execute(actor, {
      ...command,
      owner: 'Finca La Esperanza',
    });

    expect(product.props.owner).toBe('Finca La Esperanza');
  });

  it('rechaza a un comprador con 403', async () => {
    const sut = buildSut();

    await expect(
      sut.useCase.execute({ ...actor, role: 'comprador_b2c' }, command),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
    expect(sut.repository.products).toHaveLength(0);
  });

  it('rechaza áreas, productividades y coordenadas inválidas', async () => {
    const sut = buildSut();

    await expect(sut.useCase.execute(actor, { ...command, area: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(
      sut.useCase.execute(actor, { ...command, productivity: 101 }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    await expect(sut.useCase.execute(actor, { ...command, lat: 91 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });

  it('rechaza más de 6 imágenes como defensa en profundidad', async () => {
    const sut = buildSut();
    const images = Array.from({ length: 7 }, (_, index) => ({
      publicId: `image-${index}`,
    }));

    await expect(sut.useCase.execute(actor, { ...command, images })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });
});
