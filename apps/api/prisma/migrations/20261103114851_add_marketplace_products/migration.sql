-- CreateEnum
CREATE TYPE "product_crop" AS ENUM ('coffee', 'cacao', 'banana', 'sugarcane', 'rice', 'corn', 'cassava', 'oil_palm');

-- CreateEnum
CREATE TYPE "product_certification" AS ENUM ('organic', 'rainforest_alliance', 'fair_trade', 'conventional', 'global_gap');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "description" TEXT,
    "contact" TEXT,
    "department" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "crop" "product_crop" NOT NULL,
    "area_hectares" DOUBLE PRECISION NOT NULL,
    "productivity" INTEGER NOT NULL,
    "certification" "product_certification",
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "coordinates" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- Reglas de negocio del marketplace (defensa en la base de datos)
ALTER TABLE "products" ADD CONSTRAINT "products_productivity_check"
  CHECK ("productivity" BETWEEN 0 AND 100);
ALTER TABLE "products" ADD CONSTRAINT "products_coordinates_check"
  CHECK ("lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180);

-- CreateIndex
CREATE INDEX "products_crop_idx" ON "products"("crop");

-- CreateIndex
CREATE INDEX "products_department_municipality_idx" ON "products"("department", "municipality");

-- CreateIndex
CREATE INDEX "products_created_at_idx" ON "products"("created_at");

-- RenameIndex
ALTER INDEX "refresh_tokens_user_id_revoked_idx" RENAME TO "refresh_tokens_user_id_revocado_idx";
