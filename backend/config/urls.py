from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from api.views import RobotsView, SitemapView


class OpenAPISchemaView(SpectacularAPIView):
    """Схема с предсказуемым именем файла (иначе браузер качает без .yaml)."""

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        ext = 'json' if 'json' in (response.accepted_media_type or '') else 'yaml'
        response['Content-Disposition'] = f'inline; filename="openapi.{ext}"'
        return response


urlpatterns = [
    path('api/', include('api.urls')),
    # На корне домена, а не под /api/ — так их ищут поисковые роботы.
    path('sitemap.xml', SitemapView.as_view(), name='sitemap'),
    path('robots.txt', RobotsView.as_view(), name='robots'),
]

# Schema + Swagger/ReDoc: DEBUG или ENABLE_API_DOCS=True (не светим на проде по умолчанию)
if settings.ENABLE_API_DOCS:
    urlpatterns += [
        path('api/schema/', OpenAPISchemaView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ]

if settings.DEBUG or settings.ENABLE_DJANGO_ADMIN:
    urlpatterns.insert(0, path('django-admin/', admin.site.urls))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
