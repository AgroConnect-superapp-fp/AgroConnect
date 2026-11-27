-- Marca de la última actualización de la parcela.
--
-- La columna la mantiene el repositorio con `updated_at = CURRENT_TIMESTAMP`
-- en cada UPDATE (las escrituras de parcelas son SQL crudo, no Prisma Client,
-- así que `@updatedAt` no se aplica solo). El default cubre las filas
-- existentes y los INSERT que no la informen.

-- AddColumn
ALTER TABLE "plots" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
