-- Migración: endurece la geometría de la parcela (PostGIS).
--
-- Un polígono auto-intersectado o degenerado se aceptaba sin control:
--  - `ST_Centroid` de un polígono auto-intersectado puede caer fuera del
--    bounding box y violar `plots_centroid_colombia_check`;
--  - `ST_Area` de un polígono degenerado (tres vértices colineales) devuelve 0.
-- La violación de un CHECK llegaba como error de Postgres sin mapear y salía
-- como HTTP 500 en lugar de un 422 con mensaje útil.
--
-- Restricciones añadidas:
-- - `plots_geom_valid_check`: la geometría debe ser válida para PostGIS
--   (sin anillos auto-intersectados ni vértices duplicados).
-- - `plots_area_positive_check`: una parcela CON geometría debe tener área
--   mayor que cero. La condición es `geom IS NULL OR ...` porque la columna
--   `geom` es nullable: una fila sin geometría conserva el área 0 por defecto
--   y es válida (el trigger solo deriva el área cuando hay polígono).
--
-- El trigger `plots_sync_geometry_trigger` es BEFORE INSERT/UPDATE: el área y
-- el centroide ya están calculados cuando se evalúan estos CHECK.

ALTER TABLE "plots"
    ADD CONSTRAINT "plots_geom_valid_check"
    CHECK ("geom" IS NULL OR ST_IsValid("geom"));

ALTER TABLE "plots"
    ADD CONSTRAINT "plots_area_positive_check"
    CHECK ("geom" IS NULL OR "area_hectares" > 0);
