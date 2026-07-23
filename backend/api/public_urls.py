"""Публичные абсолютные URL медиа — всегда от SITE_URL, не от Host запроса.

Prerender ходит на http://frontend; request.build_absolute_uri давал бы
http://frontend/media/... в og:image / JSON-LD. SITE_URL — канонический прод-домен.
"""
from urllib.parse import urlparse

from django.conf import settings


def public_absolute_url(path_or_url):
    """Собрать абсолютный URL для пути /media/... или вернуть внешний http(s) как есть."""
    if not path_or_url:
        return None
    value = str(path_or_url).strip()
    if not value:
        return None

    parsed = urlparse(value)
    if parsed.scheme in ('http', 'https') and parsed.netloc:
        return value

    base = (getattr(settings, 'SITE_URL', '') or '').rstrip('/')
    path = value if value.startswith('/') else f'/{value}'
    if base:
        return f'{base}{path}'
    return path


def media_field_url(file_field):
    """Абсолютный URL FileField/ImageField через SITE_URL."""
    if not file_field:
        return None
    try:
        url = file_field.url
    except ValueError:
        return None
    return public_absolute_url(url)
