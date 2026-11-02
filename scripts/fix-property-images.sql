-- AgroConnect · Curación de URLs de imágenes de propiedades
-- Fuente de datos: Supabase → tabla properties
-- Motivo: 6 URLs retornaban HTTP 404 y 4 no correspondían al cultivo.
-- Todas las URLs de reemplazo fueron verificadas (HTTP 200) y revisadas visualmente.
-- Ejecutar en el SQL Editor de Supabase con un rol con BYPASSRLS (postgres).

BEGIN;

-- Finca La Primavera · banana
UPDATE properties
SET images = ARRAY['https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800']
WHERE id = '183b9f11-0458-41fa-ae33-aaa4d6993abd';

-- Hacienda Santa Fe · banana (mostraba bananos aislados, no cultivo)
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Magdalena%20zona%20bananera.jpg?width=800']
WHERE id = 'bebcd80d-40d7-4359-8c88-291a5c6d673c';

-- Finca La Victoria · coffee
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Coffee%20tree%20in%20Hacienda%20Guayabal%2C%20Colombia.jpg?width=800']
WHERE id = '52a0b2e5-47f9-4cd2-9cc4-c4769607b1d7';

-- Finca Los Andes · coffee
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Coffea%20arabica%202.jpg?width=800']
WHERE id = 'c620cee8-a010-4343-9414-2c6bdb535202';

-- Finca San José · rice
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Blond%20and%20green%20rice%20fields.jpg?width=800']
WHERE id = '62addbb2-5a63-402c-afcb-4efadc13ee08';

-- Hacienda El Rosario · oil_palm
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Oil%20palm%20plantation%20in%20Mersing%20District.jpg?width=800']
WHERE id = 'b45a3f54-bf34-4b6d-9eb5-c189f41a54c1';

-- Hacienda La Cumbre · corn
UPDATE properties
SET images = ARRAY['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800']
WHERE id = '356697ba-e39e-4a35-ac1d-0491664f1abc';

-- Finca El Mirador · cacao (mostraba un banano)
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Cacao%20fruit%20in%20C%C3%B4te%20d%27Ivoire%20%2811%29.JPG?width=800']
WHERE id = '806b69c3-06d0-443b-a4d9-fd0ce8dfa4ed';

-- Hacienda El Triunfo · cacao (mostraba un postre de chocolate)
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Theobroma%20cacao%20fruit.jpg?width=800']
WHERE id = 'bd148dbe-7862-4d31-b79f-86b4107aa868';

-- Hacienda El Paraíso · sugarcane (mostraba plántulas genéricas)
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Sugarcane%20plantation%2001.jpg?width=800']
WHERE id = '7e7ac110-711d-448f-9d8d-13dec287000f';

-- Finca Buenavista · coffee (mostraba tazas de café)
UPDATE properties
SET images = ARRAY['https://commons.wikimedia.org/wiki/Special:FilePath/Coffea%20arabica%2C%20coffee%20beans%20.jpg?width=800']
WHERE id = '7bd851ce-991f-4dac-b932-21a9a621fbee';

COMMIT;
