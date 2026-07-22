import pytest

import api.rate_limit as rate_limit_module


@pytest.fixture(autouse=True)
def _reset_rate_limit_store():
    """Сбрасываем singleton store между тестами (иначе счётчики копятся)."""
    rate_limit_module._store = None
    yield
    rate_limit_module._store = None


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    client = APIClient()
    # Как у обычного браузера — иначе короткий/пустой UA считается подозрительным
    # и сразу требует капчу (см. api.services.is_suspicious_client).
    client.defaults['HTTP_USER_AGENT'] = (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    return client


@pytest.fixture
def staff_user(django_user_model):
    return django_user_model.objects.create_user(
        username='admin',
        password='test-pass-123',
        is_staff=True,
        is_superuser=True,
    )
