import logging
import random
import threading

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

LEAD_SUBMISSIONS_SESSION_KEY = 'lead_submissions'
# Сколько успешных заявок в сессии можно отправить без капчи обычному браузеру.
FREE_LEAD_SUBMISSIONS = 1

_BOT_UA_MARKERS = (
    'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'baiduspider',
    'facebookexternalhit', 'semrushbot', 'ahrefsbot', 'mj12bot',
    'python-requests', 'scrapy', 'httpclient', 'go-http-client',
    'headlesschrome', 'phantomjs', 'selenium',
)


def generate_captcha():
    a = random.randint(1, 15)
    b = random.randint(1, 15)
    return {
        'question': f'{a} + {b}',
        'answer': str(a + b),
    }


def verify_captcha(session, user_answer, captcha_id):
    stored_id = session.get('captcha_id')
    stored_answer = session.get('captcha_answer')
    if not stored_id or stored_id != captcha_id:
        return False
    if not stored_answer or str(user_answer).strip() != stored_answer:
        return False
    session.pop('captcha_id', None)
    session.pop('captcha_answer', None)
    return True


def is_suspicious_client(request) -> bool:
    """Явная автоматизация / пустой UA — капча сразу.

    Обычные браузеры не должны сюда попадать. Короткий UA вроде «Mozilla/5.0»
    сам по себе капчу не требует (иначе ломается приватный режим).
    """
    if request is None:
        return False
    ua = (request.META.get('HTTP_USER_AGENT') or '').strip()
    if not ua:
        return True
    low = ua.lower()
    if any(marker in low for marker in _BOT_UA_MARKERS):
        return True
    if low.startswith('curl/') or low.startswith('wget/'):
        return True
    return False


def captcha_required(session, request=None) -> bool:
    """Первая заявка обычного браузера — без капчи; со второй в сессии — с капчей."""
    if is_suspicious_client(request):
        return True
    submitted = int(session.get(LEAD_SUBMISSIONS_SESSION_KEY, 0) or 0)
    return submitted >= FREE_LEAD_SUBMISSIONS


def mark_lead_submitted(session):
    session[LEAD_SUBMISSIONS_SESSION_KEY] = session.get(LEAD_SUBMISSIONS_SESSION_KEY, 0) + 1
    session.modified = True


def send_telegram_notification(lead_id):
    from .models import Lead

    try:
        lead = Lead.objects.get(pk=lead_id)
    except Lead.DoesNotExist:
        logger.warning('Lead %s not found for Telegram notification', lead_id)
        return False

    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID
    if not token or not chat_id:
        logger.warning('Telegram credentials not configured, skipping notification')
        return False

    text = (
        f'🔔 <b>Новая заявка с сайта</b>\n\n'
        f'👤 <b>Имя:</b> {lead.name}\n'
        f'📞 <b>Телефон:</b> {lead.phone}\n'
        f'💬 <b>Сообщение:</b> {lead.message or "—"}\n'
    )
    details = lead.details_summary()
    if details:
        safe = details.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        text += f'📐 <b>Параметры:</b>\n{safe}\n'
    text += (
        f'📅 <b>Дата:</b> {lead.created_at.strftime("%d.%m.%Y %H:%M")}\n'
        f'📋 <b>Источник:</b> {lead.source or "сайт"}'
    )

    try:
        response = requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={
                'chat_id': chat_id,
                'text': text,
                'parse_mode': 'HTML',
            },
            timeout=5,
        )
        response.raise_for_status()
        return True
    except requests.RequestException as exc:
        logger.error('Failed to send Telegram notification: %s', exc)
        return False


def send_telegram_notification_async(lead_id):
    threading.Thread(
        target=send_telegram_notification,
        args=(lead_id,),
        daemon=True,
    ).start()
