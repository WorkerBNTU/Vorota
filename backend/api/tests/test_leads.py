from unittest.mock import patch

import pytest
from django.urls import reverse

from api.models import Lead
from api.services import LEAD_SUBMISSIONS_SESSION_KEY


@pytest.fixture(autouse=True)
def _mute_telegram():
    with patch('api.views.send_telegram_notification_async'):
        yield


def _valid_payload(**overrides):
    data = {
        'name': 'Иван Тестов',
        'phone': '+375 (29) 111-22-33',
        'message': 'Нужны секционные ворота',
        'source': 'тест',
        'website': '',
        'privacy_consent': True,
    }
    data.update(overrides)
    return data


@pytest.mark.django_db
class TestLeadCreate:
    url = reverse('lead-create')

    def test_creates_lead(self, api_client):
        response = api_client.post(self.url, _valid_payload(), format='json')
        assert response.status_code == 201
        assert Lead.objects.count() == 1
        lead = Lead.objects.get()
        assert lead.name == 'Иван Тестов'
        assert lead.phone == '375291112233'
        assert lead.privacy_consent is True
        assert lead.privacy_consent_at is not None
        assert 'успешно' in response.data['detail'].lower()

    def test_optional_details_saved(self, api_client):
        payload = _valid_payload(
            city='Минск',
            interest='Роллеты',
            opening_width='3000',
            opening_height='2500',
            drive_type='electric',
        )
        response = api_client.post(self.url, payload, format='json')
        assert response.status_code == 201
        lead = Lead.objects.get()
        assert lead.city == 'Минск'
        assert lead.interest == 'Роллеты'
        assert lead.opening_width == '3000'
        assert lead.opening_height == '2500'
        assert lead.drive_type == 'electric'

    def test_rejects_invalid_phone(self, api_client):
        response = api_client.post(
            self.url, _valid_payload(phone='12345'), format='json'
        )
        assert response.status_code == 400
        assert Lead.objects.count() == 0

    def test_rejects_short_name(self, api_client):
        response = api_client.post(
            self.url, _valid_payload(name='А'), format='json'
        )
        assert response.status_code == 400
        assert Lead.objects.count() == 0

    def test_honeypot_blocks_bots(self, api_client):
        response = api_client.post(
            self.url, _valid_payload(website='http://spam.example'), format='json'
        )
        assert response.status_code == 400
        assert Lead.objects.count() == 0

    def test_requires_privacy_consent(self, api_client):
        response = api_client.post(
            self.url, _valid_payload(privacy_consent=False), format='json'
        )
        assert response.status_code == 400
        assert Lead.objects.count() == 0

    def test_second_submit_requires_captcha(self, api_client):
        assert api_client.post(self.url, _valid_payload(), format='json').status_code == 201

        # Сессия помечена как «уже отправлял» — без капчи отказ
        response = api_client.post(self.url, _valid_payload(name='Пётр'), format='json')
        assert response.status_code == 400
        # DRF оборачивает значения ValidationError в списки ErrorDetail
        assert 'captcha_required' in response.data
        assert Lead.objects.count() == 1

        captcha = api_client.get(reverse('captcha'))
        assert captcha.status_code == 200
        session = api_client.session
        answer = session['captcha_answer']
        payload = _valid_payload(
            name='Пётр',
            captcha_id=captcha.data['captcha_id'],
            captcha_answer=answer,
        )
        ok = api_client.post(self.url, payload, format='json')
        assert ok.status_code == 201
        assert Lead.objects.count() == 2
        assert session.get(LEAD_SUBMISSIONS_SESSION_KEY, 0) >= 1

    def test_bot_user_agent_requires_captcha_immediately(self, api_client):
        response = api_client.post(
            self.url,
            _valid_payload(),
            format='json',
            HTTP_USER_AGENT='python-requests/2.31.0',
        )
        assert response.status_code == 400
        assert 'captcha_required' in response.data
        assert Lead.objects.count() == 0

    def test_short_mozilla_ua_still_gets_free_submit(self, api_client):
        """Короткий UA вроде Mozilla/5.0 не должен сам по себе требовать капчу."""
        response = api_client.post(
            self.url,
            _valid_payload(),
            format='json',
            HTTP_USER_AGENT='Mozilla/5.0',
        )
        assert response.status_code == 201
        assert Lead.objects.count() == 1

    def test_normal_browser_first_submit_without_captcha(self, api_client):
        response = api_client.post(
            self.url,
            _valid_payload(),
            format='json',
            HTTP_USER_AGENT=(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ),
        )
        assert response.status_code == 201
        assert Lead.objects.count() == 1


@pytest.mark.django_db
class TestAdminLeadsAccess:
    def test_anonymous_cannot_list(self, api_client):
        response = api_client.get('/api/admin/leads/')
        assert response.status_code in (401, 403)

    def test_staff_can_list(self, api_client, staff_user):
        Lead.objects.create(name='Клиент', phone='375291112233')
        api_client.force_authenticate(user=staff_user)
        response = api_client.get('/api/admin/leads/')
        assert response.status_code == 200
        # Пагинация DRF: {count, results} или просто список
        results = response.data['results'] if isinstance(response.data, dict) else response.data
        assert len(results) == 1
