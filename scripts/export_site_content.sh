#!/usr/bin/env bash
# Экспорт ТОЛЬКО контента + media (заявки/визиты/users не входят).
# Предпочтительный способ переноса дев → прод.
#   bash scripts/export_site_content.sh [каталог]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/backups/content-$(date +%Y%m%d-%H%M%S)}"
cd "$ROOT"

# Абсолютный путь
if [[ "$OUT" != /* ]]; then
  OUT="$(mkdir -p "$OUT" && cd "$OUT" && pwd)"
else
  mkdir -p "$OUT"
fi

if docker compose ps --status running 2>/dev/null | grep -q backend; then
  container_out="/tmp/vorota-content-export"
  docker compose exec -T backend rm -rf "$container_out"
  docker compose exec -T backend python manage.py export_site_content "$container_out"
  docker compose cp "backend:${container_out}/." "$OUT/"
  echo "Готово: $OUT"
else
  (cd "$ROOT/backend" && python manage.py export_site_content "$OUT")
fi
