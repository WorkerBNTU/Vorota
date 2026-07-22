# Generated manually

from decimal import Decimal

from django.db import migrations, models


# ул. Брестская, 2, Минск — офис по умолчанию
DEFAULT_LAT = Decimal('53.891684')
DEFAULT_LON = Decimal('27.548612')


def set_default_map_coords(apps, schema_editor):
    SiteSettings = apps.get_model('api', 'SiteSettings')
    SiteSettings.objects.filter(pk=1).update(
        map_latitude=DEFAULT_LAT,
        map_longitude=DEFAULT_LON,
    )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_contentpageimage_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='map_latitude',
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                help_text='Необязательно. Если указаны широта и долгота — на карте будет метка организации.',
                max_digits=9,
                null=True,
                verbose_name='Широта для метки на карте',
            ),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='map_longitude',
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                max_digits=9,
                null=True,
                verbose_name='Долгота для метки на карте',
            ),
        ),
        migrations.RunPython(set_default_map_coords, migrations.RunPython.noop),
    ]
