-- CreateTable
CREATE TABLE "plots" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "area_hectares" DOUBLE PRECISION NOT NULL,
    "municipality" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "farmer_id" UUID NOT NULL,
    "centroid" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plots_farmer_id_idx" ON "plots"("farmer_id");

-- Índice espacial GIST para búsquedas por proximidad de parcelas
CREATE INDEX "plots_centroid_gist_idx" ON "plots" USING GIST ("centroid");

-- AddForeignKey
ALTER TABLE "plots" ADD CONSTRAINT "plots_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
