-- Familias y generaciones de refresh tokens (ADR-010 / D3).
--
-- Cada sesión emite una familia; cada rotación crea la siguiente generación.
-- Si se presenta un token ya rotado, la aplicación revoca la familia completa.
-- Las filas existentes reciben una familia propia para no romper la migración.
-- La migración es idempotente para poder reintentarse tras un fallo parcial.

ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "family_id" UUID;
UPDATE "refresh_tokens" SET "family_id" = "id" WHERE "family_id" IS NULL;
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL;

ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "generation" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "rotated_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_revoked_idx"
  ON "refresh_tokens"("user_id", "revocado");
