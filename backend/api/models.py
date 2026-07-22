from django.db import models
from django.utils import timezone


class SiteSettings(models.Model):
    company_name = models.CharField('Название компании', max_length=200, default='ВоротаРБ')
    tagline = models.CharField('Слоган', max_length=300, default='Современные ворота и автоматика под ключ')
    logo = models.ImageField('Логотип', upload_to='site/', blank=True, null=True)
    hero_title = models.CharField('Заголовок главной', max_length=300, default='Современные ворота и автоматика под ключ — от установки до управления со смартфона')
    hero_subtitle = models.TextField('Подзаголовок главной', default='Продаём, монтируем, налаживаем и обслуживаем ворота и роллеты всех видов')
    hero_badge = models.CharField(
        'Бейдж над заголовком главной', max_length=120, blank=True,
        default='Официальный дилер DoorHan, BFT',
        help_text='Короткая строка над H1 на первом экране. Если пусто — бейдж не показывается.',
    )
    phone = models.CharField('Телефон', max_length=30, default='+375 (29) 888-06-88')
    email = models.EmailField('Email', default='vorotarb@mail.ru')
    address = models.CharField('Адрес', max_length=300, default='г. Минск, ул. Брестская, 2, каб. 205')
    # Необязательное ручное переопределение — по умолчанию карта строится
    # автоматически по полю address (см. api.map_utils.build_map_embed_url
    # и SiteSettingsSerializer.get_map_url). Заполняйте, только если нужна
    # своя ссылка (например, карта из Яндекс.Конструктора с кастомной меткой).
    map_embed_url = models.URLField(
        'Ссылка на карту (необязательно)', blank=True,
        help_text=(
            'Необязательно. Короткие ссылки maps/-/... не используются — укажите ID организации ниже. '
            'Можно вставить готовый embed: yandex.ru/map-widget/v1/...'
        ),
    )
    map_latitude = models.DecimalField(
        'Широта для метки на карте', max_digits=9, decimal_places=6,
        null=True, blank=True,
        help_text='Необязательно. Если указаны широта и долгота — на карте будет метка организации.',
    )
    map_longitude = models.DecimalField(
        'Долгота для метки на карте', max_digits=9, decimal_places=6,
        null=True, blank=True,
    )
    map_yandex_org_id = models.CharField(
        'ID организации в Яндекс.Картах', max_length=20, blank=True,
        default='54736687390',
        help_text='Число из ссылки yandex.ru/maps/org/.../54736687390 — карта с карточкой организации.',
    )
    whatsapp = models.CharField('WhatsApp', max_length=30, blank=True, default='')
    telegram = models.CharField('Telegram', max_length=50, blank=True, default='')
    footer_description = models.TextField('Описание в подвале', default='Продажа, монтаж и обслуживание ворот, роллет, шлагбаумов и гаражных дверей. Официальный дилер DoorHan и BFT.')
    working_hours = models.CharField('Часы работы', max_length=100, default='Пн–Сб: 9:00–19:00')
    meta_title = models.CharField(
        'SEO: заголовок главной (title)', max_length=70, blank=True,
        help_text='Показывается во вкладке браузера и в выдаче поисковиков. Рекомендуется 50–60 символов. Если пусто — используется слоган.',
    )
    meta_description = models.CharField(
        'SEO: описание главной (meta description)', max_length=200, blank=True,
        help_text='Текст сниппета в поисковой выдаче. Рекомендуется 150–160 символов. Если пусто — используется описание в подвале.',
    )
    yandex_metrika_id = models.CharField(
        'ID счётчика Яндекс.Метрики', max_length=20, blank=True,
        help_text='Только номер счётчика (например, 12345678) — из metrika.yandex.ru. Если пусто, счётчик не подключается.',
    )
    google_analytics_id = models.CharField(
        'ID Google Analytics (GA4)', max_length=20, blank=True,
        help_text='Measurement ID вида G-XXXXXXXXXX из analytics.google.com. Если пусто, аналитика не подключается.',
    )

    # --- Правовая информация (футер, /legal/*, согласие в форме) ---
    legal_entity_name = models.CharField(
        'Юридическое наименование', max_length=300, blank=True,
        default='ООО «ВоротаРБ»',
        help_text='Как в футере и документах: ООО «…». Если пусто — используется название компании.',
    )
    unp = models.CharField(
        'УНП', max_length=20, blank=True,
        help_text='Учётный номер плательщика. Показывается в подвале сайта.',
    )
    bank_account = models.CharField(
        'Расчётный счёт (IBAN)', max_length=34, blank=True,
        help_text='Например BY61ALFA…',
    )
    bank_name = models.CharField('Банк', max_length=200, blank=True)
    bank_address = models.CharField('Адрес банка', max_length=300, blank=True)
    bank_bic = models.CharField('BIC / БИК банка', max_length=20, blank=True)
    copyright_extra = models.TextField(
        'Доп. текст об авторских правах', blank=True,
        help_text='Строка под © … вроде «копирование только после согласования».',
    )
    price_disclaimer = models.TextField(
        'Дисклеймер о ценах / оферте', blank=True,
        help_text='Общий текст со звёздочкой внизу сайта (не публичная оферта, цены ориентировочные).',
    )
    privacy_policy = models.TextField('Политика конфиденциальности', blank=True)
    privacy_updated_at = models.DateField(
        'Дата обновления политики', null=True, blank=True,
    )
    terms_of_use = models.TextField('Пользовательское соглашение', blank=True)
    terms_updated_at = models.DateField(
        'Дата обновления соглашения', null=True, blank=True,
    )
    cookie_policy = models.TextField('Политика cookie', blank=True)
    cookie_updated_at = models.DateField(
        'Дата обновления политики cookie', null=True, blank=True,
    )
    consent_checkbox_label = models.CharField(
        'Текст чекбокса согласия в форме', max_length=500, blank=True,
        help_text='Краткая формулировка рядом с галочкой. По Закону № 99-З галочка не ставится заранее.',
    )

    class Meta:
        verbose_name = 'Настройки сайта'
        verbose_name_plural = 'Настройки сайта'

    def __str__(self):
        return self.company_name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        needs_legal = (
            created
            or not obj.privacy_policy
            or 'указать в админке' in (obj.privacy_policy or '')
            or 'заполните' in (obj.privacy_policy or '').lower()
        )
        if needs_legal or not obj.unp or not obj.bank_account:
            cls._ensure_legal_defaults(obj, refresh_docs=needs_legal or not obj.privacy_policy)
        return obj

    @classmethod
    def _ensure_legal_defaults(cls, obj, refresh_docs=False):
        """Заполняет пустые правовые поля шаблонами (не перетирает правки админа,
        кроме устаревших плейсхолдеров «указать в админке»)."""
        from django.conf import settings as dj_settings

        from .legal_defaults import (
            DEFAULT_BANK_ACCOUNT,
            DEFAULT_BANK_ADDRESS,
            DEFAULT_BANK_BIC,
            DEFAULT_BANK_NAME,
            DEFAULT_CONSENT_CHECKBOX_LABEL,
            DEFAULT_COPYRIGHT_EXTRA,
            DEFAULT_PRICE_DISCLAIMER,
            DEFAULT_UNP,
            default_cookie_policy,
            default_privacy_policy,
            default_terms_of_use,
        )

        changed = []
        if not obj.unp:
            obj.unp = DEFAULT_UNP
            changed.append('unp')
        if not obj.bank_account:
            obj.bank_account = DEFAULT_BANK_ACCOUNT
            changed.append('bank_account')
        if not obj.bank_name:
            obj.bank_name = DEFAULT_BANK_NAME
            changed.append('bank_name')
        if not obj.bank_address:
            obj.bank_address = DEFAULT_BANK_ADDRESS
            changed.append('bank_address')
        if not obj.bank_bic:
            obj.bank_bic = DEFAULT_BANK_BIC
            changed.append('bank_bic')
        if not obj.price_disclaimer:
            obj.price_disclaimer = DEFAULT_PRICE_DISCLAIMER
            changed.append('price_disclaimer')
        if not obj.copyright_extra:
            obj.copyright_extra = DEFAULT_COPYRIGHT_EXTRA
            changed.append('copyright_extra')
        if not obj.consent_checkbox_label:
            obj.consent_checkbox_label = DEFAULT_CONSENT_CHECKBOX_LABEL
            changed.append('consent_checkbox_label')

        should_refresh_privacy = refresh_docs or not obj.privacy_policy or (
            'указать в админке' in (obj.privacy_policy or '')
        )
        if should_refresh_privacy:
            obj.privacy_policy = default_privacy_policy(
                company_name=obj.company_name,
                legal_entity=obj.legal_entity_name,
                unp=obj.unp or DEFAULT_UNP,
                address=obj.address,
                email=obj.email,
                phone=obj.phone,
                site_url=getattr(dj_settings, 'SITE_URL', 'https://vorota-rb.by'),
                bank_account=obj.bank_account or DEFAULT_BANK_ACCOUNT,
                bank_name=obj.bank_name or DEFAULT_BANK_NAME,
                bank_address=obj.bank_address or DEFAULT_BANK_ADDRESS,
                bank_bic=obj.bank_bic or DEFAULT_BANK_BIC,
            )
            obj.privacy_updated_at = timezone.localdate()
            changed.extend(['privacy_policy', 'privacy_updated_at'])
        if refresh_docs or not obj.terms_of_use:
            obj.terms_of_use = default_terms_of_use(
                company_name=obj.company_name,
                legal_entity=obj.legal_entity_name,
                site_url=getattr(dj_settings, 'SITE_URL', 'https://vorota-rb.by'),
            )
            obj.terms_updated_at = timezone.localdate()
            changed.extend(['terms_of_use', 'terms_updated_at'])
        if refresh_docs or not obj.cookie_policy:
            obj.cookie_policy = default_cookie_policy(
                company_name=obj.company_name,
                legal_entity=obj.legal_entity_name,
            )
            obj.cookie_updated_at = timezone.localdate()
            changed.extend(['cookie_policy', 'cookie_updated_at'])
        if changed:
            obj.save(update_fields=list(dict.fromkeys(changed)))


class HeroSlide(models.Model):
    title = models.CharField('Заголовок', max_length=200, blank=True)
    # blank/null, а не обязательное: при создании через выбор "из уже
    # загруженных" (см. AdminModelViewSet.image_library_fields) файл в
    # запросе не передаётся — картинка проставляется отдельным шагом уже
    # после сохранения. Обязательность на уровне UI (форма админки).
    image = models.ImageField('Изображение', upload_to='hero/', blank=True, null=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    is_active = models.BooleanField('Активен', default=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Слайд'
        verbose_name_plural = 'Слайды'


class ServiceCategory(models.TextChoices):
    GATES = 'gates', 'Ворота и роллеты'
    INSTALL = 'install', 'Монтаж и наладка'
    SERVICE = 'service', 'Обслуживание и ремонт'
    BARRIERS = 'barriers', 'Шлагбаумы'
    DOORS = 'doors', 'Гаражные двери'


class Service(models.Model):
    title = models.CharField('Название', max_length=200)
    slug = models.SlugField('URL', unique=True)
    category = models.CharField('Категория', max_length=20, choices=ServiceCategory.choices)
    short_description = models.TextField('Краткое описание')
    full_description = models.TextField('Полное описание')
    options = models.TextField('Опции (по строке)', blank=True, help_text='Каждая опция с новой строки')
    image = models.ImageField('Изображение', upload_to='services/', blank=True, null=True)
    icon = models.CharField('Иконка (emoji)', max_length=10, default='🚪')
    order = models.PositiveIntegerField('Порядок', default=0)
    is_active = models.BooleanField('Активна', default=True)
    show_on_home = models.BooleanField('Показывать на главной', default=False)

    class Meta:
        ordering = ['order']
        verbose_name = 'Услуга'
        verbose_name_plural = 'Услуги'


class Advantage(models.Model):
    title = models.CharField('Заголовок', max_length=100)
    description = models.TextField('Описание')
    icon = models.CharField('Иконка', max_length=10, default='✓')
    image = models.ImageField('Изображение', upload_to='advantages/', blank=True, null=True)
    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'Преимущество'
        verbose_name_plural = 'Преимущества'


class WorkStep(models.Model):
    step_number = models.PositiveIntegerField('Номер шага')
    title = models.CharField('Заголовок', max_length=100)
    description = models.TextField('Описание')
    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'Шаг работы'
        verbose_name_plural = 'Как мы работаем'


class PortfolioCategory(models.TextChoices):
    GATES = 'gates', 'Ворота'
    BARRIERS = 'barriers', 'Шлагбаумы'
    DOORS = 'doors', 'Гаражные двери'
    REPAIR = 'repair', 'Ремонт'


class PortfolioItem(models.Model):
    title = models.CharField('Название', max_length=200)
    category = models.CharField('Категория', max_length=20, choices=PortfolioCategory.choices)
    description = models.TextField('Описание')
    # blank/null по той же причине, что и у HeroSlide.image выше.
    image = models.ImageField('Фото', upload_to='portfolio/', blank=True, null=True)
    image_before = models.ImageField('Фото до (ремонт)', upload_to='portfolio/before/', blank=True, null=True)
    image_after = models.ImageField('Фото после (ремонт)', upload_to='portfolio/after/', blank=True, null=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    is_active = models.BooleanField('Активен', default=True)
    created_at = models.DateTimeField('Дата', auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Пример работы'
        verbose_name_plural = 'Примеры работ'


class ContentSection(models.Model):
    """Раздел каталога (пункт верхнего меню).

    ВАЖНО: `slug` раздела — это только идентификатор для меню/фильтров,
    он НЕ обязан совпадать с префиксом `ContentPage.slug` его страниц.
    Например, у раздела slug='company' страницы имеют префикс
    'o-kompanii/...', у 'kovanie' — 'kovanie-izdeliya/...', у 'peregruzka' —
    'peregruzochnoe-oborudovanie/...'. Реальный URL страницы каталога — это
    всегда `ContentPage.slug` целиком (см. `/catalog/*` роут на фронтенде и
    `entry_slug` в ContentSectionSerializer). Не пытайтесь строить ссылки
    как `section.slug + '/...'` — используйте `entry_slug` раздела или
    `ContentPage.slug` конкретной страницы.
    """

    slug = models.SlugField('URL', unique=True, max_length=80)
    title = models.CharField('Название', max_length=200)
    description = models.TextField('Описание', blank=True)
    icon = models.CharField('Иконка', max_length=10, default='📁')
    order = models.PositiveIntegerField('Порядок', default=0)
    show_in_menu = models.BooleanField('В меню', default=True)
    is_active = models.BooleanField('Активен', default=True)

    class Meta:
        ordering = ['order', 'title']
        verbose_name = 'Раздел каталога'
        verbose_name_plural = 'Разделы каталога'

    def __str__(self):
        return self.title


class ContentPage(models.Model):
    class PageType(models.TextChoices):
        OVERVIEW = 'overview', 'Обзор'
        PAGE = 'page', 'Страница'
        PRODUCT = 'product', 'Товар'
        SERVICE = 'service', 'Услуга'
        ARTICLE = 'article', 'Статья'
        # Три спецтипа ниже используют тот же текстовый markdown в content,
        # но фронтенд (frontend/src/pages/CatalogPage.jsx +
        # frontend/src/utils/feedContent.js) разбирает его на отдельные
        # карточки/пункты ленты вместо сплошного текста. Формат разметки
        # для каждого типа объяснён прямо в подсказке над редактором в
        # админке (frontend/src/admin/AdminCatalog.jsx).
        NEWS = 'news', 'Новости (лента)'
        PROMOTIONS = 'promotions', 'Акции (лента)'
        TESTIMONIALS = 'testimonials', 'Отзывы (карточки)'

    section = models.ForeignKey(
        ContentSection, on_delete=models.CASCADE, related_name='pages', verbose_name='Раздел'
    )
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='children', verbose_name='Родитель'
    )
    slug = models.CharField('Полный URL-путь', max_length=300, unique=True)
    title = models.CharField('Заголовок', max_length=300)
    page_type = models.CharField(
        'Тип', max_length=20, choices=PageType.choices, default=PageType.PAGE
    )
    content = models.TextField('Содержимое (Markdown)', blank=True)
    excerpt = models.TextField('Краткое описание', blank=True)
    price = models.DecimalField('Цена', max_digits=12, decimal_places=2, null=True, blank=True)
    manufacturer = models.CharField('Производитель', max_length=200, blank=True)
    model = models.CharField('Модель', max_length=200, blank=True)
    availability = models.CharField('Наличие', max_length=100, blank=True)
    image = models.ImageField('Изображение', upload_to='catalog/', blank=True, null=True)
    external_image_url = models.URLField('Внешнее изображение', blank=True, max_length=500)
    show_in_menu = models.BooleanField('В меню', default=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    is_active = models.BooleanField('Активна', default=True)
    meta_title = models.CharField(
        'SEO: заголовок (title)', max_length=70, blank=True,
        help_text='Рекомендуется 50–60 символов. Если пусто — используется «Заголовок».',
    )
    meta_description = models.CharField(
        'SEO: описание (meta description)', max_length=200, blank=True,
        help_text='Текст сниппета в поисковой выдаче. Рекомендуется 150–160 символов. Если пусто — используется «Краткое описание».',
    )
    # default (а не auto_now) — чтобы фикстуры без явного updated_at не падали
    # на NOT NULL (при загрузке фикстур auto_now/pre_save не вызывается,
    # применяется только default). Обновление при обычном сохранении делаем
    # вручную в save().
    updated_at = models.DateTimeField('Дата изменения', default=timezone.now)

    class Meta:
        ordering = ['order', 'title']
        verbose_name = 'Страница каталога'
        verbose_name_plural = 'Страницы каталога'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # auto_now не используется (см. комментарий у поля) — обновляем
        # вручную при обычном сохранении. Фикстуры (raw-save) этот save()
        # не вызывают, поэтому там работает только default.
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def url_path(self):
        """Полный путь страницы для роутинга (`/catalog/<url_path>`).

        Это всегда `self.slug` целиком: раздел (`section.slug`) — лишь
        логическая группировка для меню и НЕ является префиксом URL
        страницы (см. docstring ContentSection). Раньше здесь ошибочно
        отрезался `section.slug + '/'`, что работало только для разделов,
        где slug раздела совпадает с префиксом страниц.
        """
        return self.slug


class ContentPageImage(models.Model):
    """Изображение, привязанное к странице каталога с конкретной ролью в UI.

    Основная обложка страницы (карточка в сетке, баннер в шапке) — в
    `ContentPage.image`. Здесь только «служебные» фото с ролью:
    avatar — фото автора отзыва, feed — иллюстрация пункта новости/акции,
    variant — цвет/комплектация товара, inline — иллюстрации внутри контента
    (сертификаты, схемы и т.п.). Без роли generic-блок «Фото» не показывается.
    """

    class Role(models.TextChoices):
        AVATAR = 'avatar', 'Аватар отзыва'
        FEED = 'feed', 'Иллюстрация новости/акции'
        VARIANT = 'variant', 'Вариант товара (цвет, вид)'
        INLINE = 'inline', 'В тексте страницы'

    page = models.ForeignKey(
        ContentPage, on_delete=models.CASCADE, related_name='gallery_images', verbose_name='Страница'
    )
    image = models.ImageField('Изображение', upload_to='catalog_gallery/', blank=True, null=True)
    external_image_url = models.URLField('Внешнее изображение', blank=True, max_length=500)
    role = models.CharField(
        'Роль на странице', max_length=20, choices=Role.choices, blank=True,
        help_text='Определяет, где на странице показывается изображение (не generic-галерея).',
    )
    caption = models.CharField('Подпись', max_length=200, blank=True)
    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Изображение галереи'
        verbose_name_plural = 'Изображения галереи'

    def __str__(self):
        return self.caption or f'Фото #{self.pk} ({self.page.title})'


class SiteVisit(models.Model):
    ip_address = models.GenericIPAddressField('IP-адрес')
    visit_date = models.DateField('Дата визита')
    visited_at = models.DateTimeField('Время визита', auto_now_add=True)
    path = models.CharField('Страница', max_length=300, blank=True, default='/')
    referer = models.CharField('Реферер', max_length=500, blank=True)
    user_agent = models.CharField('User-Agent', max_length=500, blank=True)

    class Meta:
        ordering = ['-visited_at']
        verbose_name = 'Посещение'
        verbose_name_plural = 'Посещения'
        constraints = [
            models.UniqueConstraint(
                fields=['ip_address', 'visit_date'],
                name='unique_visit_per_ip_per_day',
            ),
        ]

    def __str__(self):
        return f'{self.ip_address} — {self.visited_at:%d.%m.%Y %H:%M}'


class LeadStatus(models.TextChoices):
    NEW = 'new', 'Новая'
    IN_PROGRESS = 'in_progress', 'В работе'
    COMPLETED = 'completed', 'Завершена'
    REJECTED = 'rejected', 'Отказ'


class LeadDriveType(models.TextChoices):
    ELECTRIC = 'electric', 'С электроприводом'
    MANUAL = 'manual', 'Ручные'
    UNKNOWN = 'unknown', 'Пока не знаю'


class Lead(models.Model):
    name = models.CharField('Имя', max_length=100)
    phone = models.CharField('Телефон', max_length=20)
    message = models.TextField('Сообщение', blank=True)
    source = models.CharField('Источник', max_length=100, blank=True, default='сайт')
    # Необязательные параметры объекта — заполняются, если клиент раскрыл
    # блок «Уточнить параметры» в форме заявки.
    city = models.CharField('Город', max_length=100, blank=True)
    interest = models.CharField('Интерес / услуга', max_length=200, blank=True)
    opening_width = models.CharField('Ширина проёма', max_length=40, blank=True)
    opening_height = models.CharField('Высота проёма', max_length=40, blank=True)
    drive_type = models.CharField(
        'Тип привода', max_length=20, blank=True, choices=LeadDriveType.choices,
    )
    # Фиксация согласия по Закону № 99-З (факт + время для доказательной базы)
    privacy_consent = models.BooleanField('Согласие на обработку ПДн', default=False)
    privacy_consent_at = models.DateTimeField('Время согласия на ПДн', null=True, blank=True)
    status = models.CharField('Статус', max_length=20, choices=LeadStatus.choices, default=LeadStatus.NEW)
    internal_notes = models.TextField('Внутренние заметки', blank=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Заявка'
        verbose_name_plural = 'Заявки'

    def details_summary(self):
        """Короткий текст параметров для Telegram и CRM."""
        parts = []
        if self.interest:
            parts.append(f'Интерес: {self.interest}')
        if self.city:
            parts.append(f'Город: {self.city}')
        size = ' × '.join(x for x in (self.opening_width, self.opening_height) if x)
        if size:
            parts.append(f'Проём: {size}')
        if self.drive_type:
            parts.append(f'Привод: {self.get_drive_type_display()}')
        return '\n'.join(parts)
