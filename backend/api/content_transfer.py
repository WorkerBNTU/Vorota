"""Модели публичного контента сайта (без CRM / визитов / auth)."""

import json
import os
import tarfile
from pathlib import Path

from django.core.management.base import CommandError

# Порядок важен для dumpdata (FK: section → page → images).
CONTENT_DUMP_LABELS = [
    'api.SiteSettings',
    'api.HeroSlide',
    'api.Service',
    'api.Advantage',
    'api.WorkStep',
    'api.PortfolioItem',
    'api.ContentSection',
    'api.ContentPage',
    'api.ContentPageImage',
]

# Модели, которые import очищает перед loaddata (заявки и визиты не трогаем).
CONTENT_MODEL_CLEAR_ORDER = [
    'ContentPageImage',
    'ContentPage',
    'ContentSection',
    'PortfolioItem',
    'WorkStep',
    'Advantage',
    'Service',
    'HeroSlide',
    'SiteSettings',
]


def normalize_model_label(label: str) -> str:
    app, _, model = label.partition('.')
    return f'{app}.{model.lower()}'


ALLOWED_FIXTURE_MODELS = {normalize_model_label(x) for x in CONTENT_DUMP_LABELS}


def validate_content_fixture(path: Path) -> list:
    """Читает content.json и гарантирует, что внутри только контент-модели."""
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except json.JSONDecodeError as exc:
        raise CommandError(f'Невалидный JSON в {path}: {exc}') from exc
    if not isinstance(data, list):
        raise CommandError(f'{path}: ожидается список объектов dumpdata')
    found = set()
    for i, obj in enumerate(data):
        if not isinstance(obj, dict) or 'model' not in obj:
            raise CommandError(f'{path}: элемент [{i}] без поля model')
        label = normalize_model_label(str(obj['model']))
        found.add(label)
        if label not in ALLOWED_FIXTURE_MODELS:
            raise CommandError(
                f'{path}: запрещённая модель «{obj["model"]}». '
                f'Разрешены только: {", ".join(sorted(ALLOWED_FIXTURE_MODELS))}'
            )
    return data


def safe_extract_tar(tar_path: Path, dest: Path) -> None:
    """Распаковка media.tar без path traversal (tar slip)."""
    dest = dest.resolve()
    dest.mkdir(parents=True, exist_ok=True)
    with tarfile.open(tar_path, 'r') as tar:
        for member in tar.getmembers():
            name = member.name.replace('\\', '/')
            if name.startswith('/') or name.startswith('..') or '/../' in f'/{name}/':
                raise CommandError(f'Небезопасный путь в tar: {member.name}')
            target = (dest / name).resolve()
            if target != dest and not str(target).startswith(str(dest) + os.sep):
                raise CommandError(f'Небезопасный путь в tar: {member.name}')
        # Python 3.12+: filter='data' дополнительно блокирует symlink-атаки
        if hasattr(tarfile, 'data_filter'):
            tar.extractall(dest, filter='data')
        else:
            tar.extractall(dest)
