-- Perfil empresarial ampliado (2c)
CREATE TYPE "company_type" AS ENUM (
  'restaurante', 'plaza_mercado', 'distribuidor', 'supermercado', 'exportador', 'otro'
);

ALTER TABLE "company_profiles"
  ADD COLUMN "tipo_empresa" "company_type",
  ADD COLUMN "departamento" TEXT,
  ADD COLUMN "municipio" TEXT;

-- Perfil de transportista (2c)
CREATE TYPE "vehicle_type" AS ENUM ('camion', 'camioneta', 'moto', 'furgon');

CREATE TABLE "transporter_profiles" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "tipo_vehiculo" "vehicle_type" NOT NULL,
  "placa" TEXT NOT NULL,
  "capacidad_kg" DOUBLE PRECISION NOT NULL,
  "cobertura_municipios" TEXT[] NOT NULL,
  "cadena_frio" BOOLEAN NOT NULL DEFAULT false,
  "soat_vence" DATE NOT NULL,
  "licencia_vence" DATE NOT NULL,

  CONSTRAINT "transporter_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "transporter_profiles_user_id_key" ON "transporter_profiles"("user_id");
CREATE UNIQUE INDEX "transporter_profiles_placa_key" ON "transporter_profiles"("placa");

ALTER TABLE "transporter_profiles" ADD CONSTRAINT "transporter_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
