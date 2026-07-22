import uuid
from xml.sax.saxutils import escape

from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .form_coercion import normalize_multipart_data
from .media_library import list_media_images, resolve_library_path
from .permissions import IsContentAdmin, IsCrmStaff
from .models import (
    Advantage, ContentPage, ContentPageImage, ContentSection, HeroSlide, Lead,
    PortfolioItem, Service, SiteSettings, SiteVisit, WorkStep,
)
from .serializers import (
    AdvantageSerializer,
    CaptchaSerializer,
    ContentPageBriefSerializer,
    ContentPageAdminSerializer,
    ContentPageImageAdminSerializer,
    ContentPageSerializer,
    ContentSectionAdminSerializer,
    ContentSectionSerializer,
    HeroSlideSerializer,
    LeadCreateSerializer,
    LeadSerializer,
    PortfolioItemSerializer,
    ServiceSerializer,
    SiteSettingsSerializer,
    SiteVisitSerializer,
    WorkStepSerializer,
)
from .visit_service import record_visit
from .services import generate_captcha, send_telegram_notification_async


class CaptchaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        captcha = generate_captcha()
        captcha_id = str(uuid.uuid4())
        request.session['captcha_id'] = captcha_id
        request.session['captcha_answer'] = captcha['answer']
        request.session.modified = True
        request.session.save()
        serializer = CaptchaSerializer({'captcha_id': captcha_id, 'question': captcha['question']})
        return Response(serializer.data)


class SiteContentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings_obj = SiteSettings.load()
        data = {
            'settings': SiteSettingsSerializer(settings_obj, context={'request': request}).data,
            'hero_slides': HeroSlideSerializer(
                HeroSlide.objects.filter(is_active=True), many=True, context={'request': request}
            ).data,
            'home_services': ServiceSerializer(
                Service.objects.filter(is_active=True, show_on_home=True),
                many=True,
                context={'request': request},
            ).data,
            'advantages': AdvantageSerializer(Advantage.objects.all(), many=True).data,
            'work_steps': WorkStepSerializer(WorkStep.objects.all(), many=True).data,
        }
        return Response(data)


class PortfolioListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PortfolioItemSerializer

    def get_queryset(self):
        qs = PortfolioItem.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs

    def get_serializer_context(self):
        return {'request': self.request}


class LeadCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = LeadCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()
        send_telegram_notification_async(lead.id)
        return Response(
            {'detail': 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.'},
            status=status.HTTP_201_CREATED,
        )


class AdminSiteSettingsView(APIView):
    permission_classes = [IsContentAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        settings_obj = SiteSettings.load()
        return Response(SiteSettingsSerializer(settings_obj, context={'request': request}).data)

    def patch(self, request):
        settings_obj = SiteSettings.load()
        serializer = SiteSettingsSerializer(
            settings_obj, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logo_path = resolve_library_path(request.data.get('logo_from_library'))
        if logo_path:
            settings_obj.logo.name = logo_path
            settings_obj.save(update_fields=['logo'])
        return Response(SiteSettingsSerializer(settings_obj, context={'request': request}).data)


class AdminMediaLibraryView(APIView):
    """Список уже загруженных на сервер изображений — чтобы в формах
    админки можно было выбрать существующий файл вместо повторной загрузки
    того же самого фото (см. frontend/src/admin/ImagePicker.jsx)."""

    permission_classes = [IsContentAdmin]

    def get(self, request):
        return Response(list_media_images(request))


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsContentAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    # Имена ImageField-полей, для которых разрешён выбор уже загруженного
    # файла вместо повторной загрузки — фронтенд присылает
    # "<поле>_from_library" с относительным путём внутри media/ (см.
    # ImagePicker.jsx). Объявляется в подклассах под конкретную модель.
    image_library_fields = []
    multipart_boolean_fields = frozenset({
        'is_active', 'show_in_menu', 'show_on_home',
    })

    def _normalize_request_data(self, request):
        return normalize_multipart_data(
            request.data,
            boolean_fields=self.multipart_boolean_fields,
        )

    def _apply_library_picks(self, request, instance):
        changed_fields = []
        for field in self.image_library_fields:
            safe_path = resolve_library_path(request.data.get(f'{field}_from_library'))
            if safe_path:
                getattr(instance, field).name = safe_path
                changed_fields.append(field)
        if changed_fields:
            instance.save(update_fields=changed_fields)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=self._normalize_request_data(request))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        self._apply_library_picks(request, serializer.instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=self._normalize_request_data(request), partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        self._apply_library_picks(request, serializer.instance)
        return Response(serializer.data)


class AdminHeroSlideViewSet(AdminModelViewSet):
    queryset = HeroSlide.objects.all()
    serializer_class = HeroSlideSerializer
    image_library_fields = ['image']


class AdminServiceViewSet(AdminModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    image_library_fields = ['image']


class AdminAdvantageViewSet(AdminModelViewSet):
    queryset = Advantage.objects.all()
    serializer_class = AdvantageSerializer
    image_library_fields = ['image']


class AdminWorkStepViewSet(AdminModelViewSet):
    queryset = WorkStep.objects.all()
    serializer_class = WorkStepSerializer


class AdminPortfolioViewSet(AdminModelViewSet):
    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer
    image_library_fields = ['image', 'image_before', 'image_after']


class CatalogMenuView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        sections = ContentSection.objects.filter(is_active=True, show_in_menu=True)
        return Response(
            ContentSectionSerializer(sections, many=True, context={'request': request}).data
        )


class CatalogPageDetailView(APIView):
    permission_classes = [AllowAny]

    # Сериализатор строит breadcrumbs, поднимаясь по .parent до корня —
    # без предзагрузки это N+1 (отдельный запрос на каждый уровень
    # вложенности). Глубина каталога у нас не больше 5 уровней, поэтому
    # цепочка select_related заранее подтягивает всех предков одним JOIN.
    _PARENT_CHAIN = 'parent__parent__parent__parent__parent'

    def get(self, request, slug):
        slug = slug.strip('/')
        try:
            page = ContentPage.objects.select_related('section', self._PARENT_CHAIN).get(
                slug=slug, is_active=True
            )
        except ContentPage.DoesNotExist:
            return Response({'detail': 'Страница не найдена'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ContentPageSerializer(page, context={'request': request}).data)


class CatalogSectionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, section_slug):
        try:
            section = ContentSection.objects.get(slug=section_slug, is_active=True)
        except ContentSection.DoesNotExist:
            return Response({'detail': 'Раздел не найден'}, status=status.HTTP_404_NOT_FOUND)

        root_page = ContentPage.objects.filter(
            section=section, is_active=True, parent__isnull=True
        ).order_by('order', 'title').first()

        if root_page:
            return Response(ContentPageSerializer(root_page, context={'request': request}).data)

        pages = section.pages.filter(is_active=True, parent__isnull=True).order_by('order', 'title')
        return Response({
            'section': ContentSectionSerializer(section, context={'request': request}).data,
            'pages': ContentPageBriefSerializer(pages, many=True, context={'request': request}).data,
        })


class AdminContentSectionViewSet(AdminModelViewSet):
    queryset = ContentSection.objects.all()
    serializer_class = ContentSectionAdminSerializer


class AdminContentPageViewSet(AdminModelViewSet):
    queryset = ContentPage.objects.select_related('section', 'parent').all()
    serializer_class = ContentPageAdminSerializer
    image_library_fields = ['image']

    def get_queryset(self):
        qs = super().get_queryset()
        section = self.request.query_params.get('section')
        page_type = self.request.query_params.get('page_type')
        search = self.request.query_params.get('search')
        if section:
            qs = qs.filter(section__slug=section)
        if page_type:
            qs = qs.filter(page_type=page_type)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(slug__icontains=search))
        return qs


class AdminContentPageImageViewSet(AdminModelViewSet):
    queryset = ContentPageImage.objects.select_related('page').all()
    serializer_class = ContentPageImageAdminSerializer
    image_library_fields = ['image']

    def get_queryset(self):
        qs = super().get_queryset()
        page = self.request.query_params.get('page')
        if page:
            qs = qs.filter(page_id=page)
        return qs


class VisitRecordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        path = request.data.get('path', '/')
        if isinstance(path, str):
            path = path[:300]
        else:
            path = '/'
        recorded = record_visit(request, path)
        return Response(
            {'recorded': recorded},
            status=status.HTTP_201_CREATED if recorded else status.HTTP_200_OK,
        )


class AdminVisitViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsContentAdmin]
    serializer_class = SiteVisitSerializer
    http_method_names = ['get', 'head', 'options']

    def get_queryset(self):
        qs = SiteVisit.objects.all()
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(visit_date__gte=date_from)
        if date_to:
            qs = qs.filter(visit_date__lte=date_to)
        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.localdate()
        week_start = today - timezone.timedelta(days=6)
        last = SiteVisit.objects.order_by('-visited_at').first()
        recent = SiteVisit.objects.order_by('-visited_at')[:20]
        return Response({
            'total': SiteVisit.objects.count(),
            'today': SiteVisit.objects.filter(visit_date=today).count(),
            'week': SiteVisit.objects.filter(visit_date__gte=week_start).count(),
            'last_visit': SiteVisitSerializer(last).data if last else None,
            'recent': SiteVisitSerializer(recent, many=True).data,
        })


class AdminLeadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsCrmStaff]
    serializer_class = LeadSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        # Удаление заявок — только полный админ (сохраняем audit trail для менеджера)
        if self.action == 'destroy':
            return [IsContentAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Lead.objects.all()
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(phone__icontains=search) | Q(message__icontains=search)
            )
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response({
            'new': Lead.objects.filter(status='new').count(),
            'in_progress': Lead.objects.filter(status='in_progress').count(),
            'completed': Lead.objects.filter(status='completed').count(),
            'rejected': Lead.objects.filter(status='rejected').count(),
            'total': Lead.objects.count(),
        })


# Статические маршруты фронтенда, которые не приходят из ContentPage
# (см. frontend/src/App.jsx). Формат: (путь, changefreq, priority).
STATIC_SITEMAP_ROUTES = [
    ('/', 'weekly', '1.0'),
    ('/catalog', 'weekly', '0.9'),
    ('/portfolio', 'monthly', '0.6'),
    ('/contacts', 'monthly', '0.6'),
    ('/legal/privacy', 'yearly', '0.3'),
    ('/legal/terms', 'yearly', '0.3'),
    ('/legal/cookies', 'yearly', '0.2'),
]


class SitemapView(APIView):
    """Отдаёт sitemap.xml, собранный из активных страниц каталога.

    Подключается в корне сайта (см. `config/urls.py`), а не под `/api/`,
    так как поисковики ищут его по адресу `<домен>/sitemap.xml`.
    Абсолютные URL строятся от `settings.SITE_URL`, а не от хоста запроса,
    чтобы не зависеть от корректности определения схемы (http/https) за
    обратным прокси.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        base = settings.SITE_URL
        latest_page = (
            ContentPage.objects.filter(is_active=True)
            .order_by('-updated_at')
            .values_list('updated_at', flat=True)
            .first()
        )
        static_lastmod = (
            latest_page.date().isoformat()
            if latest_page
            else timezone.localdate().isoformat()
        )
        entries = [
            {
                'loc': f'{base}{path}',
                'changefreq': changefreq,
                'priority': priority,
                'lastmod': static_lastmod,
            }
            for path, changefreq, priority in STATIC_SITEMAP_ROUTES
        ]

        pages = ContentPage.objects.filter(is_active=True).order_by('slug')
        for page in pages:
            priority = '0.8' if page.page_type == 'overview' else '0.6'
            entries.append({
                'loc': f'{base}/catalog/{page.slug}',
                'changefreq': 'monthly',
                'priority': priority,
                'lastmod': page.updated_at.date().isoformat() if page.updated_at else None,
            })

        xml = ['<?xml version="1.0" encoding="UTF-8"?>']
        xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
        for entry in entries:
            xml.append('<url>')
            xml.append(f'<loc>{escape(entry["loc"])}</loc>')
            if entry['lastmod']:
                xml.append(f'<lastmod>{entry["lastmod"]}</lastmod>')
            xml.append(f'<changefreq>{entry["changefreq"]}</changefreq>')
            xml.append(f'<priority>{entry["priority"]}</priority>')
            xml.append('</url>')
        xml.append('</urlset>')

        return HttpResponse('\n'.join(xml), content_type='application/xml')


class RobotsView(APIView):
    """robots.txt — закрывает от индексации админку и API, открывает медиа."""

    permission_classes = [AllowAny]

    def get(self, request):
        content = (
            'User-agent: *\n'
            'Disallow: /admin/\n'
            'Disallow: /api/\n'
            '\n'
            f'Sitemap: {settings.SITE_URL}/sitemap.xml\n'
        )
        return HttpResponse(content, content_type='text/plain; charset=utf-8')
