"""Безопасная распаковка media.tar в MEDIA_ROOT (защита от tar slip)."""

import shutil
import tempfile
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from api.content_transfer import safe_extract_tar


class Command(BaseCommand):
    help = 'Распаковать media.tar в MEDIA_ROOT с проверкой путей (для import_content.sh).'

    def add_arguments(self, parser):
        parser.add_argument('tar_path', help='Путь к media.tar')
        parser.add_argument(
            '--replace',
            action='store_true',
            help='Очистить MEDIA_ROOT перед распаковкой',
        )

    def handle(self, *args, **options):
        tar_path = Path(options['tar_path'])
        if not tar_path.is_file():
            raise CommandError(f'Нет файла {tar_path}')

        media_root = Path(settings.MEDIA_ROOT)
        media_root.mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            safe_extract_tar(tar_path, tmp_path)
            if options['replace']:
                for child in media_root.iterdir():
                    if child.is_dir():
                        shutil.rmtree(child)
                    else:
                        child.unlink()
            for item in tmp_path.iterdir():
                dest = media_root / item.name
                if dest.exists():
                    if dest.is_dir():
                        shutil.rmtree(dest)
                    else:
                        dest.unlink()
                if item.is_dir():
                    shutil.copytree(item, dest)
                else:
                    shutil.copy2(item, dest)

        self.stdout.write(self.style.SUCCESS(f'Media распакована в {media_root}'))
