"""Импорт контента с сохранением Lead / SiteVisit / пользователей."""

import shutil
import tempfile
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api import models as api_models
from api.content_transfer import (
    CONTENT_MODEL_CLEAR_ORDER,
    safe_extract_tar,
    validate_content_fixture,
)


class Command(BaseCommand):
    help = (
        'Заменяет контент сайта из каталога export_site_content. '
        'Заявки (Lead), визиты и пользователи не удаляются.'
    )

    def add_arguments(self, parser):
        parser.add_argument('indir', help='Каталог с content.json и media.tar')
        parser.add_argument(
            '--skip-media',
            action='store_true',
            help='Не трогать файлы MEDIA_ROOT (только БД-контент)',
        )

    def handle(self, *args, **options):
        src = Path(options['indir'])
        if not src.is_absolute():
            src = (Path.cwd() / src).resolve()
        fixture = src / 'content.json'
        if not fixture.is_file():
            raise CommandError(f'Нет файла {fixture}')

        self.stdout.write('→ проверка content.json (только контент-модели)…')
        validate_content_fixture(fixture)

        lead_fp_before = list(
            api_models.Lead.objects.order_by('id').values_list('id', 'phone', 'updated_at')
        )
        visit_fp_before = list(
            api_models.SiteVisit.objects.order_by('id').values_list('id', 'ip_address', 'visit_date')
        )

        self.stdout.write('→ очистка контент-моделей (Lead/SiteVisit не трогаем)…')
        with transaction.atomic():
            api_models.ContentPage.objects.all().update(parent=None)
            for name in CONTENT_MODEL_CLEAR_ORDER:
                model = getattr(api_models, name)
                deleted, _ = model.objects.all().delete()
                self.stdout.write(f'   {name}: удалено {deleted}')

            self.stdout.write(f'→ loaddata {fixture}')
            call_command('loaddata', str(fixture), verbosity=1)

        if not options['skip_media']:
            media_tar = src / 'media.tar'
            if not media_tar.is_file():
                self.stdout.write(self.style.WARNING(f'Нет {media_tar} — media пропущена'))
            else:
                media_root = Path(settings.MEDIA_ROOT)
                self.stdout.write(f'→ замена media → {media_root}')
                media_root.mkdir(parents=True, exist_ok=True)
                with tempfile.TemporaryDirectory() as tmp:
                    tmp_path = Path(tmp)
                    safe_extract_tar(media_tar, tmp_path)
                    for child in media_root.iterdir():
                        if child.is_dir():
                            shutil.rmtree(child)
                        else:
                            child.unlink()
                    for item in tmp_path.iterdir():
                        dest = media_root / item.name
                        if item.is_dir():
                            shutil.copytree(item, dest)
                        else:
                            shutil.copy2(item, dest)

        lead_fp_after = list(
            api_models.Lead.objects.order_by('id').values_list('id', 'phone', 'updated_at')
        )
        visit_fp_after = list(
            api_models.SiteVisit.objects.order_by('id').values_list('id', 'ip_address', 'visit_date')
        )
        if lead_fp_after != lead_fp_before:
            raise CommandError(
                'Ошибка: набор заявок изменился после импорта '
                '(ожидались те же id/phone/updated_at). '
                'Возможна подмена content.json — откатите из бэкапа.'
            )
        if visit_fp_after != visit_fp_before:
            raise CommandError(
                'Ошибка: набор визитов изменился после импорта. '
                'Откатите из бэкапа.'
            )

        self.stdout.write(self.style.SUCCESS(
            f'Импорт контента завершён. Заявок сохранено: {len(lead_fp_after)}, '
            f'визитов: {len(visit_fp_after)}.'
        ))
        self.stdout.write('При необходимости: docker compose --profile prerender run --rm prerender')
