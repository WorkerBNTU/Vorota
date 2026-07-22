"""get_client_ip уважает TRUST_PROXY_HEADERS так же, как rate-limit."""

from django.test import RequestFactory, override_settings

from api.visit_service import get_client_ip


@override_settings(TRUST_PROXY_HEADERS=False)
def test_ignores_xff_when_proxy_untrusted():
    request = RequestFactory().get('/', HTTP_X_FORWARDED_FOR='1.2.3.4', REMOTE_ADDR='10.0.0.1')
    assert get_client_ip(request) == '10.0.0.1'


@override_settings(TRUST_PROXY_HEADERS=True)
def test_uses_xff_when_proxy_trusted():
    request = RequestFactory().get(
        '/',
        HTTP_X_FORWARDED_FOR='1.2.3.4, 10.0.0.9',
        REMOTE_ADDR='10.0.0.1',
    )
    assert get_client_ip(request) == '1.2.3.4'


@override_settings(TRUST_PROXY_HEADERS=True)
def test_prefers_x_real_ip():
    request = RequestFactory().get(
        '/',
        HTTP_X_REAL_IP='9.9.9.9',
        HTTP_X_FORWARDED_FOR='1.2.3.4',
        REMOTE_ADDR='10.0.0.1',
    )
    assert get_client_ip(request) == '9.9.9.9'
