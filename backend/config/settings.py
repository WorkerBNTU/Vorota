import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
# .env лежит в корне репозитория (на уровень выше backend/)
load_dotenv(BASE_DIR.parent / '.env')

_INSECURE_SECRET = 'dev-insecure-change-me-in-production'
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', _INSECURE_SECRET)
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

if not DEBUG and SECRET_KEY in (_INSECURE_SECRET, 'change-me-in-production'):
    raise ImproperlyConfigured(
        'DJANGO_SECRET_KEY must be set to a unique value when DEBUG=False.'
    )

ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()]

# Публичный адрес сайта (фронтенд) — используется для генерации абсолютных
# ссылок в sitemap.xml/robots.txt независимо от того, как реально пришёл
# запрос (через nginx/прокси), чтобы избежать проблем с определением схемы
# https за обратным прокси.
SITE_URL = os.getenv('SITE_URL', 'https://vorota-rb.by').rstrip('/')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'drf_spectacular',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # Сжимает JSON-ответы API и статику whitenoise. В проде перед бэкендом
    # тоже стоит nginx с gzip (см. frontend/nginx.conf), но это же дублирует
    # сжатие для dev-режима и прямых обращений к бэкенду.
    'django.middleware.gzip.GZipMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.SecurityHeadersMiddleware',
    'api.middleware.RateLimitMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

if os.getenv('DB_ENGINE') == 'postgresql':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'vorota'),
            'USER': os.getenv('DB_USER', 'vorota'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'vorota'),
            'HOST': os.getenv('DB_HOST', 'db'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Minsk'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

_DEV_ORIGINS = (
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
)


def _origins_from_env(name):
    raw = os.getenv(name, ','.join(_DEV_ORIGINS))
    return [o.strip() for o in raw.split(',') if o.strip()]


def _merge_origins(*lists):
    merged = []
    for items in lists:
        for origin in items:
            if origin not in merged:
                merged.append(origin)
    return merged


CORS_ALLOWED_ORIGINS = _merge_origins(_origins_from_env('CORS_ALLOWED_ORIGINS'))
CSRF_TRUSTED_ORIGINS = _merge_origins(_origins_from_env('CSRF_TRUSTED_ORIGINS'))

if DEBUG:
    CORS_ALLOWED_ORIGINS = _merge_origins(CORS_ALLOWED_ORIGINS, _DEV_ORIGINS)
    CSRF_TRUSTED_ORIGINS = _merge_origins(CSRF_TRUSTED_ORIGINS, _DEV_ORIGINS)

CORS_ALLOW_CREDENTIALS = True

SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    # ASCII title → нормальный Content-Disposition filename (openapi schema).
    'TITLE': 'VorotaRB API',
    'DESCRIPTION': (
        'Публичный контент, заявки и session-админка. '
        '`/api/admin/*`: cookie-сессия; роль admin (superuser) — контент+CRM, '
        'manager (группа manager) — только заявки (статус/заметки).'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Swagger UI / ReDoc: в DEBUG всегда; на проде — только с ENABLE_API_DOCS=True
ENABLE_API_DOCS = DEBUG or os.getenv('ENABLE_API_DOCS', 'False').lower() in ('true', '1', 'yes')

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '')

RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', '5'))
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '60'))
REDIS_URL = os.getenv('REDIS_URL', '')
TRUST_PROXY_HEADERS = os.getenv('TRUST_PROXY_HEADERS', 'False').lower() in ('true', '1', 'yes')
ENABLE_DJANGO_ADMIN = os.getenv('ENABLE_DJANGO_ADMIN', 'False').lower() in ('true', '1', 'yes')

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

if not DEBUG:
    # По умолчанию False: за nginx TLS терминирует внешний прокси, Django видит HTTP.
    # Включайте True только если Django сам принимает HTTPS или корректно настроен
    # SECURE_PROXY_SSL_HEADER (ниже при TRUST_PROXY_HEADERS).
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1', 'yes')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    if TRUST_PROXY_HEADERS:
        SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    # HSTS только если снаружи реально HTTPS (секунды; 0 = выкл.)
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '0'))
    if SECURE_HSTS_SECONDS:
        SECURE_HSTS_INCLUDE_SUBDOMAINS = True
        SECURE_HSTS_PRELOAD = os.getenv('SECURE_HSTS_PRELOAD', 'False').lower() in ('true', '1', 'yes')

# Sentry — ошибки API (в т.ч. сбои Telegram при заявках). Пустой DSN = выключено.
SENTRY_DSN = os.getenv('SENTRY_DSN', '').strip()
SENTRY_ENVIRONMENT = os.getenv(
    'SENTRY_ENVIRONMENT',
    'development' if DEBUG else 'production',
)
SENTRY_TRACES_SAMPLE_RATE = float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1'))


def _sentry_before_send(event, hint):
    """Убираем Telegram bot token из сообщений/исключений перед отправкой в Sentry."""
    token = TELEGRAM_BOT_TOKEN
    if not token:
        return event

    def scrub(value):
        if isinstance(value, str) and token in value:
            return value.replace(token, '***')
        if isinstance(value, list):
            return [scrub(v) for v in value]
        if isinstance(value, dict):
            return {k: scrub(v) for k, v in value.items()}
        return value

    return scrub(event)


if SENTRY_DSN and os.environ.get('DJANGO_SETTINGS_MODULE') != 'config.settings_test':
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
        environment=SENTRY_ENVIRONMENT,
        before_send=_sentry_before_send,
    )
