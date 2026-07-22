"""Настройки Django только для pytest.

Отдельный модуль, чтобы тесты не зависели от .env разработчика
и не упирались в rate-limit / Telegram.
"""

import os

# До import settings: load_dotenv не перезапишет уже заданные ключи.
os.environ['DEBUG'] = 'True'
os.environ.setdefault('DJANGO_SECRET_KEY', 'test-secret-key-not-for-production')
os.environ.setdefault('CSRF_TRUSTED_ORIGINS', 'http://testserver')
os.environ.setdefault('CORS_ALLOWED_ORIGINS', 'http://testserver')

from .settings import *  # noqa: E402, F403

DEBUG = True
SECRET_KEY = 'test-secret-key-not-for-production'

# Изолированная SQLite в памяти — быстрее и без мусора на диске
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Не слать реальные уведомления и не упираться в лимиты
TELEGRAM_BOT_TOKEN = ''
TELEGRAM_CHAT_ID = ''
RATE_LIMIT_REQUESTS = 10_000
RATE_LIMIT_WINDOW = 60
REDIS_URL = ''
TRUST_PROXY_HEADERS = False
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Тесты никогда не шлют события в Sentry
SENTRY_DSN = ''

MIDDLEWARE = [m for m in MIDDLEWARE if 'whitenoise' not in m.lower()]  # noqa: F405
