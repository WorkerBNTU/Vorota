# Runbook — эксплуатация ВоротаРБ

Практические шаги для поддержки продакшена и локальной разработки. Архитектура — в [ARCHITECTURE.md](./ARCHITECTURE.md).

## Локальный старт (5 минут)

```bash
# Backend
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements-dev.txt   # включает runtime + pytest/ruff
cp ../.env.example ../.env
python manage.py migrate
python manage.py seed_data
python manage.py create_admin --username admin --password admin
python manage.py runserver

# Frontend (другой терминал)
cd frontend
npm install
npm run dev
```

- Сайт: http://127.0.0.1:5173
- API: http://127.0.0.1:8000/api/
- Админка: http://127.0.0.1:5173/admin

Если логин в админку падает с CSRF: проверьте `CSRF_TRUSTED_ORIGINS` в `.env` (должен быть origin фронта, например `http://127.0.0.1:5173`), перезапустите `runserver`.

## Тесты и линт

```bash
cd backend
ruff check .
pytest
```

CI (GitHub Actions): на каждый push/PR — `ruff` + `pytest` и `npm run build`. См. `.github/workflows/ci.yml`.

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
```

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

Полный список — в корневом `.env.example` и README.

## Типовые операции

### Сброс пароля админа

```bash
# локально
python manage.py create_admin --username admin --password 'новый-пароль'

# в Docker
docker compose exec backend python manage.py create_admin --username admin --password 'новый-пароль'
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

### Восстановление media после чистого деплоя

Без volume/бэкапа картинки пропадут (в git их нет). Восстановите `media_data` из бэкапа; корневая папка `images/` — только архив старого сайта, приложение её не читает.

## Инциденты

| Симптом | Что проверить |
|---------|----------------|
| 403 CSRF при логине в `/admin` | `CSRF_TRUSTED_ORIGINS`, cookie SameSite, фронт и API на ожидаемых host/port |
| Заявки не в Telegram | `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`, логи backend, что токен/чат живы |
| 429 на формах | Redis доступен; не занижен ли `RATE_LIMIT_*`; не режут ли всех одним IP без `TRUST_PROXY_HEADERS` |
| Пустые картинки на проде | volume `media_data`, права, nginx `/media/` |
| Боты видят пустой SPA | давно ли гоняли `prerender`; есть ли файлы в `prerendered_data` |
| Админка «не пускает» | пользователь `is_staff`, `create_admin`, не перепутан ли пароль из `.env` |

## Безопасность (чек-лист прод)

- [ ] `DEBUG=False`, сильный `DJANGO_SECRET_KEY` и `ADMIN_PASSWORD`
- [ ] Порт 8000 не торчит в интернет (только через nginx / `127.0.0.1`)
- [ ] HTTPS на внешнем прокси, `SITE_URL` с `https://`
- [ ] Файрвол: 22/80/443
- [ ] Бэкапы БД + media проверены восстановлением хотя бы раз
