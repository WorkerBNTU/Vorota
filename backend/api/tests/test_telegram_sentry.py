"""Telegram failures surface to Sentry when configured (без утечки bot token)."""

from unittest.mock import MagicMock, patch

import pytest
import requests

from api.models import Lead
from api.services import send_telegram_notification


@pytest.mark.django_db
def test_telegram_failure_reported_to_sentry(settings):
    settings.TELEGRAM_BOT_TOKEN = 'secret-bot-token'
    settings.TELEGRAM_CHAT_ID = '123'
    lead = Lead.objects.create(
        name='Test',
        phone='+375291112233',
        message='hi',
        privacy_consent=True,
    )

    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = requests.HTTPError(
        'https://api.telegram.org/botsecret-bot-token/sendMessage failed'
    )

    with (
        patch('api.services.requests.post', return_value=mock_response),
        patch('sentry_sdk.capture_message') as capture,
        patch('sentry_sdk.push_scope') as push_scope,
    ):
        scope = MagicMock()
        push_scope.return_value.__enter__.return_value = scope
        push_scope.return_value.__exit__.return_value = False
        ok = send_telegram_notification(lead.id)

    assert ok is False
    capture.assert_called_once()
    msg = capture.call_args.args[0]
    assert 'secret-bot-token' not in msg
    assert '***' in msg
    scope.set_tag.assert_called_with('subsystem', 'telegram')
