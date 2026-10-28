/**
 * Augmentación de los tipos de Express con el correlation ID (SPEC §8).
 * Debe ser un script global (sin import/export de nivel superior).
 */
declare namespace Express {
  interface Request {
    correlationId?: string;
  }
}
