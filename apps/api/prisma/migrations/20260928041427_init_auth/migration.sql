-- Extensión geoespacial requerida para la ubicación de las fincas (PostGIS 3.4)
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol_id" UUID NOT NULL,
    "estado" "UserStatus" NOT NULL DEFAULT 'ACTIVO',
    "acepta_tratamiento_datos" BOOLEAN NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producer_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nombre_finca" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "vereda" TEXT NOT NULL,
    "coordenadas" geography(Point, 4326),

    CONSTRAINT "producer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "razon_social" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "direccion" TEXT,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "users_documento_key" ON "users"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "users_correo_key" ON "users"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "users_celular_key" ON "users"("celular");

-- CreateIndex
CREATE INDEX "users_rol_id_idx" ON "users"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "producer_profiles_user_id_key" ON "producer_profiles"("user_id");

-- Índice espacial GIST para búsquedas por proximidad de fincas
CREATE INDEX "producer_profiles_coordenadas_gist_idx" ON "producer_profiles" USING GIST ("coordenadas");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_user_id_key" ON "company_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_nit_key" ON "company_profiles"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_profiles" ADD CONSTRAINT "producer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Catálogo de roles del registro multi-rol (RF-05 / CU#01 / HU01)
INSERT INTO "roles" ("id", "nombre", "descripcion") VALUES
    (gen_random_uuid(), 'productor',     'Productor agrícola que publica y vende sus cosechas'),
    (gen_random_uuid(), 'comprador_b2c', 'Comprador persona natural (consumidor final)'),
    (gen_random_uuid(), 'comprador_b2b', 'Empresa compradora (restaurantes, plazas, distribuidores)'),
    (gen_random_uuid(), 'transportista', 'Transportador de cosechas entre productor y comprador'),
    (gen_random_uuid(), 'administrador', 'Administrador de la plataforma');

