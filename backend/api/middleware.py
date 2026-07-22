import re

from django.conf import settings
from django.http import JsonResponse

from .rate_limit import get_rate_limit_store


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        csp = (
            "default-src 'self'; "
            "img-src 'self' data: blob: https:; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            # mc.yandex.ru / googletagmanager.com — опциональные Яндекс.Метрика
            # и Google Analytics (см. SiteSettings.yandex_metrika_id /
            # google_analytics_id, frontend/src/components/Analytics.jsx).
            # Разрешены всегда — сами счётчики подключаются только если в
            # админке заполнен соответствующий ID.
            "script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://www.googletagmanager.com; "
            "connect-src 'self' https://mc.yandex.ru https://www.google-analytics.com "
            "https://*.google-analytics.com https://www.googletagmanager.com; "
            "frame-ancestors 'none';"
        )
        response['Content-Security-Policy'] = csp
        return response


class RateLimitMiddleware:
    RATE_LIMITED_PREFIXES = ('/api/', '/django-admin/login/')

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'POST' and self._should_rate_limit(request.path):
            # Читаем лимит на каждый запрос — чтобы override_settings в тестах
            # и смена env без рестарта процесса работали предсказуемо.
            limit = getattr(settings, 'RATE_LIMIT_REQUESTS', 5)
            window = getattr(settings, 'RATE_LIMIT_WINDOW', 60)
            ip = self._get_client_ip(request)
            key = f'{ip}:{self._rate_limit_scope(request.path)}'
            if not get_rate_limit_store().is_allowed(key, limit, window):
                return JsonResponse(
                    {'detail': 'Слишком много запросов. Попробуйте позже.'},
                    status=429,
                )
        return self.get_response(request)

    def _should_rate_limit(self, path):
        return any(path.startswith(prefix) for prefix in self.RATE_LIMITED_PREFIXES)

    def _rate_limit_scope(self, path):
        if path.startswith('/django-admin/'):
            return 'django-admin'
        if '/auth/login/' in path:
            return 'auth-login'
        if '/leads/' in path:
            return 'leads'
        return 'api-post'

    def _get_client_ip(self, request):
        if getattr(settings, 'TRUST_PROXY_HEADERS', False):
            real_ip = request.META.get('HTTP_X_REAL_IP', '').strip()
            if real_ip:
                return real_ip
        return request.META.get('REMOTE_ADDR', 'unknown')


def sanitize_text(value, max_length=5000):
    if not value:
        return ''
    value = str(value).strip()
    value = re.sub(r'[<>"\']', '', value)
    return value[:max_length]


def validate_phone(phone):
    cleaned = re.sub(r'\D', '', phone or '')
    if re.fullmatch(r'7\d{10}', cleaned):
        return True
    if re.fullmatch(r'375\d{9}', cleaned):
        return True
    return False
