#!/usr/bin/env bash
# Импорт ПОЛНОЙ БД + media из каталога export_content.sh.
# ВНИМАНИЕ: затирает заявки CRM. Для контента без потери лидов:
#   bash scripts/import_site_content.sh …
# Запуск из корня репозитория:
#   bash scripts/import_content.sh путь/к/export-...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-}"

if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "Использование: bash scripts/import_content.sh <каталог_экспорта>" >&2
  exit 1
fi

# Абсолютный путь
if [[ "$SRC" != /* ]]; then
  SRC="$(cd "$SRC" && pwd)"
fi

cd "$ROOT"

if docker compose ps --status running 2>/dev/null | grep -q backend; then
  if [[ -f "$SRC/db.sql" ]]; then
    echo "→ restore Postgres…"
    docker compose exec -T db psql -U "${DB_USER:-vorota}" -d "${DB_NAME:-vorota}" -c \
      "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    docker compose exec -T db psql -U "${DB_USER:-vorota}" -d "${DB_NAME:-vorota}" < "$SRC/db.sql"
  else
    echo "Нет $SRC/db.sql — пропускаю БД." >&2
  fi
  if [[ -f "$SRC/media.tar" ]]; then
    echo "→ restore media (safe extract)…"
    docker compose cp "$SRC/media.tar" backend:/tmp/import-media.tar
    docker compose exec -T backend python manage.py extract_media_tar /tmp/import-media.tar --replace
    docker compose exec -T backend rm -f /tmp/import-media.tar
  fi
  echo "→ migrate (на случай расхождения схемы)…"
  docker compose exec backend python manage.py migrate --noinput
else
  if [[ -f "$SRC/db.sqlite3" ]]; then
    echo "→ копирую SQLite…"
    cp "$SRC/db.sqlite3" "$ROOT/backend/db.sqlite3"
  elif [[ -f "$SRC/db.sql" ]]; then
    echo "Есть db.sql, но Docker не запущен — импортируйте на сервере с Postgres." >&2
    exit 1
  fi
  if [[ -f "$SRC/media.tar" ]]; then
    echo "→ распаковываю media (safe extract)…"
    (cd "$ROOT/backend" && python manage.py extract_media_tar "$SRC/media.tar" --replace)
  fi
fi

echo "Импорт завершён из $SRC"
echo "Проверьте сайт и при необходимости: docker compose --profile prerender run --rm prerender"
