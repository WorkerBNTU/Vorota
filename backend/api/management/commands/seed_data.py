from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand

from api.catalog_utils import fix_catalog_hierarchy
from api.models import Advantage, ContentSection, HeroSlide, Service, SiteSettings, WorkStep

FIXTURE = Path(__file__).resolve().parents[2] / 'fixtures' / 'catalog_default.json'

# Значения только для первого заполнения пустой БД (не затирают правки из админки).
_SETTINGS_DEFAULTS = {
    'company_name': 'ВоротаРБ',
    'tagline': 'Продажа, монтаж и обслуживание ворот, роллет и автоматики по всей Беларуси',
    'hero_title': 'Купить ворота и роллеты в Беларуси — с замером и доставкой',
    'hero_subtitle': (
        'Продажа, монтаж и обслуживание ворот и роллет. Офис в Минске — работаем по Витебску, '
        'Гомелю, Бресту, Гродно, Могилёву и всей стране. Официальный дилер DoorHan.'
    ),
    'phone': '+375 (29) 888-06-88',
    'email': 'vorotarb@mail.ru',
    'address': '220099 г. Минск, ул. Брестская, 2, каб. 205',
    'footer_description': (
        'ООО «ВоротаРБ» — купить и установить ворота, роллеты, шлагбаумы и гаражные двери '
        'в Беларуси. Официальный дилер DoorHan с 2013 года.'
    ),
    'working_hours': 'Пн–Пт: 9:00–18:00',
    'meta_title': 'Купить ворота в Беларуси — ВоротаРБ | Минск и регионы',
    'meta_description': (
        'Купить ворота, роллеты и автоматику в Беларуси: Минск, Витебск, Гомель, Брест, '
        'Гродно, Могилёв. Продажа, монтаж и обслуживание. Официальный дилер DoorHan — ВоротаРБ.'
    ),
    'legal_entity_name': 'ООО «ВоротаРБ»',
    'unp': '692057005',
    'bank_account': 'BY61ALFA30122643750010270000',
    'bank_name': 'ЗАО «АЛЬФА-Банк»',
    'bank_address': 'г. Минск, ул. Мясникова, 70',
    'bank_bic': 'ALFABY2X',
}


# Поля SEO/hero — обновляются через --refresh-seo без полного --force-settings.
_SEO_REFRESH_FIELDS = (
    'tagline',
    'hero_title',
    'hero_subtitle',
    'footer_description',
    'meta_title',
    'meta_description',
)


class Command(BaseCommand):
    help = (
        'Заполняет базу начальными данными. SiteSettings не перезаписываются, '
        'если поля уже заполнены (безопасный повторный запуск из entrypoint). '
        'Полный сброс настроек: --force-settings. Только SEO/hero: --refresh-seo.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-settings',
            action='store_true',
            help='Перезаписать SiteSettings и legal-тексты дефолтами',
        )
        parser.add_argument(
            '--refresh-seo',
            action='store_true',
            help=(
                'Обновить tagline/hero/meta/footer из актуальных SEO-дефолтов '
                '(Беларусь в H1/title; бренды — во вторичных текстах), без сброса реквизитов и legal'
            ),
        )

    def handle(self, *args, **options):
        force = options['force_settings']
        refresh_seo = options['refresh_seo']
        settings = SiteSettings.load()
        changed = []
        for field, value in _SETTINGS_DEFAULTS.items():
            current = getattr(settings, field, '') or ''
            should_write = force or not str(current).strip()
            if refresh_seo and field in _SEO_REFRESH_FIELDS:
                should_write = True
            if should_write:
                setattr(settings, field, value)
                changed.append(field)
        if changed:
            settings.save(update_fields=changed)
            self.stdout.write(f'Настройки сайта: заполнены поля {", ".join(changed)}')
        else:
            self.stdout.write('Настройки сайта уже заполнены — пропуск (без --force-settings / --refresh-seo)')

        SiteSettings._ensure_legal_defaults(
            SiteSettings.load(),
            refresh_docs=force,
        )
        if force:
            self.stdout.write('Legal-тексты обновлены из шаблонов (--force-settings)')

        if not HeroSlide.objects.exists():
            self.stdout.write('Создайте слайды через админку или загрузите изображения')

        if not ContentSection.objects.exists() and FIXTURE.exists():
            call_command('loaddata', 'catalog_default', verbosity=0)
            fix_catalog_hierarchy()
            self.stdout.write(f'Каталог загружен из фикстуры ({FIXTURE.name})')
        elif ContentSection.objects.exists():
            # Не чиним иерархию на каждом Docker-старте — иначе ручные parent/menu «плывут».
            self.stdout.write('Каталог уже существует — пропуск (hierarchy без --force)')

        services_data = [
            {
                'title': 'Секционные ворота',
                'slug': 'sectional-gates',
                'category': 'gates',
                'icon': '🏠',
                'show_on_home': True,
                'short_description': 'Надёжные секционные ворота с теплоизоляцией для гаражей и складов.',
                'full_description': 'Секционные ворота — оптимальное решение для гаражей и промышленных объектов. Обеспечивают надёжную защиту, отличную теплоизоляцию и плавную работу автоматики.',
                'options': 'DoorHan\nУправление со смартфона\nТеплоизоляция\nАвтоматика под ключ',
                'order': 1,
            },
            {
                'title': 'Откатные ворота',
                'slug': 'sliding-gates',
                'category': 'gates',
                'icon': '↔️',
                'show_on_home': True,
                'short_description': 'Экономия пространства — ворота отъезжают в сторону по рельсам.',
                'full_description': 'Откатные ворота идеальны для узких проездов и участков с ограниченным пространством. Надёжная конструкция, плавный ход, интеграция с домофоном и видеонаблюдением.',
                'options': 'Рельсовые и безрельсовые\nАвтоматика BFT, Nice\nДистанционное управление',
                'order': 2,
            },
            {
                'title': 'Распашные ворота',
                'slug': 'swing-gates',
                'category': 'gates',
                'icon': '🚪',
                'show_on_home': True,
                'short_description': 'Классические распашные ворота с ручным или автоматическим приводом.',
                'full_description': 'Распашные ворота — проверенное временем решение для частных домов и дач. Устанавливаем приводы для автоматического открывания с пульта или смартфона.',
                'options': 'Одно- и двустворчатые\nПриводы CAME, FAAC\nИнтеграция с домофоном',
                'order': 3,
            },
            {
                'title': 'Роллеты',
                'slug': 'roller-shutters',
                'category': 'gates',
                'icon': '🪟',
                'show_on_home': True,
                'short_description': 'Защитные и декоративные роллеты для окон, витрин и гаражей.',
                'full_description': 'Роллетные системы для защиты от взлома, солнца и шума. Ручные и автоматические, с управлением со смартфона.',
                'options': 'Алюминиевые и стальные\nАвтоматика\nРемонт роллет',
                'order': 4,
            },
            {
                'title': 'Монтаж и наладка',
                'slug': 'installation',
                'category': 'install',
                'icon': '🔧',
                'show_on_home': True,
                'short_description': 'Профессиональный монтаж ворот, роллет и автоматики под ключ.',
                'full_description': 'Выполняем полный цикл работ: замер, доставка, монтаж, наладка автоматики и обучение клиента. Гарантия на все виды работ.',
                'options': 'Выезд на замер бесплатно\nМонтаж за 1–2 дня\nГарантия 2 года',
                'order': 5,
            },
            {
                'title': 'Обслуживание и ремонт',
                'slug': 'repair',
                'category': 'service',
                'icon': '⚙️',
                'show_on_home': True,
                'short_description': 'Ремонт ворот, роллет, автоматики и шлагбаумов любой сложности.',
                'full_description': 'Оперативный ремонт и плановое обслуживание. Замена пружин, роликов, приводов, плат управления. Выезд мастера в день обращения.',
                'options': 'Ремонт автоматики\nЗамена комплектующих\nПлановое ТО',
                'order': 6,
            },
            {
                'title': 'Шлагбаумы',
                'slug': 'barriers',
                'category': 'barriers',
                'icon': '🚧',
                'show_on_home': True,
                'short_description': 'Шлагбаумы DoorHan, BFT и других брендов с установкой и обслуживанием.',
                'full_description': 'Поставляем и устанавливаем шлагбаумы для парковок, ЖК и предприятий. Интеграция с системами контроля доступа, пультами и приложениями.',
                'options': 'DoorHan, BFT (Италия)\nСтрелы 3–6 м\nСКУД интеграция',
                'order': 7,
            },
            {
                'title': 'Гаражные двери',
                'slug': 'garage-doors',
                'category': 'doors',
                'icon': '🏡',
                'show_on_home': True,
                'short_description': 'Гаражные двери, повторяющие ворота по структуре, цвету и теплоизоляции.',
                'full_description': 'Гаражные двери в едином стиле с воротами — идеальное решение для современного дома. Выбор фактур, цветов RAL, уровней теплоизоляции.',
                'options': 'Подбор по образцу ворот\nЛюбые цвета RAL\nТеплоизоляция',
                'order': 8,
            },
        ]

        for data in services_data:
            Service.objects.get_or_create(slug=data['slug'], defaults=data)

        advantages = [
            ('Официальный дилер DoorHan', 'Работаем с 2013 года — только оригинальное оборудование без посредников.', '🏆', 1),
            ('Филиалы по всей Беларуси', 'Собственное производство, склады и выездные бригады.', '📍', 2),
            ('Бесплатный замер', 'Выезд специалиста и расчёт стоимости без обязательств.', '✅', 3),
            ('Управление с телефона', 'Настраиваем управление воротами и шлагбаумами со смартфона.', '📱', 4),
        ]
        for title, desc, icon, order in advantages:
            Advantage.objects.get_or_create(title=title, defaults={'description': desc, 'icon': icon, 'order': order})

        steps = [
            (1, 'Заявка', 'Оставьте заявку на сайте или позвоните — перезвоним в ближайшее время.', 1),
            (2, 'Замер и расчёт', 'Бесплатный выезд специалиста, точный расчёт стоимости.', 2),
            (3, 'Монтаж', 'Доставка и установка в удобное для вас время.', 3),
            (4, 'Сдача объекта', 'Наладка автоматики, обучение и гарантийное обслуживание.', 4),
        ]
        for num, title, desc, order in steps:
            WorkStep.objects.get_or_create(step_number=num, defaults={'title': title, 'description': desc, 'order': order})

        self.stdout.write(self.style.SUCCESS('Начальные данные успешно загружены'))
