-- Moderación previa de productos: los productos existentes (seed/legado) se
-- consideran aprobados; las publicaciones nuevas nacen en `pending`.
CREATE TYPE "product_moderation_status" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "products"
  ADD COLUMN "moderation_status" "product_moderation_status" NOT NULL DEFAULT 'pending';

UPDATE "products" SET "moderation_status" = 'approved';

ALTER TABLE "products"
  ALTER COLUMN "moderation_status" SET DEFAULT 'pending';

CREATE INDEX "products_moderation_status_idx" ON "products"("moderation_status");
