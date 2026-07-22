"""seed_data не затирает уже заполненные SiteSettings."""

import pytest
from django.core.management import call_command

from api.models import SiteSettings


@pytest.mark.django_db
def test_seed_data_preserves_custom_settings():
    settings = SiteSettings.load()
    settings.company_name = 'КастомООО'
    settings.phone = '+375 (00) 000-00-00'
    settings.save()

    call_command('seed_data')

    settings.refresh_from_db()
    assert settings.company_name == 'КастомООО'
    assert settings.phone == '+375 (00) 000-00-00'


@pytest.mark.django_db
def test_seed_data_force_overwrites_settings():
    settings = SiteSettings.load()
    settings.company_name = 'КастомООО'
    settings.save(update_fields=['company_name'])

    call_command('seed_data', force_settings=True)

    settings.refresh_from_db()
    assert settings.company_name == 'ВоротаРБ'
