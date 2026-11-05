/**
 * Alinea la URL del CLI de Prisma con el schema que usa el runtime.
 *
 * Prisma 7 usa `DATABASE_SCHEMA` en el adapter de runtime, pero el CLI de
 * migraciones solo recibe una URL. Si la URL no lleva `schema`, las
 * migraciones se aplican en `public` mientras la API lee otro schema.
 */
export function buildPrismaDatabaseUrl(
  rawUrl: string,
  schema: string | undefined,
  fallbackUrl: string,
): string {
  const base = rawUrl.trim() || fallbackUrl;
  const normalizedSchema = schema?.trim() || 'public';

  try {
    const url = new URL(base);
    url.searchParams.set('schema', normalizedSchema);
    return url.toString();
  } catch {
    return base;
  }
}
