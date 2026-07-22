from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from api.catalog_utils import fix_catalog_hierarchy
from api.models import ContentPage, ContentSection

FIXTURE = Path(__file__).resolve().parents[2] / 'fixtures' / 'catalog_default.json'


class Command(BaseCommand):
    help = (
        'Принудительно обновляет разделы и страницы каталога из фикстуры '
        'catalog_default.json (upsert по pk). В отличие от seed_data, '
        'выполняется в любой момент, а не только при пустой базе.\n\n'
        'ВНИМАНИЕ: перезаписывает поля разделов/страниц, у которых pk '
        'совпадает с фикстурой. На проде (DEBUG=False) нужен --force.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--yes', action='store_true',
            help='Не спрашивать подтверждение перед перезаписью.',
        )
        parser.add_argument(
            '--force', action='store_true',
            help='Разрешить запуск при DEBUG=False (осознанно на проде).',
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options['force']:
            raise CommandError(
                'update_catalog на проде (DEBUG=False) запрещён без --force. '
                'Предпочтительнее import_site_content с дев-снимка.'
            )
        if not FIXTURE.exists():
            self.stderr.write(self.style.ERROR(f'Файл фикстуры не найден: {FIXTURE}'))
            return

        if not options['yes']:
            before_sections = ContentSection.objects.count()
            before_pages = ContentPage.objects.count()
            self.stdout.write(
                f'Сейчас в базе: {before_sections} разделов, {before_pages} страниц.'
            )
            answer = input(
                'Загрузить фикстуру catalog_default.json поверх текущих данных? '
                'Это перезапишет содержимое записей с совпадающими id. [y/N]: '
            )
            if answer.strip().lower() not in ('y', 'yes', 'д', 'да'):
                self.stdout.write('Отменено.')
                return

        call_command('loaddata', 'catalog_default', verbosity=0)
        fixed = fix_catalog_hierarchy()

        after_sections = ContentSection.objects.count()
        after_pages = ContentPage.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'Каталог обновлён из фикстуры: {after_sections} разделов, '
            f'{after_pages} страниц. Иерархия поправлена у {fixed} записей.'
        ))
