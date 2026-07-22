"""Telegram failures surface to Sentry when configured."""

from unittest.mock import MagicMock, patch

import pytest
import requests

from api.models import Lead
from api.services import send_telegram_notification


@pytest.mark.django_db
def test_telegram_failure_reported_to_sentry(settings):
    settings.TELEGRAM_BOT_TOKEN = 'token'
    settings.TELEGRAM_CHAT_ID = '123'
    lead = Lead.objects.create(
        name='Test',
        phone='+375291112233',
        message='hi',
        privacy_consent=True,
    )

    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = requests.HTTPError('boom')

    with (
        patch('api.services.requests.post', return_value=mock_response),
        patch('sentry_sdk.capture_exception') as capture,
        patch('sentry_sdk.push_scope') as push_scope,
    ):
        scope = MagicMock()
        push_scope.return_value.__enter__.return_value = scope
        push_scope.return_value.__exit__.return_value = False
        ok = send_telegram_notification(lead.id)

    assert ok is False
    capture.assert_called_once()
    scope.set_tag.assert_called_with('subsystem', 'telegram')
