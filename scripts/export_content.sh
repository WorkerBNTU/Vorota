#!/usr/bin/env bash
# Экспорт БД + media для переноса staging → prod (или бэкапа).
# Запуск из корня репозитория:
#   bash scripts/export_content.sh [каталог_выгрузки]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/backups/export-$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT"

cd "$ROOT"

if docker compose ps --status running 2>/dev/null | grep -q backend; then
  echo "→ dump Postgres из Docker…"
  docker compose exec -T db pg_dump -U "${DB_USER:-vorota}" "${DB_NAME:-vorota}" > "$OUT/db.sql"
  echo "→ архив media_data…"
  docker compose exec -T backend tar -C /app/media -cf - . > "$OUT/media.tar" \
    || docker run --rm -v "${COMPOSE_PROJECT_NAME:-vorota}_media_data":/media:ro alpine \
         tar -C /media -cf - . > "$OUT/media.tar"
else
  echo "→ dump SQLite (локальный dev)…"
  if [[ -f "$ROOT/backend/db.sqlite3" ]]; then
    cp "$ROOT/backend/db.sqlite3" "$OUT/db.sqlite3"
  else
    echo "Нет backend/db.sqlite3 и нет running Docker — нечего экспортировать БД." >&2
    exit 1
  fi
  echo "→ архив backend/media…"
  if [[ -d "$ROOT/backend/media" ]]; then
    tar -C "$ROOT/backend/media" -cf "$OUT/media.tar" .
  else
    echo "Папка backend/media пуста или отсутствует — создаю пустой архив."
    tar -cf "$OUT/media.tar" -T /dev/null
  fi
fi

cat > "$OUT/README.txt" <<EOF
Выгрузка ВоротаРБ: $(date -Iseconds)
Импорт: bash scripts/import_content.sh "$OUT"
EOF

echo "Готово: $OUT"
ls -lah "$OUT"
