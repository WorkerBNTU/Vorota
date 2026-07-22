"""Библиотека уже загруженных изображений (media/) для админки.

Позволяет при загрузке нового слайда/товара/услуги и т.п. выбрать файл,
который уже когда-то был загружен на сервер (например, то же самое фото
модели ворот использовано в каталоге и в портфолио), вместо повторной
загрузки того же файла заново. Отдельной таблицы для этого не заводим —
просто читаем содержимое MEDIA_ROOT на диске, т.к. все загруженные
изображения и так лежат там по ImageField-полям моделей.
"""
import os
from datetime import datetime, timezone as dt_timezone

from django.conf import settings

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'}


def list_media_images(request):
    """Список всех картинок в MEDIA_ROOT, новые сверху."""
    media_root = str(settings.MEDIA_ROOT)
    items = []
    if os.path.isdir(media_root):
        for root, _dirs, files in os.walk(media_root):
            for name in files:
                ext = os.path.splitext(name)[1].lower()
                if ext not in IMAGE_EXTENSIONS:
                    continue
                full_path = os.path.join(root, name)
                try:
                    stat = os.stat(full_path)
                except OSError:
                    continue
                rel_path = os.path.relpath(full_path, media_root).replace(os.sep, '/')
                items.append({
                    'path': rel_path,
                    'url': request.build_absolute_uri(settings.MEDIA_URL + rel_path),
                    'size': stat.st_size,
                    'modified_at': datetime.fromtimestamp(stat.st_mtime, tz=dt_timezone.utc).isoformat(),
                })
    items.sort(key=lambda item: item['modified_at'], reverse=True)
    return items


def resolve_library_path(raw_path):
    """Проверяет путь к файлу, присланный клиентом при выборе "из уже
    загруженных": файл должен реально существовать внутри MEDIA_ROOT (без
    выхода за его пределы через "..") и быть картинкой. Возвращает
    безопасный относительный путь либо None, если что-то не так.
    """
    if not raw_path:
        return None
    media_root = os.path.normpath(str(settings.MEDIA_ROOT))
    full_path = os.path.normpath(os.path.join(media_root, str(raw_path).lstrip('/')))
    if full_path != media_root and not full_path.startswith(media_root + os.sep):
        return None
    if not os.path.isfile(full_path):
        return None
    if os.path.splitext(full_path)[1].lower() not in IMAGE_EXTENSIONS:
        return None
    return os.path.relpath(full_path, media_root).replace(os.sep, '/')
