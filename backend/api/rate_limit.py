import logging
import time
from collections import defaultdict
from threading import Lock

from django.conf import settings

logger = logging.getLogger(__name__)


class MemoryRateLimitStore:
    def __init__(self):
        self._store = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        now = time.time()
        with self._lock:
            timestamps = self._store[key]
            timestamps[:] = [t for t in timestamps if now - t < window]
            if len(timestamps) >= limit:
                return False
            timestamps.append(now)
            return True


class RedisRateLimitStore:
    def __init__(self, url: str):
        import redis
        self.client = redis.from_url(url, decode_responses=True)

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        redis_key = f'ratelimit:{key}'
        pipe = self.client.pipeline()
        pipe.incr(redis_key)
        pipe.expire(redis_key, window, nx=True)
        count, _ = pipe.execute()
        return int(count) <= limit


class FallbackRateLimitStore:
    """Redis primary; при сбое Redis — in-memory (fail-open по доступности API)."""

    def __init__(self, primary, fallback: MemoryRateLimitStore):
        self.primary = primary
        self.fallback = fallback

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        try:
            return self.primary.is_allowed(key, limit, window)
        except Exception:
            logger.warning('Redis rate-limit unavailable, falling back to memory', exc_info=True)
            return self.fallback.is_allowed(key, limit, window)


_store = None


def get_rate_limit_store():
    global _store
    if _store is not None:
        return _store
    memory = MemoryRateLimitStore()
    redis_url = getattr(settings, 'REDIS_URL', '')
    if redis_url:
        try:
            _store = FallbackRateLimitStore(RedisRateLimitStore(redis_url), memory)
            return _store
        except Exception:
            logger.warning('Redis rate-limit init failed, using memory only', exc_info=True)
    _store = memory
    return _store
