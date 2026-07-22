#!/bin/bash
set -e

if [ "${DEBUG:-False}" = "False" ] || [ "${DEBUG}" = "0" ]; then
  if [ -z "${ADMIN_PASSWORD}" ]; then
    echo "ERROR: ADMIN_PASSWORD must be set when DEBUG=False" >&2
    exit 1
  fi
  if [ "${DJANGO_SECRET_KEY:-change-me-in-production}" = "change-me-in-production" ]; then
    echo "ERROR: DJANGO_SECRET_KEY must be set when DEBUG=False" >&2
    exit 1
  fi
fi

python manage.py migrate --noinput
python manage.py seed_data
python manage.py create_admin --username "${ADMIN_USERNAME:-admin}" --password "${ADMIN_PASSWORD:-}"
python manage.py collectstatic --noinput 2>/dev/null || true

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
