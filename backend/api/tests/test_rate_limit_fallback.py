"""Rate-limit store falls back to memory if Redis raises at runtime."""

from unittest.mock import MagicMock

from api.rate_limit import FallbackRateLimitStore, MemoryRateLimitStore


def test_fallback_uses_memory_when_redis_fails():
    primary = MagicMock()
    primary.is_allowed.side_effect = ConnectionError('redis down')
    store = FallbackRateLimitStore(primary, MemoryRateLimitStore())
    assert store.is_allowed('ip:1', limit=5, window=60) is True
    assert store.is_allowed('ip:1', limit=5, window=60) is True
    primary.is_allowed.assert_called()
