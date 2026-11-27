import { buildPrismaDatabaseUrl } from '../../../prisma/databaseUrl';

describe('buildPrismaDatabaseUrl', () => {
  const fallback = 'postgresql://postgres:postgres@localhost:5432/postgres';

  it('agrega el schema configurado a la URL', () => {
    const url = buildPrismaDatabaseUrl(
      'postgresql://user:pass@localhost:5432/agroconnect',
      'agroconnect',
      fallback,
    );

    expect(new URL(url).searchParams.get('schema')).toBe('agroconnect');
  });

  it('reemplaza un schema previo para evitar CLI y runtime divergentes', () => {
    const url = buildPrismaDatabaseUrl(
      'postgresql://user:pass@localhost:5432/agroconnect?schema=public',
      'agroconnect',
      fallback,
    );

    expect(new URL(url).searchParams.get('schema')).toBe('agroconnect');
  });

  it('usa public por defecto y la URL de reserva si falta DATABASE_URL', () => {
    const url = buildPrismaDatabaseUrl('', undefined, fallback);

    expect(new URL(url).searchParams.get('schema')).toBe('public');
    expect(url).toContain('/postgres');
  });
});
