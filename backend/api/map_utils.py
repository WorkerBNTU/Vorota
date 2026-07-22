"""Автогенерация ссылки на виджет Яндекс.Карт.

Приоритет iframe: embed map-widget → oid + координаты → поиск по адресу.
Короткие ссылки yandex.ru/maps/-/XXXX не подходят — открывают геолокацию пользователя.
"""
from urllib.parse import quote, urlparse

# Vorota Rb, Брестская 2 — из https://yandex.ru/maps/org/vorota_rb/54736687390/
DEFAULT_YANDEX_ORG_ID = '54736687390'
DEFAULT_YANDEX_ORG_SLUG = 'vorota_rb'
DEFAULT_LAT = 53.864236
DEFAULT_LON = 27.527497
# z=18 — уровень здания; ol=biz — карточка организации с меткой (не просто точка)
DEFAULT_MAP_ZOOM = 18

_EMBED_HOSTS = frozenset({
    'yandex.ru',
    'www.yandex.ru',
    'yandex.com',
    'www.yandex.com',
})


def is_embeddable_map_url(url):
    """True только для https map-widget на официальных хостах Яндекса."""
    if not url:
        return False
    try:
        parsed = urlparse(str(url).strip())
    except ValueError:
        return False
    if parsed.scheme not in ('https', 'http'):
        return False
    host = (parsed.hostname or '').lower()
    if host not in _EMBED_HOSTS:
        return False
    path = parsed.path or ''
    return '/map-widget/' in path


def is_unreliable_map_share_url(url):
    """Короткие share-ссылки maps/-/ часто не ведут на организацию."""
    if not url:
        return False
    normalized = str(url).strip().lower()
    return '/maps/-/' in normalized or 'maps/?oid=' in normalized


def build_map_page_url(
    *,
    yandex_org_id='',
    org_slug='',
    latitude=None,
    longitude=None,
    address='',
    company_name='',
):
    """Прямая ссылка на карточку организации с координатами."""
    org_id = str(yandex_org_id or '').strip()
    if org_id:
        slug = (org_slug or DEFAULT_YANDEX_ORG_SLUG).strip() or DEFAULT_YANDEX_ORG_SLUG
        url = f'https://yandex.ru/maps/org/{slug}/{org_id}/'
        if latitude is not None and longitude is not None:
            lat = float(latitude)
            lon = float(longitude)
            url += f'?ll={lon}%2C{lat}&z={DEFAULT_MAP_ZOOM}'
        else:
            url += f'?z={DEFAULT_MAP_ZOOM}'
        return url

    parts = [p.strip() for p in (company_name, address or '') if p and p.strip()]
    if parts:
        return f'https://yandex.ru/maps/?text={quote(", ".join(parts))}&z=17'
    return ''


def build_map_embed_url(
    address,
    *,
    latitude=None,
    longitude=None,
    company_name='',
    yandex_org_id='',
):
    org_id = str(yandex_org_id or '').strip()
    if org_id:
        # ol=biz + oid — метка и карточка организации (кабинет внутри здания)
        params = [
            f'z={DEFAULT_MAP_ZOOM}',
            'ol=biz',
            f'oid={quote(org_id)}',
            'lang=ru_RU',
        ]
        if latitude is not None and longitude is not None:
            lat = float(latitude)
            lon = float(longitude)
            params.append(f'll={lon}%2C{lat}')
        return f'https://yandex.ru/map-widget/v1/?' + '&'.join(params)

    if latitude is not None and longitude is not None:
        lat = float(latitude)
        lon = float(longitude)
        return (
            f'https://yandex.ru/map-widget/v1/'
            f'?ll={lon}%2C{lat}&z={DEFAULT_MAP_ZOOM}'
            f'&pt={lon}%2C{lat}%2Cpm2orgl'
            f'&l=map&lang=ru_RU'
        )

    parts = [p.strip() for p in (company_name, address or '') if p and p.strip()]
    if not parts:
        return ''
    text = ', '.join(parts)
    return f'https://yandex.ru/map-widget/v1/?mode=search&text={quote(text)}&z=16&l=map'


def resolve_map_embed_url(obj):
    """URL для iframe: принимает только map-widget, иначе строит автоматически."""
    custom = getattr(obj, 'map_embed_url', '') or ''
    if is_embeddable_map_url(custom):
        return custom.strip()
    return build_map_embed_url(
        obj.address,
        latitude=obj.map_latitude,
        longitude=obj.map_longitude,
        company_name=obj.company_name,
        yandex_org_id=obj.map_yandex_org_id,
    )


def resolve_map_page_url(obj):
    """Ссылка «Открыть в Яндекс.Картах» — всегда на карточку org с координатами."""
    custom = (getattr(obj, 'map_embed_url', '') or '').strip()
    if custom and not is_embeddable_map_url(custom) and not is_unreliable_map_share_url(custom):
        if '/maps/org/' in custom:
            return custom

    return build_map_page_url(
        yandex_org_id=obj.map_yandex_org_id,
        latitude=obj.map_latitude,
        longitude=obj.map_longitude,
        address=obj.address,
        company_name=obj.company_name,
    )
