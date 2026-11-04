# ADR-020 — Perfiles de empresa y transportista (incremento 2c)

- **Estado:** Aceptada — implementada
- **Fecha:** 2026-11-03
- **Decisores:** fAb Orq, tech lead, equipo de identidad
- **Relacionado:** ADR-009, ADR-010, ADR-015, ADR-019

## Contexto

El registro multi-rol ya creaba `producer_profiles` para productores y un
`company_profiles` básico (razón social, NIT y dirección) para compradores B2B.
Los transportistas se registraban sin ningún perfil operativo, y las empresas no
tenían tipo ni ubicación. Eso bloqueaba M06 (logística) y M17 (perecederos):
no había vehículo, capacidad, cobertura ni cadena de frío que consultar.

## Decisión

Ampliar los perfiles en el registro 2c:

- **Empresa:** agregar `tipo_empresa` (restaurante, plaza, distribuidor,
  supermercado, exportador, otro), `departamento` y `municipio`.
- **Transportista:** nueva tabla `transporter_profiles` con tipo de vehículo,
  placa única, capacidad en kg, municipios de cobertura, cadena de frío y
  vencimiento de SOAT/licencia. La placa se normaliza a mayúsculas y se valida
  con el formato colombiano `ABC123` o `ABC12D`.
- **Dominio:** `CompanyProfile` y `TransporterProfile` validan sus reglas; el
  registro exige el perfil correspondiente al rol.
- **Contrato:** `transporterProfileSchema` y campos opcionales de empresa en
  `registerSchema`; formulario de registro en tres pasos para ambos roles.
- **Persistencia:** migración `20261103140000_add_company_transporter_profiles`
  con enums, columnas y FK en cascada.

La validación del NIT contra la DIAN y la carga de documentos (SOAT/licencia en
PDF o imagen) quedan fuera de este incremento: requieren un proveedor externo y
almacenamiento de documentos, respectivamente.

## Alternativas consideradas

1. **Guardar los datos del vehículo en `users`:** descartada; mezcla identidad
   con logística y desperdicia columnas para los demás roles.
2. **Exigir documentos escaneados desde el registro:** descartada por alcance;
   primero se valida la fecha de vigencia y el flujo de alta.
3. **Tabla única de perfiles polimórfica:** descartada por sobreingeniería;
   empresa y transportista tienen ciclos y validaciones distintas.

## Consecuencias

- **Positivas:** M06/M17 ya tienen los datos mínimos para asignar transporte y
  filtrar cadena de frío; el registro sigue siendo transaccional y valida en
  dominio y contrato.
- **Negativas:** la placa es única globalmente y puede requerir una revisión
  manual si un transportista cambia de vehículo; la vigencia se valida al
  registrar, no se recalcula automáticamente.
- **Operación:** las nuevas columnas de empresa son opcionales para no romper
  cuentas existentes; el formulario las captura para cuentas nuevas.

## Evidencia

- Migración `20261103140000_add_company_transporter_profiles` aplicada en
  `agroconnect` y `agroconnect_test` (8 migraciones en total).
- Backend: **247 tests**, cobertura **94.28 % líneas / 83.59 % ramas**.
- Frontend: **49 unitarios**, build verde.
- E2E: **14 pruebas**, con registro de empresa/transportista y gate axe.
- `openapi.json` sincronizado sin drift.
