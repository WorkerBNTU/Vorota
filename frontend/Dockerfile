FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG VITE_SENTRY_DSN=
ARG VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_SENTRY_TRACES_SAMPLE_RATE=$VITE_SENTRY_TRACES_SAMPLE_RATE
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Пустая директория на случай, если volume _prerendered ещё не примонтирован
# или пререндеринг ни разу не запускался — nginx не должен падать на alias.
RUN mkdir -p /usr/share/nginx/html/_prerendered
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
