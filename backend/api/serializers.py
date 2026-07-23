import re

from rest_framework import serializers

from .catalog_utils import get_section_root
from .form_coercion import AdminFormSerializerMixin
from .map_utils import resolve_map_embed_url, resolve_map_page_url, is_embeddable_map_url
from .middleware import sanitize_text, validate_phone
from .models import (
    Advantage,
    ContentPage,
    ContentPageImage,
    ContentSection,
    HeroSlide,
    Lead,
    LeadDriveType,
    PortfolioItem,
    Service,
    SiteSettings,
    SiteVisit,
    WorkStep,
)
from .public_urls import media_field_url, public_absolute_url
from .services import captcha_required, mark_lead_submitted, verify_captcha


class SiteSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    map_url = serializers.SerializerMethodField()
    map_page_url = serializers.SerializerMethodField()
    # Публичный origin из Django SITE_URL — для canonical/JSON-LD на фронте
    # (не window.location: иначе prerender пишет http://frontend).
    site_url = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = [
            'company_name', 'tagline', 'logo', 'logo_url', 'hero_title', 'hero_subtitle',
            'hero_badge',
            'phone', 'email', 'address', 'map_embed_url', 'map_latitude', 'map_longitude',
            'map_yandex_org_id', 'map_url', 'map_page_url', 'whatsapp', 'telegram',
            'footer_description', 'working_hours', 'meta_title', 'meta_description',
            'yandex_metrika_id', 'google_analytics_id',
            'legal_entity_name', 'unp',
            'bank_account', 'bank_name', 'bank_address', 'bank_bic',
            'copyright_extra', 'price_disclaimer',
            'privacy_policy', 'privacy_updated_at',
            'terms_of_use', 'terms_updated_at',
            'cookie_policy', 'cookie_updated_at',
            'consent_checkbox_label',
            'site_url',
        ]
        # Не отдаём FileField в JSON: DRF делает build_absolute_uri(Host) и
        # ломает prerender/тест на Host=frontend. Читают logo_url (SITE_URL).
        extra_kwargs = {'logo': {'write_only': True}}

    def get_logo_url(self, obj):
        return media_field_url(obj.logo) if obj.logo else None

    def get_map_url(self, obj):
        return resolve_map_embed_url(obj)

    def get_map_page_url(self, obj):
        return resolve_map_page_url(obj)

    def get_site_url(self, obj):
        from django.conf import settings as dj_settings
        return (getattr(dj_settings, 'SITE_URL', '') or '').rstrip('/')

    def validate_yandex_metrika_id(self, value):
        value = (value or '').strip()
        if not value:
            return ''
        if not re.fullmatch(r'\d{1,12}', value):
            raise serializers.ValidationError('ID Метрики — только цифры')
        return value

    def validate_google_analytics_id(self, value):
        value = (value or '').strip()
        if not value:
            return ''
        if not re.fullmatch(r'G-[A-Z0-9]+', value, re.IGNORECASE):
            raise serializers.ValidationError('GA4 ID вида G-XXXXXXXX')
        return f'G-{value[2:].upper()}'

    def validate_map_embed_url(self, value):
        if not value:
            return value
        if is_embeddable_map_url(value):
            return value.strip()
        # Обычная ссылка maps/-/... — сохраняем для кнопки «Открыть в Яндекс.Картах»,
        # iframe строится автоматически по ID организации / координатам.
        return value.strip()


class HeroSlideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HeroSlide
        fields = ['id', 'title', 'image', 'image_url', 'order', 'is_active']
        extra_kwargs = {'image': {'write_only': True}}

    def get_image_url(self, obj):
        return media_field_url(obj.image) if obj.image else None


class ServiceSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    options_list = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id', 'title', 'slug', 'category', 'short_description', 'full_description',
            'options', 'options_list', 'image', 'image_url', 'icon', 'order',
            'is_active', 'show_on_home',
        ]
        extra_kwargs = {'image': {'write_only': True}}

    def get_image_url(self, obj):
        return media_field_url(obj.image) if obj.image else None

    def get_options_list(self, obj):
        if not obj.options:
            return []
        return [line.strip() for line in obj.options.split('\n') if line.strip()]


class AdvantageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Advantage
        fields = ['id', 'title', 'description', 'icon', 'image', 'image_url', 'order']
        extra_kwargs = {'image': {'write_only': True}}

    def get_image_url(self, obj):
        return _image_url(self.context.get('request'), obj)


class WorkStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkStep
        fields = ['id', 'step_number', 'title', 'description', 'order']


class PortfolioItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    image_before_url = serializers.SerializerMethodField()
    image_after_url = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioItem
        fields = [
            'id', 'title', 'category', 'description', 'image', 'image_url',
            'image_before', 'image_before_url', 'image_after', 'image_after_url',
            'order', 'is_active', 'created_at',
        ]
        extra_kwargs = {
            'image': {'write_only': True},
            'image_before': {'write_only': True},
            'image_after': {'write_only': True},
        }

    def _abs_url(self, obj, field_name):
        image = getattr(obj, field_name, None)
        return media_field_url(image) if image else None

    def get_image_url(self, obj):
        return self._abs_url(obj, 'image')

    def get_image_before_url(self, obj):
        return self._abs_url(obj, 'image_before')

    def get_image_after_url(self, obj):
        return self._abs_url(obj, 'image_after')


class LeadCreateSerializer(serializers.ModelSerializer):
    captcha_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    captcha_answer = serializers.CharField(write_only=True, required=False, allow_blank=True)
    website = serializers.CharField(write_only=True, required=False, allow_blank=True)
    privacy_consent = serializers.BooleanField(write_only=True)

    class Meta:
        model = Lead
        fields = [
            'name', 'phone', 'message', 'source',
            'city', 'interest', 'opening_width', 'opening_height', 'drive_type',
            'captcha_id', 'captcha_answer', 'website', 'privacy_consent',
        ]

    def validate_name(self, value):
        cleaned = sanitize_text(value, 100)
        if len(cleaned) < 2:
            raise serializers.ValidationError('Введите корректное имя')
        return cleaned

    def validate_phone(self, value):
        cleaned = sanitize_text(value, 20)
        digits = re.sub(r'\D', '', cleaned)
        if not validate_phone(digits):
            raise serializers.ValidationError('Введите корректный номер (+7 или +375)')
        return digits

    def validate_message(self, value):
        return sanitize_text(value, 2000)

    def validate_source(self, value):
        return sanitize_text(value, 100) or 'сайт'

    def validate_website(self, value):
        return sanitize_text(value, 200)

    def validate_city(self, value):
        return sanitize_text(value, 100)

    def validate_interest(self, value):
        return sanitize_text(value, 200)

    def validate_opening_width(self, value):
        return sanitize_text(value, 40)

    def validate_opening_height(self, value):
        return sanitize_text(value, 40)

    def validate_drive_type(self, value):
        if not value:
            return ''
        allowed = {c.value for c in LeadDriveType}
        if value not in allowed:
            raise serializers.ValidationError('Некорректный тип привода')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError('Ошибка запроса')

        if attrs.pop('website', ''):
            raise serializers.ValidationError({'detail': 'Не удалось отправить заявку'})

        if not attrs.get('privacy_consent'):
            raise serializers.ValidationError({
                'privacy_consent': 'Необходимо согласие на обработку персональных данных',
            })

        needs_captcha = captcha_required(request.session, request)
        captcha_answer = attrs.pop('captcha_answer', '')
        captcha_id = attrs.pop('captcha_id', '')

        if needs_captcha:
            if not captcha_id or not captcha_answer:
                raise serializers.ValidationError({
                    'captcha_required': True,
                    'detail': 'Подтвердите, что вы не робот',
                })
            if not verify_captcha(request.session, captcha_answer, captcha_id):
                raise serializers.ValidationError({
                    'captcha_required': True,
                    'captcha_answer': 'Неверный ответ на капчу',
                })

        return attrs

    def create(self, validated_data):
        from django.utils import timezone

        request = self.context.get('request')
        validated_data['privacy_consent'] = True
        validated_data['privacy_consent_at'] = timezone.now()
        lead = super().create(validated_data)
        if request:
            mark_lead_submitted(request.session)
        return lead


class LeadSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    drive_type_display = serializers.CharField(source='get_drive_type_display', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'phone', 'message', 'source',
            'city', 'interest', 'opening_width', 'opening_height',
            'drive_type', 'drive_type_display',
            'privacy_consent', 'privacy_consent_at',
            'status', 'status_display',
            'internal_notes', 'created_at', 'updated_at',
        ]
        # CRM: менеджер меняет только статус и заметки (99-З: consent/PII read-only)
        read_only_fields = [
            'id', 'name', 'phone', 'message', 'source',
            'city', 'interest', 'opening_width', 'opening_height',
            'drive_type', 'drive_type_display',
            'privacy_consent', 'privacy_consent_at',
            'status_display', 'created_at', 'updated_at',
        ]


class CaptchaSerializer(serializers.Serializer):
    captcha_id = serializers.CharField()
    question = serializers.CharField()


class SiteVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteVisit
        fields = ['id', 'ip_address', 'visit_date', 'visited_at', 'path', 'referer']


def _image_url(_request, obj, field='image', external_field='external_image_url'):
    # _request: раньше build_absolute_uri(Host); теперь SITE_URL (см. public_urls).
    image = getattr(obj, field, None)
    if image:
        return media_field_url(image)
    external = getattr(obj, external_field, '') or ''
    return public_absolute_url(external) if external else None


class ContentPageImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ContentPageImage
        fields = ['id', 'image_url', 'caption', 'order', 'role']

    def get_image_url(self, obj):
        return _image_url(self.context.get('request'), obj)


class ContentPageImageAdminSerializer(AdminFormSerializerMixin, serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ContentPageImage
        fields = ['id', 'page', 'image', 'image_url', 'external_image_url', 'caption', 'order', 'role']
        extra_kwargs = {'image': {'write_only': True}}

    def get_image_url(self, obj):
        return _image_url(self.context.get('request'), obj)


class ContentPageBriefSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    url_path = serializers.CharField(read_only=True)
    page_type_display = serializers.CharField(source='get_page_type_display', read_only=True)

    class Meta:
        model = ContentPage
        fields = [
            'id', 'slug', 'title', 'page_type', 'page_type_display', 'excerpt',
            'price', 'image_url', 'url_path', 'show_in_menu', 'order', 'is_active',
        ]

    def get_image_url(self, obj):
        if obj.page_type == ContentPage.PageType.TESTIMONIALS:
            return None
        return _image_url(self.context.get('request'), obj)


class ContentPageSerializer(ContentPageBriefSerializer):
    section_slug = serializers.CharField(source='section.slug', read_only=True)
    section_title = serializers.CharField(source='section.title', read_only=True)
    parent_id = serializers.IntegerField(source='parent.id', read_only=True, allow_null=True)
    children = serializers.SerializerMethodField()
    breadcrumbs = serializers.SerializerMethodField()
    gallery = serializers.SerializerMethodField()

    class Meta(ContentPageBriefSerializer.Meta):
        fields = ContentPageBriefSerializer.Meta.fields + [
            'section_slug', 'section_title', 'parent_id', 'content',
            'manufacturer', 'model', 'availability', 'external_image_url',
            'children', 'breadcrumbs', 'gallery', 'meta_title', 'meta_description',
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('order', 'title')
        return ContentPageBriefSerializer(children, many=True, context=self.context).data

    def get_gallery(self, obj):
        images = obj.gallery_images.all()
        return ContentPageImageSerializer(images, many=True, context=self.context).data

    def get_breadcrumbs(self, obj):
        crumbs = []
        current = obj
        while current:
            crumbs.insert(0, {
                'title': current.title,
                'slug': current.slug,
                'url_path': current.url_path,
            })
            current = current.parent
        return crumbs


class ContentSectionSerializer(serializers.ModelSerializer):
    menu_pages = serializers.SerializerMethodField()
    entry_slug = serializers.SerializerMethodField()

    class Meta:
        model = ContentSection
        fields = [
            'id', 'slug', 'title', 'description', 'icon', 'order',
            'show_in_menu', 'is_active', 'entry_slug', 'menu_pages',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # entry_slug и menu_pages независимо друг от друга запрашивали
        # get_section_root() — это удваивало число запросов к БД на
        # /api/catalog/menu/, который дергается при каждом заходе на сайт.
        self._root_cache = {}

    def _root(self, obj):
        if obj.pk not in self._root_cache:
            self._root_cache[obj.pk] = get_section_root(obj)
        return self._root_cache[obj.pk]

    def get_entry_slug(self, obj):
        root = self._root(obj)
        return root.slug if root else None

    def get_menu_pages(self, obj):
        root = self._root(obj)
        if root:
            pages = root.children.filter(is_active=True, show_in_menu=True)
            if pages.exists():
                pages = pages.order_by('order', 'title')
                return ContentPageBriefSerializer(pages, many=True, context=self.context).data
        pages = obj.pages.filter(is_active=True, show_in_menu=True, parent__isnull=True)
        pages = pages.order_by('order', 'title')
        return ContentPageBriefSerializer(pages, many=True, context=self.context).data


class ContentSectionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentSection
        fields = '__all__'


class ContentPageAdminSerializer(AdminFormSerializerMixin, serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    section_title = serializers.CharField(source='section.title', read_only=True)
    parent_title = serializers.CharField(source='parent.title', read_only=True, allow_null=True)

    class Meta:
        model = ContentPage
        fields = [
            'id', 'section', 'section_title', 'parent', 'parent_title', 'slug', 'title',
            'page_type', 'content', 'excerpt', 'price', 'manufacturer', 'model',
            'availability', 'image', 'image_url', 'external_image_url',
            'show_in_menu', 'order', 'is_active', 'meta_title', 'meta_description',
        ]
        extra_kwargs = {'image': {'write_only': True}}

    def get_image_url(self, obj):
        return _image_url(self.context.get('request'), obj)
