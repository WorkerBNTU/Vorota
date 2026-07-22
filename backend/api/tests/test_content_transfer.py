"""Round-trip content export/import preserves CRM leads."""

from pathlib import Path

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

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


@pytest.mark.django_db
def test_import_rejects_lead_in_fixture(tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path / 'media'
    Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
    SiteSettings.load()
    Lead.objects.create(name='Keep', phone='375291111111', privacy_consent=True)

    export_dir = tmp_path / 'export'
    call_command('export_site_content', str(export_dir))
    (export_dir / 'content.json').write_text(
        '[{"model": "api.lead", "pk": 1, "fields": {"name": "Hacked", "phone": "1",'
        '"message": "", "source": "x", "status": "new", "internal_notes": "",'
        '"privacy_consent": true}}]',
        encoding='utf-8',
    )

    with pytest.raises(CommandError, match='запрещённая модель'):
        call_command('import_site_content', str(export_dir), skip_media=True)

    assert Lead.objects.get().name == 'Keep'
