from decimal import Decimal

from django.db import migrations, models


DEFAULT_LAT = Decimal('53.864236')
DEFAULT_LON = Decimal('27.527497')
DEFAULT_ORG_ID = '54736687390'


def fix_map_coords(apps, schema_editor):
    SiteSettings = apps.get_model('api', 'SiteSettings')
    SiteSettings.objects.filter(pk=1).update(
        map_latitude=DEFAULT_LAT,
        map_longitude=DEFAULT_LON,
        map_yandex_org_id=DEFAULT_ORG_ID,
    )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_sitesettings_map_coordinates'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='map_yandex_org_id',
            field=models.CharField(
                blank=True,
                default='54736687390',
                help_text='Число из ссылки yandex.ru/maps/org/.../54736687390 — карта с карточкой организации.',
                max_length=20,
                verbose_name='ID организации в Яндекс.Картах',
            ),
        ),
        migrations.RunPython(fix_map_coords, migrations.RunPython.noop),
    ]
