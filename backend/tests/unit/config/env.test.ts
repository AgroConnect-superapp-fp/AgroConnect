describe('configuración de entorno', () => {
  it('falla con un mensaje claro cuando falta una variable obligatoria', async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    jest.resetModules();

    let failure: unknown;
    try {
      await import('../../../src/config/env');
    } catch (error) {
      failure = error;
    } finally {
      process.env.DATABASE_URL = saved;
      jest.resetModules();
    }

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain('Configuración de entorno inválida');
    expect((failure as Error).message).toContain('DATABASE_URL');
  });
});
