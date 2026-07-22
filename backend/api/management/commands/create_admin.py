from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os
import secrets
import string


class Command(BaseCommand):
    help = 'Создаёт администратора'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin')
        parser.add_argument('--password', default='')
        parser.add_argument('--email', default='admin@vorota-pro.ru')
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Сбросить пароль, если пользователь уже существует',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        username = options['username']
        password = options['password']
        debug = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

        existing = User.objects.filter(username=username).first()
        if existing:
            if not options['reset']:
                self.stdout.write(self.style.WARNING(f'Пользователь {username} уже существует'))
                self.stdout.write('Для сброса пароля: python manage.py create_admin --reset --password новый_пароль')
                return
            if not password:
                if not debug:
                    self.stderr.write(self.style.ERROR(
                        'ADMIN_PASSWORD обязателен при DEBUG=False.'
                    ))
                    raise SystemExit(1)
                alphabet = string.ascii_letters + string.digits
                password = ''.join(secrets.choice(alphabet) for _ in range(16))
                self.stdout.write(self.style.WARNING(
                    f'Новый пароль для {username}:\n  {password}'
                ))
            existing.set_password(password)
            existing.is_staff = True
            existing.is_superuser = True
            existing.save(update_fields=['password', 'is_staff', 'is_superuser'])
            self.stdout.write(self.style.SUCCESS(f'Пароль администратора {username} обновлён'))
            return

        if not password:
            if not debug:
                self.stderr.write(self.style.ERROR(
                    'ADMIN_PASSWORD обязателен при DEBUG=False. '
                    'Задайте надёжный пароль в переменных окружения.'
                ))
                raise SystemExit(1)
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for _ in range(16))
            self.stdout.write(self.style.WARNING(
                f'ADMIN_PASSWORD не задан — сгенерирован одноразовый пароль для dev:\n'
                f'  Логин: {username}\n'
                f'  Пароль: {password}\n'
                f'Сохраните его — повторно не будет показан.'
            ))

        User.objects.create_superuser(
            username=username,
            email=options['email'],
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(f'Администратор {username} создан'))
