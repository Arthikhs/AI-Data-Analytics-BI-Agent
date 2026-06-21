import os
import json
import redis
import time
from typing import Dict, Any, List
from datetime import datetime
from contextlib import contextmanager
from functools import wraps

_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
METRICS_TTL = 86400 * 7  # 7 days
MAX_SAMPLES = 500


def record_metric(metric_type: str, value: float, labels: Dict[str, str] = None):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "value": round(value, 3),
        "labels": labels or {},
    }
    key = f"metrics:{metric_type}"
    pipe = _redis.pipeline()
    pipe.lpush(key, json.dumps(entry))
    pipe.ltrim(key, 0, MAX_SAMPLES - 1)
    pipe.expire(key, METRICS_TTL)
    pipe.execute()


def get_metrics(metric_type: str, limit: int = 100) -> List[Dict]:
    raw_list = _redis.lrange(f"metrics:{metric_type}", 0, limit - 1)
    return [json.loads(r) for r in raw_list]


def record_cache_event(hit: bool):
    key = "metrics:cache_hits" if hit else "metrics:cache_misses"
    _redis.incr(key)


def record_error(endpoint: str, error_type: str):
    record_metric("errors", 1, {"endpoint": endpoint, "error_type": error_type})
    _redis.incr("metrics:total_errors")


def get_platform_summary() -> Dict[str, Any]:
    def avg_metric(metric_type: str) -> float:
        samples = get_metrics(metric_type, limit=100)
        if not samples:
            return 0.0
        return round(sum(s["value"] for s in samples) / len(samples), 2)

    def p95_metric(metric_type: str) -> float:
        samples = sorted(get_metrics(metric_type, limit=100), key=lambda x: x["value"])
        if not samples:
            return 0.0
        idx = int(len(samples) * 0.95)
        return round(samples[min(idx, len(samples) - 1)]["value"], 2)

    hits = int(_redis.get("metrics:cache_hits") or 0)
    misses = int(_redis.get("metrics:cache_misses") or 0)
    total_cache = hits + misses
    cache_hit_ratio = round(hits / total_cache * 100, 2) if total_cache > 0 else 0

    return {
        "api_latency_avg_ms": avg_metric("api_latency"),
        "api_latency_p95_ms": p95_metric("api_latency"),
        "sql_latency_avg_ms": avg_metric("sql_latency"),
        "sql_latency_p95_ms": p95_metric("sql_latency"),
        "ai_latency_avg_ms": avg_metric("ai_latency"),
        "ai_latency_p95_ms": p95_metric("ai_latency"),
        "forecast_latency_avg_ms": avg_metric("forecast_latency"),
        "cache_hit_ratio_pct": cache_hit_ratio,
        "cache_hits": hits,
        "cache_misses": misses,
        "total_errors": int(_redis.get("metrics:total_errors") or 0),
        "recent_errors": get_metrics("errors", limit=20),
        "recent_api_calls": get_metrics("api_latency", limit=30),
    }


@contextmanager
def track_latency(metric_type: str, labels: Dict = None):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000
        record_metric(metric_type, elapsed_ms, labels or {})


def timed_endpoint(endpoint_name: str):
    """Decorator to auto-track API endpoint latency."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                elapsed = (time.perf_counter() - start) * 1000
                record_metric("api_latency", elapsed, {"endpoint": endpoint_name})
                return result
            except Exception as e:
                record_error(endpoint_name, type(e).__name__)
                raise
        return wrapper
    return decorator
