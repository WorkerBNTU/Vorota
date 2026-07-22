#!/bin/bash
set -e

BANNED_SECRETS="dev-insecure-change-me-in-production change-me-in-production your-secret-key-change-in-production"

if [ "${DEBUG:-False}" = "False" ] || [ "${DEBUG}" = "0" ] || [ "${DEBUG}" = "false" ]; then
  if [ -z "${ADMIN_PASSWORD}" ]; then
    echo "ERROR: ADMIN_PASSWORD must be set when DEBUG=False" >&2
    exit 1
  fi
  KEY="${DJANGO_SECRET_KEY:-}"
  for banned in $BANNED_SECRETS; do
    if [ "$KEY" = "$banned" ] || [ -z "$KEY" ]; then
      echo "ERROR: DJANGO_SECRET_KEY must be a unique non-placeholder value when DEBUG=False" >&2
      exit 1
    fi
  done
  if [ -z "${REDIS_URL}" ]; then
    echo "ERROR: REDIS_URL must be set when DEBUG=False" >&2
    exit 1
  fi
fi

python manage.py migrate --noinput
python manage.py seed_data
python manage.py create_admin --username "${ADMIN_USERNAME:-admin}" --password "${ADMIN_PASSWORD:-}"
python manage.py collectstatic --noinput 2>/dev/null || true

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
