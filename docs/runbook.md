# Runbook — эксплуатация ВоротаРБ

Практические шаги для поддержки продакшена и локальной разработки. Архитектура — в [ARCHITECTURE.md](./ARCHITECTURE.md).

## Локальный старт (5 минут)

```bash
git clone https://github.com/WorkerBNTU/Vorota.git && cd Vorota
cp .env.example .env

# Backend
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements-dev.txt   # включает runtime + pytest/ruff/pre-commit
pre-commit install
python manage.py migrate
python manage.py seed_data
python manage.py create_admin --username admin --password admin
# Менеджер CRM (только заявки, без контента):
# python manage.py create_manager --username manager --password manager
python manage.py runserver

# Frontend (другой терминал)
cd frontend
npm install
npm run dev
```

- Сайт: http://127.0.0.1:5173
- API: http://127.0.0.1:8000/api/
- Swagger: http://127.0.0.1:8000/api/docs/
- Админка: http://127.0.0.1:5173/admin

Если логин в админку падает с CSRF: проверьте `CSRF_TRUSTED_ORIGINS` в `.env` (должен быть origin фронта, например `http://127.0.0.1:5173`), перезапустите `runserver`.

## Тесты и линт

```bash
cd backend
ruff check .
pytest
```

CI (GitHub Actions): на каждый push/PR — `ruff` + `pytest`, frontend `typecheck` + `build`, smoke E2E (Playwright). См. `.github/workflows/ci.yml`.

Локально E2E (нужны Python deps в `backend/` и `npm install` во `frontend/`):

```bash
cd frontend
npx playwright install chromium   # один раз
npm run test:e2e
```

## Docker (прод / staging)

```bash
cp .env.example .env
# Обязательно: DJANGO_SECRET_KEY, ADMIN_PASSWORD, SITE_URL
# Рекомендуется: TELEGRAM_*, REDIS_URL уже в compose

docker compose up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py create_admin  # если первый запуск
```

После смены контента каталога для SEO-ботов:

```bash
docker compose --profile prerender run --rm prerender
# exit code 0 только если все маршруты из sitemap успешно отрисовались
```

Обновить SEO-тексты главной (Беларусь в H1; бренды во вторичных текстах) без сброса реквизитов:

```bash
docker compose exec backend python manage.py seed_data --refresh-seo
```

**Домены:** `vorota-rb.by` и старый сайт на другом домене — независимы; редиректов между ними нет.

## Переменные окружения (шпаргалка)

| Переменная | Dev | Prod |
|------------|-----|------|
| `DEBUG` | `True` | `False` |
| `DJANGO_SECRET_KEY` | любое | уникальный секрет |
| `ADMIN_PASSWORD` | опционально | **обязателен** |
| `SITE_URL` | можно localhost | `https://vorota-rb.by` |
| `REDIS_URL` | пусто (память) | `redis://redis:6379/0` |
| `TRUST_PROXY_HEADERS` | `False` | `True` за nginx |
| `TELEGRAM_*` | можно пусто | для уведомлений о лидах |
| `DB_ENGINE=postgresql` | нет (SQLite) | да, в compose |
| `ENABLE_API_DOCS` | не нужно (DEBUG) | `True` только если нужен Swagger на проде |
| `SENTRY_DSN` | можно пусто | DSN проекта Django в Sentry |
| `VITE_SENTRY_DSN` | можно пусто | DSN browser-проекта (сборка frontend) |

Полный список — в корневом `.env.example` и README.

## Типовые операции

### Сброс пароля админа

```bash
# локально — нужен флаг --reset, иначе пароль существующего user не меняется
python manage.py create_admin --username admin --password 'новый-пароль' --reset

# в Docker
docker compose exec backend python manage.py create_admin --username admin --password 'новый-пароль' --reset
```

Полный админ (`is_superuser`) — весь контент + CRM + аналитика посещений.

### Создать менеджера CRM

Менеджер видит только заявки (и упрощённый дашборд), без каталога/настроек/аналитики посещений:

```bash
python manage.py create_manager --username manager --password 'надёжный-пароль'
```

### Обновить каталог из фикстуры (осознанно)

Обычный `seed_data` не перетирает уже залитый каталог. Принудительно:

```bash
python manage.py update_catalog
```

### Бэкап

1. База: `pg_dump` volume `postgres_data` (или `docker compose exec db pg_dump -U vorota vorota > backup.sql`).
2. Медиа: архив volume `media_data` / каталога `backend/media/`.
3. Хранить вне сервера приложения (S3/другой диск), минимум раз в сутки.

Или одной командой (Linux/macOS / Git Bash на сервере):

```bash
bash scripts/export_content.sh
# → backups/export-YYYYMMDD-HHMMSS/{db.sql|db.sqlite3, media.tar}
```

### Staging → prod (наполнение разраба)

Контент и фото **не в git**.

#### Предпочтительно: только контент (заявки на проде сохраняются)

```bash
# на машине с актуальным контентом (dev)
bash scripts/export_site_content.sh ./backups/from-dev
# или: cd backend && python manage.py export_site_content ../backups/from-dev

# на проде — бэкап на всякий случай (полный, см. ниже), затем:
bash scripts/import_site_content.sh ./backups/from-dev
docker compose --profile prerender run --rm prerender
```

`import_site_content` заменяет настройки/каталог/главную/портфолио и `media/`,
но **не трогает** `Lead`, `SiteVisit` и пользователей. После импорта число заявок
должно совпасть с тем, что было на проде (команда падает, если изменилось).

#### Полный снимок БД (опасно для live CRM)

```bash
bash scripts/export_content.sh ./backups/full
bash scripts/import_content.sh ./backups/full
```

`import_content.sh` **перезаписывает всю БД и media** — заявки на целевом окружении
пропадут. Используйте только для пустого прода / полного клона, не для регулярных
обновлений контента.

Windows без Docker: `python manage.py export_site_content` / `import_site_content`
из `backend/` (или скопируйте `db.sqlite3`+`media/` вручную — это уже полный клон).

### Восстановление media после чистого деплоя

Без volume/бэкапа картинки пропадут (в git их нет). Восстановите через
`bash scripts/import_site_content.sh …` (контент + media, **заявки сохраняются**)
или полный `import_content.sh` только на пустом проде. Корневая `images/` —
архив старого сайта, приложение её не читает.

## Чеклист первого деплоя

- [ ] Скопировать `.env.example` → `.env`, задать `DJANGO_SECRET_KEY` (не из примера), `ADMIN_PASSWORD`, `DEBUG=False`
- [ ] `SITE_URL=https://vorota-rb.by`
- [ ] `ALLOWED_HOSTS` включает публичный домен (+ `www` при необходимости) и `frontend` для prerender
- [ ] `CSRF_TRUSTED_ORIGINS` / `CORS_ALLOWED_ORIGINS` = `https://vorota-rb.by` (и www) — **обязательны** в `.env` (compose без дефолта)
- [ ] Внешний TLS-прокси шлёт на nginx `X-Forwarded-Proto: https` (nginx пробрасывает дальше в Django)
- [ ] Сменить `DB_PASSWORD` (не оставлять `vorota`)
- [ ] `TELEGRAM_*`, `REDIS_URL` (в compose уже), `TRUST_PROXY_HEADERS=True`
- [ ] `SENTRY_DSN` (backend) и при необходимости `VITE_SENTRY_DSN` (build-arg frontend)
- [ ] `docker compose up --build -d`
- [ ] Залить media+контент: `bash scripts/import_site_content.sh …` (без потери будущих заявок)
      или полный `import_content.sh` только на **пустом** проде
- [ ] `docker compose exec backend python manage.py create_admin` (пароль из `ADMIN_PASSWORD`)
- [ ] HTTPS на внешнем прокси; порт 8000 только localhost
- [ ] **Обязательно:** `docker compose --profile prerender run --rm prerender` (+ желательно cron)
- [ ] Проверить: `curl -A Googlebot https://…/` отдаёт HTML с `<h1>` (не пустой shell); заявка → Telegram; картинки `/media/…`
- [ ] В Вебмастере регион — **Беларусь** (не только Минск)
- [ ] *(после запуска / при спаме)* заменить арифметическую капчу на **Turnstile** или аналог
      (см. «Безопасность» ниже)

## Инциденты

| Симптом | Что проверить |
|---------|----------------|
| 403 CSRF при логине в `/admin` | `CSRF_TRUSTED_ORIGINS`, cookie SameSite, фронт и API на ожидаемых host/port |
| Заявки не в Telegram | `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`, логи backend, Sentry (tag `subsystem=telegram`) |
| 429 на формах | Redis доступен; не занижен ли `RATE_LIMIT_*`; не режут ли всех одним IP без `TRUST_PROXY_HEADERS` |
| Пустые картинки на проде | volume `media_data`, права, nginx `/media/` |
| Боты видят пустой SPA | давно ли гоняли `prerender`; volume `prerendered_data`; exit code cron; `SITE_URL`/`ALLOWED_HOSTS` для `frontend` |
| Админка «не пускает» | `create_admin` / `create_manager`, группы, не перепутан ли пароль из `.env` |
| После рестарта Docker слетели тексты сайта | `seed_data` не затирает заполненные поля; SEO — `seed_data --refresh-seo`; полный сброс — `--force-settings` |

## Observability (Sentry)

Опционально. Без DSN ничего не отправляется.

1. Создайте проект(ы) на [sentry.io](https://sentry.io) (Django + при желании Browser/React).
2. В `.env`: `SENTRY_DSN=…`, на проде `SENTRY_ENVIRONMENT=production`.
3. Для фронта при сборке: `VITE_SENTRY_DSN=…` (в Docker — build-arg / env на этапе `npm run build`).
4. Сбои Telegram при заявках уходят в Sentry с тегом `subsystem=telegram`.

## Безопасность (чек-лист прод)

- [ ] `DEBUG=False`, сильный `DJANGO_SECRET_KEY` и `ADMIN_PASSWORD`
- [ ] Порт 8000 не торчит в интернет (только через nginx / `127.0.0.1`)
- [ ] HTTPS на внешнем прокси, `SITE_URL` с `https://`
- [ ] Файрвол: 22/80/443
- [ ] Бэкапы БД + media проверены восстановлением хотя бы раз
- [ ] Антиспам заявок: сейчас honeypot + арифметика со 2-й заявки — **на проде
      заменить на Cloudflare Turnstile** (или hCaptcha / reCAPTCHA), когда пойдёт
      трафик или спам. Первая заявка в сессии сейчас без капчи намеренно (UX).
