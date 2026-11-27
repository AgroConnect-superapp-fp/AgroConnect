-- Relación opcional con el productor autenticado.
-- Los productos del seed no tienen productor (datos de demostración) y quedan
-- con `producer_id = NULL`; al borrar un usuario el producto se conserva.
ALTER TABLE "products" ADD COLUMN "producer_id" UUID;

CREATE INDEX "products_producer_id_idx" ON "products"("producer_id");

ALTER TABLE "products" ADD CONSTRAINT "products_producer_id_fkey"
  FOREIGN KEY ("producer_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
