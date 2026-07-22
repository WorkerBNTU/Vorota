# Архитектура ВоротаРБ

Короткий обзор для разработчика / ревьюера портфолио. Детали запуска и инцидентов — в [runbook.md](./runbook.md).

## Назначение

Публичный лендинг + каталог услуг/товаров и встроенная CRM-админка для контента и заявок. Один репозиторий, два приложения: React SPA и Django REST API.

## Компоненты

```
Браузер (посетитель / менеджер)
        │
        ▼
   nginx (Docker: frontend)  ──► статический SPA + /media
        │ /api/*
        ▼
   Django + DRF (gunicorn)   ──► Postgres (prod) / SQLite (dev)
        │
        ├── Redis (rate-limit POST)
        └── Telegram Bot API (уведомления о заявках)
```

Опционально: сервис `prerender` (Puppeteer) пишет HTML-снапшоты для поисковых ботов; nginx отдаёт их по User-Agent.

OpenAPI: `/api/schema/` всегда; Swagger UI `/api/docs/` в DEBUG или при `ENABLE_API_DOCS=True`.

## Потоки данных

### Публичный контент

1. SPA запрашивает `GET /api/content/`, `/api/catalog/*`, `/api/services/`, `/api/portfolio/`.
2. Контент и медиа правятся в `/admin` → CRUD под `/api/admin/*` (session + `is_staff`).
3. Картинки лежат в volume `media_data` (`MEDIA_ROOT`), не в git и не в корневой папке `images/` (это только локальный архив).

### Заявка (деньги / лиды)

1. Форма → `POST /api/leads/` (honeypot `website`, после первой отправки — капча в сессии).
2. Rate-limit по IP (Redis в Docker, in-memory в dev).
3. Запись в `Lead` + асинхронная отправка в Telegram.
4. Менеджер видит заявку в админке (`/api/admin/leads/`), статусы и заметки.

### Авторизация админки

Session cookie (httpOnly) + CSRF. Логин: `POST /api/auth/login/`. Токены в `localStorage` не используются.

## Границы ответственности

| Слой | Отвечает за |
|------|-------------|
| `frontend/src/pages` | Публичные экраны, SEO-мета, формы |
| `frontend/src/admin` | CMS/CRM UI |
| `backend/api` | Модели, сериализаторы, права, антиспам, Telegram |
| `backend/config` | Settings, URL корня (`sitemap`/`robots`) |
| `frontend/nginx.conf` | Маршрутизация SPA, proxy `/api`, боты → prerender |

## Сознательные trade-offs

- **SPA + dynamic rendering**, не SSR/Next — проще админка и хостинг; SEO закрыто prerender.
- **Монолит Django**, не микросервисы — один деплой для визитки+CRM.
- **Media на диске сервера** — объём фото небольшой; S3/CDN не окупаются.
- **SQLite в dev, Postgres в Docker** — быстрый старт без потери prod-реализма.

## Где смотреть код

- Заявки: `api/views.py` (`LeadCreateView`), `LeadCreateSerializer`, `api/services.py`
- Каталог: модели `ContentSection` / `ContentPage`, `catalog_utils.py`
- Карта: `map_utils.py` + поля в `SiteSettings`
- Права админки: `IsAdminUser` на viewsets, `auth_views.py`
