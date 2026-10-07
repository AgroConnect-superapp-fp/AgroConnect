#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Instala un hook `pre-push` que bloquea el push si el README local está
# desalineado del manifiesto de sincronización (tools/alignment-check).
#
# Uso (una sola vez por clon):
#   bash tools/alignment-check/install-git-hook.sh
#
# El hook ejecuta `check-alignment.mjs --ci` (solo repo, sin red) antes de cada
# push: si el README no coincide con los hechos canónicos, el push se detiene.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HOOK_DIR="$REPO_ROOT/.git/hooks"
HOOK="$HOOK_DIR/pre-push"

mkdir -p "$HOOK_DIR"
cat > "$HOOK" <<'HOOKEOF'
#!/usr/bin/env bash
# Verificación de alineación — AgroConnect
# Generado por tools/alignment-check/install-git-hook.sh — no editar a mano.
repo_root="$(git rev-parse --show-toplevel)"
if ! node "$repo_root/tools/alignment-check/check-alignment.mjs" --ci; then
  echo ""
  echo "⚠️  Push bloqueado: el README está desalineado del manifiesto de sincronización."
  echo "    Corrige README.md (o tools/alignment-check/manifest.json) y reintenta."
  exit 1
fi
HOOKEOF

chmod +x "$HOOK"
echo "✅ Hook pre-push instalado en: $HOOK"
echo "   Verificación manual: node tools/alignment-check/check-alignment.mjs --all"
