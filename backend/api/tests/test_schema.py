"""Smoke: OpenAPI schema отдаётся и валидна как JSON/YAML-ответ."""

from django.urls import reverse


def test_openapi_schema_available(api_client):
    response = api_client.get(reverse('schema'))
    assert response.status_code == 200
    body = response.content.decode('utf-8')
    assert 'VorotaRB API' in body or 'openapi' in body.lower()
    assert 'openapi.yaml' in response.get('Content-Disposition', '')


def test_swagger_ui_allows_jsdelivr_csp(api_client):
    response = api_client.get(reverse('swagger-ui'))
    assert response.status_code == 200
    csp = response.get('Content-Security-Policy', '')
    assert 'cdn.jsdelivr.net' in csp


def test_swagger_ui_in_debug(api_client):
    response = api_client.get(reverse('swagger-ui'))
    assert response.status_code == 200
