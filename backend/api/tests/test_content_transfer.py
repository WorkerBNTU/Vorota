"""Round-trip content export/import preserves CRM leads."""

from pathlib import Path

import pytest
from django.core.management import call_command

from api.models import Lead, Service, ServiceCategory, SiteSettings, SiteVisit


@pytest.mark.django_db
def test_import_site_content_preserves_leads(tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path / 'media'
    Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)

    site = SiteSettings.load()
    site.company_name = 'ИзДевы'
    site.save(update_fields=['company_name'])
    Service.objects.create(
        title='Монтаж',
        slug='montazh',
        category=ServiceCategory.INSTALL,
        short_description='Кратко',
        full_description='Полностью',
        is_active=True,
        order=1,
    )
    Lead.objects.create(name='DevLead', phone='375291111111', privacy_consent=True)

    export_dir = tmp_path / 'export'
    call_command('export_site_content', str(export_dir))
    assert (export_dir / 'content.json').is_file()
    assert (export_dir / 'media.tar').is_file()

    # «Прод»: другие заявки + другой текст; после импорта текст с дева, заявки прода на месте
    site.company_name = 'ПродСтарое'
    site.save(update_fields=['company_name'])
    Service.objects.all().delete()
    Lead.objects.all().delete()
    Lead.objects.create(name='ProdLead', phone='375292222222', privacy_consent=True)
    SiteVisit.objects.create(
        path='/',
        ip_address='127.0.0.1',
        visit_date='2026-07-22',
    )

    call_command('import_site_content', str(export_dir), skip_media=True)

    site.refresh_from_db()
    assert site.company_name == 'ИзДевы'
    assert Service.objects.filter(slug='montazh').exists()
    assert Lead.objects.count() == 1
    assert Lead.objects.get().name == 'ProdLead'
    assert SiteVisit.objects.count() == 1
