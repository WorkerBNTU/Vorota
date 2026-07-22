#!/bin/sh
# Именованный docker volume, примонтированный в OUT_DIR, создаётся Docker
# от root — а Chrome (и его кеш в /home/pptruser/.cache/puppeteer) доступен
# только пользователю pptruser. Поэтому стартуем от root ровно на то время,
# чтобы выдать pptruser права на OUT_DIR, а сам prerender.mjs с Chrome
# запускаем уже от pptruser.
set -e

OUT_DIR="${OUT_DIR:-/app/output}"
mkdir -p "$OUT_DIR"
chown -R pptruser:pptruser "$OUT_DIR"

# `su` (без -p) специально сбрасывает HOME на домашний каталог pptruser —
# именно там Chrome закеширован. Поэтому нужные переменные окружения
# пробрасываем в команду явно, а не полагаемся на -p/--preserve-environment.
exec su pptruser -c "\
  BASE_URL='${BASE_URL}' \
  OUT_DIR='${OUT_DIR}' \
  PRERENDER_WAIT_MS='${PRERENDER_WAIT_MS}' \
  PRERENDER_CONCURRENCY='${PRERENDER_CONCURRENCY}' \
  PRERENDER_TIMEOUT_MS='${PRERENDER_TIMEOUT_MS}' \
  node prerender.mjs"
