#!/usr/bin/env bash
# Импорт ТОЛЬКО контента + media. Lead / SiteVisit / users на целевой БД сохраняются.
#   bash scripts/import_site_content.sh путь/к/content-...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-}"

if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "Использование: bash scripts/import_site_content.sh <каталог_экспорта>" >&2
  exit 1
fi

# Абсолютный путь для docker cp
if [[ "$SRC" != /* ]]; then
  SRC="$(cd "$SRC" && pwd)"
fi

cd "$ROOT"

if docker compose ps --status running 2>/dev/null | grep -q backend; then
  container_in="/tmp/vorota-content-import"
  docker compose exec -T backend rm -rf "$container_in"
  docker compose exec -T backend mkdir -p "$container_in"
  docker compose cp "$SRC/." "backend:${container_in}/"
  docker compose exec -T backend python manage.py import_site_content "$container_in"
else
  (cd "$ROOT/backend" && python manage.py import_site_content "$SRC")
fi
