#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET="${CLEAN_DB:-agroconnect_clean}"
PGUSER="${POSTGRES_USER:-agroconnect}"
PGPASS="${POSTGRES_PASSWORD:-agroconnect_dev}"
PGHOST="${POSTGRES_HOST:-127.0.0.1}"
PGPORT="${POSTGRES_PORT:-5434}"

docker compose exec -T db sh -lc \
  "dropdb --if-exists -U \"\$POSTGRES_USER\" '$TARGET'; createdb -U \"\$POSTGRES_USER\" '$TARGET'"

DATABASE_URL="postgresql://${PGUSER}:${PGPASS}@${PGHOST}:${PGPORT}/${TARGET}" \
DATABASE_SCHEMA=public \
  npm run prisma:deploy -w @agroconnect/api

DATABASE_URL="postgresql://${PGUSER}:${PGPASS}@${PGHOST}:${PGPORT}/${TARGET}" \
DATABASE_SCHEMA=public \
  npm run prisma:status -w @agroconnect/api
