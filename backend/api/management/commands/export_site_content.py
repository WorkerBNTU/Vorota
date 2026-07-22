"""Экспорт только контента сайта + media (без Lead / SiteVisit / users)."""

import tarfile
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from api.content_transfer import CONTENT_DUMP_LABELS


class Command(BaseCommand):
    help = (
        'Выгрузка контента (настройки, каталог, главная, портфолио) и media. '
        'Заявки CRM и визиты не входят — безопасно для переноса на прод.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'outdir',
            nargs='?',
            default='',
            help='Каталог выгрузки (по умолчанию backups/content-YYYYMMDD-HHMMSS)',
        )

    def handle(self, *args, **options):
        root = Path(settings.BASE_DIR).resolve().parent
        out = Path(options['outdir']) if options['outdir'] else (
            root / 'backups' / f"content-{timezone.now().strftime('%Y%m%d-%H%M%S')}"
        )
        if not out.is_absolute():
            out = (Path.cwd() / out).resolve()
        out.mkdir(parents=True, exist_ok=True)

        fixture = out / 'content.json'
        self.stdout.write(f'→ dumpdata → {fixture}')
        with fixture.open('w', encoding='utf-8') as fh:
            call_command(
                'dumpdata',
                *CONTENT_DUMP_LABELS,
                indent=2,
                stdout=fh,
            )

        media_root = Path(settings.MEDIA_ROOT)
        media_tar = out / 'media.tar'
        self.stdout.write(f'→ media → {media_tar}')
        with tarfile.open(media_tar, 'w') as tar:
            if media_root.is_dir():
                for path in sorted(media_root.rglob('*')):
                    if path.is_file():
                        tar.add(path, arcname=str(path.relative_to(media_root)).replace('\\', '/'))

        readme = out / 'README.txt'
        readme.write_text(
            'ВоротаРБ: экспорт только контента (без Lead/SiteVisit/users)\n'
            f'Создано: {timezone.now().isoformat()}\n'
            f'Импорт: python manage.py import_site_content {out}\n'
            'или: bash scripts/import_site_content.sh ' + str(out) + '\n',
            encoding='utf-8',
        )
        self.stdout.write(self.style.SUCCESS(f'Готово: {out}'))
        if not fixture.stat().st_size:
            raise CommandError('content.json пустой — проверьте модели')
