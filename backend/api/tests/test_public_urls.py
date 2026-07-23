"""Публичные media URL строятся от SITE_URL, не от Host запроса."""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings


@override_settings(SITE_URL='https://vorota-rb.by')
def test_public_absolute_url_prefixes_site():
    from api.public_urls import public_absolute_url

    assert public_absolute_url('/media/x.jpg') == 'https://vorota-rb.by/media/x.jpg'
    assert public_absolute_url('media/x.jpg') == 'https://vorota-rb.by/media/x.jpg'


@override_settings(SITE_URL='https://vorota-rb.by')
def test_public_absolute_url_keeps_external():
    from api.public_urls import public_absolute_url

    assert public_absolute_url('https://cdn.example/a.png') == 'https://cdn.example/a.png'


@override_settings(SITE_URL='https://vorota-rb.by')
@pytest.mark.django_db
def test_logo_url_uses_site_url_not_request_host(rf):
    from api.models import SiteSettings
    from api.serializers import SiteSettingsSerializer

    png = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00'
        b'\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    obj = SiteSettings.load()
    obj.logo.save(
        'logo.png',
        SimpleUploadedFile('logo.png', png, content_type='image/png'),
        save=True,
    )

    # Host как у prerender-контейнера. FileField logo write_only — иначе DRF
    # зовёт build_absolute_uri → DisallowedHost, если frontend нет в ALLOWED_HOSTS.
    request = rf.get('/', HTTP_HOST='frontend')
    data = SiteSettingsSerializer(obj, context={'request': request}).data
    logo = data['logo_url']
    assert logo.startswith('https://vorota-rb.by/media/')
    assert 'frontend' not in logo
    assert 'logo' not in data  # write_only
