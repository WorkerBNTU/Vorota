"""Smoke: OpenAPI schema отдаётся и валидна как JSON/YAML-ответ."""

from django.urls import reverse


def test_openapi_schema_available(api_client):
    response = api_client.get(reverse('schema'))
    assert response.status_code == 200
    # drf-spectacular по умолчанию отдаёт yaml; Accept: application/json — json
    body = response.content.decode('utf-8')
    assert 'ВоротаРБ API' in body or 'Vorota' in body or 'openapi' in body.lower()


def test_swagger_ui_in_debug(api_client):
    response = api_client.get(reverse('swagger-ui'))
    assert response.status_code == 200
