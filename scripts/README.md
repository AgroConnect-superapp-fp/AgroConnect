# Scripts operativos — AgroConnect

Herramientas de auditoría, trazabilidad y verificación. Se versionan desde el
2026-11-02 para que los hallazgos sean reproducibles y revisables en PR.

| Script | Propósito | Uso |
|---|---|---|
| `security-audit.mjs` | Auditoría estática de secretos/patrones por workspace | `node scripts/security-audit.mjs backend` |
| `build_traceability_matrix.py` | Genera las matrices RF↔CU↔HU | `python3 scripts/build_traceability_matrix.py` |
| `normalize_moscow.py` | Normaliza prioridades MoSCoW en Notion | requiere `NOTION_AGROCONNECT_TOKEN` |
| `update_notion_modules.py` | Sincroniza los 17 módulos con Notion | requiere `NOTION_AGROCONNECT_TOKEN` |
| `notion_cleanup.py` | Limpieza de páginas/duplicados en Notion | requiere `NOTION_AGROCONNECT_TOKEN` |
| `jira_client.py` | Cliente mínimo de Jira (estado actual: sitio suspendido) | requiere `JIRA_*` |
| `fix-property-images.sql` | Curación de imágenes del marketplace (PT-EVD-01) | `psql "$DATABASE_URL" -f ...` |
| `audit-admin-users.sql` | Revisa cuentas administradoras creadas en la ventana expuesta | `psql "$DATABASE_URL" -f ...` |
| `verify-supabase-rls.sql` | Verifica RLS y privilegios en Supabase | `psql "$SUPABASE_DATABASE_URL" -f ...` |
| `adapt-identity-use-cases.mjs` | Adaptación puntual de casos de uso (migración) | solo histórico |
| `evidence-session.mjs` | Evidencia de sesión para SENA | ver cabecera del script |

## Reglas

- Nunca escribir credenciales en los scripts ni en los argumentos: usar
  variables de entorno (`DATABASE_URL`, `NOTION_AGROCONNECT_TOKEN`, `JIRA_*`).
- Los scripts de escritura (`normalize_moscow.py`, `update_notion_modules.py`,
  `notion_cleanup.py`, `fix-property-images.sql`) requieren revisión humana
  antes de ejecutarse contra producción.
- Los scripts SQL de auditoría son de solo lectura por defecto; los `UPDATE`
  están comentados y deben habilitarse tras validar la lista.
