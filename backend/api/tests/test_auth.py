import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestAuth:
    def test_csrf_returns_token(self, api_client):
        response = api_client.get(reverse('csrf'))
        assert response.status_code == 200
        assert response.data.get('csrfToken')

    def test_me_unauthenticated(self, api_client):
        response = api_client.get(reverse('admin-me'))
        assert response.status_code == 401
        assert response.data['authenticated'] is False

    def test_login_success(self, api_client, staff_user):
        response = api_client.post(
            reverse('admin-login'),
            {'username': 'admin', 'password': 'test-pass-123'},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['username'] == 'admin'

        me = api_client.get(reverse('admin-me'))
        assert me.status_code == 200
        assert me.data['authenticated'] is True

    def test_login_wrong_password(self, api_client, staff_user):
        response = api_client.post(
            reverse('admin-login'),
            {'username': 'admin', 'password': 'wrong'},
            format='json',
        )
        assert response.status_code == 401

    def test_login_non_staff_rejected(self, api_client, django_user_model):
        django_user_model.objects.create_user(
            username='user', password='pass12345', is_staff=False
        )
        response = api_client.post(
            reverse('admin-login'),
            {'username': 'user', 'password': 'pass12345'},
            format='json',
        )
        assert response.status_code == 401

    def test_logout(self, api_client, staff_user):
        # Только session-login: force_authenticate переживает logout и ломает проверку
        api_client.force_login(staff_user)
        response = api_client.post(reverse('admin-logout'))
        assert response.status_code == 200

        me = api_client.get(reverse('admin-me'))
        assert me.status_code == 401
