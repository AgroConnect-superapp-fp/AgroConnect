# PLAN DE PRUEBAS DE ACCESO A DATOS — MVP

## AgroConnect · cierre H06/H05

**Fecha:** 26/11/2026  
**Estado:** matriz definida; ejecución pendiente en staging/producción

---

## 1. Objetivo

Demostrar que cada actor solo accede a lo autorizado, que el rol de aplicación no tiene privilegios excesivos y que TLS está activo en los ambientes desplegados.

## 2. Matriz actor × operación

| Operación | Productor | Comprador B2C | Comprador B2B | Transportista | Administrador | Soporte |
| --- | --- | --- | --- | --- | --- | --- |
| Ver/editar su perfil | Permitido | Permitido | Permitido | Permitido | Permitido | Denegado |
| CRUD de sus parcelas | Permitido | Denegado | Denegado | Denegado | Permitido | Denegado |
| Publicar producto | Permitido | Denegado | Denegado | Denegado | Permitido | Denegado |
| Moderar producto | Denegado | Denegado | Denegado | Denegado | Permitido | Denegado |
| Listar usuarios | Denegado | Denegado | Denegado | Denegado | Permitido | Denegado |
| Cambiar estado/rol | Denegado | Denegado | Denegado | Denegado | Permitido (no a sí mismo) | Denegado |
| Ver datos financieros | Denegado | Denegado | Denegado | Denegado | Permitido | Denegado |
| Subir imágenes | Permitido | Denegado | Denegado | Denegado | Permitido | Denegado |

**Nota:** soporte y datos financieros no existen en el MVP; se prueban como denegación por defecto cuando se incorporen.

## 3. Pruebas negativas mínimas

1. Sin cookie → `401` en todos los endpoints privados.
2. Cookie de un rol contra endpoint de otro rol → `403`.
3. Productor A intenta editar producto/parcela de productor B → `403/404`.
4. Administrador intenta cambiar su propio estado/rol → `409`.
5. Último administrador activo → `409`.
6. Token de usuario desactivado → `401`.
7. Token de usuario con rol cambiado → `401`.
8. Intento de acceso a `/admin/users` con productor → `403`.
9. Intento de moderar con comprador → `403`.
10. Escritura directa con rol de aplicación sobre tablas de auditoría → denegada.

## 4. Pruebas de base de datos

```sql
-- El rol de la aplicación no debe ser superusuario ni tener DDL
select rolname, rolsuper, rolcreatedb, rolcreaterole
from pg_roles
where rolname = current_user;

-- Debe existir TLS en staging/producción
show ssl;
```

La conexión de prueba debe usar `sslmode=require` en staging/producción. El resultado se registra en `docs/matriz-ambientes-datos.md`.

## 5. Evidencia

- Suite API/E2E existente.
- Resultados de la matriz actor × operación.
- Salida de `pg_roles` y `show ssl`.
- Firma de QA/seguridad.
