import { PrismaService } from '../../../src/prisma/prisma.service';

describe('PrismaService', () => {
  it('conecta y desconecta el pool en el ciclo de vida del módulo', async () => {
    const service = new PrismaService();
    const connect = jest.spyOn(service, '$connect').mockResolvedValue(undefined);
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleInit();
    expect(connect).toHaveBeenCalledTimes(1);

    await service.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('expone el cliente generado por Prisma', () => {
    const service = new PrismaService();

    expect(service).toBeDefined();
    expect(typeof service.$connect).toBe('function');
    expect(typeof service.user).toBe('object');
  });
});
