# Архитектура ВоротаРБ

Короткий обзор для разработчика / ревьюера портфолио. Детали запуска и инцидентов — в [runbook.md](./runbook.md).

## Назначение

Публичный лендинг + каталог услуг/товаров и встроенная CRM-админка для контента и заявок. Один репозиторий, два приложения: React SPA и Django REST API.

## Компоненты

```
Браузер (посетитель / менеджер)
        │
        ▼
   nginx (Docker: frontend)  ──► статический SPA + /media (volume media_data)
        │ /api/*
        ▼
   Django + DRF (gunicorn)   ──► Postgres (prod) / SQLite (dev)
        │
        ├── Redis (rate-limit POST публичных эндпоинтов)
        └── Telegram Bot API (уведомления о заявках)
```

Опционально: сервис `prerender` (Puppeteer) пишет HTML-снапшоты для поисковых ботов; nginx отдаёт их по User-Agent.

OpenAPI (`/api/schema/`, Swagger `/api/docs/`, ReDoc): только в `DEBUG` или при `ENABLE_API_DOCS=True`.

## Роли

| Роль | Кто | Доступ |
|------|-----|--------|
| `admin` | `is_superuser` | Контент + CRM + удаление заявок |
| `manager` | staff + группа `manager` | Только CRM: статусы/заметки заявок (PII/consent read-only) |
| Аноним | — | Публичный API, создание заявки |

Права: `IsContentAdmin` / `IsCrmStaff` в `api/permissions.py`. UI скрывает разделы контента для менеджера.

## Потоки данных

### Публичный контент

1. SPA запрашивает `GET /api/content/`, `/api/catalog/*`, `/api/portfolio/`.
2. Контент и медиа правятся в `/admin` → CRUD под `/api/admin/*` (session + роль admin).
3. Картинки: volume `media_data` — backend пишет в `/app/media`, nginx
   отдаёт `/media/` с `/var/media` (не через Django в проде).

### Заявка (деньги / лиды)

1. Форма → `POST /api/leads/` (honeypot `website`, после первой отправки — капча в сессии).
2. Rate-limit по IP (Redis в Docker, in-memory в dev); `/api/admin/` не лимитируется.
3. Запись в `Lead` + асинхронная отправка в Telegram (токен редactится в логах/Sentry).
4. CRM: менеджер/админ видят заявку; PATCH только `status` + `internal_notes`; DELETE — только admin.

### Авторизация админки

Session cookie (httpOnly) + CSRF. Логин: `POST /api/auth/login/`. Токены в `localStorage` не используются.

## Границы ответственности

| Слой | Отвечает за |
|------|-------------|
| `frontend/src/pages` | Публичные экраны, SEO-мета, формы |
| `frontend/src/admin` | CMS/CRM UI |
| `backend/api` | Модели, сериализаторы, права, антиспам, Telegram |
| `backend/config` | Settings, URL корня (`sitemap`/`robots`) |
| `frontend/nginx.conf` | Маршрутизация SPA, proxy `/api`, `/media` из volume, боты → prerender, CSP HTML |
| Backend container | gunicorn от user `vorota` (uid 1000); entrypoint чинит права media и сбрасывает root |

## Сознательные trade-offs

- **SPA + dynamic rendering**, не SSR/Next — проще админка и хостинг; SEO закрыто prerender (боты без снапшота временно получают SPA).
- Геопродвижение: Беларусь целиком + бренды (DoorHan); канонический домен `SITE_URL`, без редиректа со старого независимого сайта.
- **Монолит Django**, не микросервисы — один деплой для визитки+CRM.
- **Media на диске сервера** — объём фото небольшой; S3/CDN не окупаются.
- **SQLite в dev, Postgres в Docker** — быстрый старт без потери prod-реализма.
- **`SECURE_SSL_REDIRECT` по умолчанию выкл.** за nginx; включайте вместе с `TRUST_PROXY_HEADERS` и при необходимости HSTS.
- **Арифметическая капча** (со 2-й заявки) — достаточно для старта; на проде с реальным
  трафиком планируется **Turnstile** / аналог вместо неё.

## Где смотреть код

- Заявки: `api/views.py` (`LeadCreateView`), `LeadCreateSerializer`, `api/services.py`
- Каталог: модели `ContentSection` / `ContentPage`, `catalog_utils.py`
- Карта: `map_utils.py` + поля в `SiteSettings`
- Права: `permissions.py`, `auth_views.py`
