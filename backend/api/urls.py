from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .auth_views import AdminLoginView, AdminLogoutView, AdminMeView, CsrfView
from .views import (
    AdminAdvantageViewSet,
    AdminContentPageImageViewSet,
    AdminContentPageViewSet,
    AdminContentSectionViewSet,
    AdminHeroSlideViewSet,
    AdminLeadViewSet,
    AdminMediaLibraryView,
    AdminPortfolioViewSet,
    AdminServiceViewSet,
    AdminSiteSettingsView,
    AdminVisitViewSet,
    AdminWorkStepViewSet,
    CaptchaView,
    CatalogMenuView,
    CatalogPageDetailView,
    CatalogSectionView,
    LeadCreateView,
    PortfolioListView,
    SiteContentView,
    VisitRecordView,
)

router = DefaultRouter()
router.register('admin/content-sections', AdminContentSectionViewSet, basename='admin-content-sections')
router.register('admin/content-pages', AdminContentPageViewSet, basename='admin-content-pages')
router.register('admin/content-page-images', AdminContentPageImageViewSet, basename='admin-content-page-images')
router.register('admin/hero-slides', AdminHeroSlideViewSet, basename='admin-hero')
router.register('admin/services', AdminServiceViewSet, basename='admin-services')
router.register('admin/advantages', AdminAdvantageViewSet, basename='admin-advantages')
router.register('admin/work-steps', AdminWorkStepViewSet, basename='admin-work-steps')
router.register('admin/portfolio', AdminPortfolioViewSet, basename='admin-portfolio')
router.register('admin/leads', AdminLeadViewSet, basename='admin-leads')
router.register('admin/visits', AdminVisitViewSet, basename='admin-visits')

urlpatterns = [
    path('auth/csrf/', CsrfView.as_view(), name='csrf'),
    path('auth/login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/logout/', AdminLogoutView.as_view(), name='admin-logout'),
    path('auth/me/', AdminMeView.as_view(), name='admin-me'),
    path('captcha/', CaptchaView.as_view(), name='captcha'),
    path('catalog/menu/', CatalogMenuView.as_view(), name='catalog-menu'),
    path('catalog/sections/<slug:section_slug>/', CatalogSectionView.as_view(), name='catalog-section'),
    path('catalog/pages/<path:slug>/', CatalogPageDetailView.as_view(), name='catalog-page'),
    path('content/', SiteContentView.as_view(), name='site-content'),
    path('portfolio/', PortfolioListView.as_view(), name='portfolio'),
    path('leads/', LeadCreateView.as_view(), name='lead-create'),
    path('visits/', VisitRecordView.as_view(), name='visit-record'),
    path('admin/settings/', AdminSiteSettingsView.as_view(), name='admin-settings'),
    path('admin/media-library/', AdminMediaLibraryView.as_view(), name='admin-media-library'),
    path('', include(router.urls)),
]
