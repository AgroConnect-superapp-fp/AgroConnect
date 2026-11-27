#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 backups/archivo.dump" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BACKUP="$1"
TARGET="${RESTORE_DB:-agroconnect_restore_check}"

[[ -f "$BACKUP" ]] || { echo "No existe $BACKUP" >&2; exit 1; }

docker compose exec -T db sh -lc \
  "dropdb --if-exists -U \"\$POSTGRES_USER\" '$TARGET'; createdb -U \"\$POSTGRES_USER\" '$TARGET'"

docker compose exec -T db sh -lc \
  "pg_restore -U \"\$POSTGRES_USER\" -d '$TARGET' --no-owner --no-privileges" \
  < "$BACKUP"

docker compose exec -T db psql -U agroconnect -d "$TARGET" -Atc \
  "select 'tables='||count(*) from information_schema.tables where table_schema='public';"

echo "Restauración OK en $TARGET"
