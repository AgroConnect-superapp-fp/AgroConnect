\set ON_ERROR_STOP on
SELECT 'tablas=' || count(*) FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE';
SELECT 'politicas_rls=' || count(*) FROM pg_policies;
SELECT 'triggers=' || count(*) FROM pg_trigger WHERE NOT tgisinternal;
SELECT 'constraints=' || count(*) FROM pg_constraint WHERE connamespace='public'::regnamespace;
SELECT 'indices=' || count(*) FROM pg_indexes WHERE schemaname='public';
SELECT 'publicaciones=' || count(*) FROM publicaciones;
SELECT 'envios=' || count(*) FROM envios;
