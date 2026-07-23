"""Rate-limit: memory fallback (dev) vs fail-closed (prod)."""

from unittest.mock import MagicMock

from api.rate_limit import FallbackRateLimitStore, MemoryRateLimitStore


def test_fallback_uses_memory_when_redis_fails_and_not_fail_closed():
    primary = MagicMock()
    primary.is_allowed.side_effect = ConnectionError('redis down')
    store = FallbackRateLimitStore(primary, MemoryRateLimitStore(), fail_closed=False)
    assert store.is_allowed('ip:1', limit=5, window=60) is True
    primary.is_allowed.assert_called()


def test_fail_closed_denies_when_redis_fails():
    primary = MagicMock()
    primary.is_allowed.side_effect = ConnectionError('redis down')
    store = FallbackRateLimitStore(primary, None, fail_closed=True)
    assert store.is_allowed('ip:1', limit=5, window=60) is False
