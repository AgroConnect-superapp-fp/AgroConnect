#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p backups
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="backups/agroconnect-${STAMP}.dump"

docker compose exec -T db sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges' \
  > "$OUT"
sha256sum "$OUT" > "$OUT.sha256"

echo "Backup: $OUT"
echo "SHA256: $(cut -d' ' -f1 "$OUT.sha256")"
