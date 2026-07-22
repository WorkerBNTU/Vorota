from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
import os
import secrets
import string

from api.permissions import MANAGER_GROUP


class Command(BaseCommand):
    help = 'Создаёт менеджера CRM (заявки без доступа к контенту)'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='manager')
        parser.add_argument('--password', default='')
        parser.add_argument('--email', default='manager@vorota-rb.by')
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
        group, _ = Group.objects.get_or_create(name=MANAGER_GROUP)

        existing = User.objects.filter(username=username).first()
        if existing:
            if not options['reset']:
                self.stdout.write(self.style.WARNING(f'Пользователь {username} уже существует'))
                self.stdout.write(
                    'Для сброса пароля: python manage.py create_manager --reset --password новый_пароль'
                )
                return
            if not password:
                if not debug:
                    self.stderr.write(self.style.ERROR('Пароль обязателен при DEBUG=False.'))
                    raise SystemExit(1)
                alphabet = string.ascii_letters + string.digits
                password = ''.join(secrets.choice(alphabet) for _ in range(16))
                self.stdout.write(self.style.WARNING(f'Новый пароль для {username}:\n  {password}'))
            existing.set_password(password)
            existing.is_staff = True
            existing.is_superuser = False
            existing.save(update_fields=['password', 'is_staff', 'is_superuser'])
            existing.groups.add(group)
            self.stdout.write(self.style.SUCCESS(f'Менеджер {username} обновлён'))
            return

        if not password:
            if not debug:
                self.stderr.write(self.style.ERROR(
                    'Пароль обязателен при DEBUG=False. Задайте --password.'
                ))
                raise SystemExit(1)
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for _ in range(16))
            self.stdout.write(self.style.WARNING(
                f'Пароль не задан — сгенерирован для dev:\n'
                f'  Логин: {username}\n'
                f'  Пароль: {password}'
            ))

        user = User.objects.create_user(
            username=username,
            email=options['email'],
            password=password,
            is_staff=True,
            is_superuser=False,
        )
        user.groups.add(group)
        self.stdout.write(self.style.SUCCESS(f'Менеджер {username} создан (только CRM)'))
