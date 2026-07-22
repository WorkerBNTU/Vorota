import pytest
from django.contrib.auth.models import Group
from django.urls import reverse

from api.permissions import MANAGER_GROUP


@pytest.fixture
def manager_user(django_user_model):
    group, _ = Group.objects.get_or_create(name=MANAGER_GROUP)
    user = django_user_model.objects.create_user(
        username='manager',
        password='mgr-pass-123',
        is_staff=True,
        is_superuser=False,
    )
    user.groups.add(group)
    return user


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
        assert response.data['role'] == 'admin'
        assert response.data['can_manage_content'] is True

        me = api_client.get(reverse('admin-me'))
        assert me.status_code == 200
        assert me.data['authenticated'] is True
        assert me.data['role'] == 'admin'

    def test_login_manager(self, api_client, manager_user):
        response = api_client.post(
            reverse('admin-login'),
            {'username': 'manager', 'password': 'mgr-pass-123'},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['role'] == 'manager'
        assert response.data['can_manage_content'] is False

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

    def test_login_staff_without_role_rejected(self, api_client, django_user_model):
        django_user_model.objects.create_user(
            username='orphan', password='pass12345', is_staff=True, is_superuser=False
        )
        response = api_client.post(
            reverse('admin-login'),
            {'username': 'orphan', 'password': 'pass12345'},
            format='json',
        )
        assert response.status_code == 401

    def test_logout(self, api_client, staff_user):
        api_client.force_login(staff_user)
        response = api_client.post(reverse('admin-logout'))
        assert response.status_code == 200

        me = api_client.get(reverse('admin-me'))
        assert me.status_code == 401


@pytest.mark.django_db
class TestManagerPermissions:
    def test_manager_can_list_leads(self, api_client, manager_user):
        api_client.force_login(manager_user)
        response = api_client.get('/api/admin/leads/')
        assert response.status_code == 200

    def test_manager_cannot_access_settings(self, api_client, manager_user):
        api_client.force_login(manager_user)
        response = api_client.get('/api/admin/settings/')
        assert response.status_code == 403

    def test_manager_cannot_access_visits(self, api_client, manager_user):
        api_client.force_login(manager_user)
        response = api_client.get('/api/admin/visits/stats/')
        assert response.status_code == 403

    def test_admin_can_access_settings(self, api_client, staff_user):
        api_client.force_login(staff_user)
        response = api_client.get('/api/admin/settings/')
        assert response.status_code == 200

    def test_manager_can_patch_status_not_pii(self, api_client, manager_user):
        from api.models import Lead, LeadStatus

        lead = Lead.objects.create(
            name='Клиент',
            phone='375291112233',
            privacy_consent=True,
            status=LeadStatus.NEW,
        )
        api_client.force_login(manager_user)
        response = api_client.patch(
            f'/api/admin/leads/{lead.id}/',
            {
                'status': LeadStatus.IN_PROGRESS,
                'internal_notes': 'перезвонить',
                'name': 'Хакер',
                'phone': '375290000000',
                'privacy_consent': False,
                'source': 'hacked',
            },
            format='json',
        )
        assert response.status_code == 200
        lead.refresh_from_db()
        assert lead.status == LeadStatus.IN_PROGRESS
        assert lead.internal_notes == 'перезвонить'
        assert lead.name == 'Клиент'
        assert lead.phone == '375291112233'
        assert lead.privacy_consent is True
        assert lead.source == 'сайт'

    def test_manager_cannot_delete_lead(self, api_client, manager_user):
        from api.models import Lead

        lead = Lead.objects.create(name='Клиент', phone='375291112233')
        api_client.force_login(manager_user)
        response = api_client.delete(f'/api/admin/leads/{lead.id}/')
        assert response.status_code == 403
        assert Lead.objects.filter(pk=lead.id).exists()

    def test_admin_can_delete_lead(self, api_client, staff_user):
        from api.models import Lead

        lead = Lead.objects.create(name='Клиент', phone='375291112233')
        api_client.force_login(staff_user)
        response = api_client.delete(f'/api/admin/leads/{lead.id}/')
        assert response.status_code == 204
        assert not Lead.objects.filter(pk=lead.id).exists()
