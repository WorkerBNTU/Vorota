import time
from collections import defaultdict
from threading import Lock

from django.conf import settings


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


_store = None


def get_rate_limit_store():
    global _store
    if _store is not None:
        return _store
    redis_url = getattr(settings, 'REDIS_URL', '')
    if redis_url:
        try:
            _store = RedisRateLimitStore(redis_url)
            return _store
        except Exception:
            pass
    _store = MemoryRateLimitStore()
    return _store
