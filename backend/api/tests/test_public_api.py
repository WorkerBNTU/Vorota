import pytest
from django.urls import reverse

from api.models import ContentSection, Service, ServiceCategory, SiteSettings


@pytest.mark.django_db
class TestPublicApi:
    def test_content_returns_core_keys(self, api_client):
        SiteSettings.load()
        response = api_client.get(reverse('site-content'))
        assert response.status_code == 200
        for key in ('settings', 'hero_slides', 'home_services', 'advantages', 'work_steps'):
            assert key in response.data
        assert response.data['settings']['company_name']
        assert response.data['settings'].get('price_disclaimer')
        assert response.data['settings'].get('privacy_policy')
        assert response.data['settings'].get('consent_checkbox_label')

    def test_catalog_menu(self, api_client):
        ContentSection.objects.create(
            slug='vorota',
            title='Ворота',
            show_in_menu=True,
            is_active=True,
            order=1,
        )
        ContentSection.objects.create(
            slug='hidden',
            title='Скрытый',
            show_in_menu=False,
            is_active=True,
            order=2,
        )
        response = api_client.get(reverse('catalog-menu'))
        assert response.status_code == 200
        titles = [item['title'] for item in response.data]
        assert 'Ворота' in titles
        assert 'Скрытый' not in titles

    def test_services_list_active_only(self, api_client):
        Service.objects.create(
            title='Монтаж',
            slug='montazh',
            category=ServiceCategory.INSTALL,
            short_description='Кратко',
            full_description='Полностью',
            is_active=True,
            order=1,
        )
        Service.objects.create(
            title='Старое',
            slug='staroe',
            category=ServiceCategory.SERVICE,
            short_description='Кратко',
            full_description='Полностью',
            is_active=False,
            order=2,
        )
        response = api_client.get(reverse('services'))
        assert response.status_code == 200
        results = response.data['results'] if isinstance(response.data, dict) else response.data
        titles = [item['title'] for item in results]
        assert 'Монтаж' in titles
        assert 'Старое' not in titles
