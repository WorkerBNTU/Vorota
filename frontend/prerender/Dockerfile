# Официальный образ с уже установленным Chrome и всеми системными
# зависимостями для headless-рендеринга — не нужно вручную ставить шрифты,
# libnss, dbus и т.п. Chrome уже лежит в кеше puppeteer в $HOME пользователя
# pptruser — поэтому ставим npm-зависимости от его же имени, иначе npm
# install (от root, у которого $HOME=/root) не увидит готовый кеш и заново
# скачает Chrome.
FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app
RUN mkdir -p /app && chown -R pptruser:pptruser /app
USER pptruser

COPY --chown=pptruser:pptruser package.json ./
RUN npm install --omit=dev
COPY --chown=pptruser:pptruser prerender.mjs ./

# root нужен только entrypoint-скрипту, чтобы выдать pptruser права на
# смонтированный volume — сам Chrome/node запускается уже от pptruser
# (см. docker-entrypoint.sh).
USER root
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
