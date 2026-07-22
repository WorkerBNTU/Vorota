# Generated manually for ContentPageImage.role

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_alter_sitesettings_map_embed_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='contentpageimage',
            name='role',
            field=models.CharField(
                blank=True,
                choices=[
                    ('avatar', 'Аватар отзыва'),
                    ('feed', 'Иллюстрация новости/акции'),
                    ('variant', 'Вариант товара (цвет, вид)'),
                    ('inline', 'В тексте страницы'),
                ],
                help_text='Определяет, где на странице показывается изображение (не generic-галерея).',
                max_length=20,
                verbose_name='Роль на странице',
            ),
        ),
    ]
