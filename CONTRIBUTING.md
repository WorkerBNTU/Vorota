# Contributing

Короткие правила для совместной работы над ВоротаРБ.

## Ветки и PR

1. Работайте в ветке от `main` (`feature/...`, `fix/...`).
2. Перед PR: `ruff check .` и `pytest` в `backend/`, `npm run build` в `frontend/`.
3. Один PR — одна тема; не смешивайте рефакторинг с фичей.
4. CI на GitHub должен быть зелёным.

## Локальный сетап

```bash
git clone https://github.com/WorkerBNTU/Vorota.git
cd Vorota
cp .env.example .env

cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements-dev.txt
pre-commit install
python manage.py migrate
python manage.py seed_data
python manage.py create_admin --username admin --password admin
python manage.py runserver

# другой терминал
cd frontend && npm install && npm run dev
```

Подробнее — [docs/runbook.md](docs/runbook.md).

## Pre-commit

После клона один раз: `pre-commit install` (пакет уже в `requirements-dev.txt`).
Хуки правят EOL/whitespace и гоняют `ruff`. Если коммит ругается на «pre-commit not found» — активируйте venv.

## Что не коммитить

- `.env`, секреты, `db.sqlite3`
- `backend/media/` и корневой `images/` — фото только на диске/volume
- `node_modules/`, `venv/`, `frontend/dist/`

См. `.gitignore`. Перенос контента между staging и prod — процедура экспорта/импорта в runbook, не «залить media в git».

## API-схема

В DEBUG: Swagger UI — http://127.0.0.1:8000/api/docs/, OpenAPI — `/api/schema/`.
На проде UI включается только с `ENABLE_API_DOCS=True`.

## Медиа

Не удаляйте volume `media_data` при пересборке контейнеров. Перед «чистым» деплоем проверьте бэкап media+БД (раздел в runbook).
