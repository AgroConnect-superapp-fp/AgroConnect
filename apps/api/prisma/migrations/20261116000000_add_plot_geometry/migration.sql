-- Migración: geometría real de la parcela (PostGIS) + soft delete.
--
-- Corrige el defecto de `20260928120000_add_plots`: la tabla declaraba
-- `centroid geography(Point, 4326)` pero ningún trigger lo poblaba, por lo que
-- `GET /api/v1/plots/nearby` (ST_DWithin sobre `centroid`) nunca encontraba
-- las parcelas insertadas por la aplicación.
--
-- Diseño:
-- - `geom geometry(Polygon, 4326)` es la fuente de verdad de la geometría.
-- - Un trigger BEFORE INSERT OR UPDATE calcula `centroid` y `area_hectares`
--   con PostGIS (ST_Centroid / ST_Area). El área en hectáreas sale de
--   ST_Area(geom::geography) / 10000: `geography` trabaja en metros reales.
-- - `deleted_at` habilita el soft delete (SPEC: toda entidad transaccional
--   tiene `deletedAt` y las consultas filtran `deleted_at IS NULL`).

-- AddColumn
ALTER TABLE "plots" ADD COLUMN "geom" geometry(Polygon, 4326);
ALTER TABLE "plots" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- El área la calcula el trigger; el default solo cubre filas sin geometría.
ALTER TABLE "plots" ALTER COLUMN "area_hectares" SET DEFAULT 0;

-- Índice espacial GIST para el polígono de la parcela
CREATE INDEX "plots_geom_gist_idx" ON "plots" USING GIST ("geom");

-- Índice de apoyo para el filtro de soft delete
CREATE INDEX "plots_deleted_at_idx" ON "plots" ("deleted_at");

-- Función del trigger: deriva centroide y área a partir del polígono.
CREATE OR REPLACE FUNCTION plots_sync_geometry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.geom IS NULL THEN
        RETURN NEW;
    END IF;

    NEW.centroid := ST_Centroid(NEW.geom)::geography;
    NEW.area_hectares := ST_Area(NEW.geom::geography) / 10000.0;

    RETURN NEW;
END;
$$;

-- Trigger BEFORE INSERT OR UPDATE: los valores calculados por PostGIS quedan
-- disponibles ANTES de validar las restricciones NOT NULL y CHECK.
CREATE TRIGGER "plots_sync_geometry_trigger"
BEFORE INSERT OR UPDATE OF "geom" ON "plots"
FOR EACH ROW
EXECUTE FUNCTION plots_sync_geometry();

-- CHECK: la parcela debe caer dentro del territorio colombiano.
ALTER TABLE "plots"
    ADD CONSTRAINT "plots_centroid_colombia_check"
    CHECK (
        "centroid" IS NULL
        OR ST_Within(
            "centroid"::geometry,
            ST_MakeEnvelope(-79, -4.2, -66.8, 13.3, 4326)
        )
    );
